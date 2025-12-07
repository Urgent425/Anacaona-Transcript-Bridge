// backend/routes/adminRoutes.js

const express = require("express");

// you export requireAdmin directly (module.exports = requireAdmin)
const requireAdmin = require("../../middleware/requireAdmin");

// our controller file will export an object with named functions
const {
  getDashboardOverview,
  getTranslationQueue,
} = require("../../controllers/admin/adminController");

const router = express.Router();

// GET /api/admin/dashboard-overview
router.get("/dashboard-overview", requireAdmin, getDashboardOverview);

// GET /api/admin/translations?status=in-progress
router.get("/translations", requireAdmin, getTranslationQueue);

module.exports = router;
