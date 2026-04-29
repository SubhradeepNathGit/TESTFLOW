const { body, validationResult } = require("express-validator");
const ErrorResponse = require("../utils/errorResponse");

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array().map((err) => err.msg).join(", ");
        return next(new ErrorResponse(message, 400));
    }
    next();
};

exports.registerValidation = [
    body("name")
        .isString().withMessage("Name must be a string")
        .trim()
        .notEmpty().withMessage("Full name is required")
        .isLength({ max: 100 }).withMessage("Name cannot exceed 100 characters")
        .escape(),
    body("institutionName")
        .isString().withMessage("Institution name must be a string")
        .trim()
        .notEmpty().withMessage("Institution name is required")
        .isLength({ max: 200 }).withMessage("Institution name cannot exceed 200 characters")
        .escape(),
    body("role")
        .isString().withMessage("Role must be a string")
        .trim()
        .notEmpty().withMessage("Role is required")
        .isIn(["owner", "instructor"]).withMessage("Invalid role selected"),
    body("email")
        .isString().withMessage("Email must be a string")
        .trim()
        .isEmail().withMessage("Please provide a valid email")
        .normalizeEmail({ gmail_remove_dots: false }),
    body("password")
        .isString().withMessage("Password must be a string")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 6, max: 128 }).withMessage("Password must be between 6 and 128 characters long"),
    validate,
];

exports.loginValidation = [
    body("email")
        .isString().withMessage("Email must be a string")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Please provide a valid email")
        .normalizeEmail({ gmail_remove_dots: false }),
    body("password")
        .isString().withMessage("Password must be a string")
        .notEmpty().withMessage("Password is required")
        .isLength({ max: 128 }).withMessage("Password exceeds maximum allowed length"),
    validate,
];

exports.emailValidation = [
    body("email")
        .isString().withMessage("Email must be a string")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Please provide a valid email")
        .normalizeEmail({ gmail_remove_dots: false }),
    validate,
];

exports.resetPasswordValidation = [
    body("password")
        .isString().withMessage("Password must be a string")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 6, max: 128 }).withMessage("Password must be between 6 and 128 characters long"),
    validate,
];

exports.updatePasswordValidation = [
    body("currentPassword")
        .isString().withMessage("Current password must be a string")
        .notEmpty().withMessage("Current password is required")
        .isLength({ max: 128 }).withMessage("Current password exceeds maximum allowed length"),
    body("newPassword")
        .isString().withMessage("New password must be a string")
        .notEmpty().withMessage("New password is required")
        .isLength({ min: 6, max: 128 }).withMessage("New password must be between 6 and 128 characters long"),
    validate,
];
