import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Pagination,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tab,
  Tabs,
  Avatar,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Star as StarIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  MenuBook as BookIcon,
  Visibility as ViewIcon,
  Hold as HoldIcon,
  Cancel as CancelIcon,
  AccountBalanceWallet as WalletIcon,
  TrendingUp as TrendingIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import borrowerService from '../services/borrowerService';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`borrower-tabpanel-${index}`}
      aria-labelledby={`borrower-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function BorrowerDashboard() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dashboard data
  const [dashboardStats, setDashboardStats] = useState({});
  const [books, setBooks] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });

  // Search and filter state
  const [searchFilters, setSearchFilters] = useState({
    search: '',
    genre: '',
    author: '',
    publisher: '',
    minPrice: '',
    maxPrice: '',
    availability: '',
    sortBy: 'title',
    sortOrder: 'asc',
    page: 1,
    limit: 12
  });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [genres, setGenres] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [popularBooks, setPopularBooks] = useState([]);
  const [recentBooks, setRecentBooks] = useState([]);

  // Dialog states
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookDetailsOpen, setBookDetailsOpen] = useState(false);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState({
    type: 'card',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (tabValue === 1) {
      searchBooks();
    }
  }, [searchFilters, tabValue]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [stats, rentalsData, walletData, genresData, authorsData, popularData, recentData] = await Promise.all([
        borrowerService.getDashboardStats(),
        borrowerService.getUserRentals(),
        borrowerService.getWallet(),
        borrowerService.getAvailableGenres(),
        borrowerService.getAvailableAuthors(),
        borrowerService.getPopularBooks(),
        borrowerService.getRecentBooks()
      ]);

      setDashboardStats(stats);
      setRentals(rentalsData);
      setWallet(walletData);
      setGenres(genresData);
      setAuthors(authorsData);
      setPopularBooks(popularData);
      setRecentBooks(recentData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const searchBooks = async () => {
    try {
      const searchResults = await borrowerService.searchBooks(searchFilters);
      setBooks(searchResults.books || []);
      setPagination(searchResults.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSearchChange = (field, value) => {
    setSearchFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset to first page on filter change
    }));
  };

  const handlePageChange = (event, newPage) => {
    setSearchFilters(prev => ({ ...prev, page: newPage }));
  };

  const openBookDetails = async (bookId) => {
    try {
      const bookDetails = await borrowerService.getBookDetails(bookId);
      setSelectedBook(bookDetails);
      setBookDetailsOpen(true);
    } catch (error) {
      setError(error.message);
    }
  };

  const placeHold = async (bookId) => {
    try {
      await borrowerService.placeHold(bookId);
      setSuccess('Hold placed successfully!');
      setBookDetailsOpen(false);
      loadInitialData(); // Refresh data
      if (tabValue === 1) searchBooks(); // Refresh search results
    } catch (error) {
      setError(error.message);
    }
  };

  const cancelHold = async (holdId) => {
    try {
      await borrowerService.cancelHold(holdId);
      setSuccess('Hold cancelled successfully!');
      loadInitialData(); // Refresh data
    } catch (error) {
      setError(error.message);
    }
  };

  const convertHoldToRequest = async (holdId) => {
    try {
      await borrowerService.convertHoldToRequest(holdId);
      setSuccess('Hold converted to rental request!');
      loadInitialData(); // Refresh data
    } catch (error) {
      setError(error.message);
    }
  };

  const addFunds = async () => {
    try {
      if (!addFundsAmount || parseFloat(addFundsAmount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      await borrowerService.addFundsToWallet(parseFloat(addFundsAmount), paymentMethod);
      setSuccess(`Successfully added ${borrowerService.formatCurrency(parseFloat(addFundsAmount))} to wallet!`);
      setWalletDialogOpen(false);
      setAddFundsAmount('');
      setPaymentMethod({ type: 'card', cardNumber: '', expiryMonth: '', expiryYear: '', cvv: '' });
      
      // Refresh wallet data
      const walletData = await borrowerService.getWallet();
      setWallet(walletData);
    } catch (error) {
      setError(error.message);
    }
  };

  const renderDashboardTab = () => (
    <Grid container spacing={3}>
      {/* Stats Cards */}
      <Grid item xs={12} md={3}>
        <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <CardContent>
            <Box display="flex" alignItems="center">
              <BookIcon sx={{ mr: 1 }} />
              <Box>
                <Typography variant="h4">{dashboardStats.activeRentals || 0}</Typography>
                <Typography variant="body2">Active Rentals</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card sx={{ bgcolor: 'warning.main', color: 'warning.contrastText' }}>
          <CardContent>
            <Box display="flex" alignItems="center">
              <HoldIcon sx={{ mr: 1 }} />
              <Box>
                <Typography variant="h4">{dashboardStats.holds || 0}</Typography>
                <Typography variant="body2">Active Holds</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card sx={{ bgcolor: 'error.main', color: 'error.contrastText' }}>
          <CardContent>
            <Box display="flex" alignItems="center">
              <WarningIcon sx={{ mr: 1 }} />
              <Box>
                <Typography variant="h4">{dashboardStats.overdueBooks || 0}</Typography>
                <Typography variant="body2">Overdue Books</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card sx={{ bgcolor: 'success.main', color: 'success.contrastText' }}>
          <CardContent>
            <Box display="flex" alignItems="center">
              <WalletIcon sx={{ mr: 1 }} />
              <Box>
                <Typography variant="h4">{borrowerService.formatCurrency(dashboardStats.walletBalance || 0)}</Typography>
                <Typography variant="body2">Wallet Balance</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Popular Books */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            <TrendingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Popular in Your Community
          </Typography>
          <List sx={{ maxHeight: 320, overflow: 'auto' }}>
            {popularBooks.slice(0, 5).map((book, index) => (
              <React.Fragment key={book._id}>
                <ListItem>
                  <ListItemText
                    primary={book.title}
                    secondary={`by ${book.author} • ${book.rentalCount} rentals`}
                  />
                  <ListItemSecondaryAction>
                    <Button size="small" onClick={() => openBookDetails(book._id)}>
                      View
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < popularBooks.slice(0, 5).length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </Grid>

      {/* Recent Books */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Recently Added
          </Typography>
          <List sx={{ maxHeight: 320, overflow: 'auto' }}>
            {recentBooks.slice(0, 5).map((book, index) => (
              <React.Fragment key={book._id}>
                <ListItem>
                  <ListItemText
                    primary={book.title}
                    secondary={`by ${book.author} • Added ${borrowerService.formatRelativeDate(book.createdAt)}`}
                  />
                  <ListItemSecondaryAction>
                    <Button size="small" onClick={() => openBookDetails(book._id)}>
                      View
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < recentBooks.slice(0, 5).length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderSearchTab = () => (
    <Box>
      {/* Search and Filter Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search books..."
              value={searchFilters.search}
              onChange={(e) => handleSearchChange('search', e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <Autocomplete
              value={searchFilters.genre}
              onChange={(e, value) => handleSearchChange('genre', value || '')}
              options={genres}
              renderInput={(params) => <TextField {...params} label="Genre" />}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <Autocomplete
              value={searchFilters.author}
              onChange={(e, value) => handleSearchChange('author', value || '')}
              options={authors}
              renderInput={(params) => <TextField {...params} label="Author" />}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={searchFilters.sortBy}
                label="Sort By"
                onChange={(e) => handleSearchChange('sortBy', e.target.value)}
              >
                <MenuItem value="title">Title</MenuItem>
                <MenuItem value="author">Author</MenuItem>
                <MenuItem value="rental.pricePerDay">Price</MenuItem>
                <MenuItem value="createdAt">Date Added</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Availability</InputLabel>
              <Select
                value={searchFilters.availability}
                label="Availability"
                onChange={(e) => handleSearchChange('availability', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="rented">Rented</MenuItem>
                <MenuItem value="on-hold">On Hold</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box mt={2}>
          <Grid container spacing={2}>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                label="Min Price"
                type="number"
                value={searchFilters.minPrice}
                onChange={(e) => handleSearchChange('minPrice', e.target.value)}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                label="Max Price"
                type="number"
                value={searchFilters.maxPrice}
                onChange={(e) => handleSearchChange('maxPrice', e.target.value)}
              />
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Search Results */}
      <Grid container spacing={3}>
        {books.map((book) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={book._id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h3" gutterBottom noWrap>
                  {book.title}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  by {book.author}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  {book.genre}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Publisher: {book.publisher?.fullName}
                </Typography>
                <Box display="flex" alignItems="center" mt={1}>
                  <MoneyIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  <Typography variant="body2">
                    {borrowerService.formatCurrency(book.rental?.pricePerDay || 0)}/day
                  </Typography>
                </Box>
                <Box mt={1}>
                  <Chip
                    label={borrowerService.getStatusText(book.availability?.status)}
                    color={borrowerService.getStatusColor(book.availability?.status)}
                    size="small"
                  />
                </Box>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => openBookDetails(book._id)}>
                  <ViewIcon sx={{ mr: 0.5 }} />
                  View Details
                </Button>
                {book.availability?.canHold && (
                  <Button size="small" color="primary" onClick={() => placeHold(book._id)}>
                    <HoldIcon sx={{ mr: 0.5 }} />
                    Hold
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={pagination.pages}
            page={pagination.page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );

  const renderRentalsTab = () => (
    <Box>
      {rentals.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <BookIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Active Rentals or Holds
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Search for books and place holds to get started!
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {rentals.map((rental) => (
            <Grid item xs={12} md={6} lg={4} key={rental._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom noWrap>
                    {rental.book?.title}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    by {rental.book?.author}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Publisher: {rental.publisher?.fullName}
                  </Typography>
                  
                  <Box mt={2}>
                    <Chip
                      label={borrowerService.getRentalStatusText(rental.status)}
                      color={borrowerService.getRentalStatusColor(rental.status)}
                      size="small"
                    />
                  </Box>

                  {rental.status === 'hold' && rental.holdExpiry && (
                    <Box mt={1}>
                      <Typography variant="body2" color={borrowerService.isHoldExpiringSoon(rental.holdExpiry) ? 'error' : 'text.secondary'}>
                        Expires in: {borrowerService.getTimeUntilExpiry(rental.holdExpiry)}
                      </Typography>
                    </Box>
                  )}

                  {rental.rental?.actualEndDate && (
                    <Box mt={1}>
                      <Typography variant="body2">
                        Due: {borrowerService.formatDate(rental.rental.actualEndDate)}
                      </Typography>
                    </Box>
                  )}

                  {rental.daysOverdue && (
                    <Box mt={1}>
                      <Typography variant="body2" color="error">
                        {rental.daysOverdue} days overdue • Late fee: {borrowerService.formatCurrency(rental.lateFee)}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  {rental.status === 'hold' && (
                    <>
                      <Button size="small" onClick={() => convertHoldToRequest(rental._id)}>
                        Request Book
                      </Button>
                      <Button size="small" color="error" onClick={() => cancelHold(rental._id)}>
                        <CancelIcon sx={{ mr: 0.5 }} />
                        Cancel Hold
                      </Button>
                    </>
                  )}
                  <Button size="small" onClick={() => openBookDetails(rental.book._id)}>
                    View Book
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  const renderWalletTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Balance
            </Typography>
            <Typography variant="h3" color="primary">
              {borrowerService.formatCurrency(wallet.balance)}
            </Typography>
            <Button
              variant="contained"
              onClick={() => setWalletDialogOpen(true)}
              sx={{ mt: 2 }}
              startIcon={<MoneyIcon />}
            >
              Add Funds
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Transaction History
          </Typography>
          {wallet.transactions?.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No transactions yet
            </Typography>
          ) : (
            <List>
              {wallet.transactions?.slice(0, 10).map((transaction, index) => (
                <React.Fragment key={transaction._id || index}>
                  <ListItem>
                    <ListItemText
                      primary={transaction.description}
                      secondary={borrowerService.formatDate(transaction.date)}
                    />
                    <ListItemSecondaryAction>
                      <Typography
                        variant="body2"
                        color={transaction.type === 'deposit' ? 'success.main' : 'error.main'}
                      >
                        {transaction.type === 'deposit' ? '+' : '-'}
                        {borrowerService.formatCurrency(transaction.amount)}
                      </Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < (wallet.transactions?.slice(0, 10).length || 0) - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      </Grid>
    </Grid>
  );

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Borrower Dashboard
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Dashboard" />
          <Tab label="Search Books" />
          <Tab label="My Rentals" />
          <Tab label="Wallet" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {renderDashboardTab()}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {renderSearchTab()}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {renderRentalsTab()}
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {renderWalletTab()}
      </TabPanel>

      {/* Book Details Dialog */}
      <Dialog
        open={bookDetailsOpen}
        onClose={() => setBookDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedBook && (
          <>
            <DialogTitle>{selectedBook.title}</DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Book Information</Typography>
                  <Typography><strong>Author:</strong> {selectedBook.author}</Typography>
                  <Typography><strong>Genre:</strong> {selectedBook.genre}</Typography>
                  <Typography><strong>Publisher:</strong> {selectedBook.publisher?.fullName}</Typography>
                  <Typography><strong>ISBN:</strong> {selectedBook.isbn}</Typography>
                  {selectedBook.description && (
                    <Typography sx={{ mt: 2 }}><strong>Description:</strong> {selectedBook.description}</Typography>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Rental Information</Typography>
                  <Typography><strong>Price per day:</strong> {borrowerService.formatCurrency(selectedBook.rental?.pricePerDay || 0)}</Typography>
                  <Typography><strong>Max rental days:</strong> {selectedBook.rental?.maxRentalDays} days</Typography>
                  <Typography><strong>Status:</strong> 
                    <Chip
                      label={borrowerService.getStatusText(selectedBook.availability?.status)}
                      color={borrowerService.getStatusColor(selectedBook.availability?.status)}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  {selectedBook.availability?.currentHolds > 0 && (
                    <Typography><strong>Current holds:</strong> {selectedBook.availability.currentHolds}</Typography>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setBookDetailsOpen(false)}>Close</Button>
              {selectedBook.availability?.canHold && (
                <Button variant="contained" onClick={() => placeHold(selectedBook._id)}>
                  Place Hold
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Add Funds Dialog */}
      <Dialog
        open={walletDialogOpen}
        onClose={() => setWalletDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Funds to Wallet</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={addFundsAmount}
                onChange={(e) => setAddFundsAmount(e.target.value)}
                inputProps={{ min: 1, max: 1000, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentMethod.type}
                  label="Payment Method"
                  onChange={(e) => setPaymentMethod(prev => ({ ...prev, type: e.target.value }))}
                >
                  <MenuItem value="card">Credit/Debit Card</MenuItem>
                  <MenuItem value="paypal">PayPal</MenuItem>
                  <MenuItem value="bank">Bank Transfer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {paymentMethod.type === 'card' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Card Number"
                    placeholder="4242424242424242"
                    value={paymentMethod.cardNumber}
                    onChange={(e) => setPaymentMethod(prev => ({ ...prev, cardNumber: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Expiry Month"
                    type="number"
                    value={paymentMethod.expiryMonth}
                    onChange={(e) => setPaymentMethod(prev => ({ ...prev, expiryMonth: e.target.value }))}
                    inputProps={{ min: 1, max: 12 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Expiry Year"
                    type="number"
                    value={paymentMethod.expiryYear}
                    onChange={(e) => setPaymentMethod(prev => ({ ...prev, expiryYear: e.target.value }))}
                    inputProps={{ min: 2024 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="CVV"
                    type="password"
                    value={paymentMethod.cvv}
                    onChange={(e) => setPaymentMethod(prev => ({ ...prev, cvv: e.target.value }))}
                    inputProps={{ maxLength: 4 }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWalletDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={addFunds}>
            Add Funds
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Notifications */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
      >
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
}
