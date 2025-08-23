// User types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  userType: 'borrower' | 'publisher' | 'admin';
  isVerified: boolean;
  avatar?: string;
  bio?: string;
  address?: Address;
  rating?: number;
  joinedAt: Date;
  isActive: boolean;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

// Book types
export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  description?: string;
  genre: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  images: string[];
  rentPrice: number;
  securityDeposit: number;
  isAvailable: boolean;
  publisher: User;
  publishedAt: Date;
  isApproved: boolean;
  rating?: number;
  reviews?: Review[];
  location?: Address;
}

export interface Review {
  id: string;
  user: User;
  book: Book;
  rating: number;
  comment?: string;
  createdAt: Date;
}

// Transaction types
export interface Transaction {
  id: string;
  book: Book;
  borrower: User;
  publisher: User;
  status: 'pending' | 'approved' | 'active' | 'returned' | 'overdue' | 'cancelled';
  requestedAt: Date;
  approvedAt?: Date;
  borrowedAt?: Date;
  dueDate?: Date;
  returnedAt?: Date;
  rentAmount: number;
  securityDeposit: number;
  fine?: number;
  totalAmount: number;
}

// Wallet types
export interface Wallet {
  id: string;
  user: User;
  balance: number;
  transactions: WalletTransaction[];
}

export interface WalletTransaction {
  id: string;
  wallet: Wallet;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  relatedTransaction?: Transaction;
  createdAt: Date;
}

// Notification types
export interface Notification {
  id: string;
  user: User;
  type: 'book_request' | 'book_approved' | 'book_rejected' | 'return_reminder' | 'overdue' | 'payment' | 'fine';
  title: string;
  message: string;
  isRead: boolean;
  data?: any;
  createdAt: Date;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  userType: 'borrower' | 'publisher';
}

export interface BookFormData {
  title: string;
  author: string;
  isbn: string;
  description?: string;
  genre: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  rentPrice: number;
  securityDeposit: number;
  images: File[];
}

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  bio?: string;
  address?: Address;
}

// Search and filter types
export interface BookSearchFilters {
  query?: string;
  genre?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  isAvailable?: boolean;
  sortBy?: 'title' | 'author' | 'price' | 'rating' | 'publishedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// Authentication types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Component prop types
export interface BookCardProps {
  book: Book;
  onBookClick?: (book: Book) => void;
  showActions?: boolean;
}

export interface UserCardProps {
  user: User;
  onUserClick?: (user: User) => void;
}

export interface TransactionCardProps {
  transaction: Transaction;
  viewType: 'borrower' | 'publisher' | 'admin';
}

// Navigation types (for mobile)
export interface NavigationParamList {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  Books: undefined;
  BookDetails: { bookId: string };
  Profile: { userId?: string };
  Scanner: undefined;
  Wallet: undefined;
  Transactions: undefined;
  Settings: undefined;
}
