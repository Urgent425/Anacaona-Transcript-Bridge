// backend/models/TranslationRequest.js
const mongoose = require("mongoose");
const { generateSequentialId } = require("../utils/idGenerator");

const FileSchema = new mongoose.Schema(
  {
    filename: { type: String },
    pageCount: { type: Number, default: 1 },
    mimetype: { type: String },
    path: { type: String },     // where multer stored it on disk
    size: { type: Number },     // helpful for UI/admin
    buffer: { type: Buffer, select: false },
  },
  { _id: false }
);

const AdminAssignLogSchema = new mongoose.Schema({
  admin:  { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
  action: { type: String, enum: ["self_assign", "assign", "unassign"], required: true },
  by:     { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
  at:     { type: Date, default: Date.now },
});

const ShippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, default: "" },
    address1: { type: String, default: "" },
    address2: { type: String, default: "" },
    city:     { type: String, default: "" },
    state:    { type: String, default: "" }, // optional but useful
    country:  { type: String, default: "" },
    zip:      { type: String, default: "" },
    phone:    { type: String, default: "" },
    email:    { type: String, default: "" }, // optional
  },
  { _id: false }
);

const TranslationRequestSchema = new mongoose.Schema({
  // controlled, human-friendly ID
  requestId: { type: String, required: true, unique: true, index: true },

  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  files: [FileSchema],

  sourceLanguage: { type: String, default: "" },
  targetLanguage: { type: String, default: "" },

  needNotary: { type: Boolean, default: false },

  deliveryMethod: {
    type: String,
    enum: ["email", "hard copy", "both", ""],
    default: "",
  },

  // NEW: Shipping address (only relevant if deliveryMethod is hard copy/both)
  shippingAddress: { type: ShippingAddressSchema, default: () => ({}) },

  locked: { type: Boolean, default: false },

  status: {
    type: String,
    enum: ["pending", "locked", "paid", "completed"],
    default: "pending",
  },

  // Payments (Stripe)
  stripeSessionId:        { type: String, default: null, index: true },
  stripePaymentIntentId:  { type: String, default: null },
  stripeChargeId:         { type: String, default: null },
  receiptUrl:             { type: String, default: null },
  stripeInvoiceId:        { type: String, default: null },
  invoicePdfUrl:          { type: String, default: null },

  paid:            { type: Boolean, default: false },
  paidAt:          { type: Date, default: null },
  amountPaidCents: { type: Number, default: null },
  currency:        { type: String, default: "usd" },

  createdAt: { type: Date, default: Date.now },

  adminAssignee:      { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", default: null },
  adminAssignmentLog: [AdminAssignLogSchema],
});

TranslationRequestSchema.index({ adminAssignee: 1, createdAt: -1 });

/**
 * Auto-generate requestId if not provided:
 * e.g., TRQ-20251103-0001 (date-scoped sequential)
 */
TranslationRequestSchema.pre("validate", async function (next) {
  try {
    if (!this.requestId) {
      this.requestId = await generateSequentialId({
        prefix: "TRQ",
        width: 4,
        useDateScope: true,
      });
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("TranslationRequest", TranslationRequestSchema);
