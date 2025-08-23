const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password -refreshToken');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Token is not valid.'
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        error: 'Account is blocked.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account is not active.'
      });
    }

    req.user = { userId: user._id, ...user.toObject() };
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Token is not valid.'
    });
  }
};

// Admin authorization middleware
const adminAuth = async (req, res, next) => {
  try {
    // First check if user is authenticated
    await auth(req, res, () => {});
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    // Check if user has admin role
    if (!req.user.persona.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required.'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Authorization error.'
    });
  }
};

// Publisher authorization middleware
const publisherAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {});
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    if (!req.user.persona.includes('publisher') && !req.user.persona.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: 'Publisher access required.'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Authorization error.'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password -refreshToken');
      
      if (user && !user.isBlocked && user.isActive) {
        req.user = { userId: user._id, ...user.toObject() };
      }
    }
    
    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

module.exports = {
  auth,
  adminAuth,
  publisherAuth,
  optionalAuth
};
