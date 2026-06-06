const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');
const { verifyToken, isRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/rates', shippingController.getRates);
router.post('/create/:orderId', isRole(['seller', 'admin']), shippingController.createShipment);
router.post('/assign-awb/:shipmentId', isRole(['seller', 'admin']), shippingController.assignAWB);
router.post('/pickup/:shipmentId', isRole(['seller', 'admin']), shippingController.requestPickup);
router.post('/label/:shipmentId', isRole(['seller', 'admin']), shippingController.generateLabel);
router.get('/track/:awb', shippingController.trackShipment);

module.exports = router;
