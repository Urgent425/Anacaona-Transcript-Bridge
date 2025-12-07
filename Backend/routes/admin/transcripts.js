// routes/admin/transcripts.js
const express = require("express");
const router  = express.Router();
const requireAdmin = require("../../middleware/requireAdmin");
const ctrl    = require("../../controllers/admin/transcripts");

router.use(requireAdmin);

// GET  /api/admin/transcripts
router.get("/", ctrl.listTranscripts);
router.get("/:id", ctrl.getTranscript);           // ← add
// PATCH /api/admin/transcripts/:id/assign
router.patch("/:id/assign", ctrl.assignTranscript);
router.post("/:id/approve", ctrl.approveTranscript); // ← add
router.post("/:id/reject",  ctrl.rejectTranscript);  // ← add

module.exports = router;
