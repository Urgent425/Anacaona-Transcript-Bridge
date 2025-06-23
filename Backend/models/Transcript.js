const mongoose = require("mongoose");

const transcriptSchema = new mongoose.Schema({
  filename: String,
  buffer: Buffer, // Or a file path if you store on disk
  mimetype: String,
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, default: "Pending" },
  needsTranslation: Boolean,
  language: { type: String, enum: ["french", "spanish", "english"], default: "english" },
  purpose: { type: String, enum: ["education", "immigration"], required: true },
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Transcript", transcriptSchema);
