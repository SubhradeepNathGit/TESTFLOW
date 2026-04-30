const path = require("path");
const fs = require("fs");
const AnswerKey = require("../models/AnswerKey");
const { statusCodes } = require("../helper/statusCode");
const ErrorResponse = require("../utils/errorResponse");
const { emitToInstitution } = require("../utils/socket");

class AnswerKeyController {
    /**
     * @desc Upload a new answer key PDF
     * @route POST /api/answer-keys
     */
    async uploadAnswerKey(req, res, next) {
        try {
            if (!req.file) {
                return next(new ErrorResponse("Please upload a PDF file", 400));
            }

            const { title, description } = req.body;

            if (!title) {
                // remove immediately if validation failed
                fs.unlinkSync(req.file.path);
                return next(new ErrorResponse("Title is required", 400));
            }

            // Path starts with "uploads/pdfs/" since we use the middleware
            // but we normalize it so it can be served via static folder
            // ensure the path has forward slashes
            const filePath = req.file.path.replace(/\\/g, '/');

            const answerKey = await AnswerKey.create({
                title,
                description,
                pdfUrl: filePath,
                institutionId: req.user.institutionId,
                uploadedBy: req.user.id
            });

            res.status(statusCodes.CREATED).json({
                status: true,
                success: true,
                message: "Answer Key uploaded successfully",
                data: answerKey
            });

            // Emit real-time update
            emitToInstitution(req.user.institutionId, "answerKey:updated", answerKey);
        } catch (err) {
            next(err);
        }
    }

    /**
     * @desc Get all answer keys for the institution
     * @route GET /api/answer-keys
     */
    async getAnswerKeys(req, res, next) {
        try {
            const answerKeys = await AnswerKey.find({ 
                institutionId: req.user.institutionId,
                isDeleted: { $ne: true }
            })
                .populate("uploadedBy", "name")
                .sort({ createdAt: -1 });

            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                data: answerKeys
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * @desc Archive an answer key (soft delete)
     * @route DELETE /api/answer-keys/:id
     */
    async deleteAnswerKey(req, res, next) {
        try {
            const answerKey = await AnswerKey.findOne({
                _id: req.params.id,
                institutionId: req.user.institutionId
            });

            if (!answerKey) {
                return next(new ErrorResponse("Answer Key not found", 404));
            }

            answerKey.isDeleted = true;
            await answerKey.save();

            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                message: "Answer Key moved to archive"
            });

            // Emit real-time update
            emitToInstitution(req.user.institutionId, "answerKey:archived", { id: req.params.id });
        } catch (err) {
            next(err);
        }
    }

    /**
     * @desc Get archived answer keys
     * @route GET /api/answer-keys/archived
     */
    async getArchivedAnswerKeys(req, res, next) {
        try {
            const answerKeys = await AnswerKey.find({
                institutionId: req.user.institutionId,
                isDeleted: true
            })
                .populate("uploadedBy", "name")
                .sort({ updatedAt: -1 });

            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                data: answerKeys
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * @desc Restore archived answer key
     * @route PATCH /api/answer-keys/:id/restore
     */
    async restoreAnswerKey(req, res, next) {
        try {
            const answerKey = await AnswerKey.findOne({
                _id: req.params.id,
                institutionId: req.user.institutionId,
                isDeleted: true
            });

            if (!answerKey) {
                return next(new ErrorResponse("Archived Answer Key not found", 404));
            }

            answerKey.isDeleted = false;
            await answerKey.save();

            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                message: "Answer Key restored successfully"
            });

            // Emit real-time update
            emitToInstitution(req.user.institutionId, "answerKey:restored", answerKey);
        } catch (err) {
            next(err);
        }
    }

    /**
     * @desc Permanently delete an answer key
     * @route DELETE /api/answer-keys/:id/permanent
     */
    async permanentDeleteAnswerKey(req, res, next) {
        try {
            const answerKey = await AnswerKey.findOne({
                _id: req.params.id,
                institutionId: req.user.institutionId,
                isDeleted: true
            });

            if (!answerKey) {
                return next(new ErrorResponse("Answer Key not found in archive", 404));
            }

            // Delete the physical file
            try {
                const filePath = path.join(__dirname, "..", "..", "..", answerKey.pdfUrl);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (fsErr) {
                console.error("Error deleting physical PDF file:", fsErr);
            }

            await answerKey.deleteOne();

            res.status(statusCodes.OK).json({
                status: true,
                success: true,
                message: "Answer Key permanently deleted"
            });

            // Emit real-time update
            emitToInstitution(req.user.institutionId, "answerKey:deleted", { id: req.params.id });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new AnswerKeyController();
