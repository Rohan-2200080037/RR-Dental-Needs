const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, isRole } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.get('/category/:category', productController.getProductsByCategory);

// Protected routes (Seller/Admin)
router.post('/', [verifyToken, isRole(['seller']), upload.single('image')], productController.createProduct);
router.put('/:id', [verifyToken, isRole(['seller', 'admin']), upload.single('image')], productController.updateProduct);
router.delete('/:id', [verifyToken, isRole(['seller', 'admin'])], productController.deleteProduct);
router.get('/seller/my-products', [verifyToken, isRole(['seller'])], productController.getSellerProducts);

module.exports = router;
