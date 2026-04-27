const express = require("express");
const {
    register,
    login,
    verifyEmail,
    resendOtp,
    logout,
    getMe,
    refreshToken,
    forgotPassword,
    resetPassword,
    updatePassword
} = require("../controllers/AuthController");

const { protect } = require("../middleware/auth");

const { 
    registerValidation, 
    loginValidation,
    emailValidation,
    resetPasswordValidation,
    updatePasswordValidation
} = require("../middleware/validators");

const router = express.Router();

router.post("/register", registerValidation, register);
router.post("/verify-email", emailValidation, verifyEmail);
router.post("/resend-otp", emailValidation, resendOtp);
router.post("/login", loginValidation, login);
router.get("/logout", protect, logout);
router.get("/me", protect, getMe);
router.post("/refresh", refreshToken);
router.post("/forgotpassword", emailValidation, forgotPassword);
router.put("/resetpassword/:resettoken", resetPasswordValidation, resetPassword);
router.put("/updatepassword", protect, updatePasswordValidation, updatePassword);

module.exports = router;
