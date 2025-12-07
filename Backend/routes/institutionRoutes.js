// backend/routes/institutionRoutes.js
const express                = require("express");
const mongoose               = require("mongoose");
const Transcript             = require("../models/Transcript");
const { protectInstitution } = require("../middleware/protectInstitution");
const multer                = require("multer");
const path                  = require("path");
const fs                    = require("fs");

const router                 = express.Router();

router.use(protectInstitution);

 // ──────────────────────────────────────────────────────────
 // Local storage for official uploads (swap to S3/GridFS later if you want)
const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "official");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    // PDFs only by default
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

// ---------------------------------------------------------------------------
// GET /api/institution/submissions  (unchanged)
router.get("/submissions", async (req, res, next) => {
  try {
    const instId = req.institution._id;
    const {
      status   = "pending",
      q        = "",
      page     = 1,
      pageSize = 10,
    } = req.query;

    const allowed = ["pending","approved","rejected"];
    const statusFilter = allowed.includes(String(status).toLowerCase())
      ? String(status).toLowerCase()
      : "pending";

    const pageN = Math.max(1, parseInt(page));
    const sizeN = Math.max(1, Math.min(100, parseInt(pageSize)));

    const match = {
      submissionMethod:   "digital",
      approvalStatus:     statusFilter,
      assignedInstitution: new mongoose.Types.ObjectId(instId),
    };

    const pipeline = [
      { $match: match },
      { $lookup: { from: "users", localField: "student", foreignField: "_id", as: "student" } },
      { $unwind: "$student" },
    ];

    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), "i");
      pipeline.push({
        $match: {
          $or: [
            { "student.firstName": regex },
            { "student.lastName":  regex },
            { "student.email":     regex },
            { submissionId:        regex },
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
          createdAt: 1,
          assignedInstitution: 1,
          "student._id": 1,
          "student.firstName": 1,
          "student.lastName": 1,
          "student.email": 1,
          documents: {
            $map: {
              input: "$documents",
              as: "d",
              in: {
                filename: "$$d.filename",
                mimetype: "$$d.mimetype",
                needsTranslation: "$$d.needsTranslation",
                pageCount: "$$d.pageCount",
              }
            }
          }
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          items: [ { $skip: (pageN - 1) * sizeN }, { $limit: sizeN } ],
          total: [ { $count: "count" } ],
        }
      }
    );

    const [result] = await Transcript.aggregate(pipeline).exec();
    const items = (result.items || []).map(row => ({
      _id: row._id,
      submissionId: row.submissionId,
      purpose: row.purpose,
      approvalStatus: row.approvalStatus,
      createdAt: row.createdAt,
      student: {
        _id: row.student?._id,
        firstName: row.student?.firstName,
        lastName: row.student?.lastName,
        email: row.student?.email,
      },
      documents: row.documents || [],
    }));
    const total = result.total?.[0]?.count || 0;

    res.json({ items, total, page: pageN, pageSize: sizeN });
  } catch (err) {
    console.error("Error listing institution submissions:", err);
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/institution/submissions/:id  (unchanged)
router.get("/submissions/:id", async (req, res, next) => {
  try {
    const instId = req.institution._id;
    const sub = await Transcript.findOne({
      _id: req.params.id,
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

// ---------------------------------------------------------------------------
// POST /api/institution/submissions/:id/approve  (unchanged)
router.post("/submissions/:id/approve", async (req, res, next) => {
  try {
    const instId = req.institution._id;
    const sub = await Transcript.findOne({
      _id: req.params.id,
      assignedInstitution: instId,
    });
    if (!sub) return res.status(404).json({ message: "Not found" });

    sub.approvalStatus = "approved";
    sub.approver = {
      name:        req.institution.name,
      role:        "Institution",
      institution: instId,
      timestamp:   new Date(),
    };
    await sub.save();
    res.json({ message: "Approved" });
  } catch (err) {
    console.error("Approve error:", err);
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/institution/submissions/:id/reject  (unchanged)
router.post("/submissions/:id/reject", async (req, res, next) => {
  try {
    const instId = req.institution._id;
    const { reason } = req.body || {};
    const sub = await Transcript.findOne({
      _id: req.params.id,
      assignedInstitution: instId,
    });
    if (!sub) return res.status(404).json({ message: "Not found" });

    sub.approvalStatus  = "rejected";
    sub.rejectionReason = reason;
    sub.approver = {
      name:        req.institution.name,
      role:        "Institution",
      institution: instId,
      timestamp:   new Date(),
    };
    await sub.save();
    res.json({ message: "Rejected" });
  } catch (err) {
    console.error("Reject error:", err);
    next(err);
  }
});

// ──────────────────────────────────────────────────────────
// NEW: POST /api/institution/submissions/:id/official-upload
router.post(
  "/submissions/:id/official-upload",
  upload.single("file"), // expects field name "file"
  async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!ensureObjectId(res, id)) return;

      const instId = req.institution._id;
      const userId = req.user.id;

      const sub = await Transcript.findOne({
        _id: id,
        assignedInstitution: instId,
      });
      if (!sub) return res.status(404).json({ message: "Not found" });

      // Optional policy: require approved first
      if (sub.approvalStatus !== "approved") {
        return res.status(400).json({ message: "Transcript must be approved before uploading official files" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      sub.officialUploads.push({
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        storagePath: req.file.path,
        uploadedBy: {
          userId,
          name: req.user.name,
          institution: instId,
        },
      });

      await sub.save();

      res.status(201).json({
        message: "Official transcript uploaded",
        file: {
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// NEW: GET /api/institution/submissions/:id/officials  (list)
router.get("/submissions/:id/officials", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!ensureObjectId(res, id)) return;

    const instId = req.institution._id;

    const sub = await Transcript.findOne({
      _id: id,
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

// NEW: GET /api/institution/submissions/:id/officials/:idx/download
router.get("/submissions/:id/officials/:idx/download", async (req, res, next) => {
  try {
    const { id, idx } = req.params;
    if (!ensureObjectId(res, id)) return;

    const instId = req.institution._id;
    const sub = await Transcript.findOne({
      _id: id,
      assignedInstitution: instId,
    }).select("officialUploads");
    if (!sub) return res.status(404).json({ message: "Not found" });

    const i = parseInt(idx, 10);
    const file = sub.officialUploads?.[i];
    if (!file) return res.status(404).json({ message: "File not found" });

    res.setHeader("Content-Type", file.mimetype || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(file.filename)}"`);
    fs.createReadStream(file.storagePath).pipe(res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
