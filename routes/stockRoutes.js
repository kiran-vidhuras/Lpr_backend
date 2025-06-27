const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// POST /api/stock/check
router.post('/check', async (req, res) => {
  const { cartItems } = req.body;

  if (!Array.isArray(cartItems)) {
    return res.json({ success: false, message: 'Invalid cart items' });
    
  }

  try {
    for (const item of cartItems) {
      const product = await Product.findById(item.productId);
       if (!product) {
        return res.json({ success: false, message: `Product ${item.productId} not found` });
      }

      if (product.quantity < item.quantity) {
        return res.json({ 
          success: false, 
          message: `Product ${product.name} only has ${product.quantity} left.` 
        });
      }
    }

    return res.json({ success: true, message: 'Stock available' });
  } catch (error) {
    console.error('Stock check error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
