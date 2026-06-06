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
router.post('/library/history/:chapterId', userController.addToHistory);

router.post('/upgrade-vip', userController.upgradeVIP);
router.post('/recharge-mpoints', userController.rechargeMPoints);

module.exports = router;
