import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/apiService';

const NotificationPreferences = ({ navigation }) => {
  const [preferences, setPreferences] = useState({
    email: true,
    sms: false,
    push: true,
    types: {
      rental_reminders: true,
      hold_expiration: true,
      checkout_requests: true,
      fine_notifications: true,
      system_updates: true,
      community_news: false
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const notificationTypes = [
    {
      key: 'rental_reminders',
      label: 'Rental Reminders',
      description: 'Get notified when books are due for return',
      icon: 'book-outline'
    },
    {
      key: 'hold_expiration',
      label: 'Hold Expiration',
      description: 'Alerts when your book holds are about to expire',
      icon: 'time-outline'
    },
    {
      key: 'checkout_requests',
      label: 'Checkout Requests',
      description: 'Notifications for new checkout requests (Publishers only)',
      icon: 'person-outline'
    },
    {
      key: 'fine_notifications',
      label: 'Fine Notifications',
      description: 'Alerts about overdue fines and payments',
      icon: 'card-outline'
    },
    {
      key: 'system_updates',
      label: 'System Updates',
      description: 'Important system maintenance and feature updates',
      icon: 'information-circle-outline'
    },
    {
      key: 'community_news',
      label: 'Community News',
      description: 'Updates about community events and new features',
      icon: 'megaphone-outline'
    }
  ];

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await apiService.get('/notifications/preferences');
      setPreferences(response.data.preferences);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setError('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleChannelToggle = async (channel, value) => {
    const newPreferences = {
      ...preferences,
      [channel]: value
    };
    
    setPreferences(newPreferences);
    await savePreferences(newPreferences);
  };

  const handleTypeToggle = async (type, value) => {
    const newPreferences = {
      ...preferences,
      types: {
        ...preferences.types,
        [type]: value
      }
    };
    
    setPreferences(newPreferences);
    await savePreferences(newPreferences);
  };

  const savePreferences = async (prefsToSave = preferences) => {
    setSaving(true);
    setError('');
    
    try {
      await apiService.put('/notifications/preferences', prefsToSave);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setError('Failed to save preferences');
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const requestPushPermission = async () => {
    // In a real app, you would handle push notification permissions here
    // For now, we'll just toggle the preference
    Alert.alert(
      'Push Notifications',
      'Would you like to enable push notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enable',
          onPress: () => handleChannelToggle('push', true)
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading preferences...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="notifications" size={24} color="#3B82F6" />
          <Text style={styles.title}>Notification Preferences</Text>
        </View>
        <Text style={styles.subtitle}>
          Manage how and when you receive notifications from the Community Library.
        </Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Notification Channels */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Channels</Text>
        
        <View style={styles.optionCard}>
          <View style={styles.optionHeader}>
            <Ionicons name="mail-outline" size={20} color="#6B7280" />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Email</Text>
              <Text style={styles.optionDescription}>
                Receive notifications via email
              </Text>
            </View>
          </View>
          <Switch
            value={preferences.email}
            onValueChange={(value) => handleChannelToggle('email', value)}
            trackColor={{ false: '#E5E7EB', true: '#DBEAFE' }}
            thumbColor={preferences.email ? '#3B82F6' : '#9CA3AF'}
          />
        </View>

        <View style={styles.optionCard}>
          <View style={styles.optionHeader}>
            <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>SMS</Text>
              <Text style={styles.optionDescription}>
                Receive notifications via text message
              </Text>
            </View>
          </View>
          <Switch
            value={preferences.sms}
            onValueChange={(value) => handleChannelToggle('sms', value)}
            trackColor={{ false: '#E5E7EB', true: '#DBEAFE' }}
            thumbColor={preferences.sms ? '#3B82F6' : '#9CA3AF'}
          />
        </View>

        <View style={styles.optionCard}>
          <View style={styles.optionHeader}>
            <Ionicons name="phone-portrait-outline" size={20} color="#6B7280" />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Push Notifications</Text>
              <Text style={styles.optionDescription}>
                Receive instant notifications on your device
              </Text>
            </View>
          </View>
          <View style={styles.pushControls}>
            {!preferences.push && (
              <TouchableOpacity
                onPress={requestPushPermission}
                style={styles.enableButton}
              >
                <Text style={styles.enableButtonText}>Enable</Text>
              </TouchableOpacity>
            )}
            <Switch
              value={preferences.push}
              onValueChange={(value) => handleChannelToggle('push', value)}
              trackColor={{ false: '#E5E7EB', true: '#DBEAFE' }}
              thumbColor={preferences.push ? '#3B82F6' : '#9CA3AF'}
            />
          </View>
        </View>
      </View>

      {/* Notification Types */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Types</Text>
        
        {notificationTypes.map((type) => (
          <View key={type.key} style={styles.optionCard}>
            <View style={styles.optionHeader}>
              <Ionicons name={type.icon} size={20} color="#6B7280" />
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{type.label}</Text>
                <Text style={styles.optionDescription}>
                  {type.description}
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.types[type.key]}
              onValueChange={(value) => handleTypeToggle(type.key, value)}
              trackColor={{ false: '#E5E7EB', true: '#DBEAFE' }}
              thumbColor={preferences.types[type.key] ? '#3B82F6' : '#9CA3AF'}
            />
          </View>
        ))}
      </View>

      {/* Saving Indicator */}
      {saving && (
        <View style={styles.savingContainer}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.savingText}>Saving preferences...</Text>
        </View>
      )}

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    margin: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  optionCard: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionContent: {
    marginLeft: 12,
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  pushControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  enableButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  enableButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  savingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  savingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default NotificationPreferences;
