// backend/routes/admin/me.js
const router = require("express").Router();
const requireAdmin = require("../../middleware/requireAdmin");
router.get("/me", requireAdmin, (req, res) => res.json(req.admin));
module.exports = router;



