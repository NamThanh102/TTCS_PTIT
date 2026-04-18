const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/library', userController.getLibrary);
router.post('/library/bookmark/:comicId', userController.toggleBookmark);
router.post('/library/history/:chapterId', userController.addToHistory);

module.exports = router;
