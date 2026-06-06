const User = require('../models/user');
const { generateToken } = require('../utils/jwt');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middlewares/errorHandler');
const { successResponse } = require('../utils/responseHelper');

exports.register = asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });
  if (existingUser) {
    return next(new AppError('Email hoặc username đã được sử dụng', 400));
  }

  const user = await User.create({ username, email, password });
  const token = generateToken(user._id);

  successResponse(res, 201, 'Đăng ký thành công', {
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    token
  });
});

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new AppError('Email hoặc mật khẩu không đúng', 401));
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return next(new AppError('Email hoặc mật khẩu không đúng', 401));
  }

  const token = generateToken(user._id);
  successResponse(res, 200, 'Đăng nhập thành công', {
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isVIP: user.isVIP,
      vipExpireDate: user.vipExpireDate,
      mPoints: user.mPoints,
      avatar: user.avatar,
      displayName: user.displayName
    },
    token
  });
});

exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  successResponse(res, 200, null, {
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isVIP: user.isVIP,
      vipExpireDate: user.vipExpireDate,
      mPoints: user.mPoints,
      avatar: user.avatar,
      displayName: user.displayName
    }
  });
});