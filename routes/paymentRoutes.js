const express = require("express");
const router = express.Router();
const {
  createOrder,
  validatePayment,
} = require("../controllers/paymentController");

// Create order route
router.post("/order", createOrder);

// Validate payment route (called after payment success)
router.post("/order/validate", validatePayment);

module.exports = router;

// const express = require("express");
// const {
//   createOrder,
//   webhookHandler,
// } = require("../controllers/paymentController");

// const router = express.Router();

// router.post("/create-order", createOrder); // Called from Checkout
// router.post(
//   "/webhook",
//   express.json({ type: "application/json" }),
//   webhookHandler
// ); // Called by Razorpay

// module.exports = router;
