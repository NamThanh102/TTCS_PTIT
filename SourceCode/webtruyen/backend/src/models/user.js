const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username là bắt buộc'],
    unique: true,
    trim: true,
    minlength: [3, 'Username tối thiểu 3 ký tự'],
    maxlength: [30, 'Username tối đa 30 ký tự']
  },
  email: {
    type: String,
    required: [true, 'Email là bắt buộc'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
  },
  password: {
    type: String,
    required: [true, 'Password là bắt buộc'],
    minlength: [6, 'Password tối thiểu 6 ký tự'],
    select: false
  },
  displayName: {
    type: String,
    default: function() { return this.username; },
    maxlength: 50
  },
  role: {
    type: String,
    enum: ['guest', 'member', 'admin'],
    default: 'member'
  },
  avatar: {
    type: String,
    default: 'https://via.placeholder.com/150'
  },
  bio: {
    type: String,
    maxlength: 200,
    default: ''
  },
  isVIP: {
    type: Boolean,
    default: false
  },
  vipExpireDate: {
    type: Date,
    default: null
  },
  mPoints: {
    type: Number,
    default: 0
  },
  library: {
    bookmarks: [{
      comicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comic'
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }],
    history: [{
      comicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comic'
      },
      chapterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chapter'
      },
      lastReadPage: {
        type: Number,
        default: 0
      },
      lastReadAt: {
        type: Date,
        default: Date.now
      }
    }]
  }
}, { 
  timestamps: true 
});

// Middleware: Hash password trước khi save
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Method: So sánh password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.virtual('mPoint')
  .get(function() { return this.mPoints; })
  .set(function(value) { this.mPoints = value; });

userSchema.virtual('vipExpiresAt')
  .get(function() { return this.vipExpireDate; })
  .set(function(value) { this.vipExpireDate = value; });

module.exports = mongoose.model('User', userSchema);