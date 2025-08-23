const nodemailer = require('nodemailer');
const twilio = require('twilio');
const webpush = require('web-push');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { EventEmitter } = require('events');

class NotificationService extends EventEmitter {
  constructor() {
    super();
    this.setupEmailTransporter();
    this.setupSMSClient();
    this.setupPushNotifications();
  }

  // Setup email transporter
  setupEmailTransporter() {
    this.emailTransporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Setup SMS client
  setupSMSClient() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (accountSid && accountSid.startsWith('AC') && authToken) {
      this.smsClient = twilio(accountSid, authToken);
      this.smsConfigured = true;
    } else {
      this.smsClient = null;
      this.smsConfigured = false;
      console.warn('⚠️  Notification Service: Twilio credentials not configured. SMS notifications will be disabled.');
    }
  }

  // Setup push notifications
  setupPushNotifications() {
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:admin@communitylibrary.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    }
  }

  // Create notification record in database
  async createNotification(userId, type, title, message, data = {}) {
    try {
      const notification = new Notification({
        user: userId,
        type,
        title,
        message,
        data,
        createdAt: new Date(),
        read: false
      });

      await notification.save();
      
      // Emit real-time notification event
      this.emit('notification', {
        userId,
        notification: notification.toObject()
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Send email notification
  async sendEmail(to, subject, htmlContent, textContent = null) {
    try {
      if (!this.emailTransporter) {
        console.warn('Email service not configured');
        return false;
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'Community Library <noreply@communitylibrary.com>',
        to,
        subject,
        html: htmlContent,
        text: textContent || htmlContent.replace(/<[^>]*>/g, '')
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  // Send SMS notification
  async sendSMS(to, message) {
    try {
      if (!this.smsClient) {
        console.warn('SMS service not configured');
        return false;
      }

      const result = await this.smsClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to
      });

      console.log('SMS sent successfully:', result.sid);
      return true;
    } catch (error) {
      console.error('Error sending SMS:', error);
      return false;
    }
  }

  // Send push notification
  async sendPushNotification(userId, title, message, data = {}) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
        console.warn(`No push subscriptions found for user ${userId}`);
        return false;
      }

      const payload = JSON.stringify({
        title,
        message,
        data,
        icon: '/icons/notification-icon.png',
        badge: '/icons/badge-icon.png'
      });

      const promises = user.pushSubscriptions.map(subscription => 
        webpush.sendNotification(subscription, payload)
          .catch(error => {
            console.error('Push notification failed:', error);
            // Remove invalid subscriptions
            if (error.statusCode === 410) {
              this.removeInvalidPushSubscription(userId, subscription);
            }
          })
      );

      await Promise.allSettled(promises);
      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  // Remove invalid push subscription
  async removeInvalidPushSubscription(userId, subscription) {
    try {
      await User.findByIdAndUpdate(userId, {
        $pull: { pushSubscriptions: subscription }
      });
    } catch (error) {
      console.error('Error removing invalid push subscription:', error);
    }
  }

  // Send comprehensive notification (all channels)
  async sendNotification(userId, type, title, message, options = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Create notification record
      const notification = await this.createNotification(userId, type, title, message, options.data);

      const notificationPrefs = user.notificationPreferences || {};
      const promises = [];

      // Send email if enabled
      if (notificationPrefs.email !== false && user.email) {
        const emailContent = this.generateEmailContent(type, title, message, options.data);
        promises.push(this.sendEmail(user.email, title, emailContent));
      }

      // Send SMS if enabled and phone number available
      if (notificationPrefs.sms && user.phoneNumber) {
        const smsMessage = `${title}: ${message}`;
        promises.push(this.sendSMS(user.phoneNumber, smsMessage));
      }

      // Send push notification if enabled
      if (notificationPrefs.push !== false) {
        promises.push(this.sendPushNotification(userId, title, message, options.data));
      }

      await Promise.allSettled(promises);

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Generate email content based on notification type
  generateEmailContent(type, title, message, data = {}) {
    const baseTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 2px solid #2196F3; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #2196F3; }
            .title { color: #333; font-size: 20px; margin: 20px 0; }
            .message { color: #666; line-height: 1.6; margin: 20px 0; }
            .button { display: inline-block; background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">📚 Community Library</div>
            </div>
            <h2 class="title">${title}</h2>
            <div class="message">${message}</div>
            ${this.getTypeSpecificContent(type, data)}
            <div class="footer">
              <p>Community Library - Connecting readers in your neighborhood</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return baseTemplate;
  }

  // Get type-specific email content
  getTypeSpecificContent(type, data) {
    switch (type) {
      case 'registration_approval':
        return `
          <p>Welcome to Community Library! You can now start browsing and renting books from your community.</p>
          <a href="${process.env.FRONTEND_URL}/login" class="button">Login to Your Account</a>
        `;
      
      case 'rental_success':
        return `
          <p><strong>Book:</strong> ${data.bookTitle}</p>
          <p><strong>Rental Period:</strong> ${data.startDate} to ${data.endDate}</p>
          <p><strong>Total Cost:</strong> ${data.totalCost}</p>
          <a href="${process.env.FRONTEND_URL}/rentals" class="button">View My Rentals</a>
        `;
      
      case 'hold_expiration':
        return `
          <p><strong>Book:</strong> ${data.bookTitle}</p>
          <p><strong>Hold Expires:</strong> ${data.expirationDate}</p>
          <p>Please complete your rental soon or your hold will be released.</p>
          <a href="${process.env.FRONTEND_URL}/borrower" class="button">Complete Rental</a>
        `;
      
      case 'due_date_reminder':
        return `
          <p><strong>Book:</strong> ${data.bookTitle}</p>
          <p><strong>Due Date:</strong> ${data.dueDate}</p>
          <p>Please return the book on time to avoid late fees.</p>
          <a href="${process.env.FRONTEND_URL}/rentals" class="button">View Rental Details</a>
        `;
      
      case 'fine_notification':
        return `
          <p><strong>Book:</strong> ${data.bookTitle}</p>
          <p><strong>Days Overdue:</strong> ${data.daysOverdue}</p>
          <p><strong>Fine Amount:</strong> ${data.fineAmount}</p>
          <p>Late fees have been automatically deducted from your wallet.</p>
          <a href="${process.env.FRONTEND_URL}/wallet" class="button">View Wallet</a>
        `;
      
      case 'checkout_request':
        return `
          <p><strong>Book:</strong> ${data.bookTitle}</p>
          <p><strong>Borrower:</strong> ${data.borrowerName}</p>
          <p><strong>Requested Period:</strong> ${data.startDate} to ${data.endDate}</p>
          <p>A new rental request is waiting for your approval.</p>
          <a href="${process.env.FRONTEND_URL}/publisher" class="button">Review Request</a>
        `;
      
      default:
        return '';
    }
  }

  // Specific notification methods for different events

  // Registration approval notification
  async notifyRegistrationApproval(userId) {
    return this.sendNotification(
      userId,
      'registration_approval',
      'Welcome to Community Library!',
      'Your account has been approved. You can now start browsing and renting books from your community.'
    );
  }

  // Successful rental notification
  async notifyRentalSuccess(borrowerId, publisherId, rentalData) {
    const borrowerNotification = this.sendNotification(
      borrowerId,
      'rental_success',
      'Rental Confirmed',
      `Your rental of "${rentalData.bookTitle}" has been confirmed.`,
      { data: rentalData }
    );

    const publisherNotification = this.sendNotification(
      publisherId,
      'rental_completed',
      'Book Rented',
      `Your book "${rentalData.bookTitle}" has been rented successfully.`,
      { data: rentalData }
    );

    return Promise.all([borrowerNotification, publisherNotification]);
  }

  // Hold expiration notification
  async notifyHoldExpiration(userId, holdData) {
    return this.sendNotification(
      userId,
      'hold_expiration',
      'Hold Expiring Soon',
      `Your hold on "${holdData.bookTitle}" expires in 24 hours.`,
      { data: holdData }
    );
  }

  // Due date reminder notification
  async notifyDueDate(userId, rentalData) {
    return this.sendNotification(
      userId,
      'due_date_reminder',
      'Book Due Tomorrow',
      `"${rentalData.bookTitle}" is due for return tomorrow.`,
      { data: rentalData }
    );
  }

  // Fine notification
  async notifyFine(userId, fineData) {
    return this.sendNotification(
      userId,
      'fine_notification',
      'Late Fee Applied',
      `A late fee of ${fineData.fineAmount} has been applied to your account.`,
      { data: fineData }
    );
  }

  // New checkout request notification (real-time for publishers)
  async notifyCheckoutRequest(publisherId, requestData) {
    const notification = await this.sendNotification(
      publisherId,
      'checkout_request',
      'New Rental Request',
      `New rental request for "${requestData.bookTitle}" from ${requestData.borrowerName}.`,
      { 
        data: requestData,
        priority: 'high',
        realTime: true
      }
    );

    // Emit real-time event for immediate notification
    this.emit('urgent_notification', {
      userId: publisherId,
      type: 'checkout_request',
      data: requestData
    });

    return notification;
  }

  // Get user notifications with pagination
  async getUserNotifications(userId, page = 1, limit = 20, unreadOnly = false) {
    try {
      const skip = (page - 1) * limit;
      const filter = { user: userId };
      
      if (unreadOnly) {
        filter.read = false;
      }

      const [notifications, totalCount, unreadCount] = await Promise.all([
        Notification.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Notification.countDocuments(filter),
        Notification.countDocuments({ user: userId, read: false })
      ]);

      return {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        },
        unreadCount
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { read: true, readAt: new Date() },
        { new: true }
      );

      if (!notification) {
        throw new Error('Notification not found');
      }

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { user: userId, read: false },
        { read: true, readAt: new Date() }
      );

      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        user: userId
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      return notification;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Subscribe to push notifications
  async subscribeToPush(userId, subscription) {
    try {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { pushSubscriptions: subscription }
      });

      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(userId, preferences) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { notificationPreferences: preferences },
        { new: true }
      );

      return user.notificationPreferences;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  // Schedule periodic notifications (to be called by cron jobs)
  async sendDueDateReminders() {
    try {
      const BookRequest = require('../models/BookRequest');
      
      // Find rentals due tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(23, 59, 59, 999);

      const dueRentals = await BookRequest.find({
        'rental.status': 'active',
        'rental.actualEndDate': {
          $gte: tomorrow,
          $lte: tomorrowEnd
        }
      }).populate(['book', 'borrower']);

      const promises = dueRentals.map(rental => 
        this.notifyDueDate(rental.borrower._id, {
          bookTitle: rental.book.title,
          dueDate: rental.rental.actualEndDate,
          rentalId: rental._id
        })
      );

      await Promise.allSettled(promises);
      
      console.log(`Sent ${dueRentals.length} due date reminders`);
      return dueRentals.length;
    } catch (error) {
      console.error('Error sending due date reminders:', error);
      throw error;
    }
  }

  // Send hold expiration warnings
  async sendHoldExpirationWarnings() {
    try {
      const BookRequest = require('../models/BookRequest');
      
      // Find holds expiring in 24 hours
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const expiringHolds = await BookRequest.find({
        status: 'approved',
        'hold.expiresAt': {
          $gte: new Date(),
          $lte: tomorrow
        }
      }).populate(['book', 'borrower']);

      const promises = expiringHolds.map(hold => 
        this.notifyHoldExpiration(hold.borrower._id, {
          bookTitle: hold.book.title,
          expirationDate: hold.hold.expiresAt,
          holdId: hold._id
        })
      );

      await Promise.allSettled(promises);
      
      console.log(`Sent ${expiringHolds.length} hold expiration warnings`);
      return expiringHolds.length;
    } catch (error) {
      console.error('Error sending hold expiration warnings:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
