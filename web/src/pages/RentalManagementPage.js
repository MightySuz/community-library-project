import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import rentalService from '../services/rentalService';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`rental-tabpanel-${index}`}
      aria-labelledby={`rental-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const RentalManagementPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Rental History State
  const [rentalHistory, setRentalHistory] = useState([]);
  const [rentalSummary, setRentalSummary] = useState(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState({});

  // Publisher Earnings State
  const [earnings, setEarnings] = useState([]);
  const [earningsSummary, setEarningsSummary] = useState(null);
  const [earningsPage, setEarningsPage] = useState(1);
  const [earningsPagination, setEarningsPagination] = useState({});
  const [earningsStartDate, setEarningsStartDate] = useState(null);
  const [earningsEndDate, setEarningsEndDate] = useState(null);

  // Overdue Rentals State (Admin)
  const [overdueRentals, setOverdueRentals] = useState([]);

  // Dialog State
  const [selectedRental, setSelectedRental] = useState(null);
  const [receiptDialog, setReceiptDialog] = useState(false);
  const [returnDialog, setReturnDialog] = useState(false);
  const [returnDate, setReturnDate] = useState(new Date());

  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    if (tabValue === 0 && (userRole === 'borrower' || userRole === 'admin')) {
      loadRentalHistory();
    } else if (tabValue === 1 && (userRole === 'publisher' || userRole === 'admin')) {
      loadPublisherEarnings();
    } else if (tabValue === 2 && userRole === 'admin') {
      loadOverdueRentals();
    }
  }, [tabValue, historyPage, earningsPage, earningsStartDate, earningsEndDate]);

  const loadRentalHistory = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      rentalService.setAuthToken(token);

      const response = await rentalService.getBorrowerRentalHistory(historyPage, 10);
      
      if (response.success) {
        setRentalHistory(response.data.rentals);
        setRentalSummary(response.data.summary);
        setHistoryPagination(response.data.pagination);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPublisherEarnings = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      rentalService.setAuthToken(token);

      const startDate = earningsStartDate ? earningsStartDate.toISOString() : null;
      const endDate = earningsEndDate ? earningsEndDate.toISOString() : null;

      const response = await rentalService.getPublisherEarnings(earningsPage, 10, startDate, endDate);
      
      if (response.success) {
        setEarnings(response.data.earnings);
        setEarningsSummary(response.data.summary);
        setEarningsPagination(response.data.pagination);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadOverdueRentals = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      rentalService.setAuthToken(token);

      const response = await rentalService.getOverdueRentals();
      
      if (response.success) {
        setOverdueRentals(response.data);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnBook = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      rentalService.setAuthToken(token);

      const response = await rentalService.returnBook(selectedRental._id, returnDate.toISOString());
      
      if (response.success) {
        setSuccess(`Book returned successfully! ${response.data.lateFees > 0 ? `Late fees: ${rentalService.formatCurrency(response.data.lateFees)}` : ''}`);
        setReturnDialog(false);
        setSelectedRental(null);
        
        // Reload data based on current tab
        if (tabValue === 0) {
          loadRentalHistory();
        } else if (tabValue === 1) {
          loadPublisherEarnings();
        } else if (tabValue === 2) {
          loadOverdueRentals();
        }
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessLateFees = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      rentalService.setAuthToken(token);

      const response = await rentalService.processLateFees();
      
      if (response.success) {
        setSuccess(`Late fees processed successfully! ${response.data.processedCount} rentals updated.`);
        loadOverdueRentals();
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError('');
    setSuccess('');
  };

  const getRentalStatusChip = (rental) => {
    const status = rentalService.getRentalStatusDisplay(rental);
    return (
      <Chip
        label={status.status}
        color={status.color}
        size="small"
        variant="outlined"
      />
    );
  };

  const renderRentalHistory = () => (
    <Grid container spacing={3}>
      {/* Summary Cards */}
      {rentalSummary && (
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Rentals
                  </Typography>
                  <Typography variant="h5" component="div">
                    {rentalSummary.totalRentals}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Active Rentals
                  </Typography>
                  <Typography variant="h5" component="div">
                    {rentalSummary.activeRentals}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Spent
                  </Typography>
                  <Typography variant="h5" component="div">
                    {rentalService.formatCurrency(rentalSummary.totalSpent)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Late Fees
                  </Typography>
                  <Typography variant="h5" component="div">
                    {rentalService.formatCurrency(rentalSummary.totalLateFees)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      )}

      {/* Rental History Table */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Rental History
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Book</TableCell>
                        <TableCell>Publisher</TableCell>
                        <TableCell>Rental Period</TableCell>
                        <TableCell>Cost</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rentalHistory.map((rental) => (
                        <TableRow key={rental._id}>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {rental.book?.title}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              by {rental.book?.author}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {rental.publisher?.fullName}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {rentalService.formatDate(rental.rental?.actualStartDate)} - 
                              {rentalService.formatDate(rental.rental?.actualEndDate)}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {rental.costBreakdown?.rentalDays} days
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {rentalService.formatCurrency(rental.costBreakdown?.totalCost || 0)}
                            </Typography>
                            {rental.costBreakdown?.lateFees > 0 && (
                              <Typography variant="caption" color="error">
                                Late fees: {rentalService.formatCurrency(rental.costBreakdown.lateFees)}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {getRentalStatusChip(rental)}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedRental(rental);
                                setReceiptDialog(true);
                              }}
                            >
                              <ReceiptIcon />
                            </IconButton>
                            {rental.rental?.status === 'active' && (
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedRental(rental);
                                  setReturnDialog(true);
                                }}
                              >
                                <CheckCircleIcon />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {historyPagination.pages > 1 && (
                  <Box display="flex" justifyContent="center" mt={2}>
                    <Pagination
                      count={historyPagination.pages}
                      page={historyPage}
                      onChange={(e, page) => setHistoryPage(page)}
                    />
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderPublisherEarnings = () => (
    <Grid container spacing={3}>
      {/* Date Filters */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filter Earnings
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="Start Date"
                    value={earningsStartDate}
                    onChange={setEarningsStartDate}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="End Date"
                    value={earningsEndDate}
                    onChange={setEarningsEndDate}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setEarningsStartDate(null);
                      setEarningsEndDate(null);
                    }}
                  >
                    Clear Filters
                  </Button>
                </Grid>
              </Grid>
            </LocalizationProvider>
          </CardContent>
        </Card>
      </Grid>

      {/* Summary Cards */}
      {earningsSummary && (
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Rentals
                  </Typography>
                  <Typography variant="h5" component="div">
                    {earningsSummary.totalRentals}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Gross Revenue
                  </Typography>
                  <Typography variant="h5" component="div">
                    {rentalService.formatCurrency(earningsSummary.grossRevenue)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Net Earnings
                  </Typography>
                  <Typography variant="h5" component="div">
                    {rentalService.formatCurrency(earningsSummary.netEarnings)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Platform Fees
                  </Typography>
                  <Typography variant="h5" component="div">
                    {rentalService.formatCurrency(earningsSummary.platformFees)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      )}

      {/* Earnings Table */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Earnings Details
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Book</TableCell>
                        <TableCell>Borrower</TableCell>
                        <TableCell>Rental Period</TableCell>
                        <TableCell>Revenue</TableCell>
                        <TableCell>Your Earnings</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {earnings.map((earning) => (
                        <TableRow key={earning._id}>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {earning.book?.title}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              by {earning.book?.author}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {earning.borrower?.fullName}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {rentalService.formatDate(earning.rental?.actualStartDate)} - 
                              {rentalService.formatDate(earning.rental?.actualEndDate)}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {earning.earningsBreakdown?.rentalDays} days
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {rentalService.formatCurrency(earning.earningsBreakdown?.totalPaid || 0)}
                            </Typography>
                            {earning.earningsBreakdown?.lateFees > 0 && (
                              <Typography variant="caption" color="success">
                                + Late fees: {rentalService.formatCurrency(earning.earningsBreakdown.lateFees)}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="success">
                              {rentalService.formatCurrency(earning.earningsBreakdown?.totalEarnings || 0)}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              After platform fee
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {getRentalStatusChip(earning)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {earningsPagination.pages > 1 && (
                  <Box display="flex" justifyContent="center" mt={2}>
                    <Pagination
                      count={earningsPagination.pages}
                      page={earningsPage}
                      onChange={(e, page) => setEarningsPage(page)}
                    />
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderOverdueRentals = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Overdue Rentals
              </Typography>
              <Button
                variant="contained"
                color="warning"
                onClick={handleProcessLateFees}
                disabled={loading}
              >
                Process Late Fees
              </Button>
            </Box>
            
            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Book</TableCell>
                      <TableCell>Borrower</TableCell>
                      <TableCell>Publisher</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Days Overdue</TableCell>
                      <TableCell>Accrued Late Fees</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {overdueRentals.map((rental) => (
                      <TableRow key={rental._id}>
                        <TableCell>
                          <Typography variant="subtitle2">
                            {rental.book?.title}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            by {rental.book?.author}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {rental.borrower?.fullName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {rental.borrower?.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {rental.publisher?.fullName}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="error">
                            {rentalService.formatDate(rental.rental?.actualEndDate)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${rental.daysOverdue} days`}
                            color="error"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="error">
                            {rentalService.formatCurrency(rental.accruedLateFees)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setSelectedRental(rental);
                              setReturnDialog(true);
                            }}
                          >
                            Process Return
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Rental Management
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

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            {(userRole === 'borrower' || userRole === 'admin') && (
              <Tab label="My Rentals" />
            )}
            {(userRole === 'publisher' || userRole === 'admin') && (
              <Tab label="My Earnings" />
            )}
            {userRole === 'admin' && (
              <Tab label="Overdue Rentals" />
            )}
          </Tabs>
        </Box>

        {(userRole === 'borrower' || userRole === 'admin') && (
          <TabPanel value={tabValue} index={0}>
            {renderRentalHistory()}
          </TabPanel>
        )}

        {(userRole === 'publisher' || userRole === 'admin') && (
          <TabPanel value={tabValue} index={userRole === 'borrower' ? 1 : 1}>
            {renderPublisherEarnings()}
          </TabPanel>
        )}

        {userRole === 'admin' && (
          <TabPanel value={tabValue} index={2}>
            {renderOverdueRentals()}
          </TabPanel>
        )}
      </Card>

      {/* Receipt Dialog */}
      <Dialog
        open={receiptDialog}
        onClose={() => setReceiptDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Rental Receipt</DialogTitle>
        <DialogContent>
          {selectedRental && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedRental.book?.title}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <List>
                <ListItem>
                  <ListItemText
                    primary="Daily Rate"
                    secondary={selectedRental.costBreakdown?.dailyRate ? 
                      rentalService.formatCurrency(selectedRental.costBreakdown.dailyRate) : 'N/A'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Rental Days"
                    secondary={selectedRental.costBreakdown?.rentalDays || 'N/A'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Base Cost"
                    secondary={selectedRental.costBreakdown?.baseCost ? 
                      rentalService.formatCurrency(selectedRental.costBreakdown.baseCost) : 'N/A'}
                  />
                </ListItem>
                {selectedRental.costBreakdown?.lateFees > 0 && (
                  <ListItem>
                    <ListItemText
                      primary="Late Fees"
                      secondary={rentalService.formatCurrency(selectedRental.costBreakdown.lateFees)}
                    />
                  </ListItem>
                )}
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Total Cost"
                    primaryTypographyProps={{ variant: 'h6' }}
                    secondary={selectedRental.costBreakdown?.totalCost ? 
                      rentalService.formatCurrency(selectedRental.costBreakdown.totalCost) : 'N/A'}
                  />
                </ListItem>
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReceiptDialog(false)}>
            Close
          </Button>
          <Button variant="contained" startIcon={<DownloadIcon />}>
            Download
          </Button>
        </DialogActions>
      </Dialog>

      {/* Return Book Dialog */}
      <Dialog
        open={returnDialog}
        onClose={() => setReturnDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Return Book</DialogTitle>
        <DialogContent>
          {selectedRental && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedRental.book?.title}
              </Typography>
              
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Due: {rentalService.formatDate(selectedRental.rental?.actualEndDate)}
              </Typography>

              {rentalService.isOverdue(selectedRental.rental?.actualEndDate) && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  This book is overdue. Late fees will be calculated automatically.
                </Alert>
              )}

              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Return Date"
                  value={returnDate}
                  onChange={setReturnDate}
                  renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                />
              </LocalizationProvider>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleReturnBook}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Process Return'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RentalManagementPage;
