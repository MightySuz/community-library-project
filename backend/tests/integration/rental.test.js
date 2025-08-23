const request = require('supertest');
const app = require('../../src/server');
const mongoose = require('mongoose');
const User = require('../../src/models/User');
const Book = require('../../src/models/Book');
const BookRequest = require('../../src/models/BookRequest');

describe('Rental Routes', () => {
  let publisherToken, borrowerToken, adminToken;
  let publisherId, borrowerId, adminId;
  let bookId, requestId;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/community-library-test';
    await mongoose.connect(mongoUri);

    // Create test users
    const publisher = await User.create({
      fullName: 'Test Publisher',
      email: 'publisher@test.com',
      phoneNumber: '+1234567890',
      role: 'publisher',
      isApproved: true,
      isVerified: true,
      communityName: 'Test Community',
      address: 'Test Address'
    });
    publisherId = publisher._id;

    const borrower = await User.create({
      fullName: 'Test Borrower',
      email: 'borrower@test.com',
      phoneNumber: '+1234567891',
      role: 'borrower',
      isApproved: true,
      isVerified: true,
      communityName: 'Test Community',
      address: 'Test Address',
      wallet: {
        balance: 100.00,
        transactions: []
      }
    });
    borrowerId = borrower._id;

    const admin = await User.create({
      fullName: 'Test Admin',
      email: 'admin@test.com',
      phoneNumber: '+1234567892',
      role: 'admin',
      isApproved: true,
      isVerified: true
    });
    adminId = admin._id;

    // Create test book
    const book = await Book.create({
      title: 'Test Book',
      author: 'Test Author',
      isbn: '1234567890',
      genre: 'Fiction',
      publisher: publisherId,
      condition: 'good',
      availability: {
        status: 'available',
        location: 'Test Location'
      },
      rental: {
        available: true,
        pricePerDay: 2.50,
        maxRentalDays: 14
      }
    });
    bookId = book._id;

    // Create approved book request
    const bookRequest = await BookRequest.create({
      book: bookId,
      borrower: borrowerId,
      publisher: publisherId,
      requestedStartDate: new Date(),
      requestedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'approved',
      rental: {
        status: 'pending'
      },
      payment: {
        status: 'pending'
      }
    });
    requestId = bookRequest._id;

    // Generate tokens (mock JWT tokens for testing)
    publisherToken = 'mock-publisher-token';
    borrowerToken = 'mock-borrower-token';
    adminToken = 'mock-admin-token';
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Book.deleteMany({});
    await BookRequest.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Reset request status before each test
    await BookRequest.findByIdAndUpdate(requestId, {
      status: 'approved',
      'rental.status': 'pending',
      'payment.status': 'pending'
    });
  });

  describe('POST /api/rental/checkout/:requestId', () => {
    it('should successfully checkout a book', async () => {
      const response = await request(app)
        .post(`/api/rental/checkout/${requestId}`)
        .set('Authorization', `Bearer ${publisherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Book checked out successfully');
      expect(response.body.data.rental.status).toBe('active');
    });

    it('should fail with invalid request ID', async () => {
      const response = await request(app)
        .post('/api/rental/checkout/invalid-id')
        .set('Authorization', `Bearer ${publisherToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authorization', async () => {
      await request(app)
        .post(`/api/rental/checkout/${requestId}`)
        .expect(401);
    });
  });

  describe('POST /api/rental/return/:requestId', () => {
    beforeEach(async () => {
      // Set up an active rental first
      await BookRequest.findByIdAndUpdate(requestId, {
        'rental.status': 'active',
        'rental.actualStartDate': new Date(),
        'rental.actualEndDate': new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        'payment.status': 'completed',
        'payment.amount': 17.50
      });
    });

    it('should successfully return a book on time', async () => {
      const response = await request(app)
        .post(`/api/rental/return/${requestId}`)
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({
          returnDate: new Date().toISOString()
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Book returned successfully');
      expect(response.body.data.lateFees).toBe(0);
    });

    it('should calculate late fees for overdue return', async () => {
      // Set due date to yesterday
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await BookRequest.findByIdAndUpdate(requestId, {
        'rental.actualEndDate': yesterday
      });

      const response = await request(app)
        .post(`/api/rental/return/${requestId}`)
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({
          returnDate: new Date().toISOString()
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.lateFees).toBeGreaterThan(0);
    });

    it('should fail with invalid request ID', async () => {
      const response = await request(app)
        .post('/api/rental/return/invalid-id')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({
          returnDate: new Date().toISOString()
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/rental/history', () => {
    it('should get borrower rental history', async () => {
      const response = await request(app)
        .get('/api/rental/history')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('rentals');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/rental/history?page=1&limit=5')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(5);
    });

    it('should fail without authorization', async () => {
      await request(app)
        .get('/api/rental/history')
        .expect(401);
    });
  });

  describe('GET /api/rental/summary', () => {
    it('should get borrower rental summary', async () => {
      const response = await request(app)
        .get('/api/rental/summary')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalRentals');
      expect(response.body.data).toHaveProperty('activeRentals');
      expect(response.body.data).toHaveProperty('totalSpent');
    });
  });

  describe('GET /api/rental/earnings', () => {
    it('should get publisher earnings', async () => {
      const response = await request(app)
        .get('/api/rental/earnings')
        .set('Authorization', `Bearer ${publisherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('earnings');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should support date filtering', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(`/api/rental/earnings?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${publisherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/rental/earnings/summary', () => {
    it('should get publisher earnings summary', async () => {
      const response = await request(app)
        .get('/api/rental/earnings/summary')
        .set('Authorization', `Bearer ${publisherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalRentals');
      expect(response.body.data).toHaveProperty('grossRevenue');
      expect(response.body.data).toHaveProperty('netEarnings');
    });
  });

  describe('GET /api/rental/overdue', () => {
    it('should get overdue rentals (admin only)', async () => {
      const response = await request(app)
        .get('/api/rental/overdue')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should fail for non-admin users', async () => {
      await request(app)
        .get('/api/rental/overdue')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(403);
    });
  });

  describe('POST /api/rental/process-late-fees', () => {
    it('should process late fees (admin only)', async () => {
      const response = await request(app)
        .post('/api/rental/process-late-fees')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('processedCount');
      expect(response.body.data).toHaveProperty('failedCount');
    });

    it('should fail for non-admin users', async () => {
      await request(app)
        .post('/api/rental/process-late-fees')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(403);
    });
  });

  describe('GET /api/rental/analytics/book/:bookId', () => {
    it('should get book rental analytics for publisher', async () => {
      const response = await request(app)
        .get(`/api/rental/analytics/book/${bookId}`)
        .set('Authorization', `Bearer ${publisherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalRentals');
      expect(response.body.data).toHaveProperty('totalRevenue');
      expect(response.body.data).toHaveProperty('averageRentalDays');
    });

    it('should fail for non-owner publisher', async () => {
      // Create another publisher
      const otherPublisher = await User.create({
        fullName: 'Other Publisher',
        email: 'other@test.com',
        phoneNumber: '+1234567893',
        role: 'publisher',
        isApproved: true,
        isVerified: true
      });

      const otherToken = 'mock-other-publisher-token';

      await request(app)
        .get(`/api/rental/analytics/book/${bookId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      await User.findByIdAndDelete(otherPublisher._id);
    });
  });

  describe('POST /api/rental/calculate-cost', () => {
    it('should calculate rental cost', async () => {
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const response = await request(app)
        .post('/api/rental/calculate-cost')
        .send({
          pricePerDay: 2.50,
          startDate,
          endDate
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('days');
      expect(response.body.data).toHaveProperty('totalCost');
      expect(response.body.data.days).toBe(7);
      expect(response.body.data.totalCost).toBe(17.5);
    });

    it('should fail with missing parameters', async () => {
      const response = await request(app)
        .post('/api/rental/calculate-cost')
        .send({
          pricePerDay: 2.50
          // Missing startDate and endDate
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/rental/late-fee-rate', () => {
    it('should get late fee rate', async () => {
      const response = await request(app)
        .get('/api/rental/late-fee-rate')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('rate');
      expect(response.body.data).toHaveProperty('formatted');
      expect(response.body.data).toHaveProperty('description');
    });
  });
});
