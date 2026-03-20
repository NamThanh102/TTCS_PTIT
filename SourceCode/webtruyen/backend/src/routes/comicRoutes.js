const express = require('express');
const router = express.Router();
const comicController = require('../controllers/comicController');
const chapterController = require('../controllers/chapterController');
const { verifyToken, isAdmin } = require('../middlewares/auth');
const { uploadSingle, uploadMultiple } = require('../middlewares/upload');

// Public routes
router.get('/', comicController.getAllComics);
router.get('/slug/:slug', comicController.getComicBySlug);
router.get('/slug/:slug/chapters', comicController.getChaptersBySlug);
router.get('/:id/chapters', comicController.getChaptersByComicId);
router.get('/:id', comicController.getComicById);
router.post('/:id/view', comicController.increaseView);

// Admin routes
router.post(
  '/',
  verifyToken,
  isAdmin,
  uploadSingle('coverImage'),
  comicController.createComic
);

router.put(
  '/:id',
  verifyToken,
  isAdmin,
  uploadSingle('coverImage'),
  comicController.updateComic
);

router.delete('/:id', verifyToken, isAdmin, comicController.deleteComic);

router.post(
  '/:comicId/chapters',
  verifyToken,
  isAdmin,
  uploadMultiple('pages', 100),
  chapterController.createChapter
);

module.exports = router;
