const express = require('express');
const router = express.Router();

// Use relative paths (../) for local files
const contactController = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');

// Public route to submit contact form
router.post('/submit', contactController.submitContact);

// Admin route to get all submissions (protected)
router.get('/all', protect('admin'), contactController.getAllContacts);

module.exports = router;
