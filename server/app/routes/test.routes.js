const express = require("express");
const {
    getTests,
    getTest,
    uploadPdfTest,
    createTest,
    addQuestion,
    publishTest,
    getTestStats,
    getLeaderboard,
    archiveTest,
    getArchivedTests,
    restoreTest,
    permanentDeleteTest,
    updateQuestion,
    deleteQuestion
} = require("../controllers/TestController");

const { protect } = require("../middleware/auth");
const { checkPermission } = require("../middleware/rbac");
const uploadPdf = require("../middleware/pdfUpload");

const router = express.Router();

router.get("/", protect, checkPermission("read_test"), getTests);
router.get("/leaderboard", protect, getLeaderboard);
router.get("/:id", protect, checkPermission("read_test"), getTest);

router.post("/upload-pdf", protect, checkPermission("create_test"), uploadPdf.single("pdfFile"), uploadPdfTest);
router.post("/", protect, checkPermission("create_test"), createTest);
router.post("/:id/questions", protect, checkPermission("update_test"), addQuestion);

router.patch("/:id/publish", protect, checkPermission("update_test"), publishTest);
router.get("/:id/stats", protect, checkPermission("view_results"), getTestStats);

// Archiving
router.get("/archived/all", protect, checkPermission("read_test"), getArchivedTests);
router.patch("/:id/restore", protect, checkPermission("update_test"), restoreTest);
router.delete("/:id/permanent", protect, checkPermission("delete_test"), permanentDeleteTest);
router.delete("/:id", protect, checkPermission("delete_test"), archiveTest);

// Question Management
router.patch("/questions/:questionId", protect, checkPermission("update_test"), updateQuestion);
router.delete("/questions/:questionId", protect, checkPermission("update_test"), deleteQuestion);

module.exports = router;
