const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/Payments");
const Product = require("../models/Product");

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// Create order
exports.createOrder = async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;
    const options = { amount, currency, receipt };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Error creating order", error);
    res.status(500).json({ error: "Server Error" });
  }
};

// Validate payment & update stock (atomic)
exports.validatePayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    cartItems,
  } = req.body;

  const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
  shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = shasum.digest("hex");

  if (digest !== razorpay_signature) {
    return res
      .status(400)
      .json({ success: false, message: "Signature mismatch" });
  }

  try {
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No cart items provided" });
    }

    await Payment.create({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      cartItems,
    });

    for (const item of cartItems) {
      const productId = item.productId || item._id;

      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { $inc: { quantity: -item.quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        console.warn(`Product with ID ${productId} not found`);
        continue;
      }

      if (updatedProduct.quantity < 0) {
        console.warn(
          `Stock warning: Product ${updatedProduct.name} has negative stock!`
        );
      }
    }

    res.json({ success: true, message: "Payment verified & stock updated." });
  } catch (error) {
    console.error("Error validating payment", error);
    res.status(500).json({ error: "Server error" });
  }
};

// const Razorpay = require("razorpay");
// const crypto = require("crypto");
// const Order = require("../models/Orders");
// const User = require("../models/User");

// const razorpayInstance = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_SECRET,
// });

// // ✅ Create Razorpay Order (called from frontend)
// exports.createOrder = async (req, res) => {
//   const { amount, userId, address, items } = req.body;

//   try {
//     const options = {
//       amount: amount * 100,
//       currency: "INR",
//       receipt: `u_${userId}_${Date.now()}`,
//       notes: {
//         userId,
//         address: JSON.stringify(address),
//         items: JSON.stringify(items),
//       },
//     };

//     const order = await razorpayInstance.orders.create(options);
//     res.status(200).json(order);
//   } catch (error) {
//     console.error("Error creating Razorpay order:", error);
//     res.status(500).json({ message: "Failed to create order" });
//   }
// };

// // ✅ Razorpay Webhook (called by Razorpay server after successful payment)
// exports.webhookHandler = async (req, res) => {
//   const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

//   const signature = req.headers["x-razorpay-signature"];
//   const payload = JSON.stringify(req.body);
//   const expectedSignature = crypto
//     .createHmac("sha256", secret)
//     .update(payload)
//     .digest("hex");

//   if (signature !== expectedSignature) {
//     console.warn("❌ Invalid webhook signature");
//     return res.status(400).send("Invalid signature");
//   }

//   const event = req.body.event;
//   const payment = req.body.payload?.payment?.entity;

//   if (event === "payment.captured" && payment) {
//     try {
//       const orderId = payment.order_id;
//       const notes = payment.notes || {};

//       const userId = notes.userId || null;
//       if (!userId) return res.status(400).send("User ID missing");

//       const address = notes.address ? JSON.parse(notes.address) : {};
//       const items = notes.items ? JSON.parse(notes.items) : [];

//       const orderExists = await Order.findOne({ paymentId: payment.id });
//       if (orderExists) return res.status(200).send("Order already saved");

//       const newOrder = new Order({
//         user: userId,
//         amount: payment.amount / 100,
//         paymentId: payment.id,
//         razorpayOrderId: orderId,
//         receiptId: payment.receipt,
//         status: "Paid",
//         address,
//         items,
//       });

//       await newOrder.save();
//       return res.status(200).json({ message: "✅ Order saved from webhook" });
//     } catch (err) {
//       console.error("Webhook Error:", err);
//       return res.status(500).json({ message: "Webhook order save failed" });
//     }
//   }

//   res.status(200).json({ status: "Webhook received" });
// };
