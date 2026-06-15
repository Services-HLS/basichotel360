const Collection = require("../models/Collection");
const { pool } = require("../config/database");

const collectionController = {
  // Get all collections with filters
  getCollections: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const {
        startDate,
        endDate,
        paymentMode = "all",
        handoverStatus = "all",
        limit = 100,
        offset = 0,
        search = "",
      } = req.query;

      console.log("📦 [Controller] Get collections for hotel:", hotelId);

      // Validate date range
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            error: "INVALID_DATE_FORMAT",
            message: "Invalid date format. Use YYYY-MM-DD",
          });
        }

        if (start > end) {
          return res.status(400).json({
            success: false,
            error: "INVALID_DATE_RANGE",
            message: "Start date cannot be after end date",
          });
        }
      }

      // Fetch collections and summary
      const [collectionsData, summary] = await Promise.all([
        Collection.getCollections(hotelId, {
          startDate: startDate || "",
          endDate: endDate || "",
          paymentMode: paymentMode || "all",
          handoverStatus: handoverStatus || "all",
          limit: parseInt(limit) || 100,
          offset: parseInt(offset) || 0,
          search: search || "",
        }),
        Collection.getCollectionSummary(
          hotelId,
          startDate || "",
          endDate || "",
        ),
      ]);

      console.log(
        "✅ [Controller] Collections fetched:",
        collectionsData.collections.length,
      );
      console.log("✅ [Controller] Summary calculated:", summary);

      res.json({
        success: true,
        data: {
          collections: collectionsData.collections,
          summary,
          pagination: {
            limit: parseInt(limit) || 100,
            offset: parseInt(offset) || 0,
            total: collectionsData.total,
          },
        },
        message: "Collections retrieved successfully",
      });
    } catch (error) {
      console.error("❌ [Controller] Get collections error:", error.message);
      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Failed to retrieve collections: " + error.message,
      });
    }
  },

  // Get cash bookings
  getCashBookings: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const { startDate, endDate } = req.query;

      console.log("💵 [Controller] Get cash bookings for hotel:", hotelId);

      const cashBookings = await Collection.getCashBookings(
        hotelId,
        startDate || "",
        endDate || "",
      );

      console.log("✅ [Controller] Cash bookings found:", cashBookings.length);

      res.json({
        success: true,
        data: cashBookings,
        message: "Cash bookings retrieved successfully",
      });
    } catch (error) {
      console.error("❌ [Controller] Get cash bookings error:", error.message);
      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Failed to retrieve cash bookings",
      });
    }
  },

  // Create new collection - FIXED
  createCollection: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const userId = req.user.userId;
      const {
        booking_id,
        collection_date,
        payment_mode,
        amount,
        transaction_id,
        remarks,
      } = req.body;

      console.log("📝 [Controller] Create collection:", {
        hotelId,
        userId,
        booking_id,
        payment_mode,
        amount,
      });

      // Validation
      if (!payment_mode || !amount) {
        return res.status(400).json({
          success: false,
          error: "MISSING_REQUIRED_FIELDS",
          message: "Payment mode and amount are required",
        });
      }

      if (!["cash", "online", "card", "upi"].includes(payment_mode)) {
        return res.status(400).json({
          success: false,
          error: "INVALID_PAYMENT_MODE",
          message: "Payment mode must be cash, online, card, or upi",
        });
      }

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({
          success: false,
          error: "INVALID_AMOUNT",
          message: "Amount must be a positive number",
        });
      }

      // Create collection record
      const collectionId = await Collection.create({
        hotel_id: hotelId,
        booking_id: booking_id || null,
        collection_date:
          collection_date || new Date().toISOString().split("T")[0],
        payment_mode,
        amount: amountNum,
        transaction_id: transaction_id || null,
        remarks: remarks || "",
        collected_by: userId,
        created_by: userId,
      });

      console.log("✅ [Controller] Collection created with ID:", collectionId);

      // Return just the ID, frontend will refresh data
      res.status(201).json({
        success: true,
        data: {
          collectionId: collectionId,
        },
        message: "Collection recorded successfully",
      });
    } catch (error) {
      console.error("❌ [Controller] Create collection error:", error.message);
      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Failed to create collection",
      });
    }
  },

  // Handover cash to owner - FIXED
  handoverCash: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;
      const { amount, handed_to, remarks } = req.body;

      console.log("🔄 [Controller] Handover cash:", {
        collectionId: id,
        hotelId,
        amount,
        handed_to,
      });

      // Validation
      if (!amount || !handed_to) {
        return res.status(400).json({
          success: false,
          error: "MISSING_REQUIRED_FIELDS",
          message: "Amount and handed to are required",
        });
      }

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({
          success: false,
          error: "INVALID_AMOUNT",
          message: "Amount must be a positive number",
        });
      }

      // We can't get collection by ID since getById doesn't exist
      // Just try to update it and check if successful
      const updated = await Collection.updateHandover(id, hotelId, {
        status: amountNum > 0 ? "partially_handed_over" : "handed_over",
        amount: amountNum,
        handover_to: handed_to,
        remarks: remarks || "",
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: "COLLECTION_NOT_FOUND",
          message: "Collection not found or could not be updated",
        });
      }

      console.log("✅ [Controller] Handover successful");

      res.json({
        success: true,
        data: {
          collectionId: id,
          handoverAmount: amountNum,
          handedTo: handed_to,
        },
        message: `Cash handed over successfully`,
      });
    } catch (error) {
      console.error("❌ [Controller] Handover cash error:", error.message);
      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Failed to handover cash",
      });
    }
  },

  // Bulk Handover (Total Balance)
  bulkHandover: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const userId = req.user.userId;
      const { amount, handed_to, handover_type, remarks } = req.body;

      console.log("💰 [Controller] Bulk handover requested:", {
        hotelId,
        amount,
        handed_to,
      });

      if (!amount || !handed_to) {
        return res.status(400).json({
          success: false,
          error: "MISSING_REQUIRED_FIELDS",
          message: "Amount and handed to are required",
        });
      }

      const handoverId = await Collection.bulkHandover(hotelId, {
        amount,
        handover_to: handed_to,
        handover_type: handover_type || "bulk",
        remarks: remarks || "Total Balance Handover",
        user_id: userId,
      });

      console.log("✅ [Controller] Bulk handover successful, ID:", handoverId);

      res.json({
        success: true,
        data: { handoverId },
        message: "Bulk handover recorded successfully",
      });
    } catch (error) {
      console.error("❌ [Controller] Bulk handover error:", error.message);
      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Failed to perform bulk handover: " + error.message,
      });
    }
  },

  // Get Handover history (Ledger)
  getHandoverHistory: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const { startDate, endDate } = req.query;

      console.log("📜 [Controller] Get handover history for hotel:", hotelId);

      const history = await Collection.getHandoverHistory(hotelId, {
        startDate,
        endDate,
      });

      res.json({
        success: true,
        data: history,
        message: "Handover history retrieved successfully",
      });
    } catch (error) {
      console.error("❌ [Controller] Get history error:", error.message);
      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Failed to retrieve handover history",
      });
    }
  },

  // Get Handover Types
  getHandoverTypes: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const types = await Collection.getHandoverTypes(hotelId);

      res.json({
        success: true,
        data: types,
        message: "Handover types retrieved",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch types",
      });
    }
  },

  // Export collections to Excel/CSV
  exportCollections: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const { startDate, endDate, paymentMode, handoverStatus, search } =
        req.query;

      console.log("📂 [Controller] Export collections:", { hotelId, startDate, endDate });

      const collectionsData = await Collection.getCollections(hotelId, {
        startDate,
        endDate,
        paymentMode: paymentMode || "all",
        handoverStatus: handoverStatus || "all",
        limit: 1000, // Export up to 1000 items
        offset: 0,
        search: search || "",
      });

      // For now, return JSON for download simulation or simple text-based CSV logic later
      // But let's at least provide a valid JSON response so it doesn't crash
      res.json({
        success: true,
        data: collectionsData.collections,
        message: "Collections export data prepared",
      });
    } catch (error) {
      console.error("❌ [Controller] Export error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to export collections",
      });
    }
  },

  // Add a simple test endpoint
  testCollections: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;

      // Get count of collections
      const [countResult] = await pool.execute(
        "SELECT COUNT(*) as total FROM collections WHERE hotel_id = ?",
        [hotelId],
      );

      res.json({
        success: true,
        data: {
          hotelId,
          totalCollections: countResult[0].total,
          message: "Collections system is working",
        },
      });
    } catch (error) {
      console.error("Test collections error:", error);
      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Test failed: " + error.message,
      });
    }
  },
};

module.exports = collectionController;
