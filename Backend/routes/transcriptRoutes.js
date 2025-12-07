
//routes/TranscriptRoutes
const express = require("express");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Transcript = require("../models/Transcript");
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });
const pdfParse = require("pdf-parse");

// Submit initial transcript package
router.post("/submit", upload.array("files"), async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const { id } = jwt.verify(token, process.env.JWT_SECRET);

    const { purpose, translationFlags, sourceLanguages, submissionMethod } = req.body;

    const flags = JSON.parse(translationFlags);
    const langs = JSON.parse(sourceLanguages);

   // console.log("Files received:", req.files.length);
    console.log("Translation Flags:", flags);
    console.log("Source Languages:", langs);

    const submissionId = new mongoose.Types.ObjectId().toString();

    const documents = await Promise.all(
      req.files.map(async (file, index) => {
        let pageCount = 1; // default for images

        if (file.mimetype === "application/pdf") {
          const pdfData = await pdfParse(file.buffer);
          pageCount = pdfData.numpages || 1;
        }

        return {
          filename: file.originalname,
          buffer: file.buffer,
          mimetype: file.mimetype,
          needsTranslation: flags[index],
          sourceLanguage: langs[index],
          pageCount, // ✅ save here
        };
      })
    );

    const transcript = new Transcript({
      submissionId,
      student: id,
      submissionMethod,
      purpose,
      documents,
    });

    await transcript.save();
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

    const submissions = await Transcript.find({ student: id }).sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    console.error(err);
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

    const flags = req.body.translationFlags
      ? JSON.parse(req.body.translationFlags).map(flag => flag === "yes")
      : [];
    const langs = req.body.sourceLanguages
      ? JSON.parse(req.body.sourceLanguages)
      : [];

    const newDocs = await Promise.all(
  req.files.map(async (file, idx) => {
    let pageCount = 1;
    if (file.mimetype === "application/pdf") {
      const pdfData = await pdfParse(file.buffer);
      pageCount = pdfData.numpages || 1;
    }
    return {
      filename: file.originalname,
      buffer: file.buffer,
      mimetype: file.mimetype,
      needsTranslation: flags[idx] || false,
      sourceLanguage: langs[idx] || null,
      pageCount,
    };
  })
);

    const updated = await Transcript.findOneAndUpdate(
      { submissionId: req.params.submissionId, student: studentId },
      { $push: { documents: { $each: newDocs } } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Submission not found" });
    }

    res.json({ message: "Documents added successfully", updated });
  } catch (err) {
    console.error("Error adding documents:", err);
    res.status(500).json({ error: "Failed to add documents" });
  }
});
// Delete file
router.delete("/:submissionId/document/:documentIndex", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { id: studentId } = jwt.verify(token, process.env.JWT_SECRET);

    const { submissionId, documentIndex } = req.params;

    // Find the submission
    const submission = await Transcript.findOne({
      submissionId,
      student: studentId,
    });

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    if (
      !submission.documents ||
      documentIndex < 0 ||
      documentIndex >= submission.documents.length
    ) {
      return res.status(400).json({ error: "Invalid document index" });
    }

    // Remove the document from array
    submission.documents.splice(documentIndex, 1);

    // If there are no documents left, delete the entire submission
    if (submission.documents.length === 0) {
      await Transcript.deleteOne({ _id: submission._id });
      return res.json({ message: "Document removed, submission deleted as it had no remaining documents." });
    }

    // Otherwise, save updated submission
    await submission.save();
    res.json({ message: "Document removed successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete document." });
  }
});

module.exports = router;
