const crypto = require("crypto");
const Order = require("../models/Orders");

exports.razorpayWebhookHandler = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const signature = req.headers["x-razorpay-signature"];
  const body = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  if (expectedSignature !== signature) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid signature" });
  }

  if (req.body.event !== "payment.captured") {
    return res.status(200).json({ message: "Ignored non-payment event" });
  }

  const payment = req.body.payload.payment.entity;

  try {
    const metadata = payment.notes;

    const order = new Order({
      user: metadata.userId,
      cartItems: JSON.parse(metadata.cartItems),
      address: JSON.parse(metadata.address),
      amount: Number(payment.amount) / 100,
      status: "Processing",
    });

    await order.save();

    return res
      .status(200)
      .json({ success: true, message: "Order created from webhook" });
  } catch (err) {
    console.error("Webhook processing failed:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
