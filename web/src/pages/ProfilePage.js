import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper
} from '@mui/material';
import {
  Email,
  Phone,
  LocationOn,
  CalendarToday,
  Edit,
  Security,
  Notifications,
  AccountBalanceWallet
} from '@mui/icons-material';

const ProfilePage = () => {
  // Mock user data
  const user = {
    id: 'demo-user',
    name: 'Demo User',
    email: 'demo@communitylibrary.com',
    phone: '+1 (555) 123-4567',
    address: '123 Library Street, Book City, BC 12345',
    joinDate: 'January 15, 2024',
    role: 'Borrower',
    avatar: '/api/placeholder/120/120',
    bio: 'Avid reader and book enthusiast. Love sharing great books with the community!',
    stats: {
      booksRented: 45,
      booksShared: 12,
      rating: 4.8,
      completedTransactions: 57
    }
  };

  const menuItems = [
    {
      title: 'Account Settings',
      description: 'Update your personal information',
      icon: <Edit />,
      action: () => console.log('Edit profile')
    },
    {
      title: 'Security',
      description: 'Change password and security settings',
      icon: <Security />,
      action: () => console.log('Security settings')
    },
    {
      title: 'Notifications',
      description: 'Manage notification preferences',
      icon: <Notifications />,
      action: () => console.log('Notification settings')
    },
    {
      title: 'Wallet & Billing',
      description: 'View wallet balance and transaction history',
      icon: <AccountBalanceWallet />,
      action: () => console.log('Wallet settings')
    }
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Profile
        </Typography>
        
        <Grid container spacing={4}>
          {/* Profile Info */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <Avatar
                  src={user.avatar}
                  alt={user.name}
                  sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                >
                  {user.name.charAt(0)}
                </Avatar>
                
                <Typography variant="h5" gutterBottom>
                  {user.name}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {user.role}
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 3 }}>
                  {user.bio}
                </Typography>
                
                <Button variant="contained" fullWidth sx={{ mb: 2 }}>
                  Edit Profile
                </Button>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Contact Info */}
                <Box sx={{ textAlign: 'left' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Email sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">{user.email}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Phone sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">{user.phone}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationOn sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">{user.address}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarToday sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">Joined {user.joinDate}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Activity Stats
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary.main">
                        {user.stats.booksRented}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Books Rented
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {user.stats.booksShared}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Books Shared
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {user.stats.rating}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Rating
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="info.main">
                        {user.stats.completedTransactions}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Completed
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Settings Menu */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Account Settings
              </Typography>
              
              <List>
                {menuItems.map((item, index) => (
                  <React.Fragment key={index}>
                    <ListItem
                      button
                      onClick={item.action}
                      sx={{
                        borderRadius: 1,
                        mb: 1,
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                    >
                      <ListItemIcon>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.title}
                        secondary={item.description}
                      />
                    </ListItem>
                    {index < menuItems.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>

            {/* Recent Activity */}
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemText
                    primary="Rented 'The Great Gatsby'"
                    secondary="August 20, 2024"
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Returned 'To Kill a Mockingbird'"
                    secondary="August 18, 2024"
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Added $25.00 to wallet"
                    secondary="August 15, 2024"
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Profile updated"
                    secondary="August 12, 2024"
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default ProfilePage;
