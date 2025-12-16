// backend/routes/translationRequestRoutes.js

const express = require("express");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const mongoose = require("mongoose");
const TranslationRequest = require("../models/TranslationRequest");
const Stripe = require("stripe");

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * IMPORTANT: Keep these aligned with Frontend/src/components/constants/pricing.js
 * Values below are EXAMPLES. Replace with your real fees.
 */
const TRANSLATION_FEE_PER_PAGE_CENTS = 2500; // $25 / page
const NOTARY_FEE_CENTS = 1500;              // $15 flat
const SHIPPING_FEE_CENTS = 1000;            // $10 flat

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

// Create a translation request
router.post("/", upload.array("files"), async (req, res) => {
  try {
    const auth = requireStudentId(req);
    if (auth.error) return res.status(auth.error.code).json(auth.error.body);
    const studentId = auth.studentId;

    const pageCounts = JSON.parse(req.body.pageCounts || "[]");
    const { sourceLanguage, targetLanguage, needNotary, deliveryMethod } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const files = req.files.map((file, index) => ({
      filename: file.originalname,
      mimetype: file.mimetype,
      buffer: file.buffer,          // note: your FileSchema has `path` not `buffer`
      pageCount: pageCounts[index] || 1,
    }));

    const request = new TranslationRequest({
      student: studentId,
      sourceLanguage,
      targetLanguage,
      needNotary: !!needNotary,
      deliveryMethod,
      files,
      status: "pending",
      locked: false,
      paid: false,
    });

    await request.save();
    return res.status(201).json({ message: "Translation request created successfully" });
  } catch (err) {
    console.error("Error creating translation request:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get the logged-in user's translation requests
router.get("/mine", async (req, res) => {
  try {
    const auth = requireStudentId(req);
    if (auth.error) return res.status(auth.error.code).json(auth.error.body);
    const studentId = auth.studentId;

    const requests = await TranslationRequest.find({ student: studentId }).sort({ createdAt: -1 });
    return res.json(requests);
  } catch (err) {
    console.error("Error fetching translation requests:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Delete a translation request
router.delete("/:id", async (req, res) => {
  try {
    const auth = requireStudentId(req);
    if (auth.error) return res.status(auth.error.code).json(auth.error.body);
    const studentId = auth.studentId;

    const doc = await TranslationRequest.findById(req.params.id);
    if (!doc || doc.student.toString() !== studentId) {
      return res.status(403).json({ error: "Forbidden or Not Found" });
    }

    if (doc.locked) {
      return res.status(400).json({ error: "This submission is locked and cannot be deleted." });
    }

    await TranslationRequest.findByIdAndDelete(req.params.id);
    return res.json({ message: "Submission deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to delete submission" });
  }
});

/**
 * Lock pending translation requests and create a Stripe Checkout Session.
 * Charges:
 * - Translation per page
 * - + Notary fee if any pending request has needNotary = true
 * - + Shipping fee if any pending request deliveryMethod is "hard copy" or "both"
 */
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
    });

    if (submissions.length === 0) {
      return res.status(400).json({ error: "No unlocked submissions found." });
    }

    const totalPages = submissions.reduce((sum, s) => {
      const pages = (s.files || []).reduce((fileSum, f) => fileSum + (f.pageCount || 1), 0);
      return sum + pages;
    }, 0);

    if (totalPages <= 0) {
      return res.status(400).json({ error: "No pages found to bill." });
    }

    const hasNotary = submissions.some((s) => !!s.needNotary);
    const needsShipping = submissions.some(
      (s) => s.deliveryMethod === "hard copy" || s.deliveryMethod === "both"
    );

    // Stripe line items
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

    // Create checkout session
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

    // Lock submissions and store session id for reconciliation
    await TranslationRequest.updateMany(
      { _id: { $in: submissionIds }, student: studentId, locked: false },
      { $set: { stripeSessionId: session.id, status: "pending" } }
    );
    return res.json({ paymentUrl: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error initiating payment" });
  }
});

// backend/routes/translationRequestRoutes.js (add near bottom)
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

    // Webhook must have marked it paid and stored receiptUrl
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
