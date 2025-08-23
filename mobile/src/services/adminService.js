import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/constants';

class AdminService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/admin`;
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const token = await AsyncStorage.getItem('adminToken');
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Admin API Error:', error);
      throw error;
    }
  }

  // Dashboard Stats
  async getDashboardStats() {
    return this.makeRequest('/dashboard/stats');
  }

  // User Management
  async getPendingUsers() {
    return this.makeRequest('/users/pending');
  }

  async getAllUsers(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.makeRequest(`/users?${queryParams}`);
  }

  async approveUser(userId) {
    return this.makeRequest(`/users/${userId}/approve`, {
      method: 'POST',
    });
  }

  async rejectUser(userId, reason = '') {
    return this.makeRequest(`/users/${userId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async blockUser(userId, reason = '') {
    return this.makeRequest(`/users/${userId}/block`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async unblockUser(userId) {
    return this.makeRequest(`/users/${userId}/unblock`, {
      method: 'POST',
    });
  }

  async deactivateUser(userId, reason = '') {
    return this.makeRequest(`/users/${userId}/deactivate`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getUserDetails(userId) {
    return this.makeRequest(`/users/${userId}`);
  }

  // Book Management
  async getPendingBooks() {
    return this.makeRequest('/books/pending');
  }

  async getAllBooks(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.makeRequest(`/books?${queryParams}`);
  }

  async approveBook(bookId) {
    return this.makeRequest(`/books/${bookId}/approve`, {
      method: 'POST',
    });
  }

  async rejectBook(bookId, reason = '') {
    return this.makeRequest(`/books/${bookId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async deactivateBook(bookId, reason = '') {
    return this.makeRequest(`/books/${bookId}/deactivate`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getBookDetails(bookId) {
    return this.makeRequest(`/books/${bookId}`);
  }

  // Reports
  async getTransactionReports(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.makeRequest(`/reports/transactions?${queryParams}`);
  }

  async getOverdueReports(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.makeRequest(`/reports/overdue?${queryParams}`);
  }

  async getWalletReports(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.makeRequest(`/reports/wallets?${queryParams}`);
  }

  async getFineReports(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.makeRequest(`/reports/fines?${queryParams}`);
  }

  async getAnalyticsData(period = 'month') {
    return this.makeRequest(`/reports/analytics?period=${period}`);
  }

  // Configuration Management
  async getFineConfiguration() {
    return this.makeRequest('/config/fines');
  }

  async updateFineConfiguration(config) {
    return this.makeRequest('/config/fines', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async getRentalConfiguration() {
    return this.makeRequest('/config/rental');
  }

  async updateRentalConfiguration(config) {
    return this.makeRequest('/config/rental', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async getWalletConfiguration() {
    return this.makeRequest('/config/wallet');
  }

  async updateWalletConfiguration(config) {
    return this.makeRequest('/config/wallet', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async getNotificationConfiguration() {
    return this.makeRequest('/config/notifications');
  }

  async updateNotificationConfiguration(config) {
    return this.makeRequest('/config/notifications', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async getGeneralConfiguration() {
    return this.makeRequest('/config/general');
  }

  async updateGeneralConfiguration(config) {
    return this.makeRequest('/config/general', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // Activity Logs
  async getActivityLogs(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.makeRequest(`/reports/activity-logs?${queryParams}`);
  }

  // Export Data
  async exportTransactionReport(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.makeRequest(`/reports/export/transactions?${queryParams}`);
  }

  async exportWalletReport(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.makeRequest(`/reports/export/wallets?${queryParams}`);
  }

  async exportUserReport(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.makeRequest(`/reports/export/users?${queryParams}`);
  }

  async exportBookReport(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.makeRequest(`/reports/export/books?${queryParams}`);
  }

  // Statistics
  async getSystemStatistics() {
    return this.makeRequest('/dashboard/system-stats');
  }

  async getCommunityStatistics() {
    return this.makeRequest('/dashboard/community-stats');
  }

  async getFinancialStatistics() {
    return this.makeRequest('/dashboard/financial-stats');
  }

  // Admin Authentication
  async adminLogin(credentials) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    const data = await response.json();
    await AsyncStorage.setItem('adminToken', data.token);
    await AsyncStorage.setItem('adminUser', JSON.stringify(data.admin));
    
    return data;
  }

  async adminLogout() {
    await AsyncStorage.multiRemove(['adminToken', 'adminUser']);
  }

  async getAdminProfile() {
    return this.makeRequest('/auth/profile');
  }

  async updateAdminProfile(profileData) {
    return this.makeRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Notification Management
  async sendNotificationToUser(userId, notification) {
    return this.makeRequest(`/notifications/user/${userId}`, {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  }

  async sendBroadcastNotification(notification) {
    return this.makeRequest('/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  }

  async sendCommunityNotification(communityId, notification) {
    return this.makeRequest(`/notifications/community/${communityId}`, {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  }

  // Backup and Restore
  async createSystemBackup() {
    return this.makeRequest('/system/backup', {
      method: 'POST',
    });
  }

  async getBackupHistory() {
    return this.makeRequest('/system/backup/history');
  }

  async restoreFromBackup(backupId) {
    return this.makeRequest(`/system/backup/${backupId}/restore`, {
      method: 'POST',
    });
  }

  // System Health
  async getSystemHealth() {
    return this.makeRequest('/system/health');
  }

  async getSystemLogs(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.makeRequest(`/system/logs?${queryParams}`);
  }

  // Audit Trail
  async getAuditTrail(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.makeRequest(`/audit/trail?${queryParams}`);
  }

  async getAuditDetails(auditId) {
    return this.makeRequest(`/audit/${auditId}`);
  }
}

export const adminService = new AdminService();
