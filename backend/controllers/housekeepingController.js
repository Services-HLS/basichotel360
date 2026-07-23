const Housekeeping = require('../models/Housekeeping');

class HousekeepingController {
  // Get all housekeeping records with filters
//   static async getRecords(req, res) {
//     try {
//       const { hotel_id } = req.user;
//       const {
//         date,
//         status = 'all',
//         cleaning_type = 'all',
//         room_number,
//         housekeeper_id = 'all',
//         search,
//         limit = 100,
//         offset = 0
//       } = req.query;

//       // Validate date (default to today)
//       const targetDate = date || new Date().toISOString().split('T')[0];

//       // Get records
//       const records = await Housekeeping.getRecords(hotel_id, {
//         date: targetDate,
//         status,
//         cleaning_type,
//         room_number,
//         housekeeper_id,
//         search,
//         limit,
//         offset
//       });

//       // Get summary
//       const summary = await Housekeeping.getSummary(hotel_id, targetDate);

//       res.json({
//         success: true,
//         message: 'Housekeeping records retrieved successfully',
//         data: {
//           records,
//           summary
//         }
//       });
//     } catch (error) {
//       console.error('Error in getRecords:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to retrieve housekeeping records',
//         error: error.message
//       });
//     }
//   }

static async getRecords(req, res) {
  try {
    const { hotel_id } = req.user;
    const {
      date,
      status = 'all',
      cleaning_type = 'all',
      room_number,
      housekeeper_id = 'all',
      search,
      limit = 100,
      offset = 0
    } = req.query;

    // Validate date (default to today)
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Get records
    const records = await Housekeeping.getRecords(hotel_id, {
      date: targetDate,
      status,
      cleaning_type,
      room_number,
      housekeeper_id,
      search,
      limit,
      offset
    });

    // Get summary - handle potential errors
    let summary;
    try {
      summary = await Housekeeping.getSummary(hotel_id, targetDate);
    } catch (summaryError) {
      console.error('Error getting summary, using fallback:', summaryError);
      summary = {
        pending: 0,
        in_progress: 0,
        completed: 0,
        delayed: 0,
        total_today: 0,
        completion_rate: 0
      };
    }

    res.json({
      success: true,
      message: 'Housekeeping records retrieved successfully',
      data: {
        records,
        summary
      }
    });
  } catch (error) {
    console.error('Error in getRecords:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve housekeeping records',
      error: error.message,
      data: {
        records: [],
        summary: {
          pending: 0,
          in_progress: 0,
          completed: 0,
          delayed: 0,
          total_today: 0,
          completion_rate: 0
        }
      }
    });
  }
}

  // Create new housekeeping record
  static async createRecord(req, res) {
    try {
      const { hotel_id, id: userId } = req.user;
      const {
        room_id,
        booking_id,
        room_number,
        housekeeper_id,
        checkin_date,
        checkout_date,
        cleaning_date,
        cleaning_type = 'daily',
        notes,
        status = 'pending'
      } = req.body;

      // Validate required fields
      if (!room_id || !cleaning_date) {
        return res.status(400).json({
          success: false,
          message: 'Room ID and cleaning date are required'
        });
      }

      // Get housekeeper name if provided
      let housekeeper_name = null;
      if (housekeeper_id) {
        // You might want to fetch this from users table
        // For now, we'll use a placeholder
        housekeeper_name = 'Housekeeper';
      }

      // Get room number if not provided
      let finalRoomNumber = room_number;
      if (!finalRoomNumber) {
        // Fetch room number from rooms table
        // This is a simplified version - implement actual query
        finalRoomNumber = `Room-${room_id}`;
      }

      const recordData = {
        hotel_id,
        room_id,
        booking_id: booking_id || null,
        room_number: finalRoomNumber,
        housekeeper_id: housekeeper_id || null,
        housekeeper_name,
        checkin_date: checkin_date || null,
        checkout_date: checkout_date || null,
        cleaning_date,
        cleaning_type,
        status,
        notes: notes || '',
        created_by: userId
      };

      const recordId = await Housekeeping.create(recordData);

      // Get the created record
      const record = await Housekeeping.getById(recordId, hotel_id);

      res.status(201).json({
        success: true,
        message: 'Housekeeping record created successfully',
        data: record
      });
    } catch (error) {
      console.error('Error in createRecord:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create housekeeping record',
        error: error.message
      });
    }
  }

  // Get housekeeping record by ID
  static async getRecord(req, res) {
    try {
      const { hotel_id } = req.user;
      const { id } = req.params;

      const record = await Housekeeping.getById(id, hotel_id);

      if (!record) {
        return res.status(404).json({
          success: false,
          message: 'Housekeeping record not found'
        });
      }

      res.json({
        success: true,
        message: 'Record retrieved successfully',
        data: record
      });
    } catch (error) {
      console.error('Error in getRecord:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve record',
        error: error.message
      });
    }
  }

  // Update housekeeping record
  static async updateRecord(req, res) {
    try {
      const { hotel_id, id: userId } = req.user;
      const { id } = req.params;
      const updateData = req.body;

      // Check if record exists
      const existingRecord = await Housekeeping.getById(id, hotel_id);
      if (!existingRecord) {
        return res.status(404).json({
          success: false,
          message: 'Housekeeping record not found'
        });
      }

      // Update the record
      const updated = await Housekeeping.update(id, hotel_id, updateData);

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'Failed to update record'
        });
      }

      // Get updated record
      const record = await Housekeeping.getById(id, hotel_id);

      res.json({
        success: true,
        message: 'Record updated successfully',
        data: record
      });
    } catch (error) {
      console.error('Error in updateRecord:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update record',
        error: error.message
      });
    }
  }

  // Mark record as completed
  static async completeRecord(req, res) {
    try {
      const { hotel_id, id: userId } = req.user;
      const { id } = req.params;

      // Check if record exists
      const existingRecord = await Housekeeping.getById(id, hotel_id);
      if (!existingRecord) {
        return res.status(404).json({
          success: false,
          message: 'Housekeeping record not found'
        });
      }

      // Mark as completed
      const completed = await Housekeeping.markAsCompleted(id, hotel_id, userId);

      if (!completed) {
        return res.status(400).json({
          success: false,
          message: 'Failed to mark record as completed'
        });
      }

      // Get updated record
      const record = await Housekeeping.getById(id, hotel_id);

      res.json({
        success: true,
        message: 'Record marked as completed',
        data: record
      });
    } catch (error) {
      console.error('Error in completeRecord:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete record',
        error: error.message
      });
    }
  }

  // Delete housekeeping record
  static async deleteRecord(req, res) {
    try {
      const { hotel_id } = req.user;
      const { id } = req.params;

      // Check if record exists
      const existingRecord = await Housekeeping.getById(id, hotel_id);
      if (!existingRecord) {
        return res.status(404).json({
          success: false,
          message: 'Housekeeping record not found'
        });
      }

      // Delete the record
      const deleted = await Housekeeping.delete(id, hotel_id);

      if (!deleted) {
        return res.status(400).json({
          success: false,
          message: 'Failed to delete record'
        });
      }

      res.json({
        success: true,
        message: 'Record deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteRecord:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete record',
        error: error.message
      });
    }
  }

  // Get available housekeepers
  static async getHousekeepers(req, res) {
    try {
      const { hotel_id } = req.user;

      const housekeepers = await Housekeeping.getHousekeepers(hotel_id);

      res.json({
        success: true,
        message: 'Housekeepers retrieved successfully',
        data: housekeepers
      });
    } catch (error) {
      console.error('Error in getHousekeepers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve housekeepers',
        error: error.message
      });
    }
  }

  // Get available rooms
  static async getRooms(req, res) {
    try {
      const { hotel_id } = req.user;

      const rooms = await Housekeeping.getAllRooms(hotel_id);

      res.json({
        success: true,
        message: 'Rooms retrieved successfully',
        data: rooms
      });
    } catch (error) {
      console.error('Error in getRooms:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve rooms',
        error: error.message
      });
    }
  }

  // Get rooms needing cleaning
  static async getRoomsNeedingCleaning(req, res) {
    try {
      const { hotel_id } = req.user;
      const { date } = req.query;

      const rooms = await Housekeeping.getRoomsNeedingCleaning(hotel_id, date);

      res.json({
        success: true,
        message: 'Rooms needing cleaning retrieved successfully',
        data: rooms
      });
    } catch (error) {
      console.error('Error in getRoomsNeedingCleaning:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve rooms needing cleaning',
        error: error.message
      });
    }
  }

  // Auto-create tasks from checkouts
  static async autoCreateTasks(req, res) {
    try {
      const { hotel_id } = req.user;

      const createdCount = await Housekeeping.autoCreateFromCheckouts(hotel_id);

      res.json({
        success: true,
        message: `Created ${createdCount} checkout cleaning tasks`,
        data: { count: createdCount }
      });
    } catch (error) {
      console.error('Error in autoCreateTasks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to auto-create tasks',
        error: error.message
      });
    }
  }

  // Get weekly schedule
  static async getWeeklySchedule(req, res) {
    try {
      const { hotel_id } = req.user;
      const { startDate } = req.query;

      if (!startDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date is required'
        });
      }

      const schedule = await Housekeeping.getWeeklySchedule(hotel_id, startDate);

      res.json({
        success: true,
        message: 'Weekly schedule retrieved successfully',
        data: schedule
      });
    } catch (error) {
      console.error('Error in getWeeklySchedule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve weekly schedule',
        error: error.message
      });
    }
  }

  // Get dashboard statistics
  static async getDashboardStats(req, res) {
    try {
      const { hotel_id } = req.user;
      const { startDate, endDate } = req.query;

      // Get today's summary
      const todaySummary = await Housekeeping.getSummary(hotel_id);

      // Get housekeepers performance
      const [housekeeperStats] = await pool.execute(`
        SELECT 
          h.housekeeper_name,
          COUNT(*) as total_tasks,
          SUM(CASE WHEN h.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
          ROUND(
            (SUM(CASE WHEN h.status = 'completed' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 
            2
          ) as completion_rate
        FROM housekeeping h
        WHERE h.hotel_id = ?
          AND h.housekeeper_name IS NOT NULL
          AND h.cleaning_date BETWEEN ? AND ?
        GROUP BY h.housekeeper_name
        ORDER BY completion_rate DESC
      `, [hotel_id, startDate || new Date().toISOString().split('T')[0], 
          endDate || new Date().toISOString().split('T')[0]]);

      res.json({
        success: true,
        message: 'Dashboard stats retrieved successfully',
        data: {
          today_summary: todaySummary,
          housekeeper_stats: housekeeperStats
        }
      });
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard statistics',
        error: error.message
      });
    }
  }
}

module.exports = HousekeepingController;