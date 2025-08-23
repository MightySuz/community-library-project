const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../src/models/User');
const Book = require('../../src/models/Book');
const BookRequest = require('../../src/models/BookRequest');
const jwt = require('jsonwebtoken');

describe('Publisher Routes', () => {
  let publisherToken;
  let adminToken;
  let borrowerToken;
  let publisher;
  let borrower;
  let book;
  let bookRequest;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/community-library-test');
    }
  });

  beforeEach(async () => {
    // Clear test data
    await User.deleteMany({});
    await Book.deleteMany({});
    await BookRequest.deleteMany({});

    // Create test users
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

    const admin = await User.create({
      fullName: 'Test Admin',
      email: 'admin@test.com',
      phone: '1234567892',
      password: 'password123',
      role: 'admin',
      communityName: 'Test Community',
      address: '789 Admin Blvd',
      isApproved: true,
      verification: { isVerified: true }
    });

    // Generate tokens
    publisherToken = jwt.sign(
      { userId: publisher._id, role: publisher.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    borrowerToken = jwt.sign(
      { userId: borrower._id, role: borrower.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { userId: admin._id, role: admin.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create test book
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

    // Create test book request
    bookRequest = await BookRequest.create({
      book: book._id,
      borrower: borrower._id,
      publisher: publisher._id,
      requestedStartDate: new Date(),
      requestedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'pending'
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/publisher/dashboard', () => {
    it('should get publisher dashboard data', async () => {
      const response = await request(app)
        .get('/api/publisher/dashboard')
        .set('Authorization', `Bearer ${publisherToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalBooks');
      expect(response.body).toHaveProperty('pendingRequests');
      expect(response.body).toHaveProperty('activeRentals');
      expect(response.body).toHaveProperty('overdueRentals');
      expect(response.body).toHaveProperty('totalEarnings');
      expect(response.body.totalBooks).toBe(1);
      expect(response.body.pendingRequests).toBe(1);
    });

    it('should deny access to non-publishers', async () => {
      await request(app)
        .get('/api/publisher/dashboard')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(403);
    });
  });

  describe('POST /api/publisher/barcode/scan', () => {
    it('should scan barcode and return book info', async () => {
      const response = await request(app)
        .post('/api/publisher/barcode/scan')
        .set('Authorization', `Bearer ${publisherToken}`)
        .send({ barcode: '9780132350884' })
        .expect(200);

      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('author');
      expect(response.body).toHaveProperty('barcode', '9780132350884');
    });

    it('should require barcode parameter', async () => {
      await request(app)
        .post('/api/publisher/barcode/scan')
        .set('Authorization', `Bearer ${publisherToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/publisher/books', () => {
    const bookData = {
      title: 'New Test Book',
      author: 'New Test Author',
      isbn: '9876543210987',
      barcode: 'NEW123',
      genre: 'Science Fiction',
      description: 'A new test book',
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
      const response = await request(app)
        .post('/api/publisher/books')
        .set('Authorization', `Bearer ${publisherToken}`)
        .send(bookData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe(bookData.title);
      expect(response.body.publisher).toBe(publisher._id.toString());
      expect(response.body.approvalStatus).toBe('pending');
    });

    it('should validate required fields', async () => {
      const invalidData = { ...bookData };
      delete invalidData.title;

      await request(app)
        .post('/api/publisher/books')
        .set('Authorization', `Bearer ${publisherToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should prevent duplicate barcodes', async () => {
      const duplicateData = { ...bookData, barcode: 'TEST123' };

      await request(app)
        .post('/api/publisher/books')
        .set('Authorization', `Bearer ${publisherToken}`)
        .send(duplicateData)
        .expect(400);
    });
  });

  describe('GET /api/publisher/books', () => {
    it('should get publisher books', async () => {
      const response = await request(app)
        .get('/api/publisher/books')
        .set('Authorization', `Bearer ${publisherToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]._id).toBe(book._id.toString());
    });

    it('should filter books by status', async () => {
      const response = await request(app)
        .get('/api/publisher/books?status=approved')
        .set('Authorization', `Bearer ${publisherToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
    });

    it('should search books by title', async () => {
      const response = await request(app)
        .get('/api/publisher/books?search=Test Book')
        .set('Authorization', `Bearer ${publisherToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
    });
  });

  describe('PUT /api/publisher/books/:id', () => {
    it('should update book details', async () => {
      const updateData = {
        title: 'Updated Test Book',
        rental: {
          pricePerDay: 3.50,
          maxRentalDays: 21
        }
      };

      const response = await request(app)
        .put(`/api/publisher/books/${book._id}`)
        .set('Authorization', `Bearer ${publisherToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.rental.pricePerDay).toBe(updateData.rental.pricePerDay);
    });

    it('should not allow updating other publishers books', async () => {
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

      const otherToken = jwt.sign(
        { userId: otherPublisher._id, role: otherPublisher.role },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      await request(app)
        .put(`/api/publisher/books/${book._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Unauthorized Update' })
        .expect(403);
    });
  });

  describe('DELETE /api/publisher/books/:id', () => {
    it('should delete book', async () => {
      await request(app)
        .delete(`/api/publisher/books/${book._id}`)
        .set('Authorization', `Bearer ${publisherToken}`)
        .expect(200);

      const deletedBook = await Book.findById(book._id);
      expect(deletedBook).toBeNull();
    });

    it('should not delete book with active rentals', async () => {
      // Create an active rental
      await BookRequest.create({
        book: book._id,
        borrower: borrower._id,
        publisher: publisher._id,
        requestedStartDate: new Date(),
        requestedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'approved',
        rental: {
          actualStartDate: new Date(),
          actualEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'active'
        }
      });

      await request(app)
        .delete(`/api/publisher/books/${book._id}`)
        .set('Authorization', `Bearer ${publisherToken}`)
        .expect(400);
    });
  });

  describe('GET /api/publisher/requests', () => {
    it('should get publisher requests', async () => {
      const response = await request(app)
        .get('/api/publisher/requests')
        .set('Authorization', `Bearer ${publisherToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe('pending');
    });

    it('should filter requests by status', async () => {
      const response = await request(app)
        .get('/api/publisher/requests?status=pending')
        .set('Authorization', `Bearer ${publisherToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
    });
  });

  describe('PUT /api/publisher/requests/:id/approve', () => {
    it('should approve book request', async () => {
      const response = await request(app)
        .put(`/api/publisher/requests/${bookRequest._id}/approve`)
        .set('Authorization', `Bearer ${publisherToken}`)
        .send({ message: 'Request approved' })
        .expect(200);

      expect(response.body.status).toBe('approved');
      expect(response.body).toHaveProperty('rental');
      expect(response.body.rental.status).toBe('active');

      // Check book availability
      const updatedBook = await Book.findById(book._id);
      expect(updatedBook.availability.status).toBe('borrowed');
    });

    it('should not approve already processed request', async () => {
      await BookRequest.findByIdAndUpdate(bookRequest._id, { status: 'approved' });

      await request(app)
        .put(`/api/publisher/requests/${bookRequest._id}/approve`)
        .set('Authorization', `Bearer ${publisherToken}`)
        .send({ message: 'Request approved' })
        .expect(400);
    });
  });

  describe('PUT /api/publisher/requests/:id/reject', () => {
    it('should reject book request', async () => {
      const response = await request(app)
        .put(`/api/publisher/requests/${bookRequest._id}/reject`)
        .set('Authorization', `Bearer ${publisherToken}`)
        .send({ reason: 'Book not available' })
        .expect(200);

      expect(response.body.status).toBe('rejected');
      expect(response.body.rejectionReason).toBe('Book not available');
    });

    it('should require rejection reason', async () => {
      await request(app)
        .put(`/api/publisher/requests/${bookRequest._id}/reject`)
        .set('Authorization', `Bearer ${publisherToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/publisher/borrowed', () => {
    beforeEach(async () => {
      // Create approved request with active rental
      await BookRequest.findByIdAndUpdate(bookRequest._id, {
        status: 'approved',
        rental: {
          actualStartDate: new Date(),
          actualEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'active'
        }
      });
    });

    it('should get borrowed books', async () => {
      const response = await request(app)
        .get('/api/publisher/borrowed')
        .set('Authorization', `Bearer ${publisherToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].rental.status).toBe('active');
    });
  });

  describe('GET /api/publisher/overdue', () => {
    beforeEach(async () => {
      // Create overdue rental
      await BookRequest.findByIdAndUpdate(bookRequest._id, {
        status: 'approved',
        rental: {
          actualStartDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          actualEndDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          status: 'overdue'
        }
      });
    });

    it('should get overdue books', async () => {
      const response = await request(app)
        .get('/api/publisher/overdue')
        .set('Authorization', `Bearer ${publisherToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].rental.status).toBe('overdue');
    });
  });

  describe('PUT /api/publisher/returns/:id', () => {
    beforeEach(async () => {
      // Set up active rental
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
      const response = await request(app)
        .put(`/api/publisher/returns/${bookRequest._id}`)
        .set('Authorization', `Bearer ${publisherToken}`)
        .send({ damage: false })
        .expect(200);

      expect(response.body.rental.status).toBe('returned');
      expect(response.body.rental).toHaveProperty('actualReturnDate');

      // Check book availability
      const updatedBook = await Book.findById(book._id);
      expect(updatedBook.availability.status).toBe('available');
    });

    it('should mark book as returned with damage', async () => {
      const response = await request(app)
        .put(`/api/publisher/returns/${bookRequest._id}`)
        .set('Authorization', `Bearer ${publisherToken}`)
        .send({
          damage: true,
          damageAmount: 10.00,
          damageDescription: 'Water damage on cover'
        })
        .expect(200);

      expect(response.body.rental.status).toBe('returned');
      expect(response.body.damage.amount).toBe(10.00);
      expect(response.body.damage.description).toBe('Water damage on cover');
      expect(response.body.fines.damage).toBe(10.00);
    });

    it('should not mark already returned book', async () => {
      await BookRequest.findByIdAndUpdate(bookRequest._id, {
        'rental.status': 'returned'
      });

      await request(app)
        .put(`/api/publisher/returns/${bookRequest._id}`)
        .set('Authorization', `Bearer ${publisherToken}`)
        .send({ damage: false })
        .expect(400);
    });
  });

  describe('GET /api/publisher/earnings', () => {
    beforeEach(async () => {
      // Create completed rental with earnings
      await BookRequest.findByIdAndUpdate(bookRequest._id, {
        status: 'approved',
        rental: {
          actualStartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          actualEndDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          actualReturnDate: new Date(),
          status: 'returned',
          totalDays: 6
        },
        payment: {
          amount: 15.00,
          status: 'completed',
          paidAt: new Date()
        }
      });
    });

    it('should get earnings data', async () => {
      const response = await request(app)
        .get('/api/publisher/earnings')
        .set('Authorization', `Bearer ${publisherToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalEarnings');
      expect(response.body).toHaveProperty('monthlyEarnings');
      expect(response.body).toHaveProperty('pendingPayments');
      expect(response.body.totalEarnings).toBeGreaterThan(0);
    });

    it('should filter earnings by date range', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const response = await request(app)
        .get(`/api/publisher/earnings?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', `Bearer ${publisherToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalEarnings');
    });
  });

  describe('GET /api/publisher/history', () => {
    it('should get rental history', async () => {
      const response = await request(app)
        .get('/api/publisher/history')
        .set('Authorization', `Bearer ${publisherToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
    });

    it('should paginate rental history', async () => {
      const response = await request(app)
        .get('/api/publisher/history?page=1&limit=10')
        .set('Authorization', `Bearer ${publisherToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
    });
  });

  describe('Authorization', () => {
    it('should require authentication for all routes', async () => {
      await request(app).get('/api/publisher/dashboard').expect(401);
      await request(app).get('/api/publisher/books').expect(401);
      await request(app).post('/api/publisher/books').expect(401);
    });

    it('should require publisher role', async () => {
      await request(app)
        .get('/api/publisher/dashboard')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(403);

      await request(app)
        .get('/api/publisher/books')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(403);
    });

    it('should allow admin access to publisher routes', async () => {
      await request(app)
        .get('/api/publisher/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});
