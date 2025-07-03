// backend/routes/translationRequestRoutes.js

const express = require("express");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const mongoose = require("mongoose");
const TranslationRequest = require("../models/TranslationRequest");

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create a translation request
router.post("/", upload.array("files"), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const studentId = decoded.id;

    const { sourceLanguage, targetLanguage, needNotary, deliveryMethod } = req.body;
    const submissionId = new mongoose.Types.ObjectId().toString(); // ← ensure this exists
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const files = req.files.map((file) => ({
      filename: file.originalname,
      mimetype: file.mimetype,
      buffer: file.buffer,
    }));

    const request = new TranslationRequest({
      student: studentId,
      sourceLanguage,
      targetLanguage,
      needNotary,
      deliveryMethod,
      files,
      status: "pending", // default status
    });

    await request.save();
    res.status(201).json({ message: "Translation request created successfully" });
  } catch (err) {
    console.error("Error creating translation request:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get the logged-in user's translation requests
router.get("/mine", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const studentId = decoded.id;

    const requests = await TranslationRequest.find({ student: studentId }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error("Error fetching translation requests:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete file
router.delete("/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { id: studentId } = jwt.verify(token, process.env.JWT_SECRET);

    const transcript = await TranslationRequest.findById(req.params.id);
    if (!transcript || transcript.student.toString() !== studentId) {
      return res.status(403).json({ error: "Forbidden or Not Found" });
    }

    await TranslationRequest.findByIdAndDelete(req.params.id);
    res.json({ message: "Transcript deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete transcript" });
  }
});

module.exports = router;
