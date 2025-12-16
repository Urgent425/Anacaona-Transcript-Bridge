// routes/stripeWebhook.js
const express = require("express");
const Stripe = require("stripe");
const bodyParser = require("body-parser");
const TranslationRequest = require("../models/TranslationRequest");

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        // Expand to get payment_intent + charges (for receipt_url)
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ["payment_intent", "payment_intent.latest_charge"],
        });

        const pi = fullSession.payment_intent;
        const latestCharge = pi?.latest_charge;

        const amountPaidCents =
          typeof fullSession.amount_total === "number" ? fullSession.amount_total : null;

        const currency = fullSession.currency || "usd";
        const receiptUrl = latestCharge?.receipt_url || null;

        // Update by stripeSessionId (most reliable)
        await TranslationRequest.updateMany(
          { stripeSessionId: session.id },
          {
            $set: {
              paid: true,
              paidAt: new Date(),
              status: "paid",
              locked: true,

              amountPaidCents,
              currency,

              stripePaymentIntentId: pi?.id || null,
              stripeChargeId: latestCharge?.id || null,
              receiptUrl,
            },
          }
        );

        console.log("✅ Translation requests marked paid+locked for session:", session.id);
      }

      return res.json({ received: true });
    } catch (err) {
      console.error("Webhook handler failed:", err);
      return res.status(500).json({ error: "Webhook handler failed" });
    }
  }
);

module.exports = router;
