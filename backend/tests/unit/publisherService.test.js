const mongoose = require('mongoose');
const publisherService = require('../../src/services/publisherService');
const User = require('../../src/models/User');
const Book = require('../../src/models/Book');
const BookRequest = require('../../src/models/BookRequest');

describe('Publisher Service', () => {
  let publisher;
  let borrower;
  let book;
  let bookRequest;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/community-library-test');
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Book.deleteMany({});
    await BookRequest.deleteMany({});

    publisher = await User.create({
      fullName: 'Test Publisher',
      email: 'publisher@test.com',
      phone: '1234567890',
      password: 'password123',
      role: 'publisher',
      communityName: 'Test Community',
      address: '123 Test St',
      isApproved: true,
      verification: { isVerified: true }
    });

    borrower = await User.create({
      fullName: 'Test Borrower',
      email: 'borrower@test.com',
      phone: '1234567891',
      password: 'password123',
      role: 'borrower',
      communityName: 'Test Community',
      address: '456 Test Ave',
      isApproved: true,
      verification: { isVerified: true }
    });

    book = await Book.create({
      title: 'Test Book',
      author: 'Test Author',
      isbn: '1234567890123',
      barcode: 'TEST123',
      genre: 'Fiction',
      description: 'A test book',
      condition: 'good',
      publisher: publisher._id,
      publishedYear: 2023,
      language: 'English',
      pages: 200,
      rental: {
        available: true,
        pricePerDay: 2.50,
        maxRentalDays: 14
      },
      purchasePrice: 19.99,
      approvalStatus: 'approved'
    });

    bookRequest = await BookRequest.create({
      book: book._id,
      borrower: borrower._id,
      publisher: publisher._id,
      requestedStartDate: new Date(),
      requestedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'pending'
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      const stats = await publisherService.getDashboardStats(publisher._id);

      expect(stats).toHaveProperty('totalBooks');
      expect(stats).toHaveProperty('pendingRequests');
      expect(stats).toHaveProperty('activeRentals');
      expect(stats).toHaveProperty('overdueRentals');
      expect(stats).toHaveProperty('totalEarnings');
      expect(stats).toHaveProperty('monthlyEarnings');

      expect(stats.totalBooks).toBe(1);
      expect(stats.pendingRequests).toBe(1);
      expect(stats.activeRentals).toBe(0);
    });

    it('should handle publisher with no data', async () => {
      const newPublisher = await User.create({
        fullName: 'New Publisher',
        email: 'new@test.com',
        phone: '1234567899',
        password: 'password123',
        role: 'publisher',
        communityName: 'New Community',
        address: '999 New St',
        isApproved: true,
        verification: { isVerified: true }
      });

      const stats = await publisherService.getDashboardStats(newPublisher._id);

      expect(stats.totalBooks).toBe(0);
      expect(stats.pendingRequests).toBe(0);
      expect(stats.activeRentals).toBe(0);
      expect(stats.totalEarnings).toBe(0);
    });
  });

  describe('getBookFromBarcode', () => {
    it('should return book info from known barcode', async () => {
      const bookInfo = await publisherService.getBookFromBarcode('9780132350884');

      expect(bookInfo).toHaveProperty('title');
      expect(bookInfo).toHaveProperty('author');
      expect(bookInfo).toHaveProperty('barcode', '9780132350884');
      expect(bookInfo.title).toBe('Clean Code: A Handbook of Agile Software Craftsmanship');
    });

    it('should return partial info for unknown barcode', async () => {
      const bookInfo = await publisherService.getBookFromBarcode('UNKNOWN123');

      expect(bookInfo).toHaveProperty('barcode', 'UNKNOWN123');
      expect(bookInfo).toHaveProperty('condition', 'good');
      expect(bookInfo).toHaveProperty('rental');
    });

    it('should throw error for invalid barcode', async () => {
      await expect(publisherService.getBookFromBarcode('')).rejects.toThrow('Barcode is required');
    });
  });

  describe('addBook', () => {
    const bookData = {
      title: 'New Book',
      author: 'New Author',
      isbn: '9876543210987',
      barcode: 'NEW123',
      genre: 'Science Fiction',
      description: 'A new book',
      condition: 'excellent',
      publishedYear: 2024,
      language: 'English',
      pages: 300,
      rental: {
        pricePerDay: 3.00,
        maxRentalDays: 21
      },
      purchasePrice: 24.99
    };

    it('should create a new book', async () => {
      const newBook = await publisherService.addBook(publisher._id, bookData);

      expect(newBook).toHaveProperty('_id');
      expect(newBook.title).toBe(bookData.title);
      expect(newBook.publisher.toString()).toBe(publisher._id.toString());
      expect(newBook.approvalStatus).toBe('pending');
    });

    it('should validate required fields', async () => {
      const invalidData = { ...bookData };
      delete invalidData.title;

      await expect(publisherService.addBook(publisher._id, invalidData))
        .rejects.toThrow('Title is required');
    });

    it('should validate rental price', async () => {
      const invalidData = { ...bookData, rental: { pricePerDay: -1 } };

      await expect(publisherService.addBook(publisher._id, invalidData))
        .rejects.toThrow('Rental price must be greater than 0');
    });

    it('should prevent duplicate barcodes', async () => {
      const duplicateData = { ...bookData, barcode: 'TEST123' };

      await expect(publisherService.addBook(publisher._id, duplicateData))
        .rejects.toThrow('Book with this barcode already exists');
    });
  });

  describe('updateBook', () => {
    it('should update book details', async () => {
      const updateData = {
        title: 'Updated Book Title',
        rental: {
          pricePerDay: 4.00
        }
      };

      const updatedBook = await publisherService.updateBook(book._id, publisher._id, updateData);

      expect(updatedBook.title).toBe(updateData.title);
      expect(updatedBook.rental.pricePerDay).toBe(updateData.rental.pricePerDay);
    });

    it('should not allow updating non-owned books', async () => {
      const otherPublisher = await User.create({
        fullName: 'Other Publisher',
        email: 'other@test.com',
        phone: '1234567893',
        password: 'password123',
        role: 'publisher',
        communityName: 'Other Community',
        address: '999 Other St',
        isApproved: true,
        verification: { isVerified: true }
      });

      await expect(publisherService.updateBook(book._id, otherPublisher._id, { title: 'Unauthorized' }))
        .rejects.toThrow('Book not found or access denied');
    });

    it('should not update books with active rentals', async () => {
      await BookRequest.findByIdAndUpdate(bookRequest._id, {
        status: 'approved',
        rental: { status: 'active' }
      });

      await expect(publisherService.updateBook(book._id, publisher._id, { title: 'Cannot Update' }))
        .rejects.toThrow('Cannot update book with active rentals');
    });
  });

  describe('deleteBook', () => {
    it('should delete book successfully', async () => {
      await publisherService.deleteBook(book._id, publisher._id);

      const deletedBook = await Book.findById(book._id);
      expect(deletedBook).toBeNull();
    });

    it('should not delete books with active rentals', async () => {
      await BookRequest.findByIdAndUpdate(bookRequest._id, {
        status: 'approved',
        rental: { status: 'active' }
      });

      await expect(publisherService.deleteBook(book._id, publisher._id))
        .rejects.toThrow('Cannot delete book with active rentals');
    });

    it('should not delete non-owned books', async () => {
      const otherPublisher = await User.create({
        fullName: 'Other Publisher',
        email: 'other@test.com',
        phone: '1234567893',
        password: 'password123',
        role: 'publisher',
        communityName: 'Other Community',
        address: '999 Other St',
        isApproved: true,
        verification: { isVerified: true }
      });

      await expect(publisherService.deleteBook(book._id, otherPublisher._id))
        .rejects.toThrow('Book not found or access denied');
    });
  });

  describe('approveRequest', () => {
    it('should approve pending request', async () => {
      const approvedRequest = await publisherService.approveRequest(
        bookRequest._id,
        publisher._id,
        { message: 'Request approved' }
      );

      expect(approvedRequest.status).toBe('approved');
      expect(approvedRequest).toHaveProperty('rental');
      expect(approvedRequest.rental.status).toBe('active');

      // Check book availability
      const updatedBook = await Book.findById(book._id);
      expect(updatedBook.availability.status).toBe('borrowed');
    });

    it('should not approve already processed request', async () => {
      await BookRequest.findByIdAndUpdate(bookRequest._id, { status: 'approved' });

      await expect(publisherService.approveRequest(bookRequest._id, publisher._id, {}))
        .rejects.toThrow('Request is not pending');
    });

    it('should not approve request for unavailable book', async () => {
      await Book.findByIdAndUpdate(book._id, {
        'availability.status': 'borrowed'
      });

      await expect(publisherService.approveRequest(bookRequest._id, publisher._id, {}))
        .rejects.toThrow('Book is not available for rental');
    });
  });

  describe('rejectRequest', () => {
    it('should reject pending request', async () => {
      const rejectedRequest = await publisherService.rejectRequest(
        bookRequest._id,
        publisher._id,
        { reason: 'Book damaged' }
      );

      expect(rejectedRequest.status).toBe('rejected');
      expect(rejectedRequest.rejectionReason).toBe('Book damaged');
    });

    it('should require rejection reason', async () => {
      await expect(publisherService.rejectRequest(bookRequest._id, publisher._id, {}))
        .rejects.toThrow('Rejection reason is required');
    });

    it('should not reject already processed request', async () => {
      await BookRequest.findByIdAndUpdate(bookRequest._id, { status: 'approved' });

      await expect(publisherService.rejectRequest(bookRequest._id, publisher._id, { reason: 'Test' }))
        .rejects.toThrow('Request is not pending');
    });
  });

  describe('markReturned', () => {
    beforeEach(async () => {
      await BookRequest.findByIdAndUpdate(bookRequest._id, {
        status: 'approved',
        rental: {
          actualStartDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          actualEndDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          status: 'active'
        }
      });
    });

    it('should mark book as returned without damage', async () => {
      const returnedRequest = await publisherService.markReturned(
        bookRequest._id,
        publisher._id,
        { damage: false }
      );

      expect(returnedRequest.rental.status).toBe('returned');
      expect(returnedRequest.rental).toHaveProperty('actualReturnDate');

      // Check book availability
      const updatedBook = await Book.findById(book._id);
      expect(updatedBook.availability.status).toBe('available');
    });

    it('should mark book as returned with damage', async () => {
      const returnedRequest = await publisherService.markReturned(
        bookRequest._id,
        publisher._id,
        {
          damage: true,
          damageAmount: 15.00,
          damageDescription: 'Water damage'
        }
      );

      expect(returnedRequest.rental.status).toBe('returned');
      expect(returnedRequest.damage.amount).toBe(15.00);
      expect(returnedRequest.damage.description).toBe('Water damage');
      expect(returnedRequest.fines.damage).toBe(15.00);
    });

    it('should calculate late fees for overdue returns', async () => {
      // Set end date in the past
      await BookRequest.findByIdAndUpdate(bookRequest._id, {
        'rental.actualEndDate': new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        'rental.status': 'overdue'
      });

      const returnedRequest = await publisherService.markReturned(
        bookRequest._id,
        publisher._id,
        { damage: false }
      );

      expect(returnedRequest.fines.late).toBeGreaterThan(0);
    });

    it('should not mark already returned book', async () => {
      await BookRequest.findByIdAndUpdate(bookRequest._id, {
        'rental.status': 'returned'
      });

      await expect(publisherService.markReturned(bookRequest._id, publisher._id, { damage: false }))
        .rejects.toThrow('Book is not currently rented');
    });
  });

  describe('getEarnings', () => {
    beforeEach(async () => {
      await BookRequest.findByIdAndUpdate(bookRequest._id, {
        status: 'approved',
        rental: {
          actualStartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          actualEndDate: new Date(),
          actualReturnDate: new Date(),
          status: 'returned',
          totalDays: 7
        },
        payment: {
          amount: 17.50,
          status: 'completed',
          paidAt: new Date()
        }
      });
    });

    it('should calculate total earnings', async () => {
      const earnings = await publisherService.getEarnings(publisher._id);

      expect(earnings).toHaveProperty('totalEarnings');
      expect(earnings).toHaveProperty('monthlyEarnings');
      expect(earnings).toHaveProperty('pendingPayments');
      expect(earnings.totalEarnings).toBe(17.50);
    });

    it('should filter earnings by date range', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const earnings = await publisherService.getEarnings(publisher._id, { startDate, endDate });

      expect(earnings.totalEarnings).toBe(17.50);
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics data', async () => {
      const analytics = await publisherService.getAnalytics(publisher._id, 'month');

      expect(analytics).toHaveProperty('summary');
      expect(analytics).toHaveProperty('bookPerformance');
      expect(analytics).toHaveProperty('rentalTrends');
      expect(analytics).toHaveProperty('revenueData');
      expect(analytics.summary).toHaveProperty('totalBooks');
      expect(analytics.summary).toHaveProperty('totalRentals');
    });

    it('should handle different time periods', async () => {
      const weeklyAnalytics = await publisherService.getAnalytics(publisher._id, 'week');
      const yearlyAnalytics = await publisherService.getAnalytics(publisher._id, 'year');

      expect(weeklyAnalytics).toHaveProperty('summary');
      expect(yearlyAnalytics).toHaveProperty('summary');
    });
  });

  describe('validateBookData', () => {
    const validBookData = {
      title: 'Valid Book',
      author: 'Valid Author',
      rental: { pricePerDay: 2.50 }
    };

    it('should validate valid book data', () => {
      const errors = publisherService.validateBookData(validBookData);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for missing required fields', () => {
      const invalidData = { author: 'Author Only' };
      const errors = publisherService.validateBookData(invalidData);

      expect(errors).toContain('Title is required');
      expect(errors).toContain('Rental price is required');
    });

    it('should validate rental price', () => {
      const invalidData = { ...validBookData, rental: { pricePerDay: -1 } };
      const errors = publisherService.validateBookData(invalidData);

      expect(errors).toContain('Rental price must be greater than 0');
    });

    it('should validate pages number', () => {
      const invalidData = { ...validBookData, pages: -50 };
      const errors = publisherService.validateBookData(invalidData);

      expect(errors).toContain('Pages must be a positive number');
    });

    it('should validate published year', () => {
      const invalidData = { ...validBookData, publishedYear: 2050 };
      const errors = publisherService.validateBookData(invalidData);

      expect(errors).toContain('Published year cannot be in the future');
    });
  });

  describe('calculateFines', () => {
    it('should calculate late fees correctly', () => {
      const endDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      const returnDate = new Date();
      const dailyRate = 0.50;

      const lateFee = publisherService.calculateLateFee(endDate, returnDate, dailyRate);
      expect(lateFee).toBe(1.50); // 3 days * $0.50
    });

    it('should return 0 for on-time returns', () => {
      const endDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days future
      const returnDate = new Date();
      const dailyRate = 0.50;

      const lateFee = publisherService.calculateLateFee(endDate, returnDate, dailyRate);
      expect(lateFee).toBe(0);
    });

    it('should calculate rental amount correctly', () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date();
      const dailyRate = 2.50;

      const rentalAmount = publisherService.calculateRentalAmount(startDate, endDate, dailyRate);
      expect(rentalAmount).toBe(17.50); // 7 days * $2.50
    });
  });
});
