

const express = require('express');
const router = express.Router();
const collectionController = require('../controllers/collectionController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// GET collections
router.get('/',
  authorize(['admin', 'staff'], ['view_collections']),
  collectionController.getCollections
);

// GET export collections
router.get('/export',
  authorize(['admin', 'staff'], ['view_collections']),
  collectionController.exportCollections
);

// GET cash bookings
router.get('/cash-bookings',
  authorize(['admin', 'staff'], ['view_collections']),
  collectionController.getCashBookings
);

// GET handover history (ledger)
router.get('/handovers',
  authorize(['admin', 'staff'], ['view_collections']),
  collectionController.getHandoverHistory
);

// GET unique handover types
router.get('/handover-types',
  authorize(['admin', 'staff'], ['view_collections']),
  collectionController.getHandoverTypes
);

// POST create new collection
router.post('/',
  authorize(['admin', 'staff'], ['manage_collections']),
  collectionController.createCollection
);

// POST handover cash
router.post('/:id/handover',
  authorize(['admin', 'staff'], ['manage_collections']),
  collectionController.handoverCash
);

// POST bulk handover (Total Balance)
router.post('/bulk-handover',
  authorize(['admin', 'staff'], ['manage_collections']),
  collectionController.bulkHandover
);

// GET test endpoint
router.get('/test',
  authorize(['admin', 'staff'], ['view_collections']),
  collectionController.testCollections
);

module.exports = router;