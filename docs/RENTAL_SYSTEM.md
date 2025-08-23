# Rental & Fine System Documentation

## Overview

The rental and fine system provides comprehensive functionality for managing book rentals, calculating costs, processing returns, and handling late fees. This system ensures automatic financial processing through wallet integration and provides detailed reporting for all stakeholders.

## Features

### Core Rental Operations

#### 1. Book Checkout
- **Purpose**: Convert approved book requests into active rentals
- **Process**:
  - Validates request approval status
  - Calculates total rental cost based on daily rate and duration
  - Verifies borrower has sufficient wallet balance
  - Debits borrower's wallet and credits publisher's earnings
  - Updates request status to active rental
  - Marks book as rented with due date

#### 2. Book Return
- **Purpose**: Process book returns and calculate final charges
- **Process**:
  - Calculates late fees if returned after due date
  - Debits additional late fees from borrower if applicable
  - Credits late fees to publisher (100% of late fees)
  - Updates rental status to completed
  - Marks book as available again

#### 3. Cost Calculation
- **Base Cost**: Daily rate × Number of rental days
- **Late Fees**: Days overdue × Late fee rate (default: $0.50/day)
- **Publisher Share**: 90% of base rental cost + 100% of late fees
- **Platform Fee**: 10% of base rental cost

### Financial Management

#### Automatic Wallet Processing
```javascript
// Rental payment flow
const rentalCost = dailyRate * rentalDays;
const publisherShare = rentalCost * 0.9; // 90% to publisher
const platformFee = rentalCost * 0.1;    // 10% platform fee

// Late fee flow
const lateFees = daysOverdue * lateFeeRate;
// 100% of late fees go to publisher
```

#### Transaction Tracking
- All wallet transactions are recorded with:
  - Type (debit/credit)
  - Amount
  - Description
  - Related request ID
  - Timestamp
  - Status

### Reporting & Analytics

#### For Borrowers
- **Rental History**: Complete list of past and current rentals
- **Cost Breakdown**: Detailed breakdown of charges for each rental
- **Summary Statistics**: Total spent, active rentals, late fees paid
- **Receipt Generation**: Detailed receipts for each rental

#### For Publishers
- **Earnings Report**: Revenue from all book rentals
- **Earnings Breakdown**: Base earnings vs. late fee earnings
- **Book Analytics**: Performance metrics per book
- **Date Filtering**: Filter earnings by date range

#### For Administrators
- **Overdue Monitoring**: List of all overdue rentals
- **Late Fee Processing**: Bulk processing of accrued late fees
- **System Analytics**: Overall platform performance

## API Endpoints

### Rental Operations

#### Checkout Book
```http
POST /api/rental/checkout/:requestId
Authorization: Bearer <publisher_token>
```

#### Return Book
```http
POST /api/rental/return/:requestId
Authorization: Bearer <token>
Content-Type: application/json

{
  "returnDate": "2024-01-15T10:00:00Z"
}
```

### Rental History & Reports

#### Borrower Rental History
```http
GET /api/rental/history?page=1&limit=20
Authorization: Bearer <borrower_token>
```

#### Publisher Earnings
```http
GET /api/rental/earnings?page=1&limit=20&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <publisher_token>
```

#### Overdue Rentals (Admin)
```http
GET /api/rental/overdue
Authorization: Bearer <admin_token>
```

### Utility Endpoints

#### Calculate Rental Cost
```http
POST /api/rental/calculate-cost
Content-Type: application/json

{
  "pricePerDay": 2.50,
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-08T00:00:00Z"
}
```

#### Get Late Fee Rate
```http
GET /api/rental/late-fee-rate
```

## Data Models

### Rental Information in BookRequest
```javascript
rental: {
  status: String, // 'pending', 'active', 'completed', 'overdue'
  actualStartDate: Date,
  actualEndDate: Date,
  checkedOutDate: Date,
  returnedDate: Date,
  lateFees: Number,
  totalCost: Number,
  lastLateFeeUpdate: Date
}
```

### Payment Information
```javascript
payment: {
  amount: Number,
  status: String, // 'pending', 'completed', 'failed'
  processedDate: Date,
  method: String // 'wallet'
}
```

### Cost Breakdown Response
```javascript
costBreakdown: {
  dailyRate: Number,
  rentalDays: Number,
  baseCost: Number,
  lateFees: Number,
  totalCost: Number,
  returnStatus: String, // 'on-time', 'late'
  daysLate: Number
}
```

## Business Rules

### Rental Duration
- Minimum rental period: 1 day
- Maximum rental period: Configurable per book (default: 14 days)
- Partial days are rounded up to full days

### Late Fee Calculation
- Late fees accrue daily after due date
- Default rate: $0.50 per day
- Configurable via environment variable `LATE_FEE_PER_DAY`
- Late fees must be paid before book can be returned

### Revenue Sharing
- **Base Rental**: 90% to publisher, 10% platform fee
- **Late Fees**: 100% to publisher
- All payments processed through wallet system

### Wallet Balance Requirements
- Borrower must have sufficient balance for full rental cost at checkout
- Additional balance required for late fees at return
- Failed payments prevent rental completion

## Error Handling

### Common Error Scenarios
1. **Insufficient Balance**: Borrower wallet balance too low
2. **Invalid Request**: Request not found or not approved
3. **Already Processed**: Rental already completed
4. **Unauthorized Access**: User doesn't own the book/rental

### Error Response Format
```javascript
{
  "success": false,
  "message": "Detailed error description"
}
```

## Security Considerations

### Authorization
- Publishers can only checkout books they own
- Borrowers can only return their own rentals
- Admins have access to all rental operations
- All endpoints require valid JWT authentication

### Data Validation
- All monetary amounts validated and rounded to 2 decimal places
- Date validations ensure logical rental periods
- Request status validation prevents invalid state transitions

## Performance Optimizations

### Database Queries
- Efficient aggregation pipelines for summary statistics
- Indexed queries on common search fields
- Pagination support for large datasets

### Caching Considerations
- Late fee rates cached to reduce calculations
- Summary statistics cached with appropriate TTL
- Book availability status updated in real-time

## Monitoring & Alerts

### Key Metrics
- Average rental duration
- Late return rate
- Revenue per book
- Platform fee collection
- Wallet transaction volume

### System Health
- Overdue rental count
- Failed payment attempts
- Wallet balance distribution
- API response times

## Testing Strategy

### Unit Tests
- Cost calculation logic
- Late fee algorithms
- Date/time utilities
- Wallet transaction processing

### Integration Tests
- Complete rental workflow
- Payment processing
- Error handling
- API endpoint validation

### Test Coverage
- All service methods tested
- Error scenarios covered
- Edge cases validated
- Performance benchmarks established

## Future Enhancements

### Planned Features
1. **Automated Notifications**: Email/SMS for due dates and overdue books
2. **Dynamic Pricing**: Peak hour or seasonal pricing adjustments
3. **Bulk Operations**: Multi-book rentals and returns
4. **Rental Extensions**: Allow borrowers to extend rental periods
5. **Payment Gateway Integration**: Alternative payment methods
6. **Advanced Analytics**: Predictive analytics and recommendation engine

### Scalability Considerations
- Database sharding for high-volume transactions
- Async processing for bulk operations
- Real-time notification system
- Advanced caching strategies
