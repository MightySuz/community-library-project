import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API service methods
export const apiService = {
  // Auth endpoints
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
  
  // User endpoints
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data),
  
  // Book endpoints
  getBooks: (params) => api.get('/books', { params }),
  getBook: (id) => api.get(`/books/${id}`),
  searchBooks: (query) => api.get(`/books/search?q=${encodeURIComponent(query)}`),
  
  // Rental endpoints
  rentBook: (data) => api.post('/rental/rent', data),
  returnBook: (id) => api.put(`/rental/return/${id}`),
  getRentals: (params) => api.get('/rental', { params }),
  
  // Wallet endpoints
  getWallet: () => api.get('/wallet'),
  addFunds: (amount) => api.post('/wallet/add-funds', { amount }),
  getTransactions: (params) => api.get('/wallet/transactions', { params }),
  
  // Notification endpoints
  getNotifications: (params) => api.get('/notifications', { params }),
  markNotificationRead: (id) => api.put(`/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/notifications/mark-all-read'),
  clearNotification: (id) => api.delete(`/notifications/${id}`),
  getNotificationPreferences: () => api.get('/notifications/preferences'),
  updateNotificationPreferences: (data) => api.put('/notifications/preferences', data),
  subscribeToPush: (subscription) => api.post('/notifications/push/subscribe', subscription),
  unsubscribeFromPush: (endpoint) => api.delete('/notifications/push/unsubscribe', { data: { endpoint } }),
  
  // Admin endpoints
  getUsers: (params) => api.get('/admin/users', { params }),
  approveUser: (id) => api.put(`/admin/users/${id}/approve`),
  rejectUser: (id) => api.put(`/admin/users/${id}/reject`),
  getReports: (params) => api.get('/admin/reports', { params }),
  
  // Publisher endpoints
  getPublisherBooks: () => api.get('/publisher/books'),
  addBook: (data) => api.post('/publisher/books', data),
  updateBook: (id, data) => api.put(`/publisher/books/${id}`, data),
  deleteBook: (id) => api.delete(`/publisher/books/${id}`),
  getBookRequests: (params) => api.get('/publisher/requests', { params }),
  approveRequest: (id) => api.put(`/publisher/requests/${id}/approve`),
  rejectRequest: (id) => api.put(`/publisher/requests/${id}/reject`),
  
  // Generic CRUD methods
  get: (endpoint, config) => api.get(endpoint, config),
  post: (endpoint, data, config) => api.post(endpoint, data, config),
  put: (endpoint, data, config) => api.put(endpoint, data, config),
  delete: (endpoint, config) => api.delete(endpoint, config),
  patch: (endpoint, data, config) => api.patch(endpoint, data, config),
};

export default apiService;
