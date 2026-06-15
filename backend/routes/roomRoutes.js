const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Routes accessible to both admin and staff
router.get('/', roomController.getRooms);
router.get('/available', roomController.getAvailableRooms);
router.get('/:id', roomController.getRoom);
router.get('/debug/rooms', roomController.debugGetRooms);

// Only admin can manage rooms
router.post('/', authorize(['admin']), roomController.createRoom);
router.put('/:id', authorize(['admin']), roomController.updateRoom);
router.patch('/:id/status', authorize(['admin']), roomController.updateRoomStatus);
router.put('/:id/gst', authorize(['admin']), roomController.updateRoomGST);
router.delete('/:id', authorize(['admin']), roomController.deleteRoom);
// roomRoutes.js - Add this route
router.post('/batch', authorize(['admin']), roomController.createMultipleRooms);
router.post('/batch-multiple', authorize(['admin']), roomController.createBatchMultipleRooms);
module.exports = router;