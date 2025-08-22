const express = require('express');
const router = express.Router();
const Address = require('../models/Address');
const { protect } = require('../middleware/authMiddleware');

// Save address (authenticated)
router.post('/save', protect(), async (req, res) => {
  const userId = req.user.id;
  const { address } = req.body;

  try {
    let existing = await Address.findOne({ where: { userId } });
    if (existing) {
      existing.address = address;
      await existing.save();
    } else {
      await Address.create({ userId, address });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Address save error:', err);
    res.status(500).json({ success: false, message: 'Failed to save address' });
  }
});

// GET /api/address/user/:id
router.get('/user/:id', protect(), async (req, res) => {
  try {
    const saved = await Address.findOne({ where: { userId: req.params.id } });
    res.json({ address: saved?.address || null });
  } catch (err) {
    res.status(500).json({ address: null });
  }
});

module.exports = router;
