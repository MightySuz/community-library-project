import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Tab,
  Tabs,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Tooltip,
  Fab,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  QrCodeScanner as ScanIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
  Refresh as RefreshIcon,
  BookmarkAdd as BookIcon,
  Assignment as RequestIcon,
  Schedule as BorrowedIcon,
  Warning as OverdueIcon,
  AttachMoney as EarningsIcon
} from '@mui/icons-material';
import { publisherService } from '../services/publisherService';

const PublisherDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dashboard data
  const [dashboardStats, setDashboardStats] = useState({});
  
  // Books data
  const [books, setBooks] = useState([]);
  const [bookDialog, setBookDialog] = useState(false);
  const [barcodeDialog, setBarcodeDialog] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  
  // Requests data
  const [requests, setRequests] = useState([]);
  const [requestDialog, setRequestDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Borrowed books data
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [overdueBooks, setOverdueBooks] = useState([]);
  
  // Form states
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    barcode: '',
    genre: '',
    description: '',
    condition: 'good',
    publishedYear: new Date().getFullYear(),
    language: 'English',
    pages: '',
    rental: {
      pricePerDay: '',
      maxRentalDays: 14
    },
    purchasePrice: ''
  });

  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedBookInfo, setScannedBookInfo] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    switch (activeTab) {
      case 0:
        loadDashboard();
        break;
      case 1:
        loadBooks();
        break;
      case 2:
        loadRequests();
        break;
      case 3:
        loadBorrowedBooks();
        break;
      default:
        break;
    }
  }, [activeTab]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const stats = await publisherService.getDashboard();
      setDashboardStats(stats);
    } catch (error) {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadBooks = async () => {
    try {
      setLoading(true);
      const booksData = await publisherService.getBooks();
      setBooks(booksData);
    } catch (error) {
      setError('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      const requestsData = await publisherService.getRequests();
      setRequests(requestsData);
    } catch (error) {
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const loadBorrowedBooks = async () => {
    try {
      setLoading(true);
      const [borrowed, overdue] = await Promise.all([
        publisherService.getBorrowedBooks(),
        publisherService.getOverdueBooks()
      ]);
      setBorrowedBooks(borrowed);
      setOverdueBooks(overdue);
    } catch (error) {
      setError('Failed to load borrowed books');
    } finally {
      setLoading(false);
    }
  };

  const handleScanBarcode = async () => {
    try {
      if (!barcodeInput.trim()) {
        setError('Please enter a barcode');
        return;
      }

      setLoading(true);
      const bookInfo = await publisherService.getBookFromBarcode(barcodeInput);
      setScannedBookInfo(bookInfo);
      setBookForm({ ...bookForm, ...bookInfo });
      setBarcodeDialog(false);
      setBookDialog(true);
    } catch (error) {
      setError('Failed to scan barcode');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async () => {
    try {
      setLoading(true);
      await publisherService.addBook(bookForm);
      setSuccess('Book added successfully');
      setBookDialog(false);
      resetBookForm();
      loadBooks();
    } catch (error) {
      setError('Failed to add book');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBook = async () => {
    try {
      setLoading(true);
      await publisherService.updateBook(editingBook._id, bookForm);
      setSuccess('Book updated successfully');
      setBookDialog(false);
      setEditingBook(null);
      resetBookForm();
      loadBooks();
    } catch (error) {
      setError('Failed to update book');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await publisherService.deleteBook(bookId);
        setSuccess('Book deleted successfully');
        loadBooks();
      } catch (error) {
        setError('Failed to delete book');
      }
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      await publisherService.approveRequest(requestId, {
        message: 'Request approved'
      });
      setSuccess('Request approved successfully');
      loadRequests();
    } catch (error) {
      setError('Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      try {
        await publisherService.rejectRequest(requestId, { reason });
        setSuccess('Request rejected');
        loadRequests();
      } catch (error) {
        setError('Failed to reject request');
      }
    }
  };

  const handleMarkReturned = async (requestId) => {
    const damage = window.confirm('Is there any damage to the book?');
    let damageAmount = 0;
    let damageDescription = '';

    if (damage) {
      damageAmount = parseFloat(prompt('Enter damage amount:') || '0');
      damageDescription = prompt('Describe the damage:') || '';
    }

    try {
      await publisherService.markReturned(requestId, {
        damage,
        damageAmount,
        damageDescription
      });
      setSuccess('Book marked as returned');
      loadBorrowedBooks();
    } catch (error) {
      setError('Failed to mark book as returned');
    }
  };

  const resetBookForm = () => {
    setBookForm({
      title: '',
      author: '',
      isbn: '',
      barcode: '',
      genre: '',
      description: '',
      condition: 'good',
      publishedYear: new Date().getFullYear(),
      language: 'English',
      pages: '',
      rental: {
        pricePerDay: '',
        maxRentalDays: 14
      },
      purchasePrice: ''
    });
    setScannedBookInfo(null);
  };

  const openEditDialog = (book) => {
    setEditingBook(book);
    setBookForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn || '',
      barcode: book.barcode || '',
      genre: book.genre,
      description: book.description || '',
      condition: book.condition,
      publishedYear: book.publishedYear,
      language: book.language,
      pages: book.pages || '',
      rental: {
        pricePerDay: book.rental?.pricePerDay || '',
        maxRentalDays: book.rental?.maxRentalDays || 14
      },
      purchasePrice: book.purchasePrice || ''
    });
    setBookDialog(true);
  };

  const StatCard = ({ title, value, subtitle, icon, color = 'primary' }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" color={`${color}.main`} fontWeight="bold">
              {value}
            </Typography>
            <Typography variant="h6" gutterBottom>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box color={`${color}.main`}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const renderDashboard = () => (
    <Box>
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Typography variant="h5">Publisher Dashboard</Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={loadDashboard}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Books"
            value={dashboardStats.totalBooks || 0}
            subtitle="In your catalog"
            icon={<BookIcon fontSize="large" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Requests"
            value={dashboardStats.pendingRequests || 0}
            subtitle="Awaiting approval"
            icon={<RequestIcon fontSize="large" />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Currently Borrowed"
            value={dashboardStats.activeRentals || 0}
            subtitle="Books out"
            icon={<BorrowedIcon fontSize="large" />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Overdue Books"
            value={dashboardStats.overdueRentals || 0}
            subtitle="Need attention"
            icon={<OverdueIcon fontSize="large" />}
            color="error"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Book Status Distribution
              </Typography>
              <Box mt={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography>Available: {dashboardStats.availableBooks || 0}</Typography>
                  <Typography>Borrowed: {dashboardStats.borrowedBooks || 0}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Pending: {dashboardStats.pendingBooks || 0}</Typography>
                  <Typography color="primary" fontWeight="bold">
                    Total Earnings: ${dashboardStats.totalEarnings?.toFixed(2) || '0.00'}
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
                Quick Actions
              </Typography>
              <Box mt={2} display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="contained"
                  startIcon={<ScanIcon />}
                  onClick={() => setBarcodeDialog(true)}
                  fullWidth
                >
                  Scan Barcode to Add Book
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setBookDialog(true)}
                  fullWidth
                >
                  Add Book Manually
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderBooks = () => (
    <Box>
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Typography variant="h5">My Books</Typography>
        <Box display="flex" gap={2}>
          <Button
            startIcon={<ScanIcon />}
            onClick={() => setBarcodeDialog(true)}
            variant="contained"
          >
            Scan Barcode
          </Button>
          <Button
            startIcon={<AddIcon />}
            onClick={() => setBookDialog(true)}
            variant="outlined"
          >
            Add Manually
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Book Details</TableCell>
              <TableCell>Genre</TableCell>
              <TableCell>Rental Price</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Availability</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {books.map((book) => (
              <TableRow key={book._id}>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {book.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      by {book.author}
                    </Typography>
                    {book.isbn && (
                      <Typography variant="caption" display="block">
                        ISBN: {book.isbn}
                      </Typography>
                    )}
                    {book.barcode && (
                      <Typography variant="caption" display="block">
                        Barcode: {book.barcode}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{book.genre}</TableCell>
                <TableCell>${book.rental?.pricePerDay || 0}/day</TableCell>
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
                    label={book.availability?.status || 'unknown'}
                    color={
                      book.availability?.status === 'available' ? 'success' :
                      book.availability?.status === 'borrowed' ? 'error' : 'default'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="View">
                    <IconButton size="small">
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton 
                      size="small" 
                      onClick={() => openEditDialog(book)}
                      disabled={book.availability?.status === 'borrowed'}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteBook(book._id)}
                      disabled={book.availability?.status === 'borrowed'}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderRequests = () => (
    <Box>
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Typography variant="h5">Checkout Requests</Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={loadRequests}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Book</TableCell>
              <TableCell>Borrower</TableCell>
              <TableCell>Requested Period</TableCell>
              <TableCell>Request Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request._id}>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2">
                      {request.book?.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      by {request.book?.author}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2">
                      {request.borrower?.fullName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {request.borrower?.communityName}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(request.requestedStartDate).toLocaleDateString()} - 
                    {new Date(request.requestedEndDate).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({request.rentalDuration} days)
                  </Typography>
                </TableCell>
                <TableCell>
                  {new Date(request.requestDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Chip
                    label={request.status}
                    color={
                      request.status === 'approved' ? 'success' :
                      request.status === 'rejected' ? 'error' : 'warning'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {request.status === 'pending' && (
                    <Box display="flex" gap={1}>
                      <Tooltip title="Approve">
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={() => handleApproveRequest(request._id)}
                        >
                          <ApproveIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleRejectRequest(request._id)}
                        >
                          <RejectIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderBorrowedBooks = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Currently Borrowed Books
      </Typography>

      {overdueBooks.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You have {overdueBooks.length} overdue books that need attention.
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Book</TableCell>
              <TableCell>Borrower</TableCell>
              <TableCell>Rental Period</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Fines</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[...borrowedBooks, ...overdueBooks].map((rental) => (
              <TableRow key={rental._id}>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2">
                      {rental.book?.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      by {rental.book?.author}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2">
                      {rental.borrower?.fullName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {rental.borrower?.email}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(rental.rental?.actualStartDate).toLocaleDateString()} - 
                    {new Date(rental.rental?.actualEndDate).toLocaleDateString()}
                  </Typography>
                  {rental.rental?.status === 'overdue' && (
                    <Typography variant="caption" color="error">
                      {rental.daysOverdue} days overdue
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={rental.rental?.status || 'active'}
                    color={
                      rental.rental?.status === 'overdue' ? 'error' : 'info'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  ${rental.totalFines?.toFixed(2) || '0.00'}
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleMarkReturned(rental._id)}
                  >
                    Mark Returned
                  </Button>
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
          Publisher Dashboard
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
            <Tab label="My Books" />
            <Tab label="Requests" />
            <Tab label="Borrowed Books" />
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
            {activeTab === 1 && renderBooks()}
            {activeTab === 2 && renderRequests()}
            {activeTab === 3 && renderBorrowedBooks()}
          </>
        )}
      </Box>

      {/* Barcode Scanner Dialog */}
      <Dialog open={barcodeDialog} onClose={() => setBarcodeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Scan Barcode</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Enter Barcode"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            margin="normal"
            placeholder="Scan or enter 10-13 digit barcode"
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBarcodeDialog(false)}>Cancel</Button>
          <Button onClick={handleScanBarcode} variant="contained">
            Scan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Book Dialog */}
      <Dialog open={bookDialog} onClose={() => setBookDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingBook ? 'Edit Book' : 'Add New Book'}
          {scannedBookInfo && (
            <Chip label="From Barcode Scan" color="primary" size="small" sx={{ ml: 2 }} />
          )}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Title"
                value={bookForm.title}
                onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Author"
                value={bookForm.author}
                onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ISBN"
                value={bookForm.isbn}
                onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Barcode"
                value={bookForm.barcode}
                onChange={(e) => setBookForm({ ...bookForm, barcode: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Genre</InputLabel>
                <Select
                  value={bookForm.genre}
                  onChange={(e) => setBookForm({ ...bookForm, genre: e.target.value })}
                  required
                >
                  <MenuItem value="Fiction">Fiction</MenuItem>
                  <MenuItem value="Non-Fiction">Non-Fiction</MenuItem>
                  <MenuItem value="Science">Science</MenuItem>
                  <MenuItem value="Technology">Technology</MenuItem>
                  <MenuItem value="History">History</MenuItem>
                  <MenuItem value="Biography">Biography</MenuItem>
                  <MenuItem value="Mystery">Mystery</MenuItem>
                  <MenuItem value="Romance">Romance</MenuItem>
                  <MenuItem value="Fantasy">Fantasy</MenuItem>
                  <MenuItem value="Horror">Horror</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Condition</InputLabel>
                <Select
                  value={bookForm.condition}
                  onChange={(e) => setBookForm({ ...bookForm, condition: e.target.value })}
                >
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="like-new">Like New</MenuItem>
                  <MenuItem value="good">Good</MenuItem>
                  <MenuItem value="fair">Fair</MenuItem>
                  <MenuItem value="poor">Poor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={bookForm.description}
                onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Published Year"
                type="number"
                value={bookForm.publishedYear}
                onChange={(e) => setBookForm({ ...bookForm, publishedYear: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Language"
                value={bookForm.language}
                onChange={(e) => setBookForm({ ...bookForm, language: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Pages"
                type="number"
                value={bookForm.pages}
                onChange={(e) => setBookForm({ ...bookForm, pages: parseInt(e.target.value) })}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Typography variant="h6">Rental Information</Typography>
              </Divider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Rental Price per Day ($)"
                type="number"
                step="0.01"
                value={bookForm.rental.pricePerDay}
                onChange={(e) => setBookForm({ 
                  ...bookForm, 
                  rental: { ...bookForm.rental, pricePerDay: parseFloat(e.target.value) }
                })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Maximum Rental Days"
                type="number"
                value={bookForm.rental.maxRentalDays}
                onChange={(e) => setBookForm({ 
                  ...bookForm, 
                  rental: { ...bookForm.rental, maxRentalDays: parseInt(e.target.value) }
                })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Purchase Price ($)"
                type="number"
                step="0.01"
                value={bookForm.purchasePrice}
                onChange={(e) => setBookForm({ ...bookForm, purchasePrice: parseFloat(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setBookDialog(false);
            setEditingBook(null);
            resetBookForm();
          }}>
            Cancel
          </Button>
          <Button 
            onClick={editingBook ? handleUpdateBook : handleAddBook} 
            variant="contained"
          >
            {editingBook ? 'Update Book' : 'Add Book'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PublisherDashboard;
