const User = require('../models/user');
const Payment = require('../models/Payment');
const Comic = require('../models/Comic');
const Chapter = require('../models/Chapter');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middlewares/errorHandler');
const { successResponse } = require('../utils/responseHelper');

exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  successResponse(res, 200, 'Profile retrieved successfully', { user });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { displayName, bio } = req.body;

  const updateData = {};
  if (displayName) updateData.displayName = displayName;
  if (bio !== undefined) updateData.bio = bio;

  if (req.file) {
    updateData.avatar = req.file.path || req.file.url;
  }

  const user = await User.findByIdAndUpdate(req.user._id, updateData, {
    new: true,
    runValidators: true
  }).select('-password');

  successResponse(res, 200, 'Profile updated successfully', { user });
});

exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Please provide current and new password', 400));
  }

  const user = await User.findById(req.user._id).select('+password');
  const isPasswordValid = await user.comparePassword(currentPassword);

  if (!isPasswordValid) {
    return next(new AppError('Current password is incorrect', 401));
  }

  user.password = newPassword;
  await user.save();

  successResponse(res, 200, 'Password changed successfully');
});

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

exports.rechargeMPoints = asyncHandler(async (req, res, next) => {
  const { amount, paymentMethod, transactionId } = req.body;

  if (!amount || amount <= 0) {
    return next(new AppError('So tien khong hop le', 400));
  }

  if (!transactionId || transactionId.trim() === '') {
    return next(new AppError('Ma giao dich khong duoc de trong', 400));
  }

  const existing = await Payment.findOne({ transactionId: transactionId.trim() });
  if (existing) {
    return next(new AppError('Ma giao dich da duoc su dung', 400));
  }

  const payment = await Payment.create({
    userId: req.user._id,
    transactionId: transactionId.trim(),
    amount,
    paymentMethod: paymentMethod || 'bank_transfer',
    status: 'success'
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $inc: { mPoints: amount } },
    { new: true }
  ).select('-password');

  successResponse(res, 200, `Nap ${amount.toLocaleString('vi-VN')} M-Point thanh cong`, {
    payment,
    newBalance: user.mPoints
  });
});

exports.upgradeVIP = asyncHandler(async (req, res, next) => {
  const { duration, points } = req.body;

  if (!duration || !points) {
    return next(new AppError('Thieu thong tin goi VIP', 400));
  }

  const validPackages = {
    1: 10000,
    7: 50000,
    30: 150000,
    180: 700000,
    365: 1000000
  };

  if (validPackages[duration] !== points) {
    return next(new AppError('Goi VIP khong hop le', 400));
  }

  const user = await User.findById(req.user._id);

  if (user.mPoints < points) {
    return next(new AppError(`Khong du M-Point. Can ${points.toLocaleString('vi-VN')} M-Point`, 400));
  }

  user.mPoints -= points;

  let newExpireDate;
  if (user.isVIP && user.vipExpireDate && user.vipExpireDate > new Date()) {
    newExpireDate = new Date(user.vipExpireDate);
    newExpireDate.setDate(newExpireDate.getDate() + duration);
  } else {
    newExpireDate = new Date();
    newExpireDate.setDate(newExpireDate.getDate() + duration);
  }

  user.isVIP = true;
  user.vipExpireDate = newExpireDate;
  await user.save();

  successResponse(res, 200, `Nang cap VIP thanh cong! Co hieu luc den ${newExpireDate.toLocaleDateString('vi-VN')}`, {
    vipExpireDate: newExpireDate,
    mPointsSpent: points,
    mPointsRemaining: user.mPoints
  });
});

exports.getStats = asyncHandler(async (req, res) => {
  const [totalUsers, vipUsers, totalComics, viewStats] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({
      isVIP: true,
      vipExpireDate: { $gt: new Date() }
    }),
    Comic.countDocuments(),
    Comic.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$statistics.totalViews' }
        }
      }
    ])
  ]);

  successResponse(res, 200, 'Stats retrieved successfully', {
    totalComics,
    totalUsers,
    vipUsers,
    totalViews: viewStats.length > 0 ? viewStats[0].totalViews : 0
  });
});

exports.getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const search = req.query.search || '';
  const role = req.query.role;

  const query = {};

  if (search) {
    query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { displayName: { $regex: search, $options: 'i' } }
    ];
  }

  if (role === 'admin') {
    query.role = 'admin';
  } else if (role === 'vip') {
    query.isVIP = true;
    query.vipExpireDate = { $gt: new Date() };
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query)
  ]);

  successResponse(res, 200, 'Users retrieved successfully', {
    users,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total,
      limit
    }
  });
});

exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.userId)
    .select('-password')
    .populate('library.bookmarks.comicId', 'title slug')
    .populate('library.history.comicId', 'title slug');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  successResponse(res, 200, 'User retrieved successfully', { user });
});

exports.updateUserByAdmin = asyncHandler(async (req, res, next) => {
  const { username, email, displayName, role, isVIP, vipExpireDate, mPoints } = req.body;

  const updateData = {};

  if (username) updateData.username = username;
  if (email) updateData.email = email;
  if (displayName) updateData.displayName = displayName;
  if (role) updateData.role = role;
  if (mPoints !== undefined) updateData.mPoints = mPoints;

  if (isVIP !== undefined) {
    updateData.isVIP = isVIP;

    if (isVIP && vipExpireDate) {
      updateData.vipExpireDate = new Date(vipExpireDate);
    } else if (!isVIP) {
      updateData.vipExpireDate = null;
    }
  } else if (vipExpireDate) {
    updateData.vipExpireDate = new Date(vipExpireDate);
    updateData.isVIP = true;
  }

  const user = await User.findByIdAndUpdate(req.params.userId, updateData, {
    new: true,
    runValidators: true
  }).select('-password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  successResponse(res, 200, 'User updated successfully', { user });
});

exports.changeUserPasswordByAdmin = asyncHandler(async (req, res, next) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return next(new AppError('Password must be at least 6 characters', 400));
  }

  const user = await User.findById(req.params.userId);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  user.password = newPassword;
  await user.save();

  successResponse(res, 200, 'Password changed successfully');
});

exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user._id.toString() === req.user._id.toString()) {
    return next(new AppError('You cannot delete your own account', 400));
  }

  await user.deleteOne();

  successResponse(res, 200, 'User deleted successfully');
});

exports.getAdminPayments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const status = req.query.status;
  const search = req.query.search;

  const query = {};
  if (status) query.status = status;
  if (search) {
    query.$or = [{ transactionId: { $regex: search, $options: 'i' } }];
  }

  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Payment.countDocuments(query)
  ]);

  successResponse(res, 200, 'Payments retrieved', {
    payments,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPayments: total,
      limit
    }
  });
});

exports.updateAdminPayment = asyncHandler(async (req, res, next) => {
  const { paymentId } = req.params;
  const { status } = req.body;

  const allowed = ['pending', 'success', 'failed', 'refunded'];
  if (!allowed.includes(status)) {
    return next(new AppError('Trang thai khong hop le', 400));
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    return next(new AppError('Khong tim thay giao dich', 404));
  }

  payment.status = status;
  if (status === 'success' && !payment.processedAt) payment.processedAt = new Date();
  await payment.save();

  successResponse(res, 200, 'Cap nhat trang thai thanh cong', { payment });
});

exports.deleteAdminPayment = asyncHandler(async (req, res, next) => {
  const { paymentId } = req.params;

  const payment = await Payment.findByIdAndDelete(paymentId);
  if (!payment) {
    return next(new AppError('Khong tim thay giao dich', 404));
  }

  successResponse(res, 200, 'Da xoa giao dich thanh cong');
});

module.exports = exports;
