const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isRole } = require('../middlewares/authMiddleware');
const reviewController = require('../controllers/reviewController');

router.use(verifyToken);
router.use(isRole(['admin']));

router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser);

router.get('/sellers', adminController.getSellers);
router.put('/sellers/:id/status', adminController.updateSellerStatus);

router.get('/analytics', adminController.getAnalytics);

router.get('/reviews', reviewController.getAllReviews);

module.exports = router;
