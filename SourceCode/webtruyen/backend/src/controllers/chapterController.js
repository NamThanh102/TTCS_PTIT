const Chapter = require('../models/Chapter');
const Comic = require('../models/Comic');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middlewares/errorHandler');
const { successResponse } = require('../utils/responseHelper');
const { uploadToCloudinary } = require('../config/cloudinary');
const archiver = require('archiver');
const axios = require('axios');

exports.getChapterById = asyncHandler(async (req, res, next) => {
  const chapter = await Chapter.findById(req.params.id)
    .populate('comicId', 'title slug author')
    .populate('previousChapter', 'chapterNumber title slug')
    .populate('nextChapter', 'chapterNumber title slug');

  if (!chapter) {
    return next(new AppError('Chapter not found', 404));
  }

  chapter.views += 1;
  await chapter.save({ validateBeforeSave: false });

  successResponse(res, 200, 'Chapter retrieved successfully', { chapter });
});

exports.createChapter = asyncHandler(async (req, res, next) => {
  const comicId = req.params.comicId || req.body.comicId;
  const { chapterNumber, title, isPublished } = req.body;

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
    isPublished: isPublished !== undefined ? isPublished : true,
    publishDate: isPublished !== false ? Date.now() : null,
    uploadedBy: req.user._id
  });

  await updateChapterNavigation(comicId);
  await comic.updateChapterCount();

  successResponse(res, 201, 'Chapter created successfully', { chapter });
});

async function updateChapterNavigation(comicId) {
  const chapters = await Chapter.find({ comicId }).sort({ chapterNumber: 1 });

  for (let i = 0; i < chapters.length; i += 1) {
    await Chapter.findByIdAndUpdate(chapters[i]._id, {
      previousChapter: i > 0 ? chapters[i - 1]._id : null,
      nextChapter: i < chapters.length - 1 ? chapters[i + 1]._id : null
    });
  }
}

exports.downloadChapter = asyncHandler(async (req, res, next) => {
  const chapter = await Chapter.findById(req.params.id).populate('comicId', 'title');

  if (!chapter) {
    return next(new AppError('Chapter not found', 404));
  }

  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${chapter.comicId.title}-Chapter-${chapter.chapterNumber}.zip"`
  );

  archive.pipe(res);

  for (const [index, page] of chapter.pages.entries()) {
    try {
      const response = await axios.get(page.url, { responseType: 'arraybuffer' });
      const extension = page.url.split('.').pop().split('?')[0];
      archive.append(response.data, {
        name: `page-${String(index + 1).padStart(3, '0')}.${extension}`
      });
    } catch (error) {
      console.error(`Error downloading page ${index + 1}:`, error.message);
    }
  }

  await archive.finalize();
});

module.exports = exports;
