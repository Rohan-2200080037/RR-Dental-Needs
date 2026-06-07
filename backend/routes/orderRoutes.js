const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, isRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

// User routes
router.post('/', isRole(['user', 'seller', 'admin']), orderController.createOrder); // POST /api/orders
router.get('/user/:id', isRole(['user', 'seller', 'admin']), orderController.getUserOrdersById); 
router.get('/my-orders', isRole(['user', 'seller', 'admin']), orderController.getUserOrders);
router.get('/seller-orders', isRole(['seller']), orderController.getSellerOrders);
router.get('/all', isRole(['admin']), orderController.getAllOrders);

router.get('/:id', isRole(['user', 'seller', 'admin']), orderController.getOrderById); // GET /api/orders/:id
router.put('/cancel/:id', isRole(['user', 'seller', 'admin']), orderController.cancelOrder);
router.delete('/:id', isRole(['user', 'seller', 'admin']), orderController.deleteOrderHistory);

// Status and Admin specific
router.put('/:id/status', isRole(['seller', 'admin']), orderController.updateOrderStatus);
router.put('/:id/payment-status', isRole(['seller', 'admin']), orderController.updatePaymentStatus);
router.put('/:id/shipping', isRole(['seller', 'admin']), orderController.updateShipping);
router.delete('/:id/admin', isRole(['admin']), orderController.deleteOrderAsAdmin);
router.put('/:id/estimated-delivery-date', isRole(['seller', 'admin']), orderController.updateEstimatedDeliveryDate);

module.exports = router;
