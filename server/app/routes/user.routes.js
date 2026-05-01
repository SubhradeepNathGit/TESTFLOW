const express = require("express");
const {
    getProfile,
    updateProfile,
    updatePassword,
    getStudents,
    createStudent,
    toggleStudentStatus,
    deleteStudent,
    getInstructors,
    createInstructor,
    toggleInstructorStatus,
    deleteInstructor,
    getArchivedStudents,
    restoreStudent,
    permanentDeleteStudent,
    getArchivedInstructors,
    restoreInstructor,
    permanentDeleteInstructor
} = require("../controllers/UserController");

const { protect } = require("../middleware/auth");
const { checkRole } = require("../middleware/rbac");
const upload = require("../middleware/upload");

const router = express.Router();
router.use(protect);

// Own profile
router.get("/profile", getProfile);
router.put("/profile", upload.single("profileImage"), updateProfile);
router.put("/update-password", updatePassword);

// Student management (Institution Admin & Instructor can view, only owner can add/delete)
router.get("/students", checkRole("owner", "instructor", "super_admin"), getStudents);
router.post("/students", checkRole("owner"), createStudent);
router.patch("/students/:id/toggle", checkRole("owner"), toggleStudentStatus);
router.delete("/students/:id", checkRole("owner"), deleteStudent);
router.get("/students/archived", checkRole("owner"), getArchivedStudents);
router.patch("/students/:id/restore", checkRole("owner"), restoreStudent);
router.delete("/students/:id/permanent", checkRole("owner"), permanentDeleteStudent);

// Instructor management (Institution Admin and Super Admin can view, only owner can add/delete)
router.get("/instructors", checkRole("owner", "super_admin"), getInstructors);
router.post("/instructors", checkRole("owner"), createInstructor);
router.patch("/instructors/:id/toggle", checkRole("owner"), toggleInstructorStatus);
router.delete("/instructors/:id", checkRole("owner"), deleteInstructor);
router.get("/instructors/archived", checkRole("owner"), getArchivedInstructors);
router.patch("/instructors/:id/restore", checkRole("owner"), restoreInstructor);
router.delete("/instructors/:id/permanent", checkRole("owner"), permanentDeleteInstructor);

module.exports = router;
