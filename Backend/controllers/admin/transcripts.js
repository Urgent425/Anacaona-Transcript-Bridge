// controllers/admin/transcripts.js
const Transcript   = require("../../models/Transcript");
const Institution  = require("../../models/Institution");
const { signedGetUrl } = require("../../services/r2Storage");

exports.listTranscripts = async (req, res, next) => {
  try {
    // optional filtering via qs: ?status=pending&institution=…
    const { status, institution } = req.query;
    const filter = {};
    if (status)      filter.approvalStatus = status;
    if (institution) filter.assignedInstitution = institution;

    const list = await Transcript.find(filter)
      .populate("student", "firstName")
      .populate("assignedInstitution", "name")
      .populate("adminAssignee", "name role") // ← important
      .sort({ createdAt: -1 });

    res.json(list);
  } catch (err) {
    next(err);
  }
};

exports.assignTranscript = async (req, res, next) => {
  try {
    const transcript = await Transcript.findById(req.params.id);
    if (!transcript) return res.status(404).json({ error: "Not found" });

    const inst = await Institution.findById(req.body.institutionId);
    if (!inst) return res.status(400).json({ error: "Invalid institution" });

    transcript.assignedInstitution = inst._id;
    transcript.assignmentLog.push({
      institution: inst._id,
      assignedBy:  req.admin._id,    // from requireAdmin middleware
    });

    await transcript.save();
    res.json({ success: true, transcript });
  } catch (err) {
    next(err);
  }
};

// add for viewing submission details

exports.getTranscript = async (req, res, next) => {
  try {
    const t = await Transcript.findById(req.params.id)
      .select("-documents.buffer")
      .populate("student", "firstName lastName email")
      .populate("assignedInstitution", "name")
      .populate("adminAssignee", "name role"); // ← important
    if (!t) return res.status(404).json({ error: "Not found" });
    res.json(t);
  } catch (e) { next(e); }
};

exports.approveTranscript = async (req, res, next) => {
  try {
    const t = await Transcript.findById(req.params.id);
    if (!t) return res.status(404).json({ error: "Not found" });
    t.approvalStatus = "approved";
    await t.save();
    res.json({ success: true });
  } catch (e) { next(e); }
};

exports.rejectTranscript = async (req, res, next) => {
  try {
    const t = await Transcript.findById(req.params.id);
    if (!t) return res.status(404).json({ error: "Not found" });
    t.approvalStatus = "rejected";
    // optionally store req.body.reason
    await t.save();
    res.json({ success: true });
  } catch (e) { next(e); }
};

   // Download part

exports.downloadStudentDocument = async (req, res, next) => {
  try {
    const { id, docIndex } = req.params;
    const i = Number(docIndex);

    const t = await Transcript.findById(id).select("submissionId documents");
    if (!t) return res.status(404).json({ error: "Not found" });

    if (!Array.isArray(t.documents) || Number.isNaN(i) || i < 0 || i >= t.documents.length) {
      return res.status(400).json({ error: "Invalid document index" });
    }

    const d = t.documents[i];

    // ✅ Preferred: R2 signed URL
    if (d.key) {
      const url = await signedGetUrl({ key: d.key });
      return res.json({ url });
    }

    // ✅ Legacy fallback: buffer in MongoDB
    if (d.buffer && d.buffer.length) {
      res.setHeader("Content-Type", d.mimetype || "application/octet-stream");
      const safeName = encodeURIComponent(d.filename || `document_${i}`);
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
      return res.send(d.buffer);
    }

    return res.status(400).json({
      error: "Document has no R2 key and no buffer (storage not configured).",
    });
  } catch (err) {
    next(err);
  }
};
