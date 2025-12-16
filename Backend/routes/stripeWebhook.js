// routes/stripeWebhook.js
const express = require("express");
const Stripe = require("stripe");
const bodyParser = require("body-parser");
const TranslationRequest = require("../models/TranslationRequest");

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("Stripe webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        const submissionIdsRaw = session?.metadata?.submissionIds || "";
        const submissionIds = submissionIdsRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        if (submissionIds.length === 0) {
          console.warn("checkout.session.completed without submissionIds metadata. session:", session?.id);
          return res.json({ received: true });
        }

        // Stripe Checkout session fields:
        // - amount_total is total charged in cents
        // - currency is lowercase (e.g., "usd")
        const amountPaidCents = typeof session.amount_total === "number" ? session.amount_total : null;
        const currency = session.currency || "usd";

       await TranslationRequest.updateMany(
        { _id: { $in: submissionIds } },
        { $set: { status: "paid", locked: true, paid: true, paidAt: new Date(), stripeSessionId: session.id } }
      );

      }

      return res.json({ received: true });
    } catch (err) {
      console.error("Webhook handler error:", err);
      return res.status(500).json({ error: "Webhook handler failed" });
    }
  }
);

module.exports = router;
