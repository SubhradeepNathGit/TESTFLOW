const Institution = require("../models/Institution");
const User = require("../models/User");
const Test = require("../models/Test");
const Attempt = require("../models/Attempt");
const { statusCodes } = require("../helper/statusCode");
const mongoose = require("mongoose");

class AdminController {
    /** 
     * @desc Get platform-wide metrics with trajectory data
     * @route GET /api/admin/metrics 
     */
    async getMetrics(req, res, next) {
        try {
            // Basic counts
            const [totalInstitutions, activeInstitutions, totalUsers, totalTests, totalAttempts] = await Promise.all([
                Institution.countDocuments(),
                Institution.countDocuments({ isActive: true }),
                User.countDocuments({ role: { $ne: "super_admin" } }),
                Test.countDocuments(),
                Attempt.countDocuments()
            ]);

            // Platform Trajectory (Last 6 months growth)
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
            sixMonthsAgo.setDate(1);
            sixMonthsAgo.setHours(0, 0, 0, 0);

            const trajectory = await Institution.aggregate([
                { $match: { createdAt: { $gte: sixMonthsAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%b", date: "$createdAt" } },
                        count: { $sum: 1 },
                        sortDate: { $first: "$createdAt" }
                    }
                },
                { $sort: { sortDate: 1 } }
            ]);

            const testTrajectory = await Test.aggregate([
                { $match: { createdAt: { $gte: sixMonthsAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%b", date: "$createdAt" } },
                        count: { $sum: 1 },
                        sortDate: { $first: "$createdAt" }
                    }
                },
                { $sort: { sortDate: 1 } }
            ]);

            // Engagement details
            const totalQuestions = await require("../models/Question").countDocuments();
            const avgScore = await Attempt.aggregate([
                { $match: { status: { $in: ["SUBMITTED", "AUTO_SUBMITTED"] } } },
                { $group: { _id: null, avg: { $avg: "$score" } } }
            ]);

            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                data: {
                    totalInstitutions,
                    activeInstitutions,
                    totalUsers,
                    totalTests,
                    totalAttempts,
                    totalQuestions,
                    avgPlatformScore: avgScore[0]?.avg?.toFixed(1) || 0,
                    trajectory,
                    testTrajectory
                }
            });
        } catch (err) {
            next(err);
        }
    }

    /** 
     * @desc Get all institutions
     * @route GET /api/admin/institutions 
     */
    async getInstitutions(req, res, next) {
        try {
            const institutions = await Institution.aggregate([
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "institutionId",
                        as: "users"
                    }
                },
                {
                    $project: {
                        name: 1,
                        isActive: 1,
                        createdAt: 1,
                        instructorCount: { $size: { $filter: { input: "$users", as: "u", cond: { $eq: ["$$u.role", "instructor"] } } } },
                        studentCount: { $size: { $filter: { input: "$users", as: "u", cond: { $eq: ["$$u.role", "student"] } } } }
                    }
                },
                { $sort: { createdAt: -1 } }
            ]);

            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                data: institutions
            });
        } catch (err) {
            next(err);
        }
    }

    /** 
     * @desc Get global users by role
     * @route GET /api/admin/users
     */
    async getGlobalUsers(req, res, next) {
        try {
            const { role, search } = req.query;
            const query = { role: role || "student" };

            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                    { studentId: { $regex: search, $options: "i" } }
                ];
            }

            const users = await User.find(query)
                .populate("institutionId", "name")
                .sort({ createdAt: -1 })
                .limit(100);

            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                data: users
            });
        } catch (err) {
            next(err);
        }
    }

    /** 
     * @desc Toggle institution status
     * @route PATCH /api/admin/institutions/:id/toggle 
     */
    async toggleInstitutionStatus(req, res, next) {
        try {
            const institution = await Institution.findById(req.params.id);
            if (!institution) {
                return res.status(statusCodes.NOT_FOUND).json({ status: false, message: "Institution not found" });
            }
            institution.isActive = !institution.isActive;
            await institution.save();
            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                message: `Institution ${institution.isActive ? 'activated' : 'suspended'}`
            });
        } catch (err) {
            next(err);
        }
    }

    /** 
     * @desc Toggle user account status
     * @route PATCH /api/admin/users/:id/toggle
     */
    async toggleUserStatus(req, res, next) {
        try {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(statusCodes.NOT_FOUND).json({ status: false, message: "User not found" });
            }
            if (user.role === "super_admin") {
                return res.status(statusCodes.FORBIDDEN).json({ status: false, message: "Cannot suspend Super Admin" });
            }
            user.isActive = !user.isActive;
            await user.save();
            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                message: `User ${user.isActive ? 'activated' : 'suspended'}`
            });
        } catch (err) {
            next(err);
        }
    }

    /** 
     * @desc Delete institution and all its data
     * @route DELETE /api/admin/institutions/:id 
     */
    async deleteInstitution(req, res, next) {
        try {
            const institution = await Institution.findById(req.params.id);
            if (!institution) {
                return res.status(statusCodes.NOT_FOUND).json({ status: false, message: "Institution not found" });
            }
            // Cascading delete
            await Promise.all([
                User.deleteMany({ institutionId: institution._id }),
                Test.deleteMany({ institutionId: institution._id }),
                require("../models/Question").deleteMany({ institutionId: institution._id }),
                Attempt.deleteMany({ institutionId: institution._id }),
                Institution.findByIdAndDelete(institution._id)
            ]);
            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                message: "Institution and all associated data permanently deleted"
            });
        } catch (err) {
            next(err);
        }
    }

    /** 
     * @desc Delete a user globally
     * @route DELETE /api/admin/users/:id
     */
    async deleteUser(req, res, next) {
        try {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(statusCodes.NOT_FOUND).json({ status: false, message: "User not found" });
            }
            if (user.role === "super_admin") {
                return res.status(statusCodes.FORBIDDEN).json({ status: false, message: "Cannot delete Super Admin" });
            }

            // If instructor, also clean up their tests if needed (or reassign)
            // For now, simple delete
            await Attempt.deleteMany({ studentId: user._id });
            await user.deleteOne();

            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                message: "User permanently deleted from platform"
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new AdminController();
