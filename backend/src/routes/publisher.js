const express = require('express');
const router = express.Router();
const publisherService = require('../services/publisherService');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// Simple validation mock (replace with express-validator when needed)
const body = (field) => ({
  optional: () => body(field),
  isString: () => body(field),
  trim: () => body(field),
  notEmpty: () => body(field),
  withMessage: () => (req, res, next) => next()
});
const param = (field) => ({
  isMongoId: () => param(field),
  isLength: () => param(field),
  withMessage: () => (req, res, next) => next()
});
const query = (field) => ({
  optional: () => query(field),
  isInt: () => query(field),
  withMessage: () => (req, res, next) => next()
});
const validationResult = (req) => ({ isEmpty: () => true, array: () => [] });

// Middleware to ensure user is a publisher
const publisherAuth = roleAuth(['publisher', 'admin']);

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Get publisher dashboard
router.get('/dashboard', auth, publisherAuth, async (req, res) => {
  try {
    const dashboard = await publisherService.getPublisherDashboard(req.user.userId);
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get book info from barcode
router.get('/barcode/:barcode', 
  auth, 
  publisherAuth,
  // param('barcode').isLength({ min: 10, max: 13 }).withMessage('Invalid barcode format'),
  // handleValidationErrors,
  async (req, res) => {
    try {
      const bookInfo = await publisherService.getBookInfoFromBarcode(req.params.barcode);
      res.json(bookInfo);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Add new book
router.post('/books', 
  auth, 
  publisherAuth,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('author').notEmpty().withMessage('Author is required'),
    body('isbn').optional().isISBN().withMessage('Invalid ISBN format'),
    body('barcode').optional().isLength({ min: 10, max: 13 }).withMessage('Invalid barcode format'),
    body('genre').notEmpty().withMessage('Genre is required'),
    body('condition').isIn(['new', 'like-new', 'good', 'fair', 'poor']).withMessage('Invalid condition'),
    body('rental.pricePerDay').isFloat({ min: 0 }).withMessage('Rental price must be a positive number'),
    body('purchasePrice').optional().isFloat({ min: 0 }).withMessage('Purchase price must be a positive number'),
    body('rental.maxRentalDays').isInt({ min: 1, max: 90 }).withMessage('Max rental days must be between 1 and 90')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const book = await publisherService.addBookFromBarcode(req.user.userId, req.body);
      res.status(201).json(book);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Get publisher's books
router.get('/books', 
  auth, 
  publisherAuth,
  [
    query('status').optional().isIn(['pending', 'approved', 'rejected']),
    query('availability').optional().isIn(['available', 'borrowed', 'reserved']),
    query('genre').optional().isString(),
    query('search').optional().isString()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const books = await publisherService.getPublisherBooks(req.user.userId, req.query);
      res.json(books);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Update book
router.put('/books/:bookId', 
  auth, 
  publisherAuth,
  [
    param('bookId').isMongoId().withMessage('Invalid book ID'),
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('author').optional().notEmpty().withMessage('Author cannot be empty'),
    body('genre').optional().notEmpty().withMessage('Genre cannot be empty'),
    body('rental.pricePerDay').optional().isFloat({ min: 0 }).withMessage('Rental price must be positive'),
    body('rental.maxRentalDays').optional().isInt({ min: 1, max: 90 }).withMessage('Max rental days must be between 1 and 90')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const book = await publisherService.updateBook(req.user.userId, req.params.bookId, req.body);
      res.json(book);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Delete book
router.delete('/books/:bookId', 
  auth, 
  publisherAuth,
  param('bookId').isMongoId().withMessage('Invalid book ID'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = await publisherService.deleteBook(req.user.userId, req.params.bookId);
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Get checkout requests
router.get('/requests', 
  auth, 
  publisherAuth,
  [
    query('status').optional().isIn(['pending', 'approved', 'rejected', 'cancelled']),
    query('bookId').optional().isMongoId().withMessage('Invalid book ID'),
    query('borrowerId').optional().isMongoId().withMessage('Invalid borrower ID')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const requests = await publisherService.getCheckoutRequests(req.user.userId, req.query);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Approve checkout request
router.post('/requests/:requestId/approve', 
  auth, 
  publisherAuth,
  [
    param('requestId').isMongoId().withMessage('Invalid request ID'),
    body('message').optional().isString(),
    body('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    body('endDate').optional().isISO8601().withMessage('Invalid end date format')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const request = await publisherService.approveCheckoutRequest(
        req.user.userId, 
        req.params.requestId, 
        req.body
      );
      res.json(request);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Reject checkout request
router.post('/requests/:requestId/reject', 
  auth, 
  publisherAuth,
  [
    param('requestId').isMongoId().withMessage('Invalid request ID'),
    body('reason').notEmpty().withMessage('Rejection reason is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const request = await publisherService.rejectCheckoutRequest(
        req.user.userId, 
        req.params.requestId, 
        req.body
      );
      res.json(request);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Get currently borrowed books
router.get('/borrowed', auth, publisherAuth, async (req, res) => {
  try {
    const borrowedBooks = await publisherService.getCurrentlyBorrowedBooks(req.user.userId);
    res.json(borrowedBooks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get overdue books
router.get('/overdue', auth, publisherAuth, async (req, res) => {
  try {
    const overdueBooks = await publisherService.getOverdueBooks(req.user.userId);
    res.json(overdueBooks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark book as returned
router.post('/returns/:requestId', 
  auth, 
  publisherAuth,
  [
    param('requestId').isMongoId().withMessage('Invalid request ID'),
    body('damage').optional().isBoolean(),
    body('damageAmount').optional().isFloat({ min: 0 }).withMessage('Damage amount must be positive'),
    body('damageDescription').optional().isString()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const request = await publisherService.markBookReturned(
        req.user.userId, 
        req.params.requestId, 
        req.body
      );
      res.json(request);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Get earnings
router.get('/earnings', 
  auth, 
  publisherAuth,
  query('period').optional().isIn(['week', 'month', 'year']),
  handleValidationErrors,
  async (req, res) => {
    try {
      const earnings = await publisherService.calculateEarnings(
        req.user.userId, 
        req.query.period || 'month'
      );
      res.json({ earnings, period: req.query.period || 'month' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get rental history
router.get('/history', 
  auth, 
  publisherAuth,
  [
    query('bookId').optional().isMongoId().withMessage('Invalid book ID'),
    query('status').optional().isIn(['active', 'returned', 'overdue', 'extended']),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const history = await publisherService.getRentalHistory(req.user.userId, req.query);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
