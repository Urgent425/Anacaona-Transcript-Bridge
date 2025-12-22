// backend/routes/translationRequestRoutes.js
const express = require("express");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

const TranslationRequest = require("../models/TranslationRequest");
const User = require("../models/User");
const Stripe = require("stripe");

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * IMPORTANT: Keep aligned with Frontend/src/components/constants/pricing.js
 */
const TRANSLATION_FEE_PER_PAGE_CENTS = 2500; // $25 / page
const NOTARY_FEE_CENTS = 1500;              // $15 flat
const SHIPPING_FEE_CENTS = 1000;            // $10 flat

// ─────────────────────────────────────────────────────────────
// File upload: store to disk so FileSchema.path is populated
// ─────────────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "translations");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (_req, file, cb) {
    const safeOriginal = (file.originalname || "file").replace(/[^\w.\-() ]+/g, "_");
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${safeOriginal}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB each
});

// ─────────────────────────────────────────────────────────────
// Auth helper
// ─────────────────────────────────────────────────────────────
function requireStudentId(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return { error: { code: 401, body: { error: "Unauthorized" } } };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { studentId: decoded.id };
  } catch (e) {
    return { error: { code: 401, body: { error: "Unauthorized" } } };
  }
}

// ─────────────────────────────────────────────────────────────
// Address helpers (US-only policy)
// ─────────────────────────────────────────────────────────────
function normalizeDeliveryMethod(v) {
  const s = String(v || "").toLowerCase().trim();
  if (!s) return "";
  if (s === "hardcopy" || s === "hard copy" || s === "mail" || s === "shipping") return "hard copy";
  if (s === "email" || s === "digital") return "email";
  if (s === "both") return "both";
  return s;
}

function requiresShipping(deliveryMethod) {
  const dm = normalizeDeliveryMethod(deliveryMethod);
  return dm === "hard copy" || dm === "both";
}

function normalizeCountry(v) {
  const s = String(v || "").trim().toLowerCase();
  if (!s) return "usa";
  if (["usa", "us", "u.s.", "u.s.a.", "united states", "united states of america"].includes(s)) return "usa";
  return s;
}

function isValidUsZip(zip) {
  const z = String(zip || "").trim();
  return /^\d{5}(-\d{4})?$/.test(z);
}

function buildStudentName(user) {
  const full = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  return full || user?.firstName || user?.email || "";
}

function coerceBool(v) {
  if (typeof v === "boolean") return v;
  const s = String(v || "").toLowerCase().trim();
  return s === "true" || s === "1" || s === "yes" || s === "on";
}

/**
 * Accepts either:
 * - req.body.shippingAddress as JSON string
 * - OR flat fields: shipName, shipAddress1, shipCity, shipState, shipZip, shipCountry, shipPhone, shipAddress2
 */
function parseShippingAddressFromBody(body = {}) {
  // JSON payload
  if (body.shippingAddress) {
    try {
      const obj = typeof body.shippingAddress === "string"
        ? JSON.parse(body.shippingAddress)
        : body.shippingAddress;

      if (obj && typeof obj === "object") {
        return {
          name: obj.name || "",
          address1: obj.address1 || "",
          address2: obj.address2 || "",
          city: obj.city || "",
          state: obj.state || "",
          country: obj.country || "USA",
          zip: obj.zip || "",
          phone: obj.phone || "",
        };
      }
    } catch {
      // ignore; fall back to flat fields
    }
  }

  // Flat fields fallback (front-end friendly)
  return {
    name: body.shipName || body.name || "",
    address1: body.shipAddress1 || body.address1 || "",
    address2: body.shipAddress2 || body.address2 || "",
    city: body.shipCity || body.city || "",
    state: body.shipState || body.state || "",
    country: body.shipCountry || body.country || "USA",
    zip: body.shipZip || body.zip || "",
    phone: body.shipPhone || body.phone || "",
  };
}

function validateUsShippingAddress(addr) {
  const countryNorm = normalizeCountry(addr.country);
  if (countryNorm !== "usa") {
    return "Shipping is available only in the United States (USA).";
  }
  if (!addr.name || !addr.address1 || !addr.city || !addr.state || !addr.zip || !addr.phone) {
    return "Please provide name, address1, city, state, ZIP code, and phone for shipping.";
  }
  if (!isValidUsZip(addr.zip)) {
    return "Invalid ZIP code. Use 12345 or 12345-6789 format.";
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// POST /api/translation-requests
// Create a translation request
// ─────────────────────────────────────────────────────────────
router.post("/", upload.array("files"), async (req, res) => {
  try {
    const auth = requireStudentId(req);
    if (auth.error) return res.status(auth.error.code).json(auth.error.body);
    const studentId = auth.studentId;

    const pageCounts = JSON.parse(req.body.pageCounts || "[]");

    const sourceLanguage = req.body.sourceLanguage;
    const targetLanguage = req.body.targetLanguage;
    const needNotary = coerceBool(req.body.needNotary);
    const deliveryMethod = normalizeDeliveryMethod(req.body.deliveryMethod);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    if (!sourceLanguage || !targetLanguage || !deliveryMethod) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Build file list (schema expects path)
    const files = req.files.map((file, index) => ({
      filename: file.originalname,
      mimetype: file.mimetype,
      path: file.path,
      pageCount: pageCounts[index] || 1,
    }));

    // Determine shipping address snapshot (only when required)
    let shippingAddress = null;

    if (requiresShipping(deliveryMethod)) {
      const student = await User.findById(studentId).select(
        "firstName lastName email phone address shippingAddress"
      );

      if (!student) {
        return res.status(400).json({ message: "Student not found" });
      }

      const useSavedAddress = coerceBool(req.body.useSavedAddress);

      if (useSavedAddress) {
        // Preferred: structured address
        if (student.shippingAddress && typeof student.shippingAddress === "object") {
          shippingAddress = {
            name: student.shippingAddress.name || buildStudentName(student),
            address1: student.shippingAddress.address1 || "",
            address2: student.shippingAddress.address2 || "",
            city: student.shippingAddress.city || "",
            state: student.shippingAddress.state || "",
            country: student.shippingAddress.country || "USA",
            zip: student.shippingAddress.zip || "",
            phone: student.shippingAddress.phone || student.phone || "",
          };
        } else {
          // Legacy fallback: user.address (string)
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

        const errMsg = validateUsShippingAddress(shippingAddress);
        if (errMsg) {
          return res.status(400).json({
            message:
              errMsg +
              " Please update your saved address or choose “Enter a new address.”",
            code: "INVALID_SAVED_ADDRESS",
          });
        }
      } else {
        // New address submitted in this request
        shippingAddress = parseShippingAddressFromBody(req.body);
        if (!shippingAddress.name) shippingAddress.name = buildStudentName(student);

        const errMsg = validateUsShippingAddress(shippingAddress);
        if (errMsg) {
          return res.status(400).json({ message: errMsg, code: "INVALID_SHIPPING_ADDRESS" });
        }

        // Optional: if you want to ALSO save it to user profile automatically,
        // uncomment this block.
        //
        // student.shippingAddress = shippingAddress;
        // await student.save();
      }
    }

    const request = new TranslationRequest({
      student: studentId,
      sourceLanguage,
      targetLanguage,
      needNotary: !!needNotary,
      deliveryMethod,
      shippingAddress, // <-- NEW snapshot field (make sure model has it)
      files,
      status: "pending",
      locked: false,
      paid: false,
    });

    await request.save();
    return res.status(201).json({
      message: "Translation request created successfully",
      requestId: request.requestId,
    });
  } catch (err) {
    console.error("Error creating translation request:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/translation-requests/mine
// Get the logged-in user's translation requests
// ─────────────────────────────────────────────────────────────
router.get("/mine", async (req, res) => {
  try {
    const auth = requireStudentId(req);
    if (auth.error) return res.status(auth.error.code).json(auth.error.body);
    const studentId = auth.studentId;

    const requests = await TranslationRequest.find({ student: studentId })
      .sort({ createdAt: -1 });

    return res.json(requests);
  } catch (err) {
    console.error("Error fetching translation requests:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/translation-requests/:id
// Delete a translation request (only if not locked/paid)
// ─────────────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const auth = requireStudentId(req);
    if (auth.error) return res.status(auth.error.code).json(auth.error.body);
    const studentId = auth.studentId;

    const doc = await TranslationRequest.findById(req.params.id);
    if (!doc || doc.student.toString() !== String(studentId)) {
      return res.status(403).json({ error: "Forbidden or Not Found" });
    }

    const isPaid = !!doc.paid || doc.status === "paid" || doc.status === "completed";
    if (doc.locked || isPaid) {
      return res.status(400).json({
        error: "This request is locked/paid and cannot be deleted.",
      });
    }

    await TranslationRequest.findByIdAndDelete(req.params.id);
    return res.json({ message: "Submission deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to delete submission" });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/translation-requests/lock-and-pay
// Lock pending translation requests and create Stripe Checkout Session.
// ─────────────────────────────────────────────────────────────
router.post("/lock-and-pay", async (req, res) => {
  try {
    const auth = requireStudentId(req);
    if (auth.error) return res.status(auth.error.code).json(auth.error.body);
    const studentId = auth.studentId;

    const { submissionIds } = req.body;

    if (!Array.isArray(submissionIds) || submissionIds.length === 0) {
      return res.status(400).json({ error: "No submissions provided" });
    }

    const submissions = await TranslationRequest.find({
      _id: { $in: submissionIds },
      student: studentId,
      locked: false,
      status: { $in: ["pending"] },
    });

    if (submissions.length === 0) {
      return res.status(400).json({ error: "No unlocked pending submissions found." });
    }

    const totalPages = submissions.reduce((sum, s) => {
      const pages = (s.files || []).reduce((fileSum, f) => fileSum + (f.pageCount || 1), 0);
      return sum + pages;
    }, 0);

    if (totalPages <= 0) {
      return res.status(400).json({ error: "No pages found to bill." });
    }

    const hasNotary = submissions.some((s) => !!s.needNotary);

    const needsShipping = submissions.some((s) => {
      const dm = normalizeDeliveryMethod(s.deliveryMethod);
      return dm === "hard copy" || dm === "both";
    });

    const line_items = [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "Translation Services (per page)" },
          unit_amount: TRANSLATION_FEE_PER_PAGE_CENTS,
        },
        quantity: totalPages,
      },
    ];

    if (hasNotary) {
      line_items.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Notary Fee" },
          unit_amount: NOTARY_FEE_CENTS,
        },
        quantity: 1,
      });
    }

    if (needsShipping) {
      line_items.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Shipping Fee" },
          unit_amount: SHIPPING_FEE_CENTS,
        },
        quantity: 1,
      });
    }

    const grandTotalCents =
      totalPages * TRANSLATION_FEE_PER_PAGE_CENTS +
      (hasNotary ? NOTARY_FEE_CENTS : 0) +
      (needsShipping ? SHIPPING_FEE_CENTS : 0);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/dashboard`,
      metadata: {
        type: "translation_only",
        studentId: String(studentId),
        submissionIds: submissionIds.join(","),
        totalPages: String(totalPages),
        hasNotary: String(hasNotary),
        needsShipping: String(needsShipping),
        grandTotalCents: String(grandTotalCents),
      },
    });

    // Lock submissions and store session id
    await TranslationRequest.updateMany(
      { _id: { $in: submissionIds }, student: studentId, locked: false },
      { $set: { stripeSessionId: session.id, locked: true, status: "locked" } }
    );

    return res.json({ paymentUrl: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error initiating payment" });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/translation-requests/receipt/:sessionId
// ─────────────────────────────────────────────────────────────
router.get("/receipt/:sessionId", async (req, res) => {
  try {
    const auth = requireStudentId(req);
    if (auth.error) return res.status(auth.error.code).json(auth.error.body);
    const studentId = auth.studentId;

    const { sessionId } = req.params;

    const doc = await TranslationRequest.findOne({
      student: studentId,
      stripeSessionId: sessionId,
    }).select("receiptUrl paid locked status amountPaidCents currency");

    if (!doc) return res.status(404).json({ message: "Receipt not found." });

    return res.json({
      receiptUrl: doc.receiptUrl || null,
      paid: !!doc.paid || doc.status === "paid" || !!doc.locked,
      amountPaidCents: doc.amountPaidCents,
      currency: doc.currency,
      status: doc.status,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
