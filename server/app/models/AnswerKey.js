const mongoose = require("mongoose");

const AnswerKeySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Please add a title for the answer key"]
        },
        description: {
            type: String,
            default: ""
        },
        pdfUrl: {
            type: String,
            required: [true, "Please provide the PDF URL"]
        },
        institutionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
            required: true
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("AnswerKey", AnswerKeySchema);
