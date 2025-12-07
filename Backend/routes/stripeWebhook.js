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
      console.error(`Webhook error: ${err.message}`);
      return res.sendStatus(400);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const submissionIds = session.metadata.submissionIds.split(",");

      await TranslationRequest.updateMany(
        { _id: { $in: submissionIds } },
        { $set: { status: "paid" } }
      );
    }

    res.json({ received: true });
  }
);


module.exports = router;
