import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState('borrower');
  const [userData, setUserData] = useState({});
  const [stats, setStats] = useState({
    totalBooks: 0,
    borrowedBooks: 0,
    availableBooks: 0,
    communityMembers: 0
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        const parsedUser = JSON.parse(user);
        setUserData(parsedUser);
        setUserRole(parsedUser.role);
      }
      // Load stats here
      setStats({
        totalBooks: 156,
        borrowedBooks: 3,
        availableBooks: 153,
        communityMembers: 45
      });
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

  const QuickActionCard = ({ title, icon, color, onPress }) => (
    <TouchableOpacity style={[styles.actionCard, { backgroundColor: color }]} onPress={onPress}>
      <Icon name={icon} size={32} color="#fff" />
      <Text style={styles.actionCardText}>{title}</Text>
    </TouchableOpacity>
  );

  const StatCard = ({ title, value, icon, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <View style={styles.statText}>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={[styles.statValue, { color }]}>{value}</Text>
        </View>
        <Icon name={icon} size={24} color={color} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{userData.fullName || 'User'}</Text>
            <Text style={styles.community}>{userData.communityName || 'Community Library'}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Icon name="person" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Library Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Books"
              value={stats.totalBooks}
              icon="library-books"
              color="#4CAF50"
            />
            <StatCard
              title="Available"
              value={stats.availableBooks}
              icon="check-circle"
              color="#2196F3"
            />
            <StatCard
              title="My Books"
              value={stats.borrowedBooks}
              icon="schedule"
              color="#FF9800"
            />
            <StatCard
              title="Members"
              value={stats.communityMembers}
              icon="people"
              color="#9C27B0"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <QuickActionCard
              title="Browse Books"
              icon="search"
              color="#2196F3"
              onPress={() => navigation.navigate('Books')}
            />
            <QuickActionCard
              title="My Wallet"
              icon="account-balance-wallet"
              color="#4CAF50"
              onPress={() => navigation.navigate('Profile', { screen: 'Wallet' })}
            />
            {userRole === 'admin' && (
              <QuickActionCard
                title="Admin Panel"
                icon="admin-panel-settings"
                color="#F44336"
                onPress={() => navigation.navigate('Admin')}
              />
            )}
            {userRole === 'publisher' && (
              <QuickActionCard
                title="Publisher Dashboard"
                icon="store"
                color="#FF9800"
                onPress={() => navigation.navigate('Publisher')}
              />
            )}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <Icon name="book" size={20} color="#2196F3" />
              <View style={styles.activityText}>
                <Text style={styles.activityTitle}>Book Request Approved</Text>
                <Text style={styles.activitySubtitle}>The Great Gatsby - 2 hours ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <Icon name="payment" size={20} color="#4CAF50" />
              <View style={styles.activityText}>
                <Text style={styles.activityTitle}>Payment Processed</Text>
                <Text style={styles.activitySubtitle}>$5.50 - Yesterday</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <Icon name="library-add" size={20} color="#FF9800" />
              <View style={styles.activityText}>
                <Text style={styles.activityTitle}>New Book Added</Text>
                <Text style={styles.activitySubtitle}>Clean Code - 3 days ago</Text>
              </View>
            </View>
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  community: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    aspectRatio: 1.5,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionCardText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  activityList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityText: {
    marginLeft: 12,
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 14,
    color: '#666',
  },
});

export default HomeScreen;
