const Institution = require("../models/Institution");
const User = require("../models/User");
const Test = require("../models/Test");
const Attempt = require("../models/Attempt");
const { statusCodes } = require("../helper/statusCode");
const { emitToSuperAdmin } = require("../utils/socket");
const mongoose = require("mongoose");

class AdminController {
    /** 
     * @desc Get platform-wide metrics with trajectory data
     * @route GET /api/admin/metrics 
     */
    async getMetrics(req, res, next) {
        try {
            // Basic counts
            const [totalInstitutions, activeInstitutions, totalUsers, instructorCount, studentCount, totalTests, totalAttempts] = await Promise.all([
                Institution.countDocuments({ isArchived: { $ne: true } }),
                Institution.countDocuments({ isActive: true, isArchived: { $ne: true } }),
                User.countDocuments({ role: { $ne: "super_admin" }, isArchived: { $ne: true } }),
                User.countDocuments({ role: "instructor", isArchived: { $ne: true } }),
                User.countDocuments({ role: "student", isArchived: { $ne: true } }),
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
                    instructorCount,
                    studentCount,
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
            const { search } = req.query;
            const pipeline = [];

            pipeline.push({
                $match: {
                    isArchived: { $ne: true },
                    ...(search ? { name: { $regex: search, $options: "i" } } : {})
                }
            });

            pipeline.push(
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "institutionId",
                        as: "users"
                    }
                },
                {
                    $lookup: {
                        from: "tests",
                        localField: "_id",
                        foreignField: "institutionId",
                        as: "tests"
                    }
                },
                {
                    $project: {
                        name: 1,
                        isActive: 1,
                        createdAt: 1,
                        instructorCount: { $size: { $filter: { input: "$users", as: "u", cond: { $eq: ["$$u.role", "instructor"] } } } },
                        studentCount: { $size: { $filter: { input: "$users", as: "u", cond: { $eq: ["$$u.role", "student"] } } } },
                        testCount: { $size: "$tests" }
                    }
                },
                { $sort: { createdAt: -1 } }
            );

            const institutions = await Institution.aggregate(pipeline);

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
            const query = { role: role || "student", isArchived: { $ne: true } };

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
     * @desc Archive institution (Soft Delete)
     * @route DELETE /api/admin/institutions/:id 
     */
    async archiveInstitution(req, res, next) {
        try {
            const institution = await Institution.findById(req.params.id);
            if (!institution) {
                return res.status(statusCodes.NOT_FOUND).json({ status: false, message: "Institution not found" });
            }
            
            institution.isArchived = true;
            institution.isActive = false;
            await institution.save();

            // Also archive all users of this institution
            await User.updateMany({ institutionId: institution._id }, { isArchived: true, isActive: false });

            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                message: "Institution and its members moved to archive"
            });

            // Real-time update
            emitToSuperAdmin("admin:institution_archived", { institutionId: req.params.id });
        } catch (err) {
            next(err);
        }
    }

    /** 
     * @desc Archive a user globally (Soft Delete)
     * @route DELETE /api/admin/users/:id
     */
    async archiveUser(req, res, next) {
        try {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(statusCodes.NOT_FOUND).json({ status: false, message: "User not found" });
            }
            if (user.role === "super_admin") {
                return res.status(statusCodes.FORBIDDEN).json({ status: false, message: "Cannot archive Super Admin" });
            }

            user.isArchived = true;
            user.isActive = false;
            await user.save();

            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                message: "User moved to archive"
            });

            // Real-time update
            emitToSuperAdmin("admin:user_archived", { userId: req.params.id });
        } catch (err) {
            next(err);
        }
    }

    /** 
     * @desc Get comprehensive platform analytics
     * @route GET /api/admin/analytics 
     */
    async getComprehensiveAnalytics(req, res, next) {
        try {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
            sixMonthsAgo.setDate(1);
            sixMonthsAgo.setHours(0, 0, 0, 0);

            // 1. Platform Growth (Monthly registrations)
            const getGrowth = async (Model) => {
                return Model.aggregate([
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
            };

            const [institutionsGrowth, usersGrowth, testsGrowth, attemptsGrowth] = await Promise.all([
                getGrowth(Institution),
                getGrowth(User),
                getGrowth(Test),
                getGrowth(Attempt)
            ]);

            // Ensure we have a distinct set of all recent months
            const allMonths = [...new Set([
                ...institutionsGrowth.map(g => g._id),
                ...usersGrowth.map(g => g._id),
                ...testsGrowth.map(g => g._id),
                ...attemptsGrowth.map(g => g._id)
            ])];
            
            // To keep chronological order, we can sort by finding the original sortDate
            const monthSortMap = new Map();
            [...institutionsGrowth, ...usersGrowth, ...testsGrowth, ...attemptsGrowth].forEach(g => {
                if (!monthSortMap.has(g._id)) {
                    monthSortMap.set(g._id, g.sortDate);
                }
            });
            
            const sortedMonths = allMonths.sort((a, b) => monthSortMap.get(a) - monthSortMap.get(b));

            const platformGrowth = sortedMonths.map(month => ({
                month,
                institutions: institutionsGrowth.find(g => g._id === month)?.count || 0,
                users: usersGrowth.find(g => g._id === month)?.count || 0,
                tests: testsGrowth.find(g => g._id === month)?.count || 0,
                attempts: attemptsGrowth.find(g => g._id === month)?.count || 0,
            }));

            // 2. Score Distribution (Group by % buckets)
            const scoreDistributionRaw = await Attempt.aggregate([
                { $match: { status: { $in: ["SUBMITTED", "AUTO_SUBMITTED"] } } },
                {
                    $lookup: {
                        from: "tests",
                        localField: "testId",
                        foreignField: "_id",
                        as: "test"
                    }
                },
                { $unwind: "$test" },
                {
                    $project: {
                        percentage: {
                            $cond: [
                                { $gt: ["$test.totalMarks", 0] },
                                { $multiply: [{ $divide: ["$score", "$test.totalMarks"] }, 100] },
                                0
                            ]
                        }
                    }
                },
                {
                    $bucket: {
                        groupBy: "$percentage",
                        boundaries: [0, 20, 40, 60, 80, 101],
                        default: "Other",
                        output: { count: { $sum: 1 } }
                    }
                }
            ]);

            const scoreDistribution = scoreDistributionRaw.map(b => {
                let range = "";
                if (b._id === 0) range = "0-20%";
                else if (b._id === 20) range = "21-40%";
                else if (b._id === 40) range = "41-60%";
                else if (b._id === 60) range = "61-80%";
                else if (b._id === 80) range = "81-100%";
                else range = b._id;
                return { range, count: b.count };
            });

            // 3. Top Institutions
            const topInstitutions = await Attempt.aggregate([
                { $match: { status: { $in: ["SUBMITTED", "AUTO_SUBMITTED"] } } },
                {
                    $lookup: {
                        from: "tests",
                        localField: "testId",
                        foreignField: "_id",
                        as: "test"
                    }
                },
                { $unwind: "$test" },
                {
                    $group: {
                        _id: "$institutionId",
                        avgScore: {
                            $avg: {
                                $cond: [
                                    { $gt: ["$test.totalMarks", 0] },
                                    { $multiply: [{ $divide: ["$score", "$test.totalMarks"] }, 100] },
                                    0
                                ]
                            }
                        },
                        attemptsCount: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: "institutions",
                        localField: "_id",
                        foreignField: "_id",
                        as: "institution"
                    }
                },
                { $unwind: "$institution" },
                {
                    $project: {
                        name: "$institution.name",
                        avgScore: { $round: ["$avgScore", 1] },
                        attemptsCount: 1
                    }
                },
                { $sort: { avgScore: -1 } },
                { $limit: 5 }
            ]);

            // 4. Pass/Fail Ratio
            const passFailRaw = await Attempt.aggregate([
                { $match: { status: { $in: ["SUBMITTED", "AUTO_SUBMITTED"] } } },
                {
                    $lookup: {
                        from: "tests",
                        localField: "testId",
                        foreignField: "_id",
                        as: "test"
                    }
                },
                { $unwind: "$test" },
                {
                    $project: {
                        passed: {
                            $cond: [
                                { $gte: [{ $multiply: [{ $divide: ["$score", "$test.totalMarks"] }, 100] }, 50] },
                                "Pass",
                                "Fail"
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: "$passed",
                        count: { $sum: 1 }
                    }
                }
            ]);

            const passFailRatio = passFailRaw.map(p => ({
                name: p._id,
                value: p.count
            }));

            // 5. User Roles Distribution
            const roleDistributionRaw = await User.aggregate([
                {
                    $group: {
                        _id: "$role",
                        count: { $sum: 1 }
                    }
                }
            ]);

            const roleDistribution = roleDistributionRaw.map(r => ({
                name: r._id === 'super_admin' ? 'Super Admin' : r._id === 'owner' ? 'Inst. Admin' : r._id === 'instructor' ? 'Instructor' : 'Student',
                value: r.count
            }));

            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                data: {
                    platformGrowth,
                    scoreDistribution,
                    topInstitutions,
                    passFailRatio,
                    roleDistribution
                }
            });

        } catch (err) {
            next(err);
        }
    }

    /** 
     * @desc Get all archived items
     * @route GET /api/admin/archive
     */
    async getArchivedItems(req, res, next) {
        try {
            const [institutions, users] = await Promise.all([
                Institution.find({ isArchived: true }).sort({ updatedAt: -1 }),
                User.find({ isArchived: true }).populate("institutionId", "name").sort({ updatedAt: -1 })
            ]);

            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                data: { institutions, users }
            });
        } catch (err) {
            next(err);
        }
    }

    /** 
     * @desc Restore archived institution
     * @route PATCH /api/admin/archive/institutions/:id/restore
     */
    async restoreInstitution(req, res, next) {
        try {
            const institution = await Institution.findById(req.params.id);
            if (!institution) {
                return res.status(statusCodes.NOT_FOUND).json({ status: false, message: "Institution not found" });
            }
            institution.isArchived = false;
            institution.isActive = true;
            await institution.save();

            // Also restore all users of this institution who were archived with it
            await User.updateMany({ institutionId: institution._id, isArchived: true }, { isArchived: false, isActive: true });

            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                message: "Institution and its members restored successfully"
            });

            // Real-time update
            emitToSuperAdmin("admin:institution_restored", { institutionId: req.params.id });
        } catch (err) {
            next(err);
        }
    }

    /** 
     * @desc Restore archived user
     * @route PATCH /api/admin/archive/users/:id/restore
     */
    async restoreUser(req, res, next) {
        try {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(statusCodes.NOT_FOUND).json({ status: false, message: "User not found" });
            }
            user.isArchived = false;
            user.isActive = true;
            await user.save();
            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                message: "User restored successfully"
            });

            // Real-time update
            emitToSuperAdmin("admin:user_restored", { userId: req.params.id });
        } catch (err) {
            next(err);
        }
    }

    /** 
     * @desc Permanently delete institution
     * @route DELETE /api/admin/archive/institutions/:id
     */
    async permanentDeleteInstitution(req, res, next) {
        try {
            const institution = await Institution.findById(req.params.id);
            if (!institution) {
                return res.status(statusCodes.NOT_FOUND).json({ status: false, message: "Institution not found" });
            }
            // Cascading delete everything
            await Promise.all([
                User.deleteMany({ institutionId: institution._id }),
                Test.deleteMany({ institutionId: institution._id }),
                require("../models/Question").deleteMany({ institutionId: institution._id }),
                Attempt.deleteMany({ institutionId: institution._id }),
                institution.deleteOne()
            ]);
            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                message: "Institution and all associated data permanently deleted from database"
            });

            // Real-time update
            emitToSuperAdmin("admin:institution_deleted", { institutionId: req.params.id });
        } catch (err) {
            next(err);
        }
    }

    /** 
     * @desc Permanently delete user
     * @route DELETE /api/admin/archive/users/:id
     */
    async permanentDeleteUser(req, res, next) {
        try {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(statusCodes.NOT_FOUND).json({ status: false, message: "User not found" });
            }
            if (user.role === "super_admin") {
                return res.status(statusCodes.FORBIDDEN).json({ status: false, message: "Action forbidden" });
            }
            await Attempt.deleteMany({ studentId: user._id });
            await user.deleteOne();
            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                message: "User permanently removed from database"
            });

            // Real-time update
            emitToSuperAdmin("admin:user_deleted", { userId: req.params.id });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new AdminController();
