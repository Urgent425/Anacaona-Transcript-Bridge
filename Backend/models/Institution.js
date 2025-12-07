//backend/models/Institution.js
const mongoose = require("mongoose");

const institutionSchema = new mongoose.Schema({
  name:         { type: String, required: true, unique: true },
  contactEmail: { type: String },
  contactPhone: { type: String },
  address:      { type: String },
  createdAt:    { type: Date, default: Date.now },
});

module.exports = mongoose.model("Institution", institutionSchema);
