


const cron = require('node-cron');
const Hotel = require('../models/Hotel');
const User = require('../models/User');
const EmailService = require('./emailService');
const ProPayment = require('../models/ProPayment');
const { pool } = require('../config/database');

class TrialService {
  constructor() {
    this.initCronJobs();
    this.sentReminders = new Map(); // In-memory cache for sent reminders
  }

  initCronJobs() {
    // Daily check at 9 AM for all trial reminders
    cron.schedule('0 9 * * *', async () => {
      console.log('🕒 [TrialService] Checking for trial reminders...');
      await this.sendAllTrialReminders();
    });

    // Daily check at 10 AM for expired trials
    cron.schedule('0 10 * * *', async () => {
      console.log('🕒 [TrialService] Suspending expired trial accounts...');
      await this.suspendExpiredTrials();
    });

    console.log('✅ TrialService cron jobs initialized (5-day reminders)');
  }

  // Send all trial reminders (5, 4, 3, 2, 1 days left)
  async sendAllTrialReminders() {
    try {
      // Get all trials expiring in next 5 days
      const expiringTrials = await Hotel.findTrialsExpiringInDays(5);
      
      console.log(`📧 Found ${expiringTrials.length} trials expiring in next 5 days`);
      
      for (const hotel of expiringTrials) {
        try {
          // Calculate days left
          const expiryDate = new Date(hotel.trial_expiry_date);
          const now = new Date();
          const timeDiff = expiryDate.getTime() - now.getTime();
          const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
          
          // Send reminder based on days left
          if (daysLeft >= 1 && daysLeft <= 5) {
            await this.sendTrialReminderEmail(hotel, daysLeft);
          }
        } catch (error) {
          console.error(`❌ Failed to process hotel ${hotel.name}:`, error.message);
        }
      }
      
      // Send extra urgent reminder for trials expiring today
      await this.sendTodayExpiryReminders();
      
    } catch (error) {
      console.error('❌ Error sending trial reminders:', error);
    }
  }

  // Send reminders for trials expiring today
  async sendTodayExpiryReminders() {
    try {
      const expiringToday = await Hotel.findTrialsExpiringToday();
      
      console.log(`📧 Found ${expiringToday.length} trials expiring today`);
      
      for (const hotel of expiringToday) {
        try {
          await EmailService.sendTrialExpiringTodayEmail(
            hotel.admin_email,
            hotel.name,
            hotel.admin_name,
            new Date(hotel.trial_expiry_date)
          );
          console.log(`✅ Sent today expiry reminder to: ${hotel.admin_email}`);
        } catch (error) {
          console.error(`❌ Failed to send today reminder to ${hotel.admin_email}:`, error.message);
        }
      }
    } catch (error) {
      console.error('❌ Error sending today expiry reminders:', error);
    }
  }

  // Helper: Send appropriate reminder email based on days left
  async sendTrialReminderEmail(hotel, daysLeft) {
    try {
      const today = new Date().toDateString();
      const reminderKey = `${hotel.id}-${daysLeft}-${today}`;
      
      // Check if we already sent this reminder today (in-memory cache)
      if (this.sentReminders.has(reminderKey)) {
        console.log(`📨 Reminder already sent today for hotel ${hotel.id}, ${daysLeft} days left`);
        return;
      }
      
      // Send different email based on days left
      switch(daysLeft) {
        case 5:
          await EmailService.sendTrial5DayReminder(
            hotel.admin_email,
            hotel.name,
            hotel.admin_name,
            daysLeft,
            new Date(hotel.trial_expiry_date)
          );
          break;
        case 4:
          await EmailService.sendTrial4DayReminder(
            hotel.admin_email,
            hotel.name,
            hotel.admin_name,
            daysLeft,
            new Date(hotel.trial_expiry_date)
          );
          break;
        case 3:
          await EmailService.sendTrial3DayReminder(
            hotel.admin_email,
            hotel.name,
            hotel.admin_name,
            daysLeft,
            new Date(hotel.trial_expiry_date)
          );
          break;
        case 2:
          await EmailService.sendTrial2DayReminder(
            hotel.admin_email,
            hotel.name,
            hotel.admin_name,
            daysLeft,
            new Date(hotel.trial_expiry_date)
          );
          break;
        case 1:
          await EmailService.sendTrial1DayReminder(
            hotel.admin_email,
            hotel.name,
            hotel.admin_name,
            daysLeft,
            new Date(hotel.trial_expiry_date)
          );
          break;
      }
      
      // Mark as sent in memory cache
      this.sentReminders.set(reminderKey, true);
      console.log(`✅ Sent ${daysLeft}-day reminder to: ${hotel.admin_email}`);
    } catch (error) {
      console.error(`❌ Failed to send ${daysLeft}-day reminder:`, error.message);
    }
  }

  // Clear memory cache at midnight (prevents duplicate emails next day)
  clearReminderCache() {
    this.sentReminders.clear();
    console.log('🧹 Cleared reminder cache');
  }

  // Suspend accounts with expired trials
  async suspendExpiredTrials() {
    try {
      // Get hotels with expired trials but users still pending
      const [expiredRows] = await pool.execute(
        `SELECT h.*, u.id as user_id, u.email, u.name as admin_name, u.status as user_status
         FROM hotels h
         JOIN users u ON h.id = u.hotel_id AND u.role = 'admin'
         WHERE h.plan = 'pro'
         AND h.trial_expiry_date IS NOT NULL
         AND h.trial_expiry_date < NOW()
         AND u.status = 'pending'`
      );
      
      for (const row of expiredRows) {
        try {
          // Update user status to suspended
          await User.updateStatus(row.user_id, 'suspended');
          
          // Send suspension email
          await EmailService.sendTrialExpiredEmail(
            row.email,
            row.name,
            row.admin_name,
            new Date(row.trial_expiry_date)
          );
          
          console.log(`✅ Suspended account for: ${row.email}`);
        } catch (error) {
          console.error(`❌ Failed to suspend ${row.email}:`, error.message);
        }
      }
      
      console.log(`✅ Suspended ${expiredRows.length} expired trial accounts`);
      
      // Clear reminder cache after processing expired trials
      this.clearReminderCache();
      
    } catch (error) {
      console.error('❌ Error suspending expired trials:', error);
    }
  }

  // Manual upgrade after payment (for reactivation)
  async upgradeToProAfterPayment(userId, hotelId, paymentData) {
    try {
      const paymentAmount = 39900; // ₹399 in paise
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 6); // 6 months from now
      
      // Update user status to active
      await User.updateStatus(userId, 'active');
      
      // Update hotel trial expiry (extend by 6 months)
      await Hotel.updateTrialExpiry(hotelId, expiryDate);
      
      // Save payment record
      await ProPayment.create({
        hotel_id: hotelId,
        razorpay_order_id: paymentData.order_id,
        razorpay_payment_id: paymentData.payment_id,
        razorpay_signature: paymentData.signature,
        amount: paymentAmount / 100, // Convert paise to rupees
        currency: 'INR',
        plan_type: 'pro_reactivation',
        payment_status: 'success',
        gateway_response: {
          type: 'reactivation',
          reactivated_at: new Date().toISOString()
        }
      });
      
      // Send reactivation confirmation email
      const user = await User.findById(userId);
      const hotel = await Hotel.findById(hotelId);
      
      await EmailService.sendReactivationConfirmationEmail(
        user.email,
        hotel.name,
        user.name,
        expiryDate
      );
      
      console.log(`✅ Account reactivated for user ${userId}, hotel ${hotelId}`);
      return true;
    } catch (error) {
      console.error('❌ Error upgrading after payment:', error);
      throw error;
    }
  }

  // Test method to manually trigger checks
  async testTrialChecks() {
    console.log('🧪 Running manual trial checks...');
    await this.sendAllTrialReminders();
    await this.suspendExpiredTrials();
    console.log('🧪 Manual trial checks completed');
  }
}

module.exports = new TrialService();