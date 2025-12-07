//backend/routes/admin/institutionAccess.js
const express = require("express");
const router = express.Router();

const requireAdmin = require("../../middleware/requireAdmin");
const {
  createInvite,
  getAccessDetails,
  activateInstitutionUser,
  suspendInstitutionUser,
} = require("../../controllers/admin/institutionAccess");

// Only ATB platform admins should reach these
router.use(requireAdmin);

// Create an invite (authorize an email for an institution)
router.post("/institution-invites", createInvite);

// Get invites + pending/active/suspended users for one institution
router.get("/institutions/:id/access", getAccessDetails);

// Approve a pending institution user (enforce max 2 active)
router.patch("/institution-users/:userId/activate", activateInstitutionUser);

// Suspend an active institution user
router.patch("/institution-users/:userId/suspend", suspendInstitutionUser);

module.exports = router;
