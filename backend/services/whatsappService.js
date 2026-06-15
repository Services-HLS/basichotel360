

// services/whatsappService.js
const http = require('http');

class WhatsAppService {
  constructor() {
    this.apiUrl = 'http://bhashsms.com/api/sendmsgutil.php';

    // Configuration for US WhatsApp Business Number
    this.config = {
      user: process.env.BHASH_SMS_USER || 'Hithlakshapi',
      pass: process.env.BHASH_SMS_PASS || '123456',
      // Your US WhatsApp Business number in international format (no spaces/special chars)
      sender: '15557987176' // +1 (555) 798-7176
    };

    // Your approved templates
    this.templates = {
      BOOKING_CONFIRMATION: 'hotel_booking_confirmation_update',
      CHECKOUT_REMINDER: 'checkout_time_reminder_alert',
      HOTEL_UPDATE_NOTIFICATION: 'hotel_update_notification'
    };

    console.log('📱 WhatsApp Service Initialized:');
    console.log(`   US Business Number: +${this.config.sender}`);
    console.log(`   Templates: ${Object.values(this.templates).join(', ')}`);
  }

  // Format phone number for international WhatsApp
  formatPhoneNumber(phone) {
    if (!phone || phone.trim() === '') return null;

    try {
      // Remove all non-digit characters
      let cleanPhone = phone.replace(/\D/g, '');

      // Handle Indian numbers
      if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
        // Keep Indian number with 91 prefix for WhatsApp
        return cleanPhone;
      }

      // Handle numbers starting with 0 (Indian local)
      if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
        return '91' + cleanPhone.substring(1);
      }

      // Handle 10-digit Indian numbers
      if (cleanPhone.length === 10) {
        return '91' + cleanPhone;
      }

      // Handle US/Canada numbers (already in +1XXXXXXXXXX format)
      if (cleanPhone.startsWith('1') && (cleanPhone.length === 11 || cleanPhone.length === 10)) {
        return cleanPhone;
      }

      // For other countries, ensure country code is present
      // You might need to adjust this based on your target audience
      console.warn(`⚠️ Phone number may need country code: ${phone} (cleaned: ${cleanPhone})`);

      // Return as-is if it looks like an international number
      return cleanPhone;

    } catch (error) {
      console.error('Phone formatting error:', error);
      return null;
    }
  }

  // Make HTTP GET request
  makeRequest(url) {
    return new Promise((resolve, reject) => {
      http.get(url, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          console.log(`📱 WhatsApp API Response: ${data}`);
          resolve(data);
        });

        response.on('error', (error) => {
          reject(error);
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Send hotel update notification using template
   * Template: hotel_update_notification
   * Parameters: {{1}} = Customer Name, {{2}} = Request ID
   */
  async sendHotelUpdateNotification(customerName, requestId, customerPhone) {
    try {
      // Format phone number
      const phone = this.formatPhoneNumber(customerPhone);
      if (!phone) {
        console.log(`⚠️ No valid phone number for request ${requestId}`);
        return { success: false, error: 'Invalid phone number' };
      }

      console.log('📱 Sending Hotel Update Notification:');
      console.log(`   From: +${this.config.sender} (US WhatsApp Business)`);
      console.log(`   To: +${phone}`);
      console.log(`   Template: ${this.templates.HOTEL_UPDATE_NOTIFICATION}`);
      console.log(`   Customer: ${customerName}`);
      console.log(`   Request ID: ${requestId}`);

      // Prepare parameters for template
      // Template expects: {{1}} = Customer Name, {{2}} = Request ID
      const params = [
        customerName || 'Guest',  // {{1}}
        requestId || 'N/A'        // {{2}}
      ].join(',');

      console.log(`   Parameters: ${params}`);

      // Construct URL for WhatsApp Business API
      // Using priority=wa for WhatsApp, stype=normal for utility templates
      const url = `${this.apiUrl}?user=${encodeURIComponent(this.config.user)}&pass=${encodeURIComponent(this.config.pass)}&sender=${encodeURIComponent(this.config.sender)}&phone=${phone}&text=${encodeURIComponent(this.templates.HOTEL_UPDATE_NOTIFICATION)}&priority=wa&stype=normal&Params=${encodeURIComponent(params)}`;

      console.log(`📱 API URL: ${url.substring(0, 150)}...`);

      // Make the request
      const response = await this.makeRequest(url);

      // Parse response
      const isSuccess = response.includes('S.') ||
        response.includes('success') ||
        response.includes('queued') ||
        response.includes('Message sent');

      if (isSuccess) {
        console.log(`✅ WhatsApp sent successfully for request ${requestId}`);
      } else {
        console.log(`❌ WhatsApp failed for request ${requestId}: ${response}`);

        // Check for specific errors
        if (response.includes('not linked') || response.includes('not associated')) {
          console.log('🔴 CRITICAL: Template not linked to WhatsApp Business number');
          console.log('   Solution: Contact BhashSMS support to link your template');
          console.log(`   Template: ${this.templates.HOTEL_UPDATE_NOTIFICATION}`);
          console.log(`   Business Number: +${this.config.sender}`);
        }

        if (response.includes('invalid phone')) {
          console.log('🔴 Invalid phone number format');
          console.log('   Solution: Ensure phone has country code (e.g., 91XXXXXXXXXX for India)');
        }
      }

      return {
        success: isSuccess,
        data: response,
        template: this.templates.HOTEL_UPDATE_NOTIFICATION,
        phone: phone,
        customerName: customerName,
        requestId: requestId,
        fromNumber: this.config.sender
      };

    } catch (error) {
      console.error(`❌ WhatsApp error for request ${requestId}:`, error.message);
      return {
        success: false,
        error: error.message,
        template: this.templates.HOTEL_UPDATE_NOTIFICATION
      };
    }
  }

  /**
   * Send booking confirmation using hotel_booking_confirmation_update template
   * Template: hotel_booking_confirmation_update
   * Parameters: {{1}} = Customer Name, {{2}} = Booking ID, {{3}} = Hotel Name, 
   *             {{4}} = Check-in Date, {{5}} = Check-in Time, {{6}} = Check-out Date, {{7}} = Check-out Time
   */
  // async sendBookingConfirmation(bookingDetails, hotelName, customerDetails) {
  //   try {
  //     const phone = this.formatPhoneNumber(customerDetails.phone);
  //     if (!phone) {
  //       console.log(`⚠️ No valid phone number for booking ${bookingDetails.id}`);
  //       return { success: false, error: 'Invalid phone number' };
  //     }

  //     // Format dates for WhatsApp
  //     const formatDateForWhatsApp = (dateStr) => {
  //       if (!dateStr) return 'Not specified';
  //       try {
  //         const date = new Date(dateStr);
  //         return date.toLocaleDateString('en-IN', {
  //           day: 'numeric', 
  //           month: 'short', 
  //           year: 'numeric'
  //         });
  //       } catch (error) {
  //         return dateStr;
  //       }
  //     };

  //     // Format times - ensure proper format
  //     const formatTimeForWhatsApp = (timeStr) => {
  //       if (!timeStr) return '2:00 PM';
  //       try {
  //         // If time is in HH:MM format
  //         if (typeof timeStr === 'string' && timeStr.includes(':')) {
  //           const [hours, minutes] = timeStr.split(':');
  //           const hour = parseInt(hours);
  //           const ampm = hour >= 12 ? 'PM' : 'AM';
  //           const hour12 = hour % 12 || 12;
  //           return `${hour12}:${minutes} ${ampm}`;
  //         }
  //         return timeStr;
  //       } catch (error) {
  //         return timeStr;
  //       }
  //     };

  //     // Prepare parameters for template
  //     // Template expects: {{1}} = Customer Name, {{2}} = Booking ID, {{3}} = Hotel Name,
  //     // {{4}} = Check-in Date, {{5}} = Check-in Time, {{6}} = Check-out Date, {{7}} = Check-out Time
  //     const params = [
  //       customerDetails.name || 'Guest',                    // {{1}}
  //       bookingDetails.id?.toString() || 'N/A',             // {{2}}
  //       hotelName || 'Hotel Management',                     // {{3}}
  //       formatDateForWhatsApp(bookingDetails.from_date),     // {{4}}
  //       formatTimeForWhatsApp(bookingDetails.from_time),     // {{5}}
  //       formatDateForWhatsApp(bookingDetails.to_date),       // {{6}}
  //       formatTimeForWhatsApp(bookingDetails.to_time)        // {{7}}
  //     ].join(',');

  //     console.log('📱 Sending Booking Confirmation:');
  //     console.log(`   Template: ${this.templates.BOOKING_CONFIRMATION}`);
  //     console.log(`   To: +${phone}`);
  //     console.log(`   Customer: ${customerDetails.name}`);
  //     console.log(`   Booking ID: ${bookingDetails.id}`);
  //     console.log(`   Check-in: ${formatDateForWhatsApp(bookingDetails.from_date)} at ${formatTimeForWhatsApp(bookingDetails.from_time)}`);
  //     console.log(`   Check-out: ${formatDateForWhatsApp(bookingDetails.to_date)} at ${formatTimeForWhatsApp(bookingDetails.to_time)}`);

  //     const url = `${this.apiUrl}?user=${encodeURIComponent(this.config.user)}&pass=${encodeURIComponent(this.config.pass)}&sender=${encodeURIComponent(this.config.sender)}&phone=${phone}&text=${encodeURIComponent(this.templates.BOOKING_CONFIRMATION)}&priority=wa&stype=normal&Params=${encodeURIComponent(params)}`;

  //     const response = await this.makeRequest(url);

  //     const isSuccess = response.includes('S.') || response.includes('success') || response.includes('queued') || response.includes('Message sent');

  //     if (isSuccess) {
  //       console.log(`✅ WhatsApp confirmation sent for booking ${bookingDetails.id}`);
  //     } else {
  //       console.log(`❌ WhatsApp confirmation failed: ${response}`);
  //     }

  //     return {
  //       success: isSuccess,
  //       data: response,
  //       template: this.templates.BOOKING_CONFIRMATION,
  //       phone: phone,
  //       customerName: customerDetails.name,
  //       bookingId: bookingDetails.id,
  //       fromNumber: this.config.sender
  //     };

  //   } catch (error) {
  //     console.error(`❌ WhatsApp error:`, error.message);
  //     return { success: false, error: error.message };
  //   }
  // }


  /**
   * Send booking confirmation to CUSTOMER
   * Template: hotel_booking_confirmation_update
   * Parameters: {{1}} = Customer Name, {{2}} = Booking ID, {{3}} = Hotel Name, 
   *             {{4}} = Check-in Date, {{5}} = Check-in Time, {{6}} = Check-out Date, {{7}} = Check-out Time
   */
  async sendBookingConfirmationToCustomer(bookingDetails, hotelName, customerDetails) {
    try {
      const phone = this.formatPhoneNumber(customerDetails.phone);
      if (!phone) {
        console.log(`⚠️ No valid phone number for customer - booking ${bookingDetails.id}`);
        return { success: false, error: 'Invalid customer phone number' };
      }

      // Format dates for WhatsApp
      const formatDateForWhatsApp = (dateStr) => {
        if (!dateStr) return 'Not specified';
        try {
          const date = new Date(dateStr);
          return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });
        } catch (error) {
          return dateStr;
        }
      };

      // Format times
      const formatTimeForWhatsApp = (timeStr) => {
        if (!timeStr) return '2:00 PM';
        try {
          if (typeof timeStr === 'string' && timeStr.includes(':')) {
            const [hours, minutes] = timeStr.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            return `${hour12}:${minutes} ${ampm}`;
          }
          return timeStr;
        } catch (error) {
          return timeStr;
        }
      };

      // Prepare parameters for customer template
      const params = [
        customerDetails.name || 'Guest',                    // {{1}}
        bookingDetails.id?.toString() || 'N/A',             // {{2}}
        hotelName || 'Hotel Management',                     // {{3}}
        formatDateForWhatsApp(bookingDetails.from_date),     // {{4}}
        formatTimeForWhatsApp(bookingDetails.from_time),     // {{5}}
        formatDateForWhatsApp(bookingDetails.to_date),       // {{6}}
        formatTimeForWhatsApp(bookingDetails.to_time)        // {{7}}
      ].join(',');

      console.log('📱 Sending Booking Confirmation to CUSTOMER:');
      console.log(`   Template: ${this.templates.BOOKING_CONFIRMATION}`);
      console.log(`   To: +${phone}`);
      console.log(`   Customer: ${customerDetails.name}`);
      console.log(`   Parameters: ${params}`);

      const url = `${this.apiUrl}?user=${encodeURIComponent(this.config.user)}&pass=${encodeURIComponent(this.config.pass)}&sender=${encodeURIComponent(this.config.sender)}&phone=${phone}&text=${encodeURIComponent(this.templates.BOOKING_CONFIRMATION)}&priority=wa&stype=normal&Params=${encodeURIComponent(params)}`;

      const response = await this.makeRequest(url);

      const isSuccess = response.includes('S.') || response.includes('success') || response.includes('queued') || response.includes('Message sent');

      if (isSuccess) {
        console.log(`✅ WhatsApp confirmation sent to CUSTOMER for booking ${bookingDetails.id}`);
      } else {
        console.log(`❌ WhatsApp confirmation to CUSTOMER failed: ${response}`);
      }

      return {
        success: isSuccess,
        data: response,
        template: this.templates.BOOKING_CONFIRMATION,
        phone: phone,
        recipient: 'customer',
        customerName: customerDetails.name,
        bookingId: bookingDetails.id,
        fromNumber: this.config.sender
      };

    } catch (error) {
      console.error(`❌ WhatsApp error (customer):`, error.message);
      return { success: false, error: error.message, recipient: 'customer' };
    }
  }

  /**
   * Send booking confirmation to HOTEL OWNER
   * Template: hotel_booking_confirmation_update
   * Parameters: {{1}} = Customer Name, {{2}} = Booking ID, {{3}} = Hotel Name, 
   *             {{4}} = Check-in Date, {{5}} = Check-in Time, {{6}} = Check-out Date, {{7}} = Check-out Time
   */
  async sendBookingConfirmationToHotelOwner(bookingDetails, hotelName, customerDetails, hotelOwnerDetails) {
    try {
      const phone = this.formatPhoneNumber(hotelOwnerDetails.phone);
      if (!phone) {
        console.log(`⚠️ No valid phone number for hotel owner - booking ${bookingDetails.id}`);
        return { success: false, error: 'Invalid hotel owner phone number' };
      }

      // Format dates for WhatsApp
      const formatDateForWhatsApp = (dateStr) => {
        if (!dateStr) return 'Not specified';
        try {
          const date = new Date(dateStr);
          return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });
        } catch (error) {
          return dateStr;
        }
      };

      // Format times
      const formatTimeForWhatsApp = (timeStr) => {
        if (!timeStr) return '2:00 PM';
        try {
          if (typeof timeStr === 'string' && timeStr.includes(':')) {
            const [hours, minutes] = timeStr.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            return `${hour12}:${minutes} ${ampm}`;
          }
          return timeStr;
        } catch (error) {
          return timeStr;
        }
      };
      
      // Prepare parameters for hotel owner template
      // For hotel owner, we might want to include additional context
      const params = [
        customerDetails.name || 'Guest',                    // {{1}}
        bookingDetails.id?.toString() || 'N/A',          // {{2}}
        hotelName || 'Hotel Management',                     // {{3}}
        formatDateForWhatsApp(bookingDetails.from_date),     // {{4}}
        formatTimeForWhatsApp(bookingDetails.from_time),     // {{5}}
        formatDateForWhatsApp(bookingDetails.to_date),       // {{6}}
        formatTimeForWhatsApp(bookingDetails.to_time)        // {{7}}
      ].join(',');

      console.log('📱 Sending Booking Confirmation to HOTEL OWNER:');
      console.log(`   Template: ${this.templates.BOOKING_CONFIRMATION}`);
      console.log(`   To: +${phone}`);
      console.log(`   Hotel Owner: ${hotelOwnerDetails.name}`);
      console.log(`   Customer: ${customerDetails.name}`);
      console.log(`   Parameters: ${params}`);

      const url = `${this.apiUrl}?user=${encodeURIComponent(this.config.user)}&pass=${encodeURIComponent(this.config.pass)}&sender=${encodeURIComponent(this.config.sender)}&phone=${phone}&text=${encodeURIComponent(this.templates.BOOKING_CONFIRMATION)}&priority=wa&stype=normal&Params=${encodeURIComponent(params)}`;

      const response = await this.makeRequest(url);

      const isSuccess = response.includes('S.') || response.includes('success') || response.includes('queued') || response.includes('Message sent');

      if (isSuccess) {
        console.log(`✅ WhatsApp confirmation sent to HOTEL OWNER for booking ${bookingDetails.id}`);
      } else {
        console.log(`❌ WhatsApp confirmation to HOTEL OWNER failed: ${response}`);
      }

      return {
        success: isSuccess,
        data: response,
        template: this.templates.BOOKING_CONFIRMATION,
        phone: phone,
        recipient: 'hotel_owner',
        ownerName: hotelOwnerDetails.name,
        bookingId: bookingDetails.id,
        fromNumber: this.config.sender
      };

    } catch (error) {
      console.error(`❌ WhatsApp error (hotel owner):`, error.message);
      return { success: false, error: error.message, recipient: 'hotel_owner' };
    }
  }

  /**
   * Send booking confirmation to BOTH customer and hotel owner
   * This is the main method to call from your booking controller
   */
  async sendBookingConfirmationToAll(bookingDetails, hotelName, customerDetails, hotelOwnerDetails) {
    const results = {
      customer: null,
      hotelOwner: null
    };

    // Send to customer
    if (customerDetails && customerDetails.phone) {
      results.customer = await this.sendBookingConfirmationToCustomer(
        bookingDetails,
        hotelName,
        customerDetails
      );
    } else {
      console.log(`⚠️ Cannot send to customer: No phone number for booking ${bookingDetails.id}`);
      results.customer = { success: false, error: 'No customer phone number' };
    }

    // Send to hotel owner
    if (hotelOwnerDetails && hotelOwnerDetails.phone) {
      results.hotelOwner = await this.sendBookingConfirmationToHotelOwner(
        bookingDetails,
        hotelName,
        customerDetails,
        hotelOwnerDetails
      );
    } else {
      console.log(`⚠️ Cannot send to hotel owner: No phone number for booking ${bookingDetails.id}`);
      results.hotelOwner = { success: false, error: 'No hotel owner phone number' };
    }

    // Log summary
    console.log('📊 WhatsApp Notifications Summary:');
    console.log(`   Customer: ${results.customer?.success ? '✅ Sent' : '❌ Failed'}`);
    console.log(`   Hotel Owner: ${results.hotelOwner?.success ? '✅ Sent' : '❌ Failed'}`);

    return results;
  }

  /**
   * Send booking confirmation using the original method (kept for backward compatibility)
   * Now sends to both parties
   */
  async sendBookingConfirmation(bookingDetails, hotelName, customerDetails, hotelOwnerDetails = null) {
    if (hotelOwnerDetails) {
      return await this.sendBookingConfirmationToAll(bookingDetails, hotelName, customerDetails, hotelOwnerDetails);
    } else {
      // Fallback to only customer if hotel owner details not provided
      return await this.sendBookingConfirmationToCustomer(bookingDetails, hotelName, customerDetails);
    }
  }


  /**
   * Send checkout reminder using checkout_time_reminder_alert template
   * Template: checkout_time_reminder_alert
   * Parameters: {{1}} = Customer Name, {{2}} = Checkout Time, {{3}} = Booking ID, {{4}} = Hotel Name
   */
  async sendCheckoutReminder(bookingDetails, hotelName, customerDetails) {
    try {
      const phone = this.formatPhoneNumber(customerDetails.phone);
      if (!phone) {
        console.log(`⚠️ No valid phone number for checkout reminder - booking ${bookingDetails.id}`);
        return { success: false, error: 'Invalid phone number' };
      }

      // Format checkout time for WhatsApp
      const formatCheckoutTime = () => {
        try {
          // If we have time string
          if (bookingDetails.to_time) {
            const timeStr = bookingDetails.to_time;
            if (typeof timeStr === 'string' && timeStr.includes(':')) {
              const [hours, minutes] = timeStr.split(':');
              const hour = parseInt(hours);
              const ampm = hour >= 12 ? 'PM' : 'AM';
              const hour12 = hour % 12 || 12;
              return `${hour12}:${minutes} ${ampm}`;
            }
          }
          return '12:00 PM';
        } catch (error) {
          return '12:00 PM';
        }
      };

      const checkoutTime = formatCheckoutTime();

      // Prepare parameters for template
      // Template expects: {{1}} = Customer Name, {{2}} = Checkout Time, {{3}} = Booking ID, {{4}} = Hotel Name
      const params = [
        customerDetails.name || 'Guest',           // {{1}}
        checkoutTime,                               // {{2}}
        bookingDetails.id?.toString() || 'N/A',    // {{3}}
        hotelName || 'Hotel Management'             // {{4}}
      ].join(',');

      console.log('📱 Sending Checkout Reminder:');
      console.log(`   Template: ${this.templates.CHECKOUT_REMINDER}`);
      console.log(`   To: +${phone}`);
      console.log(`   Customer: ${customerDetails.name}`);
      console.log(`   Checkout Time: ${checkoutTime}`);
      console.log(`   Booking ID: ${bookingDetails.id}`);
      console.log(`   Hotel: ${hotelName}`);

      const url = `${this.apiUrl}?user=${encodeURIComponent(this.config.user)}&pass=${encodeURIComponent(this.config.pass)}&sender=${encodeURIComponent(this.config.sender)}&phone=${phone}&text=${encodeURIComponent(this.templates.CHECKOUT_REMINDER)}&priority=wa&stype=normal&Params=${encodeURIComponent(params)}`;

      const response = await this.makeRequest(url);

      const isSuccess = response.includes('S.') ||
        response.includes('success') ||
        response.includes('queued') ||
        response.includes('Message sent');

      if (isSuccess) {
        console.log(`✅ Checkout reminder sent for booking ${bookingDetails.id}`);
      } else {
        console.log(`❌ Checkout reminder failed for booking ${bookingDetails.id}: ${response}`);
      }

      return {
        success: isSuccess,
        data: response,
        template: this.templates.CHECKOUT_REMINDER,
        phone: phone,
        customerName: customerDetails.name,
        bookingId: bookingDetails.id,
        checkoutTime: checkoutTime,
        hotelName: hotelName,
        fromNumber: this.config.sender
      };

    } catch (error) {
      console.error(`❌ WhatsApp checkout reminder error:`, error.message);
      return {
        success: false,
        error: error.message,
        template: this.templates.CHECKOUT_REMINDER
      };
    }
  }
  /**
   * Test template linkage with US Business number
   */
  async testTemplateLinkage() {
    console.log('🔍 Testing Template Linkage for US Business Number:');
    console.log(`   Business Number: +${this.config.sender}`);
    console.log(`   Templates: ${Object.values(this.templates).join(', ')}`);

    // Test with a known Indian number (replace with test numbers)
    const testNumbers = [
      '919620300390', // Test Indian number
      '919876543210', // Another test
    ];

    for (const templateName of Object.values(this.templates)) {
      console.log(`\n🧪 Testing Template: ${templateName}`);

      for (const testPhone of testNumbers) {
        const params = templateName === 'hotel_update_notification'
          ? 'John Doe,REQ12345'  // For hotel update template
          : 'Guest,123,101,20 Mar,14:00,21 Mar,12:00,Test Hotel,Contact'; // For booking template

        const url = `${this.apiUrl}?user=${this.config.user}&pass=${this.config.pass}&sender=${this.config.sender}&phone=${testPhone}&text=${templateName}&priority=wa&stype=normal&Params=${params}`;

        console.log(`   To: +${testPhone}`);
        console.log(`   URL: ${url.substring(0, 100)}...`);

        try {
          const response = await this.makeRequest(url);
          console.log(`   Response: ${response}`);

          if (response.includes('not linked')) {
            console.log(`   ❌ Template "${templateName}" not linked to +${this.config.sender}`);
          }
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
        }
      }
    }
  }

  /**
   * Validate if templates are properly configured
   */
  async validateConfiguration() {
    const issues = [];

    console.log('\n🔧 Validating WhatsApp Configuration:');

    // Check US number format
    if (!this.config.sender.startsWith('1') || this.config.sender.length !== 11) {
      issues.push(`US number should start with 1 and be 11 digits (got: ${this.config.sender})`);
    }

    // Check templates
    Object.entries(this.templates).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    // Test API connectivity
    try {
      const testUrl = `${this.apiUrl}?user=${this.config.user}`;
      console.log(`   API Endpoint: ${this.apiUrl}`);
      console.log(`   User: ${this.config.user}`);

      if (issues.length === 0) {
        console.log('✅ Configuration looks good');
        return { valid: true };
      } else {
        console.log('❌ Configuration issues found:');
        issues.forEach(issue => console.log(`   - ${issue}`));
        return { valid: false, issues };
      }
    } catch (error) {
      console.log(`❌ API connectivity issue: ${error.message}`);
      return { valid: false, issues: ['API connectivity failed'] };
    }
  }


}

module.exports = new WhatsAppService();