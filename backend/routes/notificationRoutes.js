const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', notificationController.getNotifications);
router.put('/read/:id', notificationController.markAsRead);

module.exports = router;
