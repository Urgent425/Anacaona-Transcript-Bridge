// //Backend/routes/stripeWebhook.js
const express = require("express");
const Stripe = require("stripe");
const bodyParser = require("body-parser");
const TranslationRequest = require("../models/TranslationRequest");

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Stripe Webhook (Translation Only)
 * IMPORTANT:
 * - This route must be mounted BEFORE any express.json() middleware,
 *   OR mounted with raw body on this route only.
 *
 * Example (recommended):
 *   app.use("/api/webhooks/stripe", require("./routes/stripeWebhook"));
 *   // but ensure you DO NOT apply express.json() to that same path
 */
router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        /**
         * Payment completed successfully
         */
        case "checkout.session.completed": {
          const session = event.data.object;

          // Guard: Only mark paid when Stripe confirms payment_status === "paid"
          if (session.payment_status !== "paid") {
            console.log(
              "ℹ️ checkout.session.completed but payment_status is not paid:",
              session.id,
              session.payment_status
            );
            break;
          }

          // Expand to get payment_intent + latest_charge for receipt_url
          // NOTE: amount_total, amount_subtotal, total_details.amount_tax are on the session
          const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ["payment_intent", "payment_intent.latest_charge"],
          });

          const pi = fullSession.payment_intent;
          const latestCharge = pi?.latest_charge;

          const totalCents =
            typeof fullSession.amount_total === "number" ? fullSession.amount_total : null;

          const subtotalCents =
            typeof fullSession.amount_subtotal === "number" ? fullSession.amount_subtotal : null;

          const taxCents =
            typeof fullSession?.total_details?.amount_tax === "number"
              ? fullSession.total_details.amount_tax
              : null;

          const currency = (fullSession.currency || "usd").toLowerCase();
          const receiptUrl = latestCharge?.receipt_url || null;

          // Update by stripeSessionId (most reliable)
          await TranslationRequest.updateMany(
            { stripeSessionId: session.id },
            {
              $set: {
                paid: true,
                paidAt: new Date(),
                status: "locked",
                locked: true,

                // Preserve your existing fields
                amountPaidCents: totalCents,
                currency,

                // NEW: tax breakdown (safe even if null)
                subtotalCents,
                taxCents,
                totalCents,

                stripePaymentIntentId: pi?.id || null,
                stripeChargeId: latestCharge?.id || null,
                receiptUrl,
              },
            }
          );

          console.log("✅ Translation requests marked paid+locked for session:", session.id);
          break;
        }

        /**
         * Checkout Session expired (common for abandoned/canceled flows)
         * Unlock and revert to unpaid so the student can try again.
         */
        case "checkout.session.expired": {
          const session = event.data.object;

          await TranslationRequest.updateMany(
            { stripeSessionId: session.id, paid: { $ne: true } },
            {
              $set: {
                locked: false,
                status: "unpaid",
              },
              $unset: {
                stripeSessionId: "",
              },
            }
          );

          console.log("🟡 Translation requests unlocked (session expired):", session.id);
          break;
        }

        /**
         * Optional: if you use async payment methods, Checkout may complete later.
         * This event is emitted when the payment succeeds later.
         */
        case "checkout.session.async_payment_succeeded": {
          const session = event.data.object;

          const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ["payment_intent", "payment_intent.latest_charge"],
          });

          const pi = fullSession.payment_intent;
          const latestCharge = pi?.latest_charge;

          const totalCents =
            typeof fullSession.amount_total === "number" ? fullSession.amount_total : null;

          const subtotalCents =
            typeof fullSession.amount_subtotal === "number" ? fullSession.amount_subtotal : null;

          const taxCents =
            typeof fullSession?.total_details?.amount_tax === "number"
              ? fullSession.total_details.amount_tax
              : null;

          const currency = (fullSession.currency || "usd").toLowerCase();
          const receiptUrl = latestCharge?.receipt_url || null;

          await TranslationRequest.updateMany(
            { stripeSessionId: session.id },
            {
              $set: {
                paid: true,
                paidAt: new Date(),
                status: "paid",
                locked: true,

                // Preserve your existing fields
                amountPaidCents: totalCents,
                currency,

                // NEW: tax breakdown
                subtotalCents,
                taxCents,
                totalCents,

                stripePaymentIntentId: pi?.id || null,
                stripeChargeId: latestCharge?.id || null,
                receiptUrl,
              },
            }
          );

          console.log("✅ Async payment succeeded; marked paid:", session.id);
          break;
        }

        /**
         * Optional: unlock on async failure
         */
        case "checkout.session.async_payment_failed": {
          const session = event.data.object;

          await TranslationRequest.updateMany(
            { stripeSessionId: session.id, paid: { $ne: true } },
            {
              $set: {
                locked: false,
                status: "unpaid",
              },
              $unset: {
                stripeSessionId: "",
              },
            }
          );

          console.log("🔴 Async payment failed; unlocked:", session.id);
          break;
        }

        default:
          // Ignore other events
          break;
      }

      return res.json({ received: true });
    } catch (err) {
      console.error("Webhook handler failed:", err);
      return res.status(500).json({ error: "Webhook handler failed" });
    }
  }
);

module.exports = router;
