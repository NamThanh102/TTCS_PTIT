const express = require('express');
const router = express.Router({ mergeParams: true });
const commentController = require('../controllers/commentController');
const { verifyToken, isAdmin, optionalAuth } = require('../middlewares/auth');

router.get('/', commentController.getComments);
router.post('/', verifyToken, commentController.createComment);
router.delete('/:commentId', verifyToken, commentController.deleteComment);

module.exports = router;
