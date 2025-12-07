// backend/middleware/requireAdmin.js
const jwt       = require("jsonwebtoken");
const AdminUser = require("../models/AdminUser");

async function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: "No token" });

    const token = header.replace("Bearer ", "");
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await AdminUser.findById(payload.id);
    if (!admin) return res.status(401).json({ error: "Invalid token" });

    req.admin = admin;
    next();
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
}

module.exports = requireAdmin;
