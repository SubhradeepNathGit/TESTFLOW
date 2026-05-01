const User = require("../models/User");
const Test = require("../models/Test");
const Question = require("../models/Question");
const ErrorResponse = require("../utils/errorResponse");
const { generatePassword } = require("../utils/passwordGenerator");
const { emitToInstitution } = require("../utils/socket");

/** Get current user's profile */
exports.getUserProfile = async (userId) => {
    const user = await User.findById(userId).populate("institutionId", "name");
    if (!user) throw new ErrorResponse("User not found", 404);
    return user;
};

/** Update user profile */
exports.updateUserProfile = async (userId, updateData) => {
    const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
    });
    if (!user) throw new ErrorResponse("User not found", 404);
    return user;
};

/** Update password */
exports.updatePassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId).select("+password");
    if (!user) throw new ErrorResponse("User not found", 404);
    if (!(await user.matchPassword(currentPassword))) {
        throw new ErrorResponse("Incorrect current password", 401);
    }
    user.password = newPassword;
    await user.save();
    return user;
};

/**
 * Get all students in an institution (for admin/instructor)
 */
exports.getStudents = async (institutionId, search = "") => {
    const query = { institutionId: institutionId?.toString(), role: "student" };
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { studentId: { $regex: search, $options: "i" } },
        ];
    }
    return await User.find(query)
        .populate("createdBy", "name email")
        .select("-password -refreshToken -otp -otpExpire")
        .sort({ createdAt: -1 });
};

/**
 * Add a student to the institution (Institution Admin only)
 * Auto-generates a password and sends credentials via email
 */
exports.createStudent = async (institutionId, adminId, { name, email }) => {
    const existing = await User.findOne({ email });
    if (existing) throw new ErrorResponse("Email already registered", 400);

    const password = generatePassword(); // e.g. Test@1234

    // Generate unique student ID: INST-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const studentId = `STU${dateStr}${suffix}`;

    const student = await User.create({
        name,
        email,
        password,
        role: "student",
        institutionId,
        studentId,
        isVerified: true, // Admin creates directly, no OTP needed
        isActive: true,
        isFirstLogin: true,
        createdBy: adminId,
    });

    emitToInstitution(institutionId, 'userCreated', student);

    return { student, password, studentId };
};

/**
 * Toggle student active/inactive
 */
exports.toggleStudentStatus = async (studentId, institutionId) => {
    const student = await User.findOne({ _id: studentId, institutionId, role: "student" });
    if (!student) throw new ErrorResponse("Student not found", 404);
    student.isActive = !student.isActive;
    await student.save();
    return student;
};

/**
 * Delete an inactive student
 */
exports.deleteStudent = async (studentId, institutionId) => {
    const student = await User.findOne({ _id: studentId, institutionId, role: "student" });
    if (!student) throw new ErrorResponse("Student not found", 404);
    if (student.isActive) throw new ErrorResponse("Cannot delete an active student. Deactivate first.", 400);
    await User.findByIdAndDelete(studentId);
    return { message: "Student removed successfully" };
};

/**
 * Get all instructors in an institution and their published tests/questions overview
 */
exports.getInstructorsOverview = async (institutionId, search = "") => {
    const query = { institutionId: institutionId?.toString(), role: "instructor" };
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
        ];
    }
    const instructors = await User.find(query)
        .select("-password -refreshToken -otp -otpExpire")
        .sort({ createdAt: -1 })
        .lean();

    // Aggregate stats
    for (let instr of instructors) {
        const tests = await Test.find({ createdBy: instr._id });
        const testIds = tests.map(t => t._id);
        const questionCount = await Question.countDocuments({ testId: { $in: testIds } });
        instr.testCount = tests.length;
        instr.questionCount = questionCount;
    }

    return instructors;
};

/**
 * Add an Instructor to the institution (Institution Admin only)
 * Auto-generates a password and sends credentials via email
 */
exports.createInstructor = async (institutionId, adminId, { name, email }) => {
    const existing = await User.findOne({ email });
    if (existing) throw new ErrorResponse("Email already registered", 400);

    const password = generatePassword(); 

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const instructorId = `INS${dateStr}${suffix}`;

    const instructor = await User.create({
        name,
        email,
        password,
        role: "instructor",
        institutionId,
        studentId: instructorId, // reusing studentId field as user identifier
        isVerified: true, 
        isActive: true,
        isFirstLogin: true,
        createdBy: adminId,
    });

    emitToInstitution(institutionId, 'userCreated', instructor);

    return { instructor, password, instructorId };
};

/**
 * Toggle instructor active/inactive
 */
exports.toggleInstructorStatus = async (instructorId, institutionId) => {
    const instructor = await User.findOne({ _id: instructorId, institutionId, role: "instructor" });
    if (!instructor) throw new ErrorResponse("Instructor not found", 404);
    instructor.isActive = !instructor.isActive;
    await instructor.save();
    return instructor;
};

/**
 * Delete an instructor
 */
exports.deleteInstructor = async (instructorId, institutionId) => {
    const instructor = await User.findOne({ _id: instructorId, institutionId, role: "instructor" });
    if (!instructor) throw new ErrorResponse("Instructor not found", 404);
    if (instructor.isActive) throw new ErrorResponse("Cannot delete an active instructor. Deactivate first.", 400);
    
    // Check if they have active dependencies? Allow delete but keep data? For simplicity, just delete user document.
    await User.findByIdAndDelete(instructorId);
    return { message: "Instructor removed successfully" };
};
