// Backend/routes/webhookRoutes.js
const express = require("express");
const Stripe = require("stripe");
const mongoose = require("mongoose");
const Transcript = require("../models/Transcript");

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Evaluation Stripe Webhook
 * Must be mounted BEFORE express.json(), or use raw body only on this route.
 *
 * With servers.js:
 *   app.use("/api/webhooks", require("./routes/webhookRoutes"));
 *
 * Stripe endpoint must be:
 *   https://api.anacaonaservices.org/api/webhooks/stripe
 */
router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
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
        case "checkout.session.completed": {
          const session = event.data.object;
          if (session.payment_status !== "paid") {
            console.log(
              "ℹ️ checkout.session.completed but payment_status not paid:",
              session.id,
              session.payment_status
            );
            break;
          }
          await handleEvalPaidSession(session.id);
          break;
        }

        case "checkout.session.async_payment_succeeded": {
          const session = event.data.object;
          await handleEvalPaidSession(session.id);
          break;
        }

        case "checkout.session.expired": {
          const session = event.data.object;

          const result = await Transcript.updateOne(
            { stripeSessionId: session.id, paymentStatus: { $ne: "paid" } },
            {
              $set: { locked: false, paymentStatus: "pending" }, // schema-safe
              $unset: {
                stripePaymentIntentId: "",
                stripeChargeId: "",
                receiptUrl: "",
                paidAt: "",
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
          break;
      }

      return res.json({ received: true });
    } catch (err) {
      console.error("❌ Webhook handler failed:", err);
      return res.status(500).json({ error: "Webhook handler failed" });
    }
  }
);

async function handleEvalPaidSession(sessionId) {
  const fullSession = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent", "payment_intent.latest_charge"],
  });

  const metaType = fullSession?.metadata?.type;
  if (metaType && metaType !== "evaluation") {
    console.log("ℹ️ Ignoring non-evaluation session:", sessionId, metaType);
    return;
  }

  const pi = fullSession.payment_intent;
  const charge = pi?.latest_charge;

  const subtotalCents =
    typeof fullSession.amount_subtotal === "number" ? fullSession.amount_subtotal : null;

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

    amountPaidCents: totalCents,
    currency: (fullSession.currency || "usd").toLowerCase(),

    subtotalCents,
    taxCents,
    totalCents,
  };

  // Translation doc ids billed in this eval checkout session
  const translationDocIdsRaw = String(fullSession?.metadata?.translationDocIds || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const translationDocObjectIds = translationDocIdsRaw
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  // Stronger match fallback: use transcriptMongoId if present
  const transcriptMongoId = fullSession?.metadata?.transcriptMongoId;
  const filter =
    transcriptMongoId && mongoose.Types.ObjectId.isValid(transcriptMongoId)
      ? {
          $or: [
            { stripeSessionId: fullSession.id },
            { _id: new mongoose.Types.ObjectId(transcriptMongoId) },
          ],
        }
      : { stripeSessionId: fullSession.id };

  let result;

  if (translationDocObjectIds.length > 0) {
    result = await Transcript.updateOne(
      filter,
      {
        $set: {
          ...update,
          "documents.$[doc].translationPaid": true,
          "documents.$[doc].translationPaidAt": new Date(),
          "documents.$[doc].translationStripeSessionId": fullSession.id,
        },
      },
      { arrayFilters: [{ "doc._id": { $in: translationDocObjectIds } }] }
    );
  } else {
    result = await Transcript.updateOne(filter, { $set: update });
  }

  console.log("✅ Eval webhook update result:", result, "session:", fullSession.id);

  if (!result?.matchedCount) {
    console.warn("⚠️ No Transcript matched:", {
      sessionId: fullSession.id,
      metadata: fullSession.metadata,
    });
  }
}

module.exports = router;
