const fs = require('fs');
const path = require('path');
const { formatGuestsForDisplay } = require('../utils/guestUtils');

class InvoiceService {
    constructor() {
        this.templatePath = path.join(__dirname, '../public/Adv-invoice-template.html');
        this.template = null;
    }

    // Load template
    loadTemplate() {
        if (!this.template) {
            this.template = fs.readFileSync(this.templatePath, 'utf8');
        }
        return this.template;
    }

    // Replace placeholders
    replacePlaceholders(template, data) {
        let html = template;
        for (const [key, value] of Object.entries(data)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            html = html.replace(regex, value || '');
        }
        return html;
    }

    // Format currency
    // formatCurrency(amount) {
    //     return `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    // }
    // Format currency - FIXED to handle numbers properly
    formatCurrency(amount) {
        // Ensure amount is a number
        let numAmount = typeof amount === 'number' ? amount : parseFloat(amount);

        // Check if valid number
        if (isNaN(numAmount) || numAmount === null || numAmount === undefined) {
            numAmount = 0;
        }

        // Round to 2 decimal places
        numAmount = Math.round(numAmount * 100) / 100;

        // Format with Indian Rupee symbol
        return `₹${numAmount.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }

    // Format date
    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    // Generate single booking invoice HTML
    generateSingleInvoice(bookingData, hotelData) {
        const template = this.loadTemplate();

        const nights = Math.ceil(
            (new Date(bookingData.to_date) - new Date(bookingData.from_date)) / (1000 * 60 * 60 * 24)
        );

        // Build charges table rows
        const chargesRows = `
            <tr>
                <td>Room Charges (${this.formatCurrency(bookingData.amount)})</td>
                <td style="text-align: right;">${this.formatCurrency(bookingData.amount)}</td>
            </tr>
            <tr>
                <td>Service Charges</td>
                <td style="text-align: right;">${this.formatCurrency(bookingData.service)}</td>
            </tr>
            ${bookingData.cgst > 0 ? `
            <tr>
                <td>CGST</td>
                <td style="text-align: right;">${this.formatCurrency(bookingData.cgst)}</td>
            </tr>` : ''}
            ${bookingData.sgst > 0 ? `
            <tr>
                <td>SGST</td>
                <td style="text-align: right;">${this.formatCurrency(bookingData.sgst)}</td>
            </tr>` : ''}
            ${bookingData.igst > 0 ? `
            <tr>
                <td>IGST</td>
                <td style="text-align: right;">${this.formatCurrency(bookingData.igst)}</td>
            </tr>` : ''}
        `;

        const paymentStatusClass = bookingData.remaining_amount <= 0 ? 'completed' :
            bookingData.advance_amount > 0 ? 'partial' : 'pending';
        const paymentStatus = bookingData.remaining_amount <= 0 ? 'Completed' :
            bookingData.advance_amount > 0 ? 'Partial' : 'Pending';

        const bookingDetails = `
            <strong>Room:</strong> ${bookingData.room_number} (${bookingData.room_type})<br>
            <strong>Check-in:</strong> ${this.formatDate(bookingData.from_date)} ${bookingData.from_time}<br>
            <strong>Check-out:</strong> ${this.formatDate(bookingData.to_date)} ${bookingData.to_time}<br>
            <strong>Nights:</strong> ${nights}<br>
            <strong>Guests:</strong> ${formatGuestsForDisplay(bookingData.guests)}
        `;

        const chargesTable = `
            <h3>Charges Details</h3>
            <table>
                <thead>
                    <tr><th>Description</th><th style="text-align: right;">Amount (₹)</th></tr>
                </thead>
                <tbody>
                    ${chargesRows}
                </tbody>
                <tfoot>
                    <tr><td style="text-align: right;"><strong>Subtotal:</strong></td>
                        <td style="text-align: right;">${this.formatCurrency((bookingData.amount || 0) + (bookingData.service || 0))}</td></tr>
                    <tr class="total-row"><td style="text-align: right;"><strong>TOTAL:</strong></td>
                        <td style="text-align: right;">${this.formatCurrency(bookingData.total)}</td></tr>
                    <tr style="background-color: #e8f4fd;"><td style="text-align: right;"><strong>Advance Paid:</strong></td>
                        <td style="text-align: right;">${this.formatCurrency(bookingData.advance_amount)}</td></tr>
                    ${bookingData.remaining_amount > 0 ? `
                    <tr style="background-color: #fff3cd;"><td style="text-align: right;"><strong>Remaining Due:</strong></td>
                        <td style="text-align: right;">${this.formatCurrency(bookingData.remaining_amount)}</td></tr>
                    ` : ''}
                </tfoot>
            </table>
        `;

        const paymentSummary = `
            <div style="margin-bottom: 5px;">
                <span>Total Booking Value: </span>
                <strong>${this.formatCurrency(bookingData.total)}</strong>
            </div>
            <div style="margin-bottom: 5px; color: green;">
                <span>Advance Paid: </span>
                <strong>${this.formatCurrency(bookingData.advance_amount)}</strong>
            </div>
            <div style="color: orange;">
                <span>Balance Due: </span>
                <strong>${this.formatCurrency(bookingData.remaining_amount)}</strong>
            </div>
        `;

        const notesSection = bookingData.notes ? `
            <div style="margin: 20px 0; padding: 10px; background-color: #f8f9fa; border-left: 4px solid #3498db;">
                <strong>Notes:</strong> ${bookingData.notes}
            </div>
        ` : '';

        const data = {
            HOTEL_LOGO: hotelData.logo ? `<img src="${hotelData.logo}" class="hotel-logo" alt="Hotel Logo">` : `<div class="hotel-name">${hotelData.name}</div>`,
            HOTEL_NAME: hotelData.name || 'Hotel Management System',
            HOTEL_ADDRESS: hotelData.address || '',
            HOTEL_PHONE: hotelData.phone || 'N/A',
            HOTEL_EMAIL: hotelData.email || 'N/A',
            HOTEL_GSTIN: hotelData.gstin ? `GSTIN: ${hotelData.gstin}` : '',
            INVOICE_TITLE: 'ADVANCE BOOKING INVOICE',
            GROUP_BADGE: '',
            INVOICE_NUMBER: bookingData.invoice_number,
            INVOICE_DATE: this.formatDate(new Date()),
            GROUP_INFO: '',
            CUSTOMER_NAME: bookingData.customer_name,
            CUSTOMER_PHONE: bookingData.customer_phone,
            CUSTOMER_EMAIL: bookingData.customer_email ? `Email: ${bookingData.customer_email}<br>` : '',
            CUSTOMER_ADDRESS: bookingData.address || '',
            BOOKING_DETAILS: bookingDetails,
            ROOMS_TABLE: chargesTable,
            PAYMENT_METHOD: bookingData.payment_method || 'cash',
            PAYMENT_STATUS_CLASS: paymentStatusClass,
            PAYMENT_STATUS: paymentStatus,
            BOOKING_STATUS_CLASS: bookingData.status,
            BOOKING_STATUS: bookingData.status?.toUpperCase() || 'PENDING',
            PAYMENT_SUMMARY: paymentSummary,
            NOTES_SECTION: notesSection,
            FOOTER_NOTE: 'This is an advance booking invoice. Final amount may vary.',
            FOOTER_TERMS: `Advance booking valid until ${this.formatDate(bookingData.advance_expiry_date)}`
        };

        return this.replacePlaceholders(template, data);
    }

    // Generate group booking invoice HTML
    generateGroupInvoice(groupId, rooms, hotelData) {
        const template = this.loadTemplate();

        // FIX: Properly calculate totals with correct decimal handling
        const totalAmount = rooms.reduce((sum, r) => {
            const amount = parseFloat(r.total) || 0;
            return sum + amount;
        }, 0);

        const totalAdvance = rooms.reduce((sum, r) => {
            const advance = parseFloat(r.advance_amount) || 0;
            return sum + advance;
        }, 0);

        const totalRemaining = totalAmount - totalAdvance;

        // Get payment status from database
        const dbPaymentStatus = rooms[0]?.payment_status || 'pending';
        let paymentStatusDisplay = 'Pending';
        let paymentStatusClass = 'pending';

        if (dbPaymentStatus === 'partial') {
            paymentStatusDisplay = 'Partial';
            paymentStatusClass = 'partial';
        } else if (dbPaymentStatus === 'completed') {
            paymentStatusDisplay = 'Completed';
            paymentStatusClass = 'completed';
        }

        if (dbPaymentStatus !== 'completed' && totalAdvance > 0 && totalRemaining > 0) {
            paymentStatusDisplay = 'Partial';
            paymentStatusClass = 'partial';
        }

        // Build rooms table - FIXED formatting
        let roomsRows = '';
        for (const room of rooms) {
            // Ensure all values are numbers and properly formatted
            const roomAmount = parseFloat(room.amount) || 0;
            const roomService = parseFloat(room.service) || 0;
            const roomCgst = parseFloat(room.cgst) || 0;
            const roomSgst = parseFloat(room.sgst) || 0;
            const roomIgst = parseFloat(room.igst) || 0;
            const roomTotal = parseFloat(room.total) || 0;
            const roomAdvance = parseFloat(room.advance_amount) || 0;
            const roomRemaining = parseFloat(room.remaining_amount) || 0;

            roomsRows += `
            <tr class="compact-row">
                <td style="padding: 8px;"><strong>${room.room_number || 'N/A'}</strong></td>
                <td style="padding: 8px;">${room.room_type || 'Standard'}</td>
                <td style="padding: 8px;">${this.formatDate(room.from_date)}<br>to<br>${this.formatDate(room.to_date)}</td>
                <td style="padding: 8px; text-align: right;">${this.formatCurrency(roomAmount)}</td>
                <td style="padding: 8px; text-align: right;">${this.formatCurrency(roomService)}</td>
                <td style="padding: 8px; text-align: right;">${this.formatCurrency(roomCgst)}</td>
                <td style="padding: 8px; text-align: right;">${this.formatCurrency(roomSgst)}</td>
                <td style="padding: 8px; text-align: right;">${this.formatCurrency(roomIgst)}</td>
                <td style="padding: 8px; text-align: right;"><strong>${this.formatCurrency(roomTotal)}</strong></td>
                <td style="padding: 8px; text-align: right; color: green;">${this.formatCurrency(roomAdvance)}</td>
                <td style="padding: 8px; text-align: right; color: orange;">${this.formatCurrency(roomRemaining)}</td>
            </tr>
        `;
        }

        const roomsTable = `
        <div class="table-responsive">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: #2c3e50; color: white;">
                        <th style="padding: 8px; text-align: left;">Room</th>
                        <th style="padding: 8px; text-align: left;">Type</th>
                        <th style="padding: 8px; text-align: left;">Dates</th>
                        <th style="padding: 8px; text-align: right;">Room (₹)</th>
                        <th style="padding: 8px; text-align: right;">Service (₹)</th>
                        <th style="padding: 8px; text-align: right;">CGST (₹)</th>
                        <th style="padding: 8px; text-align: right;">SGST (₹)</th>
                        <th style="padding: 8px; text-align: right;">IGST (₹)</th>
                        <th style="padding: 8px; text-align: right;">Total (₹)</th>
                        <th style="padding: 8px; text-align: right;">Advance (₹)</th>
                        <th style="padding: 8px; text-align: right;">Due (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    ${roomsRows}
                </tbody>
                <tfoot>
                    <tr style="background-color: #f0f0f0; font-weight: bold;">
                        <td colspan="8" style="padding: 8px; text-align: right;"><strong>Group Total:</strong></td>
                        <td style="padding: 8px; text-align: right;"><strong>${this.formatCurrency(totalAmount)}</strong></td>
                        <td style="padding: 8px; text-align: right;"><strong>${this.formatCurrency(totalAdvance)}</strong></td>
                        <td style="padding: 8px; text-align: right;"><strong>${this.formatCurrency(totalRemaining)}</strong></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;

        // Calculate nights - ensure minimum 1
        let nights = 1;
        if (rooms[0] && rooms[0].from_date && rooms[0].to_date) {
            const fromDate = new Date(rooms[0].from_date);
            const toDate = new Date(rooms[0].to_date);
            const diffTime = Math.abs(toDate - fromDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            nights = diffDays > 0 ? diffDays : 1;
        }

        const bookingDetails = `
        <strong>Total Rooms:</strong> ${rooms.length}<br>
        <strong>Check-in:</strong> ${this.formatDate(rooms[0]?.from_date)} ${rooms[0]?.from_time || '14:00'}<br>
        <strong>Check-out:</strong> ${this.formatDate(rooms[0]?.to_date)} ${rooms[0]?.to_time || '12:00'}<br>
        <strong>Nights:</strong> ${nights}<br>
        <strong>Status:</strong> ${rooms[0]?.status?.toUpperCase() || 'PENDING'}
    `;

        const paymentSummary = `
        <div style="margin-bottom: 5px;">
            <strong>Total Booking Value:</strong> ${this.formatCurrency(totalAmount)}
        </div>
        <div style="margin-bottom: 5px; color: green;">
            <strong>Total Advance Paid:</strong> ${this.formatCurrency(totalAdvance)}
        </div>
        <div style="color: orange;">
            <strong>Total Balance Due:</strong> ${this.formatCurrency(totalRemaining)}
        </div>
    `;

        const notesSection = rooms[0]?.notes ? `
        <div class="notes-section">
            <strong>Notes:</strong> ${rooms[0].notes}
        </div>
    ` : `
        <div class="notes-section">
            <strong>Notes:</strong> Group advance booking - ${rooms.length} rooms secured together
        </div>
    `;

        const data = {
            HOTEL_LOGO: hotelData.logo ? `<img src="${hotelData.logo}" class="hotel-logo" alt="Hotel Logo">` : `<div class="hotel-name">${hotelData.name}</div>`,
            HOTEL_NAME: hotelData.name || 'Hotel Management System',
            HOTEL_ADDRESS: hotelData.address || '',
            HOTEL_PHONE: hotelData.phone || 'N/A',
            HOTEL_EMAIL: hotelData.email || 'N/A',
            HOTEL_GSTIN: hotelData.gstin ? `GSTIN: ${hotelData.gstin}` : '',
            INVOICE_TITLE: 'ADVANCE BOOKING INVOICE',
            GROUP_BADGE: `<span class="group-badge">${rooms.length} Rooms</span>`,
            INVOICE_NUMBER: `GRP-${groupId.slice(-8)}`,
            INVOICE_DATE: this.formatDate(new Date()),
            GROUP_INFO: `<div><strong>Group ID:</strong> ${groupId.slice(-12)}</div>`,
            CUSTOMER_NAME: rooms[0]?.customer_name || '',
            CUSTOMER_PHONE: rooms[0]?.customer_phone || '',
            CUSTOMER_EMAIL: rooms[0]?.customer_email ? `Email: ${rooms[0].customer_email}<br>` : '',
            CUSTOMER_ADDRESS: rooms[0]?.address || '',
            BOOKING_DETAILS: bookingDetails,
            ROOMS_TABLE: roomsTable,
            PAYMENT_METHOD: rooms[0]?.payment_method || 'cash',
            PAYMENT_STATUS_CLASS: paymentStatusClass,
            PAYMENT_STATUS: paymentStatusDisplay,
            BOOKING_STATUS_CLASS: rooms[0]?.status || 'pending',
            BOOKING_STATUS: rooms[0]?.status?.toUpperCase() || 'PENDING',
            PAYMENT_SUMMARY: paymentSummary,
            NOTES_SECTION: notesSection,
            FOOTER_NOTE: 'This is a group advance booking invoice. Final amount may vary based on actual stay duration.',
            FOOTER_TERMS: `Group booking valid until ${this.formatDate(rooms[0]?.advance_expiry_date)}`
        };

        return this.replacePlaceholders(template, data);
    }
}

module.exports = new InvoiceService();