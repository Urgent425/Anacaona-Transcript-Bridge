// //Backend/routes/webhookRoutes.js
const express = require("express");
const Stripe = require("stripe");
const mongoose = require("mongoose");
const Transcript = require("../models/Transcript");

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * IMPORTANT:
 * - This route must be mounted BEFORE any express.json() middleware,
 *   OR mounted with raw body ONLY for this route.
 * Example:
 *   app.use("/api/webhooks", require("./routes/webhookRoutes"));
 * And DO NOT also apply express.json() to /api/webhooks.
 */
router.post("/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_EVAL_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      /**
       * Checkout completed (may be paid immediately or may require async handling).
       * We only mark paid when payment_status === "paid".
       */
      case "checkout.session.completed": {
        const session = event.data.object;

        // Guard: only confirm paid when Stripe says it's paid
        if (session.payment_status !== "paid") {
          console.log(
            "ℹ️ checkout.session.completed but payment_status is not paid:",
            session.id,
            session.payment_status
          );
          break;
        }

        await handleEvalPaidSession(session.id);
        break;
      }

      /**
       * For async methods: payment succeeds later
       */
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        await handleEvalPaidSession(session.id);
        break;
      }

      /**
       * Optional: if you want to unlock on expiration
       */
      case "checkout.session.expired": {
        const session = event.data.object;

        const result = await Transcript.updateOne(
          { stripeSessionId: session.id, paymentStatus: { $ne: "paid" } },
          {
            $set: {
              locked: false,
              paymentStatus: "unpaid",
            },
            $unset: {
              stripePaymentIntentId: "",
              stripeChargeId: "",
              receiptUrl: "",
              amountPaidCents: "",
              currency: "",
              subtotalCents: "",
              taxCents: "",
              totalCents: "",
            },
          }
        );

        console.log("🟡 Eval session expired; unlocked if matched:", session.id, result);
        break;
      }

      default:
        // ignore other events
        break;
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook handler failed:", err);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
});

/**
 * Marks an evaluation checkout session as paid, stores receipt, totals, and
 * sets translationPaid only for the doc IDs billed in that session.
 */
async function handleEvalPaidSession(sessionId) {
  // Expand to get payment_intent + latest_charge for receipt_url
  const fullSession = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent", "payment_intent.latest_charge"],
  });

  // Optional: verify this webhook is indeed for evaluation (metadata)
  const metaType = fullSession?.metadata?.type;
  if (metaType && metaType !== "evaluation") {
    console.log("ℹ️ Ignoring non-evaluation session in eval webhook:", sessionId, metaType);
    return;
  }

  const pi = fullSession.payment_intent;
  const charge = pi?.latest_charge;

  // Stripe Tax breakdown (will be 0 if non-taxable or no registration)
  const subtotalCents =
    typeof fullSession.amount_subtotal === "number" ? fullSession.amount_subtotal : null;

  // total_details.amount_tax is the tax amount Stripe computed
  const taxCents =
    typeof fullSession?.total_details?.amount_tax === "number"
      ? fullSession.total_details.amount_tax
      : null;

  const totalCents =
    typeof fullSession.amount_total === "number" ? fullSession.amount_total : null;

  const update = {
    paymentStatus: "paid",
    locked: true,
    paidAt: new Date(),

    stripeSessionId: fullSession.id,
    stripePaymentIntentId: pi?.id || null,
    stripeChargeId: charge?.id || null,
    receiptUrl: charge?.receipt_url || null,

    // Backward compatible total
    amountPaidCents: totalCents,
    currency: (fullSession.currency || "usd").toLowerCase(),

    // Tax breakdown
    subtotalCents,
    taxCents,
    totalCents,
  };

  // Doc ids billed for translation in this checkout session
  const translationDocIdsRaw = String(fullSession?.metadata?.translationDocIds || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Convert to ObjectId to match Mongo documents._id type
  const translationDocObjectIds = translationDocIdsRaw
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  let result;

  if (translationDocObjectIds.length > 0) {
    result = await Transcript.updateOne(
      { stripeSessionId: fullSession.id },
      {
        $set: {
          ...update,
          "documents.$[doc].translationPaid": true,
          "documents.$[doc].translationPaidAt": new Date(),
          "documents.$[doc].translationStripeSessionId": fullSession.id,
        },
      },
      {
        arrayFilters: [{ "doc._id": { $in: translationDocObjectIds } }],
      }
    );
  } else {
    // No translation docs billed in this payment — keep original behavior
    result = await Transcript.updateOne(
      { stripeSessionId: fullSession.id },
      { $set: update }
    );
  }

  console.log("✅ Eval webhook update result:", result, "session:", fullSession.id);

  if (!result?.matchedCount) {
    console.warn(
      "⚠️ No Transcript matched stripeSessionId:",
      fullSession.id,
      "metadata:",
      fullSession.metadata
    );
  }
}

module.exports = router;
