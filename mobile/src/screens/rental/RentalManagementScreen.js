import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  RefreshControl,
  FlatList,
  StyleSheet
} from 'react-native';
import {
  Card,
  Button,
  Badge,
  ListItem,
  Header,
  Tab,
  TabView,
  Input,
  CheckBox
} from 'react-native-elements';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import rentalService from '../services/rentalService';

const RentalManagementScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Rental History State
  const [rentalHistory, setRentalHistory] = useState([]);
  const [rentalSummary, setRentalSummary] = useState(null);
  const [historyPage, setHistoryPage] = useState(1);

  // Publisher Earnings State
  const [earnings, setEarnings] = useState([]);
  const [earningsSummary, setEarningsSummary] = useState(null);
  const [earningsPage, setEarningsPage] = useState(1);
  const [earningsStartDate, setEarningsStartDate] = useState(null);
  const [earningsEndDate, setEarningsEndDate] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Overdue Rentals State (Admin)
  const [overdueRentals, setOverdueRentals] = useState([]);

  // Dialog State
  const [selectedRental, setSelectedRental] = useState(null);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [returnDate, setReturnDate] = useState(new Date());
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false);

  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    loadUserRole();
  }, []);

  useEffect(() => {
    if (userRole) {
      loadData();
    }
  }, [activeTab, userRole, historyPage, earningsPage, earningsStartDate, earningsEndDate]);

  const loadUserRole = async () => {
    try {
      const role = await AsyncStorage.getItem('userRole');
      setUserRole(role);
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  const loadData = async () => {
    if (activeTab === 0 && (userRole === 'borrower' || userRole === 'admin')) {
      await loadRentalHistory();
    } else if (activeTab === 1 && (userRole === 'publisher' || userRole === 'admin')) {
      await loadPublisherEarnings();
    } else if (activeTab === 2 && userRole === 'admin') {
      await loadOverdueRentals();
    }
  };

  const loadRentalHistory = async () => {
    try {
      setLoading(true);
      setError('');

      const token = await AsyncStorage.getItem('token');
      rentalService.setAuthToken(token);

      const response = await rentalService.getBorrowerRentalHistory(historyPage, 10);
      
      if (response.success) {
        setRentalHistory(response.data.rentals);
        setRentalSummary(response.data.summary);
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

      const token = await AsyncStorage.getItem('token');
      rentalService.setAuthToken(token);

      const startDate = earningsStartDate ? earningsStartDate.toISOString() : null;
      const endDate = earningsEndDate ? earningsEndDate.toISOString() : null;

      const response = await rentalService.getPublisherEarnings(earningsPage, 10, startDate, endDate);
      
      if (response.success) {
        setEarnings(response.data.earnings);
        setEarningsSummary(response.data.summary);
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

      const token = await AsyncStorage.getItem('token');
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

      const token = await AsyncStorage.getItem('token');
      rentalService.setAuthToken(token);

      const response = await rentalService.returnBook(selectedRental._id, returnDate.toISOString());
      
      if (response.success) {
        Alert.alert(
          'Success',
          `Book returned successfully! ${response.data.lateFees > 0 ? `Late fees: ${rentalService.formatCurrency(response.data.lateFees)}` : ''}`,
          [{ text: 'OK', onPress: () => {
            setReturnModalVisible(false);
            setSelectedRental(null);
            loadData();
          }}]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessLateFees = async () => {
    try {
      setLoading(true);
      setError('');

      const token = await AsyncStorage.getItem('token');
      rentalService.setAuthToken(token);

      const response = await rentalService.processLateFees();
      
      if (response.success) {
        Alert.alert(
          'Success',
          `Late fees processed successfully! ${response.data.processedCount} rentals updated.`,
          [{ text: 'OK', onPress: () => loadOverdueRentals() }]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getRentalStatusBadge = (rental) => {
    const status = rentalService.getRentalStatusDisplay(rental);
    
    let badgeStatus = 'primary';
    if (status.color === 'success') badgeStatus = 'success';
    if (status.color === 'error') badgeStatus = 'error';
    if (status.color === 'warning') badgeStatus = 'warning';

    return (
      <Badge
        value={status.status}
        status={badgeStatus}
        textStyle={styles.badgeText}
      />
    );
  };

  const renderSummaryCard = (title, value, subtitle) => (
    <Card containerStyle={styles.summaryCard}>
      <Text style={styles.summaryTitle}>{title}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      {subtitle && <Text style={styles.summarySubtitle}>{subtitle}</Text>}
    </Card>
  );

  const renderRentalHistoryItem = ({ item }) => (
    <Card containerStyle={styles.rentalCard}>
      <View style={styles.rentalHeader}>
        <View style={styles.rentalInfo}>
          <Text style={styles.bookTitle}>{item.book?.title}</Text>
          <Text style={styles.bookAuthor}>by {item.book?.author}</Text>
          <Text style={styles.publisher}>Publisher: {item.publisher?.fullName}</Text>
        </View>
        {getRentalStatusBadge(item)}
      </View>
      
      <View style={styles.rentalDetails}>
        <Text style={styles.rentalPeriod}>
          {rentalService.formatDate(item.rental?.actualStartDate)} - {rentalService.formatDate(item.rental?.actualEndDate)}
        </Text>
        <Text style={styles.rentalDays}>
          {item.costBreakdown?.rentalDays} days
        </Text>
      </View>

      <View style={styles.costBreakdown}>
        <Text style={styles.totalCost}>
          Total: {rentalService.formatCurrency(item.costBreakdown?.totalCost || 0)}
        </Text>
        {item.costBreakdown?.lateFees > 0 && (
          <Text style={styles.lateFees}>
            Late fees: {rentalService.formatCurrency(item.costBreakdown.lateFees)}
          </Text>
        )}
      </View>

      <View style={styles.rentalActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setSelectedRental(item);
            setReceiptModalVisible(true);
          }}
        >
          <Icon name="receipt" size={20} color="#2196F3" />
          <Text style={styles.actionButtonText}>Receipt</Text>
        </TouchableOpacity>
        
        {item.rental?.status === 'active' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedRental(item);
              setReturnModalVisible(true);
            }}
          >
            <Icon name="check-circle" size={20} color="#4CAF50" />
            <Text style={styles.actionButtonText}>Return</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  const renderEarningsItem = ({ item }) => (
    <Card containerStyle={styles.earningsCard}>
      <View style={styles.earningsHeader}>
        <View style={styles.earningsInfo}>
          <Text style={styles.bookTitle}>{item.book?.title}</Text>
          <Text style={styles.bookAuthor}>by {item.book?.author}</Text>
          <Text style={styles.borrower}>Borrower: {item.borrower?.fullName}</Text>
        </View>
        {getRentalStatusBadge(item)}
      </View>

      <View style={styles.earningsDetails}>
        <Text style={styles.rentalPeriod}>
          {rentalService.formatDate(item.rental?.actualStartDate)} - {rentalService.formatDate(item.rental?.actualEndDate)}
        </Text>
        <Text style={styles.rentalDays}>
          {item.earningsBreakdown?.rentalDays} days
        </Text>
      </View>

      <View style={styles.earningsBreakdown}>
        <View style={styles.earningsRow}>
          <Text style={styles.earningsLabel}>Total Revenue:</Text>
          <Text style={styles.earningsValue}>
            {rentalService.formatCurrency(item.earningsBreakdown?.totalPaid || 0)}
          </Text>
        </View>
        <View style={styles.earningsRow}>
          <Text style={styles.earningsLabel}>Your Earnings:</Text>
          <Text style={[styles.earningsValue, styles.yourEarnings]}>
            {rentalService.formatCurrency(item.earningsBreakdown?.totalEarnings || 0)}
          </Text>
        </View>
        {item.earningsBreakdown?.lateFees > 0 && (
          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>Late Fees:</Text>
            <Text style={[styles.earningsValue, styles.lateFeeEarnings]}>
              +{rentalService.formatCurrency(item.earningsBreakdown.lateFees)}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );

  const renderOverdueItem = ({ item }) => (
    <Card containerStyle={styles.overdueCard}>
      <View style={styles.overdueHeader}>
        <View style={styles.overdueInfo}>
          <Text style={styles.bookTitle}>{item.book?.title}</Text>
          <Text style={styles.bookAuthor}>by {item.book?.author}</Text>
          <Text style={styles.borrower}>Borrower: {item.borrower?.fullName}</Text>
          <Text style={styles.publisher}>Publisher: {item.publisher?.fullName}</Text>
        </View>
        <Badge
          value={`${item.daysOverdue} days`}
          status="error"
          textStyle={styles.badgeText}
        />
      </View>

      <View style={styles.overdueDetails}>
        <Text style={styles.dueDate}>
          Due: {rentalService.formatDate(item.rental?.actualEndDate)}
        </Text>
        <Text style={styles.lateFees}>
          Accrued Late Fees: {rentalService.formatCurrency(item.accruedLateFees)}
        </Text>
      </View>

      <Button
        title="Process Return"
        buttonStyle={styles.processButton}
        onPress={() => {
          setSelectedRental(item);
          setReturnModalVisible(true);
        }}
      />
    </Card>
  );

  const renderRentalHistory = () => (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Summary Cards */}
      {rentalSummary && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryContainer}>
          {renderSummaryCard('Total Rentals', rentalSummary.totalRentals)}
          {renderSummaryCard('Active Rentals', rentalSummary.activeRentals)}
          {renderSummaryCard('Total Spent', rentalService.formatCurrency(rentalSummary.totalSpent))}
          {renderSummaryCard('Late Fees', rentalService.formatCurrency(rentalSummary.totalLateFees))}
        </ScrollView>
      )}

      <FlatList
        data={rentalHistory}
        renderItem={renderRentalHistoryItem}
        keyExtractor={(item) => item._id}
        scrollEnabled={false}
      />
    </ScrollView>
  );

  const renderPublisherEarnings = () => (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Date Filters */}
      <Card containerStyle={styles.filterCard}>
        <Text style={styles.filterTitle}>Filter Earnings</Text>
        
        <View style={styles.dateFilters}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              Start Date: {earningsStartDate ? rentalService.formatDate(earningsStartDate) : 'Select'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              End Date: {earningsEndDate ? rentalService.formatDate(earningsEndDate) : 'Select'}
            </Text>
          </TouchableOpacity>
        </View>

        <Button
          title="Clear Filters"
          type="outline"
          buttonStyle={styles.clearButton}
          onPress={() => {
            setEarningsStartDate(null);
            setEarningsEndDate(null);
          }}
        />
      </Card>

      {/* Summary Cards */}
      {earningsSummary && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryContainer}>
          {renderSummaryCard('Total Rentals', earningsSummary.totalRentals)}
          {renderSummaryCard('Gross Revenue', rentalService.formatCurrency(earningsSummary.grossRevenue))}
          {renderSummaryCard('Net Earnings', rentalService.formatCurrency(earningsSummary.netEarnings))}
          {renderSummaryCard('Platform Fees', rentalService.formatCurrency(earningsSummary.platformFees))}
        </ScrollView>
      )}

      <FlatList
        data={earnings}
        renderItem={renderEarningsItem}
        keyExtractor={(item) => item._id}
        scrollEnabled={false}
      />

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={earningsStartDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) {
              setEarningsStartDate(selectedDate);
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={earningsEndDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) {
              setEarningsEndDate(selectedDate);
            }
          }}
        />
      )}
    </ScrollView>
  );

  const renderOverdueRentals = () => (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Card containerStyle={styles.actionCard}>
        <Button
          title="Process All Late Fees"
          buttonStyle={styles.processAllButton}
          onPress={handleProcessLateFees}
          loading={loading}
        />
      </Card>

      <FlatList
        data={overdueRentals}
        renderItem={renderOverdueItem}
        keyExtractor={(item) => item._id}
        scrollEnabled={false}
      />
    </ScrollView>
  );

  const tabs = [];
  if (userRole === 'borrower' || userRole === 'admin') {
    tabs.push({ title: 'My Rentals' });
  }
  if (userRole === 'publisher' || userRole === 'admin') {
    tabs.push({ title: 'My Earnings' });
  }
  if (userRole === 'admin') {
    tabs.push({ title: 'Overdue Rentals' });
  }

  return (
    <View style={styles.container}>
      <Header
        centerComponent={{ text: 'Rental Management', style: { color: '#fff', fontSize: 18 } }}
        backgroundColor="#2196F3"
      />

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Tab
        value={activeTab}
        onChange={setActiveTab}
        indicatorStyle={styles.tabIndicator}
        variant="primary"
      >
        {tabs.map((tab, index) => (
          <Tab.Item key={index} title={tab.title} titleStyle={styles.tabTitle} />
        ))}
      </Tab>

      <TabView value={activeTab} onChange={setActiveTab}>
        {(userRole === 'borrower' || userRole === 'admin') && (
          <TabView.Item style={styles.tabContent}>
            {renderRentalHistory()}
          </TabView.Item>
        )}

        {(userRole === 'publisher' || userRole === 'admin') && (
          <TabView.Item style={styles.tabContent}>
            {renderPublisherEarnings()}
          </TabView.Item>
        )}

        {userRole === 'admin' && (
          <TabView.Item style={styles.tabContent}>
            {renderOverdueRentals()}
          </TabView.Item>
        )}
      </TabView>

      {/* Receipt Modal */}
      <Modal
        visible={receiptModalVisible}
        animationType="slide"
        onRequestClose={() => setReceiptModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Header
            centerComponent={{ text: 'Rental Receipt', style: { color: '#fff' } }}
            backgroundColor="#2196F3"
            rightComponent={{
              icon: 'close',
              color: '#fff',
              onPress: () => setReceiptModalVisible(false)
            }}
          />

          {selectedRental && (
            <ScrollView style={styles.receiptContent}>
              <Card containerStyle={styles.receiptCard}>
                <Text style={styles.receiptTitle}>{selectedRental.book?.title}</Text>
                
                <View style={styles.receiptDetails}>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Daily Rate:</Text>
                    <Text style={styles.receiptValue}>
                      {selectedRental.costBreakdown?.dailyRate ? 
                        rentalService.formatCurrency(selectedRental.costBreakdown.dailyRate) : 'N/A'}
                    </Text>
                  </View>
                  
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Rental Days:</Text>
                    <Text style={styles.receiptValue}>
                      {selectedRental.costBreakdown?.rentalDays || 'N/A'}
                    </Text>
                  </View>
                  
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Base Cost:</Text>
                    <Text style={styles.receiptValue}>
                      {selectedRental.costBreakdown?.baseCost ? 
                        rentalService.formatCurrency(selectedRental.costBreakdown.baseCost) : 'N/A'}
                    </Text>
                  </View>
                  
                  {selectedRental.costBreakdown?.lateFees > 0 && (
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Late Fees:</Text>
                      <Text style={styles.receiptValue}>
                        {rentalService.formatCurrency(selectedRental.costBreakdown.lateFees)}
                      </Text>
                    </View>
                  )}
                  
                  <View style={[styles.receiptRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total Cost:</Text>
                    <Text style={styles.totalValue}>
                      {selectedRental.costBreakdown?.totalCost ? 
                        rentalService.formatCurrency(selectedRental.costBreakdown.totalCost) : 'N/A'}
                    </Text>
                  </View>
                </View>
              </Card>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Return Book Modal */}
      <Modal
        visible={returnModalVisible}
        animationType="slide"
        onRequestClose={() => setReturnModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Header
            centerComponent={{ text: 'Return Book', style: { color: '#fff' } }}
            backgroundColor="#2196F3"
            rightComponent={{
              icon: 'close',
              color: '#fff',
              onPress: () => setReturnModalVisible(false)
            }}
          />

          {selectedRental && (
            <ScrollView style={styles.returnContent}>
              <Card containerStyle={styles.returnCard}>
                <Text style={styles.returnTitle}>{selectedRental.book?.title}</Text>
                
                <Text style={styles.dueInfo}>
                  Due: {rentalService.formatDate(selectedRental.rental?.actualEndDate)}
                </Text>

                {rentalService.isOverdue(selectedRental.rental?.actualEndDate) && (
                  <View style={styles.overdueWarning}>
                    <Icon name="warning" size={20} color="#f44336" />
                    <Text style={styles.overdueWarningText}>
                      This book is overdue. Late fees will be calculated automatically.
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.dateSelector}
                  onPress={() => setShowReturnDatePicker(true)}
                >
                  <Text style={styles.dateSelectorLabel}>Return Date:</Text>
                  <Text style={styles.dateSelectorValue}>
                    {rentalService.formatDate(returnDate)}
                  </Text>
                  <Icon name="calendar-today" size={20} color="#2196F3" />
                </TouchableOpacity>

                <View style={styles.returnActions}>
                  <Button
                    title="Cancel"
                    type="outline"
                    buttonStyle={styles.cancelButton}
                    onPress={() => setReturnModalVisible(false)}
                  />
                  <Button
                    title="Process Return"
                    buttonStyle={styles.returnButton}
                    onPress={handleReturnBook}
                    loading={loading}
                  />
                </View>
              </Card>
            </ScrollView>
          )}

          {showReturnDatePicker && (
            <DateTimePicker
              value={returnDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowReturnDatePicker(false);
                if (selectedDate) {
                  setReturnDate(selectedDate);
                }
              }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  tabIndicator: {
    backgroundColor: '#2196F3'
  },
  tabTitle: {
    fontSize: 14,
    fontWeight: '600'
  },
  tabContent: {
    flex: 1
  },
  errorContainer: {
    backgroundColor: '#f44336',
    padding: 12,
    margin: 16,
    borderRadius: 4
  },
  errorText: {
    color: '#fff',
    textAlign: 'center'
  },
  summaryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  summaryCard: {
    width: 120,
    marginRight: 8,
    padding: 12,
    borderRadius: 8
  },
  summaryTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  summarySubtitle: {
    fontSize: 10,
    color: '#999',
    marginTop: 2
  },
  rentalCard: {
    margin: 8,
    borderRadius: 8,
    elevation: 2
  },
  rentalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  rentalInfo: {
    flex: 1
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2
  },
  publisher: {
    fontSize: 12,
    color: '#999'
  },
  borrower: {
    fontSize: 12,
    color: '#999'
  },
  rentalDetails: {
    marginBottom: 8
  },
  rentalPeriod: {
    fontSize: 14,
    color: '#333'
  },
  rentalDays: {
    fontSize: 12,
    color: '#666'
  },
  costBreakdown: {
    marginBottom: 12
  },
  totalCost: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  lateFees: {
    fontSize: 12,
    color: '#f44336'
  },
  rentalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8
  },
  actionButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#2196F3'
  },
  earningsCard: {
    margin: 8,
    borderRadius: 8,
    elevation: 2
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  earningsInfo: {
    flex: 1
  },
  earningsDetails: {
    marginBottom: 8
  },
  earningsBreakdown: {
    marginBottom: 8
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  earningsLabel: {
    fontSize: 14,
    color: '#666'
  },
  earningsValue: {
    fontSize: 14,
    color: '#333'
  },
  yourEarnings: {
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  lateFeeEarnings: {
    color: '#4CAF50'
  },
  overdueCard: {
    margin: 8,
    borderRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336'
  },
  overdueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  overdueInfo: {
    flex: 1
  },
  overdueDetails: {
    marginBottom: 12
  },
  dueDate: {
    fontSize: 14,
    color: '#f44336',
    fontWeight: 'bold'
  },
  processButton: {
    backgroundColor: '#2196F3'
  },
  processAllButton: {
    backgroundColor: '#ff9800'
  },
  actionCard: {
    margin: 8,
    borderRadius: 8
  },
  filterCard: {
    margin: 8,
    borderRadius: 8
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12
  },
  dateFilters: {
    marginBottom: 12
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 8
  },
  dateButtonText: {
    fontSize: 14,
    color: '#333'
  },
  clearButton: {
    borderColor: '#666'
  },
  badgeText: {
    fontSize: 10
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  receiptContent: {
    flex: 1,
    padding: 16
  },
  receiptCard: {
    borderRadius: 8
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16
  },
  receiptDetails: {
    marginBottom: 16
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  receiptLabel: {
    fontSize: 14,
    color: '#666'
  },
  receiptValue: {
    fontSize: 14,
    color: '#333'
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 8,
    marginTop: 8
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  returnContent: {
    flex: 1,
    padding: 16
  },
  returnCard: {
    borderRadius: 8
  },
  returnTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16
  },
  dueInfo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16
  },
  overdueWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16
  },
  overdueWarningText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#f57c00'
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 24
  },
  dateSelectorLabel: {
    fontSize: 14,
    color: '#666'
  },
  dateSelectorValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'center'
  },
  returnActions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  cancelButton: {
    flex: 0.4,
    borderColor: '#666'
  },
  returnButton: {
    flex: 0.4,
    backgroundColor: '#4CAF50'
  }
});

export default RentalManagementScreen;
