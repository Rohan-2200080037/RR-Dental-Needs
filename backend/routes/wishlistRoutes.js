const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { verifyToken, isRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);
router.use(isRole(['user', 'seller', 'admin']));

router.post('/', wishlistController.addToWishlist);
router.post('/add', wishlistController.addToWishlist); // Alias for compatibility with instructions
router.get('/', wishlistController.getWishlist);
router.post('/:id/move-to-cart', wishlistController.moveToCart);
router.delete('/:id', wishlistController.removeFromWishlist);
router.delete('/remove/:productId', wishlistController.removeFromWishlistByProduct);

module.exports = router;
