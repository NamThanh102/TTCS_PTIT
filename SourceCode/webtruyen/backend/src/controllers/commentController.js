const Comment = require('../models/Comment');
const Comic = require('../models/Comic');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middlewares/errorHandler');
const { successResponse } = require('../utils/responseHelper');

exports.getComments = asyncHandler(async (req, res, next) => {
  const { comicId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  const comic = await Comic.findById(comicId);
  if (!comic) return next(new AppError('Comic not found', 404));

  const skip = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    Comment.find({ comicId })
      .populate('userId', 'username avatar displayName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Comment.countDocuments({ comicId })
  ]);

  successResponse(res, 200, 'Comments retrieved', {
    comments,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalComments: total,
      limit
    }
  });
});

exports.createComment = asyncHandler(async (req, res, next) => {
  const { comicId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return next(new AppError('Nội dung bình luận không được để trống', 400));
  }

  const comic = await Comic.findById(comicId);
  if (!comic) return next(new AppError('Comic not found', 404));

  const comment = await Comment.create({
    comicId,
    userId: req.user._id,
    content: content.trim()
  });

  const populated = await Comment.findById(comment._id)
    .populate('userId', 'username avatar displayName');

  successResponse(res, 201, 'Bình luận thành công', { comment: populated });
});

exports.deleteComment = asyncHandler(async (req, res, next) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);
  if (!comment) return next(new AppError('Comment not found', 404));

  if (comment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Bạn không có quyền xóa bình luận này', 403));
  }

  await comment.deleteOne();

  successResponse(res, 200, 'Xóa bình luận thành công');
});
