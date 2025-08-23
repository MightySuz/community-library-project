import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const WalletScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [walletData, setWalletData] = useState({
    balance: 25.50,
    pendingPayments: 12.75,
    totalSpent: 156.25,
    totalEarned: 89.50
  });
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockTransactions = [
        {
          id: '1',
          type: 'payment',
          amount: -5.50,
          description: 'Book rental: The Great Gatsby',
          date: new Date(),
          status: 'completed',
          icon: 'payment'
        },
        {
          id: '2',
          type: 'refund',
          amount: 2.50,
          description: 'Refund: Early return bonus',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000),
          status: 'completed',
          icon: 'money'
        },
        {
          id: '3',
          type: 'deposit',
          amount: 20.00,
          description: 'Wallet top-up',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          status: 'completed',
          icon: 'add-circle'
        },
        {
          id: '4',
          type: 'payment',
          amount: -3.75,
          description: 'Book rental: Clean Code',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          status: 'pending',
          icon: 'payment'
        },
        {
          id: '5',
          type: 'fine',
          amount: -1.50,
          description: 'Late return fee',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          status: 'completed',
          icon: 'warning'
        }
      ];
      setTransactions(mockTransactions);
    } catch (error) {
      Alert.alert('Error', 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  };

  const handleAddMoney = () => {
    Alert.alert(
      'Add Money',
      'How much would you like to add to your wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '$10', onPress: () => addMoney(10) },
        { text: '$25', onPress: () => addMoney(25) },
        { text: '$50', onPress: () => addMoney(50) },
        { text: 'Other', onPress: () => Alert.alert('Info', 'Custom amount feature coming soon') }
      ]
    );
  };

  const addMoney = (amount) => {
    Alert.alert('Success', `$${amount} added to your wallet successfully!`);
    setWalletData(prev => ({
      ...prev,
      balance: prev.balance + amount
    }));
  };

  const handleWithdraw = () => {
    if (walletData.balance <= 0) {
      Alert.alert('Error', 'Insufficient balance for withdrawal');
      return;
    }
    Alert.alert('Info', 'Withdrawal feature coming soon');
  };

  const StatCard = ({ title, amount, subtitle, color, icon }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <View style={styles.statText}>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={[styles.statAmount, { color }]}>
            ${Math.abs(amount).toFixed(2)}
          </Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
        <Icon name={icon} size={28} color={color} />
      </View>
    </View>
  );

  const TransactionItem = ({ item }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View style={[
          styles.transactionIcon,
          {
            backgroundColor:
              item.type === 'payment' || item.type === 'fine' ? '#ffebee' :
              item.type === 'deposit' ? '#e8f5e8' : '#fff3e0'
          }
        ]}>
          <Icon
            name={item.icon}
            size={20}
            color={
              item.type === 'payment' || item.type === 'fine' ? '#F44336' :
              item.type === 'deposit' ? '#4CAF50' : '#FF9800'
            }
          />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionDate}>
            {item.date.toLocaleDateString()} • {item.status}
          </Text>
        </View>
      </View>
      <Text style={[
        styles.transactionAmount,
        {
          color: item.amount > 0 ? '#4CAF50' : '#F44336'
        }
      ]}>
        {item.amount > 0 ? '+' : ''}${Math.abs(item.amount).toFixed(2)}
      </Text>
    </View>
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
        <Text style={styles.headerTitle}>My Wallet</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Icon name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>${walletData.balance.toFixed(2)}</Text>
          <View style={styles.balanceActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleAddMoney}>
              <Icon name="add" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Add Money</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.withdrawButton]}
              onPress={handleWithdraw}
            >
              <Icon name="remove" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Wallet Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Pending Payments"
              amount={walletData.pendingPayments}
              subtitle="Awaiting payment"
              color="#FF9800"
              icon="schedule"
            />
            <StatCard
              title="Total Spent"
              amount={walletData.totalSpent}
              subtitle="This month"
              color="#F44336"
              icon="trending-down"
            />
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Earned"
              amount={walletData.totalEarned}
              subtitle="From lending"
              color="#4CAF50"
              icon="trending-up"
            />
            <StatCard
              title="Savings"
              amount={walletData.balance + walletData.totalEarned - walletData.totalSpent}
              subtitle="Net amount"
              color="#2196F3"
              icon="savings"
            />
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => Alert.alert('Info', 'View all transactions feature coming soon')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.transactionsList}>
            {transactions.slice(0, 5).map((item) => (
              <TransactionItem key={item.id} item={item} />
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => Alert.alert('Info', 'Auto-pay feature coming soon')}
            >
              <Icon name="autorenew" size={32} color="#2196F3" />
              <Text style={styles.quickActionText}>Auto-Pay</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => Alert.alert('Info', 'Payment history feature coming soon')}
            >
              <Icon name="history" size={32} color="#4CAF50" />
              <Text style={styles.quickActionText}>History</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => Alert.alert('Info', 'Payment methods feature coming soon')}
            >
              <Icon name="credit-card" size={32} color="#FF9800" />
              <Text style={styles.quickActionText}>Cards</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => Alert.alert('Info', 'Settings feature coming soon')}
            >
              <Icon name="settings" size={32} color="#9C27B0" />
              <Text style={styles.quickActionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
  },
  balanceCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 24,
  },
  balanceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 0.48,
  },
  withdrawButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 10,
    color: '#999',
  },
  transactionsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  transactionsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickActionsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    backgroundColor: '#fff',
    width: '48%',
    aspectRatio: 1.2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginTop: 8,
  },
});

export default WalletScreen;
