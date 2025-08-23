const express = require('express');
const router = express.Router();
const borrowerService = require('../services/borrowerService');
const auth = require('../middleware/auth');

// Simple validation mock (replace with express-validator when needed)
const body = (field) => ({ optional: () => ({}), isString: () => ({}), trim: () => ({}), notEmpty: () => ({}) });
const validationResult = (req) => ({ isEmpty: () => true, array: () => [] });
const query = (field) => ({ optional: () => ({}), isInt: () => ({}) });

// Get borrower dashboard statistics
router.get('/dashboard', auth, async (req, res) => {
  try {
    const stats = await borrowerService.getDashboardStats(req.user.id);
    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Search and filter books
router.get('/books/search', auth, [
  query('search').optional().trim(),
  query('genre').optional().trim(),
  query('author').optional().trim(),
  query('publisher').optional().trim(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('availability').optional().isIn(['available', 'rented', 'on-hold']),
  query('sortBy').optional().isIn(['title', 'author', 'genre', 'rental.pricePerDay', 'createdAt']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const searchResults = await borrowerService.searchBooks(req.user.id, req.query);
    res.json(searchResults);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get book details with availability
router.get('/books/:bookId', auth, async (req, res) => {
  try {
    const bookDetails = await borrowerService.getBookDetails(req.params.bookId, req.user.id);
    res.json(bookDetails);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Place hold on a book
router.post('/books/:bookId/hold', auth, [
  body('holdDays').optional().isInt({ min: 1, max: 3 }).withMessage('Hold duration must be 1-3 days')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { holdDays = 1 } = req.body;
    const hold = await borrowerService.placeHold(req.params.bookId, req.user.id, holdDays);
    res.status(201).json(hold);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Convert hold to rental request
router.post('/holds/:holdId/convert', auth, async (req, res) => {
  try {
    const request = await borrowerService.convertHoldToRequest(req.params.holdId, req.user.id);
    res.json(request);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cancel hold
router.delete('/holds/:holdId', auth, async (req, res) => {
  try {
    const cancelledHold = await borrowerService.cancelHold(req.params.holdId, req.user.id);
    res.json({ message: 'Hold cancelled successfully', hold: cancelledHold });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user's current rentals and holds
router.get('/rentals', auth, async (req, res) => {
  try {
    const rentals = await borrowerService.getUserRentals(req.user.id);
    res.json(rentals);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add funds to wallet
router.post('/wallet/add-funds', auth, [
  body('amount').isFloat({ min: 1, max: 1000 }).withMessage('Amount must be between $1 and $1000'),
  body('paymentMethod.type').isIn(['card', 'paypal', 'bank']).withMessage('Invalid payment method'),
  body('paymentMethod.cardNumber').optional().isLength({ min: 16, max: 19 }),
  body('paymentMethod.expiryMonth').optional().isInt({ min: 1, max: 12 }),
  body('paymentMethod.expiryYear').optional().isInt({ min: 2024 }),
  body('paymentMethod.cvv').optional().isLength({ min: 3, max: 4 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, paymentMethod } = req.body;
    const result = await borrowerService.addFundsToWallet(req.user.id, amount, paymentMethod);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get wallet balance and transaction history
router.get('/wallet', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id).select('wallet');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      balance: user.wallet.balance,
      transactions: user.wallet.transactions.sort((a, b) => new Date(b.date) - new Date(a.date))
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get available genres in user's community
router.get('/genres', auth, async (req, res) => {
  try {
    const genres = await borrowerService.getAvailableGenres(req.user.id);
    res.json(genres);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get available authors in user's community
router.get('/authors', auth, async (req, res) => {
  try {
    const authors = await borrowerService.getAvailableAuthors(req.user.id);
    res.json(authors);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Validate wallet balance for rental
router.post('/wallet/validate', auth, [
  body('rentalAmount').isFloat({ min: 0 }).withMessage('Invalid rental amount')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const User = require('../models/User');
    const user = await User.findById(req.user.id).select('wallet.balance');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validation = borrowerService.validateWalletBalance(
      user.wallet.balance,
      req.body.rentalAmount
    );

    res.json(validation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Calculate rental cost
router.post('/rental/calculate-cost', auth, [
  body('pricePerDay').isFloat({ min: 0 }).withMessage('Invalid price per day'),
  body('days').isInt({ min: 1 }).withMessage('Invalid number of days')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { pricePerDay, days } = req.body;
    const cost = borrowerService.calculateRentalCost(pricePerDay, days);
    
    res.json({
      totalCost: cost,
      pricePerDay,
      days,
      formattedCost: borrowerService.formatCurrency(cost)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get popular books in community
router.get('/books/popular', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const Book = require('../models/Book');
    const BookRequest = require('../models/BookRequest');
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get publishers in same community
    const publishersInCommunity = await User.find({
      communityName: user.communityName,
      role: 'publisher'
    }).select('_id');

    // Get popular books based on rental frequency
    const popularBooks = await BookRequest.aggregate([
      {
        $match: {
          status: { $in: ['approved', 'completed'] }
        }
      },
      {
        $group: {
          _id: '$book',
          rentalCount: { $sum: 1 }
        }
      },
      {
        $sort: { rentalCount: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'book'
        }
      },
      {
        $unwind: '$book'
      },
      {
        $match: {
          'book.publisher': { $in: publishersInCommunity.map(p => p._id) },
          'book.approvalStatus': 'approved',
          'book.rental.available': true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'book.publisher',
          foreignField: '_id',
          as: 'publisher'
        }
      },
      {
        $unwind: '$publisher'
      },
      {
        $project: {
          _id: '$book._id',
          title: '$book.title',
          author: '$book.author',
          genre: '$book.genre',
          rental: '$book.rental',
          availability: '$book.availability',
          publisher: {
            fullName: '$publisher.fullName',
            communityName: '$publisher.communityName'
          },
          rentalCount: 1
        }
      }
    ]);

    res.json(popularBooks);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get recently added books in community
router.get('/books/recent', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const Book = require('../models/Book');
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get publishers in same community
    const publishersInCommunity = await User.find({
      communityName: user.communityName,
      role: 'publisher'
    }).select('_id');

    const recentBooks = await Book.find({
      publisher: { $in: publishersInCommunity.map(p => p._id) },
      approvalStatus: 'approved',
      'rental.available': true
    })
      .populate('publisher', 'fullName communityName')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(recentBooks);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
