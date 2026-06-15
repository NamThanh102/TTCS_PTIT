const Chapter = require('../models/Chapter');
const Comic = require('../models/Comic');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middlewares/errorHandler');

const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

exports.getChapterById = asyncHandler(async (req, res, next) => {
  const chapter = await Chapter.findById(req.params.id)
    .populate('comicId', 'title slug author')
    .populate('previousChapter', 'chapterNumber title slug')
    .populate('nextChapter', 'chapterNumber title slug');

  if (!chapter) {
    return next(new AppError('Chapter not found', 404));
  }

  if (chapter.isVIPOnly) {
    const now = new Date();
    const isVipActive = req.user?.isVIP && (!req.user?.vipExpireDate || now < new Date(req.user.vipExpireDate));
    if (!isVipActive) {
      return next(new AppError('Chapter này yêu cầu tài khoản VIP', 403));
    }
  }

  chapter.views += 1;
  await chapter.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, statusCode: 200, message: 'Chapter retrieved successfully', data: { chapter } });
});

exports.createChapter = asyncHandler(async (req, res, next) => {
  const comicId = req.params.comicId || req.body.comicId;
  const { chapterNumber, title, isPublished, isVIPOnly } = req.body;

  if (!comicId || !chapterNumber) {
    return next(new AppError('Please provide comic ID and chapter number', 400));
  }

  const comic = await Comic.findById(comicId);
  if (!comic) {
    return next(new AppError('Comic not found', 404));
  }

  const existingChapter = await Chapter.findOne({ comicId, chapterNumber });
  if (existingChapter) {
    return next(new AppError('Chapter number already exists for this comic', 400));
  }

  if (!req.files || req.files.length === 0) {
    return next(new AppError('Please upload at least one page', 400));
  }

  const uploadPromises = req.files.map((file, index) => {
    return uploadToCloudinary(
      file.buffer,
      `metruyen/comics/${comic.slug}/chapter-${chapterNumber}`
    ).then((result) => ({
      url: result.url,
      publicId: result.publicId,
      width: result.width,
      height: result.height,
      order: index + 1
    }));
  });

  const pages = await Promise.all(uploadPromises);

  const chapter = await Chapter.create({
    comicId,
    chapterNumber,
    title,
    pages,
    isPublished: isPublished !== undefined ? (isPublished === 'true' || isPublished === true) : true,
    publishDate: isPublished !== 'false' && isPublished !== false ? Date.now() : null,
    isVIPOnly: isVIPOnly !== undefined ? (isVIPOnly === 'true' || isVIPOnly === true) : false
  });

  await updateChapterNavigation(comicId);
  await comic.updateChapterCount();

  res.status(201).json({ success: true, statusCode: 201, message: 'Chapter created successfully', data: { chapter } });
});

async function updateChapterNavigation(comicId) {
  const chapters = await Chapter.find({ comicId }).sort({ chapterNumber: 1 }).lean();
  if (chapters.length === 0) return;

  const bulkOps = chapters.map((ch, i) => ({
    updateOne: {
      filter: { _id: ch._id },
      update: {
        $set: {
          previousChapter: i > 0 ? chapters[i - 1]._id : null,
          nextChapter: i < chapters.length - 1 ? chapters[i + 1]._id : null
        }
      }
    }
  }));

  await Chapter.bulkWrite(bulkOps);
}

exports.updateChapter = asyncHandler(async (req, res, next) => {
  const chapterId = req.params.id;
  const { title, isPublished, isVIPOnly, keptPages } = req.body;

  const chapter = await Chapter.findById(chapterId);
  if (!chapter) return next(new AppError('Chapter not found', 404));

  if (title !== undefined) chapter.title = title;
  if (isPublished !== undefined) {
    chapter.isPublished = isPublished === 'true' || isPublished === true;
    chapter.publishDate = chapter.isPublished ? (chapter.publishDate || Date.now()) : null;
  }
  if (isVIPOnly !== undefined) chapter.isVIPOnly = isVIPOnly === 'true' || isVIPOnly === true;

  if (keptPages !== undefined) {
    let keptList = [];
    try { keptList = JSON.parse(keptPages); } catch {}
    const keptIds = keptList.map(k => k._id);

    const toRemove = chapter.pages.filter(p => !keptIds.includes(p._id.toString()));
    for (const page of toRemove) {
      if (page.publicId) {
        try { await deleteFromCloudinary(page.publicId); } catch {}
      }
    }

    const keptMap = {};
    chapter.pages.forEach(p => { keptMap[p._id.toString()] = p; });
    chapter.pages = keptList
      .filter(k => keptMap[k._id])
      .map((k, i) => {
        const p = keptMap[k._id];
        p.order = i + 1;
        return p;
      });
  }

  if (req.files && req.files.length > 0) {
    const comic = await Comic.findById(chapter.comicId).select('slug');
    const startOrder = chapter.pages.length + 1;
    const uploadPromises = req.files.map((file, index) =>
      uploadToCloudinary(
        file.buffer,
        `metruyen/comics/${comic.slug}/chapter-${chapter.chapterNumber}`
      ).then(result => ({
        url: result.url,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
        order: startOrder + index
      }))
    );
    const newPages = await Promise.all(uploadPromises);
    chapter.pages.push(...newPages);
  }

  await chapter.save();

  res.status(200).json({ success: true, statusCode: 200, message: 'Chapter updated successfully', data: { chapter } });
});

exports.deleteChapter = asyncHandler(async (req, res, next) => {
  const chapterId = req.params.id;
  const chapter = await Chapter.findById(chapterId);
  if (!chapter) return next(new AppError('Chapter not found', 404));

  // delete pages from cloudinary when publicId present
  try {
    for (const p of chapter.pages || []) {
      if (p.publicId) {
        await deleteFromCloudinary(p.publicId);
      }
    }
  } catch (err) {
    // log and continue
    console.error('Error deleting page assets:', err.message);
  }

  const comicId = chapter.comicId;
  await Chapter.deleteOne({ _id: chapterId });

  await updateChapterNavigation(comicId);
  const comic = await Comic.findById(comicId);
  if (comic) {
    await comic.updateChapterCount();
    await Comic.findByIdAndUpdate(comicId, { lastChapterUpdate: new Date() });
  }

  res.status(200).json({ success: true, statusCode: 200, message: 'Chapter deleted successfully' });
});
