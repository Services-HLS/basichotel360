// controllers/whatsappTestController.js
const whatsappService = require('../services/whatsappService');

class WhatsAppTestController {
  /**
   * Test endpoint for Postman - Send hotel update notification
   * POST /api/whatsapp/test-hotel-update
   */
  async testHotelUpdate(req, res) {
    try {
      const { 
        customerName, 
        requestId, 
        customerPhone,
        template = 'hotel_update_notification'
      } = req.body;

      // Validate required fields
      if (!customerName || !requestId || !customerPhone) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          required: ['customerName', 'requestId', 'customerPhone']
        });
      }

      console.log('🧪 Postman Test - Hotel Update Notification');
      console.log(`   Request Body:`, req.body);

      // Send WhatsApp message
      const result = await whatsappService.sendHotelUpdateNotification(
        customerName,
        requestId,
        customerPhone
      );

      // Prepare response
      const response = {
        success: result.success,
        message: result.success 
          ? 'WhatsApp message sent successfully' 
          : 'Failed to send WhatsApp message',
        data: {
          timestamp: new Date().toISOString(),
          template: template,
          fromNumber: `+${whatsappService.config.sender}`,
          toNumber: `+${result.phone || customerPhone}`,
          parameters: [customerName, requestId],
          apiResponse: result.data || result.error,
          debug: {
            customerName,
            requestId,
            customerPhone,
            formattedPhone: result.phone
          }
        },
        error: result.error || null
      };

      // Log full details
      console.log('📊 WhatsApp Test Result:', JSON.stringify(response, null, 2));

      res.json(response);

    } catch (error) {
      console.error('❌ Postman Test Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during WhatsApp test',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Test endpoint for Postman - Send booking confirmation
   * POST /api/whatsapp/test-booking-confirmation
   */
  async testBookingConfirmation(req, res) {
    try {
      const { 
        customerName,
        customerPhone,
        bookingId,
        roomNumber,
        checkInDate,
        checkInTime = '14:00',
        checkOutDate,
        checkOutTime = '12:00',
        hotelName = 'Test Hotel'
      } = req.body;

      // Validate required fields
      if (!customerName || !customerPhone || !bookingId || !checkInDate || !checkOutDate) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          required: ['customerName', 'customerPhone', 'bookingId', 'checkInDate', 'checkOutDate']
        });
      }

      console.log('🧪 Postman Test - Booking Confirmation');
      console.log(`   Request Body:`, req.body);

      // Create mock booking details
      const bookingDetails = {
        id: bookingId,
        room_number: roomNumber || '101',
        from_date: checkInDate,
        from_time: checkInTime,
        to_date: checkOutDate,
        to_time: checkOutTime
      };

      const customerDetails = {
        name: customerName,
        phone: customerPhone
      };

      // Send WhatsApp message
      const result = await whatsappService.sendBookingConfirmation(
        bookingDetails,
        hotelName,
        customerDetails
      );

      // Prepare response
      const response = {
        success: result.success,
        message: result.success 
          ? 'Booking confirmation sent successfully' 
          : 'Failed to send booking confirmation',
        data: {
          timestamp: new Date().toISOString(),
          template: 'booking_confirmation',
          fromNumber: `+${whatsappService.config.sender}`,
          toNumber: `+${result.phone || customerPhone}`,
          parameters: [
            customerName,
            bookingId,
            roomNumber || '101',
            checkInDate,
            checkInTime,
            checkOutDate,
            checkOutTime,
            hotelName,
            'Contact reception'
          ],
          apiResponse: result.data || result.error,
          debug: {
            customerName,
            customerPhone,
            bookingId,
            roomNumber,
            checkInDate,
            checkOutDate,
            hotelName
          }
        },
        error: result.error || null
      };

      console.log('📊 Booking Test Result:', JSON.stringify(response, null, 2));

      res.json(response);

    } catch (error) {
      console.error('❌ Booking Test Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during booking confirmation test',
        error: error.message
      });
    }
  }

  /**
   * Test configuration and template linkage
   * GET /api/whatsapp/test-config
   */
  async testConfiguration(req, res) {
    try {
      console.log('🧪 Testing WhatsApp Configuration from Postman');

      // Validate configuration
      const configCheck = await whatsappService.validateConfiguration();

      // Test template linkage with a sample number
      const testResults = [];
      const testPhone = '919620300390'; // Replace with your test number

      for (const [key, templateName] of Object.entries(whatsappService.templates)) {
        console.log(`   Testing template: ${templateName}`);

        const params = templateName === 'hotel_update_notification' 
          ? 'John Doe,REQ12345'
          : 'Guest,123,101,20 Mar,14:00,21 Mar,12:00,Test Hotel,Contact';

        const url = `${whatsappService.apiUrl}?user=${whatsappService.config.user}&pass=${whatsappService.config.pass}&sender=${whatsappService.config.sender}&phone=${testPhone}&text=${templateName}&priority=wa&stype=normal&Params=${params}`;

        try {
          const response = await whatsappService.makeRequest(url);
          
          testResults.push({
            template: templateName,
            testPhone: `+${testPhone}`,
            url: url.substring(0, 100) + '...',
            response: response,
            status: response.includes('S.') || response.includes('success') ? 'SUCCESS' : 'FAILED',
            issues: response.includes('not linked') ? 'Template not linked to Business number' : null
          });
        } catch (error) {
          testResults.push({
            template: templateName,
            error: error.message,
            status: 'ERROR'
          });
        }
      }

      res.json({
        success: true,
        message: 'Configuration test completed',
        data: {
          timestamp: new Date().toISOString(),
          configuration: {
            apiUrl: whatsappService.apiUrl,
            businessNumber: `+${whatsappService.config.sender}`,
            templates: whatsappService.templates,
            user: whatsappService.config.user
          },
          configValidation: configCheck,
          templateTests: testResults,
          summary: {
            totalTemplates: Object.keys(whatsappService.templates).length,
            successfulTests: testResults.filter(r => r.status === 'SUCCESS').length,
            failedTests: testResults.filter(r => r.status === 'FAILED').length,
            errors: testResults.filter(r => r.status === 'ERROR').length
          },
          nextSteps: [
            'Check if templates are approved in BhashSMS dashboard',
            'Verify templates are linked to your Business number',
            'Test with actual customer phone numbers'
          ]
        }
      });

    } catch (error) {
      console.error('❌ Config Test Error:', error);
      res.status(500).json({
        success: false,
        message: 'Configuration test failed',
        error: error.message
      });
    }
  }

  /**
   * Quick test with minimal parameters
   * POST /api/whatsapp/quick-test
   */
  async quickTest(req, res) {
    try {
      const { phone, template = 'hotel_update_notification' } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required'
        });
      }

      console.log('🧪 Quick WhatsApp Test');
      console.log(`   Phone: ${phone}, Template: ${template}`);

      let result;
      
      if (template === 'hotel_update_notification') {
        result = await whatsappService.sendHotelUpdateNotification(
          'Test Customer',
          'TEST-' + Date.now(),
          phone
        );
      } else {
        // Use booking confirmation template
        const bookingDetails = {
          id: 'TEST-' + Date.now(),
          room_number: '101',
          from_date: new Date().toISOString().split('T')[0],
          from_time: '14:00',
          to_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          to_time: '12:00'
        };

        const customerDetails = {
          name: 'Test Customer',
          phone: phone
        };

        result = await whatsappService.sendBookingConfirmation(
          bookingDetails,
          'Test Hotel',
          customerDetails
        );
      }

      res.json({
        success: result.success,
        message: result.success ? 'Test message sent' : 'Test failed',
        data: {
          template: template,
          to: `+${result.phone || phone}`,
          from: `+${whatsappService.config.sender}`,
          response: result.data || result.error,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Quick Test Error:', error);
      res.status(500).json({
        success: false,
        message: 'Quick test failed',
        error: error.message
      });
    }
  }
}

module.exports = new WhatsAppTestController();