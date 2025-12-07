//backend/routes/admin/institutions.js

const express      = require("express");
const requireAdmin = require("../../middleware/requireAdmin");
const ctrl         = require("../../controllers/admin/institutions");
const router       = express.Router();

router.use(requireAdmin);

router.get("/", ctrl.listInstitutions);
router.post("/", ctrl.createInstitution);

module.exports = router;
