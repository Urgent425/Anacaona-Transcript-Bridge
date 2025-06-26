const express = require("express");
const multer = require("multer");
const jwt = require("jsonwebtoken");
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

    const transcripts = req.files.map((file, index) => ({
      filename: file.originalname,
      buffer: file.buffer,
      mimetype: file.mimetype,
      student: id,
      submissionId: new mongoose.Types.ObjectId().toString(), // ← ensure this exists
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

    const { translations } = req.body;
    const parsedTranslations = JSON.parse(translations);

    const docs = req.files.map((file, idx) => ({
      submissionId: req.params.submissionId,
      filename: file.originalname,
      buffer: file.buffer,
      mimetype: file.mimetype,
      student: studentId,
      status: "Pending",
      needsTranslation: parsedTranslations[idx]?.needsTranslation || false,
      sourceLanguage: parsedTranslations[idx]?.sourceLanguage || null,
    }));

    await Transcript.insertMany(docs);
    res.json({ message: "Documents added to submission" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add documents" });
  }
});

module.exports = router;
