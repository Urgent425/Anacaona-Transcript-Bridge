const mongoose = require("mongoose");

const transcriptSchema = new mongoose.Schema({
  submissionId: { type: String, required: true },
  filename: String,
  buffer: Buffer,
  mimetype: String,
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, default: "Pending" },
  purpose: String,
  needsTranslation: Boolean,
  sourceLanguage: String,
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Transcript", transcriptSchema);