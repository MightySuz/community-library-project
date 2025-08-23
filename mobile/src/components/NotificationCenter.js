import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/apiService';

const { width } = Dimensions.get('window');

const NotificationCenter = ({ visible, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'registration_approval':
      case 'checkout_request':
        return 'person-outline';
      case 'rental_success':
      case 'hold_expiration':
      case 'due_date_reminder':
        return 'book-outline';
      case 'fine_notification':
        return 'card-outline';
      case 'system_update':
        return 'information-circle-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getIconColor = (type, priority) => {
    if (priority === 'high') return '#EF4444';
    
    switch (type) {
      case 'registration_approval':
      case 'checkout_request':
        return '#3B82F6';
      case 'rental_success':
      case 'hold_expiration':
      case 'due_date_reminder':
        return '#10B981';
      case 'fine_notification':
        return '#EF4444';
      case 'system_update':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return time.toLocaleDateString();
  };

  const fetchNotifications = async (pageNum = 1, filterType = 'all', isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams({
        page: pageNum,
        limit: 20,
        ...(filterType !== 'all' && { type: filterType })
      });

      const response = await apiService.get(`/notifications?${params}`);
      
      if (pageNum === 1) {
        setNotifications(response.data.notifications);
      } else {
        setNotifications(prev => [...prev, ...response.data.notifications]);
      }
      
      setHasMore(response.data.hasMore);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      Alert.alert('Error', 'Failed to fetch notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await apiService.put(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.put('/notifications/mark-all-read');
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      Alert.alert('Error', 'Failed to mark notifications as read');
    }
  };

  const clearNotification = async (notificationId) => {
    Alert.alert(
      'Clear Notification',
      'Are you sure you want to clear this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.delete(`/notifications/${notificationId}`);
              setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
            } catch (error) {
              console.error('Failed to clear notification:', error);
              Alert.alert('Error', 'Failed to clear notification');
            }
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    setPage(1);
    fetchNotifications(1, filter, true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage, filter);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchNotifications(1, filter);
      setPage(1);
    }
  }, [visible, filter]);

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.titleContainer}>
                <Ionicons name="notifications" size={24} color="#1F2937" />
                <Text style={styles.title}>Notifications</Text>
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
              {['all', 'unread', 'rental', 'system'].map((filterType) => (
                <TouchableOpacity
                  key={filterType}
                  onPress={() => setFilter(filterType)}
                  style={[
                    styles.filterTab,
                    filter === filterType && styles.activeFilterTab
                  ]}
                >
                  <Text style={[
                    styles.filterText,
                    filter === filterType && styles.activeFilterText
                  ]}>
                    {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Mark All Read Button */}
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
                <Text style={styles.markAllText}>Mark all as read</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Notifications List */}
          <ScrollView
            style={styles.scrollView}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            onScroll={({ nativeEvent }) => {
              const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
              const isCloseToBottom =
                layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
              if (isCloseToBottom) {
                loadMore();
              }
            }}
            scrollEventThrottle={400}
          >
            {loading && notifications.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
              </View>
            ) : notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>No notifications yet</Text>
              </View>
            ) : (
              <View style={styles.notificationsList}>
                {notifications.map((notification) => (
                  <View
                    key={notification._id}
                    style={[
                      styles.notificationCard,
                      !notification.read && styles.unreadCard,
                      notification.priority === 'high' && styles.highPriorityCard
                    ]}
                  >
                    <View style={styles.notificationHeader}>
                      <View style={styles.notificationIcon}>
                        <Ionicons
                          name={getNotificationIcon(notification.type)}
                          size={20}
                          color={getIconColor(notification.type, notification.priority)}
                        />
                      </View>
                      <View style={styles.notificationContent}>
                        <Text style={[
                          styles.notificationTitle,
                          !notification.read && styles.unreadTitle
                        ]}>
                          {notification.title}
                        </Text>
                        <Text style={styles.notificationMessage}>
                          {notification.message}
                        </Text>
                        <View style={styles.notificationMeta}>
                          <Text style={styles.timeText}>
                            {formatTime(notification.createdAt)}
                          </Text>
                          {notification.channels && (
                            <View style={styles.channelsContainer}>
                              {notification.channels.map((channel, index) => (
                                <View key={index} style={styles.channelBadge}>
                                  <Text style={styles.channelText}>{channel}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.notificationActions}>
                        {!notification.read && (
                          <TouchableOpacity
                            onPress={() => markAsRead(notification._id)}
                            style={styles.actionButton}
                          >
                            <Ionicons name="checkmark" size={16} color="#10B981" />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          onPress={() => clearNotification(notification._id)}
                          style={styles.actionButton}
                        >
                          <Ionicons name="close" size={16} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Action Button */}
                    {notification.actionUrl && (
                      <TouchableOpacity
                        style={styles.actionUrlButton}
                        onPress={() => {
                          // Handle navigation to actionUrl
                          console.log('Navigate to:', notification.actionUrl);
                        }}
                      >
                        <Text style={styles.actionUrlText}>
                          {notification.actionText || 'View'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                {loading && notifications.length > 0 && (
                  <View style={styles.loadMoreContainer}>
                    <ActivityIndicator size="small" color="#3B82F6" />
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: 'white',
    height: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  activeFilterTab: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeFilterText: {
    color: 'white',
  },
  markAllButton: {
    alignSelf: 'flex-start',
  },
  markAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 10,
  },
  notificationsList: {
    padding: 16,
  },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  unreadCard: {
    backgroundColor: '#F0F9FF',
    borderLeftColor: '#0EA5E9',
  },
  highPriorityCard: {
    borderLeftColor: '#EF4444',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  unreadTitle: {
    color: '#1F2937',
    fontWeight: '600',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  channelsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  channelBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  channelText: {
    fontSize: 10,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    padding: 4,
  },
  actionUrlButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  actionUrlText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default NotificationCenter;
