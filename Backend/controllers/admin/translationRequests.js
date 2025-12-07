// controllers/admin/translationRequests.js
const path = require("path");
const TranslationRequest = require("../../models/TranslationRequest");

exports.listTranslationRequests = async (req, res, next) => {
  try {
    const list = await TranslationRequest.find()
      .populate("student", "firstName email address phone")
      .populate("adminAssignee", "name role")
      .sort({ createdAt: -1 });
    res.json(list);
  } catch (err) { next(err); }
};

exports.getTranslationRequest = async (req, res, next) => {
  try {
    const doc = await TranslationRequest.findById(req.params.id)
      .populate("student", "firstName email address phone")
      .populate("adminAssignee", "name role");
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // "pending" | "locked" | "paid" | "completed"
    const doc = await TranslationRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    doc.status = status;
    await doc.save();
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.setLocked = async (req, res, next) => {
  try {
    const { locked } = req.body; // boolean
    const doc = await TranslationRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    doc.locked = !!locked;
    // Optional: when locking, you might also set status = "locked"
    if (doc.locked) doc.status = "locked";
    await doc.save();
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.downloadFile = async (req, res, next) => {
  try {
    const { id, index } = req.params;
    const doc = await TranslationRequest.findById(id);
    if (!doc || !doc.files || !doc.files[index]) {
      return res.status(404).json({ error: "File not found" });
    }
    const f = doc.files[index];

    if (f.path) {
      return res.sendFile(path.resolve(f.path));
    }

    // If you stored buffers instead of paths (adjust to your schema if needed)
    if (f.buffer) {
      res.setHeader("Content-Type", f.mimetype || "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${f.filename}"`);
      return res.end(f.buffer);
    }

    res.status(400).json({ error: "File storage not configured" });
  } catch (err) { next(err); }
};
