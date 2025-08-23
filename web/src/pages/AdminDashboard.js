import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tabs,
  Tab,
  Badge,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  People,
  PersonAdd,
  Block,
  CheckCircle,
  Cancel,
  Visibility,
  Refresh
} from '@mui/icons-material';
import axios from 'axios';

const AdminDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailDialog, setUserDetailDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes] = await Promise.all([
        axios.get('/api/admin/dashboard'),
        axios.get('/api/admin/users/pending')
      ]);
      
      setStats(statsRes.data.data);
      setPendingUsers(pendingRes.data.data.users);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/users');
      setAllUsers(response.data.data.users);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 1 && allUsers.length === 0) {
      loadAllUsers();
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      await axios.put(`/api/admin/users/${userId}/approve`);
      setSuccess('User approved successfully');
      loadDashboardData();
    } catch (err) {
      setError('Failed to approve user');
    }
  };

  const handleRejectUser = async () => {
    if (!selectedUser || !rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    try {
      await axios.put(`/api/admin/users/${selectedUser._id}/reject`, {
        reason: rejectionReason
      });
      setSuccess('User rejected successfully');
      setRejectDialog(false);
      setRejectionReason('');
      setSelectedUser(null);
      loadDashboardData();
    } catch (err) {
      setError('Failed to reject user');
    }
  };

  const handleBlockUser = async (userId, isBlocked) => {
    try {
      const endpoint = isBlocked ? 'block' : 'unblock';
      await axios.put(`/api/admin/users/${userId}/${endpoint}`);
      setSuccess(`User ${isBlocked ? 'blocked' : 'unblocked'} successfully`);
      if (tabValue === 1) {
        loadAllUsers();
      }
    } catch (err) {
      setError(`Failed to ${isBlocked ? 'block' : 'unblock'} user`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const StatCard = ({ title, value, icon, color = 'primary' }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="h2">
              {value}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const UserDetailsDialog = () => (
    <Dialog 
      open={userDetailDialog} 
      onClose={() => setUserDetailDialog(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>User Details</DialogTitle>
      <DialogContent>
        {selectedUser && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {selectedUser.fullName}
            </Typography>
            <Typography><strong>Email:</strong> {selectedUser.email}</Typography>
            <Typography><strong>Phone:</strong> {selectedUser.phoneNumber}</Typography>
            <Typography><strong>Parent Name:</strong> {selectedUser.parentName}</Typography>
            <Typography><strong>Community:</strong> {selectedUser.communityName}</Typography>
            <Typography><strong>Role(s):</strong> {selectedUser.persona.join(', ')}</Typography>
            <Typography><strong>Registered:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</Typography>
            <Typography><strong>Status:</strong> 
              <Chip 
                label={selectedUser.approvalStatus} 
                color={getStatusColor(selectedUser.approvalStatus)}
                size="small"
                sx={{ ml: 1 }}
              />
            </Typography>
            {selectedUser.rejectionReason && (
              <Typography><strong>Rejection Reason:</strong> {selectedUser.rejectionReason}</Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setUserDetailDialog(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  const RejectDialog = () => (
    <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)}>
      <DialogTitle>Reject User Application</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Please provide a reason for rejecting this user's application:
        </Typography>
        <TextField
          autoFocus
          margin="dense"
          label="Rejection Reason"
          fullWidth
          multiline
          rows={3}
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setRejectDialog(false)}>Cancel</Button>
        <Button onClick={handleRejectUser} variant="contained" color="error">
          Reject User
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (loading && !stats) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {stats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Users"
                value={stats.totalUsers}
                icon={<People />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Pending Approval"
                value={stats.pendingUsers}
                icon={<PersonAdd />}
                color="warning"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Approved Users"
                value={stats.approvedUsers}
                icon={<CheckCircle />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Today's Registrations"
                value={stats.todayRegistrations}
                icon={<PersonAdd />}
                color="info"
              />
            </Grid>
          </Grid>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab 
              label={
                <Badge badgeContent={stats?.pendingUsers} color="error">
                  Pending Approvals
                </Badge>
              } 
            />
            <Tab label="All Users" />
          </Tabs>
        </Box>

        {tabValue === 0 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Community</TableCell>
                  <TableCell>Role(s)</TableCell>
                  <TableCell>Registered</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2 }}>
                          {user.fullName.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {user.fullName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Parent: {user.parentName}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{user.email}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {user.phoneNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>{user.communityName}</TableCell>
                    <TableCell>
                      {user.persona.map((role) => (
                        <Chip
                          key={role}
                          label={role}
                          size="small"
                          sx={{ mr: 0.5 }}
                        />
                      ))}
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedUser(user);
                            setUserDetailDialog(true);
                          }}
                        >
                          <Visibility />
                        </IconButton>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleApproveUser(user._id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => {
                            setSelectedUser(user);
                            setRejectDialog(true);
                          }}
                        >
                          Reject
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {pendingUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body1" color="textSecondary">
                        No pending users for approval
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tabValue === 1 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Role(s)</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2 }}>
                          {user.fullName.charAt(0)}
                        </Avatar>
                        <Typography variant="subtitle2">
                          {user.fullName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{user.email}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {user.phoneNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.approvalStatus}
                        color={getStatusColor(user.approvalStatus)}
                        size="small"
                      />
                      {user.isBlocked && (
                        <Chip
                          label="Blocked"
                          color="error"
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {user.persona.map((role) => (
                        <Chip
                          key={role}
                          label={role}
                          size="small"
                          sx={{ mr: 0.5 }}
                        />
                      ))}
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedUser(user);
                            setUserDetailDialog(true);
                          }}
                        >
                          <Visibility />
                        </IconButton>
                        {user.approvalStatus === 'approved' && (
                          <Button
                            size="small"
                            variant="outlined"
                            color={user.isBlocked ? 'success' : 'error'}
                            onClick={() => handleBlockUser(user._id, !user.isBlocked)}
                          >
                            {user.isBlocked ? 'Unblock' : 'Block'}
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {allUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body1" color="textSecondary">
                        No users found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <UserDetailsDialog />
      <RejectDialog />
    </Container>
  );
};

export default AdminDashboard;
