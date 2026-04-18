const express = require("express");
const { protect } = require("../middleware/auth");
const { checkRole } = require("../middleware/rbac");
const {
    getMetrics,
    getInstitutions,
    toggleInstitutionStatus,
    deleteInstitution,
    getGlobalUsers,
    toggleUserStatus,
    deleteUser
} = require("../controllers/AdminController");

const router = express.Router();

// Apply auth and super_admin restriction to all routes
router.use(protect);
router.use(checkRole("super_admin"));

// Platform Metrics
router.get("/metrics", getMetrics);

// Institution Management
router.get("/institutions", getInstitutions);
router.patch("/institutions/:id/toggle", toggleInstitutionStatus);
router.delete("/institutions/:id", deleteInstitution);

// Global User Management
router.get("/users", getGlobalUsers);
router.patch("/users/:id/toggle", toggleUserStatus);
router.delete("/users/:id", deleteUser);

module.exports = router;
