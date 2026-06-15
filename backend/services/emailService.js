

const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Ensure templates directory exists
    this.templatesDir = path.join(__dirname, '../templates');
  }

  // Send booking confirmation email
  async sendBookingConfirmation(bookingDetails, hotelDetails, customerDetails,companyDetails = {}) {
    try {
      // Read and populate HTML template
      let htmlContent = await this.getTemplate('booking-confirmation.html');

      const companyInfo = {
        logoUrl: companyDetails.companyLogoUrl || companyLogoBase64,
        name: companyDetails.companyName || 'Hithlaksh Solutions Private Limited',
        website: companyDetails.companyWebsite || 'https://hithlakshsolutions.com/',
        privacyLink: companyDetails.privacyLink || 'https://hithlakshsolutions.com/privacy',
        termsLink: companyDetails.termsLink || 'https://hithlakshsolutions.com/terms'
      };

      // Replace template variables
      htmlContent = htmlContent
        .replace(/{{customerName}}/g, customerDetails.name || 'Guest')
        .replace(/{{bookingId}}/g, bookingDetails.id)
        .replace(/{{roomNumber}}/g, bookingDetails.room_number)
        .replace(/{{checkInDate}}/g, this.formatDate(bookingDetails.from_date))
        .replace(/{{checkInTime}}/g, bookingDetails.from_time || '14:00')
        .replace(/{{checkOutDate}}/g, this.formatDate(bookingDetails.to_date))
        .replace(/{{checkOutTime}}/g, bookingDetails.to_time || '12:00')
        .replace(/{{hotelName}}/g, hotelDetails.name || 'Hotel')
        .replace(/{{hotelAddress}}/g, hotelDetails.address || 'Not specified')
        .replace(/{{hotelPhone}}/g, hotelDetails.phone || 'Not specified')
        .replace(/{{hotelEmail}}/g, hotelDetails.email || process.env.EMAIL_USER)
        .replace(/{{totalAmount}}/g, bookingDetails.total || 0)
        .replace(/{{paymentMethod}}/g, bookingDetails.payment_method || 'Cash')
        .replace(/{{paymentStatus}}/g, bookingDetails.payment_status || 'Pending')
        .replace(/{{companyLogoUrl}}/g, companyInfo.logoUrl)
        .replace(/{{companyName}}/g, companyInfo.name)
        .replace(/{{companyWebsite}}/g, companyInfo.website)
        .replace(/{{privacyLink}}/g, companyInfo.privacyLink)
        .replace(/{{termsLink}}/g, companyInfo.termsLink)
        .replace(/{{currentYear}}/g, new Date().getFullYear());

      const mailOptions = {
        from: `"${hotelDetails.name || 'Hotel Management'}" <${process.env.EMAIL_USER}>`,
        to: customerDetails.email,
        subject: `Booking Confirmation #${bookingDetails.id} - ${hotelDetails.name || 'Hotel Management'}`,
        html: htmlContent,
        text: this.generatePlainText(bookingDetails, hotelDetails, customerDetails)
      };

      // Add CC only if hotel admin email exists
      if (hotelDetails.email && hotelDetails.email !== process.env.EMAIL_USER) {
        mailOptions.cc = hotelDetails.email;
      }

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Booking confirmation email sent:', info.messageId);
      return info;

    } catch (error) {
      console.error('❌ Error sending booking confirmation email:', error);
      throw error;
    }
  }

  // Send check-out reminder email
  // async sendCheckoutReminder(bookingDetails, hotelDetails, customerDetails) {
  //   try {
  //     // Read and populate HTML template
  //     let htmlContent = await this.getTemplate('checkout-reminder.html');

  //     // Calculate time until checkout
  //     const checkoutTime = new Date(`${bookingDetails.to_date} ${bookingDetails.to_time || '12:00'}`);
  //     const now = new Date();
  //     const hoursUntilCheckout = Math.floor((checkoutTime - now) / (1000 * 60 * 60));

  //     htmlContent = htmlContent
  //       .replace(/{{customerName}}/g, customerDetails.name || 'Guest')
  //       .replace(/{{bookingId}}/g, bookingDetails.id)
  //       .replace(/{{roomNumber}}/g, bookingDetails.room_number)
  //       .replace(/{{checkOutTime}}/g, bookingDetails.to_time || '12:00')
  //       .replace(/{{hoursUntilCheckout}}/g, hoursUntilCheckout)
  //       .replace(/{{hotelName}}/g, hotelDetails.name || 'Hotel Management')
  //       .replace(/{{hotelPhone}}/g, hotelDetails.phone || 'Contact reception');

  //     const mailOptions = {
  //       from: `"${hotelDetails.name || 'Hotel Management'}" <${process.env.EMAIL_USER}>`,
  //       to: customerDetails.email,
  //       subject: `Check-out Reminder - Booking #${bookingDetails.id}`,
  //       html: htmlContent,
  //       text: this.generateReminderPlainText(bookingDetails, hotelDetails, customerDetails)
  //     };

  //     // Add CC only if hotel admin email exists
  //     if (hotelDetails.email && hotelDetails.email !== process.env.EMAIL_USER) {
  //       mailOptions.cc = hotelDetails.email;
  //     }

  //     const info = await this.transporter.sendMail(mailOptions);
  //     console.log('✅ Check-out reminder email sent:', info.messageId);
  //     return info;

  //   } catch (error) {
  //     console.error('❌ Error sending check-out reminder email:', error);
  //     throw error;
  //   }
  // }
  // Send check-out reminder email
  async sendCheckoutReminder(bookingDetails, hotelDetails, customerDetails) {
    try {
      // Read and populate HTML template
      let htmlContent = await this.getTemplate('checkout-reminder.html');

      // Calculate time until checkout SAFELY
      let hoursUntilCheckout = 1; // Default value

      try {
        // Safely parse checkout time
        const checkoutTimeStr = `${bookingDetails.to_date} ${bookingDetails.to_time || '12:00'}`;
        const checkoutTime = new Date(checkoutTimeStr);
        const now = new Date();

        // Validate dates
        if (!isNaN(checkoutTime.getTime()) && !isNaN(now.getTime())) {
          const timeDiff = checkoutTime.getTime() - now.getTime();
          hoursUntilCheckout = Math.max(1, Math.floor(timeDiff / (1000 * 60 * 60)));

          // If checkout has passed or is very close
          if (hoursUntilCheckout <= 0) {
            hoursUntilCheckout = 1; // Show 1 hour as minimum
          }
        }
      } catch (dateError) {
        console.warn('⚠️ Date calculation error, using default 1 hour:', dateError.message);
      }

      // Ensure checkOutTime has a default value
      const checkOutTime = bookingDetails.to_time || '12:00';

      htmlContent = htmlContent
        .replace(/{{customerName}}/g, customerDetails.name || 'Guest')
        .replace(/{{bookingId}}/g, bookingDetails.id)
        .replace(/{{roomNumber}}/g, bookingDetails.room_number)
        .replace(/{{checkOutTime}}/g, checkOutTime)
        .replace(/{{hoursUntilCheckout}}/g, hoursUntilCheckout)
        .replace(/{{hotelName}}/g, hotelDetails.name || 'Hotel Management')
        .replace(/{{hotelPhone}}/g, hotelDetails.phone || 'Contact reception');

      const mailOptions = {
        from: `"${hotelDetails.name || 'Hotel Management'}" <${process.env.EMAIL_USER}>`,
        to: customerDetails.email,
        subject: `Check-out Reminder - Booking #${bookingDetails.id}`,
        html: htmlContent,
        text: this.generateReminderPlainText(bookingDetails, hotelDetails, customerDetails)
      };

      // Add CC only if hotel admin email exists
      if (hotelDetails.email && hotelDetails.email !== process.env.EMAIL_USER) {
        mailOptions.cc = hotelDetails.email;
      }

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Check-out reminder email sent:', info.messageId);
      console.log(`   Hours until checkout: ${hoursUntilCheckout}`);
      return info;

    } catch (error) {
      console.error('❌ Error sending check-out reminder email:', error);
      throw error;
    }
  }

  // Helper method to get template
  async getTemplate(templateName) {
    try {
      const templatePath = path.join(this.templatesDir, templateName);
      return await fs.readFile(templatePath, 'utf8');
    } catch (error) {
      console.warn(`⚠️ Template ${templateName} not found, using default`);
      return this.getDefaultTemplate(templateName);
    }
  }

  // Default templates (simplified for missing fields)
  getDefaultTemplate(templateName) {
    if (templateName.includes('reminder')) {
      return `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f39c12; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">{{hotelName}}</h1>
            <p style="margin: 10px 0 0;">Check-out Reminder</p>
          </div>
          
          <div style="background: #fef9e7; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Dear <strong>{{customerName}}</strong>,</p>
            <p>We hope you're enjoying your stay at {{hotelName}}!</p>
            
            <div style="background: white; border: 2px dashed #f39c12; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <h3 style="color: #e74c3c;">⏰ Check-out in {{hoursUntilCheckout}} hour(s)</h3>
              <p><strong>Scheduled Check-out:</strong> Today at {{checkOutTime}}</p>
              <p><strong>Room:</strong> {{roomNumber}}</p>
              <p><strong>Booking ID:</strong> {{bookingId}}</p>
            </div>
            
            <div style="background: #ffeaa7; border-left: 4px solid #fdcb6e; padding: 15px; margin: 20px 0;">
              <h4 style="color: #d35400; margin-top: 0;">📌 Check-out Instructions</h4>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Please vacate the room by {{checkOutTime}}</li>
                <li>Return your room keys at the reception</li>
                <li>Settle any additional charges if applicable</li>
                <li>Collect your deposit (if any) upon check-out</li>
              </ul>
            </div>
            
            <p>We hope you had a pleasant stay. We look forward to welcoming you again!</p>
            
            <p>Safe travels,<br>
            <strong>The {{hotelName}} Team</strong></p>
          </div>
        </body>
        </html>
      `;
    } else {
      return `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">{{hotelName}}</h1>
            <p style="margin: 10px 0 0;">Booking Confirmation</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Dear <strong>{{customerName}}</strong>,</p>
            <p>Thank you for choosing {{hotelName}}. Your booking has been confirmed!</p>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #3498db;">
              <h3 style="color: #2c3e50; margin-top: 0;">📋 Booking Details</h3>
              <p><strong>Booking ID:</strong> {{bookingId}}</p>
              <p><strong>Room:</strong> {{roomNumber}}</p>
              <p><strong>Check-in:</strong> {{checkInDate}} at {{checkInTime}}</p>
              <p><strong>Check-out:</strong> {{checkOutDate}} at {{checkOutTime}}</p>
              <p><strong>Payment Method:</strong> {{paymentMethod}}</p>
              <p><strong>Payment Status:</strong> {{paymentStatus}}</p>
            </div>
            
            <div style="background: #e8f5e9; border: 2px solid #4caf50; border-radius: 8px; padding: 15px; text-align: center; font-size: 20px; font-weight: bold; color: #2e7d32;">
              Total Amount: ₹{{totalAmount}}
            </div>
            
            <div style="margin: 25px 0; padding: 15px; background: #fff8e1; border-left: 4px solid #ff9800;">
              <h4 style="color: #ff9800; margin-top: 0;">📌 Important Information</h4>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Please carry your ID proof at check-in</li>
                <li>Check-in time: {{checkInTime}}</li>
                <li>Check-out time: {{checkOutTime}}</li>
                <li>Early check-in/late check-out subject to availability</li>
              </ul>
            </div>
            
            <p>We look forward to welcoming you!</p>
            
            <p>Best regards,<br>
            <strong>The {{hotelName}} Team</strong></p>
          </div>
        </body>
        </html>
      `;
    }
  }

  // Format date helper
  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Generate plain text version for booking confirmation
  generatePlainText(bookingDetails, hotelDetails, customerDetails) {
    return `Dear ${customerDetails.name || 'Guest'},

Thank you for choosing ${hotelDetails.name || 'Hotel Management'}!

Booking Confirmation:

Booking ID: ${bookingDetails.id}
Room: ${bookingDetails.room_number}
Check-in: ${this.formatDate(bookingDetails.from_date)} at ${bookingDetails.from_time || '14:00'}
Check-out: ${this.formatDate(bookingDetails.to_date)} at ${bookingDetails.to_time || '12:00'}
Total Amount: ₹${bookingDetails.total || 0}
Payment Method: ${bookingDetails.payment_method || 'Cash'}

Important Information:
• Please carry your ID proof at check-in
• Check-in time: ${bookingDetails.from_time || '14:00'}
• Check-out time: ${bookingDetails.to_time || '12:00'}
• Early check-in/late check-out subject to availability

We look forward to welcoming you!

Best regards,
${hotelDetails.name || 'Hotel Management'} Team`;
  }

  // Generate plain text for reminder
  generateReminderPlainText(bookingDetails, hotelDetails, customerDetails) {
    const checkoutTime = new Date(`${bookingDetails.to_date} ${bookingDetails.to_time || '12:00'}`);
    const now = new Date();
    const hoursUntilCheckout = Math.floor((checkoutTime - now) / (1000 * 60 * 60));

    return `Dear ${customerDetails.name || 'Guest'},

We hope you're enjoying your stay at ${hotelDetails.name || 'Hotel Management'}!

Check-out Reminder:

Your check-out time is approaching in ${hoursUntilCheckout} hour(s).

Booking ID: ${bookingDetails.id}
Room: ${bookingDetails.room_number}
Scheduled Check-out: Today at ${bookingDetails.to_time || '12:00'}

Check-out Instructions:
• Please vacate the room by ${bookingDetails.to_time || '12:00'}
• Return your room keys at the reception
• Settle any additional charges if applicable
• Collect your deposit (if any) upon check-out

We hope you had a pleasant stay. We look forward to welcoming you again!

Safe travels,
${hotelDetails.name || 'Hotel Management'} Team`;
  }

  // Test connection
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email server connection successful');
      return true;
    } catch (error) {
      console.error('❌ Email server connection failed:', error.message);
      return false;
    }
  }


  async sendProPlanOTPEmail(email, otp, hotelName, adminName) {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">PRO Plan Registration</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">Verify your email for ${hotelName}</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Dear <strong>${adminName}</strong>,</p>
            
            <p>Thank you for choosing our PRO plan for <strong>${hotelName}</strong>!</p>
            
            <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;">
              <h3 style="color: #667eea; margin-top: 0;">Your Verification Code</h3>
              <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #333; margin: 20px 0;">
                ${otp}
              </div>
              <p style="color: #666; font-size: 14px;">This OTP is valid for 10 minutes</p>
            </div>
            
            <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
              <h4 style="color: #1565c0; margin-top: 0;">✨ PRO Plan Benefits</h4>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li><strong>30-day FREE trial</strong> - All features unlocked</li>
                <li>Unlimited bookings and customer records</li>
                <li>Advanced reporting and analytics</li>
                <li>Multi-user access with role-based permissions</li>
                <li>Priority email support</li>
              </ul>
            </div>
            
            <p><strong>Important:</strong> After 30 days, your account will be suspended until payment is made.</p>
            
            <p>Best regards,<br>
            <strong>Hotel Management System Team</strong></p>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"Hotel Management System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `PRO Plan Verification Code - ${hotelName}`,
        html: htmlContent
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ PRO plan OTP email sent to:', email);
      return info;

    } catch (error) {
      console.error('❌ Error sending PRO plan OTP email:', error);
      throw error;
    }
  }

  // Send trial expiry reminder (29th day)
  async sendTrialExpiryReminder(email, hotelName, adminName, expiryDate) {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%); color: #333; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">⚠️ Trial Period Ending Soon</h1>
            <p style="margin: 10px 0 0;">Your PRO plan trial for ${hotelName} expires tomorrow</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Dear <strong>${adminName}</strong>,</p>
            
            <p>This is a friendly reminder that your <strong>30-day PRO plan trial</strong> for <strong>${hotelName}</strong> will expire tomorrow.</p>
            
            <div style="background: white; border: 2px solid #ff6b6b; border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;">
              <h3 style="color: #e53935; margin-top: 0;">🕒 Trial Expiry Date</h3>
              <div style="font-size: 24px; font-weight: bold; color: #333; margin: 15px 0;">
                ${expiryDate.toDateString()}
              </div>
              <p style="color: #666;">Your account will be suspended if not upgraded</p>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h4 style="color: #856404; margin-top: 0;">❗ What happens next?</h4>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li><strong>Tomorrow:</strong> Account will be suspended automatically</li>
                <li><strong>After suspension:</strong> Cannot access PRO features</li>
                <li><strong>To reactivate:</strong> Make payment of ₹399 for 6 months</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/upgrade" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 50px; 
                        font-weight: bold;
                        display: inline-block;">
                💳 Upgrade to Full PRO Plan
              </a>
            </div>
            
            <p>To continue enjoying all PRO features without interruption, please upgrade your plan.</p>
            
            <p>Need help? Contact our support team.</p>
            
            <p>Best regards,<br>
            <strong>Hotel Management System Team</strong></p>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"Hotel Management System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `⚠️ Action Required: PRO Plan Trial Expiring Tomorrow - ${hotelName}`,
        html: htmlContent
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Trial expiry reminder sent to:', email);
      return info;

    } catch (error) {
      console.error('❌ Error sending trial expiry reminder:', error);
      throw error;
    }
  }

  // Send account suspended notification
  async sendAccountSuspendedEmail(email, hotelName, adminName) {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🔒 Account Suspended</h1>
            <p style="margin: 10px 0 0;">Your PRO plan trial has ended</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Dear <strong>${adminName}</strong>,</p>
            
            <p>Your <strong>30-day PRO plan trial</strong> for <strong>${hotelName}</strong> has ended.</p>
            
            <div style="background: white; border: 2px solid #ff6b6b; border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;">
              <h3 style="color: #e53935; margin-top: 0;">🚫 Account Status: SUSPENDED</h3>
              <p style="color: #666; margin: 15px 0;">PRO features are no longer accessible</p>
            </div>
            
            <div style="background: #ffeaea; border: 1px solid #ffcdd2; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h4 style="color: #c62828; margin-top: 0;">📋 What you can do now:</h4>
              <ol style="margin: 10px 0; padding-left: 20px;">
                <li><strong>Upgrade to PRO</strong> - Pay ₹399 for 6 months access</li>
                <li><strong>Switch to BASIC</strong> - Free plan with limited features</li>
                <li><strong>Export your data</strong> - Download your hotel data</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/upgrade" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 50px; 
                        font-weight: bold;
                        display: inline-block;">
                🔓 Reactivate PRO Plan
              </a>
            </div>
            
            <p><strong>Need immediate assistance?</strong><br>
            Contact support: support@hotelmanagementsystem.com</p>
            
            <p>We hope to continue serving you!</p>
            
            <p>Best regards,<br>
            <strong>Hotel Management System Team</strong></p>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"Hotel Management System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `🔒 Account Suspended: PRO Plan Trial Ended - ${hotelName}`,
        html: htmlContent
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Account suspended email sent to:', email);
      return info;

    } catch (error) {
      console.error('❌ Error sending account suspended email:', error);
      throw error;
    }
  }

  // Send welcome email
  async sendWelcomeEmail({ hotelName, plan, adminName, adminEmail, trialDays, trialExpiryDate }) {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to Hotel Management System!</h1>
            <p style="margin: 10px 0 0;">${hotelName} is now ${plan.toUpperCase()} plan</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Dear <strong>${adminName}</strong>,</p>
            
            <p>Congratulations! <strong>${hotelName}</strong> has been successfully registered with <strong>${plan.toUpperCase()} Plan</strong>.</p>
            
            ${plan === 'pro' ? `
            <div style="background: #e8f5e9; border: 2px solid #4caf50; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #2e7d32; margin-top: 0;">✨ 30-Day PRO Plan Trial</h3>
              <p><strong>Trial Period:</strong> ${trialDays} days</p>
              <p><strong>Trial Expiry:</strong> ${trialExpiryDate.toDateString()}</p>
              <p>Enjoy all PRO features during your trial period!</p>
            </div>
            ` : ''}
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h4 style="color: #333; margin-top: 0;">📋 Next Steps:</h4>
              <ol style="margin: 10px 0; padding-left: 20px;">
                <li>Login to your dashboard</li>
                <li>Set up your hotel rooms</li>
                <li>Add staff members</li>
                <li>Start managing bookings!</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 50px; 
                        font-weight: bold;
                        display: inline-block;">
                🚀 Go to Dashboard
              </a>
            </div>
            
            <p>Need help getting started? Check our documentation or contact support.</p>
            
            <p>Happy managing!<br>
            <strong>Hotel Management System Team</strong></p>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"Hotel Management System" <${process.env.EMAIL_USER}>`,
        to: adminEmail,
        subject: `🎉 Welcome to Hotel Management System - ${hotelName}`,
        html: htmlContent
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent to:', adminEmail);
      return info;

    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      throw error;
    }
  }
  // Add this to your EmailService.js class

// Send reactivation confirmation email
async sendReactivationConfirmationEmail(email, hotelName, adminName, newExpiryDate) {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Account Reactivated!</h1>
          <p style="margin: 10px 0 0;">Your PRO plan is now active</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Dear <strong>${adminName}</strong>,</p>
          
          <p>Great news! Your PRO plan for <strong>${hotelName}</strong> has been successfully reactivated.</p>
          
          <div style="background: white; border: 2px solid #4CAF50; border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;">
            <h3 style="color: #2E7D32; margin-top: 0;">✅ Account Status: ACTIVE</h3>
            <p style="color: #666; margin: 15px 0;">Full access to all PRO features restored</p>
          </div>
          
          <div style="background: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h4 style="color: #1b5e20; margin-top: 0;">📅 New Subscription Period</h4>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li><strong>Plan:</strong> PRO Plan</li>
              <li><strong>Duration:</strong> 6 months</li>
              <li><strong>Valid Until:</strong> ${newExpiryDate.toDateString()}</li>
              <li><strong>Amount Paid:</strong> ₹399</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 50px; 
                      font-weight: bold;
                      display: inline-block;">
              🚀 Go to Dashboard
            </a>
          </div>
          
          <p><strong>Thank you for choosing to continue with us!</strong><br>
          You now have full access to all PRO features for the next 6 months.</p>
          
          <p>Need help? Contact support: support@hotelmanagementsystem.com</p>
          
          <p>Best regards,<br>
          <strong>Hotel Management System Team</strong></p>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Hotel Management System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `✅ Account Reactivated: PRO Plan Active - ${hotelName}`,
      html: htmlContent
    };

    const info = await this.transporter.sendMail(mailOptions);
    console.log('✅ Reactivation confirmation email sent to:', email);
    return info;

  } catch (error) {
    console.error('❌ Error sending reactivation confirmation email:', error);
    throw error;
  }
}
// Add this method to your EmailService class
async sendTrialReminderSimple(email, hotelName, adminName, daysLeft, expiryDate) {
  try {
    // Use the SAME format as booking confirmation
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">Hotel Management System</h1>
          <p style="margin: 10px 0 0;">Account Information</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Hello <strong>${adminName}</strong>,</p>
          
          <p>This is an update about your PRO plan for <strong>${hotelName}</strong>.</p>
          
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #3498db;">
            <h3 style="color: #2c3e50; margin-top: 0;">📋 Plan Details</h3>
            <p><strong>Hotel:</strong> ${hotelName}</p>
            <p><strong>Plan:</strong> PRO Plan</p>
            <p><strong>Days Remaining:</strong> ${daysLeft} day${daysLeft > 1 ? 's' : ''}</p>
            <p><strong>Expiry Date:</strong> ${new Date(expiryDate).toLocaleDateString('en-IN')}</p>
          </div>
          
          <div style="margin: 25px 0; padding: 15px; background: #fff8e1; border-left: 4px solid #ff9800;">
            <h4 style="color: #ff9800; margin-top: 0;">📌 Important Information</h4>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Your PRO plan trial will end on ${new Date(expiryDate).toLocaleDateString('en-IN')}</li>
              <li>To continue using all features, please upgrade your plan</li>
              <li>After trial ends, you'll switch to BASIC plan automatically</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/upgrade" 
               style="background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Plan Options
            </a>
          </div>
          
          <p>If you have any questions, please reply to this email.</p>
          
          <p>Best regards,<br>
          <strong>Hotel Management System Team</strong></p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #777;">
            <p>This is an automated message. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Hotel Management System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Hotel Management System - Account Update',
      html: htmlContent,
      // ADD TEXT VERSION (important!)
      text: `Hello ${adminName},\n\nThis is an update about your PRO plan for ${hotelName}.\n\nPlan Details:\n- Hotel: ${hotelName}\n- Plan: PRO Plan\n- Days Remaining: ${daysLeft}\n- Expiry Date: ${new Date(expiryDate).toLocaleDateString('en-IN')}\n\nImportant Information:\n- Your PRO plan trial will end on ${new Date(expiryDate).toLocaleDateString('en-IN')}\n- To continue using all features, please upgrade your plan\n- After trial ends, you'll switch to BASIC plan automatically\n\nView Plan Options: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/upgrade\n\nBest regards,\nHotel Management System Team`
    };

    const info = await this.transporter.sendMail(mailOptions);
    console.log('✅ Trial reminder sent:', info.messageId);
    return info;

  } catch (error) {
    console.error('❌ Error sending trial reminder:', error);
    throw error;
  }
}
// Example for 1-day reminder:
async sendTrial1DayReminder(email, hotelName, adminName, daysLeft, expiryDate) {
  return await this.sendTrialReminderSimple(email, hotelName, adminName, daysLeft, expiryDate);
}

// Example for 5-day reminder:
async sendTrial5DayReminder(email, hotelName, adminName, daysLeft, expiryDate) {
  return await this.sendTrialReminderSimple(email, hotelName, adminName, daysLeft, expiryDate);
}

// Add this simple email sending method
async sendSimpleEmail(to, subject, html) {
  try {
    // Create plain text version (important for spam)
    const plainText = html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const mailOptions = {
      from: `Hotel Management System <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
      text: plainText, // Add plain text version
      
      // Add these headers to avoid spam
      headers: {
        'Precedence': 'bulk',
        'X-Priority': '3',
        'X-Mailer': 'Hotel Management System',
        'List-Unsubscribe': `<mailto:${process.env.EMAIL_USER}?subject=Unsubscribe>`,
        'Reply-To': process.env.EMAIL_USER
      }
    };

    console.log('📤 Sending simple email...');
    const info = await this.transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    
    return info;
  } catch (error) {
    console.error('❌ Email error:', error.message);
    throw error;
  }
}


// Add this method to your existing EmailService class

/**
 * Send password reset email with reset link
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email
 * @param {string} params.userName - User's name
 * @param {string} params.hotelName - Hotel name
 * @param {string} params.resetLink - Password reset link
 * @param {string} params.expiresIn - Token expiration time
 * @returns {Promise<boolean>} - Success status
 */
 async sendPasswordResetEmail({ to, userName, hotelName, resetLink, expiresIn }) {
  try {
    console.log('📧 [EMAIL] Preparing password reset email for:', to);
    
    // Check if email is configured
    if (!this.transporter) {
      console.warn('⚠️ [EMAIL] Email not configured - skipping password reset email');
      return false;
    }

    // Create email options
    const mailOptions = {
      from: `"Hotel Management System" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: `🔐 Password Reset Request - ${hotelName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0;
              padding: 0;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; 
              padding: 30px 20px; 
              text-align: center; 
              border-radius: 10px 10px 0 0; 
            }
            .content { 
              background: #f9f9f9; 
              padding: 40px 30px; 
              border-radius: 0 0 10px 10px; 
              border: 1px solid #e0e0e0;
              border-top: none;
            }
            .button { 
              display: inline-block; 
              padding: 14px 30px; 
              background: #667eea; 
              color: white !important; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 20px 0; 
              font-weight: 600;
              letter-spacing: 0.5px;
              box-shadow: 0 4px 6px rgba(102, 126, 234, 0.25);
            }
            .button:hover { 
              background: #764ba2; 
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              color: #666; 
              font-size: 12px; 
            }
            .warning { 
              background: #fff3cd; 
              border: 1px solid #ffeeba; 
              color: #856404; 
              padding: 15px; 
              border-radius: 8px; 
              margin: 25px 0; 
              font-size: 14px;
            }
            .hotel-name {
              font-size: 20px;
              font-weight: bold;
              margin: 10px 0;
              color: #4a5568;
            }
            .security-tips {
              background: #e8f4fd;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .security-tips h3 {
              margin-top: 0;
              color: #2c5282;
            }
            .security-tips ul {
              margin-bottom: 0;
              color: #2d3748;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0; font-size:28px;">🔐 Password Reset</h1>
            </div>
            <div class="content">
              <p style="font-size:16px;">Hello <strong>${userName}</strong>,</p>
              <p style="font-size:16px;">We received a request to reset the password for your account at:</p>
              
              <div class="hotel-name">🏨 ${hotelName}</div>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Reset Password</a>
              </div>
              
              <div class="warning">
                ⚠️ <strong>Important:</strong> This link will expire in <strong>${expiresIn}</strong>. 
                If you didn't request this password reset, please ignore this email or 
                <a href="mailto:support@hithlakshsolutions.com" style="color:#856404;">contact support</a> immediately.
              </div>
              
              <p style="color:#666;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px; font-size: 12px; color: #667eea;">
                ${resetLink}
              </p>
              
              <div class="security-tips">
                <h3>🔒 Security Tips:</h3>
                <ul>
                  <li>Never share this link with anyone</li>
                  <li>Choose a strong password (mix of letters, numbers, and symbols)</li>
                  <li>Don't reuse passwords from other websites</li>
                  <li>Update your password regularly</li>
                </ul>
              </div>
              
              <hr style="border: 1px solid #eee; margin: 30px 0;">
              
              <p style="color:#666; font-size:14px;">
                This is an automated message from the Hotel Management System. 
                Please do not reply to this email.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Hithlaksh Solutions Private Limited. All rights reserved.</p>
              <p>📍 Your trusted partner in hotel management</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // Send the email
    const info = await this.transporter.sendMail(mailOptions);
    console.log('✅ [EMAIL] Password reset email sent:', {
      messageId: info.messageId,
      to: to,
      response: info.response
    });
    
    return true;

  } catch (error) {
    console.error('❌ [EMAIL] Failed to send password reset email:', error);
    return false;
  }
}

}

module.exports = new EmailService();