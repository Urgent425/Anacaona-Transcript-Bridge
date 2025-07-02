const express = require("express");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Transcript = require("../models/Transcript");
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Submit initial transcript package
router.post("/submit", upload.array("files"), async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const { id } = jwt.verify(token, process.env.JWT_SECRET);

    const { purpose, translationFlags, sourceLanguages } = req.body;

    const flags = JSON.parse(translationFlags);
    const langs = JSON.parse(sourceLanguages);

    console.log("Files received:", req.files.length);
    console.log("Translation Flags:", flags);
    console.log("Source Languages:", langs);

    const submissionId = new mongoose.Types.ObjectId().toString(); // ← ensure this exists

    const transcripts = req.files.map((file, index) => ({
      filename: file.originalname,
      buffer: file.buffer,
      mimetype: file.mimetype,
      student: id,
      submissionId, // ← ensure this exists
      status: "Pending",
      purpose,
      needsTranslation: flags[index],
      sourceLanguage: langs[index],
    }));

    await Transcript.insertMany(transcripts);
    res.json({ message: "Transcripts submitted successfully" });
  } catch (error) {
    console.error("Submission error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// View submissions for current student
router.get("/mine", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const submissions = await Transcript.find({ student: id });
    res.json(submissions);
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// Add more documents to existing submission
router.post("/add-to-submission/:submissionId", upload.array("files"), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const studentId = decoded.id;

    // Ensure translationFlags are correctly parsed into booleans
    const flags = req.body.translationFlags
      ? JSON.parse(req.body.translationFlags).map(flag => flag === "yes")
      : [];
    const langs = req.body.sourceLanguages
      ? JSON.parse(req.body.sourceLanguages)
      : [];

    console.log("Files received:", req.files.length);
    console.log("Translation Flags:", flags);
    console.log("Source Languages:", langs);

    const docs = req.files.map((file, idx) => ({
      submissionId: req.params.submissionId,
      filename: file.originalname,
      buffer: file.buffer,
      mimetype: file.mimetype,
      student: studentId,
      status: "Pending",
      needsTranslation: flags[idx] || false,  // Ensure flags are correctly set
      sourceLanguage: langs[idx] || null,  // Set to null if not available
    }));

    await Transcript.insertMany(docs);
    res.json({ message: "Documents added to submission" });
  } catch (err) {
    console.error("Error adding documents:", err);
    res.status(500).json({ error: "Failed to add documents" });
  }
});

// Delete file
router.delete("/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { id: studentId } = jwt.verify(token, process.env.JWT_SECRET);

    const transcript = await Transcript.findById(req.params.id);
    if (!transcript || transcript.student.toString() !== studentId) {
      return res.status(403).json({ error: "Forbidden or Not Found" });
    }

    await Transcript.findByIdAndDelete(req.params.id);
    res.json({ message: "Transcript deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete transcript" });
  }
});

module.exports = router;
