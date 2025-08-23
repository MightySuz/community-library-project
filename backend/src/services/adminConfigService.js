const User = require('../models/User');
const Book = require('../models/Book');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const SystemConfig = require('../models/SystemConfig');

class AdminConfigService {
  // System Configuration Management
  async getSystemConfigurations(category = null) {
    const query = category ? { category } : {};
    
    const configs = await SystemConfig.find(query)
      .populate('lastModifiedBy', 'fullName')
      .sort({ category: 1, key: 1 });
    
    return configs;
  }

  async updateSystemConfiguration(category, key, value, adminId) {
    const config = await SystemConfig.findOne({ category, key });
    
    if (!config) {
      throw new Error('Configuration not found');
    }
    
    if (!config.isEditable) {
      throw new Error('This configuration is not editable');
    }
    
    // Validate value based on data type and rules
    this.validateConfigValue(config, value);
    
    config.value = value;
    config.lastModifiedBy = adminId;
    
    await config.save();
    
    return config;
  }

  validateConfigValue(config, value) {
    const { dataType, validationRules } = config;
    
    // Type validation
    switch (dataType) {
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          throw new Error('Value must be a valid number');
        }
        if (validationRules.min !== undefined && value < validationRules.min) {
          throw new Error(`Value must be at least ${validationRules.min}`);
        }
        if (validationRules.max !== undefined && value > validationRules.max) {
          throw new Error(`Value must be at most ${validationRules.max}`);
        }
        break;
        
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error('Value must be true or false');
        }
        break;
        
      case 'string':
        if (typeof value !== 'string') {
          throw new Error('Value must be a string');
        }
        if (validationRules.options && !validationRules.options.includes(value)) {
          throw new Error(`Value must be one of: ${validationRules.options.join(', ')}`);
        }
        if (validationRules.pattern) {
          const regex = new RegExp(validationRules.pattern);
          if (!regex.test(value)) {
            throw new Error('Value does not match required pattern');
          }
        }
        break;
        
      case 'array':
        if (!Array.isArray(value)) {
          throw new Error('Value must be an array');
        }
        break;
    }
  }

  async getFineConfiguration() {
    return await SystemConfig.getByCategory('fines');
  }

  async updateFineConfiguration(updates, adminId) {
    const results = [];
    
    for (const [key, value] of Object.entries(updates)) {
      try {
        const config = await this.updateSystemConfiguration('fines', key, value, adminId);
        results.push({ key, success: true, config });
      } catch (error) {
        results.push({ key, success: false, error: error.message });
      }
    }
    
    return results;
  }

  // Book Management Methods
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

  // Reporting Methods
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

  // Activity and Audit Logs
  async getActivityLogs(filters = {}, page = 1, limit = 20) {
    const activities = [];
    
    // Recent user approvals
    const recentUserApprovals = await User.find({
      approvalStatus: { $in: ['approved', 'rejected'] },
      $or: [
        { approvedAt: { $exists: true } },
        { rejectedAt: { $exists: true } }
      ]
    })
    .populate('approvedBy', 'fullName')
    .sort({ updatedAt: -1 })
    .limit(10)
    .select('fullName email approvalStatus approvedBy approvedAt rejectedAt');
    
    recentUserApprovals.forEach(user => {
      activities.push({
        type: 'user_approval',
        action: user.approvalStatus,
        target: `User: ${user.fullName}`,
        targetId: user._id,
        performedBy: user.approvedBy,
        timestamp: user.approvedAt || user.rejectedAt,
        details: { email: user.email }
      });
    });
    
    // Recent book approvals
    const recentBookApprovals = await Book.find({
      approvalStatus: { $in: ['approved', 'rejected'] },
      approvedAt: { $exists: true }
    })
    .populate('approvedBy', 'fullName')
    .populate('publisher', 'fullName')
    .sort({ approvedAt: -1 })
    .limit(10)
    .select('title author approvalStatus approvedBy approvedAt publisher');
    
    recentBookApprovals.forEach(book => {
      activities.push({
        type: 'book_approval',
        action: book.approvalStatus,
        target: `Book: ${book.title}`,
        targetId: book._id,
        performedBy: book.approvedBy,
        timestamp: book.approvedAt,
        details: { author: book.author, publisher: book.publisher?.fullName }
      });
    });
    
    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    const skip = (page - 1) * limit;
    const paginatedActivities = activities.slice(skip, skip + limit);
    
    return {
      activities: paginatedActivities,
      totalCount: activities.length,
      page,
      limit,
      totalPages: Math.ceil(activities.length / limit),
      hasNextPage: page < Math.ceil(activities.length / limit),
      hasPrevPage: page > 1
    };
  }
}

module.exports = new AdminConfigService();
