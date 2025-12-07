// backend/models/AdminUser.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // ← stay consistent project-wide

const AdminUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true },
    name: { type: String, trim: true },
    role: {
      type: String,
      enum: ["SuperAdmin", "Translator", "Reviewer"], // ← fixed
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// helper to verify password
AdminUserSchema.methods.verifyPassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

// Hide passwordHash in JSON responses
AdminUserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model("AdminUser", AdminUserSchema);
