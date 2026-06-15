const Room = require("../models/Room");
const { pool } = require("../config/database");
const Hotel = require("../models/Hotel");

const roomController = {
  // Create new room
  // createRoom: async (req, res) => {
  //   try {
  //     const {
  //       room_number,
  //       type,
  //       floor,
  //       price,
  //       amenities,
  //       status,
  //       gst_percentage,
  //       service_charge_percentage,
  //     } = req.body;
  //     const hotelId = req.user.hotel_id;

  //     // Check if room number already exists in this hotel
  //     const roomExists = await Room.checkRoomNumberExists(hotelId, room_number);
  //     if (roomExists) {
  //       return res.status(400).json({
  //         success: false,
  //         error: "ROOM_EXISTS",
  //         message: "Room number already exists in this hotel",
  //       });
  //     }

  //     const roomId = await Room.create({
  //       hotel_id: hotelId,
  //       room_number,
  //       type,
  //       floor,
  //       price,
  //       amenities,
  //       status,
  //       gst_percentage, // New
  //       service_charge_percentage, // New
  //     });

  //     res.status(201).json({
  //       success: true,
  //       message: "Room created successfully",
  //       roomId: roomId,
  //     });
  //   } catch (error) {
  //     console.error("Create room error:", error);
  //     res.status(500).json({
  //       success: false,
  //       error: "SERVER_ERROR",
  //       message: "Internal server error",
  //     });
  //   }
  // },

  // Create new room with auto GST calculation
  createRoom: async (req, res) => {
    try {
      const {
        room_number,
        type,
        floor,
        price,
        amenities,
        status,
      } = req.body;
      const hotelId = req.user.hotel_id;

      // Check if room number already exists
      const roomExists = await Room.checkRoomNumberExists(hotelId, room_number);
      if (roomExists) {
        return res.status(400).json({
          success: false,
          error: "ROOM_EXISTS",
          message: "Room number already exists in this hotel",
        });
      }

      // Get GST based on room price
      // const gstForRoom = await Hotel.getGSTForRoom(null, hotelId, price);
      let gstForRoom = null;

      try {
        gstForRoom = await Hotel.getGSTForRoom(null, hotelId, price);
      } catch (err) {
        console.error("GST fetch failed:", err);
      }

      const roomId = await Room.create({
        hotel_id: hotelId,
        room_number,
        type,
        floor,
        price,
        amenities,
        status: status || 'available',
        gst_percentage: gstForRoom?.gst_percentage || 12,
        cgst_percentage: gstForRoom?.cgst_percentage || 6,
        sgst_percentage: gstForRoom?.sgst_percentage || 6,
        igst_percentage: gstForRoom?.igst_percentage || 12,
        service_charge_percentage: gstForRoom?.service_charge_percentage || 10
      });

      res.status(201).json({
        success: true,
        message: "Room created successfully",
        roomId: roomId,
        gstApplied: {
          gst_percentage: gstForRoom?.gst_percentage,
          cgst_percentage: gstForRoom?.cgst_percentage,
          sgst_percentage: gstForRoom?.sgst_percentage,
          igst_percentage: gstForRoom?.igst_percentage
        }
      });
    } catch (error) {
      console.error("Create room error:", error);
      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Internal server error",
      });
    }
  },

  // Get all rooms for hotel
  getRooms: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const rooms = await Room.findByHotel(hotelId);

      res.json({
        success: true,
        data: rooms,
      });
    } catch (error) {
      console.error("Get rooms error:", error);
      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Internal server error",
      });
    }
  },

  // Get available rooms
  getAvailableRooms: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const rooms = await Room.getAvailable(hotelId);

      res.json({
        success: true,
        data: rooms,
      });
    } catch (error) {
      console.error("Get available rooms error:", error);
      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Internal server error",
      });
    }
  },

  // Get room by ID
  getRoom: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      const room = await Room.findById(id, hotelId);
      if (!room) {
        return res.status(404).json({
          success: false,
          error: "ROOM_NOT_FOUND",
          message: "Room not found",
        });
      }

      res.json({
        success: true,
        data: room,
      });
    } catch (error) {
      console.error("Get room error:", error);
      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Internal server error",
      });
    }
  },

  // Update room
  // updateRoom: async (req, res) => {
  //   try {
  //     const { id } = req.params;
  //     const hotelId = req.user.hotel_id;
  //     const { room_number, type, floor, price, amenities, status } = req.body;

  //     // Check if room number already exists (excluding current room)
  //     const roomExists = await Room.checkRoomNumberExists(
  //       hotelId,
  //       room_number,
  //       id,
  //     );
  //     if (roomExists) {
  //       return res.status(400).json({
  //         success: false,
  //         error: "ROOM_EXISTS",
  //         message: "Room number already exists in this hotel",
  //       });
  //     }

  //     const updated = await Room.update(id, hotelId, {
  //       room_number,
  //       type,
  //       floor,
  //       price,
  //       amenities,
  //       status,
  //     });

  //     if (!updated) {
  //       return res.status(404).json({
  //         success: false,
  //         error: "ROOM_NOT_FOUND",
  //         message: "Room not found",
  //       });
  //     }

  //     res.json({
  //       success: true,
  //       message: "Room updated successfully",
  //     });
  //   } catch (error) {
  //     console.error("Update room error:", error);
  //     res.status(500).json({
  //       success: false,
  //       error: "SERVER_ERROR",
  //       message: "Internal server error",
  //     });
  //   }
  // },

  // Update room with price-based GST recalculation
  updateRoom: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;
      const { room_number, type, floor, price, amenities, status } = req.body;

      // Check if room number already exists
      const roomExists = await Room.checkRoomNumberExists(hotelId, room_number, id);
      if (roomExists) {
        return res.status(400).json({
          success: false,
          error: "ROOM_EXISTS",
          message: "Room number already exists in this hotel",
        });
      }

      // Get current room to check if price changed
      const currentRoom = await Room.findById(id, hotelId);

      let updateData = {
        room_number,
        type,
        floor,
        price,
        amenities,
        status,
      };

      // If price changed, recalculate GST based on new price
      if (currentRoom && price !== currentRoom.price) {
        const gstForRoom = await Hotel.getGSTForRoom(null, hotelId, price);
        if (gstForRoom) {
          updateData.gst_percentage = gstForRoom.gst_percentage;
          updateData.cgst_percentage = gstForRoom.cgst_percentage;
          updateData.sgst_percentage = gstForRoom.sgst_percentage;
          updateData.igst_percentage = gstForRoom.igst_percentage;
        }
      }

      const updated = await Room.updateRoomPartial(id, hotelId, updateData);

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: "ROOM_NOT_FOUND",
          message: "Room not found",
        });
      }

      res.json({
        success: true,
        message: "Room updated successfully",
        gstRecalculated: price !== currentRoom?.price
      });
    } catch (error) {
      console.error("Update room error:", error);
      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Internal server error",
      });
    }
  },

  // Update room status
  updateRoomStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;
      const { status } = req.body;

      if (!["available", "booked", "maintenance", "blocked"].includes(status)) {
        return res.status(400).json({
          success: false,
          error: "INVALID_STATUS",
          message: "Invalid room status",
        });
      }

      const updated = await Room.updateStatus(id, hotelId, status);
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: "ROOM_NOT_FOUND",
          message: "Room not found",
        });
      }

      res.json({
        success: true,
        message: "Room status updated successfully",
      });
    } catch (error) {
      console.error("Update room status error:", error);
      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Internal server error",
      });
    }
  },

  // Delete room
  deleteRoom: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      const deleted = await Room.delete(id, hotelId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: "ROOM_NOT_FOUND",
          message: "Room not found",
        });
      }

      res.json({
        success: true,
        message: "Room deleted successfully",
      });
    } catch (error) {
      console.error("Delete room error:", error);
      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Internal server error",
      });
    }
  },

  //update gst
  updateRoomGST: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;
      const { gst_percentage, service_charge_percentage } = req.body;

      console.log("Received update request:", {
        id,
        hotelId,
        gst_percentage,
        service_charge_percentage,
      });

      // Validate that at least one field is provided
      if (
        gst_percentage === undefined &&
        service_charge_percentage === undefined
      ) {
        return res.status(400).json({
          success: false,
          error: "NO_DATA",
          message:
            "No update data provided. Please provide gst_percentage or service_charge_percentage",
        });
      }

      // Convert to numbers for validation
      const gstPct =
        gst_percentage !== undefined ? parseFloat(gst_percentage) : undefined;
      const servicePct =
        service_charge_percentage !== undefined
          ? parseFloat(service_charge_percentage)
          : undefined;

      // Validate numerical values
      if (
        gstPct !== undefined &&
        (isNaN(gstPct) || gstPct < 0 || gstPct > 100)
      ) {
        return res.status(400).json({
          success: false,
          error: "INVALID_DATA",
          message: "GST percentage must be between 0 and 100",
        });
      }

      if (
        servicePct !== undefined &&
        (isNaN(servicePct) || servicePct < 0 || servicePct > 100)
      ) {
        return res.status(400).json({
          success: false,
          error: "INVALID_DATA",
          message: "Service charge percentage must be between 0 and 100",
        });
      }

      const updated = await Room.updategst(id, hotelId, {
        gst_percentage: gstPct,
        service_charge_percentage: servicePct,
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: "ROOM_NOT_FOUND",
          message: "Room not found",
        });
      }

      res.json({
        success: true,
        message: "Room tax settings updated successfully",
      });
    } catch (error) {
      console.error("Update room GST error:", error);
      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: error.message || "Internal server error",
      });
    }
  },

  // roomController.js - Add this method
  createMultipleRooms: async (req, res) => {
    try {
      const {
        room_number_start,
        room_number_end,
        type,
        floor,
        price,
        amenities,
        status,
        gst_percentage,
        service_charge_percentage,
      } = req.body;

      const hotelId = req.user.hotel_id;
      const createdRooms = [];
      const errors = [];

      // Validate room range
      const startNum = parseInt(room_number_start);
      const endNum = parseInt(room_number_end);

      if (startNum > endNum) {
        return res.status(400).json({
          success: false,
          error: "INVALID_RANGE",
          message:
            "Start room number must be less than or equal to end room number",
        });
      }

      // Check if any rooms in range already exist
      for (let i = startNum; i <= endNum; i++) {
        const roomExists = await Room.checkRoomNumberExists(
          hotelId,
          i.toString(),
        );
        if (roomExists) {
          errors.push(`Room ${i} already exists`);
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "ROOMS_EXIST",
          message: "Some rooms already exist",
          details: errors,
        });
      }

      // Create rooms
      for (let i = startNum; i <= endNum; i++) {
        const roomId = await Room.create({
          hotel_id: hotelId,
          room_number: i.toString(),
          type,
          floor,
          price,
          amenities,
          status,
          gst_percentage: gst_percentage || 12.0,
          service_charge_percentage: service_charge_percentage || 0.0,
        });

        createdRooms.push({
          room_number: i.toString(),
          roomId,
        });
      }

      res.status(201).json({
        success: true,
        message: `${createdRooms.length} rooms created successfully`,
        createdRooms,
      });
    } catch (error) {
      console.error("Create multiple rooms error:", error);
      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Internal server error",
      });
    }
  },

  // Create multiple rooms (literal list)
  createBatchMultipleRooms: async (req, res) => {
    try {
      const { rooms } = req.body;
      const hotelId = req.user.hotel_id;

      if (!Array.isArray(rooms) || rooms.length === 0) {
        return res.status(400).json({
          success: false,
          error: "INVALID_DATA",
          message: "Rooms array is required and must not be empty",
        });
      }

      const createdRooms = [];
      const errors = [];

      // Check if any rooms already exist
      for (const room of rooms) {
        const roomExists = await Room.checkRoomNumberExists(
          hotelId,
          room.room_number.toString(),
        );
        if (roomExists) {
          errors.push(`Room ${room.room_number} already exists`);
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "ROOMS_EXIST",
          message: "Some rooms already exist",
          details: errors,
        });
      }

      // Create rooms
      for (const roomData of rooms) {
        const roomId = await Room.create({
          hotel_id: hotelId,
          room_number: roomData.room_number.toString(),
          type: roomData.type,
          floor: roomData.floor || 1,
          price: roomData.price || 0.0,
          amenities: roomData.amenities || "",
          status: roomData.status || "available",
          gst_percentage: roomData.gst_percentage || 12.0,
          service_charge_percentage: roomData.service_charge_percentage || 0.0,
        });

        createdRooms.push({
          room_number: roomData.room_number,
          roomId,
        });
      }

      res.status(201).json({
        success: true,
        message: `${createdRooms.length} rooms created successfully`,
        createdRooms,
      });
    } catch (error) {
      console.error("Create batch multiple rooms error:", error);
      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Internal server error",
      });
    }
  },

  // In roomController.js - Add this new debug method
  debugGetRooms: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;

      console.log("🔍 DEBUG: Getting rooms for hotel_id:", hotelId);

      // 1. First, let's check if the rooms table exists and has data
      const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
    `);
      console.log(
        "📊 Available tables:",
        tables.map((t) => t.TABLE_NAME),
      );

      // 2. Check if rooms table exists and has any rows
      const [roomCount] = await pool.execute(
        `
      SELECT COUNT(*) as count FROM rooms WHERE hotel_id = ?
    `,
        [hotelId],
      );
      console.log("📊 Room count for hotel:", roomCount[0].count);

      // 3. Get all rooms without any filters
      const [rooms] = await pool.execute(
        `
      SELECT * FROM rooms WHERE hotel_id = ?
    `,
        [hotelId],
      );
      console.log("📊 Raw rooms data:", rooms);

      // 4. Check if there are any bookings that might affect availability
      const [bookings] = await pool.execute(
        `
      SELECT * FROM bookings 
      WHERE hotel_id = ? 
      AND status IN ('booked', 'blocked', 'maintenance')
    `,
        [hotelId],
      );
      console.log("📊 Active bookings:", bookings);

      // 5. Try the exact query used in getAvailableRooms
      const [availableRooms] = await pool.execute(
        `
      SELECT r.* 
      FROM rooms r
      WHERE r.hotel_id = ? 
      AND r.status = 'available'
    `,
        [hotelId],
      );
      console.log("📊 Available rooms (status=available):", availableRooms);

      res.json({
        success: true,
        data: {
          hotel_id: hotelId,
          room_count: roomCount[0].count,
          rooms: rooms,
          available_rooms: availableRooms,
          bookings: bookings,
          tables: tables.map((t) => t.TABLE_NAME),
        },
      });
    } catch (error) {
      console.error("❌ Debug error:", error);
      res.status(500).json({
        success: false,
        error: "DEBUG_ERROR",
        message: error.message,
        stack: error.stack,
      });
    }
  },
};

module.exports = roomController;
