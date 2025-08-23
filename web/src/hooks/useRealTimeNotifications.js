import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { apiService } from '../services/apiService';

// Real-time notification hook
export const useRealTimeNotifications = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize push notifications
  const initializePushNotifications = useCallback(async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);

        // Check if push notifications are supported
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Subscribe to push notifications
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY
          });

          // Send subscription to server
          await apiService.post('/notifications/push/subscribe', {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
              auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
            }
          });

          console.log('Push notifications subscribed');
        }
      } catch (error) {
        console.error('Error initializing push notifications:', error);
      }
    }
  }, []);

  // Simulate real-time updates with polling (in production, use WebSockets or Server-Sent Events)
  const startPolling = useCallback(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await apiService.get('/notifications?limit=1');
        if (response.data.notifications.length > 0) {
          const latestNotification = response.data.notifications[0];
          
          // Check if this is a new notification
          const isNew = !notifications.find(n => n._id === latestNotification._id);
          
          if (isNew) {
            setNotifications(prev => [latestNotification, ...prev.slice(0, 49)]); // Keep only 50 latest
            setUnreadCount(response.data.unreadCount);
            
            // Show toast notification
            showToastNotification(latestNotification);
          }
        }
        
        setIsConnected(true);
      } catch (error) {
        console.error('Polling error:', error);
        setIsConnected(false);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }, [notifications]);

  // Show toast notification
  const showToastNotification = useCallback((notification) => {
    const toastOptions = {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    };

    switch (notification.priority) {
      case 'high':
        toast.error(
          <NotificationToast notification={notification} />,
          { ...toastOptions, autoClose: 8000 }
        );
        break;
      case 'medium':
        toast.warning(
          <NotificationToast notification={notification} />,
          toastOptions
        );
        break;
      default:
        toast.info(
          <NotificationToast notification={notification} />,
          toastOptions
        );
    }
  }, []);

  // Load initial notifications
  const loadNotifications = useCallback(async () => {
    try {
      const response = await apiService.get('/notifications?limit=20');
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await apiService.put(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Clear notification
  const clearNotification = useCallback(async (notificationId) => {
    try {
      await apiService.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      
      // Decrease unread count if notification was unread
      const notification = notifications.find(n => n._id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error clearing notification:', error);
    }
  }, [notifications]);

  useEffect(() => {
    initializePushNotifications();
    loadNotifications();
    const cleanup = startPolling();
    
    return cleanup;
  }, [initializePushNotifications, loadNotifications, startPolling]);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    clearNotification,
    loadNotifications
  };
};

// Toast notification component
const NotificationToast = ({ notification }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'registration_approval':
        return '👤';
      case 'rental_success':
        return '📚';
      case 'hold_expiration':
        return '⏰';
      case 'due_date_reminder':
        return '📅';
      case 'fine_notification':
        return '💰';
      case 'checkout_request':
        return '📋';
      case 'system_update':
        return '🔧';
      default:
        return '🔔';
    }
  };

  const handleClick = () => {
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  return (
    <div 
      className={`cursor-pointer ${notification.actionUrl ? 'hover:bg-gray-50' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg">{getIcon()}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm">
            {notification.title}
          </p>
          <p className="text-gray-600 text-xs mt-1 line-clamp-2">
            {notification.message}
          </p>
          {notification.actionUrl && (
            <p className="text-blue-600 text-xs mt-1 font-medium">
              Click to view →
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Notification provider for context
import React, { createContext, useContext } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const notifications = useRealTimeNotifications();

  return (
    <NotificationContext.Provider value={notifications}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default useRealTimeNotifications;
