const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
    required: true
  },
  type: {
    type: String,
    enum: ['rental', 'deposit', 'fine', 'refund', 'topup', 'withdrawal'],
    required: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: function() {
      return ['rental', 'deposit', 'fine', 'refund'].includes(this.type);
    }
  },
  borrower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  publisher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return ['rental', 'deposit', 'fine', 'refund'].includes(this.type);
    }
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  rental: {
    startDate: Date,
    endDate: Date,
    actualReturnDate: Date,
    daysRented: Number,
    isOverdue: {
      type: Boolean,
      default: false
    },
    overdueBy: {
      type: Number,
      default: 0
    }
  },
  fine: {
    reason: {
      type: String,
      enum: ['overdue', 'damage', 'lost', 'other']
    },
    daysOverdue: Number,
    finePerDay: Number,
    additionalCharges: Number
  },
  payment: {
    method: {
      type: String,
      enum: ['wallet', 'card', 'cash', 'bank_transfer'],
      default: 'wallet'
    },
    gateway: String,
    gatewayTransactionId: String,
    gatewayResponse: mongoose.Schema.Types.Mixed
  },
  metadata: {
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    refundReason: String
  }
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ borrower: 1, createdAt: -1 });
transactionSchema.index({ publisher: 1, createdAt: -1 });
transactionSchema.index({ book: 1, type: 1 });
transactionSchema.index({ status: 1, type: 1 });
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ 'rental.endDate': 1, status: 1 });

// Pre-save middleware to generate transaction ID
transactionSchema.pre('save', function(next) {
  if (!this.transactionId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.transactionId = `TXN${timestamp}${random}`.toUpperCase();
  }
  next();
});

// Static methods for reporting
transactionSchema.statics.getRevenueStats = function(startDate, endDate) {
  const matchCondition = {
    status: 'completed',
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };

  return this.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    }
  ]);
};

transactionSchema.statics.getOverdueTransactions = function() {
  return this.aggregate([
    {
      $match: {
        type: 'rental',
        status: { $in: ['pending', 'completed'] },
        'rental.endDate': { $lt: new Date() },
        'rental.actualReturnDate': { $exists: false }
      }
    },
    {
      $lookup: {
        from: 'books',
        localField: 'book',
        foreignField: '_id',
        as: 'bookDetails'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'borrower',
        foreignField: '_id',
        as: 'borrowerDetails'
      }
    },
    {
      $addFields: {
        daysOverdue: {
          $divide: [
            { $subtract: [new Date(), '$rental.endDate'] },
            1000 * 60 * 60 * 24
          ]
        }
      }
    },
    {
      $match: {
        daysOverdue: { $gte: 1 }
      }
    }
  ]);
};

transactionSchema.statics.getUserTransactionSummary = function(userId) {
  return this.aggregate([
    { $match: { borrower: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('Transaction', transactionSchema);
