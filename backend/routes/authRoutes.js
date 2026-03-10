const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, isRole } = require('../middlewares/authMiddleware');
const { validateRegister, validateLogin } = require('../middlewares/validationMiddleware');

router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);

router.get('/profile', verifyToken, authController.getProfile);
router.put('/profile', verifyToken, authController.updateProfile);
router.delete('/profile', verifyToken, authController.deleteAccount);

router.get('/users', [verifyToken, isRole(['admin'])], authController.getAllUsers);
router.delete('/users/:id', [verifyToken, isRole(['admin'])], authController.deleteUserAsAdmin);

module.exports = router;
