// backend/routes/institutionRoutes.js
const express = require("express");
const mongoose = require("mongoose");
const Transcript = require("../models/Transcript");
const { protectInstitution } = require("../middleware/protectInstitution");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { buildKey, uploadBuffer, signedGetUrl } = require("../services/r2Storage");

const router = express.Router();
router.use(protectInstitution);

/* ──────────────────────────────────────────────────────────
   Local storage for official uploads (swap to S3/GridFS later)
─────────────────────────────────────────────────────────── */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") return cb(null, true);
    return cb(new Error("Only PDF files are allowed"));
  },
});


function ensureObjectId(res, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid submission id" });
    return false;
  }
  return true;
}

function safeFilename(name) {
  return String(name || "file.pdf").replace(/[\\/]/g, "_");
}

/* ──────────────────────────────────────────────────────────
   GET /api/institution/submissions
   (Aligned with new InstitutionDashboard.jsx)
   Returns { items, total, page, pageSize }
   Adds official upload summary fields for progress badges.
─────────────────────────────────────────────────────────── */
router.get("/submissions", async (req, res, next) => {
  try {
    const instId = req.institution._id;

    const {
      status = "pending",
      q = "",
      page = 1,
      pageSize = 10,

      // Optional: allow method override later; default is digital per your workflow
      method,
    } = req.query;

    const allowed = ["pending", "approved", "rejected"];
    const statusFilter = allowed.includes(String(status).toLowerCase())
      ? String(status).toLowerCase()
      : "pending";

    const pageN = Math.max(1, parseInt(page, 10) || 1);
    const sizeN = Math.max(1, Math.min(100, parseInt(pageSize, 10) || 10));

    // Default: institution handles digital approval flow
    const methodFilter =
      typeof method === "string" && ["digital", "sealed"].includes(method)
        ? method
        : "digital";

    const match = {
      approvalStatus: statusFilter,
      assignedInstitution: new mongoose.Types.ObjectId(instId),
      submissionMethod: methodFilter,
    };

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: "users",
          localField: "student",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
    ];

    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), "i");
      pipeline.push({
        $match: {
          $or: [
            { "student.firstName": regex },
            { "student.lastName": regex },
            { "student.email": regex },
            { submissionId: regex },
          ],
        },
      });
    }

    pipeline.push(
      {
        $project: {
          submissionId: 1,
          purpose: 1,
          approvalStatus: 1,
          rejectionReason: 1,
          createdAt: 1,
          updatedAt: 1,
          submissionMethod: 1,

          "student._id": 1,
          "student.firstName": 1,
          "student.lastName": 1,
          "student.email": 1,

          // Documents: lightweight meta only (NO buffer)
          documents: {
            $map: {
              input: { $ifNull: ["$documents", []] },
              as: "d",
              in: {
                filename: "$$d.filename",
                mimetype: "$$d.mimetype",
                needsTranslation: "$$d.needsTranslation",
                pageCount: "$$d.pageCount",
              },
            },
          },

          // Official upload summary for UI badges / stepper
          officialUploadsCount: {
            $size: { $ifNull: ["$officialUploads", []] },
          },
          latestOfficial: { $arrayElemAt: ["$officialUploads", -1] },
        },
      },
      {
        $addFields: {
          latestOfficialStatus: "$latestOfficial.status",
          latestOfficialUploadedAt: "$latestOfficial.uploadedAt",
        },
      },
      { $unset: "latestOfficial" },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          items: [{ $skip: (pageN - 1) * sizeN }, { $limit: sizeN }],
          total: [{ $count: "count" }],
        },
      }
    );

    const [result] = await Transcript.aggregate(pipeline).exec();

    const items = (result?.items || []).map((row) => ({
      _id: row._id,
      submissionId: row.submissionId,
      purpose: row.purpose,
      approvalStatus: row.approvalStatus,
      rejectionReason: row.rejectionReason,
      submissionMethod: row.submissionMethod,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,

      officialUploadsCount:
        typeof row.officialUploadsCount === "number" ? row.officialUploadsCount : 0,
      latestOfficialStatus: row.latestOfficialStatus || null,
      latestOfficialUploadedAt: row.latestOfficialUploadedAt || null,

      student: {
        _id: row.student?._id,
        firstName: row.student?.firstName,
        lastName: row.student?.lastName,
        email: row.student?.email,
      },
      documents: row.documents || [],
    }));

    const totalCount = result?.total?.[0]?.count || 0;

    res.json({ items, total: totalCount, page: pageN, pageSize: sizeN });
  } catch (err) {
    console.error("Error listing institution submissions:", err);
    next(err);
  }
});

/* ──────────────────────────────────────────────────────────
   GET /api/institution/submissions/:id
   Returns full submission details (no documents.buffer)
─────────────────────────────────────────────────────────── */
router.get("/submissions/:id", async (req, res, next) => {
  try {
    const instId = req.institution._id;
    const subId = req.params.id;
    if (!ensureObjectId(res, subId)) return;

    const sub = await Transcript.findOne({
      _id: subId,
      assignedInstitution: instId,
    })
      .populate("student", "firstName lastName email")
      .select("-documents.buffer")
      .lean();

    if (!sub) return res.status(404).json({ message: "Not found" });
    res.json(sub);
  } catch (err) {
    console.error("Get submission error:", err);
    next(err);
  }
});

/* ──────────────────────────────────────────────────────────
   POST /api/institution/submissions/:id/approve
─────────────────────────────────────────────────────────── */
router.post("/submissions/:id/approve", async (req, res, next) => {
  try {
    const instId = req.institution._id;
    const subId = req.params.id;
    if (!ensureObjectId(res, subId)) return;

    const sub = await Transcript.findOne({
      _id: subId,
      assignedInstitution: instId,
    });

    if (!sub) return res.status(404).json({ message: "Not found" });

    sub.approvalStatus = "approved";
    sub.rejectionReason = undefined;

    sub.approver = {
      name: req.institution.name,
      role: "Institution",
      institution: instId,
      timestamp: new Date(),
    };

    await sub.save();
    res.json({ message: "Approved" });
  } catch (err) {
    console.error("Approve error:", err);
    next(err);
  }
});

/* ──────────────────────────────────────────────────────────
   POST /api/institution/submissions/:id/reject
─────────────────────────────────────────────────────────── */
router.post("/submissions/:id/reject", async (req, res, next) => {
  try {
    const instId = req.institution._id;
    const subId = req.params.id;
    if (!ensureObjectId(res, subId)) return;

    const { reason } = req.body || {};
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const sub = await Transcript.findOne({
      _id: subId,
      assignedInstitution: instId,
    });

    if (!sub) return res.status(404).json({ message: "Not found" });

    sub.approvalStatus = "rejected";
    sub.rejectionReason = String(reason).trim();

    sub.approver = {
      name: req.institution.name,
      role: "Institution",
      institution: instId,
      timestamp: new Date(),
    };

    await sub.save();
    res.json({ message: "Rejected" });
  } catch (err) {
    console.error("Reject error:", err);
    next(err);
  }
});

/* ──────────────────────────────────────────────────────────
   POST /api/institution/submissions/:id/official-upload
   Upload official PDF for approved submission
─────────────────────────────────────────────────────────── */
router.post(
  "/submissions/:id/official-upload",
  upload.single("file"),
  async (req, res, next) => {
    try {
      const subId = req.params.id;
      if (!ensureObjectId(res, subId)) return;

      const instId = req.institution._id;
      const userId = req.user?.id;

      const sub = await Transcript.findOne({
        _id: subId,
        assignedInstitution: instId,
      });

      if (!sub) return res.status(404).json({ message: "Not found" });

      // policy: must be approved
      if (sub.approvalStatus !== "approved") {
        return res.status(400).json({
          message: "Transcript must be approved before uploading official files",
        });
      }

      if (!req.file) return res.status(400).json({ message: "No file uploaded" });

      // ✅ Upload to R2
      const submissionKeyPart = sub.submissionId || String(sub._id);
      const key = buildKey({
        prefix: "official-uploads",
        requestId: submissionKeyPart,
        originalName: req.file.originalname,
      });

      await uploadBuffer({
        key,
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
      });

      const nextVersion = (sub.officialUploads?.length || 0) + 1;

      sub.officialUploads.push({
        filename: safeFilename(req.file.originalname),
        mimetype: req.file.mimetype,
        size: req.file.size,
        // storagePath: undefined, // legacy; do not write new disk path
        bucket: process.env.R2_BUCKET,
        key,
        reason: "initial",
        note: "",
        version: nextVersion,
        status: "pending_scan",
        uploadedAt: new Date(),
        uploadedBy: {
          userId,
          name: req.user?.name || req.institution?.name || "Institution",
          institution: instId,
        },
      });

      await sub.save();

      return res.status(201).json({
        message: "Official transcript uploaded",
        file: {
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          version: nextVersion,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);


/* ──────────────────────────────────────────────────────────
   GET /api/institution/submissions/:id/officials
   List official uploads
─────────────────────────────────────────────────────────── */
router.get("/submissions/:id/officials", async (req, res, next) => {
  try {
    const subId = req.params.id;
    if (!ensureObjectId(res, subId)) return;

    const instId = req.institution._id;

    const sub = await Transcript.findOne({
      _id: subId,
      assignedInstitution: instId,
    })
      .select("officialUploads")
      .lean();

    if (!sub) return res.status(404).json({ message: "Not found" });
    res.json({ items: sub.officialUploads || [] });
  } catch (err) {
    next(err);
  }
});

/* ──────────────────────────────────────────────────────────
   GET /api/institution/submissions/:id/officials/:idx/download
   Download official upload by index (kept for current frontend)
─────────────────────────────────────────────────────────── */
router.get("/submissions/:id/officials/:idx/download", async (req, res, next) => {
  try {
    const { id: subId, idx } = req.params;
    if (!ensureObjectId(res, subId)) return;

    const instId = req.institution._id;

    const sub = await Transcript.findOne({
      _id: subId,
      assignedInstitution: instId,
    }).select("officialUploads");

    if (!sub) return res.status(404).json({ message: "Not found" });

    const i = parseInt(idx, 10);
    if (Number.isNaN(i) || i < 0) {
      return res.status(400).json({ message: "Invalid file index" });
    }

    const file = sub.officialUploads?.[i];
    if (!file) return res.status(404).json({ message: "File not found" });

    // ✅ Preferred: R2 signed URL
    if (file.key) {
      const url = await signedGetUrl({ key: file.key });
      return res.json({ url });
    }

    // Legacy fallback (disk) - optional, keep if you want:
    if (file.storagePath && fs.existsSync(file.storagePath)) {
      res.setHeader("Content-Type", file.mimetype || "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(safeFilename(file.filename))}"`
      );
      return fs.createReadStream(file.storagePath).pipe(res);
    }

    return res.status(404).json({ message: "Stored file missing (no key and no local file)" });
  } catch (err) {
    next(err);
  }
});


/* ──────────────────────────────────────────────────────────
   OPTIONAL / RECOMMENDED:
   Download official upload by its ObjectId (stable)
   (Frontend can switch later; does not break anything now.)
─────────────────────────────────────────────────────────── */
router.get("/submissions/:id/officials/by-id/:fileId/download", async (req, res, next) => {
  try {
    const { id: subId, fileId } = req.params;
    if (!ensureObjectId(res, subId)) return;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ message: "Invalid file id" });
    }

    const instId = req.institution._id;

    const sub = await Transcript.findOne({
      _id: subId,
      assignedInstitution: instId,
    }).select("officialUploads");

    if (!sub) return res.status(404).json({ message: "Not found" });

    const file = (sub.officialUploads || []).find((f) => String(f._id) === String(fileId));
    if (!file) return res.status(404).json({ message: "File not found" });

    if (file.key) {
      const url = await signedGetUrl({ key: file.key });
      return res.json({ url });
    }

    if (file.storagePath && fs.existsSync(file.storagePath)) {
      res.setHeader("Content-Type", file.mimetype || "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(safeFilename(file.filename))}"`
      );
      return fs.createReadStream(file.storagePath).pipe(res);
    }

    return res.status(404).json({ message: "Stored file missing (no key and no local file)" });
  } catch (err) {
    next(err);
  }
});

// GET /api/institution/submissions/:id/documents/:idx/download
// Download student-uploaded document by index (R2 signed URL)
router.get("/submissions/:id/documents/:idx/download", async (req, res, next) => {
  try {
    const instId = req.institution._id;
    const subId = req.params.id;
    const idx = parseInt(req.params.idx, 10);

    if (!ensureObjectId(res, subId)) return;
    if (Number.isNaN(idx) || idx < 0) {
      return res.status(400).json({ message: "Invalid document index" });
    }

    // IMPORTANT: only allow institutions to access submissions assigned to them
    const sub = await Transcript.findOne({
      _id: subId,
      assignedInstitution: instId,
    })
      // do not return buffers
      .select("documents submissionId")
      .lean();

    if (!sub) return res.status(404).json({ message: "Not found" });

    const docs = Array.isArray(sub.documents) ? sub.documents : [];
    const doc = docs[idx];
    if (!doc) return res.status(404).json({ message: "File not found" });

    // Prefer R2 fields (you should store these on each document)
    // Example expected fields: doc.key (and optional doc.bucket)
    if (doc.key) {
      const { signedGetUrl } = require("../services/r2Storage");
      const url = await signedGetUrl({ key: doc.key });
      return res.json({ url });
    }

    // Legacy fallback: if you still have buffer in DB (not recommended)
    // NOTE: this requires buffer to be queried; you currently use .lean() without buffer
    // If you need this fallback, switch to findOne() (non-lean) and select("+documents.buffer").
    return res.status(410).json({
      message: "Document not available (missing storage key). Re-upload required.",
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
