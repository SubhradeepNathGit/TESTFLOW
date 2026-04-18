const express = require("express");
const {
    startAttempt,
    saveAnswer,
    submitAttempt,
    resetAttempt,
    getMyAttempts
} = require("../controllers/AttemptController");

const { protect } = require("../middleware/auth");
const { checkPermission } = require("../middleware/rbac");

const router = express.Router();
router.use(protect);

// Student routes
router.get("/me", getMyAttempts);
router.post("/start", checkPermission("take_test"), startAttempt);
router.post("/save-answer", checkPermission("take_test"), saveAnswer);
router.post("/submit", checkPermission("take_test"), submitAttempt);

// Instructor / Admin route
router.delete("/:id/reset", checkPermission("reset_attempt"), resetAttempt);

module.exports = router;
