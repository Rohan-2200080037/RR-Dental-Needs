const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.post('/create-order', paymentController.createRazorpayOrder);
router.post('/verify', paymentController.verifyPayment);

module.exports = router;
