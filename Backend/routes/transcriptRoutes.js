
const express = require("express");
const router = express.Router();
const Transcript = require("../models/Transcript");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/submit", upload.array("files"), async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const { needsTranslation, language, purpose } = req.body;

    const needsTranslationArray = JSON.parse(needsTranslation || "[]");
    const languageArray = JSON.parse(language || "[]");

    const submissions = req.files.map((file, index) => ({
      filename: file.originalname,
      buffer: file.buffer,
      mimetype: file.mimetype,
      student: id,
      needsTranslation: needsTranslationArray[index],
      language: languageArray[index],
      purpose,
    }));

    const saved = await Transcript.insertMany(submissions);
    res.json({ message: "Transcripts submitted", data: saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Submission failed" });
  }
});

router.get("/mine", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const { id } = jwt.verify(token, process.env.JWT_SECRET);
  const submissions = await Transcript.find({ student: id });
  res.json(submissions);
});

module.exports = router;
