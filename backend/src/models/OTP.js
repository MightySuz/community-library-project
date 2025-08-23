const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  emailOtp: {
    type: String,
    required: true
  },
  phoneOtp: {
    type: String,
    required: true
  },
  emailOtpExpires: {
    type: Date,
    required: true
  },
  phoneOtpExpires: {
    type: Date,
    required: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0
  },
  isUsed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for cleanup of expired OTPs
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 }); // 1 hour
otpSchema.index({ userId: 1 });

module.exports = mongoose.model('OTP', otpSchema);
