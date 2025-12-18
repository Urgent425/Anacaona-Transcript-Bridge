//Backend/routes/paymentRoutes.js
const express = require("express");
const jwt = require("jsonwebtoken");
const Transcript = require("../models/Transcript");
const Stripe = require("stripe");

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Keep aligned with frontend constants
const EVALUATION_FEE_CENTS = 5000;            // $50
const TRANSLATION_FEE_PER_PAGE_CENTS = 2500;  // $25 / page

function requireStudentId(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return { error: { code: 401, body: { error: "Unauthorized" } } };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { studentId: decoded.id };
  } catch {
    return { error: { code: 401, body: { error: "Unauthorized" } } };
  }
}

router.post("/create-evaluation-checkout-session", async (req, res) => {
  try {
    const auth = requireStudentId(req);
    if (auth.error) return res.status(auth.error.code).json(auth.error.body);
    const studentId = auth.studentId;

    const { submissionId } = req.body;
    if (!submissionId) {
      return res.status(400).json({ error: "Submission ID is required" });
    }

    const submission = await Transcript.findOne({ submissionId, student: studentId });
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    // Prevent double-paying
    if (submission.paymentStatus === "paid") {
      return res.status(400).json({ error: "This submission is already paid." });
    }

    const docs = Array.isArray(submission.documents) ? submission.documents : [];

    // Count ONLY pages that need translation AND are not already paid
    const unpaidTranslationDocs = docs.filter(d => d?.needsTranslation && !d?.translationPaid);

    const translationPages = unpaidTranslationDocs.reduce((sum, d) => {
      return sum + (Number(d.pageCount) || 1);
    }, 0);

  const translationDocIds = unpaidTranslationDocs.map(d => String(d._id));

    const line_items = [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `Evaluation Fee (${submission.submissionId})` },
          unit_amount: EVALUATION_FEE_CENTS,
        },
        quantity: 1,
      },
    ];

    if (translationPages > 0) {
      line_items.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Translation (per page) — Evaluation package",
            description: `${translationPages} page(s)`,
          },
          unit_amount: TRANSLATION_FEE_PER_PAGE_CENTS,
        },
        quantity: translationPages,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,

      success_url: `${process.env.CLIENT_URL}/payment-success-eval?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/student-dashboard`,

      metadata: {
        type: "evaluation",
        submissionId: String(submission.submissionId),
        transcriptMongoId: String(submission._id),
        studentId: String(studentId),
        translationPages: String(translationPages),
        translationDocIds: translationDocIds.join(","),
      },
    });

    // Save session id (DO NOT lock yet — wait for webhook confirmation)
    submission.stripeSessionId = session.id;
    submission.locked = false; // keep false until webhook marks paid (optional)
    await submission.save();

    return res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
});

/**
 * Used by PaymentSuccessEval.jsx
 * Returns receipt + paid/locked once webhook has updated Transcript.
 * Includes Stripe metadata validation so students can’t query other sessions.
 */
router.get("/evaluation-receipt/:sessionId", async (req, res) => {
  try {
    const auth = requireStudentId(req);
    if (auth.error) return res.status(auth.error.code).json(auth.error.body);
    const studentId = auth.studentId;

    const { sessionId } = req.params;
    if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

    // Validate session belongs to this student (metadata)
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const metaStudentId = session?.metadata?.studentId;
    const metaType = session?.metadata?.type;

    if (!metaStudentId || String(metaStudentId) !== String(studentId)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (metaType && metaType !== "evaluation") {
      return res.status(400).json({ error: "Not an evaluation session" });
    }

    const doc = await Transcript.findOne({
      student: studentId,
      stripeSessionId: sessionId,
    }).select("receiptUrl paymentStatus locked amountPaidCents currency");

    // Webhook might not have updated yet
    if (!doc) {
      return res.json({
        receiptUrl: null,
        paid: false,
        locked: false,
        amountPaidCents: null,
        currency: "usd",
        pending: true,
        message: "Awaiting webhook confirmation. Please refresh in a few seconds.",
      });
    }

    return res.json({
      receiptUrl: doc.receiptUrl || null,
      paid: doc.paymentStatus === "paid",
      locked: !!doc.locked,
      amountPaidCents: typeof doc.amountPaidCents === "number" ? doc.amountPaidCents : null,
      currency: (doc.currency || "usd").toLowerCase(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch receipt" });
  }
});


router.post("/create-additional-translation-checkout", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { id: studentId } = jwt.verify(token, process.env.JWT_SECRET);
    const { submissionId } = req.body;

    if (!submissionId) {
      return res.status(400).json({ error: "Submission ID is required" });
    }

    const submission = await Transcript.findOne({
      submissionId,
      student: studentId,
    });

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    const unpaidTranslationDocs = (submission.documents || []).filter(
      (d) => d.needsTranslation && !d.translationPaid
    );

    if (unpaidTranslationDocs.length === 0) {
      return res.status(400).json({ error: "No unpaid translation pages." });
    }

    const translationPages = unpaidTranslationDocs.reduce(
      (sum, d) => sum + (d.pageCount || 1),
      0
    );

    const translationDocIds = unpaidTranslationDocs.map((d) => String(d._id));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Additional Translation",
              description: `${translationPages} page(s)`,
            },
            unit_amount: TRANSLATION_FEE_PER_PAGE_CENTS,
          },
          quantity: translationPages,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/payment-success-translation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/student-dashboard`,
      metadata: {
        type: "additional_translation",
        submissionId: String(submission.submissionId),
        studentId: String(studentId),
        translationPages: String(translationPages),
        translationDocIds: translationDocIds.join(","),
      },
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create translation checkout" });
  }
});

module.exports = router;
