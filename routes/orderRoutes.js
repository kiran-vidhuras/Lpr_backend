const express = require('express');
const router = express.Router();
const Order = require('../models/Orders');
const { protect } = require('../middleware/authMiddleware');

// POST /api/orders - create order (after payment success)
router.post('/', protect(), async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    res.json({ success: true, order: newOrder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Order creation failed' });
  }
});


// PATCH /api/orders/:id/status - update order status (admin only)
router.patch('/:id/status', protect('admin'), async (req, res) => {
  const { status } = req.body;
  try {
    const updateData = { status };

    if (status === 'Delivered') {
      updateData.deliveredAt = new Date(); // set current time
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('user', 'name');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update order status' });
  }
});



// GET /api/orders/user/:userId - get user's orders

router.get('/user/:id', protect(), async (req, res) => {
  const { _id } = req.params;
  try {
    const orders = await Order.find({ userId: _id });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});


// GET /api/orders - all orders (admin only)
router.get('/', protect('admin'), async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

module.exports = router;