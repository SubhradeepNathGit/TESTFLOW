const mongoose = require("mongoose");

const TestSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Please add a test title"],
            trim: true,
            maxlength: [200, "Title cannot be more than 200 characters"],
        },
        description: {
            type: String,
            maxlength: [1000, "Description cannot be more than 1000 characters"],
        },
        institutionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
            required: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        duration: {
            type: Number,
            required: [true, "Please set test duration in minutes"],
        },
        totalMarks: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["Draft", "Published"],
            default: "Draft",
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Test", TestSchema);
