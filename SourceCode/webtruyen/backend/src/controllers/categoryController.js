const Category = require('../models/Category');
const Comic = require('../models/Comic');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middlewares/errorHandler');


exports.getAllCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find()
    .select('name slug description icon order comicCount')
    .sort({ order: 1, name: 1 })
    .lean();

  res.status(200).json({ success: true, statusCode: 200, message: 'Categories retrieved successfully', data: { categories } });
});

exports.createCategory = asyncHandler(async (req, res, next) => {
  const { name, description, icon, order } = req.body;

  if (!name) {
    return next(new AppError('Category name is required', 400));
  }

  const category = await Category.create({
    name,
    description,
    icon,
    order: order || 0
  });

  res.status(201).json({ success: true, statusCode: 201, message: 'Category created successfully', data: { category } });
});

exports.updateCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: 'after',
    runValidators: true
  });

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  res.status(200).json({ success: true, statusCode: 200, message: 'Category updated successfully', data: { category } });
});

exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  await Comic.updateMany(
    { categories: category._id },
    { $pull: { categories: category._id } }
  );

  await Category.deleteOne({ _id: category._id });

  res.status(200).json({ success: true, statusCode: 200, message: 'Category deleted successfully' });
});

module.exports = exports;
