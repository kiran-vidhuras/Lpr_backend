const express = require('express');
const router = express.Router();
const Update = require('../models/Update');
const { protect } = require('../middleware/authMiddleware');

// 👉 Add new update
router.post('/', protect('admin'), async (req, res) => {
  const { title, content, youtubeLink } = req.body;
  const update = new Update({ title, content, youtubeLink });
  await update.save();
  res.status(201).json(update);
});

// 👉 Get all updates
router.get('/', async (req, res) => {
  const updates = await Update.find().sort({ createdAt: -1 });
  res.json(updates);
});

// 👉 Delete update
router.delete('/:id', protect('admin'), async (req, res) => {
  const deleted = await Update.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Update not found' });
  res.json({ message: 'Update deleted' });
});

// 👉 Update update
router.put('/:id', protect('admin'), async (req, res) => {
  const { title, content, youtubeLink } = req.body;
  const updated = await Update.findByIdAndUpdate(
    req.params.id,
    { title, content, youtubeLink },
    { new: true }
  );
  if (!updated) return res.status(404).json({ message: 'Update not found' });
  res.json(updated);
});

module.exports = router;
