const express = require("express");
const { protect } = require("../middleware/auth");
const { checkRole } = require("../middleware/rbac");
const {
    getMetrics,
    getInstitutions,
    toggleInstitutionStatus,
    archiveInstitution,
    getGlobalUsers,
    toggleUserStatus,
    archiveUser,
    getComprehensiveAnalytics,
    getArchivedItems,
    restoreInstitution,
    restoreUser,
    permanentDeleteInstitution,
    permanentDeleteUser
} = require("../controllers/AdminController");

const router = express.Router();

// Apply auth and super_admin restriction to all routes
router.use(protect);
router.use(checkRole("super_admin"));

// Platform Metrics & Analytics
router.get("/metrics", getMetrics);
router.get("/analytics", getComprehensiveAnalytics);

// Archive Management
router.get("/archive", getArchivedItems);
router.patch("/archive/institutions/:id/restore", restoreInstitution);
router.patch("/archive/users/:id/restore", restoreUser);
router.delete("/archive/institutions/:id", permanentDeleteInstitution);
router.delete("/archive/users/:id", permanentDeleteUser);

// Institution Management
router.get("/institutions", getInstitutions);
router.patch("/institutions/:id/toggle", toggleInstitutionStatus);
router.delete("/institutions/:id", archiveInstitution);

// Global User Management
router.get("/users", getGlobalUsers);
router.patch("/users/:id/toggle", toggleUserStatus);
router.delete("/users/:id", archiveUser);

module.exports = router;
