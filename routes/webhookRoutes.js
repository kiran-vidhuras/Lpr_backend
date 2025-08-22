const express = require("express");
const router = express.Router();
const { razorpayWebhookHandler } = require("../controllers/paymentWebhookController");

// Use raw body parser just for Razorpay webhook at path "/"
router.post(
  "/",
  express.raw({ type: "application/json" }), // Important for webhook signature verification
  razorpayWebhookHandler
);

module.exports = router;
