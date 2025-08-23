const mongoose = require('mongoose');
const Book = require('../models/Book');
const BookRequest = require('../models/BookRequest');
const User = require('../models/User');

class BorrowerService {
  // Search and filter books by various criteria
  async searchBooks(userId, searchParams = {}) {
    try {
      const {
        search = '',
        genre = '',
        author = '',
        publisher = '',
        minPrice = 0,
        maxPrice = Number.MAX_SAFE_INTEGER,
        availability = '',
        sortBy = 'title',
        sortOrder = 'asc',
        page = 1,
        limit = 20
      } = searchParams;

      // Get user's community to limit search scope
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Build search query
      const query = {
        approvalStatus: 'approved',
        'rental.available': true
      };

      // Community-based filtering - only show books from same community
      const publishersInCommunity = await User.find({
        communityName: user.communityName,
        role: 'publisher'
      }).select('_id');
      
      query.publisher = { $in: publishersInCommunity.map(p => p._id) };

      // Text search across title, author, description
      if (search.trim()) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { author: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { isbn: { $regex: search, $options: 'i' } }
        ];
      }

      // Filter by genre
      if (genre) {
        query.genre = { $regex: genre, $options: 'i' };
      }

      // Filter by author
      if (author) {
        query.author = { $regex: author, $options: 'i' };
      }

      // Filter by publisher name
      if (publisher) {
        const publisherUsers = await User.find({
          fullName: { $regex: publisher, $options: 'i' },
          role: 'publisher'
        });
        if (publisherUsers.length > 0) {
          query.publisher = { $in: publisherUsers.map(p => p._id) };
        }
      }

      // Price range filter
      query['rental.pricePerDay'] = {
        $gte: parseFloat(minPrice),
        $lte: parseFloat(maxPrice)
      };

      // Availability filter
      if (availability) {
        query['availability.status'] = availability;
      }

      // Sort options
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute search with pagination
      const skip = (page - 1) * limit;
      
      const [books, totalCount] = await Promise.all([
        Book.find(query)
          .populate('publisher', 'fullName email communityName')
          .sort(sortOptions)
          .skip(skip)
          .limit(parseInt(limit)),
        Book.countDocuments(query)
      ]);

      return {
        books,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        },
        filters: {
          search,
          genre,
          author,
          publisher,
          minPrice,
          maxPrice,
          availability
        }
      };

    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  // Get book details with availability and pricing
  async getBookDetails(bookId, userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const book = await Book.findById(bookId)
        .populate('publisher', 'fullName email communityName rating');

      if (!book) {
        throw new Error('Book not found');
      }

      // Check if book is in same community
      if (book.publisher.communityName !== user.communityName) {
        throw new Error('Book not available in your community');
      }

      // Get current holds and requests for this book
      const [currentHolds, activeRentals] = await Promise.all([
        BookRequest.countDocuments({
          book: bookId,
          status: 'hold',
          holdExpiry: { $gt: new Date() }
        }),
        BookRequest.countDocuments({
          book: bookId,
          status: 'approved',
          'rental.status': { $in: ['active', 'overdue'] }
        })
      ]);

      // Check if user already has this book on hold or rented
      const userExistingRequest = await BookRequest.findOne({
        book: bookId,
        borrower: userId,
        status: { $in: ['hold', 'pending', 'approved'] },
        $or: [
          { holdExpiry: { $gt: new Date() } },
          { 'rental.status': { $in: ['active', 'overdue'] } }
        ]
      });

      return {
        ...book.toObject(),
        availability: {
          ...book.availability,
          currentHolds,
          activeRentals,
          canHold: !userExistingRequest && book.availability.status === 'available',
          canRent: !userExistingRequest && book.availability.status === 'available' && currentHolds === 0
        },
        userRequest: userExistingRequest
      };

    } catch (error) {
      throw new Error(`Failed to get book details: ${error.message}`);
    }
  }

  // Place hold on a book
  async placeHold(bookId, userId, holdDays = 1) {
    try {
      const [user, book] = await Promise.all([
        User.findById(userId),
        Book.findById(bookId).populate('publisher')
      ]);

      if (!user || !book) {
        throw new Error('User or book not found');
      }

      // Verify community access
      if (book.publisher.communityName !== user.communityName) {
        throw new Error('Book not available in your community');
      }

      // Check if book is available
      if (book.availability.status !== 'available') {
        throw new Error('Book is not available for hold');
      }

      // Check if user already has a hold or rental
      const existingRequest = await BookRequest.findOne({
        book: bookId,
        borrower: userId,
        status: { $in: ['hold', 'pending', 'approved'] },
        $or: [
          { holdExpiry: { $gt: new Date() } },
          { 'rental.status': { $in: ['active', 'overdue'] } }
        ]
      });

      if (existingRequest) {
        throw new Error('You already have an active request for this book');
      }

      // Check user's wallet balance
      if (user.wallet.balance < book.rental.pricePerDay) {
        throw new Error('Insufficient wallet balance. Please add funds to your wallet.');
      }

      // Create hold request
      const holdExpiry = new Date();
      holdExpiry.setDate(holdExpiry.getDate() + holdDays);

      const holdRequest = new BookRequest({
        book: bookId,
        borrower: userId,
        publisher: book.publisher._id,
        status: 'hold',
        holdExpiry,
        requestedStartDate: new Date(),
        requestedEndDate: new Date(Date.now() + (book.rental.maxRentalDays * 24 * 60 * 60 * 1000)),
        payment: {
          estimatedAmount: book.rental.pricePerDay * book.rental.maxRentalDays,
          status: 'pending'
        }
      });

      await holdRequest.save();

      // Update book availability
      await Book.findByIdAndUpdate(bookId, {
        'availability.status': 'on-hold',
        'availability.heldBy': userId,
        'availability.holdExpiry': holdExpiry
      });

      return holdRequest.populate(['book', 'borrower', 'publisher']);

    } catch (error) {
      throw new Error(`Failed to place hold: ${error.message}`);
    }
  }

  // Convert hold to rental request
  async convertHoldToRequest(holdId, userId) {
    try {
      const hold = await BookRequest.findOne({
        _id: holdId,
        borrower: userId,
        status: 'hold',
        holdExpiry: { $gt: new Date() }
      }).populate('book');

      if (!hold) {
        throw new Error('Hold not found or expired');
      }

      const user = await User.findById(userId);
      const totalCost = hold.payment.estimatedAmount;

      // Verify wallet balance
      if (user.wallet.balance < totalCost) {
        throw new Error('Insufficient wallet balance for rental');
      }

      // Update hold to pending request
      hold.status = 'pending';
      hold.requestDate = new Date();
      await hold.save();

      return hold;

    } catch (error) {
      throw new Error(`Failed to convert hold to request: ${error.message}`);
    }
  }

  // Get user's current checkouts and holds
  async getUserRentals(userId) {
    try {
      const rentals = await BookRequest.find({
        borrower: userId,
        status: { $in: ['hold', 'pending', 'approved'] },
        $or: [
          { holdExpiry: { $gt: new Date() } },
          { 'rental.status': { $in: ['active', 'overdue'] } }
        ]
      })
        .populate('book', 'title author genre rental availability')
        .populate('publisher', 'fullName communityName')
        .sort({ createdAt: -1 });

      // Calculate due dates and fines
      const enrichedRentals = rentals.map(rental => {
        const rentalObj = rental.toObject();
        
        if (rental.rental && rental.rental.actualEndDate) {
          const now = new Date();
          const dueDate = new Date(rental.rental.actualEndDate);
          
          if (now > dueDate && rental.rental.status === 'active') {
            const daysOverdue = Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));
            rentalObj.daysOverdue = daysOverdue;
            rentalObj.lateFee = daysOverdue * 0.50; // $0.50 per day late fee
          }
        }

        return rentalObj;
      });

      return enrichedRentals;

    } catch (error) {
      throw new Error(`Failed to get user rentals: ${error.message}`);
    }
  }

  // Add funds to wallet
  async addFundsToWallet(userId, amount, paymentMethod = {}) {
    try {
      if (!amount || amount <= 0) {
        throw new Error('Invalid amount');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Simulate payment gateway integration
      const paymentResult = await this.processPayment(amount, paymentMethod);
      
      if (!paymentResult.success) {
        throw new Error('Payment failed: ' + paymentResult.error);
      }

      // Update wallet balance
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $inc: { 'wallet.balance': amount },
          $push: {
            'wallet.transactions': {
              type: 'deposit',
              amount,
              description: `Wallet top-up via ${paymentMethod.type || 'card'}`,
              transactionId: paymentResult.transactionId,
              status: 'completed',
              date: new Date()
            }
          }
        },
        { new: true }
      );

      return {
        success: true,
        newBalance: updatedUser.wallet.balance,
        transaction: updatedUser.wallet.transactions[updatedUser.wallet.transactions.length - 1]
      };

    } catch (error) {
      throw new Error(`Failed to add funds: ${error.message}`);
    }
  }

  // Simulate payment gateway processing
  async processPayment(amount, paymentMethod) {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate payment validation
    if (amount > 1000) {
      return {
        success: false,
        error: 'Amount exceeds daily limit'
      };
    }

    if (paymentMethod.cardNumber && paymentMethod.cardNumber.includes('4242')) {
      // Simulate test card success
      return {
        success: true,
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount,
        fee: amount * 0.029 // 2.9% processing fee
      };
    }

    // Default success for other payment methods
    return {
      success: true,
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      fee: 0
    };
  }

  // Cancel hold before expiry
  async cancelHold(holdId, userId) {
    try {
      const hold = await BookRequest.findOne({
        _id: holdId,
        borrower: userId,
        status: 'hold',
        holdExpiry: { $gt: new Date() }
      });

      if (!hold) {
        throw new Error('Hold not found or expired');
      }

      // Update hold status
      hold.status = 'cancelled';
      hold.cancellationDate = new Date();
      hold.cancellationReason = 'User cancelled';
      await hold.save();

      // Update book availability
      await Book.findByIdAndUpdate(hold.book, {
        'availability.status': 'available',
        $unset: {
          'availability.heldBy': 1,
          'availability.holdExpiry': 1
        }
      });

      return hold;

    } catch (error) {
      throw new Error(`Failed to cancel hold: ${error.message}`);
    }
  }

  // Get borrower dashboard statistics
  async getDashboardStats(userId) {
    try {
      const [
        activeRentals,
        holds,
        overdueBooks,
        totalSpent,
        user
      ] = await Promise.all([
        BookRequest.countDocuments({
          borrower: userId,
          status: 'approved',
          'rental.status': 'active'
        }),
        BookRequest.countDocuments({
          borrower: userId,
          status: 'hold',
          holdExpiry: { $gt: new Date() }
        }),
        BookRequest.countDocuments({
          borrower: userId,
          status: 'approved',
          'rental.status': 'overdue'
        }),
        BookRequest.aggregate([
          {
            $match: {
              borrower: new mongoose.Types.ObjectId(userId),
              'payment.status': 'completed'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$payment.amount' }
            }
          }
        ]),
        User.findById(userId)
      ]);

      return {
        activeRentals,
        holds,
        overdueBooks,
        totalSpent: totalSpent[0]?.total || 0,
        walletBalance: user?.wallet?.balance || 0,
        communityName: user?.communityName,
        memberSince: user?.createdAt
      };

    } catch (error) {
      throw new Error(`Failed to get dashboard stats: ${error.message}`);
    }
  }

  // Get available genres in user's community
  async getAvailableGenres(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const publishersInCommunity = await User.find({
        communityName: user.communityName,
        role: 'publisher'
      }).select('_id');

      const genres = await Book.distinct('genre', {
        publisher: { $in: publishersInCommunity.map(p => p._id) },
        approvalStatus: 'approved',
        'rental.available': true
      });

      return genres.sort();

    } catch (error) {
      throw new Error(`Failed to get genres: ${error.message}`);
    }
  }

  // Get available authors in user's community
  async getAvailableAuthors(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const publishersInCommunity = await User.find({
        communityName: user.communityName,
        role: 'publisher'
      }).select('_id');

      const authors = await Book.distinct('author', {
        publisher: { $in: publishersInCommunity.map(p => p._id) },
        approvalStatus: 'approved',
        'rental.available': true
      });

      return authors.sort();

    } catch (error) {
      throw new Error(`Failed to get authors: ${error.message}`);
    }
  }

  // Validate wallet balance before rental
  validateWalletBalance(walletBalance, rentalAmount) {
    if (walletBalance < rentalAmount) {
      return {
        valid: false,
        message: `Insufficient funds. You need $${(rentalAmount - walletBalance).toFixed(2)} more in your wallet.`,
        shortfall: rentalAmount - walletBalance
      };
    }
    return { valid: true };
  }

  // Calculate rental cost
  calculateRentalCost(pricePerDay, days) {
    return parseFloat((pricePerDay * days).toFixed(2));
  }

  // Format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}

module.exports = new BorrowerService();
