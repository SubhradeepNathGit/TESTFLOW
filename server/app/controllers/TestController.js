const testService = require("../services/test.service");
const { statusCodes } = require("../helper/statusCode");
const ErrorResponse = require("../utils/errorResponse");
const { emitToInstitution } = require("../utils/socket");

class TestController {
    /**
     * @desc Create test via PDF upload
     * @route POST /api/tests/upload-pdf
     */
    async uploadPdfTest(req, res, next) {
        try {
            if (!req.file) {
                return next(new ErrorResponse("Please upload a PDF file", 400));
            }

            const testData = {
                title: req.body.title,
                description: req.body.description,
                duration: req.body.duration,
                institutionId: req.user.institutionId
            };

            const result = await testService.createTestFromPDF(testData, req.file.path, req.user.id);

            res.status(statusCodes.CREATED).json({
                status: true,
                success: true,
                message: "Test created and PDF parsed successfully",
                data: result
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * @desc Get all tests for current institution
     * @route GET /api/tests
     */
    async getTests(req, res, next) {
        try {
            const tests = await testService.getTestsByInstitution(req.user.institutionId, req.user.role);
            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                data: tests
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * @desc Get specific test with questions
     * @route GET /api/tests/:id
     */
    async getTest(req, res, next) {
        try {
            const data = await testService.getTestDetails(req.params.id, req.user.institutionId);
            
            // Security: Hide answers if the user is a student
            if (req.user.role === 'student') {
                data.questions = data.questions.map(q => {
                    const { correctAnswer, ...rest } = q.toObject ? q.toObject() : q;
                    return rest;
                });
            }

            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                data: data
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * @desc Publish a test
     * @route PATCH /api/tests/:id/publish
     */
    async publishTest(req, res, next) {
        try {
            const test = await testService.publishTest(req.params.id, req.user.institutionId);
            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                message: "Test published successfully",
                data: test
            });

            // Emit real-time update
            emitToInstitution(req.user.institutionId, "test:published", test);
        } catch (err) {
            next(err);
        }
    }

    /**
     * @desc Get test statistics (Instructor Only)
     * @route GET /api/tests/:id/stats
     */
    async getTestStats(req, res, next) {
        try {
            const stats = await testService.getTestStats(req.params.id, req.user.institutionId);
            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                data: stats
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * @desc Get global leaderboard
     * @route GET /api/tests/leaderboard
     */
    async getLeaderboard(req, res, next) {
        try {
            const leaderboard = await testService.getGlobalLeaderboard(req.user.institutionId);
            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                data: leaderboard
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * @desc Create test manually (metadata only)
     * @route POST /api/tests
     */
    async createTest(req, res, next) {
        try {
            const testData = {
                title: req.body.title,
                description: req.body.description,
                duration: req.body.duration,
                institutionId: req.user.institutionId
            };

            const test = await testService.createTest(testData, req.user.id);

            res.status(statusCodes.CREATED).json({
                status: true,
                success: true,
                message: "Test created successfully",
                data: test
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * @desc Add a question to a test
     * @route POST /api/tests/:id/questions
     */
    async addQuestion(req, res, next) {
        try {
            const questionData = {
                questionText: req.body.questionText,
                options: req.body.options,
                correctAnswer: req.body.correctAnswer,
                marks: req.body.marks || 1,
                explanation: req.body.explanation
            };

            const question = await testService.addQuestion(req.params.id, questionData);

            res.status(statusCodes.CREATED).json({
                status: true,
                success: true,
                message: "Question added successfully",
                data: question
            });
        } catch (err) {
            next(err);
        }
    }
    /**
     * @desc Archive a test (soft delete)
     * @route DELETE /api/tests/:id
     */
    
    async archiveTest(req, res, next) {
        try {
            await testService.archiveTest(req.params.id, req.user.institutionId);
            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                message: "Test moved to archive"
            });

            // Emit real-time update
            emitToInstitution(req.user.institutionId, "test:archived", { testId: req.params.id });
        } catch (err) { next(err); }
    }

    /**
     * @desc Get archived tests
     * @route GET /api/tests/archived
     */
    async getArchivedTests(req, res, next) {
        try {
            const tests = await testService.getArchivedTests(req.user.institutionId);
            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                data: tests
            });
        } catch (err) { next(err); }
    }

    /**
     * @desc Restore archived test
     * @route PATCH /api/tests/:id/restore
     */
    async restoreTest(req, res, next) {
        try {
            await testService.restoreTest(req.params.id, req.user.institutionId);
            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                message: "Test restored successfully"
            });
        } catch (err) { next(err); }
    }

    /**
     * @desc Permanently delete test
     * @route DELETE /api/tests/:id/permanent
     */
    async permanentDeleteTest(req, res, next) {
        try {
            await testService.permanentDeleteTest(req.params.id, req.user.institutionId);
            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                message: "Test permanently deleted"
            });
        } catch (err) { next(err); }
    }

    /**
     * @desc Update question
     * @route PATCH /api/tests/questions/:questionId
     */
    async updateQuestion(req, res, next) {
        try {
            const question = await testService.updateQuestion(req.params.questionId, req.body);
            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                message: "Question updated successfully",
                data: question
            });

            // Emit real-time update for marks/total changes
            emitToInstitution(req.user.institutionId, "test:updated", { 
                testId: question.testId,
                updates: req.body,
                updatedBy: req.user.id
            });
        } catch (err) { next(err); }
    }

    /**
     * @desc Delete question
     * @route DELETE /api/tests/questions/:questionId
     */
    async deleteQuestion(req, res, next) {
        try {
            await testService.deleteQuestion(req.params.questionId);
            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                message: "Question deleted successfully"
            });

            // Emit real-time update
            emitToInstitution(req.user.institutionId, "test:updated", { 
                testId: "REFRESH", // Simple trigger for full refresh 
                reason: "QUESTION_DELETED"
            });
        } catch (err) { next(err); }
    }
}

module.exports = new TestController();
