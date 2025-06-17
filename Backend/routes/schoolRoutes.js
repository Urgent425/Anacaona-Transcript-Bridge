const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "School API is working" });
});

module.exports = router;