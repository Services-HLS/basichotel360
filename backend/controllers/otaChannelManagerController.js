const aiosellService = require('../services/aiosellService');
const aiosellReservationService = require('../services/aiosellReservationService');
const Hotel = require('../models/Hotel');

const HOTEL_CODE_REQUIRED_MESSAGE = 'Please enter the hotel code';

async function ensureHotelCodeConfigured(hotelId) {
  const hotel = await Hotel.findById(hotelId);

  if (!hotel?.hotelcode || !String(hotel.hotelcode).trim()) {
    const error = new Error(HOTEL_CODE_REQUIRED_MESSAGE);
    error.code = 'HOTEL_CODE_REQUIRED';
    throw error;
  }

  return hotel;
}

function getPayloadFromBody(body) {
  if (body && body.payload !== undefined) {
    return body.payload;
  }

  return body;
}

function isEmptyPayload(payload) {
  if (!payload) {
    return true;
  }

  if (typeof payload !== 'object') {
    return false;
  }

  return Object.keys(payload).length === 0;
}

function sendAiosellResult(res, label, result) {
  if (result.status >= 200 && result.status < 300) {
    return res.json({
      success: true,
      message: `${label} pushed to AIOSELL successfully`,
      data: result,
    });
  }

  return res.status(502).json({
    success: false,
    message: `AIOSELL rejected the ${label.toLowerCase()} payload`,
    data: result,
  });
}

const otaChannelManagerController = {
  getConfig: async (req, res) => {
    try {
      const publicBaseUrl = `${req.protocol}://${req.get('host')}`;
      const config = await aiosellService.getPublicConfigForHotel(req.user.hotel_id, publicBaseUrl);

      if (!config.hotelCodeConfigured) {
        return res.status(400).json({
          success: false,
          error: 'HOTEL_CODE_REQUIRED',
          message: HOTEL_CODE_REQUIRED_MESSAGE,
        });
      }

      res.json({
        success: true,
        data: config,
      });
    } catch (error) {
      console.error('❌ AIOSELL config error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Failed to load AIOSELL configuration',
      });
    }
  },

  pushInventory: async (req, res) => {
    try {
      await ensureHotelCodeConfigured(req.user.hotel_id);

      const payload = getPayloadFromBody(req.body);

      if (isEmptyPayload(payload)) {
        return res.status(400).json({
          success: false,
          error: 'PAYLOAD_REQUIRED',
          message: 'Inventory payload is required',
        });
      }

      const result = await aiosellService.pushInventory(payload);
      return sendAiosellResult(res, 'Inventory', result);
    } catch (error) {
      console.error('❌ AIOSELL inventory push error:', error);

      if (error.code === 'HOTEL_CODE_REQUIRED') {
        return res.status(400).json({
          success: false,
          error: 'HOTEL_CODE_REQUIRED',
          message: HOTEL_CODE_REQUIRED_MESSAGE,
        });
      }

      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Failed to push inventory to AIOSELL',
      });
    }
  },

  pushRates: async (req, res) => {
    try {
      await ensureHotelCodeConfigured(req.user.hotel_id);

      const payload = getPayloadFromBody(req.body);

      if (isEmptyPayload(payload)) {
        return res.status(400).json({
          success: false,
          error: 'PAYLOAD_REQUIRED',
          message: 'Rates payload is required',
        });
      }

      const result = await aiosellService.pushRates(payload);
      return sendAiosellResult(res, 'Rates', result);
    } catch (error) {
      console.error('❌ AIOSELL rates push error:', error);

      if (error.code === 'HOTEL_CODE_REQUIRED') {
        return res.status(400).json({
          success: false,
          error: 'HOTEL_CODE_REQUIRED',
          message: HOTEL_CODE_REQUIRED_MESSAGE,
        });
      }

      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Failed to push rates to AIOSELL',
      });
    }
  },

  receiveReservation: async (req, res) => {
    try {
      const payload = getPayloadFromBody(req.body);

      if (isEmptyPayload(payload)) {
        return res.status(400).json({
          success: false,
          message: 'Reservation payload is required',
        });
      }

      const result = await aiosellReservationService.processReservation(payload);

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      console.error('❌ AIOSELL reservation webhook error:', error);

      const message = error instanceof Error ? error.message : 'Failed to process reservation';
      const statusCode = message.includes('not found') || message.includes('mapping') ? 400 : 500;

      return res.status(statusCode).json({
        success: false,
        message,
      });
    }
  },
};

module.exports = otaChannelManagerController;
