// routes/paymentRoutes.js
const express = require("express");
const jwt = require("jsonwebtoken");
const Transcript = require("../models/Transcript");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

router.post("/create-evaluation-checkout-session", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { id: studentId } = jwt.verify(token, process.env.JWT_SECRET);

    const { submissionId } = req.body;
    if (!submissionId) {
      return res.status(400).json({ error: "Submission ID is required" });
    }

    const submission = await Transcript.findOne({
      submissionId,
      student: studentId,
    });

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    // Compute totals
    const totalPages = submission.documents.reduce(
      (sum, doc) => sum + (doc.pageCount || 1),
      0
    );

    const evaluationFee = 50; // You can import this from pricing.js
    const translationFeePerPage = 25;
    const translationFee = totalPages * translationFeePerPage;

    // Create the session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Evaluation Fee" },
            unit_amount: evaluationFee * 100,
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Translation Fee",
              description: `${totalPages} pages`,
            },
            unit_amount: translationFeePerPage * 100,
          },
          quantity: totalPages,
        },
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/payment-success`,
      cancel_url: `${process.env.CLIENT_URL}/student-dashboard`,
      metadata: {
        submissionId: submission.submissionId,
        studentId: studentId,
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

module.exports = router;
