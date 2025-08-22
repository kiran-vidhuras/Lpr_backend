// controllers/paymentWebhookController.js
const crypto = require("crypto");
const { Order } = require("../models/Orders");

const Address = require("../models/Address");
const OrderItem = require("../models/Payments"); // add this

exports.razorpayWebhookHandler = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];
  const body = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  if (expectedSignature !== signature) {
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }

  if (req.body.event !== "payment.captured") {
    return res.status(200).json({ message: "Ignored non-payment event" });
  }

  const payment = req.body.payload.payment.entity;

  try {
    const metadata = payment.notes;

    if (!metadata.userId) {
      return res.status(400).json({ success: false, message: "Missing userId in metadata" });
    }

    // 1️⃣ Parse metadata safely
    const cartItems = JSON.parse(metadata.cartItems || "[]");
    const addressData = JSON.parse(metadata.address || "{}");

    // 2️⃣ Check if order already exists (idempotency)
    const existingOrder = await Order.findOne({ where: { razorpayPaymentId: payment.id } });
    if (existingOrder) {
      return res.status(200).json({ success: true, message: "Order already processed" });
    }

    // 3️⃣ Create address
    const address = await Address.create({
      firstName: addressData.firstName,
      lastName: addressData.lastName,
      email: addressData.email,
      phone: addressData.phone,
      street: addressData.street,
      city: addressData.city,
      state: addressData.state,
      zip: addressData.zip,
      country: addressData.country,
      userId: metadata.userId
    });

    // 4️⃣ Create order
    const order = await Order.create({
      userId: metadata.userId,
      totalAmount: Number(payment.amount) / 100,
      status: "pending",
      paymentStatus: "paid",
      razorpayPaymentId: payment.id
    });

    // 5️⃣ Create order items
    const orderItems = cartItems.map(item => ({
      orderId: order.id,
      productId: item.productId,
      variantId: item.variantId || null,
      quantity: item.quantity,
      price: item.price
    }));

    await OrderItem.bulkCreate(orderItems);

    return res.status(200).json({ success: true, message: "Order created from webhook" });

  } catch (err) {
    console.error("Webhook processing failed:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
