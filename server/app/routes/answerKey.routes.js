const express = require("express");
const {
    uploadAnswerKey,
    getAnswerKeys,
    deleteAnswerKey
} = require("../controllers/AnswerKeyController");

const { protect } = require("../middleware/auth");
const { checkPermission } = require("../middleware/rbac");
const uploadPdf = require("../middleware/pdfUpload");

const router = express.Router();

router.use(protect);

router.get("/", getAnswerKeys); // All users in institution can view
router.post("/", checkPermission("create_test"), uploadPdf.single("pdfFile"), uploadAnswerKey);
router.delete("/:id", checkPermission("delete_test"), deleteAnswerKey);

module.exports = router;
