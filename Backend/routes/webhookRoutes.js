// Backend/routes/webhookRoutes.js
const express = require("express");
const Stripe = require("stripe");
const Transcript = require("../models/Transcript");

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_EVAL_WEBHOOK_SECRET // <-- use a dedicated eval webhook secret
    );
  } catch (err) {
    console.error("❌ Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["payment_intent", "payment_intent.latest_charge"],
      });

      const pi = fullSession.payment_intent;
      const charge = pi?.latest_charge;

      const update = {
        paymentStatus: "paid",
        locked: true,
        paidAt: new Date(),

        stripeSessionId: fullSession.id,
        stripePaymentIntentId: pi?.id || null,
        stripeChargeId: charge?.id || null,
        receiptUrl: charge?.receipt_url || null,
        amountPaidCents: typeof fullSession.amount_total === "number" ? fullSession.amount_total : null,
        currency: (fullSession.currency || "usd").toLowerCase(),
      };

      const result = await Transcript.updateOne(
        { stripeSessionId: fullSession.id }, // ✅ most reliable selector
        { $set: update }
      );

      console.log("✅ Eval webhook update result:", result, "session:", fullSession.id);

      // Optional: if no document matched, log metadata for debugging
      if (!result.matchedCount) {
        console.warn("⚠️ No Transcript matched stripeSessionId:", fullSession.id, "metadata:", fullSession.metadata);
      }
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook handler failed:", err);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
});

module.exports = router;
