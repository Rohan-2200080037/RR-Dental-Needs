const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, isRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

// User routes
router.post('/create', isRole(['user', 'seller', 'admin']), orderController.createOrder); // anyone can buy
router.get('/my-orders', isRole(['user', 'seller', 'admin']), orderController.getUserOrders);
router.put('/cancel/:id', isRole(['user', 'seller', 'admin']), orderController.cancelOrder);
router.delete('/:id', isRole(['user', 'seller', 'admin']), orderController.deleteOrderHistory);

// Seller routes
router.get('/seller-orders', isRole(['seller']), orderController.getSellerOrders);
router.put('/:id/status', isRole(['seller', 'admin']), orderController.updateOrderStatus);

// Admin routes
router.get('/all', isRole(['admin']), orderController.getAllOrders);
router.delete('/:id/admin', isRole(['admin']), orderController.deleteOrderAsAdmin);

module.exports = router;
