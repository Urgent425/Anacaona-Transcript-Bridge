//backend/models/InviteInstitution.js
const mongoose = require("mongoose");

const InviteInstitutionSchema = new mongoose.Schema(
  {
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Optional: uncomment to prevent duplicate active invites per email
// InviteInstitutionSchema.index({ institution: 1, email: 1, used: 1 }, { unique: true });

module.exports = mongoose.model("InviteInstitution", InviteInstitutionSchema);
