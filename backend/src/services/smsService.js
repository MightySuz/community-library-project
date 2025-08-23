const twilio = require('twilio');

class SMSService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
    
    // Only initialize Twilio client if credentials are properly configured
    if (this.accountSid && this.accountSid.startsWith('AC') && this.authToken && this.fromNumber) {
      this.client = twilio(this.accountSid, this.authToken);
      this.isConfigured = true;
    } else {
      this.client = null;
      this.isConfigured = false;
      console.warn('⚠️  SMS Service: Twilio credentials not configured. SMS notifications will be disabled.');
    }
  }
  
  async sendOTP(phoneNumber, otp) {
    if (!this.isConfigured) {
      console.warn('⚠️  SMS Service: Twilio not configured, skipping SMS OTP');
      return { success: false, message: 'SMS service not configured' };
    }
    
    const message = `Your Community Library verification code is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`;
    
    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: phoneNumber
      });
      
      console.log(`OTP SMS sent to ${phoneNumber}, SID: ${result.sid}`);
      return result;
    } catch (error) {
      console.error('Error sending OTP SMS:', error);
      throw new Error('Failed to send verification SMS');
    }
  }
  
  async sendWelcomeSMS(phoneNumber, fullName) {
    if (!this.isConfigured) {
      console.warn('⚠️  SMS Service: Twilio not configured, skipping welcome SMS');
      return { success: false, message: 'SMS service not configured' };
    }
    
    const message = `Welcome to Community Library, ${fullName}! 🎉 Your account has been approved. Start lending and borrowing books in your community. Download our app or visit our website to get started.`;
    
    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: phoneNumber
      });
      
      console.log(`Welcome SMS sent to ${phoneNumber}, SID: ${result.sid}`);
      return result;
    } catch (error) {
      console.error('Error sending welcome SMS:', error);
    }
  }
  
  async sendNotificationSMS(phoneNumber, message) {
    if (!this.isConfigured) {
      console.warn('⚠️  SMS Service: Twilio not configured, skipping notification SMS');
      return { success: false, message: 'SMS service not configured' };
    }
    
    try {
      const result = await this.client.messages.create({
        body: `Community Library: ${message}`,
        from: this.fromNumber,
        to: phoneNumber
      });
      
      console.log(`Notification SMS sent to ${phoneNumber}, SID: ${result.sid}`);
      return result;
    } catch (error) {
      console.error('Error sending notification SMS:', error);
    }
  }
}

module.exports = new SMSService();
