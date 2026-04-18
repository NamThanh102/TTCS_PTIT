const express = require('express');
const router = express.Router();
const chapterController = require('../controllers/chapterController');
const { verifyToken, isVIP } = require('../middlewares/auth');

router.get('/:id', chapterController.getChapterById);
router.post('/:id/download', verifyToken, isVIP, chapterController.downloadChapter);

module.exports = router;
