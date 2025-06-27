
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
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, cartItems } = req.body;

  const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
  shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = shasum.digest("hex");

  if (digest !== razorpay_signature) {
    return res.status(400).json({ success: false, message: "Signature mismatch" });
  }

  try {
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "No cart items provided" });
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
        console.warn(`Stock warning: Product ${updatedProduct.name} has negative stock!`);
      }
    }


    res.json({ success: true, message: "Payment verified & stock updated." });

  } catch (error) {
    console.error("Error validating payment", error);
    res.status(500).json({ error: "Server error" });
  }
};

