const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middlewares/auth');
const { uploadSingle } = require('../middlewares/upload');

router.use(verifyToken);

router.get('/profile', userController.getProfile);
router.put('/profile', uploadSingle('avatar'), userController.updateProfile);
router.put('/password', userController.changePassword);

router.get('/library', userController.getLibrary);
router.post('/library/bookmark/:comicId', userController.toggleBookmark);
router.post('/bookmark', userController.toggleBookmark);
router.post('/library/history/:chapterId', userController.addToHistory);
router.post('/history', userController.addToHistory);

router.post('/upgrade-vip', userController.upgradeVIP);
router.post('/recharge-mpoints', userController.rechargeMPoints);

router.get('/admin/stats', isAdmin, userController.getStats);
router.get('/admin/payments', isAdmin, userController.getAdminPayments);
router.put('/admin/payments/:paymentId', isAdmin, userController.updateAdminPayment);
router.delete('/admin/payments/:paymentId', isAdmin, userController.deleteAdminPayment);
router.get('/admin/all', isAdmin, userController.getAllUsers);
router.get('/admin/:userId', isAdmin, userController.getUserById);
router.put('/admin/:userId', isAdmin, userController.updateUserByAdmin);
router.put('/admin/:userId/password', isAdmin, userController.changeUserPasswordByAdmin);
router.delete('/admin/:userId', isAdmin, userController.deleteUser);

module.exports = router;
