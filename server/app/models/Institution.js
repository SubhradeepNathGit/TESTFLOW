const mongoose = require("mongoose");

const InstitutionSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please add an institution name"],
            trim: true,
            maxlength: [100, "Name cannot be more than 100 characters"],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isOnboarded: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Institution", InstitutionSchema);
