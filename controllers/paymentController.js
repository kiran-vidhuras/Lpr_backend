// const Razorpay = require("razorpay");
// const crypto = require("crypto");
// const Payment = require("../models/Payments");
// const Product = require("../models/Product");

// // Razorpay instance
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_SECRET,
// });

// // Create order
// exports.createOrder = async (req, res) => {
//   try {
//     const { amount, currency, receipt } = req.body;
//     const options = { amount, currency, receipt };
//     const order = await razorpay.orders.create(options);
//     res.json(order);
//   } catch (error) {
//     console.error("Error creating order", error);
//     res.status(500).json({ error: "Server Error" });
//   }
// };

// // Validate payment & update stock (atomic)
// exports.validatePayment = async (req, res) => {
//   const {
//     razorpay_order_id,
//     razorpay_payment_id,
//     razorpay_signature,
//     cartItems,
//   } = req.body;

//   const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
//   shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
//   const digest = shasum.digest("hex");

//   if (digest !== razorpay_signature) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Signature mismatch" });
//   }

//   try {
//     if (!Array.isArray(cartItems) || cartItems.length === 0) {
//       return res
//         .status(400)
//         .json({ success: false, message: "No cart items provided" });
//     }

//     await Payment.create({
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       cartItems,
//     });

//     for (const item of cartItems) {
//       const productId = item.productId || item._id;

//       const updatedProduct = await Product.findByIdAndUpdate(
//         productId,
//         { $inc: { quantity: -item.quantity } },
//         { new: true }
//       );

//       if (!updatedProduct) {
//         console.warn(`Product with ID ${productId} not found`);
//         continue;
//       }

//       if (updatedProduct.quantity < 0) {
//         console.warn(
//           `Stock warning: Product ${updatedProduct.name} has negative stock!`
//         );
//       }
//     }

//     res.json({ success: true, message: "Payment verified & stock updated." });
//   } catch (error) {
//     console.error("Error validating payment", error);
//     res.status(500).json({ error: "Server error" });
//   }
// };

const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Orders");
const Payment = require("../models/Payments");
const Address = require("../models/Address");

const { sendUserEmail, sendAdminEmail } = require("../utils/sendOrderEmails");

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

// exports.validatePayment = async (req, res) => {
//   const {
//     razorpay_order_id,
//     razorpay_payment_id,
//     razorpay_signature,
//     cartItems,
//     userId,
//     address,
//   } = req.body;

//   const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
//   shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
//   const digest = shasum.digest("hex");

//   if (digest !== razorpay_signature) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Invalid signature" });
//   }

//   try {
//     // ✅ Save Payment
//     await Payment.create({
//       cartItems,
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//     });

//     // ✅ Save/Update Address
//     await Address.findOneAndUpdate(
//       { userId: userId },
//       { userId: userId, address },
//       { upsert: true, new: true }
//     );

//     // ✅ Save Order
//     const subTotal = cartItems.reduce((acc, item) => {
//       const price = Number(item.price) || 0;
//       const quantity = Number(item.quantity) || 0;
//       return acc + price * quantity;
//     }, 0);

//     const gst = parseFloat((subTotal * 0.05).toFixed(2));
//     const totalAmount = subTotal + gst;
//     if (isNaN(totalAmount)) {
//       console.error("❌ Invalid total amount (NaN). Check cart items.");
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid total amount" });
//     }

//     const newOrder = new Order({
//       user: userId,
//       cartItems,
//       amount: totalAmount,
//       address,
//       status: "Processing",
//     });

//     await newOrder.save();

//     res.status(200).json({ success: true });
//   } catch (err) {
//     console.error("Error in validatePayment:", err);
//     res
//       .status(500)
//       .json({ success: false, message: "Error saving payment/order" });
//   }
// };

exports.validatePayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    cartItems,
    userId,
    address,
    totalAmount, // coming from frontend (already includes GST + delivery)
  } = req.body;

  const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
  shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = shasum.digest("hex");

  if (digest !== razorpay_signature) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid signature" });
  }

  try {
    await Payment.create({
      cartItems,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    await Address.findOneAndUpdate(
      { userId },
      { userId, address },
      { upsert: true, new: true }
    );

    const newOrder = new Order({
      user: userId,
      cartItems,
      amount: totalAmount, // ✅ this is final amount sent from frontend
      address,
      status: "Processing",
    });

    await newOrder.save();

    await sendUserEmail(
      address.email,
      cartItems,
      totalAmount,
      address,
      razorpay_payment_id,
      razorpay_order_id
    );
    await sendAdminEmail(
      cartItems,
      totalAmount,
      address,
      razorpay_payment_id,
      razorpay_order_id
    );

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error in validatePayment:", err);
    res
      .status(500)
      .json({ success: false, message: "Error saving payment/order" });
  }
};
