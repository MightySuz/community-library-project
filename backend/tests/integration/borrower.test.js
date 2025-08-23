const request = require('supertest');
const app = require('../../src/server');
const User = require('../../src/models/User');
const Book = require('../../src/models/Book');
const BookRequest = require('../../src/models/BookRequest');
const mongoose = require('mongoose');

describe('Borrower Routes', () => {
  let borrowerToken;
  let publisherToken;
  let borrowerUser;
  let publisherUser;
  let testBook;

  beforeAll(async () => {
    // Create test users
    borrowerUser = new User({
      fullName: 'Test Borrower',
      email: 'borrower@test.com',
      phoneNumber: '+1234567890',
      role: 'borrower',
      communityName: 'Test Community',
      isApproved: true,
      isVerified: true,
      wallet: {
        balance: 100.00,
        transactions: []
      }
    });
    await borrowerUser.save();

    publisherUser = new User({
      fullName: 'Test Publisher',
      email: 'publisher@test.com',
      phoneNumber: '+1234567891',
      role: 'publisher',
      communityName: 'Test Community',
      isApproved: true,
      isVerified: true
    });
    await publisherUser.save();

    // Create test book
    testBook = new Book({
      title: 'Test Book',
      author: 'Test Author',
      genre: 'Fiction',
      isbn: '9781234567890',
      description: 'A test book for borrower tests',
      publisher: publisherUser._id,
      barcode: 'TEST123456789',
      rental: {
        available: true,
        pricePerDay: 2.50,
        maxRentalDays: 14
      },
      availability: {
        status: 'available',
        totalCopies: 1,
        availableCopies: 1
      },
      approvalStatus: 'approved'
    });
    await testBook.save();

    // Generate tokens
    borrowerToken = borrowerUser.generateAuthToken();
    publisherToken = publisherUser.generateAuthToken();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Book.deleteMany({});
    await BookRequest.deleteMany({});
  });

  describe('GET /api/borrower/dashboard', () => {
    test('should get borrower dashboard stats', async () => {
      const response = await request(app)
        .get('/api/borrower/dashboard')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('activeRentals');
      expect(response.body).toHaveProperty('holds');
      expect(response.body).toHaveProperty('overdueBooks');
      expect(response.body).toHaveProperty('walletBalance');
      expect(response.body).toHaveProperty('communityName', 'Test Community');
      expect(response.body.walletBalance).toBe(100.00);
    });

    test('should require authentication', async () => {
      await request(app)
        .get('/api/borrower/dashboard')
        .expect(401);
    });
  });

  describe('GET /api/borrower/books/search', () => {
    test('should search books in community', async () => {
      const response = await request(app)
        .get('/api/borrower/books/search')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('books');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.books).toHaveLength(1);
      expect(response.body.books[0].title).toBe('Test Book');
      expect(response.body.books[0].publisher.communityName).toBe('Test Community');
    });

    test('should filter by search term', async () => {
      const response = await request(app)
        .get('/api/borrower/books/search?search=Test')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(200);

      expect(response.body.books).toHaveLength(1);
      expect(response.body.books[0].title).toBe('Test Book');
    });

    test('should filter by genre', async () => {
      const response = await request(app)
        .get('/api/borrower/books/search?genre=Fiction')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(200);

      expect(response.body.books).toHaveLength(1);
      expect(response.body.books[0].genre).toBe('Fiction');
    });

    test('should filter by author', async () => {
      const response = await request(app)
        .get('/api/borrower/books/search?author=Test Author')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(200);

      expect(response.body.books).toHaveLength(1);
      expect(response.body.books[0].author).toBe('Test Author');
    });

    test('should filter by price range', async () => {
      const response = await request(app)
        .get('/api/borrower/books/search?minPrice=2&maxPrice=3')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(200);

      expect(response.body.books).toHaveLength(1);
      expect(response.body.books[0].rental.pricePerDay).toBe(2.50);
    });

    test('should sort books', async () => {
      const response = await request(app)
        .get('/api/borrower/books/search?sortBy=title&sortOrder=desc')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(200);

      expect(response.body.books).toHaveLength(1);
    });

    test('should paginate results', async () => {
      const response = await request(app)
        .get('/api/borrower/books/search?page=1&limit=5')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });
  });

  describe('GET /api/borrower/books/:bookId', () => {
    test('should get book details', async () => {
      const response = await request(app)
        .get(`/api/borrower/books/${testBook._id}`)
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(200);

      expect(response.body.title).toBe('Test Book');
      expect(response.body.author).toBe('Test Author');
      expect(response.body.publisher.fullName).toBe('Test Publisher');
      expect(response.body.availability).toHaveProperty('canHold');
      expect(response.body.availability).toHaveProperty('canRent');
    });

    test('should return 404 for non-existent book', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/borrower/books/${nonExistentId}`)
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(400);
    });
  });

  describe('POST /api/borrower/books/:bookId/hold', () => {
    test('should place hold on available book', async () => {
      const response = await request(app)
        .post(`/api/borrower/books/${testBook._id}/hold`)
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({ holdDays: 1 })
        .expect(201);

      expect(response.body.status).toBe('hold');
      expect(response.body.book).toBe(testBook._id.toString());
      expect(response.body.borrower).toBe(borrowerUser._id.toString());
      expect(response.body.holdExpiry).toBeDefined();
    });

    test('should not allow duplicate holds', async () => {
      // Try to place another hold on the same book
      await request(app)
        .post(`/api/borrower/books/${testBook._id}/hold`)
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({ holdDays: 1 })
        .expect(400);
    });

    test('should validate hold days', async () => {
      // Clean up existing hold first
      await BookRequest.deleteMany({ borrower: borrowerUser._id });
      await Book.findByIdAndUpdate(testBook._id, {
        'availability.status': 'available',
        $unset: { 'availability.heldBy': 1, 'availability.holdExpiry': 1 }
      });

      await request(app)
        .post(`/api/borrower/books/${testBook._id}/hold`)
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({ holdDays: 5 })
        .expect(400);
    });
  });

  describe('GET /api/borrower/rentals', () => {
    test('should get user rentals and holds', async () => {
      const response = await request(app)
        .get('/api/borrower/rentals')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('book');
      expect(response.body[0]).toHaveProperty('status');
    });
  });

  describe('POST /api/borrower/wallet/add-funds', () => {
    test('should add funds to wallet', async () => {
      const response = await request(app)
        .post('/api/borrower/wallet/add-funds')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({
          amount: 50.00,
          paymentMethod: {
            type: 'card',
            cardNumber: '4242424242424242'
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.newBalance).toBe(150.00);
      expect(response.body.transaction).toHaveProperty('transactionId');
    });

    test('should validate amount', async () => {
      await request(app)
        .post('/api/borrower/wallet/add-funds')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({
          amount: -10,
          paymentMethod: { type: 'card' }
        })
        .expect(400);
    });

    test('should validate payment method', async () => {
      await request(app)
        .post('/api/borrower/wallet/add-funds')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({
          amount: 25.00,
          paymentMethod: { type: 'invalid' }
        })
        .expect(400);
    });
  });

  describe('GET /api/borrower/wallet', () => {
    test('should get wallet information', async () => {
      const response = await request(app)
        .get('/api/borrower/wallet')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('balance');
      expect(response.body).toHaveProperty('transactions');
      expect(Array.isArray(response.body.transactions)).toBe(true);
    });
  });

  describe('GET /api/borrower/genres', () => {
    test('should get available genres in community', async () => {
      const response = await request(app)
        .get('/api/borrower/genres')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toContain('Fiction');
    });
  });

  describe('GET /api/borrower/authors', () => {
    test('should get available authors in community', async () => {
      const response = await request(app)
        .get('/api/borrower/authors')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toContain('Test Author');
    });
  });

  describe('POST /api/borrower/wallet/validate', () => {
    test('should validate wallet balance for rental', async () => {
      const response = await request(app)
        .post('/api/borrower/wallet/validate')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({ rentalAmount: 25.00 })
        .expect(200);

      expect(response.body.valid).toBe(true);
    });

    test('should reject insufficient balance', async () => {
      const response = await request(app)
        .post('/api/borrower/wallet/validate')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({ rentalAmount: 200.00 })
        .expect(200);

      expect(response.body.valid).toBe(false);
      expect(response.body.message).toContain('Insufficient funds');
      expect(response.body.shortfall).toBe(50.00);
    });
  });

  describe('POST /api/borrower/rental/calculate-cost', () => {
    test('should calculate rental cost', async () => {
      const response = await request(app)
        .post('/api/borrower/rental/calculate-cost')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({ pricePerDay: 2.50, days: 7 })
        .expect(200);

      expect(response.body.totalCost).toBe(17.50);
      expect(response.body.pricePerDay).toBe(2.50);
      expect(response.body.days).toBe(7);
      expect(response.body.formattedCost).toBe('$17.50');
    });

    test('should validate input parameters', async () => {
      await request(app)
        .post('/api/borrower/rental/calculate-cost')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({ pricePerDay: -1, days: 7 })
        .expect(400);
    });
  });

  describe('GET /api/borrower/books/popular', () => {
    test('should get popular books in community', async () => {
      const response = await request(app)
        .get('/api/borrower/books/popular')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/borrower/books/recent', () => {
    test('should get recently added books in community', async () => {
      const response = await request(app)
        .get('/api/borrower/books/recent')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('title');
        expect(response.body[0]).toHaveProperty('author');
        expect(response.body[0]).toHaveProperty('publisher');
      }
    });
  });

  describe('DELETE /api/borrower/holds/:holdId', () => {
    let holdId;

    beforeEach(async () => {
      // Clean up and create a fresh hold
      await BookRequest.deleteMany({ borrower: borrowerUser._id });
      await Book.findByIdAndUpdate(testBook._id, {
        'availability.status': 'available',
        $unset: { 'availability.heldBy': 1, 'availability.holdExpiry': 1 }
      });

      const hold = new BookRequest({
        book: testBook._id,
        borrower: borrowerUser._id,
        publisher: publisherUser._id,
        status: 'hold',
        holdExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
        requestedStartDate: new Date(),
        requestedEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      });
      await hold.save();
      holdId = hold._id;

      await Book.findByIdAndUpdate(testBook._id, {
        'availability.status': 'on-hold',
        'availability.heldBy': borrowerUser._id,
        'availability.holdExpiry': hold.holdExpiry
      });
    });

    test('should cancel hold', async () => {
      const response = await request(app)
        .delete(`/api/borrower/holds/${holdId}`)
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(200);

      expect(response.body.message).toContain('cancelled successfully');
      expect(response.body.hold.status).toBe('cancelled');

      // Verify book availability was updated
      const updatedBook = await Book.findById(testBook._id);
      expect(updatedBook.availability.status).toBe('available');
      expect(updatedBook.availability.heldBy).toBeUndefined();
    });

    test('should not allow cancelling non-existent hold', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      await request(app)
        .delete(`/api/borrower/holds/${nonExistentId}`)
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(400);
    });
  });

  describe('POST /api/borrower/holds/:holdId/convert', () => {
    let holdId;

    beforeEach(async () => {
      // Clean up and create a fresh hold
      await BookRequest.deleteMany({ borrower: borrowerUser._id });
      
      const hold = new BookRequest({
        book: testBook._id,
        borrower: borrowerUser._id,
        publisher: publisherUser._id,
        status: 'hold',
        holdExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
        requestedStartDate: new Date(),
        requestedEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        payment: {
          estimatedAmount: 35.00,
          status: 'pending'
        }
      });
      await hold.save();
      holdId = hold._id;
    });

    test('should convert hold to request', async () => {
      const response = await request(app)
        .post(`/api/borrower/holds/${holdId}/convert`)
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(200);

      expect(response.body.status).toBe('pending');
      expect(response.body.requestDate).toBeDefined();
    });

    test('should not convert hold with insufficient balance', async () => {
      // Update user wallet to have insufficient balance
      await User.findByIdAndUpdate(borrowerUser._id, {
        'wallet.balance': 10.00
      });

      await request(app)
        .post(`/api/borrower/holds/${holdId}/convert`)
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(400);

      // Restore balance for other tests
      await User.findByIdAndUpdate(borrowerUser._id, {
        'wallet.balance': 150.00
      });
    });
  });
});
