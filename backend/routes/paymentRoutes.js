const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.post('/create-order', verifyToken, paymentController.createRazorpayOrder);
router.post('/verify', verifyToken, paymentController.verifyPayment);


module.exports = router;
