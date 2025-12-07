// backend/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const User = require("../models/User");
const Institution = require("../models/Institution");
const InviteInstitution = require("../models/InviteInstitution");

const authMiddleware = require("../middleware/authMiddleware");

// Temporary in-memory token store (for demo)
const resetTokens = new Map();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    let {
      firstName,
      lastName,
      email,
      password,
      phone,
      address,
      role,
      position,

      institutionId,   // legacy support you already had
      institutionName, // legacy support you already had
    } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    email = email.toLowerCase().trim();

    // Email must be unique
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    //
    // CASE 1: STUDENT REGISTRATION
    //
    if (role === "student") {
      const user = await User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone,
        address,
        role: "student",
        status: "active", // students are immediately active
        // institution stays undefined
        position,
      });

      return res.status(201).json({
        message: "Student registered",
        user: {
          _id:       user._id,
          firstName: user.firstName,
          lastName:  user.lastName,
          role:      user.role,
          status:    user.status,
        },
      });
    }

    //
    // CASE 2: INSTITUTION REGISTRATION (HIGH SECURITY)
    //
    if (role === "institution") {
      // 1. Check InviteInstitution table
      //    This email MUST have been pre-authorized for some institution.
      const invite = await InviteInstitution.findOne({
        email,
        used: false,
      }).populate("institution");

      if (!invite) {
        return res.status(403).json({
          message:
            "This email is not authorized to create an institution account. Please contact Anacaona.",
        });
      }

      if (!invite.institution) {
        return res.status(400).json({
          message: "Invite is missing institution reference.",
        });
      }

      // 2. We will no longer trust arbitrary institutionId / institutionName
      //    because that was insecure. We force the institution from the invite.
      const institutionOid = invite.institution._id;

      // 3. Create user with 'pending' status.
      const user = await User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone,
        address,
        role: "institution",
        institution: institutionOid,
        position,
        status: "pending", // must be activated by SuperAdmin
      });

      // 4. Mark this invite as used so nobody else can reuse the same email.
      invite.used = true;
      await invite.save();

      return res.status(201).json({
        message:
          "Institution account created in pending status. Awaiting approval by Anacaona.",
        user: {
          _id:         user._id,
          firstName:   user.firstName,
          lastName:    user.lastName,
          role:        user.role,
          status:      user.status,
          institution: invite.institution.name,
        },
      });
    }

    // If some other role gets posted (shouldn't happen with your current UI):
    return res.status(400).json({ message: "Unsupported role." });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(400).json({ message: "Email already in use" });
    }
    console.error("Register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Missing credentials." });
    }

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email }).select("+password").populate("institution");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Block access for certain institution statuses
    if (user.role === "institution") {
      if (user.status === "pending") {
        return res.status(403).json({
          message:
            "Your institution account is waiting for approval by Anacaona.",
        });
      }
      if (user.status === "suspended") {
        return res.status(403).json({
          message:
            "This institution account is suspended. Please contact Anacaona.",
        });
      }
      // if active → continue
    }

    // Students are always allowed if they reached this point because their status is "active" by default

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        institution: user.institution || null,
        status: user.status,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Logged in",
      token,
      user: {
        _id:        user._id,
        firstName:  user.firstName,
        lastName:   user.lastName,
        role:       user.role,
        status:     user.status,
        institution: user.institution
          ? { _id: user.institution._id, name: user.institution.name }
          : null,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/auth/me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("institution", "name");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const u = await User.findOne({ email });
    if (!u) {
      return res.status(404).json({ message: "No account found with that email." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    resetTokens.set(token, {
      userId: u._id,
      expires: Date.now() + 1000 * 60 * 30,
    });

    const resetUrl = `http://localhost:3000/reset-password/${token}`;
    console.log(`Password reset link for ${email}: ${resetUrl}`);

    // nodemailer logic optional
    res.json({ message: "Password reset link sent to your email." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// POST /api/auth/reset-password/:token
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const record = resetTokens.get(token);
    if (!record || record.expires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(record.userId, { password: hashed });

    resetTokens.delete(token);
    res.json({ message: "Password reset successful." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
