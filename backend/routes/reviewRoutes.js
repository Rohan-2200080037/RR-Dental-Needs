const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken, isRole } = require('../middlewares/authMiddleware');

router.get('/product/:productId', reviewController.getProductReviews);

router.post('/', [verifyToken, isRole(['user', 'seller', 'admin'])], reviewController.addReview);
router.put('/:id', [verifyToken, isRole(['user', 'seller', 'admin'])], reviewController.updateReview);
router.delete('/:id', [verifyToken, isRole(['user', 'seller', 'admin'])], reviewController.deleteReview); // admin can delete any as well

module.exports = router;
