const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;
const path = require("path");
require("dotenv").config();
const connectDB = require("./config/db");
connectDB();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/transcripts", require("./routes/transcriptRoutes"));
app.use("/api/schools", require("./routes/schoolRoutes"));
app.use("/api/transcripts", require("./routes/addDocumentsRoute"));
app.use("/api/translation-requests", require("./routes/translationRequestRoutes"));

// Serve frontend
app.use(express.static(path.join(__dirname, "../frontend/build")));

app.get(/(.*)/, (req, res) => {
  res.sendFile(path.resolve(__dirname, "../frontend/build/index.html"));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
