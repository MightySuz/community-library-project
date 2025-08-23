import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState({});
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        setUserData(JSON.parse(user));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load user data');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('user');
              await AsyncStorage.removeItem('token');
              // Navigate to login screen
              Alert.alert('Success', 'Logged out successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  const ProfileItem = ({ icon, title, subtitle, onPress, showArrow = true, rightComponent }) => (
    <TouchableOpacity style={styles.profileItem} onPress={onPress} disabled={!onPress}>
      <View style={styles.profileItemLeft}>
        <Icon name={icon} size={24} color="#2196F3" />
        <View style={styles.profileItemText}>
          <Text style={styles.profileItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.profileItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.profileItemRight}>
        {rightComponent}
        {showArrow && onPress && <Icon name="chevron-right" size={24} color="#666" />}
      </View>
    </TouchableOpacity>
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
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* User Info Section */}
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Icon name="person" size={40} color="#fff" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{userData.fullName || 'User Name'}</Text>
            <Text style={styles.userEmail}>{userData.email || 'user@example.com'}</Text>
            <Text style={styles.userRole}>{userData.role || 'Borrower'}</Text>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <ProfileItem
            icon="account-balance-wallet"
            title="My Wallet"
            subtitle="Manage payments and balance"
            onPress={() => navigation.navigate('Wallet')}
          />
          
          <ProfileItem
            icon="history"
            title="Rental History"
            subtitle="View past book rentals"
            onPress={() => Alert.alert('Info', 'Rental history feature coming soon')}
          />
          
          <ProfileItem
            icon="favorite"
            title="Wishlist"
            subtitle="Books you want to read"
            onPress={() => Alert.alert('Info', 'Wishlist feature coming soon')}
          />
          
          <ProfileItem
            icon="rate-review"
            title="My Reviews"
            subtitle="Books you've reviewed"
            onPress={() => Alert.alert('Info', 'Reviews feature coming soon')}
          />
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <ProfileItem
            icon="notifications"
            title="Notifications"
            subtitle="Push notifications and alerts"
            showArrow={false}
            rightComponent={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#ccc', true: '#2196F3' }}
                thumbColor={notifications ? '#fff' : '#f4f3f4'}
              />
            }
          />
          
          <ProfileItem
            icon="edit"
            title="Edit Profile"
            subtitle="Update your information"
            onPress={() => Alert.alert('Info', 'Edit profile feature coming soon')}
          />
          
          <ProfileItem
            icon="security"
            title="Privacy & Security"
            subtitle="Password and privacy settings"
            onPress={() => Alert.alert('Info', 'Privacy settings feature coming soon')}
          />
          
          <ProfileItem
            icon="language"
            title="Language"
            subtitle="English"
            onPress={() => Alert.alert('Info', 'Language settings feature coming soon')}
          />
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <ProfileItem
            icon="help"
            title="Help & Support"
            subtitle="Get help with the app"
            onPress={() => Alert.alert('Info', 'Help feature coming soon')}
          />
          
          <ProfileItem
            icon="feedback"
            title="Send Feedback"
            subtitle="Share your thoughts"
            onPress={() => Alert.alert('Info', 'Feedback feature coming soon')}
          />
          
          <ProfileItem
            icon="info"
            title="About"
            subtitle="App version and info"
            onPress={() => Alert.alert('About', 'Community Library App v1.0.0')}
          />
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="logout" size={24} color="#F44336" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  userInfo: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemText: {
    marginLeft: 16,
    flex: 1,
  },
  profileItemTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  profileItemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  profileItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  logoutText: {
    fontSize: 16,
    color: '#F44336',
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default ProfileScreen;
