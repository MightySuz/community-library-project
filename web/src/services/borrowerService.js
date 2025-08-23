import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class BorrowerService {
  // Get authorization header
  getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Get borrower dashboard statistics
  async getDashboardStats() {
    try {
      const response = await axios.get(`${API_URL}/borrower/dashboard`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch dashboard stats');
    }
  }

  // Search and filter books
  async searchBooks(searchParams = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const response = await axios.get(`${API_URL}/borrower/books/search?${params}`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to search books');
    }
  }

  // Get book details
  async getBookDetails(bookId) {
    try {
      const response = await axios.get(`${API_URL}/borrower/books/${bookId}`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get book details');
    }
  }

  // Place hold on a book
  async placeHold(bookId, holdDays = 1) {
    try {
      const response = await axios.post(
        `${API_URL}/borrower/books/${bookId}/hold`,
        { holdDays },
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to place hold');
    }
  }

  // Convert hold to rental request
  async convertHoldToRequest(holdId) {
    try {
      const response = await axios.post(
        `${API_URL}/borrower/holds/${holdId}/convert`,
        {},
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to convert hold to request');
    }
  }

  // Cancel hold
  async cancelHold(holdId) {
    try {
      const response = await axios.delete(`${API_URL}/borrower/holds/${holdId}`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to cancel hold');
    }
  }

  // Get user's current rentals and holds
  async getUserRentals() {
    try {
      const response = await axios.get(`${API_URL}/borrower/rentals`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get rentals');
    }
  }

  // Add funds to wallet
  async addFundsToWallet(amount, paymentMethod) {
    try {
      const response = await axios.post(
        `${API_URL}/borrower/wallet/add-funds`,
        { amount, paymentMethod },
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to add funds');
    }
  }

  // Get wallet information
  async getWallet() {
    try {
      const response = await axios.get(`${API_URL}/borrower/wallet`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get wallet information');
    }
  }

  // Get available genres
  async getAvailableGenres() {
    try {
      const response = await axios.get(`${API_URL}/borrower/genres`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get genres');
    }
  }

  // Get available authors
  async getAvailableAuthors() {
    try {
      const response = await axios.get(`${API_URL}/borrower/authors`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get authors');
    }
  }

  // Validate wallet balance
  async validateWalletBalance(rentalAmount) {
    try {
      const response = await axios.post(
        `${API_URL}/borrower/wallet/validate`,
        { rentalAmount },
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to validate wallet balance');
    }
  }

  // Calculate rental cost
  async calculateRentalCost(pricePerDay, days) {
    try {
      const response = await axios.post(
        `${API_URL}/borrower/rental/calculate-cost`,
        { pricePerDay, days },
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to calculate rental cost');
    }
  }

  // Get popular books
  async getPopularBooks() {
    try {
      const response = await axios.get(`${API_URL}/borrower/books/popular`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get popular books');
    }
  }

  // Get recently added books
  async getRecentBooks() {
    try {
      const response = await axios.get(`${API_URL}/borrower/books/recent`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get recent books');
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

  // Format relative date (e.g., "2 days ago")
  formatRelativeDate(date) {
    const now = new Date();
    const targetDate = new Date(date);
    const diffTime = Math.abs(now - targetDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  // Get status color for book availability
  getStatusColor(status) {
    switch (status) {
      case 'available': return 'success';
      case 'rented': return 'error';
      case 'on-hold': return 'warning';
      default: return 'default';
    }
  }

  // Get status text for book availability
  getStatusText(status) {
    switch (status) {
      case 'available': return 'Available';
      case 'rented': return 'Currently Rented';
      case 'on-hold': return 'On Hold';
      default: return 'Unknown';
    }
  }

  // Get rental status color
  getRentalStatusColor(status) {
    switch (status) {
      case 'active': return 'success';
      case 'overdue': return 'error';
      case 'completed': return 'info';
      case 'hold': return 'warning';
      case 'pending': return 'default';
      default: return 'default';
    }
  }

  // Get rental status text
  getRentalStatusText(status) {
    switch (status) {
      case 'active': return 'Active Rental';
      case 'overdue': return 'Overdue';
      case 'completed': return 'Completed';
      case 'hold': return 'On Hold';
      case 'pending': return 'Pending Approval';
      default: return 'Unknown';
    }
  }

  // Check if hold is expiring soon (within 6 hours)
  isHoldExpiringSoon(holdExpiry) {
    const now = new Date();
    const expiry = new Date(holdExpiry);
    const hoursUntilExpiry = (expiry - now) / (1000 * 60 * 60);
    return hoursUntilExpiry > 0 && hoursUntilExpiry <= 6;
  }

  // Get time until hold expires
  getTimeUntilExpiry(holdExpiry) {
    const now = new Date();
    const expiry = new Date(holdExpiry);
    const timeUntilExpiry = expiry - now;

    if (timeUntilExpiry <= 0) return 'Expired';

    const hours = Math.floor(timeUntilExpiry / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntilExpiry % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}

export default new BorrowerService();
