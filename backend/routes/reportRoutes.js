const express = require("express");
const router = express.Router();
const Report = require("../models/Report");
const { authenticate } = require("../middleware/auth");
const { pool } = require("../config/database");

// Get daily occupancy report
router.get("/daily-occupancy", authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const hotelId = req.user.hotel_id;

    const data = await Report.getDailyOccupancy(hotelId, startDate, endDate);

    res.json({
      success: true,
      data: data,
      message: "Daily occupancy report generated successfully",
    });
  } catch (error) {
    console.error("Error generating daily occupancy report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate daily occupancy report",
      error: error.message,
    });
  }
});

// Get housekeeping report
router.get("/housekeeping", authenticate, async (req, res) => {
  try {
    const { date } = req.query;
    const hotelId = req.user.hotel_id;

    const data = await Report.getHousekeeping(hotelId, date);

    res.json({
      success: true,
      data: data,
      message: "Housekeeping report generated successfully",
    });
  } catch (error) {
    console.error("Error generating housekeeping report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate housekeeping report",
      error: error.message,
    });
  }
});

// Get daily sales report
router.get("/daily-sales", authenticate, async (req, res) => {
  try {
    const { date } = req.query;
    const hotelId = req.user.hotel_id;

    const data = await Report.getDailySales(hotelId, date);

    res.json({
      success: true,
      data: data,
      message: "Daily sales report generated successfully",
    });
  } catch (error) {
    console.error("Error generating daily sales report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate daily sales report",
      error: error.message,
    });
  }
});

// Get check-in/check-out report
router.get("/check-in-out", authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const hotelId = req.user.hotel_id;

    const data = await Report.getCheckInCheckOut(hotelId, startDate, endDate);

    res.json({
      success: true,
      data: data,
      message: "Check-in/Check-out report generated successfully",
    });
  } catch (error) {
    console.error("Error generating check-in/check-out report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate check-in/check-out report",
      error: error.message,
    });
  }
});

// Get blocking report
router.get("/blocking", authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const hotelId = req.user.hotel_id;

    const data = await Report.getBlocking(hotelId, startDate, endDate);

    res.json({
      success: true,
      data: data,
      message: "Blocking report generated successfully",
    });
  } catch (error) {
    console.error("Error generating blocking report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate blocking report",
      error: error.message,
    });
  }
});

// Get expenses report
router.get("/expenses", authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const hotelId = req.user.hotel_id;

    const data = await Report.getExpenses(hotelId, startDate, endDate);

    res.json({
      success: true,
      data: data,
      message: "Expenses report generated successfully",
    });
  } catch (error) {
    console.error("Error generating expenses report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate expenses report",
      error: error.message,
    });
  }
});

// Get advance bookings report
router.get("/advance-bookings", authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const hotelId = req.user.hotel_id;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const data = await Report.getAdvanceBookings(hotelId, startDate, endDate);

    res.json({
      success: true,
      data: data,
      message: "Advance bookings report generated successfully",
    });
  } catch (error) {
    console.error("Error generating advance bookings report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate advance bookings report",
      error: error.message,
    });
  }
});

// Get salaries report
router.get("/salaries-report", authenticate, async (req, res) => {
  try {
    const { month, year } = req.query;
    const hotelId = req.user.hotel_id;

    const data = await Report.getSalaries(hotelId, month, year);

    res.json({
      success: true,
      data: data,
      message: "Salaries report generated successfully",
    });
  } catch (error) {
    console.error("Error generating salaries report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate salaries report",
      error: error.message,
    });
  }
});

// Get P&L summary report
router.get("/pnl-summary", authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const hotelId = req.user.hotel_id;

    const data = await Report.getPnLSummary(hotelId, startDate, endDate);

    res.json({
      success: true,
      data: data,
      message: "P&L summary report generated successfully",
    });
  } catch (error) {
    console.error("Error generating P&L summary report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate P&L summary report",
      error: error.message,
    });
  }
});

// Export report to Excel
router.get("/export/:reportType", authenticate, async (req, res) => {
  try {
    const { reportType } = req.params;
    const { startDate, endDate, date, month, year } = req.query;
    const hotelId = req.user.hotel_id;

    const params = { startDate, endDate, date, month, year };

    const buffer = await Report.exportToExcel(hotelId, reportType, params);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${reportType}_report_${Date.now()}.xlsx`,
    );

    res.send(buffer);
  } catch (error) {
    console.error("Error exporting report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export report",
      error: error.message,
    });
  }
});

// Get report summary (dashboard)
// router.get('/summary', authenticate, async (req, res) => {
//   try {
//     const hotelId = req.user.hotel_id;

//     const summary = await Report.getReportSummary(hotelId);

//     res.json({
//       success: true,
//       data: summary,
//       message: 'Report summary generated successfully'
//     });
//   } catch (error) {
//     console.error('Error generating report summary:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to generate report summary',
//       error: error.message
//     });
//   }
// });
// Get report summary (dashboard) with date range
router.get("/summary", authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const hotelId = req.user.hotel_id;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const summary = await Report.getReportSummary(hotelId, startDate, endDate);

    res.json({
      success: true,
      data: summary,
      message: "Report summary generated successfully",
    });
  } catch (error) {
    console.error("Error generating report summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate report summary",
      error: error.message,
    });
  }
});

// Get payment collections report
router.get("/payment-collections", authenticate, async (req, res) => {
  try {
    const { startDate, endDate, detailed } = req.query;
    const hotelId = req.user.hotel_id;

    let data;
    if (detailed === "true") {
      data = await Report.getPaymentCollectionsDetailed(
        hotelId,
        startDate,
        endDate,
      );
    } else {
      data = await Report.getPaymentCollections(hotelId, startDate, endDate);
    }

    res.json({
      success: true,
      data: data,
      message: "Payment collections report generated successfully",
    });
  } catch (error) {
    console.error("Error generating payment collections report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate payment collections report",
      error: error.message,
    });
  }
});

// Add these routes to your reports router file

router.get("/police-report", authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const hotelId = req.user.hotel_id;

    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const data = await Report.getPoliceReport(hotelId, startDate, endDate);

    res.json({
      success: true,
      data: data,
      message: "Police report generated successfully",
    });
  } catch (error) {
    console.error("Error generating police report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate police report",
      error: error.message,
    });
  }
});

// Get hotel details for police report header - FIXED VERSION
router.get("/police-report/header", authenticate, async (req, res) => {
  try {
    const hotelId = req.user.hotel_id;

    // Use the pool from the import
    const [hotel] = await pool.execute(
      `
      SELECT 
        name,
        address,
        gst_number,
        DATE_FORMAT(NOW(), '%d-%b-%Y %H:%i:%s') as print_date
      FROM hotels 
      WHERE id = ?
    `,
      [hotelId],
    );

    res.json({
      success: true,
      data: hotel[0] || {},
      message: "Hotel details retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching hotel details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch hotel details",
      error: error.message,
    });
  }
});

// Export police report as PDF
router.get("/police-report/pdf", authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const hotelId = req.user.hotel_id;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const data = await Report.generatePoliceReportPDF(
      hotelId,
      startDate,
      endDate,
    );

    res.json({
      success: true,
      data: data,
      message: "Police report data for PDF generation",
    });
  } catch (error) {
    console.error("Error generating police report PDF:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate police report PDF",
      error: error.message,
    });
  }
});

router.get("/police-report/download", authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const hotelId = req.user.hotel_id;

    // Set default dates if not provided
    const start = startDate || new Date().toISOString().split("T")[0];
    const end = endDate || new Date().toISOString().split("T")[0];

    // Generate PDF buffer
    const pdfBuffer = await Report.generatePoliceReportPDF(hotelId, start, end);

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=police_report_${Date.now()}.pdf`,
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    // Send PDF buffer
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating police report PDF:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate police report PDF",
      error: error.message,
    });
  }
});

// Get function room report
router.get("/function-room", authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const hotelId = req.user.hotel_id;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const data = await Report.getFunctionRoomReport(
      hotelId,
      startDate,
      endDate,
    );

    res.json({
      success: true,
      data: data,
      message: "Function room report generated successfully",
    });
  } catch (error) {
    console.error("Error generating function room report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate function room report",
      error: error.message,
    });
  }
});

// Get function room summary
router.get("/function-room/summary", authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const hotelId = req.user.hotel_id;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const data = await Report.getFunctionRoomSummary(
      hotelId,
      startDate,
      endDate,
    );

    res.json({
      success: true,
      data: data,
      message: "Function room summary generated successfully",
    });
  } catch (error) {
    console.error("Error generating function room summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate function room summary",
      error: error.message,
    });
  }
});

// Get function room occupancy
router.get("/function-room/occupancy", authenticate, async (req, res) => {
  try {
    const { date } = req.query;
    const hotelId = req.user.hotel_id;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    const data = await Report.getFunctionRoomOccupancy(hotelId, date);

    res.json({
      success: true,
      data: data,
      message: "Function room occupancy generated successfully",
    });
  } catch (error) {
    console.error("Error generating function room occupancy:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate function room occupancy",
      error: error.message,
    });
  }
});

module.exports = router;
