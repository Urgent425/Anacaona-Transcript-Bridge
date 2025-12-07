//backend//controllers/admin/assignments.js
const Transcript = require("../../models/Transcript");
const TranslationRequest = require("../../models/TranslationRequest");
const AdminUser = require("../../models/AdminUser");
const { canSelfAssign, canAssignToOthers } = require("../../utils/adminPerms");

// Helper: atomic take if unassigned
async function takeIfUnassigned(model, id, adminId, logPath) {
  const doc = await model.findOneAndUpdate(
    { _id: id, adminAssignee: null },                 // only if unassigned
    { 
      $set: { adminAssignee: adminId },
      $push: { [logPath]: { admin: adminId, action: "self_assign", by: adminId } }
    },
    { new: true }
  ).populate("adminAssignee", "name role");
  return doc;
}

// Helper: assign to someone (superadmin only)
async function assignTo(model, id, targetAdminId, byAdminId, logPath) {
  const target = await AdminUser.findById(targetAdminId).select("_id name role");
  if (!target) throw new Error("Target admin not found");
  const doc = await model.findByIdAndUpdate(
    id,
    { 
      $set: { adminAssignee: target._id },
      $push: { [logPath]: { admin: target._id, action: "assign", by: byAdminId } }
    },
    { new: true }
  ).populate("adminAssignee", "name role");
  return doc;
}

// ----- Transcripts -----
exports.selfAssignTranscript = async (req, res) => {
  if (!canSelfAssign(req.admin.role)) return res.status(403).json({ message: "Not allowed" });
  const doc = await takeIfUnassigned(Transcript, req.params.id, req.admin._id, "adminAssignmentLog");
  if (!doc) return res.status(409).json({ message: "Already assigned" });
  res.json({ ok: true, assignee: doc.adminAssignee });
};

exports.assignTranscriptToAdmin = async (req, res) => {
  if (!canAssignToOthers(req.admin.role)) return res.status(403).json({ message: "Not allowed" });
  const { adminId } = req.body;
  try {
    const doc = await assignTo(Transcript, req.params.id, adminId, req.admin._id, "adminAssignmentLog");
    res.json({ ok: true, assignee: doc.adminAssignee });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.unassignTranscript = async (req, res) => {
  if (!canAssignToOthers(req.admin.role)) return res.status(403).json({ message: "Not allowed" });
  const doc = await Transcript.findByIdAndUpdate(
    req.params.id,
    { 
      $set: { adminAssignee: null },
      $push: { adminAssignmentLog: { action: "unassign", by: req.admin._id } }
    },
    { new: true }
  );
  if (!doc) return res.status(404).json({ message: "Not found" });
  res.json({ ok: true });
};

// ----- Translation Requests -----
exports.selfAssignTranslation = async (req, res) => {
  if (!canSelfAssign(req.admin.role)) return res.status(403).json({ message: "Not allowed" });
  const doc = await takeIfUnassigned(TranslationRequest, req.params.id, req.admin._id, "adminAssignmentLog");
  if (!doc) return res.status(409).json({ message: "Already assigned" });
  res.json({ ok: true, assignee: doc.adminAssignee });
};

exports.assignTranslationToAdmin = async (req, res) => {
  if (!canAssignToOthers(req.admin.role)) return res.status(403).json({ message: "Not allowed" });
  const { adminId } = req.body;
  try {
    const doc = await assignTo(TranslationRequest, req.params.id, adminId, req.admin._id, "adminAssignmentLog");
    res.json({ ok: true, assignee: doc.adminAssignee });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.unassignTranslation = async (req, res) => {
  if (!canAssignToOthers(req.admin.role)) return res.status(403).json({ message: "Not allowed" });
  const doc = await TranslationRequest.findByIdAndUpdate(
    req.params.id,
    { 
      $set: { adminAssignee: null },
      $push: { adminAssignmentLog: { action: "unassign", by: req.admin._id } }
    },
    { new: true }
  );
  if (!doc) return res.status(404).json({ message: "Not found" });
  res.json({ ok: true });
};
