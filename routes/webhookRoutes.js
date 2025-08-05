const express = require("express");
const router = express.Router();
const {
  razorpayWebhookHandler,
} = require("../controllers/paymentWebhookController");

// Use raw body parser just for Razorpay webhook
router.post(
  "/webhook",
  express.raw({ type: "application/json" }), // important
  razorpayWebhookHandler
);

module.exports = router;
