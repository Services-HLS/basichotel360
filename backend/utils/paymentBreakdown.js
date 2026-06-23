/**
 * Split total paid into booking-time advance vs checkout payment for invoices.
 */

function parseAmountFromNote(text, pattern) {
  const match = String(text || '').match(pattern);
  if (!match) return 0;
  return parseFloat(String(match[1]).replace(/,/g, '')) || 0;
}

function parseCheckoutPaid(specialRequests = '') {
  return parseAmountFromNote(
    specialRequests,
    /Checkout:\s*paid\s*₹?([\d,.]+)/i
  );
}

function parseBookingAdvance(specialRequests = '') {
  return parseAmountFromNote(
    specialRequests,
    /Booking advance:\s*₹?([\d,.]+)/i
  );
}

function getPaymentBreakdown(booking = {}) {
  const total = parseFloat(booking.total) || 0;
  const totalPaid = parseFloat(booking.advance_amount_paid) || 0;
  const remainingRaw = parseFloat(booking.remaining_amount);
  const remainingAmount = Number.isFinite(remainingRaw)
    ? Math.max(0, remainingRaw)
    : Math.max(0, total - totalPaid);

  const notes = booking.special_requests || '';
  const checkoutFromNotes = parseCheckoutPaid(notes);
  const advanceFromNotes = parseBookingAdvance(notes);

  let bookingAdvance = 0;
  let checkoutPaid = 0;

  if (booking.status === 'completed') {
    if (advanceFromNotes > 0) {
      bookingAdvance = advanceFromNotes;
      checkoutPaid =
        checkoutFromNotes > 0
          ? checkoutFromNotes
          : Math.max(0, Math.round((totalPaid - bookingAdvance) * 100) / 100);
    } else if (checkoutFromNotes > 0 && checkoutFromNotes <= totalPaid) {
      checkoutPaid = checkoutFromNotes;
      bookingAdvance = Math.max(0, Math.round((totalPaid - checkoutPaid) * 100) / 100);
    } else if (totalPaid > 0) {
      // Legacy: no notes — treat everything as checkout if fully paid
      checkoutPaid = totalPaid;
      bookingAdvance = 0;
    }
  } else {
    // Active booking: amount paid so far is advance only
    bookingAdvance = totalPaid;
    checkoutPaid = 0;
  }

  return {
    total,
    totalPaid,
    bookingAdvance,
    checkoutPaid,
    remainingAmount,
    balanceDue: remainingAmount,
  };
}

module.exports = {
  parseCheckoutPaid,
  parseBookingAdvance,
  getPaymentBreakdown,
};
