// backend/middleware/protectInstitution.js
const jwt         = require("jsonwebtoken");
const User        = require("../models/User");
const Institution = require("../models/Institution");

exports.protectInstitution = async (req, res, next) => {
  try {
    // 1. Check Authorization header
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    // 2. Decode token
    const token = header.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("protectInstitution jwt.verify error:", err);
      return res.status(401).json({ message: "Token invalid or expired" });
    }

    // decoded should have { id, role, ... }
    if (!decoded?.id) {
      return res.status(401).json({ message: "Token missing user id" });
    }

    // 3. Load user fresh from DB
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // 4. Must actually be an institution account
    if (user.role !== "institution") {
      return res.status(403).json({ message: "Forbidden: not an institution user" });
    }

    // 5. Enforce new security status logic
    //    - pending  => registered but not approved by ATB
    //    - suspended => manually blocked by ATB
    //    - active    => good
    if (user.status === "pending") {
      return res.status(403).json({
        message: "Your institution account is waiting for approval by Anacaona.",
        code: "INSTITUTION_PENDING",
      });
    }
    if (user.status === "suspended") {
      return res.status(403).json({
        message: "This institution account is suspended. Please contact Anacaona.",
        code: "INSTITUTION_SUSPENDED",
      });
    }
    if (user.status !== "active") {
      // unknown/unexpected state
      return res.status(403).json({
        message: "Account is not active.",
        code: "INSTITUTION_NOT_ACTIVE",
      });
    }

    // 6. Resolve institution
    // Preferred path: user.institution is an ObjectId
    let instDoc = null;
    if (user.institution) {
      instDoc = await Institution.findById(user.institution);
    }

    // Legacy fallback: some very old accounts might have institutionName only.
    // You said you're no longer using institutionName going forward, but
    // keeping this migration block will self-heal old users.
    if (!instDoc && user.institutionName) {
      instDoc = await Institution.findOne({ name: user.institutionName });
      if (instDoc) {
        // Self-heal / migrate:
        user.institution = instDoc._id;
        await user.save();
      }
    }

    if (!instDoc) {
      return res.status(400).json({
        message: "Institution not linked to user",
        code: "NO_INSTITUTION_LINK",
      });
    }

    // 7. Attach clean context to req for downstream controllers
    req.user = {
      id:   user._id,
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      role: user.role,
      status: user.status,
      institution: instDoc._id,
    };

    req.institution = instDoc;

    // 8. Continue
    next();
  } catch (err) {
    console.error("protectInstitution unexpected error:", err);
    return res.status(500).json({ message: "Access check failed" });
  }
};
