const mongoose = require("mongoose");

const AttemptSchema = new mongoose.Schema(
    {
        testId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Test",
            required: true,
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        institutionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
            required: true,
        },
        startedAt: {
            type: Date,
            default: Date.now,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        submittedAt: {
            type: Date,
        },
        answers: [
            {
                questionId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Question",
                },
                selectedOption: String,
            },
        ],
        score: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ["IN_PROGRESS", "SUBMITTED", "AUTO_SUBMITTED"],
            default: "IN_PROGRESS",
        },
    },
    { timestamps: true }
);

// Index for quick lookup of student attempts
AttemptSchema.index({ studentId: 1, testId: 1 });

module.exports = mongoose.model("Attempt", AttemptSchema);
