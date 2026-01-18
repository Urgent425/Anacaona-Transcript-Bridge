// //Backend/servers.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

const connectDB = require("./config/db");
connectDB();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

/**
 * ✅ Webhooks MUST be mounted BEFORE express.json()
 * Translation-only webhook:
 *   POST /api/webhooks/stripe/webhook
 *
 * Evaluation webhook:
 *   POST /api/webhooks/eval/stripe
 */
app.use("/api/webhooks/stripe", require("./routes/stripeWebhook"));
app.use("/api/webhooks/eval", require("./routes/webhookRoutes"));

// Now apply JSON body parsing for all other routes
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/transcripts", require("./routes/transcriptRoutes"));
app.use("/api/institution", require("./routes/institutionRoutes"));
app.use("/api/institutions", require("./routes/institutions"));
app.use("/api/transcripts", require("./routes/addDocumentsRoute"));
app.use("/api/translation-requests", require("./routes/translationRequestRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));

app.use("/api/admin/transcripts", require("./routes/admin/transcripts"));
app.use("/api/admin/institutions", require("./routes/admin/institutions"));
app.use("/api/admin/reports", require("./routes/admin/reports"));
app.use("/api/admin/auth", require("./routes/admin/auth"));
app.use("/api/admin/translation-requests", require("./routes/admin/translationRequests"));
app.use("/api/admin", require("./routes/admin/me"));
app.use("/api/admin/assignments", require("./routes/admin/assignments"));
app.use("/api/admin/users", require("./routes/admin/users"));
app.use("/api/admin", require("./routes/admin/adminOfficialRoutes"));
app.use("/api/admin", require("./routes/admin/adminRoutes"));
app.use("/api/admin", require("./routes/admin/institutionAccess"));

app.use("/api/users", require("./routes/userRoutes"));

// Serve frontend build only if it exists (single-server deployments)
const buildPath = path.join(__dirname, "../Frontend/build");
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));

  // Express 5-safe catch-all route
  app.get("/*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
} else {
  console.log("Frontend build not found. Skipping static file serving.");
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
