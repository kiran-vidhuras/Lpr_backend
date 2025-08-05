const express = require("express");
const router = express.Router();
const Order = require("../models/Orders");
const { protect } = require("../middleware/authMiddleware");

// POST /api/orders - create order (after payment success)

router.post("/", protect(), async (req, res) => {
  try {
    const { cartItems, address, amount } = req.body;

    const newOrder = new Order({
      user: req.user._id, // ✅ pulled from token, not frontend
      cartItems,
      address,
      amount,
      status: "Processing",
    });

    await newOrder.save();
    res.json({ success: true, order: newOrder });
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ success: false, message: "Order creation failed" });
  }
});

// PATCH /api/orders/:id/status - update order status (admin only)
router.patch("/:id/status", protect("admin"), async (req, res) => {
  const { status } = req.body;
  try {
    const updateData = { status };

    if (status === "Delivered") {
      updateData.deliveredAt = new Date(); // set current time
    }

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    }).populate("user", "name");

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update order status" });
  }
});

// router.get("/user/:id", protect(), async (req, res) => {
//   const { _id } = req.params;
//   try {
//     const orders = await Order.find({ userId: _id });
//     res.json(orders);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch orders" });
//   }
// });

router.get("/user/:id", protect(), async (req, res) => {
  const requestedUserId = req.params.id;

  // ✅ Security check: only allow access to own orders
  if (req.user._id.toString() !== requestedUserId) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const orders = await Order.find({ user: requestedUserId }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// GET /api/orders - all orders (admin only)
router.get("/", protect("admin"), async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

module.exports = router;

// // 📁 backend/routes/orderRoutes.js
// const express = require("express");
// const router = express.Router();
// const Order = require("../models/Orders");
// const { protect } = require("../middleware/authMiddleware");

// // ✅ Create order after successful payment (from frontend)
// router.post("/", protect(), async (req, res) => {
//   try {
//     const newOrder = new Order(req.body);
//     await newOrder.save();
//     res.json({ success: true, order: newOrder });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Order creation failed" });
//   }
// });

// // ✅ Update order status (admin only)
// router.patch("/:id/status", protect("admin"), async (req, res) => {
//   const { status } = req.body;
//   try {
//     const updateData = { status };
//     if (status === "Delivered") {
//       updateData.deliveredAt = new Date();
//     }
//     const order = await Order.findByIdAndUpdate(req.params.id, updateData, {
//       new: true,
//     }).populate("user", "name");

//     if (!order) return res.status(404).json({ message: "Order not found" });

//     res.json(order);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to update order status" });
//   }
// });

// // ✅ Get logged-in user's orders
// router.get("/user/:id", protect(), async (req, res) => {
//   try {
//     const orders = await Order.find({ user: req.params.id }).sort({
//       createdAt: -1,
//     });
//     res.json(orders);
//   } catch (err) {
//     console.error("Error fetching user orders:", err);
//     res.status(500).json({ message: "Failed to fetch orders" });
//   }
// });

// // ✅ Get all orders (admin only)
// router.get("/", protect("admin"), async (req, res) => {
//   try {
//     const orders = await Order.find()
//       .populate("user", "name email")
//       .sort({ createdAt: -1 });
//     res.json(orders);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch orders" });
//   }
// });

// // ✅ Webhook for Razorpay to create fallback order if not saved from frontend
// router.post(
//   "/webhook",
//   express.raw({ type: "application/json" }),
//   async (req, res) => {
//     const crypto = require("crypto");
//     const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

//     const signature = req.headers["x-razorpay-signature"];
//     const body = req.body;
//     const generatedSignature = crypto
//       .createHmac("sha256", secret)
//       .update(JSON.stringify(body))
//       .digest("hex");

//     if (signature !== generatedSignature) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid signature" });
//     }

//     try {
//       if (body.event === "payment.captured") {
//         const { id, amount, notes } = body.payload.payment.entity;
//         const userId = notes.userId;
//         const cartItems = JSON.parse(notes.cartItems);
//         const address = JSON.parse(notes.address);

//         const newOrder = new Order({
//           user: userId,
//           cartItems,
//           address,
//           amount: amount / 100, // convert paise to rupees
//           status: "Processing",
//         });

//         await newOrder.save();
//         return res.status(200).json({ success: true });
//       } else {
//         return res
//           .status(200)
//           .json({ success: true, message: "Unhandled event" });
//       }
//     } catch (err) {
//       console.error("Webhook error:", err);
//       res
//         .status(500)
//         .json({ success: false, message: "Webhook processing failed" });
//     }
//   }
// );

// module.exports = router;
