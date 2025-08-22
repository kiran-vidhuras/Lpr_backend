const express = require("express");
const router = express.Router();
const pool = require("../config/database"); // MySQL connection pool
const { protect } = require("../middleware/authMiddleware");

// POST /api/orders - Create a new order (after payment success)
router.post("/", protect(), async (req, res) => {
  try {
    const { cartItems, address, amount } = req.body;

    // Insert new order into DB
    const [result] = await pool.query(
      `INSERT INTO orders (user_id, address, amount, status, created_at) 
       VALUES (?, ?, ?, 'Processing', NOW())`,
      [req.user.id, address, amount]
    );

    const orderId = result.insertId;

    // Save cart items in a separate table (order_items)
    for (let item of cartItems) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)`,
        [orderId, item.productId, item.quantity]
      );
    }

    res.json({ success: true, orderId });
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ success: false, message: "Order creation failed" });
  }
});

// PATCH /api/orders/:id/status - Update order status (admin only)
router.patch("/:id/status", protect("admin"), async (req, res) => {
  const { status } = req.body;
  try {
    let deliveredAt = null;
    if (status === "Delivered") {
      deliveredAt = new Date();
    }

    const [result] = await pool.query(
      `UPDATE orders SET status = ?, delivered_at = ? WHERE id = ?`,
      [status, deliveredAt, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Fetch updated order with user info
    const [order] = await pool.query(
      `SELECT o.*, u.name 
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       WHERE o.id = ?`,
      [req.params.id]
    );

    res.json(order[0]);
  } catch (err) {
    console.error("Error updating order:", err);
    res.status(500).json({ message: "Failed to update order status" });
  }
});

// GET /api/orders/user/:userId - Fetch user's orders
router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  const db = req.app.locals.db;

  try {
    const [orders] = await db.query(
      `SELECT * 
       FROM confirmed_orders
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    // Parse cart_json into items array
    const formattedOrders = orders.map(order => ({
      ...order,
      items: JSON.parse(order.cart_json || "[]"),
      address: JSON.parse(order.address_json || "{}"),
    }));

    res.status(200).json({
      success: true,
      data: formattedOrders,
    });
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
});


// GET /api/orders - Fetch all orders (admin only)
router.get("/", protect("admin"), async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.*, u.name, u.email, u.role
       FROM confirmed_orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );

    // Parse JSON columns for each order
    const formattedOrders = orders.map(order => ({
      ...order,
      address: order.address_json ? JSON.parse(order.address_json) : {},
      cartItems: order.cart_json ? JSON.parse(order.cart_json) : [],
      user: {
        id: order.user_id,
        name: order.name,
        email: order.email,
        role: order.role,
      }
    }));

    res.json(formattedOrders);
  } catch (err) {
    console.error("Error fetching all orders:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});
module.exports = router;


// const express = require("express");
// const router = express.Router();
// const Order = require("../models/Orders");  // Import the Order model
// const { protect } = require("../middleware/authMiddleware");  // Import protect middleware

// // POST /api/orders - Create a new order (after payment success)
// router.post("/", protect(), async (req, res) => {
//   try {
//     const { cartItems, address, amount } = req.body;

//     const newOrder = new Order({
//       user: req.user.id,  // The user ID comes from the JWT token (protected route)
//       cartItems,
//       address,
//       amount,
//       status: "Processing",  // Default status
//     });

//     await newOrder.save();
//     res.json({ success: true, order: newOrder });
//   } catch (err) {
//     console.error("Order creation error:", err);
//     res.status(500).json({ success: false, message: "Order creation failed" });
//   }
// });

// // PATCH /api/orders/:id/status - Update order status (admin only)
// router.patch("/:id/status", protect("admin"), async (req, res) => {
//   const { status } = req.body;

//   try {
//     const updateData = { status };

//     if (status === "Delivered") {
//       updateData.deliveredAt = new Date();  // Set the current time when delivered
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

// router.get("/user/:userId", protect(), async (req, res) => {
//   const requestedUserId = req.params.userId;

//   console.log("Requested User ID:", requestedUserId);  // Log to check the incoming user ID
//   console.log("Authenticated User ID:", req.user ? req.user.id : "No user"); // Check if the user ID from the token matches

//   // ✅ Security check: only allow access to own orders
//   if (!req.user || !req.user.id || req.user.id.toString() !== requestedUserId) {
//     return res.status(403).json({ message: "Access denied" });
//   }

//   try {
//     const orders = await Order.find({ user: requestedUserId }).sort({
//       createdAt: -1,
//     });
//     console.log("Fetched Orders:", orders); // Log the fetched orders
//     res.json(orders);
//   } catch (err) {
//     console.error("Error fetching orders:", err); // Log the error
//     res.status(500).json({ message: "Failed to fetch orders" });
//   }
// });


// // GET /api/orders - Fetch all orders (admin only)
// router.get("/", protect("admin"), async (req, res) => {
//   try {
//     const orders = await Order.find()
//       .populate("user", "name email")  // Optionally populate user info
//       .sort({ createdAt: -1 });

//     res.json(orders);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch orders" });
//   }
// });

// module.exports = router;
