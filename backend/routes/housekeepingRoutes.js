const express = require('express');
const router = express.Router();
const HousekeepingController = require('../controllers/housekeepingController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// GET routes (view only - accessible to staff with permission)
router.get('/', 
  authorize(['admin', 'staff'], ['view_housekeeping']), 
  HousekeepingController.getRecords
);

router.get('/housekeepers',
  authorize(['admin', 'staff'], ['view_housekeeping']),
  HousekeepingController.getHousekeepers
);

router.get('/rooms',
  authorize(['admin', 'staff'], ['view_housekeeping']),
  HousekeepingController.getRooms
);

router.get('/rooms-needing-cleaning',
  authorize(['admin', 'staff'], ['view_housekeeping']),
  HousekeepingController.getRoomsNeedingCleaning
);

router.get('/weekly-schedule',
  authorize(['admin', 'staff'], ['view_housekeeping']),
  HousekeepingController.getWeeklySchedule
);

router.get('/dashboard-stats',
  authorize(['admin', 'staff'], ['view_housekeeping']),
  HousekeepingController.getDashboardStats
);

router.get('/:id',
  authorize(['admin', 'staff'], ['view_housekeeping']),
  HousekeepingController.getRecord
);

// POST routes (create/update - requires manage permission)
router.post('/',
  authorize(['admin', 'staff'], ['manage_housekeeping']),
  HousekeepingController.createRecord
);

router.post('/auto-create',
  authorize(['admin'], ['manage_housekeeping']), // Only admin can auto-create
  HousekeepingController.autoCreateTasks
);

router.post('/:id/complete',
  authorize(['admin', 'staff'], ['manage_housekeeping']),
  HousekeepingController.completeRecord
);

// PUT route (update)
router.put('/:id',
  authorize(['admin', 'staff'], ['manage_housekeeping']),
  HousekeepingController.updateRecord
);

// DELETE route
router.delete('/:id',
  authorize(['admin'], ['manage_housekeeping']), // Only admin can delete
  HousekeepingController.deleteRecord
);

module.exports = router;