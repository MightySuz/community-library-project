import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Book,
  AccountBalance,
  AttachMoney,
  TrendingUp,
  People,
  PersonAdd,
  LibraryBooks,
  Schedule,
  Settings,
  Visibility,
  CheckCircle,
  Cancel,
  Block,
  Edit,
  FilterList,
  Download,
  Refresh
} from '@mui/icons-material';
import axios from 'axios';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Transaction Reports State
  const [transactions, setTransactions] = useState([]);
  const [transactionFilters, setTransactionFilters] = useState({
    status: '',
    overdue: false,
    dateFrom: null,
    dateTo: null
  });

  // Overdue Books State
  const [overdueBooks, setOverdueBooks] = useState([]);

  // Wallet Reports State
  const [walletReports, setWalletReports] = useState([]);
  const [walletFilters, setWalletFilters] = useState({
    status: '',
    lowBalance: false
  });

  // Fine Configuration State
  const [fineConfig, setFineConfig] = useState({});
  const [fineConfigDialog, setFineConfigDialog] = useState(false);
  const [fineConfigForm, setFineConfigForm] = useState({
    overdue_fine_per_day: '',
    damage_fine_percentage: '',
    lost_book_multiplier: '',
    grace_period_days: ''
  });

  // Book Management State
  const [pendingBooks, setPendingBooks] = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [bookFilters, setBookFilters] = useState({
    approvalStatus: '',
    genre: '',
    availability: ''
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 1) {
      loadTransactionReports();
    } else if (activeTab === 2) {
      loadWalletReports();
    } else if (activeTab === 3) {
      loadFineConfiguration();
    } else if (activeTab === 4) {
      loadBookManagement();
    }
  }, [activeTab]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/dashboard');
      setDashboardStats(response.data.data);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactionReports = async () => {
    setLoading(true);
    try {
      const [transactionsRes, overdueRes] = await Promise.all([
        axios.get('/api/admin/reports/transactions', { params: transactionFilters }),
        axios.get('/api/admin/reports/overdue')
      ]);
      
      setTransactions(transactionsRes.data.data.transactions);
      setOverdueBooks(overdueRes.data.data.overdueBooks);
    } catch (err) {
      setError('Failed to load transaction reports');
    } finally {
      setLoading(false);
    }
  };

  const loadWalletReports = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/reports/wallets', { params: walletFilters });
      setWalletReports(response.data.data.wallets);
    } catch (err) {
      setError('Failed to load wallet reports');
    } finally {
      setLoading(false);
    }
  };

  const loadFineConfiguration = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/config/fines');
      const configs = response.data.data.configurations;
      
      const configObj = {};
      configs.forEach(config => {
        configObj[config.key] = config.value;
      });
      
      setFineConfig(configObj);
      setFineConfigForm(configObj);
    } catch (err) {
      setError('Failed to load fine configuration');
    } finally {
      setLoading(false);
    }
  };

  const loadBookManagement = async () => {
    setLoading(true);
    try {
      const [pendingRes, allBooksRes] = await Promise.all([
        axios.get('/api/admin/books/pending'),
        axios.get('/api/admin/books', { params: bookFilters })
      ]);
      
      setPendingBooks(pendingRes.data.data.books);
      setAllBooks(allBooksRes.data.data.books);
    } catch (err) {
      setError('Failed to load book management data');
    } finally {
      setLoading(false);
    }
  };

  const handleFineConfigSave = async () => {
    try {
      await axios.put('/api/admin/config/fines', fineConfigForm);
      setSuccess('Fine configuration updated successfully');
      setFineConfigDialog(false);
      loadFineConfiguration();
    } catch (err) {
      setError('Failed to update fine configuration');
    }
  };

  const StatCard = ({ title, value, icon, color = 'primary', subtitle }) => (
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
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ bgcolor: `${color}.main`, color: 'white', p: 2, borderRadius: 2 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const renderDashboard = () => (
    <Box>
      {dashboardStats && (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Users"
                value={dashboardStats.users.totalUsers}
                subtitle={`${dashboardStats.users.todayRegistrations} today`}
                icon={<People />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Books"
                value={dashboardStats.books.totalBooks}
                subtitle={`${dashboardStats.books.pendingApproval} pending`}
                icon={<LibraryBooks />}
                color="secondary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Revenue"
                value={`$${dashboardStats.transactions.totalRevenue.toFixed(2)}`}
                subtitle={`${dashboardStats.transactions.totalTransactions} transactions`}
                icon={<AttachMoney />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Overdue Books"
                value={dashboardStats.transactions.overdueCount}
                subtitle="Require attention"
                icon={<Schedule />}
                color="error"
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    User Distribution
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Publishers</Typography>
                      <Typography fontWeight="bold">
                        {dashboardStats.users.publisherCount}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Borrowers</Typography>
                      <Typography fontWeight="bold">
                        {dashboardStats.users.borrowerCount}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Pending Approval</Typography>
                      <Typography fontWeight="bold" color="warning.main">
                        {dashboardStats.users.pendingUsers}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>Blocked</Typography>
                      <Typography fontWeight="bold" color="error.main">
                        {dashboardStats.users.blockedUsers}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Book Status
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Available</Typography>
                      <Typography fontWeight="bold" color="success.main">
                        {dashboardStats.books.availableBooks}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Currently Borrowed</Typography>
                      <Typography fontWeight="bold">
                        {dashboardStats.books.borrowedBooks}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>Pending Approval</Typography>
                      <Typography fontWeight="bold" color="warning.main">
                        {dashboardStats.books.pendingApproval}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );

  const renderTransactionReports = () => (
    <Box>
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Typography variant="h5">Transaction Reports</Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={transactionFilters.status}
              onChange={(e) => setTransactionFilters({
                ...transactionFilters,
                status: e.target.value
              })}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </Select>
          </FormControl>
          <Button
            startIcon={<Refresh />}
            onClick={loadTransactionReports}
            variant="outlined"
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {overdueBooks.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6">
            {overdueBooks.length} Overdue Books Require Attention
          </Typography>
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Transaction ID</TableCell>
              <TableCell>Book</TableCell>
              <TableCell>Borrower</TableCell>
              <TableCell>Publisher</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction._id}>
                <TableCell>{transaction.transactionId}</TableCell>
                <TableCell>
                  {transaction.book ? transaction.book.title : 'N/A'}
                </TableCell>
                <TableCell>{transaction.borrower.fullName}</TableCell>
                <TableCell>
                  {transaction.publisher ? transaction.publisher.fullName : 'N/A'}
                </TableCell>
                <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip
                    label={transaction.status}
                    color={
                      transaction.status === 'completed' ? 'success' :
                      transaction.status === 'failed' ? 'error' : 'default'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(transaction.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderWalletReports = () => (
    <Box>
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Typography variant="h5">Wallet Reports</Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={walletFilters.status}
              onChange={(e) => setWalletFilters({
                ...walletFilters,
                status: e.target.value
              })}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="frozen">Frozen</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant={walletFilters.lowBalance ? "contained" : "outlined"}
            onClick={() => setWalletFilters({
              ...walletFilters,
              lowBalance: !walletFilters.lowBalance
            })}
          >
            Low Balance Only
          </Button>
          <Button
            startIcon={<Refresh />}
            onClick={loadWalletReports}
            variant="outlined"
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Community</TableCell>
              <TableCell>Balance</TableCell>
              <TableCell>Total Deposited</TableCell>
              <TableCell>Total Spent</TableCell>
              <TableCell>Total Fines</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Transaction</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {walletReports.map((wallet) => (
              <TableRow key={wallet._id}>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2">
                      {wallet.user.fullName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {wallet.user.email}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{wallet.user.communityName}</TableCell>
                <TableCell>
                  <Typography
                    color={wallet.balance < 10 ? 'error' : 'inherit'}
                    fontWeight={wallet.balance < 10 ? 'bold' : 'normal'}
                  >
                    ${wallet.balance.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>${wallet.analytics.totalDeposited.toFixed(2)}</TableCell>
                <TableCell>${wallet.analytics.totalSpent.toFixed(2)}</TableCell>
                <TableCell>${wallet.analytics.totalFines.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip
                    label={wallet.status}
                    color={
                      wallet.status === 'active' ? 'success' :
                      wallet.status === 'frozen' ? 'warning' : 'error'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {wallet.analytics.lastTransactionDate
                    ? new Date(wallet.analytics.lastTransactionDate).toLocaleDateString()
                    : 'Never'
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderFineConfiguration = () => (
    <Box>
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Typography variant="h5">Fine Configuration</Typography>
        <Button
          startIcon={<Edit />}
          onClick={() => setFineConfigDialog(true)}
          variant="contained"
        >
          Edit Configuration
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Overdue Fine Per Day
              </Typography>
              <Typography variant="h4" color="primary">
                ${fineConfig.overdue_fine_per_day || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Amount charged per day for overdue books
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Grace Period
              </Typography>
              <Typography variant="h4" color="primary">
                {fineConfig.grace_period_days || 0} days
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Grace period before fines start
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Damage Fine Percentage
              </Typography>
              <Typography variant="h4" color="warning.main">
                {fineConfig.damage_fine_percentage || 0}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Percentage of book value for damage
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Lost Book Multiplier
              </Typography>
              <Typography variant="h4" color="error.main">
                {fineConfig.lost_book_multiplier || 0}x
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Multiplier of book value for lost books
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={fineConfigDialog} onClose={() => setFineConfigDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Fine Configuration</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Overdue Fine Per Day ($)"
              type="number"
              value={fineConfigForm.overdue_fine_per_day}
              onChange={(e) => setFineConfigForm({
                ...fineConfigForm,
                overdue_fine_per_day: parseFloat(e.target.value)
              })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Grace Period (days)"
              type="number"
              value={fineConfigForm.grace_period_days}
              onChange={(e) => setFineConfigForm({
                ...fineConfigForm,
                grace_period_days: parseInt(e.target.value)
              })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Damage Fine Percentage (%)"
              type="number"
              value={fineConfigForm.damage_fine_percentage}
              onChange={(e) => setFineConfigForm({
                ...fineConfigForm,
                damage_fine_percentage: parseFloat(e.target.value)
              })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Lost Book Multiplier"
              type="number"
              value={fineConfigForm.lost_book_multiplier}
              onChange={(e) => setFineConfigForm({
                ...fineConfigForm,
                lost_book_multiplier: parseFloat(e.target.value)
              })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFineConfigDialog(false)}>Cancel</Button>
          <Button onClick={handleFineConfigSave} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  const renderBookManagement = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Book Management
      </Typography>

      {pendingBooks.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6">
            {pendingBooks.length} Books Pending Approval
          </Typography>
        </Alert>
      )}

      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Typography variant="h6">All Books</Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={bookFilters.approvalStatus}
              onChange={(e) => setBookFilters({
                ...bookFilters,
                approvalStatus: e.target.value
              })}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Availability</InputLabel>
            <Select
              value={bookFilters.availability}
              onChange={(e) => setBookFilters({
                ...bookFilters,
                availability: e.target.value
              })}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="available">Available</MenuItem>
              <MenuItem value="borrowed">Borrowed</MenuItem>
              <MenuItem value="reserved">Reserved</MenuItem>
            </Select>
          </FormControl>
          <Button
            startIcon={<Refresh />}
            onClick={loadBookManagement}
            variant="outlined"
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Book</TableCell>
              <TableCell>Publisher</TableCell>
              <TableCell>Genre</TableCell>
              <TableCell>Approval Status</TableCell>
              <TableCell>Availability</TableCell>
              <TableCell>Added</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allBooks.map((book) => (
              <TableRow key={book._id}>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2">
                      {book.title}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      by {book.author}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      {book.publisher.fullName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {book.publisher.communityName}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{book.genre}</TableCell>
                <TableCell>
                  <Chip
                    label={book.approvalStatus}
                    color={
                      book.approvalStatus === 'approved' ? 'success' :
                      book.approvalStatus === 'rejected' ? 'error' : 'warning'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={book.availability.status}
                    color={
                      book.availability.status === 'available' ? 'success' :
                      book.availability.status === 'borrowed' ? 'error' : 'default'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(book.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton size="small">
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  {book.approvalStatus === 'pending' && (
                    <>
                      <Tooltip title="Approve">
                        <IconButton size="small" color="success">
                          <CheckCircle />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <IconButton size="small" color="error">
                          <Cancel />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Control Center
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

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab label="Dashboard" />
            <Tab label="Transaction Reports" />
            <Tab label="Wallet Reports" />
            <Tab label="Fine Configuration" />
            <Tab label="Book Management" />
          </Tabs>
        </Box>

        {loading && (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        )}

        {!loading && (
          <>
            {activeTab === 0 && renderDashboard()}
            {activeTab === 1 && renderTransactionReports()}
            {activeTab === 2 && renderWalletReports()}
            {activeTab === 3 && renderFineConfiguration()}
            {activeTab === 4 && renderBookManagement()}
          </>
        )}
      </Box>
    </Container>
  );
};

export default AdminReportsPage;
