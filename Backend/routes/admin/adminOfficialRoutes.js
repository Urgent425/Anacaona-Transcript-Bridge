// backend/routes/admin/adminOfficialRoutes.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const fs = require("fs");

const Transcript = require("../../models/Transcript");
const requireAdmin = require("../../middleware/requireAdmin");
const { signedGetUrl } = require("../../services/r2Storage");

router.use(requireAdmin);

// GET /api/admin/officials
router.get("/officials", async (req, res, next) => {
  try {
    const { status = "clean", q = "", page = 1, pageSize = 20 } = req.query;

    const pageN = Math.max(1, parseInt(page, 10) || 1);
    const sizeN = Math.max(1, Math.min(100, parseInt(pageSize, 10) || 20));

    const pipeline = [
      { $match: { officialUploads: { $exists: true, $ne: [] } } },
      { $lookup: { from: "users", localField: "student", foreignField: "_id", as: "student" } },
      { $unwind: "$student" },
    ];

    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), "i");
      pipeline.push({
        $match: {
          $or: [
            { submissionId: regex },
            { "student.firstName": regex },
            { "student.lastName": regex },
            { "student.email": regex },
          ],
        },
      });
    }

    pipeline.push(
      { $unwind: "$officialUploads" },
      ...(status && status !== "ALL" ? [{ $match: { "officialUploads.status": status } }] : []),
      { $sort: { "officialUploads.uploadedAt": -1 } },
      {
        $project: {
          transcriptId: "$_id",
          submissionId: 1,
          student: {
            firstName: "$student.firstName",
            lastName: "$student.lastName",
            email: "$student.email",
          },
          upload: "$officialUploads",
        },
      },
      {
        $facet: {
          items: [{ $skip: (pageN - 1) * sizeN }, { $limit: sizeN }],
          total: [{ $count: "count" }],
        },
      }
    );

    const [resu] = await Transcript.aggregate(pipeline).exec();
    res.json({
      items: resu?.items || [],
      total: resu?.total?.[0]?.count || 0,
      page: pageN,
      pageSize: sizeN,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/officials/:transcriptId/:version/download
router.get("/officials/:transcriptId/:version/download", async (req, res, next) => {
  try {
    const { transcriptId, version } = req.params;

    if (!mongoose.Types.ObjectId.isValid(transcriptId)) {
      return res.status(400).json({ message: "Invalid transcript id" });
    }

    const sub = await Transcript.findById(transcriptId)
      .select("officialUploads submissionId")
      .lean();

    if (!sub) return res.status(404).json({ message: "Not found" });

    const ver = Number(version);
    if (!Number.isFinite(ver) || ver <= 0) {
      return res.status(400).json({ message: "Invalid version" });
    }

    const file = (sub.officialUploads || []).find((u) => Number(u.version || 1) === ver);
    if (!file) return res.status(404).json({ message: "File not found" });

    if (file.status !== "clean") {
      return res.status(400).json({ message: `File not available (status: ${file.status})` });
    }

    // Preferred: R2
    if (file.key) {
      const url = await signedGetUrl({ key: file.key, expiresInSeconds: 120 });
      return res.json({ url });
    }

    // Legacy disk fallback
    if (file.storagePath && fs.existsSync(file.storagePath)) {
      res.setHeader("Content-Type", file.mimetype || "application/pdf");
      const name = `${sub.submissionId || sub._id}-v${file.version || ver}-${file.filename || "file.pdf"}`;
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(name)}"`);
      return fs.createReadStream(file.storagePath).pipe(res);
    }

    return res.status(410).json({
      message: "Legacy disk file not available on this server. Re-upload required.",
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/officials/:transcriptId/:version/status
router.patch("/officials/:transcriptId/:version/status", async (req, res, next) => {
  try {
    const { transcriptId, version } = req.params;
    const { status } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(transcriptId)) {
      return res.status(400).json({ message: "Invalid transcript id" });
    }

    const s = String(status || "").toLowerCase().trim();
    const allowed = ["pending_scan", "clean", "infected"];
    if (!allowed.includes(s)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const sub = await Transcript.findById(transcriptId);
    if (!sub) return res.status(404).json({ message: "Not found" });

    const ver = Number(version);
    if (!Number.isFinite(ver) || ver <= 0) {
      return res.status(400).json({ message: "Invalid version" });
    }

    const file = (sub.officialUploads || []).find((u) => Number(u.version || 1) === ver);
    if (!file) return res.status(404).json({ message: "File not found" });

    file.status = s;
    await sub.save();

    return res.json({ success: true, status: s });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
