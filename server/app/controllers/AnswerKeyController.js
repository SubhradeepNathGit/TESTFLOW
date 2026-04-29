const path = require("path");
const fs = require("fs");
const AnswerKey = require("../models/AnswerKey");
const { statusCodes } = require("../helper/statusCode");
const ErrorResponse = require("../utils/errorResponse");

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
            const answerKeys = await AnswerKey.find({ institutionId: req.user.institutionId })
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
     * @desc Delete an answer key
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

            // Try deleting the physical file
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
                message: "Answer Key deleted successfully"
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new AnswerKeyController();
