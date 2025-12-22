// backend/middleware/uploadMemory.js
const multer = require("multer");

module.exports = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB per file (adjust)
    files: 10,
  },
});
