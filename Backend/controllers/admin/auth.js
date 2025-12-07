// controllers/admin/auth.js
const AdminUser = require("../../models/AdminUser");
const jwt       = require("jsonwebtoken");

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  const admin = await AdminUser.findOne({ email });
  if (!admin || !(await admin.verifyPassword(password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, {
    expiresIn: "2160h",
  });
  res.json({ token, admin: { id: admin._id, name: admin.name, role: admin.role } });
};
