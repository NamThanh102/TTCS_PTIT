const express = require('express');
const router = express.Router();
const chapterController = require('../controllers/chapterController');
const { verifyToken, isAdmin } = require('../middlewares/auth');
const { uploadMultiple } = require('../middlewares/upload');

router.get('/:id', verifyToken, chapterController.getChapterById);

router.put('/:id', verifyToken, isAdmin, uploadMultiple('pages', 100), chapterController.updateChapter);
router.delete('/:id', verifyToken, isAdmin, chapterController.deleteChapter);

module.exports = router;
