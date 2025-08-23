const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const emailService = require('./emailService');
const smsService = require('./smsService');

class AuthService {
  // Generate JWT tokens
  generateTokens(userId) {
    const accessToken = jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );
    
    const refreshToken = jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
    
    return { accessToken, refreshToken };
  }
  
  // Generate 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  // Register new user
  async register(userData) {
    const { 
      fullName, 
      parentName, 
      communityName, 
      phoneNumber, 
      email, 
      password, 
      persona 
    } = userData;
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phoneNumber }]
    });
    
    if (existingUser) {
      throw new Error('User with this email or phone number already exists');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = new User({
      fullName,
      parentName,
      communityName,
      phoneNumber,
      email,
      password: hashedPassword,
      persona: Array.isArray(persona) ? persona : [persona]
    });
    
    await user.save();
    
    // Generate and send OTP
    await this.sendVerificationOTP(user._id);
    
    return {
      userId: user._id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      message: 'Registration successful. Please verify your email and phone number.'
    };
  }
  
  // Send verification OTP
  async sendVerificationOTP(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Remove any existing OTP for this user
    await OTP.deleteMany({ userId });
    
    // Generate new OTPs
    const emailOtp = this.generateOTP();
    const phoneOtp = this.generateOTP();
    
    // Set expiration (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    // Save OTP to database
    const otpRecord = new OTP({
      userId,
      email: user.email,
      phoneNumber: user.phoneNumber,
      emailOtp,
      phoneOtp,
      emailOtpExpires: expiresAt,
      phoneOtpExpires: expiresAt
    });
    
    await otpRecord.save();
    
    // Send OTP via email and SMS
    await Promise.all([
      emailService.sendOTP(user.email, user.fullName, emailOtp),
      smsService.sendOTP(user.phoneNumber, phoneOtp)
    ]);
    
    return {
      message: 'OTP sent to email and phone number',
      email: user.email,
      phoneNumber: user.phoneNumber
    };
  }
  
  // Verify OTP
  async verifyOTP(userId, emailOtp, phoneOtp) {
    const otpRecord = await OTP.findOne({ userId, isUsed: false });
    
    if (!otpRecord) {
      throw new Error('OTP not found or already used');
    }
    
    // Check if OTP is expired
    const now = new Date();
    if (otpRecord.emailOtpExpires < now || otpRecord.phoneOtpExpires < now) {
      throw new Error('OTP has expired');
    }
    
    // Check attempts
    if (otpRecord.attempts >= 3) {
      throw new Error('Maximum OTP attempts exceeded');
    }
    
    // Verify OTPs
    const emailValid = otpRecord.emailOtp === emailOtp;
    const phoneValid = otpRecord.phoneOtp === phoneOtp;
    
    if (!emailValid || !phoneValid) {
      // Increment attempts
      otpRecord.attempts += 1;
      await otpRecord.save();
      
      throw new Error('Invalid OTP');
    }
    
    // Mark OTPs as verified and used
    otpRecord.emailVerified = true;
    otpRecord.phoneVerified = true;
    otpRecord.isUsed = true;
    await otpRecord.save();
    
    // Update user verification status
    await User.findByIdAndUpdate(userId, {
      isEmailVerified: true,
      isPhoneVerified: true
    });
    
    return {
      message: 'Verification successful. Your account is pending admin approval.',
      verified: true
    };
  }
  
  // Login user
  async login(email, password) {
    const user = await User.findOne({ email });
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Check if account is locked
    if (user.isLocked) {
      throw new Error('Account is temporarily locked due to too many failed attempts');
    }
    
    // Check if account is blocked
    if (user.isBlocked) {
      throw new Error('Account is blocked. Please contact administrator.');
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      await user.incrementLoginAttempts();
      throw new Error('Invalid credentials');
    }
    
    // Check verification status
    if (!user.isEmailVerified || !user.isPhoneVerified) {
      throw new Error('Please verify your email and phone number before logging in');
    }
    
    // Check approval status
    if (user.approvalStatus === 'pending') {
      throw new Error('Your account is pending admin approval');
    }
    
    if (user.approvalStatus === 'rejected') {
      throw new Error('Your account has been rejected. Reason: ' + (user.rejectionReason || 'Not specified'));
    }
    
    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }
    
    // Update last login
    user.lastLogin = new Date();
    
    // Generate tokens
    const tokens = this.generateTokens(user._id);
    
    // Save refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();
    
    return {
      user: user.toJSON(),
      tokens,
      message: 'Login successful'
    };
  }
  
  // Refresh token
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user || user.refreshToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }
      
      // Generate new tokens
      const tokens = this.generateTokens(user._id);
      
      // Update refresh token
      user.refreshToken = tokens.refreshToken;
      await user.save();
      
      return {
        tokens,
        user: user.toJSON()
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
  
  // Logout
  async logout(userId) {
    await User.findByIdAndUpdate(userId, {
      $unset: { refreshToken: 1 }
    });
    
    return { message: 'Logout successful' };
  }
  
  // Resend OTP
  async resendOTP(userId) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.isEmailVerified && user.isPhoneVerified) {
      throw new Error('User is already verified');
    }
    
    return await this.sendVerificationOTP(userId);
  }
}

module.exports = new AuthService();
