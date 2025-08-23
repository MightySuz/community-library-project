const express = require('express');
const Joi = require('joi');
const adminService = require('../services/adminService');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Apply admin authentication to all routes
router.use(adminAuth);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin)
router.get('/dashboard', async (req, res) => {
  try {
    const stats = await adminService.getDashboardStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with filters
// @access  Private (Admin)
router.get('/users', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      approvalStatus,
      persona,
      isActive,
      search
    } = req.query;

    const filters = {};
    if (approvalStatus) filters.approvalStatus = approvalStatus;
    if (persona) filters.persona = persona;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;

    const result = await adminService.getAllUsers(
      filters,
      parseInt(page),
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/admin/users/pending
// @desc    Get pending users for approval
// @access  Private (Admin)
router.get('/users/pending', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const result = await adminService.getPendingUsers(
      parseInt(page),
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get user details
// @access  Private (Admin)
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await adminService.getUserDetails(id);
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id/approve
// @desc    Approve user registration
// @access  Private (Admin)
router.put('/users/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.userId;
    
    const result = await adminService.approveUser(id, adminId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id/reject
// @desc    Reject user registration
// @access  Private (Admin)
router.put('/users/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.userId;
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required'
      });
    }
    
    const result = await adminService.rejectUser(id, adminId, reason);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id/block
// @desc    Block user
// @access  Private (Admin)
router.put('/users/:id/block', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.userId;
    
    const result = await adminService.toggleUserBlock(id, adminId, true, reason);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id/unblock
// @desc    Unblock user
// @access  Private (Admin)
router.put('/users/:id/unblock', async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.userId;
    
    const result = await adminService.toggleUserBlock(id, adminId, false);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
