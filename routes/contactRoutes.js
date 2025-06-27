const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');

// Public route to submit contact form
router.post('/submit', contactController.submitContact);

// Admin route to get all submissions (protect admin)
router.get('/all', protect('admin'), contactController.getAllContacts);

module.exports = router;
