// App constants
export const APP_NAME = 'Community Library';
export const APP_VERSION = '1.0.0';

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    VERIFY_OTP: '/auth/verify-otp',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  BOOKS: {
    LIST: '/books',
    CREATE: '/books',
    GET: (id) => `/books/${id}`,
    UPDATE: (id) => `/books/${id}`,
    DELETE: (id) => `/books/${id}`,
    SEARCH: '/books/search',
  },
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    WALLET: '/users/wallet',
  },
  TRANSACTIONS: {
    LIST: '/transactions',
    BORROW: '/transactions/borrow',
    RETURN: '/transactions/return',
    HISTORY: '/transactions/history',
  },
  ADMIN: {
    USERS: '/admin/users',
    BOOKS: '/admin/books',
    TRANSACTIONS: '/admin/transactions',
    APPROVE_BOOK: (id) => `/admin/books/${id}/approve`,
  },
};

// User roles
export const USER_ROLES = {
  BORROWER: 'borrower',
  PUBLISHER: 'publisher',
  ADMIN: 'admin',
};

// Book conditions
export const BOOK_CONDITIONS = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
};

// Book genres
export const BOOK_GENRES = [
  'Fiction',
  'Non-Fiction',
  'Mystery',
  'Romance',
  'Science Fiction',
  'Fantasy',
  'Biography',
  'History',
  'Science',
  'Technology',
  'Business',
  'Self-Help',
  'Children',
  'Young Adult',
  'Comics',
  'Poetry',
  'Drama',
  'Religion',
  'Philosophy',
  'Art',
  'Cooking',
  'Travel',
  'Health',
  'Sports',
  'Other',
];

// Transaction statuses
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  ACTIVE: 'active',
  RETURNED: 'returned',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
};

// Notification types
export const NOTIFICATION_TYPES = {
  BOOK_REQUEST: 'book_request',
  BOOK_APPROVED: 'book_approved',
  BOOK_REJECTED: 'book_rejected',
  RETURN_REMINDER: 'return_reminder',
  OVERDUE: 'overdue',
  PAYMENT: 'payment',
  FINE: 'fine',
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  NOT_FOUND: 'The requested resource was not found.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  REGISTRATION_SUCCESS: 'Registration successful! Please verify your email.',
  LOGIN_SUCCESS: 'Login successful!',
  BOOK_CREATED: 'Book added successfully!',
  BOOK_UPDATED: 'Book updated successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  BOOK_BORROWED: 'Book borrowed successfully!',
  BOOK_RETURNED: 'Book returned successfully!',
};

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  THEME: 'theme_preference',
  LANGUAGE: 'language_preference',
};

// Default pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// File upload limits
export const FILE_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  MAX_FILES: 5,
};

// Fine calculation
export const FINE_CONFIG = {
  DAILY_RATE: 1, // $1 per day
  GRACE_PERIOD_DAYS: 1, // 1 day grace period
  MAX_FINE: 50, // Maximum fine of $50
};
