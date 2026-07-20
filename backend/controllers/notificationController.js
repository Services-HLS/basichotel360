const NotificationDevice = require('../models/NotificationDevice');
const fcmService = require('../services/fcmService');

const notificationController = {
  registerDevice: async (req, res) => {
    try {
      const { token, platform } = req.body || {};
      const userId = req.user.id || req.user.userId;
      const hotelId = req.user.hotel_id;

      if (!token || typeof token !== 'string' || token.trim().length < 20) {
        return res.status(400).json({
          success: false,
          message: 'Valid FCM token is required',
        });
      }

      if (!hotelId) {
        return res.status(400).json({
          success: false,
          message: 'Hotel context is required to register device',
        });
      }

      const deviceId = await NotificationDevice.upsert({
        userId,
        hotelId,
        token: token.trim(),
        platform: platform || 'android',
      });

      console.log('📱 Registered FCM device', {
        deviceId,
        userId,
        hotelId,
        platform: platform || 'android',
      });

      return res.json({
        success: true,
        message: 'Device registered for push notifications',
        data: {
          deviceId,
          fcmConfigured: fcmService.isConfigured(),
        },
      });
    } catch (error) {
      console.error('registerDevice error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to register device token',
      });
    }
  },

  unregisterDevice: async (req, res) => {
    try {
      const { token } = req.body || {};
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'FCM token is required',
        });
      }

      await NotificationDevice.deactivateToken(token.trim());

      return res.json({
        success: true,
        message: 'Device unregistered',
      });
    } catch (error) {
      console.error('unregisterDevice error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to unregister device token',
      });
    }
  },

  getStatus: async (req, res) => {
    try {
      const userId = req.user.id || req.user.userId;
      const hotelId = req.user.hotel_id;
      const userTokens = await NotificationDevice.getActiveTokensForUser(userId);
      const hotelDevices = await NotificationDevice.listForHotel(hotelId);

      return res.json({
        success: true,
        data: {
          fcm: fcmService.getStatus(),
          myActiveDevices: userTokens.length,
          hotelRegisteredDevices: hotelDevices.filter((d) => d.is_active).length,
          devices: hotelDevices,
        },
      });
    } catch (error) {
      console.error('getNotificationStatus error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to load notification status',
      });
    }
  },

  sendTest: async (req, res) => {
    try {
      const userId = req.user.id || req.user.userId;
      const {
        title = 'Hotel360 test',
        message = 'Push notifications are working.',
        module = 'account',
        entityId,
        route = '/dashboard',
      } = req.body || {};

      const devices = await NotificationDevice.getActiveTokensForUser(userId);
      const tokens = devices.map((d) => d.fcm_token);

      if (tokens.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No registered devices found for this user. Open the APK and login first.',
        });
      }

      const result = await fcmService.sendToTokens(tokens, {
        id: `test-${Date.now()}`,
        title,
        message,
        module,
        entityId,
        route,
        priority: 'high',
      });

      if (result.invalidTokens?.length) {
        await Promise.all(
          result.invalidTokens.map((token) => NotificationDevice.deactivateToken(token))
        );
      }

      if (!fcmService.isConfigured()) {
        return res.status(503).json({
          success: false,
          message:
            'Device token saved, but Firebase Admin is not configured on the server. Add firebase-service-account.json or FIREBASE_SERVICE_ACCOUNT_JSON to send pushes from backend.',
          data: {
            registeredTokens: tokens.length,
            fcm: fcmService.getStatus(),
          },
        });
      }

      return res.json({
        success: result.successCount > 0,
        message:
          result.successCount > 0
            ? `Test push sent to ${result.successCount} device(s)`
            : 'Failed to send test push',
        data: result,
      });
    } catch (error) {
      console.error('sendTest notification error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to send test notification',
      });
    }
  },
};

module.exports = notificationController;
