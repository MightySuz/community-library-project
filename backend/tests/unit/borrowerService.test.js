const borrowerService = require('../../src/services/borrowerService');
const User = require('../../src/models/User');
const Book = require('../../src/models/Book');
const BookRequest = require('../../src/models/BookRequest');
const mongoose = require('mongoose');

// Mock external dependencies
jest.mock('../../src/models/User');
jest.mock('../../src/models/Book');
jest.mock('../../src/models/BookRequest');

describe('BorrowerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchBooks', () => {
    const mockUser = {
      _id: 'user123',
      communityName: 'Test Community'
    };

    const mockPublishers = [
      { _id: 'pub1' },
      { _id: 'pub2' }
    ];

    const mockBooks = [
      {
        _id: 'book1',
        title: 'Test Book 1',
        author: 'Author 1',
        genre: 'Fiction',
        rental: { pricePerDay: 2.50 },
        availability: { status: 'available' },
        publisher: { fullName: 'Publisher 1', communityName: 'Test Community' }
      },
      {
        _id: 'book2',
        title: 'Test Book 2',
        author: 'Author 2',
        genre: 'Non-Fiction',
        rental: { pricePerDay: 3.00 },
        availability: { status: 'available' },
        publisher: { fullName: 'Publisher 2', communityName: 'Test Community' }
      }
    ];

    beforeEach(() => {
      User.findById.mockResolvedValue(mockUser);
      User.find.mockResolvedValue(mockPublishers);
      Book.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockBooks)
            })
          })
        })
      });
      Book.countDocuments.mockResolvedValue(2);
    });

    test('should search books with basic parameters', async () => {
      const result = await borrowerService.searchBooks('user123', {
        search: 'Test',
        page: 1,
        limit: 10
      });

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(User.find).toHaveBeenCalledWith({
        communityName: 'Test Community',
        role: 'publisher'
      });
      expect(result.books).toEqual(mockBooks);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        pages: 1
      });
    });

    test('should handle search filters', async () => {
      await borrowerService.searchBooks('user123', {
        search: 'Fiction',
        genre: 'Fiction',
        author: 'Author 1',
        minPrice: 2,
        maxPrice: 5,
        availability: 'available'
      });

      expect(Book.find).toHaveBeenCalled();
      const findCall = Book.find.mock.calls[0][0];
      expect(findCall).toHaveProperty('approvalStatus', 'approved');
      expect(findCall).toHaveProperty('rental.available', true);
      expect(findCall['rental.pricePerDay']).toEqual({ $gte: 2, $lte: 5 });
    });

    test('should handle user not found', async () => {
      User.findById.mockResolvedValue(null);

      await expect(borrowerService.searchBooks('invalid-user')).rejects.toThrow('User not found');
    });

    test('should handle search error', async () => {
      User.findById.mockRejectedValue(new Error('Database error'));

      await expect(borrowerService.searchBooks('user123')).rejects.toThrow('Search failed: Database error');
    });
  });

  describe('getBookDetails', () => {
    const mockUser = { _id: 'user123', communityName: 'Test Community' };
    const mockBook = {
      _id: 'book123',
      title: 'Test Book',
      author: 'Test Author',
      publisher: { _id: 'pub123', communityName: 'Test Community' },
      availability: { status: 'available' },
      toObject: jest.fn().mockReturnValue({
        _id: 'book123',
        title: 'Test Book',
        author: 'Test Author',
        availability: { status: 'available' }
      })
    };

    beforeEach(() => {
      User.findById.mockResolvedValue(mockUser);
      Book.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockBook)
      });
      BookRequest.countDocuments
        .mockResolvedValueOnce(0) // currentHolds
        .mockResolvedValueOnce(0); // activeRentals
      BookRequest.findOne.mockResolvedValue(null); // userExistingRequest
    });

    test('should get book details successfully', async () => {
      const result = await borrowerService.getBookDetails('book123', 'user123');

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(Book.findById).toHaveBeenCalledWith('book123');
      expect(result).toHaveProperty('availability');
      expect(result.availability).toHaveProperty('canHold', true);
      expect(result.availability).toHaveProperty('canRent', true);
    });

    test('should handle user not found', async () => {
      User.findById.mockResolvedValue(null);

      await expect(borrowerService.getBookDetails('book123', 'invalid-user')).rejects.toThrow('User not found');
    });

    test('should handle book not found', async () => {
      Book.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await expect(borrowerService.getBookDetails('invalid-book', 'user123')).rejects.toThrow('Book not found');
    });

    test('should handle different community access', async () => {
      const mockBookDifferentCommunity = {
        ...mockBook,
        publisher: { _id: 'pub123', communityName: 'Different Community' }
      };
      Book.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockBookDifferentCommunity)
      });

      await expect(borrowerService.getBookDetails('book123', 'user123')).rejects.toThrow('Book not available in your community');
    });
  });

  describe('placeHold', () => {
    const mockUser = { _id: 'user123', communityName: 'Test Community', wallet: { balance: 50.00 } };
    const mockPublisher = { _id: 'pub123', communityName: 'Test Community' };
    const mockBook = {
      _id: 'book123',
      title: 'Test Book',
      publisher: mockPublisher,
      availability: { status: 'available' },
      rental: { pricePerDay: 2.50, maxRentalDays: 14 }
    };

    beforeEach(() => {
      User.findById.mockResolvedValue(mockUser);
      Book.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockBook)
      });
      BookRequest.findOne.mockResolvedValue(null); // No existing request
      BookRequest.prototype.save = jest.fn().mockResolvedValue({
        _id: 'request123',
        status: 'hold',
        populate: jest.fn().mockResolvedValue({
          _id: 'request123',
          status: 'hold',
          book: mockBook,
          borrower: mockUser,
          publisher: mockPublisher
        })
      });
      Book.findByIdAndUpdate.mockResolvedValue(mockBook);
    });

    test('should place hold successfully', async () => {
      const result = await borrowerService.placeHold('book123', 'user123', 1);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(Book.findById).toHaveBeenCalledWith('book123');
      expect(BookRequest.findOne).toHaveBeenCalled();
      expect(Book.findByIdAndUpdate).toHaveBeenCalledWith('book123', expect.objectContaining({
        'availability.status': 'on-hold',
        'availability.heldBy': 'user123'
      }));
    });

    test('should handle insufficient wallet balance', async () => {
      const poorUser = { ...mockUser, wallet: { balance: 1.00 } };
      User.findById.mockResolvedValue(poorUser);

      await expect(borrowerService.placeHold('book123', 'user123')).rejects.toThrow('Insufficient wallet balance');
    });

    test('should handle book not available', async () => {
      const unavailableBook = { ...mockBook, availability: { status: 'rented' } };
      Book.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(unavailableBook)
      });

      await expect(borrowerService.placeHold('book123', 'user123')).rejects.toThrow('Book is not available for hold');
    });

    test('should handle existing request', async () => {
      BookRequest.findOne.mockResolvedValue({ _id: 'existing-request' });

      await expect(borrowerService.placeHold('book123', 'user123')).rejects.toThrow('You already have an active request for this book');
    });
  });

  describe('addFundsToWallet', () => {
    const mockUser = {
      _id: 'user123',
      wallet: { balance: 25.00, transactions: [] }
    };

    beforeEach(() => {
      User.findById.mockResolvedValue(mockUser);
      User.findByIdAndUpdate.mockResolvedValue({
        ...mockUser,
        wallet: {
          balance: 75.00,
          transactions: [{
            type: 'deposit',
            amount: 50.00,
            description: 'Wallet top-up via card',
            transactionId: 'txn_test_123',
            status: 'completed',
            date: new Date()
          }]
        }
      });
      
      // Mock the processPayment method
      borrowerService.processPayment = jest.fn().mockResolvedValue({
        success: true,
        transactionId: 'txn_test_123',
        amount: 50.00,
        fee: 0
      });
    });

    test('should add funds successfully', async () => {
      const result = await borrowerService.addFundsToWallet('user123', 50.00, {
        type: 'card',
        cardNumber: '4242424242424242'
      });

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(borrowerService.processPayment).toHaveBeenCalledWith(50.00, {
        type: 'card',
        cardNumber: '4242424242424242'
      });
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user123', expect.objectContaining({
        $inc: { 'wallet.balance': 50.00 }
      }), { new: true });
      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(75.00);
    });

    test('should handle invalid amount', async () => {
      await expect(borrowerService.addFundsToWallet('user123', 0)).rejects.toThrow('Invalid amount');
      await expect(borrowerService.addFundsToWallet('user123', -10)).rejects.toThrow('Invalid amount');
    });

    test('should handle user not found', async () => {
      User.findById.mockResolvedValue(null);

      await expect(borrowerService.addFundsToWallet('invalid-user', 50.00)).rejects.toThrow('User not found');
    });

    test('should handle payment failure', async () => {
      borrowerService.processPayment = jest.fn().mockResolvedValue({
        success: false,
        error: 'Card declined'
      });

      await expect(borrowerService.addFundsToWallet('user123', 50.00, {
        type: 'card'
      })).rejects.toThrow('Payment failed: Card declined');
    });
  });

  describe('processPayment', () => {
    test('should process payment successfully with test card', async () => {
      const result = await borrowerService.processPayment(25.00, {
        type: 'card',
        cardNumber: '4242424242424242'
      });

      expect(result.success).toBe(true);
      expect(result.amount).toBe(25.00);
      expect(result.transactionId).toBeDefined();
      expect(result.fee).toBe(25.00 * 0.029); // 2.9% fee
    });

    test('should reject amount over limit', async () => {
      const result = await borrowerService.processPayment(1500.00, {
        type: 'card',
        cardNumber: '4242424242424242'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Amount exceeds daily limit');
    });

    test('should process other payment methods', async () => {
      const result = await borrowerService.processPayment(25.00, {
        type: 'paypal'
      });

      expect(result.success).toBe(true);
      expect(result.amount).toBe(25.00);
      expect(result.fee).toBe(0);
    });
  });

  describe('getUserRentals', () => {
    const mockRentals = [
      {
        _id: 'rental1',
        status: 'hold',
        holdExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        toObject: jest.fn().mockReturnValue({
          _id: 'rental1',
          status: 'hold',
          holdExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
        })
      },
      {
        _id: 'rental2',
        status: 'approved',
        rental: {
          status: 'active',
          actualEndDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day overdue
        },
        toObject: jest.fn().mockReturnValue({
          _id: 'rental2',
          status: 'approved',
          rental: {
            status: 'active',
            actualEndDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        })
      }
    ];

    beforeEach(() => {
      BookRequest.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockRentals)
          })
        })
      });
    });

    test('should get user rentals with overdue calculations', async () => {
      const result = await borrowerService.getUserRentals('user123');

      expect(BookRequest.find).toHaveBeenCalledWith({
        borrower: 'user123',
        status: { $in: ['hold', 'pending', 'approved'] },
        $or: [
          { holdExpiry: { $gt: expect.any(Date) } },
          { 'rental.status': { $in: ['active', 'overdue'] } }
        ]
      });

      expect(result).toHaveLength(2);
      expect(result[1]).toHaveProperty('daysOverdue', 1);
      expect(result[1]).toHaveProperty('lateFee', 0.50);
    });

    test('should handle service error', async () => {
      BookRequest.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockRejectedValue(new Error('Database error'))
          })
        })
      });

      await expect(borrowerService.getUserRentals('user123')).rejects.toThrow('Failed to get user rentals: Database error');
    });
  });

  describe('validateWalletBalance', () => {
    test('should validate sufficient balance', () => {
      const result = borrowerService.validateWalletBalance(50.00, 25.00);
      expect(result.valid).toBe(true);
    });

    test('should validate insufficient balance', () => {
      const result = borrowerService.validateWalletBalance(20.00, 25.00);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Insufficient funds');
      expect(result.shortfall).toBe(5.00);
    });
  });

  describe('calculateRentalCost', () => {
    test('should calculate rental cost correctly', () => {
      const result = borrowerService.calculateRentalCost(2.50, 7);
      expect(result).toBe(17.50);
    });

    test('should handle decimal precision', () => {
      const result = borrowerService.calculateRentalCost(2.99, 3);
      expect(result).toBe(8.97);
    });
  });

  describe('formatCurrency', () => {
    test('should format currency correctly', () => {
      const result = borrowerService.formatCurrency(25.99);
      expect(result).toBe('$25.99');
    });

    test('should handle whole numbers', () => {
      const result = borrowerService.formatCurrency(25);
      expect(result).toBe('$25.00');
    });
  });

  describe('getDashboardStats', () => {
    const mockUser = {
      _id: 'user123',
      communityName: 'Test Community',
      wallet: { balance: 50.00 },
      createdAt: new Date('2024-01-01')
    };

    beforeEach(() => {
      User.findById.mockResolvedValue(mockUser);
      BookRequest.countDocuments
        .mockResolvedValueOnce(2) // activeRentals
        .mockResolvedValueOnce(1) // holds
        .mockResolvedValueOnce(0); // overdueBooks
      BookRequest.aggregate.mockResolvedValue([{ total: 125.50 }]);
    });

    test('should get dashboard statistics', async () => {
      const result = await borrowerService.getDashboardStats('user123');

      expect(result).toEqual({
        activeRentals: 2,
        holds: 1,
        overdueBooks: 0,
        totalSpent: 125.50,
        walletBalance: 50.00,
        communityName: 'Test Community',
        memberSince: new Date('2024-01-01')
      });
    });

    test('should handle no spending history', async () => {
      BookRequest.aggregate.mockResolvedValue([]);

      const result = await borrowerService.getDashboardStats('user123');
      expect(result.totalSpent).toBe(0);
    });
  });
});
