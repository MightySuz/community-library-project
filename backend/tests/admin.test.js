const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Book = require('../src/models/Book');
const Transaction = require('../src/models/Transaction');
const Wallet = require('../src/models/Wallet');
const SystemConfig = require('../src/models/SystemConfig');
const jwt = require('jsonwebtoken');

describe('Admin Routes Integration Tests', () => {
  let adminToken;
  let testUser;
  let testBook;
  let testAdmin;

  beforeAll(async () => {
    // Create test admin user
    testAdmin = await User.create({
      fullName: 'Test Admin',
      email: 'admin@test.com',
      password: 'password123',
      phoneNumber: '+1234567890',
      communityName: 'Test Community',
      role: 'admin',
      isApproved: true,
      isEmailVerified: true,
      isPhoneVerified: true,
    });

    // Generate admin token
    adminToken = jwt.sign(
      { userId: testAdmin._id, role: testAdmin.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create test user
    testUser = await User.create({
      fullName: 'Test User',
      email: 'user@test.com',
      password: 'password123',
      phoneNumber: '+1234567891',
      communityName: 'Test Community',
      role: 'member',
      isApproved: false,
      isEmailVerified: true,
      isPhoneVerified: true,
    });

    // Create test book
    testBook = await Book.create({
      title: 'Test Book',
      author: 'Test Author',
      isbn: '1234567890123',
      genre: 'Fiction',
      description: 'A test book',
      condition: 'good',
      publisher: testUser._id,
      approvalStatus: 'pending',
    });

    // Create test wallet
    await Wallet.create({
      user: testUser._id,
      balance: 100,
      status: 'active',
    });

    // Create test transaction
    await Transaction.create({
      user: testUser._id,
      type: 'deposit',
      amount: 50,
      description: 'Test deposit',
      status: 'completed',
    });

    // Create system config
    await SystemConfig.create({
      category: 'fines',
      settings: {
        overdue_fine_per_day: 1.0,
        grace_period_days: 3,
        damage_fine_percentage: 50,
        lost_book_multiplier: 2,
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Book.deleteMany({});
    await Transaction.deleteMany({});
    await Wallet.deleteMany({});
    await SystemConfig.deleteMany({});
  });

  describe('Dashboard Stats', () => {
    it('should get dashboard statistics', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('pendingUsers');
      expect(response.body).toHaveProperty('totalBooks');
      expect(response.body).toHaveProperty('pendingBooks');
      expect(response.body).toHaveProperty('activeRentals');
      expect(response.body).toHaveProperty('overdueBooks');
      expect(response.body).toHaveProperty('totalFines');
      expect(response.body).toHaveProperty('totalRevenue');
    });

    it('should deny access without admin token', async () => {
      await request(app)
        .get('/api/admin/dashboard/stats')
        .expect(401);
    });
  });

  describe('User Management', () => {
    it('should get pending users', async () => {
      const response = await request(app)
        .get('/api/admin/users/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('fullName');
      expect(response.body[0]).toHaveProperty('email');
      expect(response.body[0].isApproved).toBe(false);
    });

    it('should approve a user', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${testUser._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('User approved successfully');

      // Verify user is approved
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.isApproved).toBe(true);
    });

    it('should reject a user', async () => {
      // Create another test user to reject
      const rejectedUser = await User.create({
        fullName: 'Rejected User',
        email: 'rejected@test.com',
        password: 'password123',
        phoneNumber: '+1234567892',
        communityName: 'Test Community',
        role: 'member',
        isApproved: false,
        isEmailVerified: true,
        isPhoneVerified: true,
      });

      const response = await request(app)
        .post(`/api/admin/users/${rejectedUser._id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test rejection' })
        .expect(200);

      expect(response.body.message).toBe('User rejected');

      // Verify user is rejected
      const updatedUser = await User.findById(rejectedUser._id);
      expect(updatedUser.rejectionReason).toBe('Test rejection');
    });

    it('should block a user', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${testUser._id}/block`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test block' })
        .expect(200);

      expect(response.body.message).toBe('User blocked successfully');

      // Verify user is blocked
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.isBlocked).toBe(true);
    });
  });

  describe('Book Management', () => {
    it('should get pending books', async () => {
      const response = await request(app)
        .get('/api/admin/books/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('author');
      expect(response.body[0].approvalStatus).toBe('pending');
    });

    it('should approve a book', async () => {
      const response = await request(app)
        .post(`/api/admin/books/${testBook._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('Book approved successfully');

      // Verify book is approved
      const updatedBook = await Book.findById(testBook._id);
      expect(updatedBook.approvalStatus).toBe('approved');
    });

    it('should reject a book', async () => {
      // Create another test book to reject
      const rejectedBook = await Book.create({
        title: 'Rejected Book',
        author: 'Test Author',
        isbn: '1234567890124',
        genre: 'Fiction',
        description: 'A rejected book',
        condition: 'good',
        publisher: testUser._id,
        approvalStatus: 'pending',
      });

      const response = await request(app)
        .post(`/api/admin/books/${rejectedBook._id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test rejection' })
        .expect(200);

      expect(response.body.message).toBe('Book rejected');

      // Verify book is rejected
      const updatedBook = await Book.findById(rejectedBook._id);
      expect(updatedBook.approvalStatus).toBe('rejected');
    });
  });

  describe('Reports', () => {
    it('should get transaction reports', async () => {
      const response = await request(app)
        .get('/api/admin/reports/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('type');
        expect(response.body[0]).toHaveProperty('amount');
        expect(response.body[0]).toHaveProperty('user');
      }
    });

    it('should get wallet reports', async () => {
      const response = await request(app)
        .get('/api/admin/reports/wallets')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('balance');
        expect(response.body[0]).toHaveProperty('user');
        expect(response.body[0]).toHaveProperty('analytics');
      }
    });

    it('should get overdue reports', async () => {
      const response = await request(app)
        .get('/api/admin/reports/overdue')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get fine reports', async () => {
      const response = await request(app)
        .get('/api/admin/reports/fines')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Configuration Management', () => {
    it('should get fine configuration', async () => {
      const response = await request(app)
        .get('/api/admin/config/fines')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('overdue_fine_per_day');
      expect(response.body).toHaveProperty('grace_period_days');
      expect(response.body).toHaveProperty('damage_fine_percentage');
      expect(response.body).toHaveProperty('lost_book_multiplier');
    });

    it('should update fine configuration', async () => {
      const newConfig = {
        overdue_fine_per_day: 2.0,
        grace_period_days: 5,
        damage_fine_percentage: 75,
        lost_book_multiplier: 3,
      };

      const response = await request(app)
        .put('/api/admin/config/fines')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newConfig)
        .expect(200);

      expect(response.body.message).toBe('Fine configuration updated successfully');

      // Verify configuration was updated
      const updatedConfig = await SystemConfig.findOne({ category: 'fines' });
      expect(updatedConfig.settings.overdue_fine_per_day).toBe(2.0);
      expect(updatedConfig.settings.grace_period_days).toBe(5);
    });

    it('should get rental configuration', async () => {
      // Create rental config if it doesn't exist
      await SystemConfig.findOneAndUpdate(
        { category: 'rental' },
        {
          category: 'rental',
          settings: {
            max_rental_period_days: 14,
            max_renewals: 2,
            renewal_period_days: 7,
            max_concurrent_rentals: 3,
          },
        },
        { upsert: true }
      );

      const response = await request(app)
        .get('/api/admin/config/rental')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('max_rental_period_days');
      expect(response.body).toHaveProperty('max_renewals');
    });

    it('should get wallet configuration', async () => {
      // Create wallet config if it doesn't exist
      await SystemConfig.findOneAndUpdate(
        { category: 'wallet' },
        {
          category: 'wallet',
          settings: {
            min_balance_warning: 10,
            max_balance_limit: 1000,
            auto_reload_enabled: false,
            auto_reload_amount: 50,
          },
        },
        { upsert: true }
      );

      const response = await request(app)
        .get('/api/admin/config/wallet')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('min_balance_warning');
      expect(response.body).toHaveProperty('max_balance_limit');
    });
  });

  describe('Activity Logs', () => {
    it('should get activity logs', async () => {
      const response = await request(app)
        .get('/api/admin/reports/activity-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Authorization', () => {
    let memberToken;

    beforeAll(async () => {
      // Create member user token
      memberToken = jwt.sign(
        { userId: testUser._id, role: 'member' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
    });

    it('should deny access to non-admin users', async () => {
      await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);
    });

    it('should deny access without token', async () => {
      await request(app)
        .get('/api/admin/dashboard/stats')
        .expect(401);
    });

    it('should deny access with invalid token', async () => {
      await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});

module.exports = {
  // Export test helpers if needed
  createTestAdmin: async () => {
    return await User.create({
      fullName: 'Test Admin',
      email: `admin${Date.now()}@test.com`,
      password: 'password123',
      phoneNumber: `+123456789${Math.floor(Math.random() * 100)}`,
      communityName: 'Test Community',
      role: 'admin',
      isApproved: true,
      isEmailVerified: true,
      isPhoneVerified: true,
    });
  },

  createTestUser: async () => {
    return await User.create({
      fullName: 'Test User',
      email: `user${Date.now()}@test.com`,
      password: 'password123',
      phoneNumber: `+123456789${Math.floor(Math.random() * 100)}`,
      communityName: 'Test Community',
      role: 'member',
      isApproved: false,
      isEmailVerified: true,
      isPhoneVerified: true,
    });
  },

  createTestBook: async (publisherId) => {
    return await Book.create({
      title: `Test Book ${Date.now()}`,
      author: 'Test Author',
      isbn: `123456789012${Math.floor(Math.random() * 10)}`,
      genre: 'Fiction',
      description: 'A test book',
      condition: 'good',
      publisher: publisherId,
      approvalStatus: 'pending',
    });
  },

  generateAdminToken: (adminId) => {
    return jwt.sign(
      { userId: adminId, role: 'admin' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  },

  generateMemberToken: (userId) => {
    return jwt.sign(
      { userId: userId, role: 'member' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  },
};
