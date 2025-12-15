// backend/models/TranslationRequest.js
const mongoose = require("mongoose");
const { generateSequentialId } = require("../utils/idGenerator"); // ⬅️ add

const FileSchema = new mongoose.Schema({
  filename: String,
  pageCount: Number,
  mimetype: String,
  path: String,
});

const AdminAssignLogSchema = new mongoose.Schema({
  admin:  { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
  action: { type: String, enum: ["self_assign","assign","unassign"], required: true },
  by:     { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
  at:     { type: Date, default: Date.now },
});

const TranslationRequestSchema = new mongoose.Schema({
    // ⬇⬇⬇ NEW: controlled, human-friendly ID
  requestId:     { type: String, required: true, unique: true, index: true },
  student:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  files:          [FileSchema],
  sourceLanguage: String,
  targetLanguage: String,
  needNotary:     Boolean,
  deliveryMethod: String,
  locked:         { type: Boolean, default: false },
  status:         { type: String, enum: ["pending", "locked", "paid", "completed"], default: "pending" },
    // Payments (Stripe)
  stripeSessionId:   { type: String, default: null, index: true },
  paid:              { type: Boolean, default: false },
  paidAt:            { type: Date, default: null },
  amountPaidCents:   { type: Number, default: null },
  currency:          { type: String, default: "usd" },
  createdAt:      { type: Date, default: Date.now },

  // ⬇⬇⬇ add these for admin assignment ⬇⬇⬇
  adminAssignee:     { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", default: null },
  adminAssignmentLog:[AdminAssignLogSchema],
});

TranslationRequestSchema.index({ adminAssignee: 1, createdAt: -1 });


/**
 * Auto-generate requestId if not provided:
 * e.g., TRQ-20251103-0001 (date-scoped sequential)
 */
TranslationRequestSchema.pre("validate", async function(next) {
  try {
    if (!this.requestId) {
      this.requestId = await generateSequentialId({ prefix: "TRQ", width: 4, useDateScope: true });
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("TranslationRequest", TranslationRequestSchema);
