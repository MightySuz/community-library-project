import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  AccountCircle,
  Notifications,
  Menu as MenuIcon,
  Book,
  Dashboard,
  Settings,
  ExitToApp
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useNotifications } from '../hooks/useRealTimeNotifications';

const Navbar = ({ onNotificationClick }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Get notification state
  const { unreadCount, isConnected } = useNotifications();
  
  // Mock user state (replace with actual auth context)
  const [user, setUser] = useState({
    name: 'John Doe',
    role: 'borrower',
    isAuthenticated: true
  });

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    // Handle logout logic
    setUser({ ...user, isAuthenticated: false });
    handleMenuClose();
    navigate('/login');
  };

  const navigationItems = [
    { label: 'Home', path: '/', icon: <Book /> },
    { label: 'Books', path: '/books', icon: <Book /> },
    { label: 'Dashboard', path: '/dashboard', icon: <Dashboard /> }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        {/* Logo and Title */}
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <Book />
          Community Library
        </Typography>

        {/* Navigation Links (Desktop) */}
        {!isMobile && (
          <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
            {navigationItems.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                color="inherit"
                startIcon={item.icon}
                sx={{
                  backgroundColor: isActive(item.path) ? 'rgba(255,255,255,0.1)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        )}

        {/* User Actions */}
        {user.isAuthenticated ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Notification Button */}
            <IconButton
              color="inherit"
              onClick={onNotificationClick}
              sx={{ mr: 1 }}
            >
              <Badge 
                badgeContent={unreadCount} 
                color="error"
                variant={unreadCount > 0 ? 'standard' : 'dot'}
                invisible={unreadCount === 0}
              >
                <Notifications 
                  sx={{ 
                    color: isConnected ? 'inherit' : 'rgba(255,255,255,0.5)' 
                  }} 
                />
              </Badge>
            </IconButton>

            {/* Profile Menu */}
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls="primary-search-account-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
                <AccountCircle sx={{ mr: 1 }} />
                Profile
              </MenuItem>
              <MenuItem onClick={() => { navigate('/settings'); handleMenuClose(); }}>
                <Settings sx={{ mr: 1 }} />
                Settings
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ExitToApp sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              color="inherit" 
              component={Link} 
              to="/login"
              variant={isActive('/login') ? 'outlined' : 'text'}
            >
              Login
            </Button>
            <Button 
              color="inherit" 
              component={Link} 
              to="/register"
              variant={isActive('/register') ? 'outlined' : 'text'}
            >
              Register
            </Button>
          </Box>
        )}

        {/* Mobile Menu Button */}
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <MenuIcon />
          </IconButton>
        )}
      </Toolbar>

      {/* Mobile Navigation Menu */}
      {isMobile && mobileMenuOpen && (
        <Box sx={{ backgroundColor: theme.palette.primary.dark }}>
          {navigationItems.map((item) => (
            <Button
              key={item.path}
              component={Link}
              to={item.path}
              color="inherit"
              startIcon={item.icon}
              fullWidth
              sx={{
                justifyContent: 'flex-start',
                py: 1,
                backgroundColor: isActive(item.path) ? 'rgba(255,255,255,0.1)' : 'transparent',
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      )}
    </AppBar>
  );
};

export default Navbar;
