import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { publisherService } from '../../services/publisherService';

const PublisherDashboardScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dashboard data
  const [dashboardStats, setDashboardStats] = useState({});
  
  // Books data
  const [books, setBooks] = useState([]);
  const [addBookModal, setAddBookModal] = useState(false);
  const [scannerModal, setScannerModal] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  
  // Requests data
  const [requests, setRequests] = useState([]);
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  
  // Form data
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    barcode: '',
    genre: 'Fiction',
    description: '',
    condition: 'good',
    publishedYear: new Date().getFullYear().toString(),
    language: 'English',
    pages: '',
    rental: {
      pricePerDay: '',
      maxRentalDays: '14'
    },
    purchasePrice: ''
  });

  useEffect(() => {
    loadInitialData();
    getCameraPermissions();
  }, []);

  useEffect(() => {
    switch (activeTab) {
      case 'dashboard':
        loadDashboard();
        break;
      case 'books':
        loadBooks();
        break;
      case 'requests':
        loadRequests();
        break;
      case 'borrowed':
        loadBorrowedBooks();
        break;
      default:
        break;
    }
  }, [activeTab]);

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadDashboard(),
        loadBooks(),
        loadRequests()
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const loadDashboard = async () => {
    try {
      const stats = await publisherService.getDashboard();
      setDashboardStats(stats);
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard');
    }
  };

  const loadBooks = async () => {
    try {
      const booksData = await publisherService.getBooks();
      setBooks(booksData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load books');
    }
  };

  const loadRequests = async () => {
    try {
      const requestsData = await publisherService.getRequests();
      setRequests(requestsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load requests');
    }
  };

  const loadBorrowedBooks = async () => {
    try {
      const borrowed = await publisherService.getBorrowedBooks();
      setBorrowedBooks(borrowed);
    } catch (error) {
      Alert.alert('Error', 'Failed to load borrowed books');
    }
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    setScannerModal(false);
    
    try {
      setLoading(true);
      const bookInfo = await publisherService.getBookFromBarcode(data);
      setBookForm({ ...bookForm, ...bookInfo });
      setAddBookModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to get book information from barcode');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async () => {
    try {
      if (!bookForm.title || !bookForm.author || !bookForm.rental.pricePerDay) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      setLoading(true);
      await publisherService.addBook(bookForm);
      setAddBookModal(false);
      resetBookForm();
      loadBooks();
      Alert.alert('Success', 'Book added successfully');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      await publisherService.approveRequest(requestId, {
        message: 'Request approved'
      });
      Alert.alert('Success', 'Request approved');
      loadRequests();
    } catch (error) {
      Alert.alert('Error', 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    Alert.prompt(
      'Reject Request',
      'Please provide a reason for rejection:',
      async (reason) => {
        if (reason) {
          try {
            await publisherService.rejectRequest(requestId, { reason });
            Alert.alert('Success', 'Request rejected');
            loadRequests();
          } catch (error) {
            Alert.alert('Error', 'Failed to reject request');
          }
        }
      }
    );
  };

  const handleMarkReturned = async (requestId) => {
    Alert.alert(
      'Mark as Returned',
      'Is there any damage to the book?',
      [
        {
          text: 'No Damage',
          onPress: async () => {
            try {
              await publisherService.markReturned(requestId, { damage: false });
              Alert.alert('Success', 'Book marked as returned');
              loadBorrowedBooks();
            } catch (error) {
              Alert.alert('Error', 'Failed to mark as returned');
            }
          }
        },
        {
          text: 'With Damage',
          onPress: () => {
            Alert.prompt(
              'Damage Amount',
              'Enter damage fee amount:',
              async (amount) => {
                if (amount) {
                  Alert.prompt(
                    'Damage Description',
                    'Describe the damage:',
                    async (description) => {
                      try {
                        await publisherService.markReturned(requestId, {
                          damage: true,
                          damageAmount: parseFloat(amount),
                          damageDescription: description
                        });
                        Alert.alert('Success', 'Book marked as returned with damage fee');
                        loadBorrowedBooks();
                      } catch (error) {
                        Alert.alert('Error', 'Failed to mark as returned');
                      }
                    }
                  );
                }
              },
              'plain-text',
              '',
              'numeric'
            );
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const resetBookForm = () => {
    setBookForm({
      title: '',
      author: '',
      isbn: '',
      barcode: '',
      genre: 'Fiction',
      description: '',
      condition: 'good',
      publishedYear: new Date().getFullYear().toString(),
      language: 'English',
      pages: '',
      rental: {
        pricePerDay: '',
        maxRentalDays: '14'
      },
      purchasePrice: ''
    });
  };

  const StatCard = ({ title, value, subtitle, icon, color = '#2196F3' }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <View style={styles.statText}>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={[styles.statValue, { color }]}>{value}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
        <Icon name={icon} size={32} color={color} />
      </View>
    </View>
  );

  const TabButton = ({ id, title, icon, active, onPress }) => (
    <TouchableOpacity
      style={[styles.tabButton, active && styles.activeTab]}
      onPress={onPress}
    >
      <Icon name={icon} size={20} color={active ? '#fff' : '#666'} />
      <Text style={[styles.tabText, active && styles.activeTabText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const BookCard = ({ book }) => (
    <View style={styles.bookCard}>
      <View style={styles.bookHeader}>
        <Text style={styles.bookTitle}>{book.title}</Text>
        <View style={styles.bookStatus}>
          <View style={[
            styles.statusBadge,
            {
              backgroundColor:
                book.approvalStatus === 'approved' ? '#4CAF50' :
                book.approvalStatus === 'rejected' ? '#F44336' : '#FF9800'
            }
          ]}>
            <Text style={styles.statusText}>{book.approvalStatus}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.bookAuthor}>by {book.author}</Text>
      <Text style={styles.bookGenre}>{book.genre}</Text>
      <View style={styles.bookDetails}>
        <Text style={styles.bookPrice}>${book.rental?.pricePerDay || 0}/day</Text>
        <View style={[
          styles.availabilityBadge,
          {
            backgroundColor:
              book.availability?.status === 'available' ? '#4CAF50' :
              book.availability?.status === 'borrowed' ? '#F44336' : '#666'
          }
        ]}>
          <Text style={styles.availabilityText}>
            {book.availability?.status || 'unknown'}
          </Text>
        </View>
      </View>
    </View>
  );

  const RequestCard = ({ request }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Text style={styles.requestBook}>{request.book?.title}</Text>
        <View style={[
          styles.statusBadge,
          {
            backgroundColor:
              request.status === 'approved' ? '#4CAF50' :
              request.status === 'rejected' ? '#F44336' : '#FF9800'
          }
        ]}>
          <Text style={styles.statusText}>{request.status}</Text>
        </View>
      </View>
      <Text style={styles.requestBorrower}>{request.borrower?.fullName}</Text>
      <Text style={styles.requestCommunity}>{request.borrower?.communityName}</Text>
      <Text style={styles.requestDates}>
        {new Date(request.requestedStartDate).toLocaleDateString()} - 
        {new Date(request.requestedEndDate).toLocaleDateString()}
      </Text>
      
      {request.status === 'pending' && (
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApproveRequest(request._id)}
          >
            <Icon name="check" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleRejectRequest(request._id)}
          >
            <Icon name="close" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const BorrowedCard = ({ rental }) => (
    <View style={styles.borrowedCard}>
      <View style={styles.borrowedHeader}>
        <Text style={styles.borrowedBook}>{rental.book?.title}</Text>
        <View style={[
          styles.statusBadge,
          {
            backgroundColor: rental.rental?.status === 'overdue' ? '#F44336' : '#2196F3'
          }
        ]}>
          <Text style={styles.statusText}>{rental.rental?.status || 'active'}</Text>
        </View>
      </View>
      <Text style={styles.borrowedBorrower}>{rental.borrower?.fullName}</Text>
      <Text style={styles.borrowedDates}>
        Due: {new Date(rental.rental?.actualEndDate).toLocaleDateString()}
      </Text>
      {rental.rental?.status === 'overdue' && (
        <Text style={styles.overdueDays}>
          {rental.daysOverdue} days overdue
        </Text>
      )}
      {rental.totalFines > 0 && (
        <Text style={styles.finesAmount}>
          Fines: ${rental.totalFines?.toFixed(2)}
        </Text>
      )}
      
      <TouchableOpacity
        style={styles.returnButton}
        onPress={() => handleMarkReturned(rental._id)}
      >
        <Text style={styles.returnButtonText}>Mark Returned</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDashboard = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.sectionTitle}>Dashboard Overview</Text>
      
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Books"
          value={dashboardStats.totalBooks || 0}
          subtitle="In catalog"
          icon="library-books"
          color="#4CAF50"
        />
        <StatCard
          title="Pending Requests"
          value={dashboardStats.pendingRequests || 0}
          subtitle="Need approval"
          icon="pending-actions"
          color="#FF9800"
        />
        <StatCard
          title="Currently Borrowed"
          value={dashboardStats.activeRentals || 0}
          subtitle="Books out"
          icon="schedule"
          color="#2196F3"
        />
        <StatCard
          title="Overdue Books"
          value={dashboardStats.overdueRentals || 0}
          subtitle="Past due"
          icon="warning"
          color="#F44336"
        />
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={[styles.actionCard, styles.scanAction]}
          onPress={() => setScannerModal(true)}
        >
          <Icon name="qr-code-scanner" size={24} color="#fff" />
          <Text style={styles.actionCardText}>Scan Barcode</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionCard, styles.addAction]}
          onPress={() => setAddBookModal(true)}
        >
          <Icon name="add" size={24} color="#fff" />
          <Text style={styles.actionCardText}>Add Book Manually</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderBooks = () => (
    <View style={styles.content}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Books ({books.length})</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setAddBookModal(true)}
        >
          <Icon name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={books}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <BookCard book={item} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const renderRequests = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>
        Checkout Requests ({requests.length})
      </Text>
      
      <FlatList
        data={requests}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <RequestCard request={item} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const renderBorrowed = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>
        Currently Borrowed Books ({borrowedBooks.length})
      </Text>
      
      <FlatList
        data={borrowedBooks}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <BorrowedCard rental={item} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Publisher Dashboard</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Icon name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
      >
        <TabButton
          id="dashboard"
          title="Dashboard"
          icon="dashboard"
          active={activeTab === 'dashboard'}
          onPress={() => setActiveTab('dashboard')}
        />
        <TabButton
          id="books"
          title="My Books"
          icon="library-books"
          active={activeTab === 'books'}
          onPress={() => setActiveTab('books')}
        />
        <TabButton
          id="requests"
          title="Requests"
          icon="pending-actions"
          active={activeTab === 'requests'}
          onPress={() => setActiveTab('requests')}
        />
        <TabButton
          id="borrowed"
          title="Borrowed"
          icon="schedule"
          active={activeTab === 'borrowed'}
          onPress={() => setActiveTab('borrowed')}
        />
      </ScrollView>

      {loading && !refreshing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      )}

      <ScrollView
        style={styles.tabContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'books' && renderBooks()}
        {activeTab === 'requests' && renderRequests()}
        {activeTab === 'borrowed' && renderBorrowed()}
      </ScrollView>

      {/* Barcode Scanner Modal */}
      <Modal
        visible={scannerModal}
        animationType="slide"
        onRequestClose={() => setScannerModal(false)}
      >
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setScannerModal(false)}
            >
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Scan Book Barcode</Text>
          </View>
          
          <BarCodeScanner
            onBarCodeScanned={handleBarCodeScanned}
            style={styles.scanner}
          />
          
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame} />
            <Text style={styles.scannerInstructions}>
              Position the barcode within the frame
            </Text>
          </View>
        </View>
      </Modal>

      {/* Add Book Modal */}
      <Modal
        visible={addBookModal}
        animationType="slide"
        onRequestClose={() => setAddBookModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setAddBookModal(false);
                resetBookForm();
              }}
            >
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Book</Text>
            <TouchableOpacity onPress={handleAddBook}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.input}
                value={bookForm.title}
                onChangeText={(text) => setBookForm({ ...bookForm, title: text })}
                placeholder="Enter book title"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Author *</Text>
              <TextInput
                style={styles.input}
                value={bookForm.author}
                onChangeText={(text) => setBookForm({ ...bookForm, author: text })}
                placeholder="Enter author name"
              />
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>ISBN</Text>
                <TextInput
                  style={styles.input}
                  value={bookForm.isbn}
                  onChangeText={(text) => setBookForm({ ...bookForm, isbn: text })}
                  placeholder="ISBN"
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Barcode</Text>
                <TextInput
                  style={styles.input}
                  value={bookForm.barcode}
                  onChangeText={(text) => setBookForm({ ...bookForm, barcode: text })}
                  placeholder="Barcode"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Genre</Text>
              <TextInput
                style={styles.input}
                value={bookForm.genre}
                onChangeText={(text) => setBookForm({ ...bookForm, genre: text })}
                placeholder="Book genre"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bookForm.description}
                onChangeText={(text) => setBookForm({ ...bookForm, description: text })}
                placeholder="Book description"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Rental Price/Day *</Text>
                <TextInput
                  style={styles.input}
                  value={bookForm.rental.pricePerDay}
                  onChangeText={(text) => setBookForm({ 
                    ...bookForm, 
                    rental: { ...bookForm.rental, pricePerDay: text }
                  })}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Max Rental Days</Text>
                <TextInput
                  style={styles.input}
                  value={bookForm.rental.maxRentalDays}
                  onChangeText={(text) => setBookForm({ 
                    ...bookForm, 
                    rental: { ...bookForm.rental, maxRentalDays: text }
                  })}
                  placeholder="14"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Purchase Price</Text>
              <TextInput
                style={styles.input}
                value={bookForm.purchasePrice}
                onChangeText={(text) => setBookForm({ ...bookForm, purchasePrice: text })}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  refreshButton: {
    padding: 8,
  },
  tabContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    maxHeight: 60,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeTab: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  tabContent: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1000,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#2196F3',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    width: '48%',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statText: {
    flex: 1,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  quickActions: {
    marginTop: 8,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  scanAction: {
    backgroundColor: '#4CAF50',
  },
  addAction: {
    backgroundColor: '#2196F3',
  },
  actionCardText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  bookCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  bookStatus: {
    alignItems: 'flex-end',
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bookGenre: {
    fontSize: 14,
    color: '#2196F3',
    marginBottom: 8,
  },
  bookDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availabilityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestBook: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  requestBorrower: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  requestCommunity: {
    fontSize: 14,
    color: '#2196F3',
    marginBottom: 4,
  },
  requestDates: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 0.48,
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  borrowedCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  borrowedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  borrowedBook: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  borrowedBorrower: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  borrowedDates: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  overdueDays: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  finesAmount: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  returnButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  returnButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  closeButton: {
    padding: 8,
  },
  scannerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  scanner: {
    flex: 1,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 150,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  scannerInstructions: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 32,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputHalf: {
    width: '48%',
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
});

export default PublisherDashboardScreen;
