const User = require('../models/User');
const Book = require('../models/Book');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const SystemConfig = require('../models/SystemConfig');
const emailService = require('./emailService');
const smsService = require('./smsService');

class AdminService {
  // Dashboard statistics
  async getDashboardStats() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const [userStats, bookStats, walletStats, transactionStats] = await Promise.all([
        this.getUserStats(today),
        this.getBookStats(),
        this.getWalletStats(),
        this.getTransactionStats(today)
      ]);

      return {
        users: userStats,
        books: bookStats,
        wallets: walletStats,
        transactions: transactionStats,
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard stats: ${error.message}`);
    }
  }

  async getUserStats(today) {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          pendingUsers: {
            $sum: {
              $cond: [{ $eq: ['$approvalStatus', 'pending'] }, 1, 0]
            }
          },
          approvedUsers: {
            $sum: {
              $cond: [{ $eq: ['$approvalStatus', 'approved'] }, 1, 0]
            }
          },
          rejectedUsers: {
            $sum: {
              $cond: [{ $eq: ['$approvalStatus', 'rejected'] }, 1, 0]
            }
          },
          blockedUsers: {
            $sum: {
              $cond: [{ $eq: ['$isBlocked', true] }, 1, 0]
            }
          },
          todayRegistrations: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', today] }, 1, 0]
            }
          },
          publisherCount: {
            $sum: {
              $cond: [{ $in: ['publisher', '$persona'] }, 1, 0]
            }
          },
          borrowerCount: {
            $sum: {
              $cond: [{ $in: ['borrower', '$persona'] }, 1, 0]
            }
          }
        }
      }
    ]);

    return stats[0] || {
      totalUsers: 0,
      pendingUsers: 0,
      approvedUsers: 0,
      rejectedUsers: 0,
      blockedUsers: 0,
      todayRegistrations: 0,
      publisherCount: 0,
      borrowerCount: 0
    };
  }

  async getBookStats() {
    const stats = await Book.getBookStats();
    const genreDistribution = await Book.getGenreDistribution();
    
    return {
      ...stats[0],
      genreDistribution
    };
  }

  async getWalletStats() {
    const stats = await Wallet.getWalletStats();
    const lowBalanceUsers = await Wallet.getLowBalanceUsers();
    
    return {
      ...stats[0],
      lowBalanceCount: lowBalanceUsers.length
    };
  }

  async getTransactionStats(today) {
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const [revenueStats, overdueTransactions] = await Promise.all([
      Transaction.getRevenueStats(thirtyDaysAgo, new Date()),
      Transaction.getOverdueTransactions()
    ]);

    const totalRevenue = revenueStats.reduce((sum, stat) => sum + stat.totalAmount, 0);
    const totalTransactions = revenueStats.reduce((sum, stat) => sum + stat.count, 0);

    return {
      totalRevenue,
      totalTransactions,
      overdueCount: overdueTransactions.length,
      revenueByType: revenueStats
    };
  }

  // Book Management
  async getPendingBooks(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const books = await Book.find({ approvalStatus: 'pending' })
      .populate('publisher', 'fullName email communityName')
      .populate('metadata.createdBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalCount = await Book.countDocuments({ approvalStatus: 'pending' });
    
    return {
      books,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPrevPage: page > 1
    };
  }

  async getAllBooks(filters = {}, page = 1, limit = 20) {
    const { approvalStatus, genre, availability, publisher, search } = filters;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    
    if (approvalStatus) {
      query.approvalStatus = approvalStatus;
    }
    
    if (genre) {
      query.genre = genre;
    }
    
    if (availability) {
      query['availability.status'] = availability;
    }
    
    if (publisher) {
      query.publisher = publisher;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }
    
    const books = await Book.find(query)
      .populate('publisher', 'fullName email communityName')
      .populate('availability.currentBorrower', 'fullName email')
      .populate('approvedBy', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalCount = await Book.countDocuments(query);
    
    return {
      books,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPrevPage: page > 1
    };
  }

  async approveBook(bookId, adminId) {
    const book = await Book.findById(bookId);
    
    if (!book) {
      throw new Error('Book not found');
    }
    
    if (book.approvalStatus !== 'pending') {
      throw new Error('Book is not pending approval');
    }
    
    book.approvalStatus = 'approved';
    book.approvedBy = adminId;
    book.approvedAt = new Date();
    
    await book.save();
    
    // Notify publisher
    const publisher = await User.findById(book.publisher);
    if (publisher) {
      await emailService.sendBookApprovalNotification(publisher, book, 'approved');
      if (publisher.phoneNumber) {
        await smsService.sendBookApprovalNotification(publisher, book, 'approved');
      }
    }
    
    return book;
  }

  async rejectBook(bookId, adminId, reason) {
    const book = await Book.findById(bookId);
    
    if (!book) {
      throw new Error('Book not found');
    }
    
    if (book.approvalStatus !== 'pending') {
      throw new Error('Book is not pending approval');
    }
    
    book.approvalStatus = 'rejected';
    book.approvedBy = adminId;
    book.rejectionReason = reason;
    
    await book.save();
    
    // Notify publisher
    const publisher = await User.findById(book.publisher);
    if (publisher) {
      await emailService.sendBookApprovalNotification(publisher, book, 'rejected', reason);
      if (publisher.phoneNumber) {
        await smsService.sendBookApprovalNotification(publisher, book, 'rejected', reason);
      }
    }
    
    return book;
  }

  async deactivateBook(bookId, adminId, reason) {
    const book = await Book.findById(bookId);
    
    if (!book) {
      throw new Error('Book not found');
    }
    
    book.isActive = false;
    book.metadata.updatedBy = adminId;
    
    await book.save();
    
    // If book is currently borrowed, handle the rental
    if (book.availability.status === 'borrowed') {
      // Create notification for current borrower
      const borrower = await User.findById(book.availability.currentBorrower);
      if (borrower) {
        await emailService.sendBookDeactivationNotification(borrower, book, reason);
      }
    }
    
    return book;
  }

  // Transaction and Rental Reports
  async getRentalTransactions(filters = {}, page = 1, limit = 20) {
    const { status, overdue, dateFrom, dateTo, borrower, publisher } = filters;
    const skip = (page - 1) * limit;
    
    const query = { type: 'rental' };
    
    if (status) {
      query.status = status;
    }
    
    if (overdue === 'true') {
      query['rental.isOverdue'] = true;
    }
    
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    
    if (borrower) {
      query.borrower = borrower;
    }
    
    if (publisher) {
      query.publisher = publisher;
    }
    
    const transactions = await Transaction.find(query)
      .populate('book', 'title author isbn')
      .populate('borrower', 'fullName email phoneNumber')
      .populate('publisher', 'fullName email communityName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalCount = await Transaction.countDocuments(query);
    
    return {
      transactions,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPrevPage: page > 1
    };
  }

  async getOverdueBooks() {
    const overdueTransactions = await Transaction.getOverdueTransactions();
    
    return overdueTransactions.map(transaction => ({
      ...transaction,
      book: transaction.bookDetails[0],
      borrower: transaction.borrowerDetails[0],
      daysOverdue: Math.floor(transaction.daysOverdue)
    }));
  }

  async getWalletReport(filters = {}, page = 1, limit = 20) {
    const { minBalance, maxBalance, status, lowBalance } = filters;
    const skip = (page - 1) * limit;
    
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (minBalance !== undefined) {
      query.balance = { ...query.balance, $gte: parseFloat(minBalance) };
    }
    
    if (maxBalance !== undefined) {
      query.balance = { ...query.balance, $lte: parseFloat(maxBalance) };
    }
    
    if (lowBalance === 'true') {
      const warningThreshold = await SystemConfig.getValue('wallet', 'min_balance_warning') || 10;
      query.balance = { $lt: warningThreshold };
    }
    
    const wallets = await Wallet.find(query)
      .populate('user', 'fullName email phoneNumber communityName')
      .sort({ balance: 1 })
      .skip(skip)
      .limit(limit);
    
    const totalCount = await Wallet.countDocuments(query);
    
    return {
      wallets,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPrevPage: page > 1
    };
  }
  // Get pending users for approval
  async getPendingUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const users = await User.find({ approvalStatus: 'pending' })
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalCount = await User.countDocuments({ approvalStatus: 'pending' });
    
    return {
      users,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPrevPage: page > 1
    };
  }
  
  // Get all users with filters
  async getAllUsers(filters = {}, page = 1, limit = 20) {
    const { approvalStatus, persona, isActive, search } = filters;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    
    if (approvalStatus) {
      query.approvalStatus = approvalStatus;
    }
    
    if (persona) {
      query.persona = { $in: [persona] };
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive;
    }
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { communityName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .select('-password -refreshToken')
      .populate('approvedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalCount = await User.countDocuments(query);
    
    return {
      users,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPrevPage: page > 1
    };
  }
  
  // Approve user
  async approveUser(userId, adminId) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.approvalStatus !== 'pending') {
      throw new Error('User is not pending approval');
    }
    
    // Update user status
    user.approvalStatus = 'approved';
    user.approvedBy = adminId;
    user.approvedAt = new Date();
    user.rejectionReason = undefined; // Clear any previous rejection reason
    
    await user.save();
    
    // Send welcome notifications
    try {
      await Promise.all([
        emailService.sendWelcomeEmail(user.email, user.fullName),
        smsService.sendWelcomeSMS(user.phoneNumber, user.fullName)
      ]);
    } catch (error) {
      console.error('Error sending welcome notifications:', error);
    }
    
    return {
      message: 'User approved successfully',
      user: user.toJSON()
    };
  }
  
  // Reject user
  async rejectUser(userId, adminId, reason) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.approvalStatus !== 'pending') {
      throw new Error('User is not pending approval');
    }
    
    // Update user status
    user.approvalStatus = 'rejected';
    user.approvedBy = adminId;
    user.approvedAt = new Date();
    user.rejectionReason = reason;
    
    await user.save();
    
    // Send rejection notification
    try {
      await emailService.sendRejectionEmail(user.email, user.fullName, reason);
    } catch (error) {
      console.error('Error sending rejection email:', error);
    }
    
    return {
      message: 'User rejected successfully',
      user: user.toJSON()
    };
  }
  
  // Block/Unblock user
  async toggleUserBlock(userId, adminId, isBlocked, reason) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    user.isBlocked = isBlocked;
    
    if (isBlocked) {
      // If blocking, clear refresh token to force logout
      user.refreshToken = undefined;
    }
    
    await user.save();
    
    // Send notification
    const action = isBlocked ? 'blocked' : 'unblocked';
    const message = `Your account has been ${action}${reason ? `. Reason: ${reason}` : ''}`;
    
    try {
      await smsService.sendNotificationSMS(user.phoneNumber, message);
    } catch (error) {
      console.error('Error sending block notification:', error);
    }
    
    return {
      message: `User ${action} successfully`,
      user: user.toJSON()
    };
  }
  
  // Get user details
  async getUserDetails(userId) {
    const user = await User.findById(userId)
      .select('-password -refreshToken')
      .populate('approvedBy', 'fullName email');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }
  
  // Get dashboard statistics
  async getDashboardStats() {
    const [
      totalUsers,
      pendingUsers,
      approvedUsers,
      rejectedUsers,
      blockedUsers,
      todayRegistrations
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ approvalStatus: 'pending' }),
      User.countDocuments({ approvalStatus: 'approved' }),
      User.countDocuments({ approvalStatus: 'rejected' }),
      User.countDocuments({ isBlocked: true }),
      User.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      })
    ]);
    
    // Get user distribution by persona
    const personaStats = await User.aggregate([
      { $match: { approvalStatus: 'approved' } },
      { $unwind: '$persona' },
      { $group: { _id: '$persona', count: { $sum: 1 } } }
    ]);
    
    // Get recent registrations
    const recentRegistrations = await User.find()
      .select('fullName email createdAt approvalStatus')
      .sort({ createdAt: -1 })
      .limit(5);
    
    return {
      totalUsers,
      pendingUsers,
      approvedUsers,
      rejectedUsers,
      blockedUsers,
      todayRegistrations,
      personaStats: personaStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentRegistrations
    };
  }
}

module.exports = new AdminService();
