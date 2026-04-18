const User = require('../models/user');
const Comic = require('../models/Comic');
const Chapter = require('../models/Chapter');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middlewares/errorHandler');
const { successResponse } = require('../utils/responseHelper');

exports.toggleBookmark = asyncHandler(async (req, res, next) => {
  const comicId = req.params.comicId || req.body.comicId;

  if (!comicId) {
    return next(new AppError('Comic ID is required', 400));
  }

  const user = await User.findById(req.user._id);
  const comic = await Comic.findById(comicId);

  if (!comic) {
    return next(new AppError('Comic not found', 404));
  }

  const bookmarkIndex = user.library.bookmarks.findIndex(
    (b) => b.comicId.toString() === comicId
  );

  let message;
  if (bookmarkIndex > -1) {
    user.library.bookmarks.splice(bookmarkIndex, 1);
    message = 'Bookmark removed';

    await Comic.findByIdAndUpdate(comicId, {
      $inc: { 'statistics.totalBookmarks': -1 }
    });
  } else {
    user.library.bookmarks.unshift({
      comicId,
      addedAt: Date.now()
    });
    message = 'Bookmark added';

    await Comic.findByIdAndUpdate(comicId, {
      $inc: { 'statistics.totalBookmarks': 1 }
    });
  }

  await user.save();

  successResponse(res, 200, message, { bookmarks: user.library.bookmarks });
});

exports.getLibrary = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate({
      path: 'library.bookmarks.comicId',
      select: 'title slug coverImage author status statistics'
    })
    .populate({
      path: 'library.history.comicId',
      select: 'title slug coverImage'
    })
    .populate({
      path: 'library.history.chapterId',
      select: 'chapterNumber title'
    });

  successResponse(res, 200, 'Library retrieved successfully', {
    bookmarks: user.library.bookmarks,
    history: user.library.history
  });
});

exports.addToHistory = asyncHandler(async (req, res, next) => {
  const chapterId = req.params.chapterId || req.body.chapterId;
  const { comicId, lastReadPage } = req.body;

  if (!chapterId) {
    return next(new AppError('Chapter ID is required', 400));
  }

  let finalComicId = comicId;
  if (!finalComicId) {
    const chapter = await Chapter.findById(chapterId).select('comicId');
    if (!chapter) {
      return next(new AppError('Chapter not found', 404));
    }
    finalComicId = chapter.comicId;
  }

  await User.findByIdAndUpdate(req.user._id, {
    $pull: { 'library.history': { comicId: finalComicId } }
  });

  await User.findByIdAndUpdate(req.user._id, {
    $push: {
      'library.history': {
        $each: [{
          comicId: finalComicId,
          chapterId,
          lastReadPage: lastReadPage || 0,
          lastReadAt: Date.now()
        }],
        $position: 0,
        $slice: 100
      }
    }
  });

  successResponse(res, 200, 'Added to reading history');
});

module.exports = exports;
