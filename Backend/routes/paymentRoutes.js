// Backend/routes/paymentRoutes.js
const express = require("express");
const jwt = require("jsonwebtoken");
const Stripe = require("stripe");
const Transcript = require("../models/Transcript");

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Keep aligned with frontend constants
const EVALUATION_FEE_CENTS = 5000;            // $50
const TRANSLATION_FEE_PER_PAGE_CENTS = 2500;  // $25 / page
const TRANSCRIPT_FEE_CENTS = 4000;            // $40
const SHIPPING_FEE_CENTS = 1000;              // $10

// Stripe Tax toggle (default ON in production)
const STRIPE_AUTOMATIC_TAX_ENABLED =
  String(process.env.STRIPE_AUTOMATIC_TAX || "true").toLowerCase() === "true";

// OPTIONAL: If you want explicit tax codes (only matters if the item is taxable in a jurisdiction).
// If you are unsure, you can omit tax_code entirely and use Stripe dashboard product tax setup later.
const TAX_CODE_EVALUATION = process.env.STRIPE_TAX_CODE_EVALUATION || null;
const TAX_CODE_TRANSLATION = process.env.STRIPE_TAX_CODE_TRANSLATION || null;
const TAX_CODE_METHOD_FEE = process.env.STRIPE_TAX_CODE_METHOD_FEE || null;

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

// Payment by submission method
function getMethodFee(submissionMethod) {
  if (submissionMethod === "digital") {
    return { label: "Transcript Fee (school release)", cents: TRANSCRIPT_FEE_CENTS };
  }
  if (submissionMethod === "sealed") {
    return { label: "Shipping Fee (sealed packet)", cents: SHIPPING_FEE_CENTS };
  }
  return { label: "Method Fee", cents: 0 };
}

function maybeTaxCode(taxCode) {
  return taxCode ? { tax_code: taxCode } : {};
}

/**
 * POST /api/payments/create-evaluation-checkout-session
 */
router.post("/create-evaluation-checkout-session", async (req, res) => {
  try {
    const auth = requireStudentId(req);
    if (auth.error) return res.status(auth.error.code).json(auth.error.body);
    const studentId = auth.studentId;

    const { submissionId } = req.body;
    if (!submissionId) return res.status(400).json({ error: "Submission ID is required" });

    const submission = await Transcript.findOne({ submissionId, student: studentId });
    if (!submission) return res.status(404).json({ error: "Submission not found" });

    if (submission.paymentStatus === "paid") {
      return res.status(400).json({ error: "This submission is already paid." });
    }

    const docs = Array.isArray(submission.documents) ? submission.documents : [];

    const unpaidTranslationDocs = docs.filter((d) => d?.needsTranslation && !d?.translationPaid);
    const translationPages = unpaidTranslationDocs.reduce(
      (sum, d) => sum + (Number(d.pageCount) || 1),
      0
    );
    const translationDocIds = unpaidTranslationDocs.map((d) => String(d._id));

    const method = getMethodFee(submission.submissionMethod);
    if (method.cents < 0) return res.status(400).json({ error: "Invalid submission method fee." });

    const line_items = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Evaluation Fee (${submission.submissionId})`,
            ...maybeTaxCode(TAX_CODE_EVALUATION),
          },
          unit_amount: EVALUATION_FEE_CENTS,
        },
        quantity: 1,
      },

      ...(method.cents > 0
        ? [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: method.label,
                  description:
                    submission.submissionMethod === "digital"
                      ? "Administrative transcript release coordination"
                      : "Document handling and shipping coordination",
                  ...maybeTaxCode(TAX_CODE_METHOD_FEE),
                },
                unit_amount: method.cents,
              },
              quantity: 1,
            },
          ]
        : []),
    ];

    if (translationPages > 0) {
      line_items.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Translation (per page) — Evaluation package",
            description: `${translationPages} page(s)`,
            ...maybeTaxCode(TAX_CODE_TRANSLATION),
          },
          unit_amount: TRANSLATION_FEE_PER_PAGE_CENTS,
        },
        quantity: translationPages,
      });
    }

    const sessionPayload = {
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

        submissionMethod: String(submission.submissionMethod || ""),
        methodFeeCents: String(method.cents || 0),

        translationPages: String(translationPages),
        translationDocIds: translationDocIds.join(","),
      },
    };

    // Stripe Tax (recommended)
    if (STRIPE_AUTOMATIC_TAX_ENABLED) {
      sessionPayload.automatic_tax = { enabled: true };
      sessionPayload.billing_address_collection = "required";
      sessionPayload.customer_creation = "always";
      // Optional:
      sessionPayload.tax_id_collection = { enabled: true };
    }

    // Prevent accidental duplicate sessions (double click)
    const idempotencyKey = `eval_${submission._id}_${submission.paymentStatus}_${translationDocIds.join("-") || "no_trans"}_${method.cents}`;
    const session = await stripe.checkout.sessions.create(sessionPayload, {
      idempotencyKey,
    });

    submission.stripeSessionId = session.id;
    submission.locked = false; // lock only after webhook confirms
    await submission.save();

    return res.json({ url: session.url });
  } catch (err) {
    console.error("create-evaluation-checkout-session error:", err);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
});

/**
 * GET /api/payments/evaluation-receipt/:sessionId
 */
router.get("/evaluation-receipt/:sessionId", async (req, res) => {
  try {
    const auth = requireStudentId(req);
    if (auth.error) return res.status(auth.error.code).json(auth.error.body);
    const studentId = auth.studentId;

    const { sessionId } = req.params;
    if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

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
    }).select("receiptUrl paymentStatus locked amountPaidCents currency subtotalCents taxCents totalCents");

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

      // Optional tax fields (if you added them to Transcript)
      subtotalCents: typeof doc.subtotalCents === "number" ? doc.subtotalCents : null,
      taxCents: typeof doc.taxCents === "number" ? doc.taxCents : null,
      totalCents: typeof doc.totalCents === "number" ? doc.totalCents : null,
    });
  } catch (err) {
    console.error("evaluation-receipt error:", err);
    return res.status(500).json({ error: "Failed to fetch receipt" });
  }
});

/**
 * POST /api/payments/create-additional-translation-checkout
 */
router.post("/create-additional-translation-checkout", async (req, res) => {
  try {
    const auth = requireStudentId(req);
    if (auth.error) return res.status(auth.error.code).json(auth.error.body);
    const studentId = auth.studentId;

    const { submissionId } = req.body;
    if (!submissionId) return res.status(400).json({ error: "Submission ID is required" });

    const submission = await Transcript.findOne({ submissionId, student: studentId });
    if (!submission) return res.status(404).json({ error: "Submission not found" });

    const unpaidTranslationDocs = (submission.documents || []).filter(
      (d) => d?.needsTranslation && !d?.translationPaid
    );
    if (unpaidTranslationDocs.length === 0) {
      return res.status(400).json({ error: "No unpaid translation pages." });
    }

    const translationPages = unpaidTranslationDocs.reduce(
      (sum, d) => sum + (Number(d.pageCount) || 1),
      0
    );
    const translationDocIds = unpaidTranslationDocs.map((d) => String(d._id));

    const sessionPayload = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Additional Translation – Submission ${submission.submissionId}`,
              description: `Document translation - ${translationPages} page(s)`,
              ...maybeTaxCode(TAX_CODE_TRANSLATION),
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
    };

    if (STRIPE_AUTOMATIC_TAX_ENABLED) {
      sessionPayload.automatic_tax = { enabled: true };
      sessionPayload.billing_address_collection = "required";
      sessionPayload.customer_creation = "always";
      sessionPayload.tax_id_collection = { enabled: true };
    }

    const idempotencyKey = `addtrans_${submission._id}_${translationDocIds.join("-")}_${translationPages}`;
    const session = await stripe.checkout.sessions.create(sessionPayload, { idempotencyKey });

    return res.json({ url: session.url });
  } catch (err) {
    console.error("create-additional-translation-checkout error:", err);
    return res.status(500).json({ error: "Failed to create translation checkout" });
  }
});

module.exports = router;
