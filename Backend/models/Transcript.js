
const mongoose = require("mongoose");

const TranscriptSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  filePath: String,
  purpose: String,
  needsTranslation: Boolean,
  status: {
    type: String,
    enum: ["Submitted", "Under Review", "Approved", "Rejected", "Translation Requested", "Sent to WES"],
    default: "Submitted",
  },
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Transcript", TranscriptSchema);