//Backend/servers.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

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

app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/transcripts", require("./routes/transcriptRoutes"));
app.use("/api/institution", require("./routes/institutionRoutes"));
app.use("/api/institutions", require("./routes/institutions"));
app.use("/api/transcripts", require("./routes/addDocumentsRoute"));
app.use("/api/translation-requests", require("./routes/translationRequestRoutes"));
app.use("/api/stripe", require("./routes/stripeWebhook"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/webhooks", require("./routes/webhookRoutes"));
app.use("/api/admin/transcripts",   require("./routes/admin/transcripts"));
app.use("/api/admin/institutions",  require("./routes/admin/institutions"));
app.use("/api/admin/reports",       require("./routes/admin/reports"));
app.use("/api/admin/auth", require("./routes/admin/auth"));
app.use("/api/admin/translation-requests", require("./routes/admin/translationRequests"));
app.use("/api/admin", require("./routes/admin/me"));
app.use("/api/admin/assignments", require("./routes/admin/assignments"));
app.use("/api/admin/users", require("./routes/admin/users"));
app.use("/api/admin", require("./routes/admin/adminOfficialRoutes"));
app.use("/api/admin", require("./routes/admin/adminRoutes"));
app.use("/api/admin", require("./routes/admin/institutionAccess"));






// Serve frontend
app.use(express.static(path.join(__dirname, "../frontend/build")));

app.get(/(.*)/, (req, res) => {
  res.sendFile(path.resolve(__dirname, "../frontend/build/index.html"));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
