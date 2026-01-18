// // backend/models/TranslationRequest.js
const mongoose = require("mongoose");
const { generateSequentialId } = require("../utils/idGenerator");

const FileSchema = new mongoose.Schema(
  {
    filename: { type: String, default: "" },
    pageCount: { type: Number, default: 1 },
    mimetype: { type: String, default: "" },

    // legacy / optional (safe to keep even if unused)
    path: { type: String, default: "" },
    size: { type: Number, default: 0 },
    buffer: { type: Buffer, select: false },

    // R2
    bucket: { type: String, default: "" },
    key: { type: String, default: "" },
  },
  { _id: false }
);

const AdminAssignLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
    action: { type: String, enum: ["self_assign", "assign", "unassign"], required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

/**
 * Dual-field shipping schema:
 * - "name" is the NEW preferred field used by your routes/controllers.
 * - "fullName" is kept for backward compatibility with any existing UI/data.
 *
 * NOTE: We add pre-validate normalization to keep them in sync.
 */
const ShippingAddressSchema = new mongoose.Schema(
  {
    // NEW preferred field
    name: { type: String, default: "" },

    // legacy field (backward compatible)
    fullName: { type: String, default: "" },

    address1: { type: String, default: "" },
    address2: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "USA" },
    zip: { type: String, default: "" },
    phone: { type: String, default: "" },

    // optional
    email: { type: String, default: "" },
  },
  { _id: false }
);

const TranslationRequestSchema = new mongoose.Schema({
  // controlled, human-friendly ID
  requestId: { type: String, required: true, unique: true, index: true },

  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  files: { type: [FileSchema], default: [] },

  sourceLanguage: { type: String, default: "" },
  targetLanguage: { type: String, default: "" },

  needNotary: { type: Boolean, default: false },

  deliveryMethod: {
    type: String,
    enum: ["email", "hard copy", "both", ""],
    default: "",
  },

  // Shipping address snapshot (only relevant if deliveryMethod is hard copy/both)
  shippingAddress: { type: ShippingAddressSchema, default: null },

  locked: { type: Boolean, default: false },

  status: {
    type: String,
    enum: ["pending", "locked", "paid", "completed"],
    default: "pending",
  },

  // Payments (Stripe)
  stripeSessionId: { type: String, default: null, index: true },
  stripePaymentIntentId: { type: String, default: null },
  stripeChargeId: { type: String, default: null },
  receiptUrl: { type: String, default: null },

  stripeInvoiceId: { type: String, default: null },
  invoicePdfUrl: { type: String, default: null },

  paid: { type: Boolean, default: false },
  paidAt: { type: Date, default: null },

  // Backward-compatible total paid (usually equals totalCents once Stripe Tax is enabled)
  amountPaidCents: { type: Number, default: null },
  currency: { type: String, default: "usd" },

  // Stripe Tax breakdown
  subtotalCents: { type: Number, default: null },
  taxCents: { type: Number, default: null },
  totalCents: { type: Number, default: null },

  createdAt: { type: Date, default: Date.now },

  adminAssignee: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", default: null },
  adminAssignmentLog: { type: [AdminAssignLogSchema], default: [] },
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

    // Keep shippingAddress.name and shippingAddress.fullName in sync
    if (this.shippingAddress) {
      const n = String(this.shippingAddress.name || "").trim();
      const fn = String(this.shippingAddress.fullName || "").trim();

      // Prefer "name" if present, otherwise fall back to "fullName"
      if (n && !fn) this.shippingAddress.fullName = n;
      if (fn && !n) this.shippingAddress.name = fn;
    }

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("TranslationRequest", TranslationRequestSchema);
