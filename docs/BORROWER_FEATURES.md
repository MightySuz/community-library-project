# Borrower Features Documentation

## Overview

The Community Library app's borrower features provide comprehensive functionality for community members to discover, rent, and manage library books. This document outlines all borrower capabilities, API endpoints, and implementation details.

## Core Features

### 1. Book Search and Discovery

#### Search and Filter Books
- **Endpoint**: `GET /api/borrower/books/search`
- **Purpose**: Search for books within the borrower's community with advanced filtering options
- **Parameters**:
  - `search`: Text search across title, author, description, ISBN
  - `genre`: Filter by book genre
  - `author`: Filter by author name
  - `publisher`: Filter by publisher name
  - `minPrice`: Minimum rental price per day
  - `maxPrice`: Maximum rental price per day
  - `availability`: Filter by availability status (available, rented, on-hold)
  - `sortBy`: Sort field (title, author, genre, rental.pricePerDay, createdAt)
  - `sortOrder`: Sort direction (asc, desc)
  - `page`: Page number for pagination
  - `limit`: Number of results per page (max 100)

#### Book Details
- **Endpoint**: `GET /api/borrower/books/:bookId`
- **Purpose**: Get detailed information about a specific book
- **Returns**:
  - Complete book information
  - Rental pricing and terms
  - Availability status
  - Publisher information
  - Hold/rental eligibility flags

#### Popular and Recent Books
- **Popular Books**: `GET /api/borrower/books/popular`
  - Returns books ranked by rental frequency in user's community
- **Recent Books**: `GET /api/borrower/books/recent`
  - Returns recently added books in user's community

### 2. Book Holds and Rentals

#### Place Hold on Book
- **Endpoint**: `POST /api/borrower/books/:bookId/hold`
- **Purpose**: Place a temporary hold on an available book
- **Parameters**:
  - `holdDays`: Duration of hold (1-3 days, default: 1)
- **Validation**:
  - Book must be available
  - User must not have existing hold/rental for the book
  - User's wallet balance must cover estimated rental cost
  - Book must be in user's community

#### Hold Management
- **Convert Hold to Request**: `POST /api/borrower/holds/:holdId/convert`
  - Converts hold to formal rental request pending publisher approval
- **Cancel Hold**: `DELETE /api/borrower/holds/:holdId`
  - Cancels active hold and makes book available again

#### Rental Tracking
- **Endpoint**: `GET /api/borrower/rentals`
- **Returns**:
  - Active rentals with due dates
  - Current holds with expiry times
  - Pending requests awaiting approval
  - Overdue items with calculated late fees
  - Historical rental information

### 3. Digital Wallet Management

#### Wallet Information
- **Endpoint**: `GET /api/borrower/wallet`
- **Returns**:
  - Current wallet balance
  - Transaction history (sorted by date)
  - Transaction details (type, amount, description, date)

#### Add Funds
- **Endpoint**: `POST /api/borrower/wallet/add-funds`
- **Purpose**: Add money to wallet via payment gateway
- **Parameters**:
  - `amount`: Amount to add ($1-$1000)
  - `paymentMethod`: Payment method details
    - `type`: Payment type (card, paypal, bank)
    - `cardNumber`: Credit card number (for card payments)
    - `expiryMonth`: Card expiry month
    - `expiryYear`: Card expiry year
    - `cvv`: Card security code
- **Payment Gateway**: Integrated with simulated payment processing
- **Security**: Test card 4242424242424242 for development

#### Balance Validation
- **Endpoint**: `POST /api/borrower/wallet/validate`
- **Purpose**: Validate if wallet balance is sufficient for rental
- **Parameters**:
  - `rentalAmount`: Required rental amount
- **Returns**: Validation result with shortfall amount if insufficient

### 4. Dashboard and Analytics

#### Dashboard Statistics
- **Endpoint**: `GET /api/borrower/dashboard`
- **Returns**:
  - Active rentals count
  - Current holds count
  - Overdue books count
  - Total wallet balance
  - Total amount spent
  - Community membership information
  - Member since date

#### Community Insights
- **Available Genres**: `GET /api/borrower/genres`
  - Lists all genres available in user's community
- **Available Authors**: `GET /api/borrower/authors`
  - Lists all authors with books in user's community

### 5. Rental Cost Calculations

#### Cost Calculator
- **Endpoint**: `POST /api/borrower/rental/calculate-cost`
- **Purpose**: Calculate total rental cost for planning
- **Parameters**:
  - `pricePerDay`: Daily rental rate
  - `days`: Number of rental days
- **Returns**:
  - Total cost calculation
  - Formatted currency display
  - Per-day breakdown

## User Interface Features

### Web Dashboard (React.js)

#### Multi-Tab Interface
1. **Dashboard Tab**:
   - Statistics cards (rentals, holds, overdue, wallet)
   - Popular books carousel
   - Recently added books carousel
   - Quick action buttons

2. **Search Tab**:
   - Advanced search interface
   - Filter controls (genre, author, price range)
   - Sort options
   - Paginated results grid
   - Book cards with action buttons

3. **Rentals Tab**:
   - Active rentals list
   - Hold management
   - Due date tracking
   - Late fee calculations
   - Status indicators

4. **Wallet Tab**:
   - Balance display
   - Add funds interface
   - Transaction history
   - Payment method selection

#### Interactive Features
- **Book Details Modal**: Comprehensive book information popup
- **Add Funds Modal**: Secure payment form with validation
- **Status Indicators**: Color-coded availability and rental status
- **Real-time Updates**: Live hold expiry countdown
- **Responsive Design**: Mobile-friendly interface

### Mobile App (React Native)

#### Tab Navigation
- **Dashboard**: Stats overview and featured books
- **Search**: Book discovery with filters
- **Rentals**: Active rentals and holds management
- **Wallet**: Balance and transaction management

#### Mobile-Specific Features
- **Touch-Optimized Interface**: Large buttons and touch targets
- **Offline Caching**: Basic data caching for poor connectivity
- **Pull-to-Refresh**: Manual data refresh capability
- **Modal Overlays**: Native-style popup interfaces
- **Platform Icons**: Material Design icons throughout

## Business Rules and Validation

### Hold System Rules
1. **Hold Duration**: 1-3 days maximum
2. **Hold Limit**: One hold per book per user
3. **Community Restriction**: Books only available within same community
4. **Wallet Requirement**: Sufficient balance for estimated rental cost
5. **Auto-Expiry**: Holds expire automatically after specified duration

### Rental Workflow
1. **Hold Placement**: User places hold on available book
2. **Book Reservation**: Book status changes to "on-hold"
3. **Request Conversion**: User converts hold to rental request
4. **Publisher Approval**: Publisher approves/rejects request
5. **Active Rental**: Approved request becomes active rental
6. **Return Process**: User returns book, rental completes

### Payment and Pricing
- **Daily Rates**: Set by individual publishers
- **Late Fees**: $0.50 per day after due date
- **Payment Gateway**: 2.9% processing fee for card payments
- **Wallet System**: Prepaid balance model
- **Community Currency**: USD standard across all communities

### Security and Access Control
- **Authentication Required**: All endpoints require valid JWT token
- **Community Isolation**: Users only see books from their community
- **Role-Based Access**: Borrower-specific functionality only
- **Data Validation**: Comprehensive input validation on all endpoints
- **Rate Limiting**: API request limits to prevent abuse

## API Error Handling

### Common Error Responses
- **400 Bad Request**: Invalid input parameters or validation errors
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Insufficient permissions for requested action
- **404 Not Found**: Requested resource does not exist
- **500 Internal Server Error**: Server-side processing errors

### Error Message Format
```json
{
  "error": "Human-readable error message",
  "details": "Additional error context (development mode)",
  "code": "ERROR_CODE_CONSTANT"
}
```

## Performance Considerations

### Database Optimization
- **Indexed Fields**: Optimized queries on commonly searched fields
- **Aggregation Pipelines**: Efficient statistics calculations
- **Community Filtering**: Queries limited to user's community
- **Pagination**: Large result sets split into manageable pages

### Caching Strategy
- **Mobile App**: Local caching for offline access
- **Search Results**: Server-side caching for popular queries
- **User Data**: Session-based caching for dashboard stats
- **Static Data**: Genre and author lists cached per community

### Scalability Features
- **Horizontal Scaling**: Stateless API design
- **Database Sharding**: Community-based data partitioning potential
- **CDN Ready**: Static assets optimized for content delivery
- **Microservice Compatible**: Modular service architecture

## Testing Coverage

### Integration Tests
- **API Endpoints**: Full request/response cycle testing
- **Authentication**: Token validation and user context
- **Database Operations**: CRUD operations and data integrity
- **Business Logic**: Hold placement, conversion, and rental workflows
- **Payment Processing**: Wallet operations and payment gateway simulation

### Unit Tests
- **Service Layer**: Individual function testing with mocks
- **Validation Logic**: Input validation and business rules
- **Calculation Functions**: Rental cost and fee calculations
- **Utility Functions**: Currency formatting and date handling
- **Error Handling**: Exception scenarios and edge cases

### Test Commands
```bash
# Run all borrower tests
npm run test:borrower
npm run test:borrower-service

# Run specific test suites
npm test -- --grep "search books"
npm test -- --grep "wallet operations"
```

## Future Enhancements

### Planned Features
1. **Wishlist System**: Save books for future rental
2. **Review and Ratings**: Rate books and publishers
3. **Reading History**: Track completed rentals
4. **Recommendation Engine**: Personalized book suggestions
5. **Social Features**: Share recommendations with community
6. **Mobile Notifications**: Push notifications for due dates and holds
7. **Advanced Search**: Full-text search with highlighting
8. **Offline Mode**: Enhanced offline functionality for mobile

### Technical Improvements
1. **Real-time Updates**: WebSocket integration for live updates
2. **Advanced Analytics**: Usage patterns and reading statistics
3. **Payment Options**: Additional payment gateway integrations
4. **Multi-language Support**: Internationalization framework
5. **Accessibility**: Enhanced accessibility features
6. **Performance Monitoring**: Application performance insights

## Deployment and Configuration

### Environment Variables
```bash
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api

# Payment Gateway (Development)
PAYMENT_GATEWAY_TEST_MODE=true
PAYMENT_GATEWAY_SECRET_KEY=sk_test_...

# Feature Flags
ENABLE_WALLET_FEATURES=true
ENABLE_HOLD_SYSTEM=true
MAX_HOLD_DAYS=3
LATE_FEE_PER_DAY=0.50
```

### Production Considerations
- **SSL/TLS**: HTTPS required for payment processing
- **Rate Limiting**: API request throttling
- **Monitoring**: Error tracking and performance monitoring
- **Backup Strategy**: Database backup and recovery procedures
- **Load Balancing**: Multi-instance deployment support

This comprehensive borrower feature set provides a complete library rental experience within community boundaries, with robust search capabilities, secure payment processing, and intuitive user interfaces across web and mobile platforms.
