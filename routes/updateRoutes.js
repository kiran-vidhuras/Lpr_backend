const express = require('express');
const router = express.Router();
const { Update } = require('../models/Update');
const { protect } = require('../middleware/authMiddleware');

// Create new update
router.post('/', protect('admin'), async (req, res) => {
  try {
    const { title, content, youtubeLink, awardByTitle } = req.body;
    const update = await Update.create({ title, content, youtubeLink, awardByTitle });
    res.status(201).json(update);
  } catch (error) {
    console.error('Error creating update:', error);
    res.status(500).json({ message: 'Error creating update' });
  }
});

// Get all updates
router.get('/', async (req, res) => {
  try {
    const updates = await Update.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json(updates);
  } catch (error) {
    console.error('Error fetching updates:', error);
    res.status(500).json({ message: 'Server error fetching updates' });
  }
});

// Update update by id
router.put('/:id', protect('admin'), async (req, res) => {
  try {
    const { title, content, youtubeLink } = req.body;
    const update = await Update.findByPk(req.params.id);
    if (!update) return res.status(404).json({ message: "Update not found" });
    update.title = title;
    update.content = content;
    update.youtubeLink = youtubeLink;
    await update.save();
    res.json(update);
  } catch (error) {
    console.error('Error updating update:', error);
    res.status(500).json({ message: 'Error updating update' });
  }
});

// Delete update by id
router.delete('/:id', protect('admin'), async (req, res) => {
  try {
    const deleted = await Update.destroy({
      where: { id: req.params.id },
    });
    if (!deleted) return res.status(404).json({ message: 'Update not found' });
    res.json({ message: 'Update deleted' });
  } catch (error) {
    console.error('Error deleting update:', error);
    res.status(500).json({ message: 'Error deleting update' });
  }
});

module.exports = router;