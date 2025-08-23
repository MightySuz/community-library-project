import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  Book,
  Notifications,
  AccountBalanceWallet,
  TrendingUp,
  Schedule,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import NotificationCenter from '../components/NotificationCenter';
import NotificationPreferences from '../components/NotificationPreferences';

const DashboardPage = () => {
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  // Mock user data
  const user = {
    name: 'Demo User',
    email: 'demo@communitylibrary.com',
    role: 'borrower',
    joinDate: 'January 2024',
    avatar: '/api/placeholder/64/64'
  };

  // Mock dashboard data
  const stats = {
    booksRented: 12,
    booksReturned: 10,
    walletBalance: 45.50,
    pendingReturns: 2
  };

  const recentActivity = [
    { id: 1, action: 'Rented "The Great Gatsby"', date: '2024-08-20', status: 'active' },
    { id: 2, action: 'Returned "To Kill a Mockingbird"', date: '2024-08-18', status: 'completed' },
    { id: 3, action: 'Added $25 to wallet', date: '2024-08-15', status: 'completed' },
    { id: 4, action: 'Rented "1984"', date: '2024-08-12', status: 'active' }
  ];

  const currentRentals = [
    {
      id: 1,
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      dueDate: '2024-08-25',
      daysLeft: 3,
      status: 'due-soon'
    },
    {
      id: 2,
      title: '1984',
      author: 'George Orwell',
      dueDate: '2024-08-30',
      daysLeft: 8,
      status: 'active'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'due-soon': return 'warning';
      case 'overdue': return 'error';
      case 'active': return 'success';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Welcome back, {user.name}! 👋
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Here's what's happening with your library account
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Notifications />}
              onClick={() => setNotificationCenterOpen(true)}
            >
              Notifications
            </Button>
            <Button
              variant="outlined"
              onClick={() => setShowPreferences(true)}
            >
              Settings
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Book sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" color="primary.main">
                  {stats.booksRented}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Books Rented
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" color="success.main">
                  {stats.booksReturned}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Books Returned
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <AccountBalanceWallet sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Typography variant="h4" color="info.main">
                  ${stats.walletBalance}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Wallet Balance
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Schedule sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" color="warning.main">
                  {stats.pendingReturns}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Returns
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Current Rentals */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Current Rentals
              </Typography>
              {currentRentals.map((rental) => (
                <Box key={rental.id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {rental.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        by {rental.author}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Due: {rental.dueDate} ({rental.daysLeft} days left)
                      </Typography>
                    </Box>
                    <Chip
                      label={rental.status === 'due-soon' ? 'Due Soon' : 'Active'}
                      color={getStatusColor(rental.status)}
                      size="small"
                    />
                  </Box>
                  {rental.status === 'due-soon' && (
                    <LinearProgress
                      variant="determinate"
                      value={70}
                      color="warning"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
              ))}
              <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
                View All Rentals
              </Button>
            </Paper>

            {/* Recent Activity */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              {recentActivity.map((activity) => (
                <Box key={activity.id} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: 'primary.main' }}>
                    <Book sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2">
                      {activity.action}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {activity.date}
                    </Typography>
                  </Box>
                  <Chip
                    label={activity.status}
                    size="small"
                    color={activity.status === 'completed' ? 'success' : 'primary'}
                  />
                </Box>
              ))}
            </Paper>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button variant="contained" fullWidth startIcon={<Book />}>
                  Browse Books
                </Button>
                <Button variant="outlined" fullWidth startIcon={<AccountBalanceWallet />}>
                  Add Funds
                </Button>
                <Button variant="outlined" fullWidth startIcon={<TrendingUp />}>
                  View Reports
                </Button>
                <Button variant="outlined" fullWidth startIcon={<Notifications />}>
                  Manage Notifications
                </Button>
              </Box>
            </Paper>

            {/* Profile Summary */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Profile Summary
              </Typography>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Avatar
                  sx={{ width: 64, height: 64, mx: 'auto', mb: 1 }}
                  src={user.avatar}
                  alt={user.name}
                >
                  {user.name.charAt(0)}
                </Avatar>
                <Typography variant="subtitle1" fontWeight="bold">
                  {user.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
                <Chip
                  label={user.role}
                  size="small"
                  color="primary"
                  sx={{ mt: 1, textTransform: 'capitalize' }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                Member since {user.joinDate}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Notification Center */}
        <NotificationCenter
          isOpen={notificationCenterOpen}
          onClose={() => setNotificationCenterOpen(false)}
        />

        {/* Notification Preferences Modal */}
        {showPreferences && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(0,0,0,0.5)',
              zIndex: 1300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => setShowPreferences(false)}
          >
            <Box
              sx={{
                maxWidth: 600,
                width: '90%',
                maxHeight: '90%',
                overflow: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <NotificationPreferences />
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={() => setShowPreferences(false)}
                >
                  Close
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default DashboardPage;
