const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.post('/create-order', verifyToken, paymentController.createRazorpayOrder);
router.post('/verify', verifyToken, paymentController.verifyPayment);

// PhonePe Routes
router.post('/phonepe-initiate', verifyToken, paymentController.initiatePhonePePayment);
router.post('/phonepe-callback', paymentController.phonepeCallback); // No verifyToken, security handled by checksum
router.get('/phonepe-status/:merchantTransactionId', verifyToken, paymentController.checkPhonePeStatus);
router.post('/phonepe-verify-final', verifyToken, paymentController.verifyPayment); // Reusing logic for order creation

module.exports = router;
