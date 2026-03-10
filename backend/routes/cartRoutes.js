const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { verifyToken, isRole } = require('../middlewares/authMiddleware');

// All cart routes require user to be logged in
router.use(verifyToken);
router.use(isRole(['user', 'seller', 'admin'])); // Any logged in role can use the cart technically, but mostly users

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.put('/:id', cartController.updateCartQuantity);
router.delete('/:id', cartController.removeFromCart);
router.delete('/', cartController.clearCart);

module.exports = router;
