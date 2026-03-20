const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middlewares/errorHandler');
const { successResponse } = require('../utils/responseHelper');

exports.getAllCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find({ isActive: true })
    .select('name slug description icon color order comicCount')
    .sort({ order: 1, name: 1 })
    .lean();

  successResponse(res, 200, 'Categories retrieved successfully', { categories });
});

exports.getCategoryBySlug = asyncHandler(async (req, res, next) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true });

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  successResponse(res, 200, 'Category retrieved successfully', { category });
});

exports.createCategory = asyncHandler(async (req, res, next) => {
  const { name, description, icon, color, order } = req.body;

  if (!name) {
    return next(new AppError('Category name is required', 400));
  }

  const category = await Category.create({
    name,
    description,
    icon,
    color: color || '#3B82F6',
    order: order || 0
  });

  successResponse(res, 201, 'Category created successfully', { category });
});

exports.updateCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  successResponse(res, 200, 'Category updated successfully', { category });
});

exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  category.isActive = false;
  await category.save();

  successResponse(res, 200, 'Category deleted successfully');
});

module.exports = exports;
