// routes/admin/translationRequests.js
const express = require("express");
const requireAdmin = require("../../middleware/requireAdmin");
const ctrl = require("../../controllers/admin/translationRequests");

const router = express.Router();
router.use(requireAdmin);

// GET list
router.get("/", ctrl.listTranslationRequests);

// GET one
router.get("/:id", ctrl.getTranslationRequest);

// PATCH status
router.patch("/:id/status", ctrl.updateStatus);

// PATCH lock/unlock
router.patch("/:id/lock", ctrl.setLocked);

// GET file download by index
router.get("/:id/files/:index", ctrl.downloadFile);

module.exports = router;
