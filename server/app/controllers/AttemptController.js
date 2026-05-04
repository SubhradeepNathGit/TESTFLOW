const attemptService = require("../services/attempt.service");
const { statusCodes } = require("../helper/statusCode");
const { emitToInstitution } = require("../utils/socket");

class AttemptController {
    // Start test attempt
    async startAttempt(req, res, next) {
        try {
            const result = await attemptService.startAttempt(
                req.body.testId,
                req.user.id,
                req.user.institutionId
            );
            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                data: result
            });

            // Emit live update
            emitToInstitution(req.user.institutionId, "test:attempt_started", { 
                testId: req.body.testId,
                studentId: req.user.id,
                studentName: req.user.name 
            });
        } catch (err) {
            next(err);
        }
    }

    // Save answer
    async saveAnswer(req, res, next) {
        try {
            const { attemptId, questionId, selectedOption } = req.body;
            const result = await attemptService.saveAnswer(
                attemptId,
                req.user.id,
                questionId,
                selectedOption
            );
            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                data: result
            });
        } catch (err) {
            next(err);
        }
    }

    // Submit test
    async submitAttempt(req, res, next) {
        try {
            const result = await attemptService.submitAttempt(
                req.body.attemptId,
                req.user.id
            );
            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                message: "Test submitted successfully",
                data: result
            });

            // Emit live updates
            emitToInstitution(req.user.institutionId, "test:attempt_submitted", { 
                testId: result.testId,
                attemptId: result._id,
                studentId: req.user.id,
                score: result.score 
            });
            emitToInstitution(req.user.institutionId, "leaderboard:update");
        } catch (err) {
            next(err);
        }
    }

    // Reset attempt
    async resetAttempt(req, res, next) {
        try {
            const result = await attemptService.resetAttempt(
                req.params.id,
                req.user.id
            );
            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                message: result.message
            });

            emitToInstitution(req.user.institutionId, "test:attempt_reset", { attemptId: req.params.id });
        } catch (err) {
            next(err);
        }
    }

    // Get my attempts
    async getMyAttempts(req, res, next) {
        try {
            const Attempt = require("../models/Attempt");
            const attempts = await Attempt.find({ studentId: req.user.id })
                .populate({
                    path: "testId",
                    select: "title duration totalMarks status isDeleted",
                    match: { isDeleted: false } // Only populate non-archived tests
                })
                .sort({ createdAt: -1 });

            // Filter out attempts where the test was archived/deleted (populate returns null)
            const validAttempts = attempts.filter(a => a.testId !== null);

            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                data: validAttempts
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new AttemptController();
