

const EmailService = require('./emailService');
const { pool } = require('../config/database');
const cron = require('node-cron');

class SchedulerService {
  constructor() {
    this.sentReminders = new Set();
    this.scheduledTimeouts = new Map();
  }

  // Get hotel admin email
  async getHotelAdminEmail(hotelId) {
    try {
      const [admins] = await pool.execute(
        `SELECT email FROM users 
         WHERE hotel_id = ? AND role = 'admin' AND status = 'active'
         LIMIT 1`,
        [hotelId]
      );

      return admins.length > 0 ? admins[0].email : null;
    } catch (error) {
      console.error('❌ Error getting hotel admin email:', error);
      return null;
    }
  }

  // Get hotel details
  async getHotelDetails(hotelId) {
    try {
      const [hotels] = await pool.execute(
        `SELECT name FROM hotels WHERE id = ?`,
        [hotelId]
      );

      return hotels.length > 0 ? hotels[0] : { name: 'Hotel' };
    } catch (error) {
      console.error('❌ Error getting hotel details:', error);
      return { name: 'Hotel' };
    }
  }

  // Helper function to safely parse date
  // Helper function to safely parse date
  safeParseDate(dateStr, timeStr = '12:00') {
    try {
      if (!dateStr) return null;

      let date;

      // Case 1: dateStr is already a Date object
      if (dateStr instanceof Date) {
        date = new Date(dateStr);
      }
      // Case 2: dateStr is an ISO string (e.g., "2025-11-14T18:30:00.000Z")
      else if (typeof dateStr === 'string' && dateStr.includes('T')) {
        date = new Date(dateStr);
      }
      // Case 3: dateStr is in YYYY-MM-DD format
      else if (typeof dateStr === 'string') {
        const [year, month, day] = dateStr.split('-').map(Number);
        date = new Date(year, month - 1, day);
      }
      // Case 4: Unknown format
      else {
        console.error('❌ Unknown date format:', typeof dateStr, dateStr);
        return null;
      }

      // If date is invalid
      if (isNaN(date.getTime())) {
        console.error('❌ Invalid date:', dateStr);
        return null;
      }

      // Handle time string
      let hours = 12, minutes = 0;
      if (timeStr) {
        const [h, m] = timeStr.split(':').map(Number);
        hours = isNaN(h) ? 12 : h;
        minutes = isNaN(m) ? 0 : m;
      }

      // Set the time on the date
      date.setHours(hours, minutes, 0, 0);

      return date;
    } catch (error) {
      console.error('❌ Error parsing date:', {
        dateStr,
        timeStr,
        dateType: typeof dateStr,
        error: error.message
      });
      return null;
    }
  }


  // Validate booking has valid checkout data
  isValidBookingForReminder(booking) {
    if (!booking.to_date) {
      console.log(`❌ Booking ${booking.id} has no checkout date`);
      return false;
    }

    const checkoutDate = this.safeParseDate(booking.to_date, booking.to_time);
    if (!checkoutDate) {
      console.log(`❌ Booking ${booking.id} has invalid checkout date/time`);
      console.log(`   Date: ${booking.to_date}, Time: ${booking.to_time}`);
      console.log(`   Date type: ${typeof booking.to_date}`);
      return false;
    }

    // Check if checkout is in the future
    const now = new Date();
    if (checkoutDate <= now) {
      console.log(`⏰ Booking ${booking.id} checkout already passed`);
      console.log(`   Checkout: ${checkoutDate.toLocaleString()}`);
      console.log(`   Now: ${now.toLocaleString()}`);
      return false;
    }

    return true;
  }
  // Send checkout reminder for a specific booking
  // async sendReminderForBooking(booking) {
  //   try {
  //     const reminderKey = `${booking.id}-${booking.to_date}`;

  //     // Check if already sent today
  //     if (this.sentReminders.has(reminderKey)) {
  //       console.log(`⚠️ Reminder already sent for booking ${booking.id}`);
  //       return;
  //     }

  //     // Validate booking data
  //     if (!this.isValidBookingForReminder(booking)) {
  //       return;
  //     }

  //     // Get hotel admin email for CC
  //     const hotelAdminEmail = await this.getHotelAdminEmail(booking.hotel_id);
  //     const hotelDetails = await this.getHotelDetails(booking.hotel_id);

  //     const customerDetails = {
  //       name: booking.customer_name,
  //       email: booking.customer_email,
  //       phone: booking.customer_phone
  //     };

  //     if (customerDetails.email) {
  //       // Prepare hotel details with admin email
  //       const fullHotelDetails = {
  //         name: hotelDetails.name,
  //         email: hotelAdminEmail || process.env.EMAIL_FROM,
  //         phone: '',
  //         address: ''
  //       };

  //       await EmailService.sendCheckoutReminder(booking, fullHotelDetails, customerDetails);
  //       this.sentReminders.add(reminderKey);

  //       // Log reminder sent
  //       console.log(`✅ Checkout reminder sent for booking ${booking.id}`);
  //       console.log(`   Customer: ${customerDetails.name}`);
  //       console.log(`   To: ${customerDetails.email}`);
  //       console.log(`   Checkout: ${this.safeParseDate(booking.to_date, booking.to_time).toLocaleString()}`);
  //       if (hotelAdminEmail) {
  //         console.log(`   CC: ${hotelAdminEmail}`);
  //       }
  //     } else {
  //       console.log(`⚠️ No email for booking ${booking.id}`);
  //     }
  //   } catch (error) {
  //     console.error(`❌ Error sending reminder for booking ${booking.id}:`, error);
  //   }
  // }
// Update the sendReminderForBooking method in schedulerService.js

async sendReminderForBooking(booking) {
  try {
    const reminderKey = `${booking.id}-${booking.to_date}`;

    // Check if already sent today
    if (this.sentReminders.has(reminderKey)) {
      console.log(`⚠️ Reminder already sent for booking ${booking.id}`);
      return;
    }

    // Validate booking data
    if (!this.isValidBookingForReminder(booking)) {
      return;
    }

    // Get hotel admin email for CC
    const hotelAdminEmail = await this.getHotelAdminEmail(booking.hotel_id);
    const hotelDetails = await this.getHotelDetails(booking.hotel_id);

    const customerDetails = {
      name: booking.customer_name,
      email: booking.customer_email,
      phone: booking.customer_phone
    };

    // Send EMAIL reminder if email exists
    if (customerDetails.email) {
      const fullHotelDetails = {
        name: hotelDetails.name,
        email: hotelAdminEmail || process.env.EMAIL_FROM,
        phone: '',
        address: ''
      };

      await EmailService.sendCheckoutReminder(booking, fullHotelDetails, customerDetails);
      console.log(`✅ Email reminder sent for booking ${booking.id} to ${customerDetails.email}`);
    }

    // Send WHATSAPP reminder if phone exists
    if (customerDetails.phone) {
      await this.sendWhatsAppReminder(booking);
    }

    // Mark as sent
    this.sentReminders.add(reminderKey);

    console.log(`✅ Complete reminder sent for booking ${booking.id}`);

  } catch (error) {
    console.error(`❌ Error sending reminder for booking ${booking.id}:`, error);
  }
}
  // Calculate hours until checkout
  getHoursUntilCheckout(booking) {
    try {
      const checkoutDate = this.safeParseDate(booking.to_date, booking.to_time);
      if (!checkoutDate) return null;

      const now = new Date();
      const timeDiff = checkoutDate - now;
      return timeDiff / (1000 * 60 * 60); // Convert to hours
    } catch (error) {
      return null;
    }
  }

  // Schedule checkout reminders at exact times

async scheduleCheckoutReminders() {
  try {
    console.log('📅 Scheduling checkout reminders...');
    
    // Clear existing timeouts
    this.clearAllScheduledTimeouts();
    
    // Get all ACTIVE bookings with email (exclude past checkouts)
    const [bookings] = await pool.execute(`
      SELECT 
        b.id, b.hotel_id, b.room_id, b.customer_id,
        b.from_date, b.to_date, b.from_time, b.to_time,
        b.status, b.created_at,
        r.room_number,
        c.name as customer_name, 
        COALESCE(c.email, '') as customer_email, 
        COALESCE(c.phone, '') as customer_phone,
        h.name as hotel_name
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN hotels h ON b.hotel_id = h.id
      WHERE b.status = 'booked'
      AND b.to_date IS NOT NULL
      AND c.email IS NOT NULL
      AND c.email != ''
      AND b.to_date >= CURDATE()  
      ORDER BY b.to_date, b.to_time
    `);

    console.log(`📊 Found ${bookings.length} active bookings with email`);

    let scheduledCount = 0;
    let skippedCount = 0;
    let validCount = 0;
    
    // First, filter and validate bookings
    const validBookings = [];
    for (const booking of bookings) {
      // Debug: log booking data
      console.log(`📋 Booking ${booking.id}:`, {
        to_date: booking.to_date,
        to_time: booking.to_time,
        customer_email: booking.customer_email,
        hotel_name: booking.hotel_name
      });
      
      if (this.isValidBookingForReminder(booking)) {
        validBookings.push(booking);
        validCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`📊 Validation Summary:`);
    console.log(`   ✅ Valid: ${validCount} bookings`);
    console.log(`   ⚠️ Invalid/Skipped: ${skippedCount} bookings`);
    
    // Now schedule reminders for valid bookings
    for (const booking of validBookings) {
      try {
        const checkoutDate = this.safeParseDate(booking.to_date, booking.to_time);
        const now = new Date();
        
        // Calculate reminder time (1 hour before checkout)
        const reminderTime = new Date(checkoutDate.getTime() - (60 * 60 * 1000));
        
        // Calculate time until reminder
        const timeUntilReminder = reminderTime - now;
        const hoursUntilReminder = timeUntilReminder / (1000 * 60 * 60);
        
        // MAXIMUM TIMEOUT: Maximum safe setTimeout value (about 24.8 days)
        const MAX_TIMEOUT = 2147483647; // 2^31-1 milliseconds (24.8 days)
        
        // CASE 1: Reminder is in the future but within 24.8 days
        if (timeUntilReminder > 60000 && timeUntilReminder < MAX_TIMEOUT) {
          const timeoutId = setTimeout(() => {
            this.sendReminderForBooking(booking);
            this.scheduledTimeouts.delete(booking.id);
          }, timeUntilReminder);
          
          this.scheduledTimeouts.set(booking.id, timeoutId);
          
          scheduledCount++;
          console.log(`⏰ Scheduled reminder for booking ${booking.id}`);
          console.log(`   Customer: ${booking.customer_name}`);
          console.log(`   Checkout: ${checkoutDate.toLocaleString()}`);
          console.log(`   Reminder at: ${reminderTime.toLocaleString()}`);
          console.log(`   In: ${hoursUntilReminder.toFixed(1)} hours`);
        }
        // CASE 2: Reminder is more than 24.8 days away - will be caught by checkFutureBookings
        else if (timeUntilReminder >= MAX_TIMEOUT) {
          console.log(`📅 Booking ${booking.id} too far in future (${(hoursUntilReminder/24).toFixed(1)} days)`);
          console.log(`   Will be caught by future booking check`);
          skippedCount++;
        }
        // CASE 3: Checkout is within next hour but reminder time has passed
        else if (timeUntilReminder <= 60000 && checkoutDate > now) {
          const hoursUntilCheckout = this.getHoursUntilCheckout(booking);
          
          if (hoursUntilCheckout !== null && hoursUntilCheckout <= 1 && hoursUntilCheckout > 0) {
            console.log(`⚠️ Checkout within hour for booking ${booking.id} - sending now`);
            console.log(`   Hours until checkout: ${hoursUntilCheckout.toFixed(2)}`);
            await this.sendReminderForBooking(booking);
          }
        }
        // CASE 4: Checkout has passed
        else {
          console.log(`⏰ Skipping booking ${booking.id} - checkout in the past`);
          skippedCount++;
        }
        
      } catch (error) {
        console.error(`❌ Error scheduling for booking ${booking.id}:`, error);
        skippedCount++;
      }
    }
    
    console.log(`📊 Scheduling Summary:`);
    console.log(`   ✅ Scheduled: ${scheduledCount} reminders`);
    console.log(`   ⏰ Active Timeouts: ${this.scheduledTimeouts.size}`);
    console.log(`   📅 Too far future: ${validBookings.filter(b => {
      const checkout = this.safeParseDate(b.to_date, b.to_time);
      const now = new Date();
      const reminderTime = new Date(checkout.getTime() - (60 * 60 * 1000));
      return reminderTime - now >= 2147483647;
    }).length} bookings`);
    
  } catch (error) {
    console.error('❌ Error in scheduling:', error);
  }
}

  // Clear all scheduled timeouts
  clearAllScheduledTimeouts() {
    console.log('🧹 Clearing existing scheduled timeouts...');
    let clearedCount = 0;
    for (const [bookingId, timeoutId] of this.scheduledTimeouts) {
      clearTimeout(timeoutId);
      clearedCount++;
    }
    this.scheduledTimeouts.clear();
    console.log(`   Cleared ${clearedCount} timeouts`);
  }

  // Debug: Check database data for bookings
  async debugBookingData() {
    console.log('🔍 Debugging booking data...');

    const [bookings] = await pool.execute(`
      SELECT 
        b.id, b.to_date, b.to_time,
        c.name as customer_name, c.email as customer_email,
        h.name as hotel_name
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN hotels h ON b.hotel_id = h.id
      WHERE b.status = 'booked'
      LIMIT 10
    `);

    console.log('📋 First 10 bookings in database:');
    bookings.forEach((booking, index) => {
      console.log(`   ${index + 1}. Booking ${booking.id}:`);
      console.log(`      Date: ${booking.to_date}`);
      console.log(`      Time: ${booking.to_time}`);
      console.log(`      Customer: ${booking.customer_name}`);
      console.log(`      Email: ${booking.customer_email}`);
      console.log(`      Hotel: ${booking.hotel_name}`);

      // Test date parsing
      const parsedDate = this.safeParseDate(booking.to_date, booking.to_time);
      console.log(`      Parsed: ${parsedDate ? parsedDate.toLocaleString() : 'INVALID'}`);
    });
  }
 // Add this method to handle future bookings
async checkFutureBookings() {
  try {
    console.log('🔍 Checking future bookings for scheduling...');
    
    // Get bookings that are within 25-26 days from now (entering 24.8 day window)
    const [bookings] = await pool.execute(`
      SELECT 
        b.id, b.hotel_id, b.to_date, b.to_time, b.customer_id,
        b.from_date, b.from_time, b.status,
        r.room_number,
        c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
        h.name as hotel_name
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN hotels h ON b.hotel_id = h.id
      WHERE b.status = 'booked'
      AND b.to_date >= CURDATE() + INTERVAL 25 DAY
      AND b.to_date <= CURDATE() + INTERVAL 26 DAY
      AND c.email IS NOT NULL
      AND c.email != ''
    `);
    
    console.log(`📊 Found ${bookings.length} bookings entering 24.8-day window`);
    
    let scheduled = 0;
    for (const booking of bookings) {
      if (this.isValidBookingForReminder(booking)) {
        // Check if already scheduled
        if (!this.scheduledTimeouts.has(booking.id)) {
          await this.scheduleSingleBooking(booking);
          scheduled++;
        }
      }
    }
    
    console.log(`📊 Newly scheduled: ${scheduled} bookings`);
  } catch (error) {
    console.error('❌ Error checking future bookings:', error);
  }
}

  // Helper method to schedule a single booking
  async scheduleSingleBooking(booking) {
    try {
      const checkoutDate = this.safeParseDate(booking.to_date, booking.to_time);
      const now = new Date();

      // Calculate reminder time (1 hour before checkout)
      const reminderTime = new Date(checkoutDate.getTime() - (60 * 60 * 1000));

      // Calculate time until reminder
      const timeUntilReminder = reminderTime - now;

      // MAXIMUM TIMEOUT: Maximum safe setTimeout value (about 24.8 days)
      const MAX_TIMEOUT = 2147483647; // 2^31-1 milliseconds

      // Only schedule if within max timeout limit
      if (timeUntilReminder > 60000 && timeUntilReminder < MAX_TIMEOUT) {
        const timeoutId = setTimeout(() => {
          this.sendReminderForBooking(booking);
          this.scheduledTimeouts.delete(booking.id);
        }, timeUntilReminder);

        this.scheduledTimeouts.set(booking.id, timeoutId);

        const hoursUntilReminder = timeUntilReminder / (1000 * 60 * 60);
        console.log(`⏰ Scheduled reminder for booking ${booking.id}`);
        console.log(`   Customer: ${booking.customer_name}`);
        console.log(`   Checkout: ${checkoutDate.toLocaleString()}`);
        console.log(`   Reminder at: ${reminderTime.toLocaleString()}`);
        console.log(`   In: ${hoursUntilReminder.toFixed(1)} hours`);

        return true;
      } else if (timeUntilReminder >= MAX_TIMEOUT) {
        console.log(`📅 Booking ${booking.id} still too far in future (${(timeUntilReminder / (1000 * 60 * 60 * 24)).toFixed(1)} days)`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error scheduling booking ${booking.id}:`, error);
      return false;
    }
  }
  // Daily job to reschedule reminders
  // async dailyRescheduleJob() {
  //   console.log('📅 Running daily reschedule job...');

  //   // Clear old sent reminders
  //   this.sentReminders.clear();
  //   console.log('🧹 Cleared sent reminders cache');

  //   // Clear and reschedule all reminders
  //   this.clearAllScheduledTimeouts();
  //   await this.scheduleCheckoutReminders();
  // }
  async dailyRescheduleJob() {
    console.log('📅 Running daily reschedule job...');

    // Clear old sent reminders
    this.sentReminders.clear();
    console.log('🧹 Cleared sent reminders cache');

    // Clear and reschedule all reminders
    this.clearAllScheduledTimeouts();
    await this.scheduleCheckoutReminders();

    // Also check future bookings that might be entering the 24-day window
    await this.checkFutureBookings();
  }

  // Manually trigger a reminder check
  // Manually trigger a reminder check
  async triggerManualCheck() {
    console.log('🔍 Manual trigger - checking for immediate reminders...');

    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    // Get bookings checking out within next hour
    const [bookings] = await pool.execute(`
    SELECT 
      b.id, b.hotel_id, b.to_date, b.to_time, b.customer_id,
      r.room_number,
      c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
      h.name as hotel_name
    FROM bookings b
    LEFT JOIN rooms r ON b.room_id = r.id
    LEFT JOIN customers c ON b.customer_id = c.id
    LEFT JOIN hotels h ON b.hotel_id = h.id
    WHERE b.status = 'booked'
    AND b.to_date IS NOT NULL
    AND b.to_time IS NOT NULL
    AND c.email IS NOT NULL
    AND c.email != ''
    AND (
      (DATE(b.to_date) = CURDATE() AND 
       TIME(CONCAT(CURDATE(), ' ', b.to_time)) BETWEEN CURTIME() AND DATE_ADD(CURTIME(), INTERVAL 1 HOUR))
    )
    AND b.to_date > NOW() -- Ensure checkout is in the future
  `);

    console.log(`🔍 Found ${bookings.length} bookings checking out within 1 hour`);

    // Double-check each booking manually
    const validBookings = [];
    for (const booking of bookings) {
      const checkoutDate = this.safeParseDate(booking.to_date, booking.to_time);
      if (!checkoutDate) continue;

      const hoursUntilCheckout = (checkoutDate - now) / (1000 * 60 * 60);

      // Only send if checkout is within next hour AND reminder hasn't been sent
      if (hoursUntilCheckout > 0 && hoursUntilCheckout <= 1) {
        const reminderKey = `${booking.id}-${booking.to_date}`;
        if (!this.sentReminders.has(reminderKey)) {
          validBookings.push(booking);
        }
      }
    }

    console.log(`🔍 Actually valid for immediate sending: ${validBookings.length} bookings`);

    for (const booking of validBookings) {
      await this.sendReminderForBooking(booking);
    }
  }

  // Start the scheduler
  start() {
    console.log('🚀 Starting email scheduler...');
    console.log('📧 Reminders will be sent exactly 1 hour before checkout');
    console.log('⏰ Daily reschedule at midnight');

    // Run initial scheduling
    this.scheduleCheckoutReminders();

    // Debug: Show booking data
    setTimeout(() => {
      this.debugBookingData();
    }, 2000);

    // Schedule daily reschedule at midnight
    cron.schedule('0 0 * * *', () => {
      this.dailyRescheduleJob();
    });

    cron.schedule('0 */6 * * *', () => {
      console.log('🔍 Checking future bookings entering 24-day window...');
      this.checkFutureBookings();
    });

    // Optional: Backup check every 15 minutes (start after 5 minute delay)
    setTimeout(() => {
      cron.schedule('*/15 * * * *', () => {
        console.log('🔄 15-minute backup check...');
        this.triggerManualCheck();
      });
    }, 300000); // Start after 5 minutes

    console.log('✅ Email scheduler started successfully');
  }

  // In schedulerService.js - Add this method to send WhatsApp checkout reminder

async sendWhatsAppReminder(booking) {
  try {
    if (!booking.customer_phone) {
      console.log(`📱 No phone for WhatsApp reminder - booking ${booking.id}`);
      return;
    }

    const hotelDetails = await this.getHotelDetails(booking.hotel_id);
    
    const customerDetails = {
      name: booking.customer_name,
      phone: booking.customer_phone
    };

    // Use the new checkout reminder template
    const whatsappResult = await WhatsAppService.sendCheckoutReminder(
      booking,
      hotelDetails.name,
      customerDetails
    );

    if (whatsappResult.success) {
      console.log(`📱 WhatsApp reminder sent for booking ${booking.id}`);
    } else {
      console.log(`⚠️ WhatsApp reminder failed for booking ${booking.id}: ${whatsappResult.error}`);
    }

    return whatsappResult;
  } catch (error) {
    console.error(`❌ Error sending WhatsApp reminder:`, error);
  }
}
}



module.exports = new SchedulerService();