# Community Library - Admin Dashboard

This document describes the comprehensive administrator controls implemented for the Community Library Management System.

## Overview

The admin dashboard provides full control over users, books, transactions, wallet management, and system configuration. It includes both web and mobile interfaces with the same functionality.

## Features Implemented

### 1. Dashboard Overview
- **Total Statistics**: Users, books, active rentals, overdue books
- **Pending Approvals**: Users and books awaiting approval
- **Financial Summary**: Total fines and revenue
- **Real-time Updates**: Refreshable statistics

### 2. User Management
- **Pending Registrations**: View and manage user approval queue
- **User Actions**:
  - Approve new user registrations
  - Reject registrations with reasons
  - Block/unblock existing users
  - Deactivate user accounts
- **User Details**: View complete user profiles and history

### 3. Book Management
- **Pending Books**: Review books submitted by publishers
- **Book Actions**:
  - Approve book submissions
  - Reject with detailed reasons
  - Deactivate existing books
- **Book Catalog**: Full book management with filters

### 4. Transaction Reports
- **Rental Transactions**: Complete rental history
- **Fine Transactions**: All fine assessments and payments
- **Payment Records**: Wallet deposits and withdrawals
- **Filter Options**: By date, user, transaction type, and amount

### 5. Wallet Management
- **Balance Overview**: All user wallet balances
- **Analytics**: Total deposited, spent, and fines per user
- **Status Monitoring**: Active, frozen, and suspended wallets
- **Low Balance Alerts**: Identify users with insufficient funds

### 6. Fine Configuration
Comprehensive fine management system:
- **Overdue Fines**: Configurable daily fine amount
- **Grace Period**: Days before fines start accruing
- **Damage Fines**: Percentage of book value for damages
- **Lost Book Fines**: Multiplier of book value for lost items

### 7. System Reports
- **Overdue Books**: Books past due date with fine calculations
- **Activity Logs**: System-wide activity tracking
- **Export Functions**: Download reports in various formats

## Technical Implementation

### Backend Architecture

#### Models
- **Book**: Enhanced with approval workflow and availability tracking
- **Transaction**: Comprehensive transaction logging with reporting
- **Wallet**: User wallet management with analytics
- **SystemConfig**: Configurable system settings

#### Services
- **adminService**: Core admin operations for users and books
- **adminConfigService**: Configuration management and reporting

#### Routes
- **admin.js**: User and book management endpoints
- **adminReports.js**: Reporting and configuration endpoints

### Frontend Implementation

#### Web Dashboard (`AdminReportsPage.js`)
- **Material-UI**: Professional admin interface
- **Tabbed Navigation**: Organized feature access
- **Real-time Data**: Live updates and refresh capabilities
- **Form Management**: Configuration dialogs and user actions

#### Mobile Dashboard (`AdminDashboardScreen.js`)
- **React Native**: Native mobile admin interface
- **Responsive Design**: Optimized for mobile use
- **Touch-friendly**: Large buttons and intuitive navigation
- **Offline Capability**: Cached data for offline viewing

### API Endpoints

#### Dashboard
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/dashboard/system-stats` - System health
- `GET /api/admin/dashboard/community-stats` - Community metrics

#### User Management
- `GET /api/admin/users/pending` - Pending user registrations
- `POST /api/admin/users/:id/approve` - Approve user
- `POST /api/admin/users/:id/reject` - Reject user
- `POST /api/admin/users/:id/block` - Block user
- `POST /api/admin/users/:id/deactivate` - Deactivate user

#### Book Management
- `GET /api/admin/books/pending` - Pending book approvals
- `POST /api/admin/books/:id/approve` - Approve book
- `POST /api/admin/books/:id/reject` - Reject book
- `POST /api/admin/books/:id/deactivate` - Deactivate book

#### Reports
- `GET /api/admin/reports/transactions` - Transaction reports
- `GET /api/admin/reports/wallets` - Wallet reports
- `GET /api/admin/reports/overdue` - Overdue book reports
- `GET /api/admin/reports/fines` - Fine reports
- `GET /api/admin/reports/activity-logs` - Activity logs

#### Configuration
- `GET /api/admin/config/fines` - Get fine configuration
- `PUT /api/admin/config/fines` - Update fine configuration
- `GET /api/admin/config/rental` - Get rental configuration
- `PUT /api/admin/config/rental` - Update rental configuration

## Testing

### Integration Tests
Comprehensive test suite covering:
- **Authentication**: Admin access control
- **User Management**: All user operations
- **Book Management**: Book approval workflow
- **Reports**: Data retrieval and filtering
- **Configuration**: Settings management

### Test Commands
```bash
npm test                    # Run all tests
npm run test:admin         # Run admin-specific tests
npm run test:coverage      # Run tests with coverage
npm run test:watch         # Watch mode for development
```

## Security Features

### Authorization
- **Role-based Access**: Admin-only endpoints
- **JWT Authentication**: Secure token validation
- **Request Validation**: Input sanitization and validation

### Data Protection
- **Activity Logging**: All admin actions tracked
- **Audit Trail**: Complete action history
- **Data Encryption**: Sensitive data protection

## Configuration Options

### Fine Configuration
```javascript
{
  overdue_fine_per_day: 1.0,      // Daily fine amount
  grace_period_days: 3,           // Days before fines start
  damage_fine_percentage: 50,     // Percentage for damage
  lost_book_multiplier: 2         // Multiplier for lost books
}
```

### Rental Configuration
```javascript
{
  max_rental_period_days: 14,     // Maximum rental period
  max_renewals: 2,                // Maximum renewals allowed
  renewal_period_days: 7,         // Days for each renewal
  max_concurrent_rentals: 3       // Max books per user
}
```

### Wallet Configuration
```javascript
{
  min_balance_warning: 10,        // Low balance threshold
  max_balance_limit: 1000,        // Maximum wallet balance
  auto_reload_enabled: false,     // Auto-reload feature
  auto_reload_amount: 50          // Auto-reload amount
}
```

## Usage Examples

### Approving a User
1. Navigate to "Users" tab
2. Review pending registrations
3. Click "Approve" or "Reject"
4. Add rejection reason if needed
5. User receives notification

### Configuring Fines
1. Go to "Fine Configuration" tab
2. Click "Edit Configuration"
3. Update fine amounts and periods
4. Save changes
5. New settings apply immediately

### Generating Reports
1. Select "Transaction Reports" tab
2. Apply filters (date, type, user)
3. View results in table
4. Export data if needed

## Future Enhancements

### Planned Features
- **Bulk Operations**: Mass approve/reject actions
- **Advanced Analytics**: Detailed usage statistics
- **Automated Notifications**: System-triggered alerts
- **Role Management**: Granular permission system
- **Backup/Restore**: Data backup functionality

### Integration Opportunities
- **Email Integration**: Automated email notifications
- **SMS Alerts**: Text message notifications
- **Payment Gateway**: Online payment processing
- **Calendar Integration**: Due date management

## Troubleshooting

### Common Issues
1. **Access Denied**: Ensure admin role and valid token
2. **Data Not Loading**: Check network connection and API status
3. **Configuration Errors**: Validate input data types
4. **Export Issues**: Verify data availability and filters

### Debugging
- Check browser console for errors
- Verify API endpoint responses
- Review server logs for backend issues
- Test with minimal data set

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.

---

*Last updated: December 2024*
