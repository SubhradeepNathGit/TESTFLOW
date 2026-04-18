const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
    {
        testId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Test",
            required: true,
        },
        questionText: {
            type: String,
            required: [true, "Please add question text"],
        },
        options: {
            type: [String],
            required: [true, "Please add options"],
            validate: [
                (val) => val.length >= 2,
                "A question must have at least 2 options",
            ],
        },
        correctAnswer: {
            type: String, // Can be the text of the option or index
            required: [true, "Please provide the correct answer"],
        },
        marks: {
            type: Number,
            default: 1,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Question", QuestionSchema);
