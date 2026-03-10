const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const { verifyToken, isRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);
router.use(isRole(['user', 'seller', 'admin']));

router.post('/', addressController.createAddress);
router.get('/', addressController.getAddresses);
router.put('/:id', addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);

module.exports = router;
