const rentalService = require('../../src/services/rentalService');
const mongoose = require('mongoose');
const User = require('../../src/models/User');
const Book = require('../../src/models/Book');
const BookRequest = require('../../src/models/BookRequest');

describe('RentalService', () => {
  let publisherId, borrowerId, bookId, requestId;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/community-library-test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up before each test
    await User.deleteMany({});
    await Book.deleteMany({});
    await BookRequest.deleteMany({});

    // Create test data
    const publisher = await User.create({
      fullName: 'Test Publisher',
      email: 'publisher@test.com',
      phoneNumber: '+1234567890',
      role: 'publisher',
      isApproved: true,
      isVerified: true,
      wallet: {
        balance: 0,
        transactions: []
      }
    });
    publisherId = publisher._id;

    const borrower = await User.create({
      fullName: 'Test Borrower',
      email: 'borrower@test.com',
      phoneNumber: '+1234567891',
      role: 'borrower',
      isApproved: true,
      isVerified: true,
      wallet: {
        balance: 100.00,
        transactions: []
      }
    });
    borrowerId = borrower._id;

    const book = await Book.create({
      title: 'Test Book',
      author: 'Test Author',
      isbn: '1234567890',
      genre: 'Fiction',
      publisher: publisherId,
      condition: 'good',
      availability: {
        status: 'available'
      },
      rental: {
        available: true,
        pricePerDay: 2.00,
        maxRentalDays: 14
      }
    });
    bookId = book._id;

    const request = await BookRequest.create({
      book: bookId,
      borrower: borrowerId,
      publisher: publisherId,
      requestedStartDate: new Date(),
      requestedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'approved',
      rental: {
        status: 'pending'
      },
      payment: {
        status: 'pending'
      }
    });
    requestId = request._id;
  });

  describe('calculateRentalCost', () => {
    it('should calculate cost correctly', () => {
      const cost = rentalService.calculateRentalCost(2.50, 7);
      expect(cost).toBe(17.5);
    });

    it('should handle decimal precision', () => {
      const cost = rentalService.calculateRentalCost(1.99, 3);
      expect(cost).toBe(5.97);
    });
  });

  describe('calculateLateFees', () => {
    it('should return 0 for on-time return', () => {
      const dueDate = new Date();
      const returnDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      const lateFees = rentalService.calculateLateFees(dueDate, returnDate);
      expect(lateFees).toBe(0);
    });

    it('should calculate late fees correctly', () => {
      const dueDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const returnDate = new Date(); // Today
      const lateFees = rentalService.calculateLateFees(dueDate, returnDate);
      expect(lateFees).toBe(1.0); // 2 days * $0.50 per day
    });

    it('should use default late fee rate', () => {
      const originalRate = process.env.LATE_FEE_PER_DAY;
      delete process.env.LATE_FEE_PER_DAY;

      const dueDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      const lateFees = rentalService.calculateLateFees(dueDate);
      expect(lateFees).toBe(0.5); // Default $0.50 per day

      if (originalRate) {
        process.env.LATE_FEE_PER_DAY = originalRate;
      }
    });
  });

  describe('checkoutBook', () => {
    it('should successfully checkout a book', async () => {
      const result = await rentalService.checkoutBook(requestId, publisherId);

      expect(result.rental.status).toBe('active');
      expect(result.payment.status).toBe('completed');

      // Check borrower wallet was debited
      const borrower = await User.findById(borrowerId);
      expect(borrower.wallet.balance).toBe(86.0); // 100 - 14 (7 days * $2.00)

      // Check publisher wallet was credited
      const publisher = await User.findById(publisherId);
      expect(publisher.wallet.balance).toBe(12.6); // 90% of 14
    });

    it('should fail with insufficient balance', async () => {
      // Set borrower balance to insufficient amount
      await User.findByIdAndUpdate(borrowerId, {
        'wallet.balance': 5.0
      });

      await expect(
        rentalService.checkoutBook(requestId, publisherId)
      ).rejects.toThrow('Borrower has insufficient wallet balance');
    });

    it('should fail with invalid request', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      
      await expect(
        rentalService.checkoutBook(invalidId, publisherId)
      ).rejects.toThrow('Request not found or not approved');
    });
  });

  describe('returnBook', () => {
    beforeEach(async () => {
      // Checkout the book first
      await rentalService.checkoutBook(requestId, publisherId);
    });

    it('should successfully return book on time', async () => {
      const result = await rentalService.returnBook(requestId, borrowerId);

      expect(result.request.rental.status).toBe('completed');
      expect(result.lateFees).toBe(0);
      expect(result.daysLate).toBe(0);

      // Check book availability is updated
      const book = await Book.findById(bookId);
      expect(book.availability.status).toBe('available');
    });

    it('should calculate late fees for overdue return', async () => {
      // Set due date to yesterday
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await BookRequest.findByIdAndUpdate(requestId, {
        'rental.actualEndDate': yesterday
      });

      const result = await rentalService.returnBook(requestId, borrowerId);

      expect(result.lateFees).toBeGreaterThan(0);
      expect(result.daysLate).toBeGreaterThan(0);

      // Check late fees were debited from borrower
      const borrower = await User.findById(borrowerId);
      expect(borrower.wallet.balance).toBeLessThan(86.0);
    });

    it('should fail with insufficient balance for late fees', async () => {
      // Set due date to 10 days ago and borrower balance to 0
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      await BookRequest.findByIdAndUpdate(requestId, {
        'rental.actualEndDate': tenDaysAgo
      });
      await User.findByIdAndUpdate(borrowerId, {
        'wallet.balance': 0
      });

      await expect(
        rentalService.returnBook(requestId, borrowerId)
      ).rejects.toThrow('Insufficient balance for late fees');
    });
  });

  describe('getBorrowerRentalHistory', () => {
    beforeEach(async () => {
      // Create some rental history
      await rentalService.checkoutBook(requestId, publisherId);
      await rentalService.returnBook(requestId, borrowerId);
    });

    it('should get rental history with pagination', async () => {
      const result = await rentalService.getBorrowerRentalHistory(borrowerId, 1, 10);

      expect(result.rentals).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it('should include cost breakdown', async () => {
      const result = await rentalService.getBorrowerRentalHistory(borrowerId, 1, 10);

      if (result.rentals.length > 0) {
        const rental = result.rentals[0];
        expect(rental.costBreakdown).toBeDefined();
        expect(rental.costBreakdown.dailyRate).toBeDefined();
        expect(rental.costBreakdown.rentalDays).toBeDefined();
        expect(rental.costBreakdown.baseCost).toBeDefined();
      }
    });
  });

  describe('getBorrowerRentalSummary', () => {
    beforeEach(async () => {
      await rentalService.checkoutBook(requestId, publisherId);
      await rentalService.returnBook(requestId, borrowerId);
    });

    it('should get summary statistics', async () => {
      const summary = await rentalService.getBorrowerRentalSummary(borrowerId);

      expect(summary.totalRentals).toBeDefined();
      expect(summary.activeRentals).toBeDefined();
      expect(summary.completedRentals).toBeDefined();
      expect(summary.totalSpent).toBeDefined();
      expect(summary.totalLateFees).toBeDefined();
      expect(summary.averageRentalCost).toBeDefined();
    });
  });

  describe('getPublisherEarnings', () => {
    beforeEach(async () => {
      await rentalService.checkoutBook(requestId, publisherId);
      await rentalService.returnBook(requestId, borrowerId);
    });

    it('should get earnings with pagination', async () => {
      const result = await rentalService.getPublisherEarnings(publisherId, 1, 10);

      expect(result.earnings).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should include earnings breakdown', async () => {
      const result = await rentalService.getPublisherEarnings(publisherId, 1, 10);

      if (result.earnings.length > 0) {
        const earning = result.earnings[0];
        expect(earning.earningsBreakdown).toBeDefined();
        expect(earning.earningsBreakdown.baseCost).toBeDefined();
        expect(earning.earningsBreakdown.platformFee).toBeDefined();
        expect(earning.earningsBreakdown.publisherShare).toBeDefined();
      }
    });

    it('should support date filtering', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const result = await rentalService.getPublisherEarnings(
        publisherId, 1, 10, startDate.toISOString(), endDate.toISOString()
      );

      expect(result.earnings).toBeDefined();
    });
  });

  describe('getOverdueRentals', () => {
    it('should get overdue rentals', async () => {
      // Create an overdue rental
      await rentalService.checkoutBook(requestId, publisherId);
      
      // Set due date to yesterday
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await BookRequest.findByIdAndUpdate(requestId, {
        'rental.actualEndDate': yesterday
      });

      const overdueRentals = await rentalService.getOverdueRentals();

      expect(Array.isArray(overdueRentals)).toBe(true);
      
      if (overdueRentals.length > 0) {
        const rental = overdueRentals[0];
        expect(rental.daysOverdue).toBeGreaterThan(0);
        expect(rental.accruedLateFees).toBeGreaterThan(0);
      }
    });
  });

  describe('processLateFees', () => {
    it('should process late fees for overdue rentals', async () => {
      // Create an overdue rental
      await rentalService.checkoutBook(requestId, publisherId);
      
      // Set due date to yesterday
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await BookRequest.findByIdAndUpdate(requestId, {
        'rental.actualEndDate': yesterday
      });

      const result = await rentalService.processLateFees();

      expect(result.processedCount).toBeDefined();
      expect(result.failedCount).toBeDefined();
      expect(result.details).toBeDefined();
      expect(Array.isArray(result.details)).toBe(true);
    });
  });

  describe('Utility methods', () => {
    it('should format currency correctly', () => {
      const formatted = rentalService.formatCurrency(12.50);
      expect(formatted).toBe('$12.50');
    });

    it('should format date correctly', () => {
      const date = new Date('2024-01-15');
      const formatted = rentalService.formatDate(date);
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
    });

    it('should calculate rental duration correctly', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-08');
      const duration = rentalService.calculateRentalDuration(startDate, endDate);
      expect(duration).toBe(7);
    });
  });
});
