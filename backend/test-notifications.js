const express = require('express');
const cors = require('cors');
const notificationService = require('./src/services/notificationService');

const app = express();

app.use(cors());
app.use(express.json());

// Test notification endpoint
app.post('/test-notification', async (req, res) => {
  try {
    console.log('Testing notification system...');
    
    // Simulate sending a test notification
    const notification = await notificationService.createNotification({
      user: 'test-user-id',
      type: 'system_update',
      title: 'Notification System Test',
      message: 'This is a test notification to verify the system is working correctly.',
      channels: ['push'],
      priority: 'low',
      data: { test: true }
    });

    console.log('Notification created:', notification);
    
    res.json({
      success: true,
      message: 'Test notification sent successfully',
      notification
    });
  } catch (error) {
    console.error('Test notification failed:', error);
    res.status(500).json({
      success: false,
      message: 'Test notification failed',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Notification test server is running',
    timestamp: new Date().toISOString(),
    services: {
      notification: 'ready',
      email: process.env.EMAIL_USER ? 'configured' : 'not configured',
      sms: process.env.TWILIO_ACCOUNT_SID ? 'configured' : 'not configured',
      push: process.env.VAPID_PUBLIC_KEY ? 'configured' : 'not configured'
    }
  });
});

const PORT = process.env.TEST_PORT || 3001;

app.listen(PORT, () => {
  console.log(`🧪 Notification test server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔔 Test notification: POST http://localhost:${PORT}/test-notification`);
  console.log('');
  console.log('To test the notification system:');
  console.log(`curl -X POST http://localhost:${PORT}/test-notification`);
});

module.exports = app;
