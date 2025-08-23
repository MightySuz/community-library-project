const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  isbn: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  barcode: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  publisher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  genre: {
    type: String,
    required: true,
    enum: [
      'Fiction',
      'Non-Fiction',
      'Science',
      'Technology',
      'History',
      'Biography',
      'Children',
      'Educational',
      'Religious',
      'Self-Help',
      'Mystery',
      'Romance',
      'Fantasy',
      'Other'
    ]
  },
  description: {
    type: String,
    trim: true
  },
  condition: {
    type: String,
    required: true,
    enum: ['Excellent', 'Good', 'Fair', 'Poor'],
    default: 'Good'
  },
  language: {
    type: String,
    required: true,
    default: 'English'
  },
  publicationYear: {
    type: Number,
    min: 1000,
    max: new Date().getFullYear() + 1
  },
  images: [{
    url: String,
    caption: String
  }],
  availability: {
    status: {
      type: String,
      enum: ['available', 'borrowed', 'reserved', 'maintenance'],
      default: 'available'
    },
    currentBorrower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    borrowedDate: Date,
    dueDate: Date,
    returnDate: Date
  },
  rental: {
    pricePerDay: {
      type: Number,
      required: true,
      min: 0,
      default: 1
    },
    maxRentalDays: {
      type: Number,
      required: true,
      min: 1,
      max: 90,
      default: 14
    },
    securityDeposit: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  location: {
    community: {
      type: String,
      required: true
    },
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String,
  isActive: {
    type: Boolean,
    default: true
  },
  totalRentals: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  tags: [String],
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
bookSchema.index({ title: 'text', author: 'text', description: 'text' });
bookSchema.index({ genre: 1, 'availability.status': 1 });
bookSchema.index({ publisher: 1, approvalStatus: 1 });
bookSchema.index({ 'location.community': 1, 'availability.status': 1 });
bookSchema.index({ barcode: 1 });
bookSchema.index({ isbn: 1 });

// Virtual for book URL
bookSchema.virtual('url').get(function() {
  return `/books/${this._id}`;
});

// Pre-save middleware
bookSchema.pre('save', function(next) {
  if (this.isModified('approvalStatus') && this.approvalStatus === 'approved') {
    this.approvedAt = new Date();
  }
  next();
});

// Static methods
bookSchema.statics.getBookStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalBooks: { $sum: 1 },
        availableBooks: {
          $sum: {
            $cond: [{ $eq: ['$availability.status', 'available'] }, 1, 0]
          }
        },
        borrowedBooks: {
          $sum: {
            $cond: [{ $eq: ['$availability.status', 'borrowed'] }, 1, 0]
          }
        },
        pendingApproval: {
          $sum: {
            $cond: [{ $eq: ['$approvalStatus', 'pending'] }, 1, 0]
          }
        }
      }
    }
  ]);
};

bookSchema.statics.getGenreDistribution = function() {
  return this.aggregate([
    { $match: { approvalStatus: 'approved', isActive: true } },
    {
      $group: {
        _id: '$genre',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

module.exports = mongoose.model('Book', bookSchema);
