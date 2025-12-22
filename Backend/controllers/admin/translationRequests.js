// controllers/admin/translationRequests.js
const path = require("path");
const TranslationRequest = require("../../models/TranslationRequest");
const { signedGetUrl } = require("../../services/r2Storage");


function safeLower(v) {
  return String(v || "").toLowerCase().trim();
}

function isAllowedStatus(s) {
  return ["pending", "locked", "paid", "completed"].includes(s);
}

function normalizeDeliveryMethod(v) {
  const s = safeLower(v);
  if (!s) return null;
  if (s === "hard copy" || s === "hardcopy" || s === "mail" || s === "shipping") return "hard copy";
  if (s === "both") return "both";
  if (s === "email" || s === "digital") return "email";
  return s;
}

function requiresShipping(deliveryMethod) {
  const dm = normalizeDeliveryMethod(deliveryMethod);
  return dm === "hard copy" || dm === "both";
}

function buildStudentName(student) {
  const first = student?.firstName || "";
  const last = student?.lastName || ""; // may not be populated today; safe
  const full = `${first} ${last}`.trim();
  return full || first || student?.email || "—";
}

/**
 * Convert a TranslationRequest doc into the "job" shape expected by TranslationQueuePage.jsx
 */
function toJobShape(doc) {
  const student = doc.student || {};
  const admin = doc.adminAssignee || null;

  const files = Array.isArray(doc.files) ? doc.files : [];
  const firstFile = files[0];

  const deliveryMethod = normalizeDeliveryMethod(doc.deliveryMethod);

  // Preferred: request-level shippingAddress (recommended)
  // Fallback: student.address (legacy string) => becomes address1
  const requestAddr = doc.shippingAddress || doc.deliveryAddress || null;

  let shippingAddress = null;
  if (requiresShipping(deliveryMethod)) {
    if (requestAddr && typeof requestAddr === "object") {
      shippingAddress = {
        name: requestAddr.name || buildStudentName(student),
        address1: requestAddr.address1 || "",
        address2: requestAddr.address2 || "",
        city: requestAddr.city || "",
        state: requestAddr.state || "",
        country: requestAddr.country || "USA",
        zip: requestAddr.zip || "",
        phone: requestAddr.phone || student.phone || "",
      };
    } else {
      // legacy fallback if you still only have student.address as a string
      shippingAddress = {
        name: buildStudentName(student),
        address1: student.address || "",
        address2: "",
        city: "",
        state: "",
        country: "USA",
        zip: "",
        phone: student.phone || "",
      };
    }
  }

  const docName =
    firstFile?.filename
      ? (files.length === 1 ? firstFile.filename : `${firstFile.filename} (+${files.length - 1})`)
      : (files.length ? `${files.length} file(s)` : "—");

  return {
    _id: String(doc._id),
    requestId: doc.requestId || String(doc._id),

    studentName: buildStudentName(student),
    studentEmail: student.email || "—",

    documentName: docName,
    fromLang: doc.sourceLanguage || "—",
    toLang: doc.targetLanguage || "—",

    status: doc.status || "pending",
    assignee: admin?.name || "",

    createdAt: doc.createdAt,

    deliveryMethod: deliveryMethod || null,
    shippingAddress, // null if not required
  };
}

exports.listTranslationRequests = async (req, res, next) => {
  try {
    const status = safeLower(req.query.status);
    const filter = {};

    if (status && status !== "all") {
      if (!isAllowedStatus(status)) {
        return res.status(400).json({ error: "Invalid status filter" });
      }
      filter.status = status;
    }

    const list = await TranslationRequest.find(filter)
      // include lastName if you have it on User; harmless if not present
      .populate("student", "firstName lastName email address phone")
      .populate("adminAssignee", "name role")
      .sort({ createdAt: -1 })
      .lean();

    // Map into UI jobs
    const jobs = list.map(toJobShape);

    res.json(jobs);
  } catch (err) {
    next(err);
  }
};

exports.getTranslationRequest = async (req, res, next) => {
  try {
    const doc = await TranslationRequest.findById(req.params.id)
      .populate("student", "firstName lastName email address phone")
      .populate("adminAssignee", "name role");

    if (!doc) return res.status(404).json({ error: "Not found" });

    // If you want: return raw doc (current behavior)
    // res.json(doc);

    // Better for UI consistency: return job shape + raw
    res.json({
      job: toJobShape(doc),
      raw: doc,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // "pending" | "locked" | "paid" | "completed"
    const s = safeLower(status);
    if (!isAllowedStatus(s)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const doc = await TranslationRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });

    doc.status = s;
    await doc.save();

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

exports.setLocked = async (req, res, next) => {
  try {
    const { locked } = req.body; // boolean
    const doc = await TranslationRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });

    doc.locked = !!locked;

    // Keep consistent: locked => status locked; unlocked => back to pending (only if it wasn't paid/completed)
    if (doc.locked) {
      doc.status = "locked";
    } else if (doc.status === "locked") {
      doc.status = "pending";
    }

    await doc.save();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

exports.downloadFile = async (req, res, next) => {
  try {
    const { id, index } = req.params;
    const i = Number(index);

    const doc = await TranslationRequest.findById(id).select("files");
    if (!doc || !Array.isArray(doc.files) || !doc.files[i]) {
      return res.status(404).json({ error: "File not found" });
    }

    const f = doc.files[i];
    if (!f.key) return res.status(400).json({ error: "Missing R2 key on file." });

    const url = await signedGetUrl({ key: f.key });
    return res.json({ url }); // ✅ stable
  } catch (err) {
    next(err);
  }
};