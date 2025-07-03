const mongoose = require("mongoose");

const translationRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sourceLanguage: {
      type: String,
      enum: ["french", "spanish"],
      required: true,
    },
    targetLanguage: {
      type: String,
      enum: ["english"],
      default: "english",
    },
    needNotary: {
      type: Boolean,
      default: false,
    },
    deliveryMethod: {
      type: String,
      enum: ["email", "hard copy", "both"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in progress", "completed", "rejected"],
      default: "pending",
    },
    files: [
      {
        filename: String,
        mimetype: String,
        buffer: Buffer,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("TranslationRequest", translationRequestSchema);
