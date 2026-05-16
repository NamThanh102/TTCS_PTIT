const express = require('express');
const router = express.Router();
const chapterController = require('../controllers/chapterController');
const { verifyToken, isAdmin, isVIP } = require('../middlewares/auth');

router.get('/:id', chapterController.getChapterById);
router.post('/:id/download', verifyToken, isVIP, chapterController.downloadChapter);

router.put('/:id', verifyToken, isAdmin, chapterController.updateChapter);
router.delete('/:id', verifyToken, isAdmin, chapterController.deleteChapter);

module.exports = router;
