const express = require('express');
const router = express.Router();
const adminService = require('../services/adminService');
const adminConfigService = require('../services/adminConfigService');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Simple validation mock (replace with express-validator when needed)
const body = (field) => ({ optional: () => ({}), isString: () => ({}), trim: () => ({}), notEmpty: () => ({}) });
const param = (field) => ({ isMongoId: () => ({}) });
const query = (field) => ({ optional: () => ({}), isInt: () => ({}) });
const validationResult = (req) => ({ isEmpty: () => true, array: () => [] });

// Middleware to check for admin role
router.use(authenticateToken);
router.use(requireRole(['administrator']));

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Reporting Routes
router.get('/reports/transactions', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['pending', 'completed', 'failed', 'cancelled']),
  query('overdue').optional().isBoolean(),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('borrower').optional().isMongoId(),
  query('publisher').optional().isMongoId()
], handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filters = {
      status: req.query.status,
      overdue: req.query.overdue,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      borrower: req.query.borrower,
      publisher: req.query.publisher
    };
    
    const result = await adminConfigService.getRentalTransactions(filters, page, limit);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/reports/overdue', async (req, res) => {
  try {
    const overdueBooks = await adminConfigService.getOverdueBooks();
    
    res.json({
      success: true,
      data: { overdueBooks }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/reports/wallets', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('minBalance').optional().isFloat({ min: 0 }),
  query('maxBalance').optional().isFloat({ min: 0 }),
  query('status').optional().isIn(['active', 'frozen', 'suspended']),
  query('lowBalance').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filters = {
      minBalance: req.query.minBalance,
      maxBalance: req.query.maxBalance,
      status: req.query.status,
      lowBalance: req.query.lowBalance
    };
    
    const result = await adminConfigService.getWalletReport(filters, page, limit);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// System Configuration Routes
router.get('/config', [
  query('category').optional().isIn(['fines', 'rental', 'wallet', 'notifications', 'general'])
], handleValidationErrors, async (req, res) => {
  try {
    const configs = await adminConfigService.getSystemConfigurations(req.query.category);
    
    res.json({
      success: true,
      data: { configurations: configs }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.put('/config/:category/:key', [
  param('category').isIn(['fines', 'rental', 'wallet', 'notifications', 'general']),
  param('key').isString(),
  body('value').exists()
], handleValidationErrors, async (req, res) => {
  try {
    const config = await adminConfigService.updateSystemConfiguration(
      req.params.category,
      req.params.key,
      req.body.value,
      req.user.id
    );
    
    res.json({
      success: true,
      message: 'Configuration updated successfully',
      data: { configuration: config }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/config/fines', async (req, res) => {
  try {
    const fineConfigs = await adminConfigService.getFineConfiguration();
    
    res.json({
      success: true,
      data: { configurations: fineConfigs }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.put('/config/fines', [
  body('overdue_fine_per_day').optional().isFloat({ min: 0 }),
  body('damage_fine_percentage').optional().isFloat({ min: 0, max: 100 }),
  body('lost_book_multiplier').optional().isFloat({ min: 1 }),
  body('grace_period_days').optional().isInt({ min: 0 })
], handleValidationErrors, async (req, res) => {
  try {
    const updates = {};
    
    if (req.body.overdue_fine_per_day !== undefined) {
      updates.overdue_fine_per_day = req.body.overdue_fine_per_day;
    }
    if (req.body.damage_fine_percentage !== undefined) {
      updates.damage_fine_percentage = req.body.damage_fine_percentage;
    }
    if (req.body.lost_book_multiplier !== undefined) {
      updates.lost_book_multiplier = req.body.lost_book_multiplier;
    }
    if (req.body.grace_period_days !== undefined) {
      updates.grace_period_days = req.body.grace_period_days;
    }
    
    const results = await adminConfigService.updateFineConfiguration(updates, req.user.id);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    res.json({
      success: failed.length === 0,
      message: failed.length === 0 
        ? 'Fine configuration updated successfully'
        : `${successful.length} updated, ${failed.length} failed`,
      data: { results }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Activity Logs
router.get('/activity', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filters = {};
    
    const result = await adminConfigService.getActivityLogs(filters, page, limit);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
