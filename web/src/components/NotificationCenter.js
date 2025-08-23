import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Clock, AlertCircle, User, Book, DollarSign } from 'lucide-react';
import { apiService } from '../services/apiService';

const NotificationCenter = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'registration_approval':
      case 'checkout_request':
        return <User size={16} className="text-blue-500" />;
      case 'rental_success':
      case 'hold_expiration':
      case 'due_date_reminder':
        return <Book size={16} className="text-green-500" />;
      case 'fine_notification':
        return <DollarSign size={16} className="text-red-500" />;
      case 'system_update':
        return <AlertCircle size={16} className="text-yellow-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const fetchNotifications = async (pageNum = 1, filterType = 'all') => {
    setLoading(true);
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
    } finally {
      setLoading(false);
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
    }
  };

  const clearNotification = async (notificationId) => {
    try {
      await apiService.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
    } catch (error) {
      console.error('Failed to clear notification:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications(1, filter);
      setPage(1);
    }
  }, [isOpen, filter]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, filter);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell size={20} className="text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1">
            {['all', 'unread', 'rental', 'system'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => handleFilterChange(filterType)}
                className={`px-3 py-1 text-sm rounded-full capitalize ${
                  filter === filterType
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {filterType}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Bell size={32} className="mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`border-l-4 p-3 rounded-r-lg transition-all ${
                    getPriorityColor(notification.priority)
                  } ${!notification.read ? 'bg-opacity-100' : 'bg-opacity-50'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium ${
                          !notification.read ? 'text-gray-900' : 'text-gray-600'
                        }`}>
                          {notification.title}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.createdAt)}
                          </span>
                          {notification.channels && (
                            <div className="flex gap-1">
                              {notification.channels.map((channel) => (
                                <span
                                  key={channel}
                                  className="text-xs px-1 py-0.5 bg-gray-200 rounded text-gray-600 capitalize"
                                >
                                  {channel}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification._id)}
                          className="p-1 hover:bg-white hover:bg-opacity-50 rounded"
                          title="Mark as read"
                        >
                          <Check size={14} className="text-green-600" />
                        </button>
                      )}
                      <button
                        onClick={() => clearNotification(notification._id)}
                        className="p-1 hover:bg-white hover:bg-opacity-50 rounded"
                        title="Clear notification"
                      >
                        <X size={14} className="text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* Action Button for actionable notifications */}
                  {notification.actionUrl && (
                    <button
                      onClick={() => window.location.href = notification.actionUrl}
                      className="mt-2 text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      {notification.actionText || 'View'}
                    </button>
                  )}
                </div>
              ))}

              {/* Load More Button */}
              {hasMore && !loading && (
                <button
                  onClick={loadMore}
                  className="w-full p-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                >
                  Load more notifications
                </button>
              )}

              {loading && notifications.length > 0 && (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
