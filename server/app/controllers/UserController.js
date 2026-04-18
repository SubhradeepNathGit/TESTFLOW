const userService = require("../services/user.service");
const sendEmail = require("../utils/sendEmail");
const { statusCodes } = require("../helper/statusCode");

class UserController {
    /** GET /api/users/profile */
    async getProfile(req, res, next) {
        try {
            const user = await userService.getUserProfile(req.user.id);
            res.status(statusCodes.OK).json({ status: true, success: true, data: user });
        } catch (err) { next(err); }
    }

    /** PUT /api/users/profile */
    async updateProfile(req, res, next) {
        try {
            const fields = { name: req.body.name, email: req.body.email };
            if (req.file) fields.profileImage = req.file.path;
            const user = await userService.updateUserProfile(req.user.id, fields);
            res.status(statusCodes.OK).json({ status: true, success: true, data: user });
        } catch (err) { next(err); }
    }

    /** PUT /api/users/update-password */
    async updatePassword(req, res, next) {
        try {
            await userService.updatePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
            res.status(statusCodes.OK).json({ status: true, success: true, message: "Password updated successfully" });
        } catch (err) { next(err); }
    }

    /** GET /api/users/students - Institution Admin / Instructor */
    async getStudents(req, res, next) {
        try {
            const students = await userService.getStudents(req.user.institutionId, req.query.search);
            res.status(statusCodes.OK).json({ status: true, success: true, data: students });
        } catch (err) { next(err); }
    }

    /** POST /api/users/students - Institution Admin adds a student */
    async createStudent(req, res, next) {
        try {
            const { student, password, studentId } = await userService.createStudent(
                req.user.institutionId,
                req.user.id,
                req.body
            );

            // Send welcome email with credentials
            const html = `
                <div style="font-family:'Inter',sans-serif;max-width:600px;margin:40px auto;padding:40px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;">
                    <h1 style="font-size:22px;font-weight:800;color:#000;text-transform:uppercase;margin-bottom:32px;">TESTFLOW</h1>
                    <p style="font-size:16px;font-weight:500;">Hi ${student.name},</p>
                    <p style="font-size:14px;color:#4a5568;line-height:1.7;">
                        You have been enrolled as a student on <strong>TESTFLOW</strong>. Here are your login credentials:
                    </p>
                    <div style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:24px;margin:24px 0;">
                        <p style="margin:8px 0;font-size:14px;"><strong>Email:</strong> ${student.email}</p>
                        <p style="margin:8px 0;font-size:14px;"><strong>Temporary Password:</strong> <code style="background:#e2e8f0;padding:2px 8px;border-radius:4px;">${password}</code></p>
                        <p style="margin:8px 0;font-size:14px;"><strong>Student ID:</strong> <code style="background:#e2e8f0;padding:2px 8px;border-radius:4px;">${studentId}</code></p>
                    </div>
                    <p style="font-size:13px;color:#718096;">Please change your password after your first login for security.</p>
                    <div style="border-top:1px solid #edf2f7;margin-top:32px;padding-top:24px;">
                        <p style="font-size:12px;color:#a0aec0;">&copy; ${new Date().getFullYear()} TESTFLOW. All rights reserved.</p>
                    </div>
                </div>
            `;
            await sendEmail({ email: student.email, subject: "Welcome to TESTFLOW — Your Login Credentials", html }).catch(console.error);

            res.status(statusCodes.CREATED).json({
                status: true, success: true,
                message: `Student added! Credentials sent to ${student.email}`,
                data: { name: student.name, email: student.email, studentId }
            });
        } catch (err) { next(err); }
    }

    /** PATCH /api/users/students/:id/toggle */
    async toggleStudentStatus(req, res, next) {
        try {
            const student = await userService.toggleStudentStatus(req.params.id, req.user.institutionId);
            res.status(statusCodes.OK).json({ status: true, success: true, message: `Student ${student.isActive ? 'activated' : 'deactivated'}`, data: student });
        } catch (err) { next(err); }
    }

    /** DELETE /api/users/students/:id */
    async deleteStudent(req, res, next) {
        try {
            const result = await userService.deleteStudent(req.params.id, req.user.institutionId);
            res.status(statusCodes.OK).json({ status: true, success: true, message: result.message });
        } catch (err) { next(err); }
    }

    /** GET /api/users/instructors - Institution Admin */
    async getInstructors(req, res, next) {
        try {
            const instructors = await userService.getInstructorsOverview(req.user.institutionId, req.query.search);
            res.status(statusCodes.OK).json({ status: true, success: true, data: instructors });
        } catch (err) { next(err); }
    }

    /** POST /api/users/instructors - Institution Admin adds an instructor */
    async createInstructor(req, res, next) {
        try {
            const { instructor, password, instructorId } = await userService.createInstructor(
                req.user.institutionId,
                req.user.id,
                req.body
            );

            const html = `
                <div style="font-family:'Inter',sans-serif;max-width:600px;margin:40px auto;padding:40px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;">
                    <h1 style="font-size:22px;font-weight:800;color:#000;text-transform:uppercase;margin-bottom:32px;">TESTFLOW</h1>
                    <p style="font-size:16px;font-weight:500;">Hi ${instructor.name},</p>
                    <p style="font-size:14px;color:#4a5568;line-height:1.7;">
                        You have been added as an Instructor on <strong>TESTFLOW</strong>. Here are your login credentials:
                    </p>
                    <div style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:24px;margin:24px 0;">
                        <p style="margin:8px 0;font-size:14px;"><strong>Email:</strong> ${instructor.email}</p>
                        <p style="margin:8px 0;font-size:14px;"><strong>Temporary Password:</strong> <code style="background:#e2e8f0;padding:2px 8px;border-radius:4px;">${password}</code></p>
                        <p style="margin:8px 0;font-size:14px;"><strong>Instructor ID:</strong> <code style="background:#e2e8f0;padding:2px 8px;border-radius:4px;">${instructorId}</code></p>
                    </div>
                    <p style="font-size:13px;color:#718096;">Please change your password after your first login for security.</p>
                    <div style="border-top:1px solid #edf2f7;margin-top:32px;padding-top:24px;">
                        <p style="font-size:12px;color:#a0aec0;">&copy; ${new Date().getFullYear()} TESTFLOW. All rights reserved.</p>
                    </div>
                </div>
            `;
            await sendEmail({ email: instructor.email, subject: "Welcome to TESTFLOW — Instructor Credentials", html }).catch(console.error);

            res.status(statusCodes.CREATED).json({
                status: true, success: true,
                message: `Instructor added! Credentials sent to ${instructor.email}`,
                data: { name: instructor.name, email: instructor.email, instructorId }
            });
        } catch (err) { next(err); }
    }

    /** PATCH /api/users/instructors/:id/toggle */
    async toggleInstructorStatus(req, res, next) {
        try {
            const instructor = await userService.toggleInstructorStatus(req.params.id, req.user.institutionId);
            res.status(statusCodes.OK).json({ status: true, success: true, message: `Instructor ${instructor.isActive ? 'activated' : 'deactivated'}`, data: instructor });
        } catch (err) { next(err); }
    }

    /** DELETE /api/users/instructors/:id */
    async deleteInstructor(req, res, next) {
        try {
            const result = await userService.deleteInstructor(req.params.id, req.user.institutionId);
            res.status(statusCodes.OK).json({ status: true, success: true, message: result.message });
        } catch (err) { next(err); }
    }
}

module.exports = new UserController();
