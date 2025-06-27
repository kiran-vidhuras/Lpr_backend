const express = require("express");
const router = express.Router();
const { createOrder, validatePayment } = require("../controllers/paymentController");

// Create order route
router.post("/order", createOrder);

// Validate payment route (called after payment success)
router.post("/order/validate", validatePayment);

module.exports = router;
