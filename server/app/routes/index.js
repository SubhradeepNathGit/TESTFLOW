const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const testRoutes = require("./test.routes");
const attemptRoutes = require("./attempt.routes");
const adminRoutes = require("./admin.routes");

// health check
router.get("/", (req, res) => {
    res.json({
        status: true,
        message: "TESTFLOW APIs are running successfully",
    });
});

router.use("/api/auth", authRoutes);
router.use("/api/users", userRoutes);
router.use("/api/answer-keys", require("./answerKey.routes"));
router.use("/api/tests", testRoutes);
router.use("/api/attempts", attemptRoutes);
router.use("/api/admin", adminRoutes);

module.exports = router;
