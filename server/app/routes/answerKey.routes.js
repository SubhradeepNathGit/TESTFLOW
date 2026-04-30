const express = require("express");
const {
    uploadAnswerKey,
    getAnswerKeys,
    deleteAnswerKey,
    getArchivedAnswerKeys,
    restoreAnswerKey,
    permanentDeleteAnswerKey
} = require("../controllers/AnswerKeyController");

const { protect } = require("../middleware/auth");
const { checkPermission } = require("../middleware/rbac");
const uploadPdf = require("../middleware/pdfUpload");

const router = express.Router();

router.use(protect);

router.get("/", getAnswerKeys); // All users in institution can view
router.get("/archived", checkPermission("delete_test"), getArchivedAnswerKeys);
router.post("/", checkPermission("create_test"), uploadPdf.single("pdfFile"), uploadAnswerKey);
router.patch("/:id/restore", checkPermission("delete_test"), restoreAnswerKey);
router.delete("/:id", checkPermission("delete_test"), deleteAnswerKey); // This is now archive
router.delete("/:id/permanent", checkPermission("delete_test"), permanentDeleteAnswerKey);

module.exports = router;
