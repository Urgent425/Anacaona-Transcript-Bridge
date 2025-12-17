// routes/webhookRoutes.js
const express = require("express");
const Stripe = require("stripe");
const Transcript = require("../models/Transcript");

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// IMPORTANT: use a separate secret for evaluation webhooks
const endpointSecret = process.env.STRIPE_EVAL_WEBHOOK_SECRET;

// This route MUST receive the RAW body
router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("❌ Eval webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      // We only need completed Checkout payments
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        const submissionId = session?.metadata?.submissionId;
        const type = session?.metadata?.type || "evaluation";

        if (!submissionId) {
          console.warn("⚠️ Eval webhook: missing submissionId in metadata");
          return res.json({ received: true });
        }

        // Retrieve expanded session to get receipt_url
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ["payment_intent", "payment_intent.latest_charge"],
        });

        const pi = fullSession.payment_intent;
        const latestCharge = pi?.latest_charge;

        const amountPaidCents =
          typeof fullSession.amount_total === "number" ? fullSession.amount_total : null;

        const currency = fullSession.currency || "usd";
        const receiptUrl = latestCharge?.receipt_url || null;

        // Common fields to store
        const commonSet = {
          stripeSessionId: fullSession.id,
          stripePaymentIntentId: pi?.id || null,
          stripeChargeId: latestCharge?.id || null,
          receiptUrl,
          amountPaidCents,
          currency,
          paidAt: new Date(),
        };

        // If this was the base evaluation payment:
        if (type === "evaluation") {
          // Mark the evaluation as paid + lock base fee
          // Also mark all currently-unpaid translation docs as paid (since this checkout included translation pages)
          const updated = await Transcript.findOneAndUpdate(
            { submissionId },
            {
              $set: {
                ...commonSet,
                paymentStatus: "paid",
                locked: true,
              },
              $setOnInsert: { submissionId },
            },
            { new: true }
          );

          if (!updated) {
            console.warn("⚠️ Eval webhook: Transcript not found for", submissionId);
            return res.json({ received: true });
          }

          // Mark translation docs as paid (for docs that need translation and were not yet paid)
          await Transcript.updateOne(
            { submissionId },
            {
              $set: {
                "documents.$[d].translationPaid": true,
                "documents.$[d].translationPaidAt": new Date(),
                "documents.$[d].translationStripeSessionId": fullSession.id,
              },
            },
            {
              arrayFilters: [{ "d.needsTranslation": true, "d.translationPaid": false }],
            }
          );

          console.log("✅ Evaluation marked PAID + docs translationPaid:", submissionId);
        }

        // If later you create a “supplemental translation” checkout for already-paid evaluations:
        if (type === "evaluation_translation") {
          // Do NOT change paymentStatus (already paid); do NOT lock the whole submission.
          // Only mark translation docs as paid.
          await Transcript.updateOne(
            { submissionId },
            {
              $set: {
                // optional: keep the latest receipt on the transcript record too
                ...commonSet,
                locked: false, // optional; keep whatever you prefer
              },
            }
          );

          await Transcript.updateOne(
            { submissionId },
            {
              $set: {
                "documents.$[d].translationPaid": true,
                "documents.$[d].translationPaidAt": new Date(),
                "documents.$[d].translationStripeSessionId": fullSession.id,
              },
            },
            {
              arrayFilters: [{ "d.needsTranslation": true, "d.translationPaid": false }],
            }
          );

          console.log("✅ Evaluation translation top-up marked:", submissionId);
        }
      }

      return res.json({ received: true });
    } catch (err) {
      console.error("❌ Eval webhook handler failed:", err);
      return res.status(500).json({ error: "Webhook handler failed" });
    }
  }
);

module.exports = router;
