const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const rentalService = require('../services/rentalService');

// Middleware to authenticate all rental routes
router.use(auth);

// Publisher/Admin: Checkout book (convert approved request to active rental)
router.post('/checkout/:requestId', roleAuth(['publisher', 'admin']), async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.userId;

    const rental = await rentalService.checkoutBook(requestId, userId);

    res.json({
      success: true,
      message: 'Book checked out successfully',
      data: rental
    });

  } catch (error) {
    console.error('Checkout error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Publisher/Admin/Borrower: Return book
router.post('/return/:requestId', authorize(['publisher', 'borrower', 'admin']), async (req, res) => {
  try {
    const { requestId } = req.params;
    const { returnDate } = req.body;
    const userId = req.user.userId;

    const result = await rentalService.returnBook(requestId, userId, returnDate);

    res.json({
      success: true,
      message: 'Book returned successfully',
      data: result
    });

  } catch (error) {
    console.error('Return error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Borrower: Get rental history with cost breakdown
router.get('/history', authorize(['borrower']), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const borrowerId = req.user.userId;

    const history = await rentalService.getBorrowerRentalHistory(borrowerId, page, limit);

    res.json({
      success: true,
      message: 'Rental history retrieved successfully',
      data: history
    });

  } catch (error) {
    console.error('Get rental history error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Borrower: Get rental summary statistics
router.get('/summary', authorize(['borrower']), async (req, res) => {
  try {
    const borrowerId = req.user.userId;

    const summary = await rentalService.getBorrowerRentalSummary(borrowerId);

    res.json({
      success: true,
      message: 'Rental summary retrieved successfully',
      data: summary
    });

  } catch (error) {
    console.error('Get rental summary error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Publisher: Get earned rental fees
router.get('/earnings', authorize(['publisher']), async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const publisherId = req.user.userId;

    const earnings = await rentalService.getPublisherEarnings(publisherId, page, limit, startDate, endDate);

    res.json({
      success: true,
      message: 'Publisher earnings retrieved successfully',
      data: earnings
    });

  } catch (error) {
    console.error('Get publisher earnings error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Publisher: Get earnings summary
router.get('/earnings/summary', authorize(['publisher']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const publisherId = req.user.userId;

    const summary = await rentalService.getPublisherEarningsSummary(publisherId, startDate, endDate);

    res.json({
      success: true,
      message: 'Publisher earnings summary retrieved successfully',
      data: summary
    });

  } catch (error) {
    console.error('Get publisher earnings summary error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Admin: Get all overdue rentals
router.get('/overdue', authorize(['admin']), async (req, res) => {
  try {
    const overdueRentals = await rentalService.getOverdueRentals();

    res.json({
      success: true,
      message: 'Overdue rentals retrieved successfully',
      data: overdueRentals
    });

  } catch (error) {
    console.error('Get overdue rentals error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Admin: Process late fees for overdue rentals
router.post('/process-late-fees', authorize(['admin']), async (req, res) => {
  try {
    const result = await rentalService.processLateFees();

    res.json({
      success: true,
      message: 'Late fees processed successfully',
      data: result
    });

  } catch (error) {
    console.error('Process late fees error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Publisher/Admin: Get rental analytics for a specific book
router.get('/analytics/book/:bookId', authorize(['publisher', 'admin']), async (req, res) => {
  try {
    const { bookId } = req.params;
    const { startDate, endDate } = req.query;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // For publishers, ensure they own the book
    if (userRole === 'publisher') {
      const Book = require('../models/Book');
      const book = await Book.findOne({ _id: bookId, publisher: userId });
      if (!book) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Book not found or not owned by user'
        });
      }
    }

    const BookRequest = require('../models/BookRequest');
    
    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter['rental.checkedOutDate'] = { $gte: new Date(startDate) };
    }
    if (endDate) {
      if (dateFilter['rental.checkedOutDate']) {
        dateFilter['rental.checkedOutDate'].$lte = new Date(endDate);
      } else {
        dateFilter['rental.checkedOutDate'] = { $lte: new Date(endDate) };
      }
    }

    const [
      totalRentals,
      totalRevenue,
      averageRentalDays,
      lateFeeStats
    ] = await Promise.all([
      BookRequest.countDocuments({
        book: bookId,
        status: { $in: ['approved', 'completed'] },
        'payment.status': 'completed',
        ...dateFilter
      }),
      BookRequest.aggregate([
        {
          $match: {
            book: bookId,
            'payment.status': 'completed',
            ...dateFilter
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$payment.amount' },
            totalLateFees: { $sum: '$rental.lateFees' }
          }
        }
      ]),
      BookRequest.aggregate([
        {
          $match: {
            book: bookId,
            'rental.actualStartDate': { $exists: true },
            'rental.actualEndDate': { $exists: true },
            ...dateFilter
          }
        },
        {
          $addFields: {
            rentalDays: {
              $divide: [
                { $subtract: ['$rental.actualEndDate', '$rental.actualStartDate'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            averageDays: { $avg: '$rentalDays' }
          }
        }
      ]),
      BookRequest.aggregate([
        {
          $match: {
            book: bookId,
            'rental.lateFees': { $gt: 0 },
            ...dateFilter
          }
        },
        {
          $group: {
            _id: null,
            lateReturns: { $sum: 1 },
            totalLateFees: { $sum: '$rental.lateFees' }
          }
        }
      ])
    ]);

    const revenue = totalRevenue[0] || { totalRevenue: 0, totalLateFees: 0 };
    const avgDays = averageRentalDays[0]?.averageDays || 0;
    const lateFees = lateFeeStats[0] || { lateReturns: 0, totalLateFees: 0 };

    const analytics = {
      totalRentals,
      totalRevenue: revenue.totalRevenue + revenue.totalLateFees,
      baseRevenue: revenue.totalRevenue,
      lateFeeRevenue: revenue.totalLateFees,
      averageRentalDays: Math.round(avgDays * 10) / 10,
      lateReturnCount: lateFees.lateReturns,
      lateReturnRate: totalRentals > 0 ? (lateFees.lateReturns / totalRentals * 100).toFixed(1) : 0,
      averageRentalValue: totalRentals > 0 ? ((revenue.totalRevenue + revenue.totalLateFees) / totalRentals).toFixed(2) : 0
    };

    res.json({
      success: true,
      message: 'Book rental analytics retrieved successfully',
      data: analytics
    });

  } catch (error) {
    console.error('Get book analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Calculate rental cost (utility endpoint)
router.post('/calculate-cost', async (req, res) => {
  try {
    const { pricePerDay, startDate, endDate } = req.body;

    if (!pricePerDay || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Price per day, start date, and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const cost = rentalService.calculateRentalCost(pricePerDay, days);

    res.json({
      success: true,
      message: 'Rental cost calculated successfully',
      data: {
        days,
        dailyRate: pricePerDay,
        totalCost: cost,
        formatted: rentalService.formatCurrency(cost)
      }
    });

  } catch (error) {
    console.error('Calculate cost error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get late fee rate (utility endpoint)
router.get('/late-fee-rate', async (req, res) => {
  try {
    const rate = rentalService.getLateFeeRate();

    res.json({
      success: true,
      message: 'Late fee rate retrieved successfully',
      data: {
        rate,
        formatted: rentalService.formatCurrency(rate),
        description: `$${rate} per day`
      }
    });

  } catch (error) {
    console.error('Get late fee rate error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
