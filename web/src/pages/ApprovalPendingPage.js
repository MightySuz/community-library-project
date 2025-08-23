import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  CheckCircle,
  HourglassEmpty,
  Email,
  Phone,
  AdminPanelSettings,
  Home
} from '@mui/icons-material';

const ApprovalPendingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user should be here (has completed verification)
    const userVerified = sessionStorage.getItem('userVerified');
    if (!userVerified) {
      navigate('/register');
    }
  }, [navigate]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleCheckStatus = () => {
    // This would typically check the user's current status
    // For now, just show a message
    alert('Your approval status hasn\'t changed yet. Please wait for admin review.');
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          {/* Success Header */}
          <Box textAlign="center" sx={{ mb: 4 }}>
            <CheckCircle 
              sx={{ fontSize: 80, color: 'success.main', mb: 2 }} 
            />
            <Typography component="h1" variant="h4" gutterBottom>
              Verification Complete!
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Your account is now pending admin approval
            </Typography>
          </Box>

          {/* Progress Indicator */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Registration Progress
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={66} 
                sx={{ mb: 2, height: 8, borderRadius: 4 }}
              />
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Account Created" 
                    secondary="Your basic information has been saved"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Email color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Email Verified" 
                    secondary="Your email address has been confirmed"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Phone color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Phone Verified" 
                    secondary="Your phone number has been confirmed"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <HourglassEmpty color="warning" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Admin Approval Pending" 
                    secondary="An administrator will review your application"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* What's Next */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                What happens next?
              </Typography>
              <Typography variant="body1" paragraph>
                Your application is now in the admin review queue. Here's what you can expect:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <AdminPanelSettings />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Admin Review" 
                    secondary="An administrator will review your profile and information"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Email />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Notification" 
                    secondary="You'll receive an email and SMS when your account is approved"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Account Activation" 
                    secondary="Once approved, you can login and start using Community Library"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Estimated Timeline */}
          <Box 
            sx={{ 
              p: 2, 
              bgcolor: 'primary.light', 
              borderRadius: 2, 
              color: 'primary.contrastText',
              mb: 4
            }}
          >
            <Typography variant="h6" gutterBottom>
              ⏱️ Estimated Review Time
            </Typography>
            <Typography variant="body1">
              Most applications are reviewed within <strong>24-48 hours</strong>. 
              You'll be notified immediately once your account is approved.
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 2, 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}
          >
            <Button
              variant="contained"
              startIcon={<Home />}
              onClick={handleGoHome}
            >
              Go to Homepage
            </Button>
            <Button
              variant="outlined"
              onClick={handleCheckStatus}
            >
              Check Status
            </Button>
          </Box>

          {/* Contact Info */}
          <Box mt={4} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Questions about your application?<br />
              Contact us at{' '}
              <a href="mailto:support@communitylibrary.com" style={{ textDecoration: 'none' }}>
                support@communitylibrary.com
              </a>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ApprovalPendingPage;
