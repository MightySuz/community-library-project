import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import borrowerService from '../services/borrowerService';

const Tab = createMaterialTopTabNavigator();
const { width: screenWidth } = Dimensions.get('window');

// Dashboard Tab Component
function DashboardTab() {
  const [stats, setStats] = useState({});
  const [popularBooks, setPopularBooks] = useState([]);
  const [recentBooks, setRecentBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [statsData, popularData, recentData] = await Promise.all([
        borrowerService.getDashboardStats(),
        borrowerService.getPopularBooks(),
        borrowerService.getRecentBooks()
      ]);

      setStats(statsData);
      setPopularBooks(popularData);
      setRecentBooks(recentData);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const StatCard = ({ title, value, icon, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <View style={styles.statTextContainer}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
        <Icon name={icon} size={32} color={color} />
      </View>
    </View>
  );

  const BookItem = ({ book, onPress }) => (
    <TouchableOpacity style={styles.bookItem} onPress={() => onPress(book)}>
      <View style={styles.bookContent}>
        <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.bookAuthor}>by {book.author}</Text>
        <Text style={styles.bookPrice}>
          {borrowerService.formatCurrency(book.rental?.pricePerDay || 0)}/day
        </Text>
        {book.rentalCount && (
          <Text style={styles.bookStats}>{book.rentalCount} rentals</Text>
        )}
        {book.createdAt && (
          <Text style={styles.bookStats}>
            Added {borrowerService.formatRelativeDate(book.createdAt)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Active Rentals"
          value={stats.activeRentals || 0}
          icon="book"
          color="#2196f3"
        />
        <StatCard
          title="Active Holds"
          value={stats.holds || 0}
          icon="schedule"
          color="#ff9800"
        />
        <StatCard
          title="Overdue Books"
          value={stats.overdueBooks || 0}
          icon="warning"
          color="#f44336"
        />
        <StatCard
          title="Wallet Balance"
          value={borrowerService.formatCurrency(stats.walletBalance || 0)}
          icon="account-balance-wallet"
          color="#4caf50"
        />
      </View>

      {/* Popular Books */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular in Your Community</Text>
        <FlatList
          data={popularBooks.slice(0, 5)}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <BookItem
              book={item}
              onPress={(book) => Alert.alert('Book Details', `${book.title} by ${book.author}`)}
            />
          )}
          contentContainerStyle={styles.horizontalList}
        />
      </View>

      {/* Recent Books */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recently Added</Text>
        <FlatList
          data={recentBooks.slice(0, 5)}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <BookItem
              book={item}
              onPress={(book) => Alert.alert('Book Details', `${book.title} by ${book.author}`)}
            />
          )}
          contentContainerStyle={styles.horizontalList}
        />
      </View>
    </ScrollView>
  );
}

// Search Tab Component
function SearchTab() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [genres, setGenres] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    try {
      const [genresData, authorsData] = await Promise.all([
        borrowerService.getAvailableGenres(),
        borrowerService.getAvailableAuthors()
      ]);
      setGenres(genresData);
      setAuthors(authorsData);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const searchBooks = async (resetResults = true) => {
    if (loading) return;

    setLoading(true);
    try {
      const searchParams = {
        search: searchText,
        genre: selectedGenre,
        author: selectedAuthor,
        page: resetResults ? 1 : page,
        limit: 20
      };

      const result = await borrowerService.searchBooks(searchParams);
      
      if (resetResults) {
        setBooks(result.books || []);
        setPage(2);
      } else {
        setBooks(prev => [...prev, ...(result.books || [])]);
        setPage(prev => prev + 1);
      }
      
      setHasMore((result.pagination?.page || 1) < (result.pagination?.pages || 1));
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    searchBooks(true);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      searchBooks(false);
    }
  };

  const placeHold = async (bookId) => {
    try {
      await borrowerService.placeHold(bookId);
      Alert.alert('Success', 'Hold placed successfully!');
      handleSearch(); // Refresh search results
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const BookCard = ({ book }) => (
    <View style={styles.bookCard}>
      <View style={styles.bookCardContent}>
        <Text style={styles.bookCardTitle} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.bookCardAuthor}>by {book.author}</Text>
        <Text style={styles.bookCardGenre}>{book.genre}</Text>
        <Text style={styles.bookCardPublisher}>
          Publisher: {book.publisher?.fullName}
        </Text>
        <View style={styles.bookCardFooter}>
          <Text style={styles.bookCardPrice}>
            {borrowerService.formatCurrency(book.rental?.pricePerDay || 0)}/day
          </Text>
          <View style={[
            styles.statusChip,
            { backgroundColor: borrowerService.getStatusColor(book.availability?.status) }
          ]}>
            <Text style={styles.statusText}>
              {borrowerService.getStatusText(book.availability?.status)}
            </Text>
          </View>
        </View>
        <View style={styles.bookCardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Book Details', `${book.title} by ${book.author}`)}
          >
            <Text style={styles.actionButtonText}>View Details</Text>
          </TouchableOpacity>
          {book.availability?.canHold && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => placeHold(book._id)}
            >
              <Text style={[styles.actionButtonText, styles.primaryButtonText]}>Hold</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={24} color="#757575" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search books..."
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Icon name="filter-list" size={24} color="#757575" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filterLabel}>Genre:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterChip, !selectedGenre && styles.filterChipSelected]}
              onPress={() => setSelectedGenre('')}
            >
              <Text style={[styles.filterChipText, !selectedGenre && styles.filterChipTextSelected]}>
                All
              </Text>
            </TouchableOpacity>
            {genres.map((genre) => (
              <TouchableOpacity
                key={genre}
                style={[styles.filterChip, selectedGenre === genre && styles.filterChipSelected]}
                onPress={() => setSelectedGenre(genre)}
              >
                <Text style={[styles.filterChipText, selectedGenre === genre && styles.filterChipTextSelected]}>
                  {genre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results */}
      <FlatList
        data={books}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <BookCard book={item} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading && <ActivityIndicator size="small" color="#2196f3" />}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Icon name="search" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No books found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search criteria</Text>
            </View>
          )
        }
        contentContainerStyle={styles.resultsContainer}
      />
    </View>
  );
}

// Rentals Tab Component
function RentalsTab() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRentals = async () => {
    try {
      const rentalsData = await borrowerService.getUserRentals();
      setRentals(rentalsData);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRentals();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadRentals();
  };

  const cancelHold = async (holdId) => {
    Alert.alert(
      'Cancel Hold',
      'Are you sure you want to cancel this hold?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await borrowerService.cancelHold(holdId);
              Alert.alert('Success', 'Hold cancelled successfully!');
              loadRentals();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const convertHoldToRequest = async (holdId) => {
    try {
      await borrowerService.convertHoldToRequest(holdId);
      Alert.alert('Success', 'Hold converted to rental request!');
      loadRentals();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const RentalCard = ({ rental }) => (
    <View style={styles.rentalCard}>
      <View style={styles.rentalCardContent}>
        <Text style={styles.rentalCardTitle} numberOfLines={2}>
          {rental.book?.title}
        </Text>
        <Text style={styles.rentalCardAuthor}>by {rental.book?.author}</Text>
        <Text style={styles.rentalCardPublisher}>
          Publisher: {rental.publisher?.fullName}
        </Text>
        
        <View style={[
          styles.statusChip,
          { backgroundColor: borrowerService.getRentalStatusColor(rental.status) }
        ]}>
          <Text style={styles.statusText}>
            {borrowerService.getRentalStatusText(rental.status)}
          </Text>
        </View>

        {rental.status === 'hold' && rental.holdExpiry && (
          <Text style={[
            styles.expiryText,
            borrowerService.isHoldExpiringSoon(rental.holdExpiry) && styles.expiryTextWarning
          ]}>
            Expires in: {borrowerService.getTimeUntilExpiry(rental.holdExpiry)}
          </Text>
        )}

        {rental.rental?.actualEndDate && (
          <Text style={styles.dueDateText}>
            Due: {borrowerService.formatDate(rental.rental.actualEndDate)}
          </Text>
        )}

        {rental.daysOverdue && (
          <Text style={styles.overdueText}>
            {rental.daysOverdue} days overdue • Late fee: {borrowerService.formatCurrency(rental.lateFee)}
          </Text>
        )}

        <View style={styles.rentalCardActions}>
          {rental.status === 'hold' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={() => convertHoldToRequest(rental._id)}
              >
                <Text style={[styles.actionButtonText, styles.primaryButtonText]}>
                  Request Book
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.dangerButton]}
                onPress={() => cancelHold(rental._id)}
              >
                <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
                  Cancel Hold
                </Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Book Details', `${rental.book?.title} by ${rental.book?.author}`)}
          >
            <Text style={styles.actionButtonText}>View Book</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
      </View>
    );
  }

  return (
    <FlatList
      data={rentals}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => <RentalCard rental={item} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Icon name="book" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No Active Rentals or Holds</Text>
          <Text style={styles.emptySubtext}>Search for books and place holds to get started!</Text>
        </View>
      }
      contentContainerStyle={styles.resultsContainer}
    />
  );
}

// Wallet Tab Component
function WalletTab() {
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [addFundsAmount, setAddFundsAmount] = useState('');

  const loadWallet = async () => {
    try {
      const walletData = await borrowerService.getWallet();
      setWallet(walletData);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadWallet();
  };

  const addFunds = async () => {
    if (!addFundsAmount || parseFloat(addFundsAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      await borrowerService.addFundsToWallet(parseFloat(addFundsAmount), {
        type: 'card',
        cardNumber: '4242424242424242' // Test card
      });
      Alert.alert('Success', `Successfully added ${borrowerService.formatCurrency(parseFloat(addFundsAmount))} to wallet!`);
      setShowAddFunds(false);
      setAddFundsAmount('');
      loadWallet();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const TransactionItem = ({ transaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionContent}>
        <Text style={styles.transactionDescription}>{transaction.description}</Text>
        <Text style={styles.transactionDate}>
          {borrowerService.formatDate(transaction.date)}
        </Text>
      </View>
      <Text style={[
        styles.transactionAmount,
        { color: transaction.type === 'deposit' ? '#4caf50' : '#f44336' }
      ]}>
        {transaction.type === 'deposit' ? '+' : '-'}
        {borrowerService.formatCurrency(transaction.amount)}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>
            {borrowerService.formatCurrency(wallet.balance)}
          </Text>
          <TouchableOpacity
            style={styles.addFundsButton}
            onPress={() => setShowAddFunds(true)}
          >
            <Icon name="add" size={20} color="#fff" />
            <Text style={styles.addFundsButtonText}>Add Funds</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {wallet.transactions?.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet</Text>
          ) : (
            wallet.transactions?.slice(0, 10).map((transaction, index) => (
              <TransactionItem key={transaction._id || index} transaction={transaction} />
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Funds Modal */}
      <Modal
        visible={showAddFunds}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddFunds(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Funds to Wallet</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="Enter amount"
              value={addFundsAmount}
              onChangeText={setAddFundsAmount}
              keyboardType="decimal-pad"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowAddFunds(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton]}
                onPress={addFunds}
              >
                <Text style={[styles.modalButtonText, styles.primaryButtonText]}>
                  Add Funds
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Main Borrower Dashboard Component
export default function BorrowerDashboardScreen() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2196f3',
        tabBarInactiveTintColor: '#757575',
        tabBarIndicatorStyle: { backgroundColor: '#2196f3' },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: { backgroundColor: '#fff' }
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardTab} />
      <Tab.Screen name="Search" component={SearchTab} />
      <Tab.Screen name="Rentals" component={RentalsTab} />
      <Tab.Screen name="Wallet" component={WalletTab} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between'
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: '48%'
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statTextContainer: {
    flex: 1
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  section: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16
  },
  horizontalList: {
    paddingRight: 16
  },
  bookItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    width: 200,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  bookContent: {
    flex: 1
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  bookAuthor: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  bookPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2196f3',
    marginBottom: 4
  },
  bookStats: {
    fontSize: 10,
    color: '#999'
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center'
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333'
  },
  filterButton: {
    marginLeft: 12,
    padding: 8
  },
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  filterChip: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8
  },
  filterChipSelected: {
    backgroundColor: '#2196f3'
  },
  filterChipText: {
    fontSize: 12,
    color: '#666'
  },
  filterChipTextSelected: {
    color: '#fff'
  },
  searchButton: {
    backgroundColor: '#2196f3',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  resultsContainer: {
    padding: 16,
    flexGrow: 1
  },
  bookCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  bookCardContent: {
    padding: 16
  },
  bookCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  bookCardAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  bookCardGenre: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4
  },
  bookCardPublisher: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8
  },
  bookCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  bookCardPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196f3'
  },
  statusChip: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold'
  },
  bookCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginRight: 8
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666'
  },
  primaryButton: {
    backgroundColor: '#2196f3',
    borderColor: '#2196f3'
  },
  primaryButtonText: {
    color: '#fff'
  },
  dangerButton: {
    backgroundColor: '#f44336',
    borderColor: '#f44336'
  },
  dangerButtonText: {
    color: '#fff'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    textAlign: 'center'
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center'
  },
  rentalCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  rentalCardContent: {
    padding: 16
  },
  rentalCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  rentalCardAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  rentalCardPublisher: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8
  },
  expiryText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  expiryTextWarning: {
    color: '#f44336'
  },
  dueDateText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  overdueText: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 4
  },
  rentalCardActions: {
    flexDirection: 'row',
    marginTop: 12
  },
  balanceCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196f3',
    marginBottom: 16
  },
  addFundsButton: {
    backgroundColor: '#2196f3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20
  },
  addFundsButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: 'bold'
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  transactionContent: {
    flex: 1
  },
  transactionDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2
  },
  transactionDate: {
    fontSize: 12,
    color: '#999'
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    width: '80%',
    maxWidth: 400
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center'
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 16
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  modalButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4
  },
  modalButtonText: {
    fontSize: 16,
    color: '#666'
  }
});
