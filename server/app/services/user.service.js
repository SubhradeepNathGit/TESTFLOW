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
    const query = { institutionId: institutionId?.toString(), role: "student", isArchived: { $ne: true } };
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
/**
 * Delete an inactive student (Move to archive)
 */
exports.deleteStudent = async (studentId, institutionId) => {
    const student = await User.findOne({ _id: studentId, institutionId, role: "student" });
    if (!student) throw new ErrorResponse("Student not found", 404);
    if (student.isActive) throw new ErrorResponse("Cannot archive an active student. Deactivate first.", 400);
    
    student.isArchived = true;
    student.isActive = false;
    await student.save();
    
    return { message: "Student moved to archive successfully" };
};

/**
 * Get all archived students
 */
exports.getArchivedStudents = async (institutionId) => {
    return await User.find({ institutionId, role: "student", isArchived: true })
        .select("-password -refreshToken -otp -otpExpire")
        .sort({ updatedAt: -1 });
};

/**
 * Restore an archived student
 */
exports.restoreStudent = async (studentId, institutionId) => {
    const student = await User.findOne({ _id: studentId, institutionId, role: "student", isArchived: true });
    if (!student) throw new ErrorResponse("Archived student not found", 404);
    
    student.isArchived = false;
    student.isActive = true;
    await student.save();
    
    return { message: "Student restored successfully" };
};

/**
 * Permanently delete a student
 */
exports.permanentDeleteStudent = async (studentId, institutionId) => {
    const student = await User.findOne({ _id: studentId, institutionId, role: "student", isArchived: true });
    if (!student) throw new ErrorResponse("Archived student not found", 404);
    
    // Cleanup attempts
    await require("../models/Attempt").deleteMany({ studentId });
    await student.deleteOne();
    
    return { message: "Student and their data permanently removed" };
};

/**
 * Get all instructors in an institution and their published tests/questions overview
 */
exports.getInstructorsOverview = async (institutionId, search = "") => {
    const query = { institutionId: institutionId?.toString(), role: "instructor", isArchived: { $ne: true } };
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
    if (instructor.isActive) throw new ErrorResponse("Cannot archive an active instructor. Deactivate first.", 400);
    
    instructor.isArchived = true;
    instructor.isActive = false;
    await instructor.save();
    
    return { message: "Instructor moved to archive successfully" };
};

/**
 * Get all archived instructors
 */
exports.getArchivedInstructors = async (institutionId) => {
    return await User.find({ institutionId, role: "instructor", isArchived: true })
        .select("-password -refreshToken -otp -otpExpire")
        .sort({ updatedAt: -1 });
};

/**
 * Restore an archived instructor
 */
exports.restoreInstructor = async (instructorId, institutionId) => {
    const instructor = await User.findOne({ _id: instructorId, institutionId, role: "instructor", isArchived: true });
    if (!instructor) throw new ErrorResponse("Archived instructor not found", 404);
    
    instructor.isArchived = false;
    instructor.isActive = true;
    await instructor.save();
    
    return { message: "Instructor restored successfully" };
};

/**
 * Permanently delete an instructor
 */
exports.permanentDeleteInstructor = async (instructorId, institutionId) => {
    const instructor = await User.findOne({ _id: instructorId, institutionId, role: "instructor", isArchived: true });
    if (!instructor) throw new ErrorResponse("Archived instructor not found", 404);
    
    // Delete tests they created (or reassign? for now cascade delete)
    // await require("../models/Test").deleteMany({ createdBy: instructorId });
    await instructor.deleteOne();
    
    return { message: "Instructor permanently removed" };
};
