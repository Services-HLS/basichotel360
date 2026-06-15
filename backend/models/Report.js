// const { pool } = require('../config/database');
// const exceljs = require('exceljs');

// class Report {
//   // Generate Daily Occupancy Report
//   static async getDailyOccupancy(hotelId, startDate, endDate) {
//     const query = `
//       SELECT
//         DATE(b.from_date) as date,
//         COUNT(DISTINCT r.id) as total_rooms,
//         COUNT(DISTINCT b.id) as occupied_rooms,
//         COUNT(DISTINCT CASE WHEN r.status = 'maintenance' THEN r.id END) as out_of_order,
//         COALESCE(SUM(b.total), 0) as total_revenue
//       FROM rooms r
//       LEFT JOIN bookings b ON r.id = b.room_id AND b.status = 'booked'
//       WHERE r.hotel_id = ?
//         AND (b.from_date BETWEEN ? AND ? OR b.from_date IS NULL)
//         AND (b.to_date BETWEEN ? AND ? OR b.to_date IS NULL)
//       GROUP BY DATE(b.from_date)
//       ORDER BY date
//     `;

//     const [rows] = await pool.execute(query, [hotelId, startDate, endDate, startDate, endDate]);
//     return rows.map(row => ({
//       ...row,
//       occupancy_percentage: row.total_rooms > 0 ? (row.occupied_rooms / row.total_rooms) * 100 : 0,
//       avg_revenue_per_room: row.occupied_rooms > 0 ? row.total_revenue / row.occupied_rooms : 0
//     }));
//   }

//   // Generate Housekeeping Report
//   static async getHousekeeping(hotelId, date) {
//     const query = `
//       SELECT
//         r.room_number,
//         CASE
//           WHEN b.status = 'booked' AND ? BETWEEN b.from_date AND b.to_date THEN 'Occupied'
//           WHEN r.status = 'maintenance' THEN 'Maintenance'
//           ELSE 'Clean'
//         END as status,
//         b.customer_name,
//         b.special_requests as remarks
//       FROM rooms r
//       LEFT JOIN bookings b ON r.id = b.room_id
//         AND b.status = 'booked'
//         AND ? BETWEEN b.from_date AND b.to_date
//       WHERE r.hotel_id = ?
//       ORDER BY r.room_number
//     `;

//     const [rows] = await pool.execute(query, [date, date, hotelId]);
//     return rows;
//   }

//   // Generate Daily Sales Report
//   static async getDailySales(hotelId, date) {
//     const query = `
//       SELECT
//         DATE(b.created_at) as date,
//         r.room_number,
//         c.name as customer_name,
//         c.phone as mobile_no,
//         b.payment_method,
//         b.amount as room_cost,
//         b.gst,
//         b.total as total_amount
//       FROM bookings b
//       LEFT JOIN rooms r ON b.room_id = r.id
//       LEFT JOIN customers c ON b.customer_id = c.id
//       WHERE b.hotel_id = ?
//         AND DATE(b.created_at) = ?
//         AND b.status = 'booked'
//       ORDER BY b.created_at DESC
//     `;

//     const [rows] = await pool.execute(query, [hotelId, date]);
//     return rows;
//   }

//   // Generate Check In/Check Out Report
//   static async getCheckInCheckOut(hotelId, startDate, endDate) {
//     const query = `
//       SELECT
//         b.from_date as check_in_date,
//         b.to_date as check_out_date,
//         r.room_number,
//         c.name as customer_name,
//         c.phone as mobile_no,
//         b.guests as no_of_persons,
//         b.amount as room_cost,
//         b.gst,
//         b.total
//       FROM bookings b
//       LEFT JOIN rooms r ON b.room_id = r.id
//       LEFT JOIN customers c ON b.customer_id = c.id
//       WHERE b.hotel_id = ?
//         AND ((b.from_date BETWEEN ? AND ?) OR (b.to_date BETWEEN ? AND ?))
//         AND b.status = 'booked'
//       ORDER BY b.from_date
//     `;

//     const [rows] = await pool.execute(query, [hotelId, startDate, endDate, startDate, endDate]);
//     return rows;
//   }

//   // Generate Blocking Report
//   static async getBlocking(hotelId, startDate, endDate) {
//     const query = `
//       SELECT
//         b.from_date as block_from_date,
//         b.to_date as block_to_date,
//         r.room_number,
//         COALESCE(c.name, 'Blocked') as customer_name,
//         COALESCE(c.phone, '') as mobile_no,
//         b.guests as no_of_persons
//       FROM bookings b
//       LEFT JOIN rooms r ON b.room_id = r.id
//       LEFT JOIN customers c ON b.customer_id = c.id
//       WHERE b.hotel_id = ?
//         AND b.status = 'blocked'
//         AND ((b.from_date BETWEEN ? AND ?) OR (b.to_date BETWEEN ? AND ?))
//       ORDER BY b.from_date
//     `;

//     const [rows] = await pool.execute(query, [hotelId, startDate, endDate, startDate, endDate]);
//     return rows;
//   }

//   // Generate Expenses Report
//   static async getExpenses(hotelId, startDate, endDate) {
//     const query = `
//       SELECT
//         e.expense_date as date,
//         e.category as expense_category,
//         e.description,
//         e.amount
//       FROM expenses e
//       WHERE e.hotel_id = ?
//         AND e.expense_date BETWEEN ? AND ?
//       ORDER BY e.expense_date DESC
//     `;

//     const [rows] = await pool.execute(query, [hotelId, startDate, endDate]);
//     return rows;
//   }

//   // Generate Salaries Report
//   static async getSalaries(hotelId, month, year) {
//     const query = `
//       SELECT
//         s.payment_date as date,
//         DATE_FORMAT(s.salary_month, '%M %Y') as month_year,
//         s.employee_name,
//         s.net_salary as salary_per_month,
//         s.status
//       FROM salaries s
//       WHERE s.hotel_id = ?
//         AND YEAR(s.salary_month) = ?
//         AND MONTH(s.salary_month) = ?
//       ORDER BY s.payment_date DESC
//     `;

//     const [rows] = await pool.execute(query, [hotelId, year, month]);
//     return rows;
//   }

//   // Generate P&L Summary Report
//   static async getPnLSummary(hotelId, startDate, endDate) {
//     const query = `
//       SELECT
//         DATE_FORMAT(date_range.month_year, '%Y-%m') as month,
//         COALESCE(rev.total_revenue, 0) as total_revenue,
//         COALESCE(exp.total_expenses, 0) as total_expenses,
//         COALESCE(sal.total_salaries, 0) as total_salaries,
//         (COALESCE(rev.total_revenue, 0) - COALESCE(exp.total_expenses, 0) - COALESCE(sal.total_salaries, 0)) as net_profit
//       FROM (
//         SELECT DISTINCT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL n MONTH), '%Y-%m-01') as month_year
//         FROM (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11) months
//         WHERE DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL n MONTH), '%Y-%m-01') >= ?
//       ) date_range
//       LEFT JOIN (
//         SELECT
//           DATE_FORMAT(b.created_at, '%Y-%m-01') as month,
//           SUM(b.total) as total_revenue
//         FROM bookings b
//         WHERE b.hotel_id = ? AND b.status = 'booked'
//         GROUP BY DATE_FORMAT(b.created_at, '%Y-%m-01')
//       ) rev ON date_range.month_year = rev.month
//       LEFT JOIN (
//         SELECT
//           DATE_FORMAT(e.expense_date, '%Y-%m-01') as month,
//           SUM(e.amount) as total_expenses
//         FROM expenses e
//         WHERE e.hotel_id = ?
//         GROUP BY DATE_FORMAT(e.expense_date, '%Y-%m-01')
//       ) exp ON date_range.month_year = exp.month
//       LEFT JOIN (
//         SELECT
//           DATE_FORMAT(s.salary_month, '%Y-%m-01') as month,
//           SUM(s.net_salary) as total_salaries
//         FROM salaries s
//         WHERE s.hotel_id = ?
//         GROUP BY DATE_FORMAT(s.salary_month, '%Y-%m-01')
//       ) sal ON date_range.month_year = sal.month
//       ORDER BY date_range.month_year DESC
//     `;

//     const [rows] = await pool.execute(query, [startDate, hotelId, hotelId, hotelId]);
//     return rows;
//   }

//   // Export to Excel
//   static async exportToExcel(hotelId, reportType, params) {
//     const workbook = new exceljs.Workbook();

//     let data;
//     let sheetName;

//     switch(reportType) {
//       case 'daily_occupancy':
//         data = await this.getDailyOccupancy(hotelId, params.startDate, params.endDate);
//         sheetName = 'Daily Occupancy';
//         break;
//       case 'housekeeping':
//         data = await this.getHousekeeping(hotelId, params.date);
//         sheetName = 'Housekeeping';
//         break;
//       case 'daily_sales':
//         data = await this.getDailySales(hotelId, params.date);
//         sheetName = 'Daily Sales';
//         break;
//       case 'check_in_out':
//         data = await this.getCheckInCheckOut(hotelId, params.startDate, params.endDate);
//         sheetName = 'Check In Check Out';
//         break;
//       case 'blocking':
//         data = await this.getBlocking(hotelId, params.startDate, params.endDate);
//         sheetName = 'Blocking';
//         break;
//       case 'expenses':
//         data = await this.getExpenses(hotelId, params.startDate, params.endDate);
//         sheetName = 'Expenses';
//         break;
//       case 'salaries':
//         data = await this.getSalaries(hotelId, params.month, params.year);
//         sheetName = 'Salary\'s';
//         break;
//       case 'pnl_summary':
//         data = await this.getPnLSummary(hotelId, params.startDate, params.endDate);
//         sheetName = 'P&L Summary';
//         break;
//       default:
//         throw new Error('Invalid report type');
//     }

//     const worksheet = workbook.addWorksheet(sheetName);

//     // Add headers
//     if (data.length > 0) {
//       const headers = Object.keys(data[0]);
//       worksheet.addRow(headers);

//       // Add data
//       data.forEach(item => {
//         const row = headers.map(header => item[header]);
//         worksheet.addRow(row);
//       });

//       // Auto-fit columns
//       worksheet.columns.forEach(column => {
//         let maxLength = 0;
//         column.eachCell({ includeEmpty: true }, cell => {
//           const columnLength = cell.value ? cell.value.toString().length : 10;
//           if (columnLength > maxLength) {
//             maxLength = columnLength;
//           }
//         });
//         column.width = maxLength < 10 ? 10 : maxLength + 2;
//       });
//     }

//     // Generate buffer
//     const buffer = await workbook.xlsx.writeBuffer();
//     return buffer;
//   }

//   // Get report summary
//   static async getReportSummary(hotelId) {
//     const today = new Date().toISOString().split('T')[0];
//     const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

//     const queries = {
//       today_occupancy: await this.getDailyOccupancy(hotelId, today, today),
//       today_sales: await this.getDailySales(hotelId, today),
//       monthly_expenses: await this.getExpenses(hotelId, firstDayOfMonth, today),
//       monthly_salaries: await this.getSalaries(hotelId, new Date().getMonth() + 1, new Date().getFullYear()),
//       pnl_summary: await this.getPnLSummary(hotelId, firstDayOfMonth, today)
//     };

//     return {
//       today_occupancy: queries.today_occupancy.length > 0 ? queries.today_occupancy[0] : null,
//       today_sales_count: queries.today_sales.length,
//       today_sales_total: queries.today_sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0),
//       monthly_expenses_total: queries.monthly_expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0),
//       monthly_salaries_total: queries.monthly_salaries.reduce((sum, sal) => sum + (sal.salary_per_month || 0), 0),
//       monthly_profit: queries.pnl_summary.length > 0 ? queries.pnl_summary[0].net_profit : 0
//     };
//   }
// }

// module.exports = Report;

const { pool } = require("../config/database");
const exceljs = require("exceljs");
const PDFDocument = require("pdfkit");
const fs = require("fs");

class Report {
  // Generate Daily Occupancy Report
  static async getDailyOccupancy(hotelId, startDate, endDate) {
    // 1. Get total rooms in hotel
    const [roomsCountResult] = await pool.execute(
      "SELECT COUNT(*) as total FROM rooms WHERE hotel_id = ?",
      [hotelId],
    );
    const totalRooms = roomsCountResult[0].total || 0;

    // 2. Get dates with check-in activity and calculate stats
    // Filtered by from_date as requested: "number of check_in(from_date) filter"
    const query = `
      SELECT 
        d.date,
        ? as "total rooms",
        COUNT(DISTINCT CASE WHEN b.from_date = d.date AND b.status = 'booked' THEN b.id END) as check_in,
        COUNT(DISTINCT CASE WHEN b.to_date = d.date AND b.status = 'booked' THEN b.id END) as check_out,
        COUNT(DISTINCT CASE WHEN b.status = 'booked' AND d.date >= b.from_date AND d.date < b.to_date THEN r.id END) as booked,
        COUNT(DISTINCT CASE WHEN b.status = 'blocked' AND d.date >= b.from_date AND d.date < b.to_date THEN r.id END) as blocked
      FROM (
        SELECT DISTINCT from_date as date FROM bookings 
        WHERE hotel_id = ? AND from_date BETWEEN ? AND ?
      ) as d
      CROSS JOIN rooms r ON r.hotel_id = ?
      LEFT JOIN bookings b ON r.id = b.room_id AND b.hotel_id = ?
        AND (
          b.from_date = d.date OR 
          b.to_date = d.date OR 
          (d.date >= b.from_date AND d.date < b.to_date)
        )
      GROUP BY d.date
      ORDER BY d.date
    `;

    const [rows] = await pool.execute(query, [
      totalRooms,
      hotelId,
      startDate,
      endDate,
      hotelId,
      hotelId,
    ]);

    return rows.map((row) => ({
      date: row.date,
      total_rooms: row["total rooms"],
      booked: row.booked,
      blocked: row.blocked,
      check_in: row.check_in,
      check_out: row.check_out,
    }));
  }

  // Generate Housekeeping Report - CORRECTED
  static async getHousekeeping(hotelId, date) {
    const query = `
      SELECT 
        r.room_number,
        CASE 
          WHEN b.status = 'booked' AND ? BETWEEN b.from_date AND b.to_date THEN 'Occupied'
          WHEN r.status = 'maintenance' THEN 'Maintenance'
          ELSE 'Clean'
        END as status,
        COALESCE(c.name, 'N/A') as customer_name,
        COALESCE(b.special_requests, '') as remarks
      FROM rooms r
      LEFT JOIN bookings b ON r.id = b.room_id 
        AND b.status = 'booked'
        AND ? BETWEEN b.from_date AND b.to_date
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE r.hotel_id = ?
      ORDER BY r.room_number
    `;

    const [rows] = await pool.execute(query, [date, date, hotelId]);
    return rows;
  }

  // Generate Daily Sales Report - Split into Room Bookings + Advance Bookings
  static async getDailySales(hotelId, date) {
    // ── Room Bookings ─────────────────────────────────────────────────────
    const bookingsQuery = `
      SELECT 
        DATE(b.created_at) as date,
        b.id as booking_id,
        r.room_number,
        c.name as customer_name,
        c.phone as mobile_no,
        b.payment_method,
        b.amount as room_cost,
        b.gst,
        0 as other_expenses,
        b.total as total_amount,
        b.payment_status,
        b.invoice_number
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE b.hotel_id = ?
        AND DATE(b.created_at) = ?
        AND b.status = 'booked'
      ORDER BY b.created_at DESC
    `;

    // ── Advance Bookings ──────────────────────────────────────────────────
    const advanceQuery = `
      SELECT 
        DATE(ab.created_at) as date,
        ab.id as booking_id,
        r.room_number,
        c.name as customer_name,
        c.phone as mobile_no,
        ab.payment_method,
        ab.amount as room_cost,
        (COALESCE(ab.cgst,0) + COALESCE(ab.sgst,0) + COALESCE(ab.igst,0)) as gst,
        COALESCE(ab.other_expenses, 0) as other_expenses,
        ab.total as total_amount,
        ab.payment_status,
        ab.invoice_number,
        ab.advance_amount,
        ab.remaining_amount,
        ab.status as booking_status,
        ab.from_date,
        ab.to_date
      FROM advance_bookings ab
      LEFT JOIN rooms r ON ab.room_id = r.id
      LEFT JOIN customers c ON ab.customer_id = c.id
      WHERE ab.hotel_id = ?
        AND DATE(ab.created_at) = ?
        AND ab.status IN ('pending', 'confirmed')
      ORDER BY ab.created_at DESC
    `;

    // ── Function Bookings ─────────────────────────────────────────────────
    const functionQuery = `
      SELECT 
        DATE(fb.created_at) as date,
        fb.id as booking_id,
        fr.room_number,
        fb.customer_name,
        fb.customer_phone as mobile_no,
        fb.payment_method,
        fb.total_amount as room_cost,
        0 as gst,
        (fb.catering_charges + fb.decoration_charges + fb.other_charges) as other_expenses,
        fb.total_amount,
        fb.advance_paid,
        fb.balance_due,
        fb.payment_status,
        '' as invoice_number,
        fb.event_name,
        fb.booking_date,
        fb.has_room_bookings,
        fb.total_rooms_booked
      FROM function_bookings fb
      LEFT JOIN function_rooms fr ON fb.function_room_id = fr.id
      WHERE fb.hotel_id = ?
        AND DATE(fb.created_at) = ?
        AND fb.status IN ('confirmed','pending','completed')
      ORDER BY fb.created_at DESC;
    `;

    const [[bookings], [advanceBookings], [functionBookings]] =
      await Promise.all([
        pool.execute(bookingsQuery, [hotelId, date]),
        pool.execute(advanceQuery, [hotelId, date]),
        pool.execute(functionQuery, [hotelId, date]),
      ]);

    return { bookings, advanceBookings, functionBookings };
  }

  // Get Check-in/Check-out report (Combined Rooms + Functions)
  static async getCheckInCheckOut(hotelId, startDate, endDate) {
    const query = `
      (
        SELECT 
          b.from_date as check_in_date,
          b.to_date as check_out_date,
          r.room_number,
          c.name as customer_name,
          c.phone as mobile_no,
          b.guests as no_of_persons,
          b.amount as room_cost,
          b.gst,
          b.total,
          'Room' as booking_type
        FROM bookings b
        JOIN rooms r ON b.room_id = r.id
        LEFT JOIN customers c ON b.customer_id = c.id
        WHERE b.hotel_id = ?
          AND b.status = 'booked'
          AND ((b.from_date BETWEEN ? AND ?) OR (b.to_date BETWEEN ? AND ?))
      )
      UNION ALL
      (
        SELECT 
          fb.booking_date as check_in_date,
          fb.booking_date as check_out_date,
          CONCAT(fr.room_number, ' (Hall)') as room_number,
          fb.customer_name,
          fb.customer_phone as mobile_no,
          fb.guests_expected as no_of_persons,
          fb.total_amount as room_cost,
          COALESCE(fb.gst, 0) as gst,
          fb.total_amount as total,
          'Function Hall' as booking_type
        FROM function_bookings fb
        JOIN function_rooms fr ON fb.function_room_id = fr.id
        WHERE fb.hotel_id = ?
          AND fb.status IN ('confirmed', 'completed')
          AND fb.booking_date BETWEEN ? AND ?
      )
      ORDER BY check_in_date ASC
    `;

    const [rows] = await pool.execute(query, [
      hotelId, startDate, endDate, startDate, endDate,
      hotelId, startDate, endDate
    ]);
    return rows;
  }

  // Generate Advance Bookings Report
  static async getAdvanceBookings(hotelId, startDate, endDate) {
    const query = `
      SELECT 
        DATE(ab.created_at) as date,
        r.room_number,
        ab.from_date as check_in,
        ab.to_date as check_out,
        ab.status
      FROM advance_bookings ab
      LEFT JOIN rooms r ON ab.room_id = r.id
      WHERE ab.hotel_id = ?
        AND DATE(ab.created_at) BETWEEN ? AND ?
      ORDER BY ab.created_at DESC
    `;

    const [rows] = await pool.execute(query, [hotelId, startDate, endDate]);
    return rows;
  }

  // Generate Blocking Report - CORRECTED
  static async getBlocking(hotelId, startDate, endDate) {
    const query = `
      SELECT 
        b.from_date as block_from_date,
        b.to_date as block_to_date,
        r.room_number,
        COALESCE(c.name, 'Blocked') as customer_name,
        COALESCE(c.phone, '') as mobile_no,
        b.guests as no_of_persons
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE b.hotel_id = ?
        AND b.status = 'blocked'
        AND ((b.from_date BETWEEN ? AND ?) OR (b.to_date BETWEEN ? AND ?))
      ORDER BY b.from_date
    `;

    const [rows] = await pool.execute(query, [
      hotelId,
      startDate,
      endDate,
      startDate,
      endDate,
    ]);
    return rows;
  }

  // Generate Expenses Report
  static async getExpenses(hotelId, startDate, endDate) {
    const query = `
      SELECT 
        e.expense_date as date,
        e.category as expense_category,
        e.description,
        e.amount
      FROM expenses e
      WHERE e.hotel_id = ?
        AND e.expense_date BETWEEN ? AND ?
      ORDER BY e.expense_date DESC
    `;

    const [rows] = await pool.execute(query, [hotelId, startDate, endDate]);
    return rows;
  }

  // Generate Salaries Report - CORRECTED
  // static async getSalaries(hotelId, month, year) {
  //   const query = `
  //     SELECT
  //       s.payment_date as date,
  //       DATE_FORMAT(s.salary_month, '%M %Y') as month_year,
  //       s.employee_name,
  //       s.net_salary as salary_per_month,
  //       s.status
  //     FROM salaries s
  //     WHERE s.hotel_id = ?
  //       AND YEAR(s.salary_month) = ?
  //       AND MONTH(s.salary_month) = ?
  //     ORDER BY s.payment_date DESC
  //   `;

  //   const [rows] = await pool.execute(query, [hotelId, year, month]);
  //   return rows;
  // }

  // Generate Salaries Report - CORRECTED VERSION
  static async getSalaries(hotelId, month, year) {
    const query = `
    SELECT 
      s.payment_date as date,
      COALESCE(DATE_FORMAT(s.salary_month, '%M %Y'), 'Not Specified') as month_year,
      s.employee_name,
      s.basic_salary,
      s.allowances,
      s.deductions,
      s.net_salary as salary_per_month,
      s.status,
      s.payment_method,
      s.remarks
    FROM salaries s
    WHERE s.hotel_id = ?
      AND (
        (s.salary_month IS NOT NULL AND s.salary_month != '0000-00-00' 
          AND YEAR(s.salary_month) = ? AND MONTH(s.salary_month) = ?)
        OR 
        ((s.salary_month IS NULL OR s.salary_month = '0000-00-00') 
          AND YEAR(s.payment_date) = ? AND MONTH(s.payment_date) = ?)
      )
    ORDER BY s.payment_date DESC, s.created_at DESC
  `;

    const [rows] = await pool.execute(query, [hotelId, year, month, year, month]);
    return rows;
  }

  // Generate P&L Summary Report - UNIFIED VERSION (Combined Cash/Online)
  static async getPnLSummary(hotelId, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startMonth = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0);

    const startStr = startMonth.toISOString().split("T")[0];
    const endStr = endMonth.toISOString().split("T")[0];

    // ── 1. Unified Monthly CASH Revenue ─────────────────────────────────────
    const [cashRevRows] = await pool.execute(`
      SELECT 
       DATE_FORMAT(cash_date, '%Y-%m') as month,
       SUM(cash_amount) AS total_amount
        FROM (
            -- Advance Bookings
            SELECT DATE(created_at) as cash_date, advance_amount as cash_amount 
            FROM advance_bookings
            WHERE hotel_id = ? AND payment_method = 'cash'
           
            UNION ALL

            -- Collections
            SELECT collection_date as cash_date, amount as cash_amount 
            FROM collections
            WHERE hotel_id = ? AND payment_mode = 'cash'

            UNION ALL

            -- Function Booking Amounts (Transaction Amount)
            SELECT DATE(created_at) as cash_date, transaction_amount as cash_amount 
            FROM function_booking_amounts
            WHERE hotel_id = ? AND payment_method = 'cash'

            UNION ALL

            -- Function Booking Refunds (Subtracting Refund Amount)
            SELECT DATE(created_at) as cash_date, -refund_amount as cash_amount 
            FROM booking_refunds
            WHERE hotel_id = ? AND refund_method = 'cash' AND refund_status = 'completed'
        ) AS cash_summary
        WHERE cash_date BETWEEN ? AND ?
        GROUP BY month
    `, [hotelId, hotelId, hotelId, hotelId, startStr, endStr]);

    // ── 2. Unified Monthly ONLINE Revenue ───────────────────────────────────
    const [onlineRevRows] = await pool.execute(`
      SELECT 
        DATE_FORMAT(online_date, '%Y-%m') as month,
        SUM(online_amount) as total_amount
      FROM (
          -- Transactions (Gateway)
          SELECT DATE(created_at) as online_date, amount as online_amount 
          FROM transactions WHERE hotel_id = ? AND payment_method <> 'cash'
          
          UNION ALL

          -- Function Payments (Online)
          SELECT DATE(created_at) as online_date, transaction_amount as online_amount 
          FROM function_booking_amounts WHERE hotel_id = ? AND payment_method = 'online'

          UNION ALL

          -- Refunds (Online - Negative)
          SELECT DATE(created_at) as online_date, -refund_amount as online_amount 
          FROM booking_refunds 
          WHERE hotel_id = ? AND refund_method = 'online' AND refund_status = 'completed'
      ) AS online_summary
      WHERE online_date BETWEEN ? AND ?
      GROUP BY month
    `, [hotelId, hotelId, hotelId, startStr, endStr]);

    // ── 3. Expenses ─────────────────────────────────────────────────────────
    const [expRows] = await pool.execute(`
      SELECT 
        DATE_FORMAT(expense_date, '%Y-%m') as month,
        SUM(amount) as total_expenses
      FROM expenses
      WHERE hotel_id = ? AND expense_date BETWEEN ? AND ?
      GROUP BY month
    `, [hotelId, startStr, endStr]);

    // ── 4. Salaries ─────────────────────────────────────────────────────────
    const [salRows] = await pool.execute(`
      SELECT 
        DATE_FORMAT(CASE 
          WHEN salary_month IS NOT NULL AND salary_month != '0000-00-00' THEN salary_month 
          ELSE payment_date 
        END, '%Y-%m') as month,
        SUM(net_salary) as total_salaries
      FROM salaries
      WHERE hotel_id = ? AND (
        (salary_month IS NOT NULL AND salary_month != '0000-00-00' AND salary_month BETWEEN ? AND ?)
        OR 
        ((salary_month IS NULL OR salary_month = '0000-00-00') AND payment_date BETWEEN ? AND ?)
      )
      GROUP BY month
    `, [hotelId, startStr, endStr, startStr, endStr]);

    // Build month range list
    const months = [];
    let cursor = new Date(startMonth);
    while (cursor <= endMonth) {
      months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
      cursor.setMonth(cursor.getMonth() + 1);
    }

    // Helper maps
    const cashMap = Object.fromEntries(cashRevRows.map(r => [r.month, parseFloat(r.total_amount) || 0]));
    const onlineMap = Object.fromEntries(onlineRevRows.map(r => [r.month, parseFloat(r.total_amount) || 0]));
    const expMap = Object.fromEntries(expRows.map(r => [r.month, parseFloat(r.total_expenses) || 0]));
    const salMap = Object.fromEntries(salRows.map(r => [r.month, parseFloat(r.total_salaries) || 0]));

    return months.reverse().map(month => {
      const cash = cashMap[month] || 0;
      const online = onlineMap[month] || 0;
      const totalRevenue = cash + online;
      const totalExpenses = expMap[month] || 0;
      const totalSalaries = salMap[month] || 0;

      return {
        month,
        cash_revenue: cash,
        online_revenue: online,
        total_amount: totalRevenue,
        total_expenses: totalExpenses,
        total_salaries: totalSalaries,
        net_profit: totalRevenue - totalExpenses - totalSalaries
      };
    });
  }

  // static async getReportSummary(hotelId, startDate, endDate) {
  //   try {
  //     // Validate dates
  //     if (!startDate || !endDate) {
  //       throw new Error('Start date and end date are required');
  //     }

  //     // Get occupancy for the LAST DATE in range (represents current occupancy)
  //     const [occupancy] = await pool.execute(`
  //       SELECT
  //         COUNT(DISTINCT r.id) as total_rooms,
  //         COUNT(DISTINCT CASE WHEN b.id IS NOT NULL THEN b.id END) as occupied_rooms,
  //         COUNT(DISTINCT CASE WHEN r.status = 'maintenance' THEN r.id END) as out_of_order
  //       FROM rooms r
  //       LEFT JOIN bookings b ON r.id = b.room_id
  //         AND b.status = 'booked'
  //         AND ? BETWEEN b.from_date AND b.to_date
  //       WHERE r.hotel_id = ?
  //     `, [endDate, hotelId]);

  //     // Get revenue for date range
  //     const [sales] = await pool.execute(`
  //       SELECT
  //         COUNT(*) as count,
  //         SUM(b.total) as total
  //       FROM bookings b
  //       WHERE b.hotel_id = ?
  //         AND b.status = 'booked'
  //         AND DATE(b.created_at) BETWEEN ? AND ?
  //     `, [hotelId, startDate, endDate]);

  //     // Get expenses for date range
  //     const [expenses] = await pool.execute(`
  //       SELECT
  //         SUM(e.amount) as total
  //       FROM expenses e
  //       WHERE e.hotel_id = ?
  //         AND e.expense_date BETWEEN ? AND ?
  //     `, [hotelId, startDate, endDate]);

  //     // Get salaries for date range
  //     const [salaries] = await pool.execute(`
  //       SELECT
  //         SUM(s.net_salary) as total
  //       FROM salaries s
  //       WHERE s.hotel_id = ?
  //         AND (
  //           (s.payment_date BETWEEN ? AND ?)
  //           OR (s.salary_month BETWEEN ? AND ?)
  //         )
  //     `, [hotelId, startDate, endDate, startDate, endDate]);

  //     // Get payment collections for date range
  //     const [collections] = await pool.execute(`
  //       SELECT
  //         b.payment_method,
  //         SUM(b.total) as total_amount
  //       FROM bookings b
  //       WHERE b.hotel_id = ?
  //         AND b.status = 'booked'
  //         AND DATE(b.created_at) BETWEEN ? AND ?
  //         AND b.payment_method IN ('cash', 'online')
  //       GROUP BY b.payment_method
  //     `, [hotelId, startDate, endDate]);

  //     // Process collections data
  //     let cashCollection = 0;
  //     let onlineCollection = 0;

  //     collections.forEach(row => {
  //       if (row.payment_method === 'cash') {
  //         cashCollection = parseFloat(row.total_amount) || 0;
  //       } else if (row.payment_method === 'online') {
  //         onlineCollection = parseFloat(row.total_amount) || 0;
  //       }
  //     });

  //     const totalCollection = cashCollection + onlineCollection;
  //     const salesTotal = parseFloat(sales[0]?.total) || 0;
  //     const expensesTotal = parseFloat(expenses[0]?.total) || 0;
  //     const salariesTotal = parseFloat(salaries[0]?.total) || 0;
  //     const profit = salesTotal - expensesTotal - salariesTotal;

  //     return {
  //       occupancy: occupancy[0] || {},
  //       sales_count: sales[0]?.count || 0,
  //       sales_total: salesTotal,
  //       expenses_total: expensesTotal,
  //       salaries_total: salariesTotal,
  //       profit: profit,
  //       cash_collection: cashCollection,
  //       online_collection: onlineCollection,
  //       total_collection: totalCollection,
  //       date_range: {
  //         start: startDate,
  //         end: endDate
  //       }
  //     };
  //   } catch (error) {
  //     console.error('Error in getReportSummary:', error);
  //     throw error;
  //   }
  // }

  // Export to Excel

  // Report.js - Updated getReportSummary method
  // static async getReportSummary(hotelId, startDate, endDate) {
  //   try {
  //     // Validate dates
  //     if (!startDate || !endDate) {
  //       throw new Error('Start date and end date are required');
  //     }

  //     // Get occupancy for the LAST DATE in range (represents current occupancy)
  //     const [occupancy] = await pool.execute(`
  //       SELECT
  //         COUNT(DISTINCT r.id) as total_rooms,
  //         COUNT(DISTINCT CASE WHEN b.id IS NOT NULL THEN b.id END) as occupied_rooms,
  //         COUNT(DISTINCT CASE WHEN r.status = 'maintenance' THEN r.id END) as out_of_order
  //       FROM rooms r
  //       LEFT JOIN bookings b ON r.id = b.room_id
  //         AND b.status = 'booked'
  //         AND ? BETWEEN b.from_date AND b.to_date
  //       WHERE r.hotel_id = ?
  //     `, [endDate, hotelId]);

  //     // Get collections for date range (Cash + Online)
  //     const [collections] = await pool.execute(`
  //       SELECT
  //         b.payment_method,
  //         SUM(b.total) as total_amount
  //       FROM bookings b
  //       WHERE b.hotel_id = ?
  //         AND b.status = 'booked'
  //         AND DATE(b.created_at) BETWEEN ? AND ?
  //         AND b.payment_method IN ('cash', 'online')
  //       GROUP BY b.payment_method
  //     `, [hotelId, startDate, endDate]);

  //     // Get expenses for date range
  //     const [expenses] = await pool.execute(`
  //       SELECT
  //         SUM(e.amount) as total
  //       FROM expenses e
  //       WHERE e.hotel_id = ?
  //         AND e.expense_date BETWEEN ? AND ?
  //     `, [hotelId, startDate, endDate]);

  //     // Get salaries for date range
  //     const [salaries] = await pool.execute(`
  //       SELECT
  //         SUM(s.net_salary) as total
  //       FROM salaries s
  //       WHERE s.hotel_id = ?
  //         AND (
  //           (s.payment_date BETWEEN ? AND ?)
  //           OR (s.salary_month BETWEEN ? AND ?)
  //         )
  //         AND s.status = 'paid'
  //     `, [hotelId, startDate, endDate, startDate, endDate]);

  //     // Process collections data
  //     let cashCollection = 0;
  //     let onlineCollection = 0;

  //     collections.forEach(row => {
  //       if (row.payment_method === 'cash') {
  //         cashCollection = parseFloat(row.total_amount) || 0;
  //       } else if (row.payment_method === 'online') {
  //         onlineCollection = parseFloat(row.total_amount) || 0;
  //       }
  //     });

  //     const totalCollection = cashCollection + onlineCollection;
  //     const expensesTotal = parseFloat(expenses[0]?.total) || 0;
  //     const salariesTotal = parseFloat(salaries[0]?.total) || 0;
  //     const totalExpenses = expensesTotal + salariesTotal;
  //     const netProfit = totalCollection - totalExpenses;

  //     return {
  //       occupancy: occupancy[0] || {},
  //       cash_collection: cashCollection,
  //       online_collection: onlineCollection,
  //       total_collection: totalCollection,
  //       expenses: expensesTotal,
  //       salaries: salariesTotal,
  //       total_expenses: totalExpenses,
  //       net_profit: netProfit,
  //       date_range: {
  //         start: startDate,
  //         end: endDate
  //       }
  //     };
  //   } catch (error) {
  //     console.error('Error in getReportSummary:', error);
  //     throw error;
  //   }
  // }

  static async exportToExcel(hotelId, reportType, params) {
    const workbook = new exceljs.Workbook();

    let data;
    let sheetName;

    switch (reportType) {
      case "daily_occupancy":
        data = await this.getDailyOccupancy(
          hotelId,
          params.startDate,
          params.endDate,
        );
        sheetName = "Daily Occupancy";
        break;
      case "housekeeping":
        data = await this.getHousekeeping(hotelId, params.date);
        sheetName = "Housekeeping";
        break;
      case "daily_sales":
        data = await this.getDailySales(hotelId, params.date);
        sheetName = "Daily Sales";
        break;
      case "check_in_out":
        data = await this.getCheckInCheckOut(
          hotelId,
          params.startDate,
          params.endDate,
        );
        sheetName = "Check In Check Out";
        break;
      case "blocking":
        data = await this.getBlocking(
          hotelId,
          params.startDate,
          params.endDate,
        );
        sheetName = "Blocking";
        break;
      case "expenses":
        data = await this.getExpenses(
          hotelId,
          params.startDate,
          params.endDate,
        );
        sheetName = "Expenses";
        break;
      case "salaries":
        data = await this.getSalaries(hotelId, params.month, params.year);
        sheetName = "Salary's";
        break;
      case "pnl_summary":
        data = await this.getPnLSummary(
          hotelId,
          params.startDate,
          params.endDate,
        );
        sheetName = "P&L Summary";
        break;
      case "police_report":
        // Check if dates are provided, if not use default dates
        const policeStartDate =
          params.startDate || new Date().toISOString().split("T")[0];
        const policeEndDate =
          params.endDate || new Date().toISOString().split("T")[0];

        data = await this.getPoliceReport(
          hotelId,
          policeStartDate,
          policeEndDate,
        );
        sheetName = "Police Report";
        break;
      case "advance_booking":
        data = await this.getAdvanceBookings(
          hotelId,
          params.startDate,
          params.endDate,
        );
        sheetName = "Advance Booking";
        break;
      default:
        throw new Error("Invalid report type");
    }

    const worksheet = workbook.addWorksheet(sheetName);

    // Add headers
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      worksheet.addRow(
        headers.map((header) =>
          header
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
        ),
      );

      // Add data
      data.forEach((item) => {
        const row = headers.map((header) => item[header]);
        worksheet.addRow(row);
      });

      // Auto-fit columns
      worksheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = maxLength < 10 ? 10 : maxLength + 2;
      });
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  // Generate Payment Collections Report
  // - CASH: from bookings table (payment_method = 'cash')
  // - ONLINE: from transactions table (status = 'success', booking_id IS NOT NULL)
  static async getPaymentCollections(hotelId, startDate, endDate) {
    // Cash: booked rooms paid by cash
    const [cashRows] = await pool.execute(
      `
      SELECT SUM(total) as total_amount
      FROM bookings
      WHERE hotel_id = ?
        AND status = 'booked'
        AND payment_method = 'cash'
        AND DATE(created_at) BETWEEN ? AND ?
    `,
      [hotelId, startDate, endDate],
    );

    // Online: successful transactions linked to room bookings
    const [onlineRows] = await pool.execute(
      `
      SELECT SUM(amount) as total_amount
      FROM transactions
      WHERE hotel_id = ?
        AND status = 'success'
        AND booking_id IS NOT NULL
        AND DATE(created_at) BETWEEN ? AND ?
    `,
      [hotelId, startDate, endDate],
    );

    const result = {
      cash: parseFloat(cashRows[0]?.total_amount) || 0,
      online: parseFloat(onlineRows[0]?.total_amount) || 0,
      total: 0,
    };
    result.total = result.cash + result.online;
    return result;
  }

  // Enhanced version with daily breakdown
  // - CASH: from bookings table per day
  // - ONLINE: from transactions table per day (status = 'success')
  static async getPaymentCollectionsDetailed(hotelId, startDate, endDate) {
    // Cash daily breakdown
    const [cashRows] = await pool.execute(
      `
      SELECT 
        DATE(created_at) as date,
        'cash' as payment_method,
        COUNT(*) as booking_count,
        SUM(total) as total_amount
      FROM bookings
      WHERE hotel_id = ?
        AND status = 'booked'
        AND payment_method = 'cash'
        AND DATE(created_at) BETWEEN ? AND ?
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) DESC
    `,
      [hotelId, startDate, endDate],
    );

    // Online daily breakdown from transactions table
    const [onlineRows] = await pool.execute(
      `
      SELECT 
        DATE(t.created_at) as date,
        'online' as payment_method,
        COUNT(*) as booking_count,
        SUM(t.amount) as total_amount
      FROM transactions t
      WHERE t.hotel_id = ?
        AND t.status = 'success'
        AND t.booking_id IS NOT NULL
        AND DATE(t.created_at) BETWEEN ? AND ?
      GROUP BY DATE(t.created_at)
      ORDER BY DATE(t.created_at) DESC
    `,
      [hotelId, startDate, endDate],
    );

    // Merge both arrays and sort by date descending
    const combined = [...cashRows, ...onlineRows].sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );
    return combined;
  }

  // Add to your Report class in Report.js

  // Generate Police Report - CORRECTED VERSION for your schema
  static async getPoliceReport(hotelId, startDate, endDate) {
    const query = `
    SELECT 
      @row_number := @row_number + 1 as serial_number,
      b.id as book_no,
      c.name as guest_name,
      COALESCE(CONCAT(c.address, ', ', c.city, ', ', c.state, ' - ', c.pincode), 'Not Provided') as address,
      DATE_FORMAT(CONCAT(b.from_date, ' ', b.from_time), '%d-%b-%Y %H:%i') as check_in_date,
      DATE_FORMAT(CONCAT(b.to_date, ' ', b.to_time), '%d-%b-%Y %H:%i') as departure_date,
      COALESCE(c.purpose_of_visit, 'Not Provided') as purpose_of_visit,
      'Not Specified' as transport_mode,
      COALESCE(c.id_type, 'Not Provided') as guest_id_type,
      COALESCE(c.id_number, 'Not Provided') as guest_id_no,
      r.room_number,
      c.phone as mobile_no
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    LEFT JOIN customers c ON b.customer_id = c.id
    CROSS JOIN (SELECT @row_number := 0) as rn
    WHERE b.hotel_id = ?
      AND b.status = 'booked'
      AND (
        (b.from_date BETWEEN ? AND ?) 
        OR (b.to_date BETWEEN ? AND ?)
        OR (b.from_date <= ? AND b.to_date >= ?)
        OR (? IS NULL AND ? IS NULL)  -- Allow null dates
      )
    ORDER BY b.from_date, r.room_number
  `;

    const [rows] = await pool.execute(query, [
      hotelId,
      startDate || null,
      endDate || null,
      startDate || null,
      endDate || null,
      startDate || null,
      endDate || null,
      startDate,
      endDate,
    ]);

    return rows;
  }

  // For PDF generation - SIMPLIFIED
  static async generatePoliceReportPDF(hotelId, startDate, endDate) {
    const query = `
    SELECT 
      h.name as hotel_name,
      h.address as hotel_address,
      h.gst_number as hotel_gst,
      DATE_FORMAT(NOW(), '%d-%b-%Y') as print_date,
      @row_number := @row_number + 1 as s_no,
      b.id as booking_id,
      c.name as guest_name,
      COALESCE(CONCAT(c.address, ', ', c.city, ', ', c.state, ' - ', c.pincode), 'N/A') as address,
      COALESCE(DATE_FORMAT(CONCAT(b.from_date, ' ', b.from_time), '%d-%b-%Y %H:%i'), 'N/A') as check_in,
      COALESCE(DATE_FORMAT(CONCAT(b.to_date, ' ', b.to_time), '%d-%b-%Y %H:%i'), 'N/A') as check_out,
      COALESCE(c.purpose_of_visit, 'N/A') as purpose_of_visit,
      'Not Specified' as transport_mode,
      COALESCE(c.id_type, 'N/A') as id_type,
      COALESCE(c.id_number, 'N/A') as id_number,
      r.room_number,
      c.phone as mobile_no
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    JOIN hotels h ON b.hotel_id = h.id
    LEFT JOIN customers c ON b.customer_id = c.id
    CROSS JOIN (SELECT @row_number := 0) as rn
    WHERE b.hotel_id = ?
      AND b.status = 'booked'
      AND (
        (? IS NULL AND ? IS NULL)
        OR DATE(b.from_date) BETWEEN ? AND ?
      )
    ORDER BY COALESCE(b.from_date, b.created_at), r.room_number
  `;

    const [rows] = await pool.execute(query, [
      hotelId,
      startDate,
      endDate,
      startDate || "1900-01-01",
      endDate || "2100-01-01",
    ]);

    return rows;
  }
  static async generatePoliceReportPDF(hotelId, startDate, endDate) {
    return new Promise(async (resolve, reject) => {
      try {
        // Get hotel details
        const [hotelRows] = await pool.execute(
          "SELECT name, address, gst_number FROM hotels WHERE id = ?",
          [hotelId],
        );
        const hotel = hotelRows[0] || {};

        // Get report data
        const reportData = await this.getPoliceReport(
          hotelId,
          startDate,
          endDate,
        );

        // Create PDF document
        const doc = new PDFDocument({
          size: "A4",
          margin: 40,
        });

        // Collect PDF chunks
        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(pdfBuffer);
        });

        // Add content to PDF
        this.addPoliceReportContent(doc, hotel, reportData, startDate, endDate);

        // Finalize PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  static addPoliceReportContent(doc, hotel, data, startDate, endDate) {
    // Helper to format date
    const formatDate = (dateStr) => {
      if (!dateStr || dateStr === "N/A" || dateStr === "Invalid Date")
        return "N/A";
      try {
        // Handle date strings like "10-Feb-2026 17:53"
        const datePart = dateStr.split(" ")[0];
        return datePart;
      } catch (e) {
        return "N/A";
      }
    };

    // Header Section
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text(hotel.name || "HOTEL", { align: "center" });
    doc.moveDown(0.2);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(hotel.address || "", { align: "center" });
    doc.moveDown(0.2);

    if (hotel.gst_number) {
      doc.fontSize(9).text(`GST: ${hotel.gst_number}`, { align: "center" });
    }

    // Horizontal line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Report Title
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("POLICE REPORT", { align: "center" });
    doc.moveDown(0.3);

    // Date Information
    const start = new Date(startDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const end = new Date(endDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    doc.fontSize(10).text(`From: ${start}  To: ${end}`, { align: "center" });
    doc.moveDown(0.2);

    const printDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    doc.fontSize(9).text(`Print Date: ${printDate}`, { align: "right" });
    doc.moveDown(1);

    // Create table with fixed layout
    const columns = [
      { header: "S.No", width: 30, align: "center" },
      { header: "Guest Name / Address", width: 140, align: "left" },
      { header: "Check-in", width: 60, align: "center" },
      { header: "Departure", width: 60, align: "center" },
      { header: "Purpose / Transport", width: 90, align: "left" },
      { header: "ID Type / No", width: 80, align: "left" },
      { header: "Room / Mobile", width: 70, align: "center" },
    ];

    const tableTop = doc.y;
    const tableLeft = 20;

    // Draw table header
    doc.font("Helvetica-Bold").fontSize(8);
    let x = tableLeft;
    columns.forEach((col, i) => {
      const headerParts = col.header.split("/");
      if (headerParts.length > 1) {
        doc.text(headerParts[0].trim(), x + 2, tableTop + 2, {
          width: col.width - 4,
        });
        doc.text(headerParts[1].trim(), x + 2, tableTop + 10, {
          width: col.width - 4,
        });
      } else {
        doc.text(col.header, x + 2, tableTop + 6, {
          width: col.width - 4,
          align: col.align,
        });
      }

      // Draw column border
      doc.rect(x, tableTop, col.width, 20).stroke();
      x += col.width;
    });

    // Add rows
    let y = tableTop + 20;
    doc.font("Helvetica").fontSize(7);

    data.forEach((row, index) => {
      // Check page break
      if (y > 750) {
        doc.addPage();
        y = 40;
        // Redraw headers
        doc.font("Helvetica-Bold").fontSize(8);
        let headerX = tableLeft;
        columns.forEach((col, i) => {
          const headerParts = col.header.split("/");
          if (headerParts.length > 1) {
            doc.text(headerParts[0].trim(), headerX + 2, y + 2, {
              width: col.width - 4,
            });
            doc.text(headerParts[1].trim(), headerX + 2, y + 10, {
              width: col.width - 4,
            });
          } else {
            doc.text(col.header, headerX + 2, y + 6, {
              width: col.width - 4,
              align: col.align,
            });
          }
          doc.rect(headerX, y, col.width, 20).stroke();
          headerX += col.width;
        });
        y += 20;
        doc.font("Helvetica").fontSize(7);
      }

      // Row data
      const rowCells = [
        `${index + 1}\n${row.book_no || ""}`,
        `${row.guest_name || "N/A"}\n${(row.address || "N/A").substring(0, 40)}`,
        formatDate(row.check_in_date),
        formatDate(row.departure_date),
        `${row.purpose_of_visit || "N/A"}\n${row.transport_mode || "NS"}`,
        `${row.guest_id_type || "N/A"}\n${(row.guest_id_no || "N/A").substring(0, 12)}`,
        `${row.room_number || "N/A"}\n${row.mobile_no || "N/A"}`,
      ];

      // Draw row
      x = tableLeft;
      columns.forEach((col, colIndex) => {
        const cellHeight = 30;
        doc.rect(x, y, col.width, cellHeight).stroke();

        const lines = rowCells[colIndex].split("\n");
        let lineY = y + 5;

        lines.forEach((line, lineIndex) => {
          doc.text(line, x + 2, lineY, {
            width: col.width - 4,
            align: col.align,
            lineGap: 1,
          });
          lineY += 10;
        });

        x += col.width;
      });

      y += 30;
    });

    // Footer
    doc.moveDown(2);
    doc
      .fontSize(10)
      .text(
        "Manager/Receptionist Signature: ________________________",
        50,
        doc.y,
      );
    doc.moveDown(1);
    doc.text("Hotel Stamp: ________________________", 50, doc.y);
  }

  // Add these methods to your Report class in Report.js

  // Get Function Room Report
  static async getFunctionRoomReport(hotelId, startDate, endDate) {
    const query = `
    SELECT 
      DATE(fb.booking_date) as date,
      fr.name as room_name,
      fr.room_number,
      fr.type as room_type,
      fb.event_name,
      fb.customer_name,
      fb.customer_phone,
      fb.guests_expected,
      fb.start_time,
      fb.end_time,
      fb.rate_type,
      fb.rate_amount,
      fb.subtotal,
      fb.service_charge,
      fb.gst,
      fb.catering_charges,
      fb.decoration_charges,
      fb.other_charges,
      fb.discount,
      fb.total_amount,
      fb.advance_paid,
      fb.balance_due,
      fb.payment_method,
      fb.payment_status,
      fb.status
    FROM function_bookings fb
    JOIN function_rooms fr ON fb.function_room_id = fr.id
    WHERE fb.hotel_id = ?
      AND DATE(fb.booking_date) BETWEEN ? AND ?
      AND fb.status != 'cancelled'
    ORDER BY fb.booking_date DESC, fb.start_time
  `;

    const [rows] = await pool.execute(query, [hotelId, startDate, endDate]);
    return rows;
  }

  // Get Function Room Summary
  static async getFunctionRoomSummary(hotelId, startDate, endDate) {
    // Current Summary from bookings
    const summaryQuery = `
    SELECT 
      COUNT(*) as total_bookings,
      SUM(CASE WHEN fb.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
      SUM(CASE WHEN fb.status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
      SUM(CASE WHEN fb.status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
      SUM(CASE WHEN fb.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
      SUM(fb.total_amount) as total_revenue,
      SUM(fb.balance_due) as total_balance,
      SUM(fb.catering_charges) as total_catering,
      SUM(fb.decoration_charges) as total_decoration,
      SUM(fb.other_charges) as total_other_charges,
      AVG(fb.guests_expected) as avg_guests
    FROM function_bookings fb
    WHERE fb.hotel_id = ?
      AND DATE(fb.booking_date) BETWEEN ? AND ?
      AND fb.status != 'cancelled'
    `;

    // Revenue/Paid Amount from transactions for the period (Requested Logic)
    const paidQuery = `
      SELECT (
        (SELECT COALESCE(SUM(transaction_amount), 0) FROM function_booking_amounts 
         WHERE hotel_id = ? AND DATE(created_at) BETWEEN ? AND ?)
        -
        (SELECT COALESCE(SUM(refund_amount), 0) FROM booking_refunds 
         WHERE hotel_id = ? AND refund_status = 'completed' AND DATE(created_at) BETWEEN ? AND ?
         AND booking_type = 'function')
      ) as total_paid
    `;

    const [summaryResult] = await pool.execute(summaryQuery, [hotelId, startDate, endDate]);
    const [paidResult] = await pool.execute(paidQuery, [hotelId, startDate, endDate, hotelId, startDate, endDate]);

    const summary = summaryResult[0] || {};
    const totalPaid = paidResult[0]?.total_paid || 0;

    return {
      ...summary,
      total_advance: totalPaid
    };
  }

  // Get Function Room Occupancy
  static async getFunctionRoomOccupancy(hotelId, date) {
    const query = `
    SELECT 
      fr.id,
      fr.name,
      fr.room_number,
      fr.type,
      fr.capacity,
      fr.base_price,
      CASE 
        WHEN fb.id IS NOT NULL THEN 'booked'
        WHEN fr.status = 'maintenance' THEN 'maintenance'
        WHEN fr.status = 'blocked' THEN 'blocked'
        ELSE 'available'
      END as current_status,
      fb.event_name,
      fb.customer_name,
      fb.start_time,
      fb.end_time,
      fb.guests_expected,
      fb.total_amount
    FROM function_rooms fr
    LEFT JOIN function_bookings fb ON fr.id = fb.function_room_id 
      AND DATE(fb.booking_date) = ?
      AND fb.status IN ('confirmed', 'completed')
    WHERE fr.hotel_id = ?
    ORDER BY fr.room_number
  `;

    const [rows] = await pool.execute(query, [date, hotelId]);
    return rows;
  }

  // Updated getReportSummary to include function bookings
  static async getReportSummary(hotelId, startDate, endDate) {
    try {
      console.log("========== DEBUG: getReportSummary ==========");
      console.log("Input params:", { hotelId, startDate, endDate });

      // Validate dates
      if (!startDate || !endDate) {
        throw new Error("Start date and end date are required");
      }

      // Get room occupancy
      const [occupancy] = await pool.execute(
        `
      SELECT 
        COUNT(DISTINCT r.id) as total_rooms,
        COUNT(DISTINCT CASE WHEN b.id IS NOT NULL THEN b.id END) as occupied_rooms,
        COUNT(DISTINCT CASE WHEN r.status = 'maintenance' THEN r.id END) as out_of_order
      FROM rooms r
      LEFT JOIN bookings b ON r.id = b.room_id        
        AND ? BETWEEN b.from_date AND b.to_date
      WHERE r.hotel_id = ?
    `,
        [endDate, hotelId],
      );

      // ── 1. UNIFIED CASH REVENUE ──────────────────────────────────────────
      const [cashResult] = await pool.execute(`
        SELECT SUM(cash_amount) as total_amount FROM (
          -- Advance Bookings
          SELECT COALESCE(SUM(advance_amount), 0) as cash_amount FROM advance_bookings 
          WHERE hotel_id = ? AND payment_method = 'cash'
          AND DATE(created_at) BETWEEN ? AND ?

          UNION ALL

          -- Collections
          SELECT COALESCE(SUM(amount), 0) as cash_amount FROM collections 
          WHERE hotel_id = ? AND payment_mode = 'cash'
          AND collection_date BETWEEN ? AND ?

          UNION ALL

          -- Function Hall Payments
          SELECT COALESCE(SUM(transaction_amount), 0) as cash_amount FROM function_booking_amounts 
          WHERE hotel_id = ? AND payment_method = 'cash' 
          AND DATE(created_at) BETWEEN ? AND ?

          UNION ALL

          -- Refunds (Negative)
          SELECT -COALESCE(SUM(refund_amount), 0) as cash_amount FROM booking_refunds 
          WHERE hotel_id = ? AND refund_method = 'cash' AND refund_status = 'completed'
          AND DATE(created_at) BETWEEN ? AND ?
        ) as total_cash
      `, [hotelId, startDate, endDate, hotelId, startDate, endDate, hotelId, startDate, endDate, hotelId, startDate, endDate]);

      // ── 2. UNIFIED ONLINE REVENUE ────────────────────────────────────────
      const [onlineResult] = await pool.execute(`
        SELECT SUM(online_amount) as total_amount FROM (
          -- Transactions (Room/Advance via Gateway)
          SELECT COALESCE(SUM(amount), 0) as online_amount FROM transactions 
          WHERE hotel_id = ? AND payment_method <> 'cash' AND status = 'success'
          AND DATE(created_at) BETWEEN ? AND ?

          UNION ALL

          -- Function Hall Payments (Online)
          SELECT transaction_amount as amount FROM function_booking_amounts 
          WHERE hotel_id = ? AND payment_method = 'online' 
          AND transaction_type IN ('advance', 'payment', 'final_payment')
          AND DATE(created_at) BETWEEN ? AND ?

          UNION ALL

          -- Refunds (Negative)
          SELECT -refund_amount as amount FROM booking_refunds 
          WHERE hotel_id = ? AND refund_method = 'online' AND refund_status = 'completed'
          AND DATE(created_at) BETWEEN ? AND ?
        ) as total_online
      `, [hotelId, startDate, endDate, hotelId, startDate, endDate, hotelId, startDate, endDate]);

      const cashCollection = parseFloat(cashResult[0]?.total_amount) || 0;
      const onlineCollection = parseFloat(onlineResult[0]?.total_amount) || 0;

      // ── 3. CATEGORIZED REVENUE (For Breakdown) ──────────────────────────
      // This part helps populate room_collections and function_collections in the response
      const [roomRevResult] = await pool.execute(`
        SELECT SUM(amount) as total_amount, payment_mode FROM (
           SELECT amount, 'cash' as payment_mode FROM collections WHERE hotel_id = ? AND payment_mode = 'cash' AND collection_date BETWEEN ? AND ?
           UNION ALL
           SELECT COALESCE(SUM(advance_amount), 0) as amount, 'cash' as payment_mode FROM advance_bookings WHERE hotel_id = ? AND payment_method = 'cash' AND DATE(created_at) BETWEEN ? AND ?
           UNION ALL
           SELECT amount, 'online' FROM transactions WHERE hotel_id = ? AND payment_method <> 'cash' AND status = 'success' AND DATE(created_at) BETWEEN ? AND ?
        ) as room_rev GROUP BY payment_mode
      `, [hotelId, startDate, endDate, hotelId, startDate, endDate, hotelId, startDate, endDate]);

      const [funcRevResult] = await pool.execute(`
        SELECT SUM(amount) as total_amount, payment_mode FROM (
           SELECT transaction_amount as amount, payment_method as payment_mode FROM function_booking_amounts 
           WHERE hotel_id = ? AND transaction_type IN ('advance', 'payment', 'final_payment') AND DATE(created_at) BETWEEN ? AND ?
           UNION ALL
           -- Subtracting all refunds (unified logic)
           SELECT -COALESCE(SUM(refund_amount), 0), refund_method FROM booking_refunds 
           WHERE hotel_id = ? AND refund_status = 'completed' AND DATE(created_at) BETWEEN ? AND ?
           GROUP BY refund_method
        ) as func_rev GROUP BY payment_mode
      `, [hotelId, startDate, endDate, hotelId, startDate, endDate]);

      let roomCash = 0, roomOnline = 0;
      roomRevResult.forEach(r => {
        if (r.payment_mode === 'cash') roomCash = parseFloat(r.total_amount) || 0;
        else roomOnline = parseFloat(r.total_amount) || 0;
      });

      let functionCash = 0, functionOnline = 0;
      funcRevResult.forEach(r => {
        if (r.payment_mode === 'cash') functionCash = parseFloat(r.total_amount) || 0;
        else if (r.payment_mode === 'online') functionOnline = parseFloat(r.total_amount) || 0;
      });

      // Get expenses for date range
      const [expenses] = await pool.execute(
        `
      SELECT 
        SUM(e.amount) as total
      FROM expenses e
      WHERE e.hotel_id = ?
        AND e.expense_date BETWEEN ? AND ?
    `,
        [hotelId, startDate, endDate],
      );

      // Get salaries for date range
      const [salaries] = await pool.execute(
        `
      SELECT 
        SUM(s.net_salary) as total
      FROM salaries s
      WHERE s.hotel_id = ?
        AND (
          (s.payment_date BETWEEN ? AND ?)
          OR (s.salary_month BETWEEN ? AND ?)
        )
        AND s.status = 'paid'
    `,
        [hotelId, startDate, endDate, startDate, endDate],
      );

      const roomTotal = roomCash + roomOnline;
      const functionTotal = functionCash + functionOnline;
      const totalCollection = cashCollection + onlineCollection;

      const expensesTotal = parseFloat(expenses[0]?.total) || 0;
      const salariesTotal = parseFloat(salaries[0]?.total) || 0;
      const totalExpenses = expensesTotal + salariesTotal;
      const netProfit = totalCollection - totalExpenses;
      console.log("Room totals:", { roomCash, roomOnline, roomTotal });

      return {
        occupancy: occupancy[0] || {},
        room_collections: {
          cash: roomCash,
          online: roomOnline,
          total: roomTotal,
        },
        function_collections: {
          cash: functionCash,
          online: functionOnline,
          total: functionTotal,
        },
        cash_collection: cashCollection,
        online_collection: onlineCollection,
        total_collection: totalCollection,
        room_cash: roomCash,
        room_online: roomOnline,
        room_total: roomTotal,
        expenses: expensesTotal,
        salaries: salariesTotal,
        total_expenses: totalExpenses,
        net_profit: netProfit,
        date_range: {
          start: startDate,
          end: endDate,
        },
      };
    } catch (error) {
      console.error("Error in getReportSummary:", error);
      throw error;
    }
  }
}

module.exports = Report;
