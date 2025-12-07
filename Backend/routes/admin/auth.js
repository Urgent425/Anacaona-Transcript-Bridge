const express      = require("express");
const { login }    = require("../../controllers/admin/auth");
const router       = express.Router();

// POST /api/admin/auth/login
router.post("/login", login);

module.exports = router;
