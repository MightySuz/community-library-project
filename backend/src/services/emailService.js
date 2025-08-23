const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  
  async sendOTP(email, fullName, otp) {
    const mailOptions = {
      from: `"Community Library" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - Community Library',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background-color: #2E7D32; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .otp { font-size: 32px; font-weight: bold; color: #2E7D32; text-align: center; margin: 20px 0; padding: 15px; background-color: white; border-radius: 8px; letter-spacing: 3px; }
            .footer { padding: 20px; text-align: center; font-size: 14px; color: #666; }
            .button { display: inline-block; padding: 12px 24px; background-color: #2E7D32; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📚 Community Library</h1>
              <p>Email Verification</p>
            </div>
            <div class="content">
              <h2>Hello ${fullName}!</h2>
              <p>Thank you for registering with Community Library. To complete your registration, please verify your email address using the OTP below:</p>
              
              <div class="otp">${otp}</div>
              
              <p><strong>This OTP will expire in 10 minutes.</strong></p>
              
              <p>If you didn't create an account with Community Library, please ignore this email.</p>
              
              <h3>What's Next?</h3>
              <ul>
                <li>✅ Verify your email (this step)</li>
                <li>📱 Verify your phone number</li>
                <li>⏳ Wait for admin approval</li>
                <li>🎉 Start lending and borrowing books!</li>
              </ul>
            </div>
            <div class="footer">
              <p>Community Library - Connecting Communities Through Books</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`OTP email sent to ${email}`);
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw new Error('Failed to send verification email');
    }
  }
  
  async sendWelcomeEmail(email, fullName) {
    const mailOptions = {
      from: `"Community Library" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Community Library! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background-color: #2E7D32; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .footer { padding: 20px; text-align: center; font-size: 14px; color: #666; }
            .button { display: inline-block; padding: 12px 24px; background-color: #2E7D32; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            .feature { margin: 15px 0; padding: 15px; background-color: white; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Community Library!</h1>
            </div>
            <div class="content">
              <h2>Congratulations ${fullName}!</h2>
              <p>Your account has been approved and you're now part of the Community Library family. You can start lending and borrowing books right away!</p>
              
              <div class="feature">
                <h3>📚 What You Can Do Now:</h3>
                <ul>
                  <li><strong>Browse Books:</strong> Discover books available in your community</li>
                  <li><strong>Publish Books:</strong> Add your books for others to borrow</li>
                  <li><strong>Borrow Books:</strong> Request books from other community members</li>
                  <li><strong>Manage Wallet:</strong> Add funds and track your transactions</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.WEB_APP_URL || 'http://localhost:3000'}" class="button">Start Exploring</a>
              </div>
              
              <p><strong>Tips for Success:</strong></p>
              <ul>
                <li>Keep your books in good condition</li>
                <li>Return books on time to avoid fines</li>
                <li>Rate and review books to help others</li>
                <li>Be respectful to fellow community members</li>
              </ul>
            </div>
            <div class="footer">
              <p>Community Library - Connecting Communities Through Books</p>
              <p>Need help? Contact our support team.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${email}`);
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  }
  
  async sendRejectionEmail(email, fullName, reason) {
    const mailOptions = {
      from: `"Community Library" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Account Application Update - Community Library',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background-color: #d32f2f; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .footer { padding: 20px; text-align: center; font-size: 14px; color: #666; }
            .reason { background-color: #ffebee; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📚 Community Library</h1>
              <p>Account Application Update</p>
            </div>
            <div class="content">
              <h2>Hello ${fullName},</h2>
              <p>Thank you for your interest in joining Community Library. After careful review, we are unable to approve your account at this time.</p>
              
              <div class="reason">
                <h3>Reason:</h3>
                <p>${reason || 'Please contact our support team for more information.'}</p>
              </div>
              
              <p>If you believe this is an error or would like to discuss your application, please contact our support team.</p>
              
              <p>We appreciate your understanding and encourage you to reach out if you have any questions.</p>
            </div>
            <div class="footer">
              <p>Community Library - Connecting Communities Through Books</p>
              <p>Contact: support@communitylibrary.com</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Rejection email sent to ${email}`);
    } catch (error) {
      console.error('Error sending rejection email:', error);
    }
  }
}

module.exports = new EmailService();
