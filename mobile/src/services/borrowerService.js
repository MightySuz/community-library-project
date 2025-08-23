import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = __DEV__ ? 'http://localhost:5000/api' : 'https://your-api-url.com/api';

class BorrowerService {
  // Get authorization header
  async getAuthHeader() {
    try {
      const token = await AsyncStorage.getItem('token');
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (error) {
      console.error('Error getting auth header:', error);
      return {};
    }
  }

  // Get borrower dashboard statistics
  async getDashboardStats() {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.get(`${API_URL}/borrower/dashboard`, { headers });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch dashboard stats');
    }
  }

  // Search and filter books
  async searchBooks(searchParams = {}) {
    try {
      const headers = await this.getAuthHeader();
      const params = new URLSearchParams();
      
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const response = await axios.get(`${API_URL}/borrower/books/search?${params}`, { headers });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to search books');
    }
  }

  // Get book details
  async getBookDetails(bookId) {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.get(`${API_URL}/borrower/books/${bookId}`, { headers });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get book details');
    }
  }

  // Place hold on a book
  async placeHold(bookId, holdDays = 1) {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.post(
        `${API_URL}/borrower/books/${bookId}/hold`,
        { holdDays },
        { headers }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to place hold');
    }
  }

  // Convert hold to rental request
  async convertHoldToRequest(holdId) {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.post(
        `${API_URL}/borrower/holds/${holdId}/convert`,
        {},
        { headers }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to convert hold to request');
    }
  }

  // Cancel hold
  async cancelHold(holdId) {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.delete(`${API_URL}/borrower/holds/${holdId}`, { headers });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to cancel hold');
    }
  }

  // Get user's current rentals and holds
  async getUserRentals() {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.get(`${API_URL}/borrower/rentals`, { headers });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get rentals');
    }
  }

  // Add funds to wallet
  async addFundsToWallet(amount, paymentMethod) {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.post(
        `${API_URL}/borrower/wallet/add-funds`,
        { amount, paymentMethod },
        { headers }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to add funds');
    }
  }

  // Get wallet information
  async getWallet() {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.get(`${API_URL}/borrower/wallet`, { headers });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get wallet information');
    }
  }

  // Get available genres
  async getAvailableGenres() {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.get(`${API_URL}/borrower/genres`, { headers });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get genres');
    }
  }

  // Get available authors
  async getAvailableAuthors() {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.get(`${API_URL}/borrower/authors`, { headers });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get authors');
    }
  }

  // Validate wallet balance
  async validateWalletBalance(rentalAmount) {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.post(
        `${API_URL}/borrower/wallet/validate`,
        { rentalAmount },
        { headers }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to validate wallet balance');
    }
  }

  // Calculate rental cost
  async calculateRentalCost(pricePerDay, days) {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.post(
        `${API_URL}/borrower/rental/calculate-cost`,
        { pricePerDay, days },
        { headers }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to calculate rental cost');
    }
  }

  // Get popular books
  async getPopularBooks() {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.get(`${API_URL}/borrower/books/popular`, { headers });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get popular books');
    }
  }

  // Get recently added books
  async getRecentBooks() {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.get(`${API_URL}/borrower/books/recent`, { headers });
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

  // Format relative date
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
      case 'available': return '#4caf50';
      case 'rented': return '#f44336';
      case 'on-hold': return '#ff9800';
      default: return '#757575';
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
      case 'active': return '#4caf50';
      case 'overdue': return '#f44336';
      case 'completed': return '#2196f3';
      case 'hold': return '#ff9800';
      case 'pending': return '#757575';
      default: return '#757575';
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

  // Cache management for offline support
  async cacheData(key, data) {
    try {
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  async getCachedData(key, maxAge = 5 * 60 * 1000) { // 5 minutes default
    try {
      const cached = await AsyncStorage.getItem(`cache_${key}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < maxAge) {
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  async clearCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

export default new BorrowerService();
