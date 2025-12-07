// backend/routes/admin/assignments.js
const router = require("express").Router();
const requireAdmin = require("../../middleware/requireAdmin");
const a = require("../../controllers/admin/assignments");

router.use(requireAdmin);

// Submissions (Transcripts)
router.patch("/transcripts/:id/self-assign", a.selfAssignTranscript);
router.patch("/transcripts/:id/assign-admin", a.assignTranscriptToAdmin);
router.patch("/transcripts/:id/unassign", a.unassignTranscript);

// Translation Requests
router.patch("/translation-requests/:id/self-assign", a.selfAssignTranslation);
router.patch("/translation-requests/:id/assign-admin", a.assignTranslationToAdmin);
router.patch("/translation-requests/:id/unassign", a.unassignTranslation);

module.exports = router;



