// backend/models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String },
    lastName:  { type: String },

    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },

    password: { type: String, required: true },

    phone:    { type: String },
    address:  { type: String },

    // Only "student" and "institution" in your app
    role: {
      type: String,
      enum: ["student", "institution"],
      required: true,
    },

    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "Institution",
      required: function () {
        return this.role === "institution";
      },
    },

    position: { type: String }, // e.g. "Registrar", "Administrator"

    status: {
      type: String,
      enum: ["pending", "active", "suspended"],
      required: true,
      default: function () {
        // Students should be ready to go right away
        if (this.role === "student") return "active";
        // Institution users must be approved manually
        if (this.role === "institution") return "pending";
        // fallback
        return "pending";
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
