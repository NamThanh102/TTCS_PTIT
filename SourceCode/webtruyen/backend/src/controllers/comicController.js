const Comic = require('../models/Comic');
const Chapter = require('../models/Chapter');
const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middlewares/errorHandler');

const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const mongoose = require('mongoose');

exports.getAllComics = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    search,
    category,
    status,
    sort = '-lastChapterUpdate',
    all
  } = req.query;

  const query = {};

  if (!all) {
    query.isPublished = true;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } }
    ];
  }

  if (category) {
    // Accept both category ObjectId and category slug to avoid CastError on query.
    if (mongoose.Types.ObjectId.isValid(category)) {
      query.categories = category;
    } else {
      const categoryDoc = await Category.findOne({ slug: category }).select('_id').lean();
      if (categoryDoc?._id) {
        query.categories = categoryDoc._id;
      } else {
        query.categories = null;
      }
    }
  }

  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const comics = await Comic.find(query)
    .select('title slug coverImage author categories status statistics lastChapterUpdate')
    .populate('categories', 'name slug icon')
    .sort(sort)
    .limit(parseInt(limit, 10))
    .skip(skip)
    .lean();

  const totalComics = await Comic.countDocuments(query);

  res.status(200).json({ success: true, statusCode: 200, message: 'Comics retrieved successfully', data: comics, pagination: {
    currentPage: parseInt(page, 10),
    totalPages: Math.ceil(totalComics / limit),
    totalItems: totalComics,
    itemsPerPage: parseInt(limit, 10)
  } });
});

exports.getComicBySlug = asyncHandler(async (req, res, next) => {
  const comic = await Comic.findOne({ slug: req.params.slug, isPublished: true })
    .populate('categories', 'name slug icon')
    .populate('createdBy', 'username displayName');

  if (!comic) {
    return next(new AppError('Comic not found', 404));
  }

  res.status(200).json({ success: true, statusCode: 200, message: 'Comic retrieved successfully', data: comic });
});

exports.getChaptersBySlug = asyncHandler(async (req, res, next) => {
  const comic = await Comic.findOne({ slug: req.params.slug });

  if (!comic) {
    return next(new AppError('Comic not found', 404));
  }

  const chapters = await Chapter.find({ comicId: comic._id })
    .select('chapterNumber title slug isVIPOnly createdAt')
    .sort({ chapterNumber: 1 })
    .lean();

  res.status(200).json({ success: true, statusCode: 200, message: 'Chapters retrieved successfully', data: chapters });
});

exports.getChaptersByComicId = asyncHandler(async (req, res, next) => {
  const comic = await Comic.findById(req.params.id);

  if (!comic) {
    return next(new AppError('Comic not found', 404));
  }

  const chapters = await Chapter.find({ comicId: comic._id })
    .select('chapterNumber title slug isVIPOnly createdAt')
    .sort({ chapterNumber: 1 })
    .lean();

  res.status(200).json({ success: true, statusCode: 200, message: 'Chapters retrieved successfully', data: chapters });
});

exports.getComicById = asyncHandler(async (req, res, next) => {
  const comic = await Comic.findById(req.params.id)
    .populate('categories', 'name slug icon')
    .populate('createdBy', 'username displayName');

  if (!comic) {
    return next(new AppError('Comic not found', 404));
  }

  const chapters = await Chapter.find({ comicId: comic._id, isPublished: true })
    .select('chapterNumber title slug totalPages views createdAt')
    .sort({ chapterNumber: 1 })
    .lean();

  res.status(200).json({ success: true, statusCode: 200, message: 'Comic retrieved successfully', data: {
    comic,
    chapters
  } });
});

exports.createComic = asyncHandler(async (req, res, next) => {
  const {
    title,
    description,
    author,
    artist,
    categories,
    tags,
    status,
    publicationYear
  } = req.body;

  if (!title || !description || !author) {
    return next(new AppError('Please provide title, description and author', 400));
  }

  if (!req.file) {
    return next(new AppError('Cover image is required', 400));
  }

  const coverImageResult = await uploadToCloudinary(
    req.file.buffer,
    'metruyen/covers'
  );

  const parsedCategories = categories ? JSON.parse(categories) : [];

  const comic = await Comic.create({
    title,
    description,
    author,
    artist: artist || author,
    coverImage: {
      url: coverImageResult.url,
      publicId: coverImageResult.publicId
    },
    categories: parsedCategories,
    tags: tags ? JSON.parse(tags) : [],
    status: status || 'ongoing',
    publicationYear,
    isPublished: true,
    createdBy: req.user._id
  });

  await Category.updateMany(
    { _id: { $in: parsedCategories } },
    { $inc: { comicCount: 1 } }
  );

  res.status(201).json({ success: true, statusCode: 201, message: 'Comic created successfully', data: { comic } });
});

exports.updateComic = asyncHandler(async (req, res, next) => {
  let comic = await Comic.findById(req.params.id);

  if (!comic) {
    return next(new AppError('Comic not found', 404));
  }

  const updateData = { ...req.body };

  if (updateData.categories && typeof updateData.categories === 'string') {
    updateData.categories = JSON.parse(updateData.categories);
  }

  if (updateData.tags && typeof updateData.tags === 'string') {
    updateData.tags = JSON.parse(updateData.tags);
  }

  if (req.file) {
    if (comic.coverImage && comic.coverImage.publicId) {
      await deleteFromCloudinary(comic.coverImage.publicId);
    }

    const coverImageResult = await uploadToCloudinary(
      req.file.buffer,
      'metruyen/covers'
    );

    updateData.coverImage = {
      url: coverImageResult.url,
      publicId: coverImageResult.publicId
    };
  }

  comic = await Comic.findByIdAndUpdate(req.params.id, updateData, {
    returnDocument: 'after',
    runValidators: true
  });

  res.status(200).json({ success: true, statusCode: 200, message: 'Comic updated successfully', data: { comic } });
});

exports.deleteComic = asyncHandler(async (req, res, next) => {
  const comic = await Comic.findById(req.params.id);

  if (!comic) {
    return next(new AppError('Comic not found', 404));
  }

  if (comic.coverImage && comic.coverImage.publicId) {
    await deleteFromCloudinary(comic.coverImage.publicId);
  }

  await Chapter.deleteMany({ comicId: comic._id });
  await comic.deleteOne();

  await Category.updateMany(
    { _id: { $in: comic.categories } },
    { $inc: { comicCount: -1 } }
  );

  res.status(200).json({ success: true, statusCode: 200, message: 'Comic deleted successfully' });
});

exports.increaseView = asyncHandler(async (req, res, next) => {
  const comic = await Comic.findByIdAndUpdate(
    req.params.id,
    { $inc: { 'statistics.totalViews': 1 } },
    { returnDocument: 'after' }
  );

  if (!comic) {
    return next(new AppError('Comic not found', 404));
  }

  res.status(200).json({ success: true, statusCode: 200, message: 'View count updated', data: {
    totalViews: comic.statistics.totalViews
  } });
});

module.exports = exports;
