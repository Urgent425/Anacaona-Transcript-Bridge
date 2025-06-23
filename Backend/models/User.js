const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
  firstName: String,
  firstName: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  address: String,
  role: { type: String, enum: ["student", "school", "admin"], default: "student" },
});

module.exports = mongoose.model("User", UserSchema);