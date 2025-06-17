const express = require("express");
const router = express.Router();

// Placeholder: You can expand this with real logic later
router.get("/", (req, res) => {
  res.json({ message: "Transcript API is working" });
});

module.exports = router;