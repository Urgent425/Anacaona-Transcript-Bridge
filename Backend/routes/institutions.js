//backend/routes/institutions.js
const express     = require("express");
const { listInstitutions } = require("../controllers/admin/institutions");
const router      = express.Router();

// No auth middleware here — this is public
router.get("/", listInstitutions);

module.exports = router;
