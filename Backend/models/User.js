// backend/models/User.js
const mongoose = require("mongoose");

const ShippingAddressSchema = new mongoose.Schema(
  {
    name:     { type: String, trim: true },          // recipient name
    address1: { type: String, trim: true },
    address2: { type: String, trim: true },
    city:     { type: String, trim: true },
    state:    { type: String, trim: true },          // e.g., "TN"
    country:  { type: String, trim: true, default: "USA" },
    zip:      { type: String, trim: true },          // 12345 or 12345-6789
    phone:    { type: String, trim: true },          // recipient phone
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true },
    lastName:  { type: String, trim: true },

    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },

    password: { type: String, required: true },

    // Keep for general contact
    phone: { type: String, trim: true },

    /**
     * LEGACY (keep to avoid breaking older records/UI)
     * Prefer shippingAddress moving forward.
     */
    address: { type: String, trim: true },

    /**
     * NEW: structured address for shipping (US-only policy is enforced in routes)
     * This enables: "Use saved address" vs "Enter new address".
     */
    shippingAddress: { type: ShippingAddressSchema, default: null },

    // Only "student" and "institution" in your app
    role: {
      type: String,
      enum: ["student", "institution"],
      required: true,
    },

    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: function () {
        return this.role === "institution";
      },
    },

    position: { type: String, trim: true }, // e.g. "Registrar", "Administrator"

    status: {
      type: String,
      enum: ["pending", "active", "suspended"],
      required: true,
      default: function () {
        if (this.role === "student") return "active";
        if (this.role === "institution") return "pending";
        return "pending";
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
