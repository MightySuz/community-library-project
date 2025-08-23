import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class RentalService {
  // Set authorization header
  setAuthToken(token) {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }

  // Publisher/Admin: Checkout book (convert approved request to active rental)
  async checkoutBook(requestId) {
    try {
      const response = await axios.post(`${API_URL}/rental/checkout/${requestId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to checkout book');
    }
  }

  // Return book
  async returnBook(requestId, returnDate = null) {
    try {
      const response = await axios.post(`${API_URL}/rental/return/${requestId}`, {
        returnDate: returnDate || new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to return book');
    }
  }

  // Borrower: Get rental history with cost breakdown
  async getBorrowerRentalHistory(page = 1, limit = 20) {
    try {
      const response = await axios.get(`${API_URL}/rental/history`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get rental history');
    }
  }

  // Borrower: Get rental summary statistics
  async getBorrowerRentalSummary() {
    try {
      const response = await axios.get(`${API_URL}/rental/summary`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get rental summary');
    }
  }

  // Publisher: Get earned rental fees
  async getPublisherEarnings(page = 1, limit = 20, startDate = null, endDate = null) {
    try {
      const params = { page, limit };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await axios.get(`${API_URL}/rental/earnings`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get publisher earnings');
    }
  }

  // Publisher: Get earnings summary
  async getPublisherEarningsSummary(startDate = null, endDate = null) {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await axios.get(`${API_URL}/rental/earnings/summary`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get publisher earnings summary');
    }
  }

  // Admin: Get all overdue rentals
  async getOverdueRentals() {
    try {
      const response = await axios.get(`${API_URL}/rental/overdue`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get overdue rentals');
    }
  }

  // Admin: Process late fees for overdue rentals
  async processLateFees() {
    try {
      const response = await axios.post(`${API_URL}/rental/process-late-fees`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to process late fees');
    }
  }

  // Get rental analytics for a specific book
  async getBookRentalAnalytics(bookId, startDate = null, endDate = null) {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await axios.get(`${API_URL}/rental/analytics/book/${bookId}`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get book analytics');
    }
  }

  // Calculate rental cost
  async calculateRentalCost(pricePerDay, startDate, endDate) {
    try {
      const response = await axios.post(`${API_URL}/rental/calculate-cost`, {
        pricePerDay,
        startDate,
        endDate
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to calculate rental cost');
    }
  }

  // Get late fee rate
  async getLateFeeRate() {
    try {
      const response = await axios.get(`${API_URL}/rental/late-fee-rate`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get late fee rate');
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

  // Format date and time
  formatDateTime(date) {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Calculate days between dates
  calculateDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  }

  // Check if rental is overdue
  isOverdue(dueDate) {
    return new Date() > new Date(dueDate);
  }

  // Calculate days overdue
  calculateDaysOverdue(dueDate) {
    const due = new Date(dueDate);
    const now = new Date();
    
    if (now <= due) return 0;
    
    return Math.ceil((now - due) / (1000 * 60 * 60 * 24));
  }

  // Get rental status display
  getRentalStatusDisplay(rental) {
    if (rental.rental?.status === 'completed') {
      return {
        status: 'Completed',
        color: 'success',
        description: `Returned on ${this.formatDate(rental.rental.returnedDate)}`
      };
    }

    if (rental.rental?.status === 'active') {
      const isOverdue = this.isOverdue(rental.rental.actualEndDate);
      
      if (isOverdue) {
        const daysOverdue = this.calculateDaysOverdue(rental.rental.actualEndDate);
        return {
          status: 'Overdue',
          color: 'error',
          description: `${daysOverdue} day(s) overdue`
        };
      } else {
        return {
          status: 'Active',
          color: 'primary',
          description: `Due ${this.formatDate(rental.rental.actualEndDate)}`
        };
      }
    }

    return {
      status: 'Unknown',
      color: 'default',
      description: 'Status unknown'
    };
  }

  // Get payment status display
  getPaymentStatusDisplay(payment) {
    switch (payment?.status) {
      case 'completed':
        return {
          status: 'Paid',
          color: 'success',
          description: `Paid on ${this.formatDate(payment.processedDate)}`
        };
      case 'pending':
        return {
          status: 'Pending',
          color: 'warning',
          description: 'Payment pending'
        };
      case 'failed':
        return {
          status: 'Failed',
          color: 'error',
          description: 'Payment failed'
        };
      default:
        return {
          status: 'Unknown',
          color: 'default',
          description: 'Payment status unknown'
        };
    }
  }

  // Calculate estimated late fees
  calculateEstimatedLateFees(dueDate, lateFeeRate = 0.50) {
    const daysOverdue = this.calculateDaysOverdue(dueDate);
    return daysOverdue * lateFeeRate;
  }

  // Generate rental receipt data
  generateReceiptData(rental) {
    const costBreakdown = rental.costBreakdown || {};
    const lateFees = rental.rental?.lateFees || 0;
    const baseCost = rental.payment?.amount || 0;

    return {
      rentalId: rental._id,
      bookTitle: rental.book?.title || 'Unknown Book',
      borrowerName: rental.borrower?.fullName || 'Unknown Borrower',
      publisherName: rental.publisher?.fullName || 'Unknown Publisher',
      rentalPeriod: {
        start: rental.rental?.actualStartDate,
        end: rental.rental?.actualEndDate,
        days: costBreakdown.rentalDays || 0
      },
      costs: {
        dailyRate: costBreakdown.dailyRate || 0,
        baseCost,
        lateFees,
        totalCost: baseCost + lateFees
      },
      payment: {
        status: rental.payment?.status || 'unknown',
        processedDate: rental.payment?.processedDate,
        method: 'Wallet'
      },
      returnInfo: {
        returned: !!rental.rental?.returnedDate,
        returnedDate: rental.rental?.returnedDate,
        onTime: lateFees === 0
      }
    };
  }
}

export default new RentalService();
