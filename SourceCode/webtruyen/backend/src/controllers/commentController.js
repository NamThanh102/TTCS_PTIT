const Comment = require('../models/Comment');
const Comic = require('../models/Comic');
const Chapter = require('../models/Chapter');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middlewares/errorHandler');


exports.getComments = asyncHandler(async (req, res, next) => {
  const { comicId } = req.params;
  const { chapterId } = req.query;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  const filter = { comicId };
  if (chapterId) filter.chapterId = chapterId;

  const skip = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    Comment.find(filter)
      .populate('userId', 'username avatar displayName')
      .populate('chapterId', 'chapterNumber title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Comment.countDocuments(filter)
  ]);

  res.status(200).json({ success: true, statusCode: 200, message: 'Comments retrieved', data: {
    comments,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalComments: total,
      limit
    }
  } });
});

exports.createComment = asyncHandler(async (req, res, next) => {
  const comicId = req.params.comicId || req.body.comicId;
  const { chapterId, content } = req.body;

  if (!content || !content.trim()) {
    return next(new AppError('Nội dung bình luận không được để trống', 400));
  }

  if (!comicId) return next(new AppError('Comic ID is required', 400));

  const comic = await Comic.findById(comicId);
  if (!comic) return next(new AppError('Comic not found', 404));

  if (chapterId) {
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) return next(new AppError('Chapter not found', 404));
  }

  const comment = await Comment.create({
    comicId,
    chapterId: chapterId || null,
    userId: req.user._id,
    content: content.trim()
  });

  const populated = await Comment.findById(comment._id)
    .populate('userId', 'username avatar displayName')
    .populate('chapterId', 'chapterNumber title');

  res.status(201).json({ success: true, statusCode: 201, message: 'Bình luận thành công', data: { comment: populated } });
});

exports.deleteComment = asyncHandler(async (req, res, next) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);
  if (!comment) return next(new AppError('Comment not found', 404));

  if (comment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Bạn không có quyền xóa bình luận này', 403));
  }

  await comment.deleteOne();

  res.status(200).json({ success: true, statusCode: 200, message: 'Xóa bình luận thành công' });
});
