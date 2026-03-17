const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { verifyToken, isRole } = require('../middlewares/authMiddleware');

// Public route to submit a message
router.post('/', contactController.submitContactMessage);

// Protected admin route to get all messages for the dashboard
router.get('/', verifyToken, isRole(['admin']), contactController.getContactMessages);

module.exports = router;
