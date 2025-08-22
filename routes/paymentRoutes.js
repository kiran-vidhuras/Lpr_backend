const express = require("express");
const router = express.Router();
const { createOrder, validatePayment } = require("../controllers/paymentController");
const { fetchAllPayments } = require("../services/razorpayService");

// Create order
router.post("/order", createOrder);

// Validate payment
router.post("/order/validate", validatePayment);

// Fetch all Razorpay payments
router.get("/all", async (req, res) => {
  try {
    const allPayments = await fetchAllPayments();
    res.json(allPayments);
  } catch (err) {
    console.error("Error fetching Razorpay payments:", err);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

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
