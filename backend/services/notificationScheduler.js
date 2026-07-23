const cron = require('node-cron');
const { pool } = require('../config/database');
const notificationEvents = require('./notificationEvents');

class NotificationScheduler {
  start() {
    console.log('🚀 Starting push notification scheduler (FCM business events)');

    setTimeout(() => {
      this.runPeriodicAlerts().catch((err) =>
        console.warn('Push periodic alerts error:', err.message)
      );
    }, 8000);

    cron.schedule('*/15 * * * *', () => {
      this.runPeriodicAlerts().catch((err) =>
        console.warn('Push periodic alerts error:', err.message)
      );
    });

    cron.schedule('0 8 * * *', () => {
      this.alertFunctionEventsToday().catch((err) =>
        console.warn('Push morning alerts error:', err.message)
      );
    });

    console.log('✅ Push notification scheduler started');
  }

  async runPeriodicAlerts() {
    if (!require('./fcmService').isConfigured()) return;

    await Promise.allSettled([
      this.alertPendingCheckouts(),
      this.alertCheckoutSoon(),
      this.alertFunctionEventsToday(),
    ]);
  }

  async alertPendingCheckouts() {
    const [rows] = await pool.execute(`
      SELECT b.id, b.hotel_id, b.to_date, b.to_time,
             r.room_number,
             c.name AS customer_name
      FROM bookings b
      LEFT JOIN rooms r ON r.id = b.room_id
      LEFT JOIN customers c ON c.id = b.customer_id
      WHERE (b.status = 'booked' OR b.status IS NULL OR b.status = '')
        AND b.to_date IS NOT NULL
        AND TIMESTAMP(b.to_date, COALESCE(b.to_time, '12:00:00')) <= NOW()
        AND TIMESTAMP(b.to_date, COALESCE(b.to_time, '12:00:00')) >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);

    for (const row of rows) {
      await notificationEvents.notifyPendingCheckout(row.hotel_id, {
        bookingId: row.id,
        customerName: row.customer_name,
        roomNumber: row.room_number,
      });
    }
  }

  async alertCheckoutSoon() {
    const [rows] = await pool.execute(`
      SELECT b.id, b.hotel_id, b.to_date, b.to_time,
             r.room_number,
             c.name AS customer_name,
             TIMESTAMPDIFF(
               MINUTE, NOW(),
               TIMESTAMP(b.to_date, COALESCE(b.to_time, '12:00:00'))
             ) AS minutes_left
      FROM bookings b
      LEFT JOIN rooms r ON r.id = b.room_id
      LEFT JOIN customers c ON c.id = b.customer_id
      WHERE (b.status = 'booked' OR b.status IS NULL OR b.status = '')
        AND TIMESTAMP(b.to_date, COALESCE(b.to_time, '12:00:00')) > NOW()
        AND TIMESTAMP(b.to_date, COALESCE(b.to_time, '12:00:00')) <= DATE_ADD(NOW(), INTERVAL 1 HOUR)
    `);

    for (const row of rows) {
      await notificationEvents.notifyCheckoutSoon(row.hotel_id, {
        bookingId: row.id,
        customerName: row.customer_name,
        roomNumber: row.room_number,
        minutesLeft: row.minutes_left,
      });
    }
  }

  async alertFunctionEventsToday() {
    const [rows] = await pool.execute(`
      SELECT fb.id, fb.hotel_id, fb.event_name, fb.customer_name,
             fr.name AS hall_name
      FROM function_bookings fb
      LEFT JOIN function_rooms fr ON fr.id = fb.function_room_id
      WHERE DATE(fb.booking_date) = CURDATE()
        AND (fb.status IS NULL OR fb.status NOT IN ('cancelled', 'completed'))
    `);

    for (const row of rows) {
      await notificationEvents.notifyFunctionEventToday(row.hotel_id, {
        bookingId: row.id,
        hallName: row.hall_name || row.event_name,
        customerName: row.customer_name,
      });
    }
  }
}

module.exports = new NotificationScheduler();
