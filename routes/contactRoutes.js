const express = require('express');
const router = express.Router();

const contactController = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');

router.post('/submit', contactController.submitContact);

router.get('/all', protect('admin'), contactController.getAllContacts);

module.exports = router;
