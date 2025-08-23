import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adminService } from '../../services/adminService';

const AdminDashboardScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState({});
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingBooks, setPendingBooks] = useState([]);
  const [transactionReports, setTransactionReports] = useState([]);
  const [walletReports, setWalletReports] = useState([]);
  const [fineConfig, setFineConfig] = useState({});
  const [fineConfigModal, setFineConfigModal] = useState(false);
  const [fineConfigForm, setFineConfigForm] = useState({
    overdue_fine_per_day: 0,
    grace_period_days: 0,
    damage_fine_percentage: 0,
    lost_book_multiplier: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboard();
    } else if (activeTab === 'users') {
      loadPendingUsers();
    } else if (activeTab === 'books') {
      loadPendingBooks();
    } else if (activeTab === 'transactions') {
      loadTransactionReports();
    } else if (activeTab === 'wallets') {
      loadWalletReports();
    } else if (activeTab === 'fines') {
      loadFineConfiguration();
    }
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    await loadDashboard();
    setLoading(false);
  };

  const loadDashboard = async () => {
    try {
      const token = await AsyncStorage.getItem('adminToken');
      const stats = await adminService.getDashboardStats(token);
      setDashboardStats(stats);
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard stats');
    }
  };

  const loadPendingUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('adminToken');
      const users = await adminService.getPendingUsers(token);
      setPendingUsers(users);
    } catch (error) {
      Alert.alert('Error', 'Failed to load pending users');
    }
  };

  const loadPendingBooks = async () => {
    try {
      const token = await AsyncStorage.getItem('adminToken');
      const books = await adminService.getPendingBooks(token);
      setPendingBooks(books);
    } catch (error) {
      Alert.alert('Error', 'Failed to load pending books');
    }
  };

  const loadTransactionReports = async () => {
    try {
      const token = await AsyncStorage.getItem('adminToken');
      const reports = await adminService.getTransactionReports(token);
      setTransactionReports(reports);
    } catch (error) {
      Alert.alert('Error', 'Failed to load transaction reports');
    }
  };

  const loadWalletReports = async () => {
    try {
      const token = await AsyncStorage.getItem('adminToken');
      const reports = await adminService.getWalletReports(token);
      setWalletReports(reports);
    } catch (error) {
      Alert.alert('Error', 'Failed to load wallet reports');
    }
  };

  const loadFineConfiguration = async () => {
    try {
      const token = await AsyncStorage.getItem('adminToken');
      const config = await adminService.getFineConfiguration(token);
      setFineConfig(config);
      setFineConfigForm(config);
    } catch (error) {
      Alert.alert('Error', 'Failed to load fine configuration');
    }
  };

  const handleUserApproval = async (userId, action) => {
    try {
      const token = await AsyncStorage.getItem('adminToken');
      if (action === 'approve') {
        await adminService.approveUser(userId, token);
        Alert.alert('Success', 'User approved successfully');
      } else {
        await adminService.rejectUser(userId, token);
        Alert.alert('Success', 'User rejected');
      }
      loadPendingUsers();
    } catch (error) {
      Alert.alert('Error', `Failed to ${action} user`);
    }
  };

  const handleBookApproval = async (bookId, action) => {
    try {
      const token = await AsyncStorage.getItem('adminToken');
      if (action === 'approve') {
        await adminService.approveBook(bookId, token);
        Alert.alert('Success', 'Book approved successfully');
      } else {
        await adminService.rejectBook(bookId, token);
        Alert.alert('Success', 'Book rejected');
      }
      loadPendingBooks();
    } catch (error) {
      Alert.alert('Error', `Failed to ${action} book`);
    }
  };

  const handleFineConfigSave = async () => {
    try {
      const token = await AsyncStorage.getItem('adminToken');
      await adminService.updateFineConfiguration(fineConfigForm, token);
      setFineConfig(fineConfigForm);
      setFineConfigModal(false);
      Alert.alert('Success', 'Fine configuration updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update configuration');
    }
  };

  const StatCard = ({ title, value, subtitle, color = '#2196F3' }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
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

  const UserCard = ({ user, onApprove, onReject }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.fullName}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <Text style={styles.userCommunity}>{user.communityName}</Text>
        <Text style={styles.userRole}>Role: {user.role}</Text>
      </View>
      <View style={styles.userActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={onApprove}
        >
          <Icon name="check" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={onReject}
        >
          <Icon name="close" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const BookCard = ({ book, onApprove, onReject }) => (
    <View style={styles.bookCard}>
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}>{book.title}</Text>
        <Text style={styles.bookAuthor}>by {book.author}</Text>
        <Text style={styles.bookGenre}>Genre: {book.genre}</Text>
        <Text style={styles.bookPublisher}>
          Published by: {book.publisher.fullName}
        </Text>
      </View>
      <View style={styles.bookActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={onApprove}
        >
          <Icon name="check" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={onReject}
        >
          <Icon name="close" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDashboard = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.sectionTitle}>Dashboard Overview</Text>
      
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Users"
          value={dashboardStats.totalUsers || 0}
          subtitle="Registered members"
          color="#4CAF50"
        />
        <StatCard
          title="Pending Users"
          value={dashboardStats.pendingUsers || 0}
          subtitle="Awaiting approval"
          color="#FF9800"
        />
        <StatCard
          title="Total Books"
          value={dashboardStats.totalBooks || 0}
          subtitle="In catalog"
          color="#2196F3"
        />
        <StatCard
          title="Pending Books"
          value={dashboardStats.pendingBooks || 0}
          subtitle="Awaiting approval"
          color="#FF5722"
        />
        <StatCard
          title="Active Rentals"
          value={dashboardStats.activeRentals || 0}
          subtitle="Currently borrowed"
          color="#9C27B0"
        />
        <StatCard
          title="Overdue Books"
          value={dashboardStats.overdueBooks || 0}
          subtitle="Past due date"
          color="#F44336"
        />
        <StatCard
          title="Total Fines"
          value={`$${(dashboardStats.totalFines || 0).toFixed(2)}`}
          subtitle="Collected this month"
          color="#795548"
        />
        <StatCard
          title="Total Revenue"
          value={`$${(dashboardStats.totalRevenue || 0).toFixed(2)}`}
          subtitle="This month"
          color="#607D8B"
        />
      </View>
    </ScrollView>
  );

  const renderUsers = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.sectionTitle}>
        Pending User Registrations ({pendingUsers.length})
      </Text>
      
      {pendingUsers.map((user) => (
        <UserCard
          key={user._id}
          user={user}
          onApprove={() => handleUserApproval(user._id, 'approve')}
          onReject={() => handleUserApproval(user._id, 'reject')}
        />
      ))}
      
      {pendingUsers.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="people" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No pending user registrations</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderBooks = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.sectionTitle}>
        Pending Book Approvals ({pendingBooks.length})
      </Text>
      
      {pendingBooks.map((book) => (
        <BookCard
          key={book._id}
          book={book}
          onApprove={() => handleBookApproval(book._id, 'approve')}
          onReject={() => handleBookApproval(book._id, 'reject')}
        />
      ))}
      
      {pendingBooks.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="book" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No pending book approvals</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderTransactions = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.sectionTitle}>Transaction Reports</Text>
      
      {transactionReports.map((transaction) => (
        <View key={transaction._id} style={styles.transactionCard}>
          <View style={styles.transactionHeader}>
            <Text style={styles.transactionType}>
              {transaction.type.toUpperCase()}
            </Text>
            <Text style={[
              styles.transactionAmount,
              { color: transaction.type === 'fine' ? '#F44336' : '#4CAF50' }
            ]}>
              ${transaction.amount.toFixed(2)}
            </Text>
          </View>
          <Text style={styles.transactionUser}>{transaction.user.fullName}</Text>
          <Text style={styles.transactionDate}>
            {new Date(transaction.createdAt).toLocaleDateString()}
          </Text>
          {transaction.description && (
            <Text style={styles.transactionDescription}>
              {transaction.description}
            </Text>
          )}
        </View>
      ))}
      
      {transactionReports.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="receipt" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No transactions found</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderWallets = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.sectionTitle}>Wallet Reports</Text>
      
      {walletReports.map((wallet) => (
        <View key={wallet._id} style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <Text style={styles.walletUser}>{wallet.user.fullName}</Text>
            <Text style={[
              styles.walletBalance,
              { color: wallet.balance < 10 ? '#F44336' : '#4CAF50' }
            ]}>
              ${wallet.balance.toFixed(2)}
            </Text>
          </View>
          <Text style={styles.walletCommunity}>{wallet.user.communityName}</Text>
          <View style={styles.walletStats}>
            <Text style={styles.walletStat}>
              Deposited: ${wallet.analytics.totalDeposited.toFixed(2)}
            </Text>
            <Text style={styles.walletStat}>
              Spent: ${wallet.analytics.totalSpent.toFixed(2)}
            </Text>
            <Text style={styles.walletStat}>
              Fines: ${wallet.analytics.totalFines.toFixed(2)}
            </Text>
          </View>
          <View style={styles.walletStatus}>
            <Text style={[
              styles.statusBadge,
              {
                backgroundColor:
                  wallet.status === 'active' ? '#4CAF50' :
                  wallet.status === 'frozen' ? '#FF9800' : '#F44336'
              }
            ]}>
              {wallet.status.toUpperCase()}
            </Text>
          </View>
        </View>
      ))}
      
      {walletReports.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="account-balance-wallet" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No wallet data found</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderFines = () => (
    <ScrollView style={styles.content}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Fine Configuration</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setFineConfigModal(true)}
        >
          <Icon name="edit" size={20} color="#fff" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.configGrid}>
        <View style={styles.configCard}>
          <Text style={styles.configLabel}>Overdue Fine Per Day</Text>
          <Text style={styles.configValue}>
            ${fineConfig.overdue_fine_per_day || 0}
          </Text>
        </View>
        
        <View style={styles.configCard}>
          <Text style={styles.configLabel}>Grace Period</Text>
          <Text style={styles.configValue}>
            {fineConfig.grace_period_days || 0} days
          </Text>
        </View>
        
        <View style={styles.configCard}>
          <Text style={styles.configLabel}>Damage Fine %</Text>
          <Text style={styles.configValue}>
            {fineConfig.damage_fine_percentage || 0}%
          </Text>
        </View>
        
        <View style={styles.configCard}>
          <Text style={styles.configLabel}>Lost Book Multiplier</Text>
          <Text style={styles.configValue}>
            {fineConfig.lost_book_multiplier || 0}x
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadData}
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
          id="users"
          title="Users"
          icon="people"
          active={activeTab === 'users'}
          onPress={() => setActiveTab('users')}
        />
        <TabButton
          id="books"
          title="Books"
          icon="book"
          active={activeTab === 'books'}
          onPress={() => setActiveTab('books')}
        />
        <TabButton
          id="transactions"
          title="Transactions"
          icon="receipt"
          active={activeTab === 'transactions'}
          onPress={() => setActiveTab('transactions')}
        />
        <TabButton
          id="wallets"
          title="Wallets"
          icon="account-balance-wallet"
          active={activeTab === 'wallets'}
          onPress={() => setActiveTab('wallets')}
        />
        <TabButton
          id="fines"
          title="Fines"
          icon="gavel"
          active={activeTab === 'fines'}
          onPress={() => setActiveTab('fines')}
        />
      </ScrollView>

      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'users' && renderUsers()}
      {activeTab === 'books' && renderBooks()}
      {activeTab === 'transactions' && renderTransactions()}
      {activeTab === 'wallets' && renderWallets()}
      {activeTab === 'fines' && renderFines()}

      {/* Fine Configuration Modal */}
      <Modal
        visible={fineConfigModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Fine Configuration</Text>
              <TouchableOpacity
                onPress={() => setFineConfigModal(false)}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Overdue Fine Per Day ($)</Text>
                <TextInput
                  style={styles.input}
                  value={fineConfigForm.overdue_fine_per_day?.toString()}
                  onChangeText={(text) => setFineConfigForm({
                    ...fineConfigForm,
                    overdue_fine_per_day: parseFloat(text) || 0
                  })}
                  keyboardType="numeric"
                  placeholder="0.00"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Grace Period (days)</Text>
                <TextInput
                  style={styles.input}
                  value={fineConfigForm.grace_period_days?.toString()}
                  onChangeText={(text) => setFineConfigForm({
                    ...fineConfigForm,
                    grace_period_days: parseInt(text) || 0
                  })}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Damage Fine Percentage (%)</Text>
                <TextInput
                  style={styles.input}
                  value={fineConfigForm.damage_fine_percentage?.toString()}
                  onChangeText={(text) => setFineConfigForm({
                    ...fineConfigForm,
                    damage_fine_percentage: parseFloat(text) || 0
                  })}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Lost Book Multiplier</Text>
                <TextInput
                  style={styles.input}
                  value={fineConfigForm.lost_book_multiplier?.toString()}
                  onChangeText={(text) => setFineConfigForm({
                    ...fineConfigForm,
                    lost_book_multiplier: parseFloat(text) || 0
                  })}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setFineConfigModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleFineConfigSave}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  content: {
    flex: 1,
    padding: 16,
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
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
  userCard: {
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
  userInfo: {
    marginBottom: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userCommunity: {
    fontSize: 14,
    color: '#2196F3',
    marginTop: 2,
  },
  userRole: {
    fontSize: 14,
    color: '#FF9800',
    marginTop: 2,
  },
  userActions: {
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
  bookInfo: {
    marginBottom: 12,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  bookGenre: {
    fontSize: 14,
    color: '#2196F3',
    marginTop: 2,
  },
  bookPublisher: {
    fontSize: 14,
    color: '#FF9800',
    marginTop: 2,
  },
  bookActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionCard: {
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
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionUser: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
  walletCard: {
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
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  walletUser: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  walletBalance: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  walletCommunity: {
    fontSize: 14,
    color: '#2196F3',
    marginBottom: 8,
  },
  walletStats: {
    marginBottom: 8,
  },
  walletStat: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  walletStatus: {
    alignItems: 'flex-start',
  },
  statusBadge: {
    fontSize: 10,
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  configGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  configCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  configLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  configValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    flex: 0.48,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AdminDashboardScreen;
