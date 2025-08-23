const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['active', 'frozen', 'suspended'],
    default: 'active'
  },
  limits: {
    dailySpendLimit: {
      type: Number,
      default: 100
    },
    monthlySpendLimit: {
      type: Number,
      default: 1000
    },
    maxBalance: {
      type: Number,
      default: 5000
    }
  },
  security: {
    pin: String,
    lastPinChange: Date,
    failedAttempts: {
      type: Number,
      default: 0
    },
    lockedUntil: Date
  },
  analytics: {
    totalDeposited: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    totalFines: {
      type: Number,
      default: 0
    },
    transactionCount: {
      type: Number,
      default: 0
    },
    lastTransactionDate: Date
  }
}, {
  timestamps: true
});

// Indexes
walletSchema.index({ user: 1 });
walletSchema.index({ status: 1 });

// Virtual for available balance considering pending transactions
walletSchema.virtual('availableBalance').get(function() {
  // This would need to calculate pending transactions
  return this.balance;
});

// Instance methods
walletSchema.methods.canSpend = function(amount) {
  return this.status === 'active' && this.balance >= amount;
};

walletSchema.methods.addFunds = function(amount) {
  if (amount <= 0) throw new Error('Amount must be positive');
  if (this.balance + amount > this.limits.maxBalance) {
    throw new Error('Would exceed maximum balance limit');
  }
  
  this.balance += amount;
  this.analytics.totalDeposited += amount;
  this.analytics.transactionCount += 1;
  this.analytics.lastTransactionDate = new Date();
  
  return this.save();
};

walletSchema.methods.deductFunds = function(amount) {
  if (amount <= 0) throw new Error('Amount must be positive');
  if (!this.canSpend(amount)) {
    throw new Error('Insufficient balance or wallet not active');
  }
  
  this.balance -= amount;
  this.analytics.totalSpent += amount;
  this.analytics.transactionCount += 1;
  this.analytics.lastTransactionDate = new Date();
  
  return this.save();
};

walletSchema.methods.addFine = function(amount) {
  if (amount <= 0) throw new Error('Fine amount must be positive');
  
  this.analytics.totalFines += amount;
  // Note: Fines might create negative balance, handled by business logic
  
  return this.save();
};

// Static methods
walletSchema.statics.getWalletStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalWallets: { $sum: 1 },
        activeWallets: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        totalBalance: { $sum: '$balance' },
        avgBalance: { $avg: '$balance' },
        totalDeposited: { $sum: '$analytics.totalDeposited' },
        totalSpent: { $sum: '$analytics.totalSpent' },
        totalFines: { $sum: '$analytics.totalFines' }
      }
    }
  ]);
};

walletSchema.statics.getLowBalanceUsers = function(threshold = 10) {
  return this.find({
    balance: { $lt: threshold },
    status: 'active'
  }).populate('user', 'fullName email phoneNumber');
};

module.exports = mongoose.model('Wallet', walletSchema);
