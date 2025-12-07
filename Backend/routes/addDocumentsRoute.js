
const express = require("express");
const router = express.Router();
const Transcript = require("../models/Transcript");
const multer = require("multer");
const jwt = require("jsonwebtoken");

const storage = multer.memoryStorage();
const upload = multer().array("files");

router.post("/:submissionId/add-documents", upload, async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const { id } = jwt.verify(token, process.env.JWT_SECRET);

    const { submissionId } = req.params;
    const files = req.files;
    const needsTranslation = req.body.needsTranslation;
    const sourceLanguages = req.body.sourceLanguages;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    // Normalize needsTranslation and sourceLanguages as arrays
    const needsArray = Array.isArray(needsTranslation)
      ? needsTranslation
      : [needsTranslation];
    const langArray = Array.isArray(sourceLanguages)
      ? sourceLanguages
      : [sourceLanguages];

    const newDocs = files.map((file, index) => ({
      filename: file.originalname,
      buffer: file.buffer,
      mimetype: file.mimetype,
      student: id,
      status: "Pending",
      needsTranslation: needsArray[index] === "true" || needsArray[index] === true,
      sourceLanguage: needsArray[index] === "true" || needsArray[index] === true
        ? langArray[index]
        : null,
      submittedAt: new Date(),
    }));

    // Insert new documents under the same submission reference
    await Transcript.insertMany(newDocs);

    res.status(200).json({ message: "Documents added successfully." });
  } catch (error) {
    console.error("Add documents error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
