const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middlewares/auth');

router.use(verifyToken, isAdmin);

router.get('/stats', userController.getStats);
router.get('/payments', userController.getAdminPayments);
router.put('/payments/:paymentId', userController.updateAdminPayment);
router.delete('/payments/:paymentId', userController.deleteAdminPayment);
router.get('/users', userController.getAllUsers);
router.put('/users/:userId', userController.updateUserByAdmin);
router.put('/users/:userId/password', userController.changeUserPasswordByAdmin);
router.delete('/users/:userId', userController.deleteUser);

module.exports = router;
