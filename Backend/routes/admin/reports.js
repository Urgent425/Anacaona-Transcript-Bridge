// routes/admin/reports.js
const express       = require("express");
const requireAdmin  = require("../../middleware/requireAdmin");
const { getDashboardStats } = require("../../controllers/admin/reports");

const router = express.Router();
router.use(requireAdmin);

// GET /api/admin/reports/dashboard-stats
router.get("/dashboard-stats", getDashboardStats);

module.exports = router;
