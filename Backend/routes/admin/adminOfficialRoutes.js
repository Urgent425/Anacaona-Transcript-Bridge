// backend/routes/admin/adminOfficialRoutes.js
const express = require("express");
const router = express.Router();
const fs = require("fs");
const mongoose = require("mongoose");
const Transcript = require("../../models/Transcript");
const requireAdmin = require("../../middleware/requireAdmin");

router.use(requireAdmin);

// GET /api/admin/officials  — list official files (filters)
router.get("/officials", async (req, res, next) => {
  try {
    const {
      status = "clean",            // pending_scan | clean | infected | ALL
      q = "",                      // search by submissionId or student email/name (optional)
      page = 1,
      pageSize = 20,
    } = req.query;

    const pageN = Math.max(1, parseInt(page));
    const sizeN = Math.max(1, Math.min(100, parseInt(pageSize)));

    const match = {};
    if (status && status !== "ALL") {
      match["officialUploads.status"] = status;
    }

    const pipeline = [
      { $match: { officialUploads: { $exists: true, $ne: [] } } },
      // student join (optional search)
      { $lookup: { from: "users", localField: "student", foreignField: "_id", as: "student" } },
      { $unwind: "$student" },
    ];

    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), "i");
      pipeline.push({ $match: { $or: [
        { submissionId: regex },
        { "student.firstName": regex },
        { "student.lastName":  regex },
        { "student.email":     regex },
      ] }});
    }

    // flatten + filter by upload status
    pipeline.push(
      { $unwind: "$officialUploads" },
      ...(status && status !== "ALL" ? [{ $match: { "officialUploads.status": status } }] : []),
      { $sort: { "officialUploads.uploadedAt": -1 } },
      {
        $project: {
          transcriptId: "$_id",
          submissionId: 1,
          student: { firstName: "$student.firstName", lastName: "$student.lastName", email: "$student.email" },
          upload: "$officialUploads",
        }
      },
      {
        $facet: {
          items: [ { $skip: (pageN - 1) * sizeN }, { $limit: sizeN } ],
          total: [ { $count: "count" } ],
        }
      }
    );

    const [resu] = await Transcript.aggregate(pipeline).exec();
    res.json({ items: resu.items || [], total: resu.total?.[0]?.count || 0, page: pageN, pageSize: sizeN });
  } catch (err) { next(err); }
});

// GET /api/admin/officials/:transcriptId/:version/download  — download by version
router.get("/officials/:transcriptId/:version/download", async (req, res, next) => {
  try {
    const { transcriptId, version } = req.params;
    if (!mongoose.Types.ObjectId.isValid(transcriptId)) {
      return res.status(400).json({ message: "Invalid transcript id" });
    }
    const sub = await Transcript.findById(transcriptId).select("officialUploads submissionId").lean();
    if (!sub) return res.status(404).json({ message: "Not found" });

    const file = (sub.officialUploads || []).find(u => (u.version || 1) === Number(version));
    if (!file) return res.status(404).json({ message: "File not found" });

    // Optional policy: only allow clean
    if (file.status !== "clean") {
      return res.status(400).json({ message: `File not available (status: ${file.status})` });
    }

    res.setHeader("Content-Type", file.mimetype || "application/pdf");
    const name = `${sub.submissionId || sub._id}-v${file.version}-${file.filename}`;
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(name)}"`);
    fs.createReadStream(file.storagePath).pipe(res);
  } catch (err) { next(err); }
});

module.exports = router;
