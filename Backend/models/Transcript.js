// backend/models/Transcript.js
const mongoose = require("mongoose");
const { generateSequentialId } = require("../utils/idGenerator");

const ApproverSchema = new mongoose.Schema({
  name:        { type: String },
  role:        { type: String },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution" }, // ⬅️ ObjectId
  timestamp:   { type: Date },
});

const AssignmentLogSchema = new mongoose.Schema({
  institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution" },
  assignedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
  at:          { type: Date, default: Date.now },
});

const AdminAssignLogSchema = new mongoose.Schema({
  admin:     { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
  action:    { type: String, enum: ["self_assign", "assign", "unassign"], required: true },
  by:        { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" }, // who performed it
  at:        { type: Date, default: Date.now },
});

const OfficialUploadSchema = new mongoose.Schema({
  filename:     String,
  mimetype:     String,
  size:         Number,
  pageCount:    Number,
  storagePath:  String, // or gridFsId/s3Key later
  sha256:       String, // for dedupe/integrity
  reason:       { type: String, enum: ["initial", "re-issue", "corrected", "other"], default: "initial" },
  note:         String,        // free-form reason details
  version:      { type: Number, default: 1 }, // increment per transcript upload
  status:       { type: String, enum: ["pending_scan", "clean", "infected"], default: "pending_scan" },
  uploadedAt:   { type: Date, default: Date.now },
  uploadedBy:   {
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name:        String,
    institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution" },
  },
});

const transcriptSchema = new mongoose.Schema({
  submissionId:          { type: String, required: true, unique: true, index: true }, // string → great for search, // quick search by human-friendly id
  student:               { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  submissionMethod:      { type: String, enum: ["sealed", "digital"], required: true },
  purpose:               { type: String, enum: ["education", "immigration"] },
  approvalStatus:        { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  finalStatus:           { type: String, enum: ["awaiting_shipping", "in_transit", "completed"], default: "awaiting_shipping" },
  stripeSessionId:        { type: String, default: null },
  stripePaymentIntentId:  { type: String, default: null },
  stripeChargeId:         { type: String, default: null },
  receiptUrl:             { type: String, default: null },
  paidAt:                 { type: Date, default: null },
  amountPaidCents:        { type: Number, default: null },
  currency:               { type: String, default: "usd" },
  locked:                 { type: Boolean, default: false }, // optional but recommended
  paymentStatus:         { type: String, enum: ["pending", "paid"], default: "pending" },
  sealedPackageReceived: { type: Boolean, default: false },
  shippingTrackingNumber:{ type: String },
  approver:              ApproverSchema,
  createdAt:             { type: Date, default: Date.now },

  documents: [
    {
      filename:        String,
      buffer:          Buffer,   // ⚠️ heavy: exclude in queries sent to UI
      mimetype:        String,
      needsTranslation:Boolean,
      sourceLanguage:  String,
      pageCount:       Number,
      // NEW (important)
      translationPaid: { type: Boolean, default: false },
      translationPaidAt: { type: Date, default: null },
      translationStripeSessionId: { type: String, default: null },
      addedAt: { type: Date, default: Date.now },
    }
  ],

  assignedInstitution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Institution",
    default: null,
  },
  assignmentLog: [ AssignmentLogSchema ],
  adminAssignee: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", default: null },
  adminAssignmentLog: [AdminAssignLogSchema],
});
transcriptSchema.add({
  officialUploads: [OfficialUploadSchema],
});
// Pragmatic indexes for institution list view
transcriptSchema.index({ assignedInstitution: 1, approvalStatus: 1, submissionMethod: 1, createdAt: -1 });
transcriptSchema.index({ adminAssignee: 1, createdAt: -1 });

/**
 * Auto-generate submissionId if not provided:
 * e.g., SUB-20251103-0001 (date-scoped sequential)
 */
transcriptSchema.pre("validate", async function(next) {
  try {
    if (this.submissionId) {
      this.submissionId = await generateSequentialId({ prefix: "SUB", width: 4, useDateScope: true });
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Transcript", transcriptSchema);
