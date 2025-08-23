const mongoose = require('mongoose');

const bookRequestSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  borrower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  publisher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  requestedStartDate: {
    type: Date,
    required: true
  },
  requestedEndDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  publisherResponse: {
    responseDate: {
      type: Date
    },
    message: {
      type: String,
      maxlength: 500
    }
  },
  // Actual rental details when approved
  rental: {
    actualStartDate: {
      type: Date
    },
    actualEndDate: {
      type: Date
    },
    returnDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['active', 'returned', 'overdue', 'extended'],
      default: 'active'
    },
    extensions: [{
      extendedDate: {
        type: Date
      },
      newEndDate: {
        type: Date
      },
      reason: {
        type: String
      }
    }],
    fines: [{
      type: {
        type: String,
        enum: ['overdue', 'damage', 'lost']
      },
      amount: {
        type: Number
      },
      description: {
        type: String
      },
      paidDate: {
        type: Date
      },
      status: {
        type: String,
        enum: ['pending', 'paid', 'waived'],
        default: 'pending'
      }
    }]
  },
  metadata: {
    deviceInfo: {
      type: String
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
bookRequestSchema.index({ book: 1, status: 1 });
bookRequestSchema.index({ borrower: 1, status: 1 });
bookRequestSchema.index({ publisher: 1, status: 1 });
bookRequestSchema.index({ 'rental.status': 1 });
bookRequestSchema.index({ requestDate: -1 });

// Virtual for rental duration
bookRequestSchema.virtual('rentalDuration').get(function() {
  if (this.requestedStartDate && this.requestedEndDate) {
    return Math.ceil((this.requestedEndDate - this.requestedStartDate) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for days overdue
bookRequestSchema.virtual('daysOverdue').get(function() {
  if (this.rental?.status === 'overdue' && this.rental?.actualEndDate) {
    const now = new Date();
    return Math.ceil((now - this.rental.actualEndDate) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for total fines
bookRequestSchema.virtual('totalFines').get(function() {
  if (this.rental?.fines) {
    return this.rental.fines.reduce((total, fine) => {
      return fine.status === 'pending' ? total + fine.amount : total;
    }, 0);
  }
  return 0;
});

// Static methods for publisher analytics
bookRequestSchema.statics.getPublisherStats = async function(publisherId) {
  const stats = await this.aggregate([
    { $match: { publisher: mongoose.Types.ObjectId(publisherId) } },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        pendingRequests: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        approvedRequests: {
          $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
        },
        rejectedRequests: {
          $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
        },
        activeRentals: {
          $sum: { $cond: [{ $eq: ['$rental.status', 'active'] }, 1, 0] }
        },
        overdueRentals: {
          $sum: { $cond: [{ $eq: ['$rental.status', 'overdue'] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    activeRentals: 0,
    overdueRentals: 0
  };
};

// Static method for rental history
bookRequestSchema.statics.getRentalHistory = async function(publisherId, filters = {}) {
  const match = { 
    publisher: mongoose.Types.ObjectId(publisherId),
    status: 'approved'
  };

  if (filters.bookId) {
    match.book = mongoose.Types.ObjectId(filters.bookId);
  }

  if (filters.status) {
    match['rental.status'] = filters.status;
  }

  if (filters.startDate && filters.endDate) {
    match.requestDate = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }

  return await this.find(match)
    .populate('book', 'title author isbn genre')
    .populate('borrower', 'fullName email communityName')
    .sort({ requestDate: -1 });
};

// Middleware to update book availability
bookRequestSchema.pre('save', async function(next) {
  if (this.isModified('status') || this.isModified('rental.status')) {
    const Book = mongoose.model('Book');
    
    if (this.status === 'approved' && this.rental?.status === 'active') {
      // Book is now rented
      await Book.findByIdAndUpdate(this.book, {
        'availability.status': 'borrowed',
        'availability.borrowedBy': this.borrower,
        'availability.borrowedDate': this.rental.actualStartDate,
        'availability.expectedReturnDate': this.rental.actualEndDate
      });
    } else if (this.rental?.status === 'returned') {
      // Book is returned
      await Book.findByIdAndUpdate(this.book, {
        'availability.status': 'available',
        $unset: {
          'availability.borrowedBy': 1,
          'availability.borrowedDate': 1,
          'availability.expectedReturnDate': 1
        }
      });
    }
  }
  next();
});

bookRequestSchema.set('toJSON', { virtuals: true });
bookRequestSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('BookRequest', bookRequestSchema);
