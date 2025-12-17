// Backend/routes/webhookRoutes.js
const express = require("express");
const Stripe = require("stripe");
const Transcript = require("../models/Transcript");

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// IMPORTANT: keep raw body here
router.post("/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // ✅ correct signature: (payload, sig, secret)
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_EVAL_WEBHOOK_SECRET);
  } catch (err) {
    console.error("❌ Stripe signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Always ACK Stripe quickly; do work safely
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Expand for receipt_url
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["payment_intent", "payment_intent.latest_charge"],
      });

      const pi = fullSession.payment_intent;
      const charge = pi?.latest_charge;

      const submissionId = fullSession.metadata?.submissionId;

      if (submissionId) {
        await Transcript.updateOne(
          { submissionId },
          {
            $set: {
              paymentStatus: "paid",
              locked: true,
              paidAt: new Date(),

              stripeSessionId: fullSession.id,
              stripePaymentIntentId: pi?.id || null,
              stripeChargeId: charge?.id || null,
              receiptUrl: charge?.receipt_url || null,

              amountPaidCents: typeof fullSession.amount_total === "number" ? fullSession.amount_total : null,
              currency: (fullSession.currency || "usd").toLowerCase(),
            },
          }
        );

        console.log("✅ Evaluation paid:", submissionId, "session:", fullSession.id);
      } else {
        console.warn("⚠️ Missing submissionId in metadata for session:", fullSession.id);
      }
    }

    // Optional: handle expired (not required, but prevents confusion)
    if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      console.log("ℹ️ Checkout expired:", session.id);
      // You can optionally set a status in DB if you want, but DO return 200.
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook handler failed:", err);
    // Prefer 200 even on internal errors to avoid endless retries? Usually keep 500 for visibility.
    return res.status(500).json({ error: "Webhook handler failed" });
  }
});

module.exports = router;
