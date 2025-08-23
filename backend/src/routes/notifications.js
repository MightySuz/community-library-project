const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const { auth } = require('../middleware/auth');

// Get user notifications with pagination and filtering
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      read,
      priority,
      channel
    } = req.query;

    const filter = { user: req.user.id };
    
    // Add optional filters
    if (type) filter.type = type;
    if (read !== undefined) filter.read = read === 'true';
    if (priority) filter.priority = priority;
    if (channel) filter.channels = { $in: [channel] };

    // Check for expired notifications and mark them
    await Notification.updateMany(
      {
        user: req.user.id,
        expiresAt: { $lte: new Date() },
        read: false
      },
      { $set: { read: true } }
    );

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1, priority: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Notification.countDocuments(filter);
    const hasMore = page * limit < total;

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      user: req.user.id,
      read: false
    });

    res.json({
      notifications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalNotifications: total,
        hasMore
      },
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Get notification statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await Notification.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: {
            $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] }
          },
          high_priority: {
            $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
          },
          by_type: {
            $push: {
              type: '$type',
              count: 1
            }
          }
        }
      }
    ]);

    const typeStats = await Notification.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unread: {
            $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      overview: stats[0] || { total: 0, unread: 0, high_priority: 0 },
      byType: typeStats
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ message: 'Failed to fetch notification statistics' });
  }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', auth, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

// Clear all read notifications
router.delete('/clear-read', auth, async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      user: req.user.id,
      read: true
    });

    res.json({
      message: 'Read notifications cleared',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error clearing read notifications:', error);
    res.status(500).json({ message: 'Failed to clear read notifications' });
  }
});

// Update user notification preferences
router.put('/preferences', auth, async (req, res) => {
  try {
    const {
      email = true,
      sms = false,
      push = true,
      types = {}
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          'notificationPreferences.email': email,
          'notificationPreferences.sms': sms,
          'notificationPreferences.push': push,
          'notificationPreferences.types': {
            rental_reminders: types.rental_reminders !== undefined ? types.rental_reminders : true,
            hold_expiration: types.hold_expiration !== undefined ? types.hold_expiration : true,
            checkout_requests: types.checkout_requests !== undefined ? types.checkout_requests : true,
            fine_notifications: types.fine_notifications !== undefined ? types.fine_notifications : true,
            system_updates: types.system_updates !== undefined ? types.system_updates : true,
            community_news: types.community_news !== undefined ? types.community_news : false
          }
        }
      },
      { new: true, select: 'notificationPreferences' }
    );

    res.json({
      message: 'Notification preferences updated',
      preferences: user.notificationPreferences
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ message: 'Failed to update notification preferences' });
  }
});

// Get user notification preferences
router.get('/preferences', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('notificationPreferences');
    
    if (!user.notificationPreferences) {
      // Return default preferences if not set
      const defaultPreferences = {
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
      };
      
      // Save default preferences
      await User.findByIdAndUpdate(
        req.user.id,
        { $set: { notificationPreferences: defaultPreferences } }
      );
      
      return res.json({ preferences: defaultPreferences });
    }

    res.json({ preferences: user.notificationPreferences });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ message: 'Failed to fetch notification preferences' });
  }
});

// Subscribe to push notifications
router.post('/push/subscribe', auth, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ 
        message: 'Invalid push subscription data' 
      });
    }

    const user = await User.findById(req.user.id);
    
    // Check if subscription already exists
    const existingSubscription = user.pushSubscriptions.find(
      sub => sub.endpoint === endpoint
    );

    if (!existingSubscription) {
      user.pushSubscriptions.push({ endpoint, keys });
      await user.save();
    }

    res.json({ message: 'Push subscription saved successfully' });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({ message: 'Failed to save push subscription' });
  }
});

// Unsubscribe from push notifications
router.delete('/push/unsubscribe', auth, async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ message: 'Endpoint is required' });
    }

    const user = await User.findById(req.user.id);
    user.pushSubscriptions = user.pushSubscriptions.filter(
      sub => sub.endpoint !== endpoint
    );
    
    await user.save();

    res.json({ message: 'Push subscription removed successfully' });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    res.status(500).json({ message: 'Failed to remove push subscription' });
  }
});

// Test notification (for development/testing)
router.post('/test', auth, async (req, res) => {
  try {
    const { type = 'system_update', channels = ['push'] } = req.body;

    await notificationService.createNotification({
      user: req.user.id,
      type,
      title: 'Test Notification',
      message: 'This is a test notification sent from the API.',
      channels,
      priority: 'low',
      data: { test: true }
    });

    res.json({ message: 'Test notification sent successfully' });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ message: 'Failed to send test notification' });
  }
});

module.exports = router;
