// backend/middleware/requireAuth.js
const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  // Expect "Authorization: Bearer <token>"
  const authHeader = req.headers.authorization || "";
  const parts = authHeader.split(" ");
  const token = parts.length === 2 && parts[0] === "Bearer" ? parts[1] : null;

  if (!token) {
    return res.status(401).json({ message: "No auth token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // attach basic info for downstream
    req.user = {
      _id: decoded._id,
      role: decoded.role,
      email: decoded.email,
    };
    return next();
  } catch (err) {
    console.error("requireAuth error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = { requireAuth };
