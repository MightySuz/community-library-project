import api from '../api/api';

class PublisherService {
  async getDashboard() {
    try {
      const response = await api.get('/publisher/dashboard');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to load dashboard');
    }
  }

  async getBooks(params = {}) {
    try {
      const response = await api.get('/publisher/books', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to load books');
    }
  }

  async getBook(bookId) {
    try {
      const response = await api.get(`/publisher/books/${bookId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to load book');
    }
  }

  async addBook(bookData) {
    try {
      const response = await api.post('/publisher/books', bookData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to add book');
    }
  }

  async updateBook(bookId, bookData) {
    try {
      const response = await api.put(`/publisher/books/${bookId}`, bookData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update book');
    }
  }

  async deleteBook(bookId) {
    try {
      const response = await api.delete(`/publisher/books/${bookId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete book');
    }
  }

  async getBookFromBarcode(barcode) {
    try {
      const response = await api.post('/publisher/barcode/scan', { barcode });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get book from barcode');
    }
  }

  async getRequests(params = {}) {
    try {
      const response = await api.get('/publisher/requests', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to load requests');
    }
  }

  async getRequest(requestId) {
    try {
      const response = await api.get(`/publisher/requests/${requestId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to load request');
    }
  }

  async approveRequest(requestId, data = {}) {
    try {
      const response = await api.put(`/publisher/requests/${requestId}/approve`, data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to approve request');
    }
  }

  async rejectRequest(requestId, data = {}) {
    try {
      const response = await api.put(`/publisher/requests/${requestId}/reject`, data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to reject request');
    }
  }

  async getBorrowedBooks(params = {}) {
    try {
      const response = await api.get('/publisher/borrowed', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to load borrowed books');
    }
  }

  async getOverdueBooks(params = {}) {
    try {
      const response = await api.get('/publisher/overdue', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to load overdue books');
    }
  }

  async markReturned(requestId, data = {}) {
    try {
      const response = await api.put(`/publisher/returns/${requestId}`, data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to mark as returned');
    }
  }

  async getEarnings(params = {}) {
    try {
      const response = await api.get('/publisher/earnings', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to load earnings');
    }
  }

  async getRentalHistory(params = {}) {
    try {
      const response = await api.get('/publisher/history', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to load rental history');
    }
  }

  async getAnalytics(period = 'month') {
    try {
      const response = await api.get('/publisher/analytics', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to load analytics');
    }
  }

  async exportData(type = 'books', format = 'csv') {
    try {
      const response = await api.get('/publisher/export', {
        params: { type, format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to export data');
    }
  }

  // Utility methods
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date) {
    return new Date(date).toLocaleDateString();
  }

  formatDateTime(date) {
    return new Date(date).toLocaleString();
  }

  calculateDaysOverdue(dueDate) {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = now - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  calculateFine(daysOverdue, dailyFine = 0.50) {
    return daysOverdue * dailyFine;
  }

  getBookStatusColor(status) {
    switch (status) {
      case 'available':
        return '#4CAF50';
      case 'borrowed':
        return '#F44336';
      case 'maintenance':
        return '#FF9800';
      default:
        return '#666';
    }
  }

  getRequestStatusColor(status) {
    switch (status) {
      case 'approved':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      case 'pending':
        return '#FF9800';
      default:
        return '#666';
    }
  }

  validateBookData(bookData) {
    const errors = [];

    if (!bookData.title?.trim()) {
      errors.push('Title is required');
    }

    if (!bookData.author?.trim()) {
      errors.push('Author is required');
    }

    if (!bookData.rental?.pricePerDay || parseFloat(bookData.rental.pricePerDay) <= 0) {
      errors.push('Valid rental price per day is required');
    }

    if (bookData.rental?.maxRentalDays && parseInt(bookData.rental.maxRentalDays) <= 0) {
      errors.push('Max rental days must be a positive number');
    }

    if (bookData.purchasePrice && parseFloat(bookData.purchasePrice) <= 0) {
      errors.push('Purchase price must be a positive number');
    }

    if (bookData.pages && parseInt(bookData.pages) <= 0) {
      errors.push('Number of pages must be a positive number');
    }

    if (bookData.publishedYear) {
      const year = parseInt(bookData.publishedYear);
      const currentYear = new Date().getFullYear();
      if (year < 1000 || year > currentYear) {
        errors.push('Published year must be between 1000 and current year');
      }
    }

    return errors;
  }

  generateBookBarcode() {
    // Generate a simple barcode for testing
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `BK${timestamp}${random}`;
  }

  getGenres() {
    return [
      'Fiction',
      'Non-Fiction',
      'Science Fiction',
      'Fantasy',
      'Mystery',
      'Thriller',
      'Romance',
      'Biography',
      'History',
      'Science',
      'Self-Help',
      'Business',
      'Health',
      'Travel',
      'Children',
      'Young Adult',
      'Poetry',
      'Drama',
      'Comedy',
      'Horror',
      'Adventure',
      'Educational',
      'Technical',
      'Art',
      'Music',
      'Sports',
      'Politics',
      'Philosophy',
      'Religion',
      'Other'
    ];
  }

  getLanguages() {
    return [
      'English',
      'Spanish',
      'French',
      'German',
      'Italian',
      'Portuguese',
      'Chinese',
      'Japanese',
      'Korean',
      'Arabic',
      'Hindi',
      'Russian',
      'Dutch',
      'Swedish',
      'Norwegian',
      'Other'
    ];
  }

  getConditions() {
    return [
      { value: 'excellent', label: 'Excellent - Like new' },
      { value: 'good', label: 'Good - Minor wear' },
      { value: 'fair', label: 'Fair - Noticeable wear' },
      { value: 'poor', label: 'Poor - Significant wear' }
    ];
  }

  // Mock external API for barcode scanning
  async getBookInfoFromBarcode(barcode) {
    // In a real app, this would call an external API like Google Books API
    // For demo purposes, return mock data
    const mockBooks = {
      '9780132350884': {
        title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        author: 'Robert C. Martin',
        isbn: '9780132350884',
        genre: 'Technical',
        description: 'A handbook of agile software craftsmanship',
        publishedYear: '2008',
        language: 'English',
        pages: '464'
      },
      '9780134685991': {
        title: 'Effective Java',
        author: 'Joshua Bloch',
        isbn: '9780134685991',
        genre: 'Technical',
        description: 'Best practices for the Java platform',
        publishedYear: '2017',
        language: 'English',
        pages: '416'
      }
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (mockBooks[barcode]) {
      return {
        ...mockBooks[barcode],
        barcode,
        condition: 'good',
        rental: {
          pricePerDay: '2.00',
          maxRentalDays: '14'
        },
        purchasePrice: '29.99'
      };
    }

    // Return partial data for unknown barcodes
    return {
      barcode,
      condition: 'good',
      rental: {
        pricePerDay: '1.00',
        maxRentalDays: '14'
      }
    };
  }
}

export const publisherService = new PublisherService();
