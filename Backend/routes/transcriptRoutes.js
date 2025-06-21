const express = require("express");
const router = express.Router();
const Transcript = require("../models/Transcript");
const jwt = require("jsonwebtoken");

// Middleware to authenticate and extract user
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // now req.user.id and req.user.role available
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

// === GET user's own transcript submissions ===
router.get("/mine", authenticate, async (req, res) => {
  try {
    const submissions = await Transcript.find({ student: req.user.id });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: "Server error fetching transcripts" });
  }
});

// === GET all transcripts (for school admin) ===
router.get("/", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "school") {
      return res.status(403).json({ message: "Access denied" });
    }

    const transcripts = await Transcript.find().populate("student", "email");
    res.json(transcripts);
  } catch (err) {
    res.status(500).json({ error: "Error fetching all transcripts" });
  }
});

// === Update status of a transcript ===
router.put("/status/:id", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "school") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { status } = req.body;
    await Transcript.findByIdAndUpdate(req.params.id, { status });
    res.json({ message: "Status updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update transcript status" });
  }
});

module.exports = router;