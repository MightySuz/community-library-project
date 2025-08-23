const mongoose = require('mongoose');
const Book = require('../models/Book');
const BookRequest = require('../models/BookRequest');
const User = require('../models/User');

class RentalService {
  // Get admin-defined fine rate (can be moved to admin settings later)
  getLateFeeRate() {
    return process.env.LATE_FEE_PER_DAY || 0.50; // $0.50 per day default
  }

  // Calculate rental cost based on days
  calculateRentalCost(pricePerDay, days) {
    return parseFloat((pricePerDay * days).toFixed(2));
  }

  // Calculate late fees
  calculateLateFees(dueDate, returnDate = new Date()) {
    const due = new Date(dueDate);
    const returned = new Date(returnDate);
    
    if (returned <= due) {
      return 0; // No late fee if returned on time
    }

    const daysLate = Math.ceil((returned - due) / (1000 * 60 * 60 * 24));
    const lateFeeRate = this.getLateFeeRate();
    
    return parseFloat((daysLate * lateFeeRate).toFixed(2));
  }

  // Checkout book (convert approved request to active rental)
  async checkoutBook(requestId, userId) {
    try {
      const request = await BookRequest.findOne({
        _id: requestId,
        publisher: userId,
        status: 'approved'
      }).populate(['book', 'borrower']);

      if (!request) {
        throw new Error('Request not found or not approved');
      }

      const book = request.book;
      const borrower = request.borrower;

      // Calculate rental period and cost
      const startDate = new Date();
      const endDate = new Date(request.requestedEndDate);
      const rentalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const totalCost = this.calculateRentalCost(book.rental.pricePerDay, rentalDays);

      // Verify borrower has sufficient balance
      if (borrower.wallet.balance < totalCost) {
        throw new Error('Borrower has insufficient wallet balance');
      }

      // Debit borrower's wallet
      await User.findByIdAndUpdate(borrower._id, {
        $inc: { 'wallet.balance': -totalCost },
        $push: {
          'wallet.transactions': {
            type: 'debit',
            amount: totalCost,
            description: `Rental: ${book.title}`,
            relatedRequest: requestId,
            status: 'completed',
            date: new Date()
          }
        }
      });

      // Credit publisher's earnings (if publisher has wallet)
      const publisherShare = totalCost * 0.9; // 90% to publisher, 10% platform fee
      await User.findByIdAndUpdate(userId, {
        $inc: { 'wallet.balance': publisherShare },
        $push: {
          'wallet.transactions': {
            type: 'credit',
            amount: publisherShare,
            description: `Rental earnings: ${book.title}`,
            relatedRequest: requestId,
            status: 'completed',
            date: new Date()
          }
        }
      });

      // Update request with rental details
      const updatedRequest = await BookRequest.findByIdAndUpdate(
        requestId,
        {
          'rental.status': 'active',
          'rental.actualStartDate': startDate,
          'rental.actualEndDate': endDate,
          'rental.checkedOutDate': startDate,
          'payment.amount': totalCost,
          'payment.status': 'completed',
          'payment.processedDate': startDate
        },
        { new: true }
      ).populate(['book', 'borrower', 'publisher']);

      // Update book availability
      await Book.findByIdAndUpdate(book._id, {
        'availability.status': 'rented',
        'availability.rentedBy': borrower._id,
        'availability.dueDate': endDate
      });

      return updatedRequest;

    } catch (error) {
      throw new Error(`Checkout failed: ${error.message}`);
    }
  }

  // Return book and calculate final charges
  async returnBook(requestId, userId, returnDate = new Date()) {
    try {
      const request = await BookRequest.findOne({
        _id: requestId,
        $or: [
          { publisher: userId },
          { borrower: userId }
        ],
        status: 'approved',
        'rental.status': 'active'
      }).populate(['book', 'borrower', 'publisher']);

      if (!request) {
        throw new Error('Active rental not found');
      }

      const book = request.book;
      const borrower = request.borrower;
      const dueDate = new Date(request.rental.actualEndDate);
      const returned = new Date(returnDate);

      // Calculate late fees if applicable
      const lateFees = this.calculateLateFees(dueDate, returned);
      let additionalCharges = 0;

      if (lateFees > 0) {
        // Check if borrower has sufficient balance for late fees
        if (borrower.wallet.balance < lateFees) {
          throw new Error(`Insufficient balance for late fees. Required: $${lateFees.toFixed(2)}, Available: $${borrower.wallet.balance.toFixed(2)}`);
        }

        // Debit late fees from borrower
        await User.findByIdAndUpdate(borrower._id, {
          $inc: { 'wallet.balance': -lateFees },
          $push: {
            'wallet.transactions': {
              type: 'debit',
              amount: lateFees,
              description: `Late fee: ${book.title}`,
              relatedRequest: requestId,
              status: 'completed',
              date: returned
            }
          }
        });

        // Credit late fees to publisher (full amount)
        await User.findByIdAndUpdate(request.publisher._id, {
          $inc: { 'wallet.balance': lateFees },
          $push: {
            'wallet.transactions': {
              type: 'credit',
              amount: lateFees,
              description: `Late fee earnings: ${book.title}`,
              relatedRequest: requestId,
              status: 'completed',
              date: returned
            }
          }
        });

        additionalCharges = lateFees;
      }

      // Update request as completed
      const updatedRequest = await BookRequest.findByIdAndUpdate(
        requestId,
        {
          'rental.status': 'completed',
          'rental.returnedDate': returned,
          'rental.lateFees': lateFees,
          'rental.totalCost': request.payment.amount + lateFees,
          status: 'completed'
        },
        { new: true }
      ).populate(['book', 'borrower', 'publisher']);

      // Update book availability
      await Book.findByIdAndUpdate(book._id, {
        'availability.status': 'available',
        $unset: {
          'availability.rentedBy': 1,
          'availability.dueDate': 1
        }
      });

      return {
        request: updatedRequest,
        rentalCost: request.payment.amount,
        lateFees,
        totalCost: request.payment.amount + lateFees,
        daysLate: lateFees > 0 ? Math.ceil((returned - dueDate) / (1000 * 60 * 60 * 24)) : 0
      };

    } catch (error) {
      throw new Error(`Return failed: ${error.message}`);
    }
  }

  // Get borrower's rental history with cost breakdown
  async getBorrowerRentalHistory(borrowerId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const [rentals, totalCount] = await Promise.all([
        BookRequest.find({
          borrower: borrowerId,
          status: { $in: ['approved', 'completed'] },
          'payment.status': 'completed'
        })
          .populate('book', 'title author genre isbn')
          .populate('publisher', 'fullName communityName')
          .sort({ 'rental.checkedOutDate': -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        BookRequest.countDocuments({
          borrower: borrowerId,
          status: { $in: ['approved', 'completed'] },
          'payment.status': 'completed'
        })
      ]);

      // Calculate detailed cost breakdown for each rental
      const enrichedRentals = rentals.map(rental => {
        const rentalObj = rental.toObject();
        
        // Calculate rental period
        if (rental.rental?.actualStartDate && rental.rental?.actualEndDate) {
          const startDate = new Date(rental.rental.actualStartDate);
          const endDate = new Date(rental.rental.actualEndDate);
          const rentalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
          
          rentalObj.costBreakdown = {
            dailyRate: rental.book?.rental?.pricePerDay || 0,
            rentalDays,
            baseCost: rental.payment?.amount || 0,
            lateFees: rental.rental?.lateFees || 0,
            totalCost: rental.rental?.totalCost || rental.payment?.amount || 0
          };

          // Calculate if returned late
          if (rental.rental?.returnedDate) {
            const returnedDate = new Date(rental.rental.returnedDate);
            const dueDate = new Date(rental.rental.actualEndDate);
            
            if (returnedDate > dueDate) {
              const daysLate = Math.ceil((returnedDate - dueDate) / (1000 * 60 * 60 * 24));
              rentalObj.costBreakdown.daysLate = daysLate;
              rentalObj.costBreakdown.returnStatus = 'late';
            } else {
              rentalObj.costBreakdown.returnStatus = 'on-time';
            }
          }
        }

        return rentalObj;
      });

      // Calculate summary statistics
      const summary = await this.getBorrowerRentalSummary(borrowerId);

      return {
        rentals: enrichedRentals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        },
        summary
      };

    } catch (error) {
      throw new Error(`Failed to get rental history: ${error.message}`);
    }
  }

  // Get borrower rental summary statistics
  async getBorrowerRentalSummary(borrowerId) {
    try {
      const [
        totalRentals,
        activeRentals,
        completedRentals,
        overdueRentals,
        totalSpent,
        totalLateFees
      ] = await Promise.all([
        BookRequest.countDocuments({
          borrower: borrowerId,
          status: { $in: ['approved', 'completed'] },
          'payment.status': 'completed'
        }),
        BookRequest.countDocuments({
          borrower: borrowerId,
          status: 'approved',
          'rental.status': 'active'
        }),
        BookRequest.countDocuments({
          borrower: borrowerId,
          status: 'completed'
        }),
        BookRequest.countDocuments({
          borrower: borrowerId,
          status: 'approved',
          'rental.status': 'active',
          'rental.actualEndDate': { $lt: new Date() }
        }),
        BookRequest.aggregate([
          {
            $match: {
              borrower: new mongoose.Types.ObjectId(borrowerId),
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
        BookRequest.aggregate([
          {
            $match: {
              borrower: new mongoose.Types.ObjectId(borrowerId),
              'rental.lateFees': { $gt: 0 }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$rental.lateFees' }
            }
          }
        ])
      ]);

      return {
        totalRentals,
        activeRentals,
        completedRentals,
        overdueRentals,
        totalSpent: totalSpent[0]?.total || 0,
        totalLateFees: totalLateFees[0]?.total || 0,
        averageRentalCost: totalRentals > 0 ? (totalSpent[0]?.total || 0) / totalRentals : 0
      };

    } catch (error) {
      throw new Error(`Failed to get rental summary: ${error.message}`);
    }
  }

  // Get publisher's earned rental fees
  async getPublisherEarnings(publisherId, page = 1, limit = 20, startDate = null, endDate = null) {
    try {
      const skip = (page - 1) * limit;
      
      // Build date filter
      const dateFilter = {};
      if (startDate) {
        dateFilter['rental.checkedOutDate'] = { $gte: new Date(startDate) };
      }
      if (endDate) {
        if (dateFilter['rental.checkedOutDate']) {
          dateFilter['rental.checkedOutDate'].$lte = new Date(endDate);
        } else {
          dateFilter['rental.checkedOutDate'] = { $lte: new Date(endDate) };
        }
      }

      const [earnings, totalCount] = await Promise.all([
        BookRequest.find({
          publisher: publisherId,
          status: { $in: ['approved', 'completed'] },
          'payment.status': 'completed',
          ...dateFilter
        })
          .populate('book', 'title author genre isbn')
          .populate('borrower', 'fullName email')
          .sort({ 'rental.checkedOutDate': -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        BookRequest.countDocuments({
          publisher: publisherId,
          status: { $in: ['approved', 'completed'] },
          'payment.status': 'completed',
          ...dateFilter
        })
      ]);

      // Calculate earnings breakdown for each rental
      const enrichedEarnings = earnings.map(rental => {
        const rentalObj = rental.toObject();
        
        const baseCost = rental.payment?.amount || 0;
        const lateFees = rental.rental?.lateFees || 0;
        const platformFee = baseCost * 0.1; // 10% platform fee
        const publisherShare = baseCost * 0.9; // 90% to publisher
        
        rentalObj.earningsBreakdown = {
          baseCost,
          lateFees,
          platformFee,
          publisherShare,
          totalEarnings: publisherShare + lateFees, // Publisher gets 90% of base + 100% of late fees
          totalPaid: baseCost + lateFees
        };

        // Calculate rental period
        if (rental.rental?.actualStartDate && rental.rental?.actualEndDate) {
          const startDate = new Date(rental.rental.actualStartDate);
          const endDate = new Date(rental.rental.actualEndDate);
          const rentalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
          rentalObj.earningsBreakdown.rentalDays = rentalDays;
        }

        return rentalObj;
      });

      // Calculate summary statistics
      const summary = await this.getPublisherEarningsSummary(publisherId, startDate, endDate);

      return {
        earnings: enrichedEarnings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        },
        summary
      };

    } catch (error) {
      throw new Error(`Failed to get publisher earnings: ${error.message}`);
    }
  }

  // Get publisher earnings summary
  async getPublisherEarningsSummary(publisherId, startDate = null, endDate = null) {
    try {
      const dateFilter = {};
      if (startDate) {
        dateFilter['rental.checkedOutDate'] = { $gte: new Date(startDate) };
      }
      if (endDate) {
        if (dateFilter['rental.checkedOutDate']) {
          dateFilter['rental.checkedOutDate'].$lte = new Date(endDate);
        } else {
          dateFilter['rental.checkedOutDate'] = { $lte: new Date(endDate) };
        }
      }

      const [
        totalRentals,
        activeRentals,
        completedRentals,
        totalRevenue,
        totalLateFees,
        platformFees
      ] = await Promise.all([
        BookRequest.countDocuments({
          publisher: publisherId,
          status: { $in: ['approved', 'completed'] },
          'payment.status': 'completed',
          ...dateFilter
        }),
        BookRequest.countDocuments({
          publisher: publisherId,
          status: 'approved',
          'rental.status': 'active'
        }),
        BookRequest.countDocuments({
          publisher: publisherId,
          status: 'completed',
          ...dateFilter
        }),
        BookRequest.aggregate([
          {
            $match: {
              publisher: new mongoose.Types.ObjectId(publisherId),
              'payment.status': 'completed',
              ...dateFilter
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$payment.amount' }
            }
          }
        ]),
        BookRequest.aggregate([
          {
            $match: {
              publisher: new mongoose.Types.ObjectId(publisherId),
              'rental.lateFees': { $gt: 0 },
              ...dateFilter
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$rental.lateFees' }
            }
          }
        ]),
        BookRequest.aggregate([
          {
            $match: {
              publisher: new mongoose.Types.ObjectId(publisherId),
              'payment.status': 'completed',
              ...dateFilter
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ['$payment.amount', 0.1] } }
            }
          }
        ])
      ]);

      const grossRevenue = (totalRevenue[0]?.total || 0) + (totalLateFees[0]?.total || 0);
      const platformFeeAmount = platformFees[0]?.total || 0;
      const netEarnings = grossRevenue - platformFeeAmount;

      return {
        totalRentals,
        activeRentals,
        completedRentals,
        grossRevenue,
        platformFees: platformFeeAmount,
        netEarnings,
        totalLateFees: totalLateFees[0]?.total || 0,
        averageRentalValue: totalRentals > 0 ? grossRevenue / totalRentals : 0
      };

    } catch (error) {
      throw new Error(`Failed to get publisher earnings summary: ${error.message}`);
    }
  }

  // Get overdue rentals for system monitoring
  async getOverdueRentals() {
    try {
      const overdueRentals = await BookRequest.find({
        status: 'approved',
        'rental.status': 'active',
        'rental.actualEndDate': { $lt: new Date() }
      })
        .populate('book', 'title author')
        .populate('borrower', 'fullName email phoneNumber')
        .populate('publisher', 'fullName email')
        .sort({ 'rental.actualEndDate': 1 });

      return overdueRentals.map(rental => {
        const dueDate = new Date(rental.rental.actualEndDate);
        const now = new Date();
        const daysOverdue = Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));
        const lateFees = this.calculateLateFees(dueDate, now);

        return {
          ...rental.toObject(),
          daysOverdue,
          accruedLateFees: lateFees
        };
      });

    } catch (error) {
      throw new Error(`Failed to get overdue rentals: ${error.message}`);
    }
  }

  // Auto-process late fees for overdue rentals
  async processLateFees() {
    try {
      const overdueRentals = await this.getOverdueRentals();
      const processedRentals = [];

      for (const rental of overdueRentals) {
        try {
          // Update rental status to overdue and calculate late fees
          const updatedRental = await BookRequest.findByIdAndUpdate(
            rental._id,
            {
              'rental.status': 'overdue',
              'rental.lateFees': rental.accruedLateFees,
              'rental.lastLateFeeUpdate': new Date()
            },
            { new: true }
          );

          processedRentals.push({
            rentalId: rental._id,
            borrowerId: rental.borrower._id,
            bookTitle: rental.book.title,
            daysOverdue: rental.daysOverdue,
            lateFees: rental.accruedLateFees,
            status: 'updated'
          });

        } catch (error) {
          processedRentals.push({
            rentalId: rental._id,
            error: error.message,
            status: 'failed'
          });
        }
      }

      return {
        processedCount: processedRentals.filter(r => r.status === 'updated').length,
        failedCount: processedRentals.filter(r => r.status === 'failed').length,
        details: processedRentals
      };

    } catch (error) {
      throw new Error(`Failed to process late fees: ${error.message}`);
    }
  }

  // Format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // Format date
  formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Calculate rental duration in days
  calculateRentalDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  }
}

module.exports = new RentalService();
