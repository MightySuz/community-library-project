import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

class PublisherService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/publisher`;
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor to add auth token
    axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async makeRequest(method, endpoint, data = null) {
    try {
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Dashboard
  async getDashboard() {
    return this.makeRequest('GET', '/dashboard');
  }

  // Barcode scanning
  async getBookFromBarcode(barcode) {
    return this.makeRequest('GET', `/barcode/${barcode}`);
  }

  // Book management
  async getBooks(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.makeRequest('GET', `/books?${params}`);
  }

  async addBook(bookData) {
    return this.makeRequest('POST', '/books', bookData);
  }

  async updateBook(bookId, updateData) {
    return this.makeRequest('PUT', `/books/${bookId}`, updateData);
  }

  async deleteBook(bookId) {
    return this.makeRequest('DELETE', `/books/${bookId}`);
  }

  async getBookDetails(bookId) {
    return this.makeRequest('GET', `/books/${bookId}`);
  }

  // Request management
  async getRequests(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.makeRequest('GET', `/requests?${params}`);
  }

  async approveRequest(requestId, approvalData) {
    return this.makeRequest('POST', `/requests/${requestId}/approve`, approvalData);
  }

  async rejectRequest(requestId, rejectionData) {
    return this.makeRequest('POST', `/requests/${requestId}/reject`, rejectionData);
  }

  // Borrowed books management
  async getBorrowedBooks() {
    return this.makeRequest('GET', '/borrowed');
  }

  async getOverdueBooks() {
    return this.makeRequest('GET', '/overdue');
  }

  async markReturned(requestId, returnData) {
    return this.makeRequest('POST', `/returns/${requestId}`, returnData);
  }

  // Analytics and reporting
  async getEarnings(period = 'month') {
    return this.makeRequest('GET', `/earnings?period=${period}`);
  }

  async getRentalHistory(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.makeRequest('GET', `/history?${params}`);
  }

  // Book catalog search for borrowers
  async searchBooks(query, filters = {}) {
    const params = new URLSearchParams({
      search: query,
      ...filters
    }).toString();
    return this.makeRequest('GET', `/search?${params}`);
  }

  // Publisher profile
  async getProfile() {
    return this.makeRequest('GET', '/profile');
  }

  async updateProfile(profileData) {
    return this.makeRequest('PUT', '/profile', profileData);
  }

  // Analytics
  async getMonthlyStats() {
    return this.makeRequest('GET', '/analytics/monthly');
  }

  async getBookPerformance() {
    return this.makeRequest('GET', '/analytics/books');
  }

  async getBorrowerAnalytics() {
    return this.makeRequest('GET', '/analytics/borrowers');
  }

  // Notifications
  async getNotifications() {
    return this.makeRequest('GET', '/notifications');
  }

  async markNotificationRead(notificationId) {
    return this.makeRequest('PUT', `/notifications/${notificationId}/read`);
  }

  // Book requests from borrowers
  async getPendingRequests() {
    return this.getRequests({ status: 'pending' });
  }

  async getApprovedRequests() {
    return this.getRequests({ status: 'approved' });
  }

  async getRejectedRequests() {
    return this.getRequests({ status: 'rejected' });
  }

  // Bulk operations
  async bulkApproveRequests(requestIds) {
    return this.makeRequest('POST', '/requests/bulk-approve', { requestIds });
  }

  async bulkRejectRequests(requestIds, reason) {
    return this.makeRequest('POST', '/requests/bulk-reject', { requestIds, reason });
  }

  async bulkUpdateBooks(bookIds, updateData) {
    return this.makeRequest('PUT', '/books/bulk-update', { bookIds, updateData });
  }

  // Export data
  async exportBooks() {
    const response = await axios.get(`${this.baseURL}/export/books`, {
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'my-books.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async exportRentalHistory() {
    const response = await axios.get(`${this.baseURL}/export/rentals`, {
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'rental-history.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  // Integration with external book APIs
  async searchExternalBookAPI(isbn) {
    try {
      // Google Books API
      const response = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
      );
      
      if (response.data.items && response.data.items.length > 0) {
        const book = response.data.items[0].volumeInfo;
        return {
          title: book.title,
          author: book.authors?.join(', ') || 'Unknown',
          description: book.description,
          publishedYear: book.publishedDate ? new Date(book.publishedDate).getFullYear() : null,
          pages: book.pageCount,
          genre: book.categories?.join(', ') || 'Fiction',
          language: book.language || 'English',
          coverImage: book.imageLinks?.thumbnail,
          isbn: isbn
        };
      }
      
      return null;
    } catch (error) {
      console.error('External API error:', error);
      return null;
    }
  }

  // Real-time updates (WebSocket integration)
  connectToUpdates(callback) {
    // This would integrate with Socket.IO for real-time updates
    // For now, we'll use polling
    const interval = setInterval(async () => {
      try {
        const [requests, borrowed] = await Promise.all([
          this.getPendingRequests(),
          this.getBorrowedBooks()
        ]);
        
        callback({
          pendingRequests: requests.length,
          borrowedBooks: borrowed.length
        });
      } catch (error) {
        console.error('Failed to fetch updates:', error);
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }

  // Utility methods
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }

  calculateRentalDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  }

  calculateOverdueDays(dueDate) {
    const due = new Date(dueDate);
    const now = new Date();
    return Math.max(0, Math.ceil((now - due) / (1000 * 60 * 60 * 24)));
  }

  validateISBN(isbn) {
    // Remove hyphens and spaces
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    
    // Check if it's 10 or 13 digits
    if (!/^[0-9X]{10}$|^[0-9]{13}$/.test(cleanISBN)) {
      return false;
    }

    if (cleanISBN.length === 10) {
      // ISBN-10 validation
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(cleanISBN[i]) * (10 - i);
      }
      const checkDigit = cleanISBN[9] === 'X' ? 10 : parseInt(cleanISBN[9]);
      return (sum + checkDigit) % 11 === 0;
    } else {
      // ISBN-13 validation
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        sum += parseInt(cleanISBN[i]) * (i % 2 === 0 ? 1 : 3);
      }
      const checkDigit = parseInt(cleanISBN[12]);
      return (sum + checkDigit) % 10 === 0;
    }
  }

  validateBarcode(barcode) {
    // EAN-13 barcode validation
    if (!/^[0-9]{13}$/.test(barcode)) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(barcode[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = parseInt(barcode[12]);
    return (10 - (sum % 10)) % 10 === checkDigit;
  }
}

export const publisherService = new PublisherService();
