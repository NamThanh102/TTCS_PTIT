const express = require('express');
const commentController = require('../controllers/commentController');
const { verifyToken } = require('../middlewares/auth');

const commentRouter = express.Router({ mergeParams: true });
commentRouter.get('/', commentController.getComments);
commentRouter.post('/', verifyToken, commentController.createComment);
commentRouter.delete('/:commentId', verifyToken, commentController.deleteComment);

const latestRouter = express.Router();
latestRouter.get('/', commentController.getLatestComments);

module.exports = { commentRouter, latestRouter };
