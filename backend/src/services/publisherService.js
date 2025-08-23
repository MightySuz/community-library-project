const Book = require('../models/Book');
const BookRequest = require('../models/BookRequest');
const User = require('../models/User');
const mongoose = require('mongoose');

class PublisherService {
  // Add book with barcode scanning
  async addBookFromBarcode(publisherId, bookData) {
    try {
      // Check if book with barcode already exists
      if (bookData.barcode) {
        const existingBook = await Book.findOne({ barcode: bookData.barcode });
        if (existingBook) {
          throw new Error('Book with this barcode already exists');
        }
      }

      // Validate publisher exists and has publisher role
      const publisher = await User.findById(publisherId);
      if (!publisher || publisher.role !== 'publisher') {
        throw new Error('Invalid publisher');
      }

      // Create new book
      const book = new Book({
        ...bookData,
        publisher: publisherId,
        approvalStatus: 'pending', // Admin approval required
        availability: {
          status: 'available',
          isActive: true
        },
        metadata: {
          addedViaBarcode: !!bookData.barcode,
          addedDate: new Date()
        }
      });

      await book.save();
      return book;
    } catch (error) {
      throw new Error(`Failed to add book: ${error.message}`);
    }
  }

  // Get book information from barcode (external API integration)
  async getBookInfoFromBarcode(barcode) {
    try {
      // In a real implementation, this would call external APIs like:
      // - Google Books API
      // - Open Library API
      // - ISBN DB API
      
      // Mock implementation for demonstration
      const mockBookData = {
        barcode: barcode,
        isbn: barcode.length === 13 ? barcode : null,
        title: 'Book Title from Barcode',
        author: 'Unknown Author',
        description: 'Book description retrieved from barcode scan',
        genre: 'Fiction',
        publishedYear: new Date().getFullYear(),
        language: 'English',
        pages: 200,
        coverImage: null
      };

      // TODO: Implement actual API calls
      // Example: Google Books API
      // const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${barcode}`);
      // const data = await response.json();
      
      return mockBookData;
    } catch (error) {
      throw new Error(`Failed to retrieve book info: ${error.message}`);
    }
  }

  // Get publisher's books
  async getPublisherBooks(publisherId, filters = {}) {
    try {
      const query = { publisher: publisherId };

      // Apply filters
      if (filters.status) {
        query.approvalStatus = filters.status;
      }

      if (filters.availability) {
        query['availability.status'] = filters.availability;
      }

      if (filters.genre) {
        query.genre = filters.genre;
      }

      if (filters.search) {
        query.$or = [
          { title: { $regex: filters.search, $options: 'i' } },
          { author: { $regex: filters.search, $options: 'i' } },
          { isbn: { $regex: filters.search, $options: 'i' } },
          { barcode: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const books = await Book.find(query)
        .populate('availability.borrowedBy', 'fullName email')
        .sort({ createdAt: -1 });

      return books;
    } catch (error) {
      throw new Error(`Failed to get publisher books: ${error.message}`);
    }
  }

  // Get checkout requests for publisher's books
  async getCheckoutRequests(publisherId, filters = {}) {
    try {
      const query = { publisher: publisherId };

      // Apply filters
      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.bookId) {
        query.book = filters.bookId;
      }

      if (filters.borrowerId) {
        query.borrower = filters.borrowerId;
      }

      const requests = await BookRequest.find(query)
        .populate('book', 'title author isbn barcode genre rental')
        .populate('borrower', 'fullName email communityName profileImage')
        .sort({ requestDate: -1 });

      return requests;
    } catch (error) {
      throw new Error(`Failed to get checkout requests: ${error.message}`);
    }
  }

  // Approve checkout request
  async approveCheckoutRequest(publisherId, requestId, approvalData) {
    try {
      const request = await BookRequest.findOne({
        _id: requestId,
        publisher: publisherId,
        status: 'pending'
      }).populate('book');

      if (!request) {
        throw new Error('Request not found or not pending');
      }

      // Check if book is still available
      if (request.book.availability.status !== 'available') {
        throw new Error('Book is no longer available');
      }

      // Update request
      request.status = 'approved';
      request.publisherResponse = {
        responseDate: new Date(),
        message: approvalData.message || 'Request approved'
      };
      request.rental = {
        actualStartDate: approvalData.startDate || new Date(),
        actualEndDate: approvalData.endDate || request.requestedEndDate,
        status: 'active'
      };

      await request.save();

      // The book availability will be updated by the middleware
      return request;
    } catch (error) {
      throw new Error(`Failed to approve request: ${error.message}`);
    }
  }

  // Reject checkout request
  async rejectCheckoutRequest(publisherId, requestId, rejectionData) {
    try {
      const request = await BookRequest.findOne({
        _id: requestId,
        publisher: publisherId,
        status: 'pending'
      });

      if (!request) {
        throw new Error('Request not found or not pending');
      }

      request.status = 'rejected';
      request.publisherResponse = {
        responseDate: new Date(),
        message: rejectionData.reason || 'Request rejected'
      };

      await request.save();
      return request;
    } catch (error) {
      throw new Error(`Failed to reject request: ${error.message}`);
    }
  }

  // Get currently borrowed books
  async getCurrentlyBorrowedBooks(publisherId) {
    try {
      const borrowedBooks = await BookRequest.find({
        publisher: publisherId,
        status: 'approved',
        'rental.status': { $in: ['active', 'overdue'] }
      })
      .populate('book', 'title author isbn barcode genre')
      .populate('borrower', 'fullName email communityName')
      .sort({ 'rental.actualStartDate': -1 });

      return borrowedBooks;
    } catch (error) {
      throw new Error(`Failed to get borrowed books: ${error.message}`);
    }
  }

  // Get overdue books
  async getOverdueBooks(publisherId) {
    try {
      const now = new Date();
      
      const overdueBooks = await BookRequest.find({
        publisher: publisherId,
        status: 'approved',
        'rental.status': 'active',
        'rental.actualEndDate': { $lt: now }
      })
      .populate('book', 'title author isbn barcode genre rental')
      .populate('borrower', 'fullName email communityName')
      .sort({ 'rental.actualEndDate': 1 });

      // Update status to overdue and calculate fines
      for (const request of overdueBooks) {
        if (request.rental.status === 'active') {
          const daysOverdue = Math.ceil((now - request.rental.actualEndDate) / (1000 * 60 * 60 * 24));
          const finePerDay = 1.0; // This should come from system config
          
          request.rental.status = 'overdue';
          
          // Add overdue fine if not already added
          const existingFine = request.rental.fines?.find(f => f.type === 'overdue');
          if (!existingFine) {
            request.rental.fines = request.rental.fines || [];
            request.rental.fines.push({
              type: 'overdue',
              amount: daysOverdue * finePerDay,
              description: `Overdue fine for ${daysOverdue} days`,
              status: 'pending'
            });
          } else {
            // Update existing fine amount
            existingFine.amount = daysOverdue * finePerDay;
            existingFine.description = `Overdue fine for ${daysOverdue} days`;
          }
          
          await request.save();
        }
      }

      return overdueBooks;
    } catch (error) {
      throw new Error(`Failed to get overdue books: ${error.message}`);
    }
  }

  // Mark book as returned
  async markBookReturned(publisherId, requestId, returnData) {
    try {
      const request = await BookRequest.findOne({
        _id: requestId,
        publisher: publisherId,
        status: 'approved',
        'rental.status': { $in: ['active', 'overdue'] }
      }).populate('book');

      if (!request) {
        throw new Error('Active rental not found');
      }

      request.rental.returnDate = new Date();
      request.rental.status = 'returned';

      // Add damage fine if specified
      if (returnData.damage && returnData.damageAmount) {
        request.rental.fines = request.rental.fines || [];
        request.rental.fines.push({
          type: 'damage',
          amount: returnData.damageAmount,
          description: returnData.damageDescription || 'Book damage fee',
          status: 'pending'
        });
      }

      await request.save();
      return request;
    } catch (error) {
      throw new Error(`Failed to mark book as returned: ${error.message}`);
    }
  }

  // Get publisher dashboard stats
  async getPublisherDashboard(publisherId) {
    try {
      const [
        totalBooks,
        pendingBooks,
        availableBooks,
        borrowedBooks,
        pendingRequests,
        activeRentals,
        overdueRentals,
        totalEarnings
      ] = await Promise.all([
        Book.countDocuments({ publisher: publisherId }),
        Book.countDocuments({ publisher: publisherId, approvalStatus: 'pending' }),
        Book.countDocuments({ publisher: publisherId, 'availability.status': 'available' }),
        Book.countDocuments({ publisher: publisherId, 'availability.status': 'borrowed' }),
        BookRequest.countDocuments({ publisher: publisherId, status: 'pending' }),
        BookRequest.countDocuments({ 
          publisher: publisherId, 
          status: 'approved', 
          'rental.status': 'active' 
        }),
        BookRequest.countDocuments({ 
          publisher: publisherId, 
          status: 'approved', 
          'rental.status': 'overdue' 
        }),
        this.calculateEarnings(publisherId)
      ]);

      return {
        totalBooks,
        pendingBooks,
        availableBooks,
        borrowedBooks,
        pendingRequests,
        activeRentals,
        overdueRentals,
        totalEarnings
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard data: ${error.message}`);
    }
  }

  // Calculate publisher earnings
  async calculateEarnings(publisherId, period = 'month') {
    try {
      const startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const rentals = await BookRequest.find({
        publisher: publisherId,
        status: 'approved',
        'rental.actualStartDate': { $gte: startDate }
      }).populate('book', 'rental.pricePerDay');

      let totalEarnings = 0;
      for (const rental of rentals) {
        if (rental.rental?.actualStartDate && rental.book?.rental?.pricePerDay) {
          const endDate = rental.rental.returnDate || rental.rental.actualEndDate || new Date();
          const days = Math.ceil((endDate - rental.rental.actualStartDate) / (1000 * 60 * 60 * 24));
          totalEarnings += days * rental.book.rental.pricePerDay;
        }
      }

      return totalEarnings;
    } catch (error) {
      throw new Error(`Failed to calculate earnings: ${error.message}`);
    }
  }

  // Update book details
  async updateBook(publisherId, bookId, updateData) {
    try {
      const book = await Book.findOne({
        _id: bookId,
        publisher: publisherId
      });

      if (!book) {
        throw new Error('Book not found');
      }

      // Prevent updating certain fields if book is currently borrowed
      if (book.availability.status === 'borrowed') {
        const restrictedFields = ['rental.pricePerDay', 'rental.maxRentalDays'];
        for (const field of restrictedFields) {
          if (updateData[field] !== undefined) {
            throw new Error('Cannot update rental pricing while book is borrowed');
          }
        }
      }

      Object.assign(book, updateData);
      await book.save();

      return book;
    } catch (error) {
      throw new Error(`Failed to update book: ${error.message}`);
    }
  }

  // Delete book (only if not borrowed and no pending requests)
  async deleteBook(publisherId, bookId) {
    try {
      const book = await Book.findOne({
        _id: bookId,
        publisher: publisherId
      });

      if (!book) {
        throw new Error('Book not found');
      }

      // Check if book is currently borrowed
      if (book.availability.status === 'borrowed') {
        throw new Error('Cannot delete book that is currently borrowed');
      }

      // Check for pending requests
      const pendingRequests = await BookRequest.countDocuments({
        book: bookId,
        status: 'pending'
      });

      if (pendingRequests > 0) {
        throw new Error('Cannot delete book with pending rental requests');
      }

      await Book.findByIdAndDelete(bookId);
      return { message: 'Book deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete book: ${error.message}`);
    }
  }
}

module.exports = new PublisherService();
