// routes/webhookRoutes.js
const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Transcript = require("../models/Transcript");

// This must be the raw body!
router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const submissionId = session.metadata.submissionId;

      console.log(`Payment completed for submission ${submissionId}`);

      // Mark submission as paid
      await Transcript.updateOne(
        { submissionId },
        { $set: { paymentStatus: "paid" } }
      );
    }

    res.json({ received: true });
  }
);

module.exports = router;
