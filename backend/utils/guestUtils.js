/**
 * Guest field helpers — stores breakdown as JSON in the `guests` column:
 * {"adults":2,"children":1,"total":3}
 *
 * Legacy rows may still hold a plain number (e.g. 3).
 */

function parseGuests(value) {
  if (value == null || value === '') {
    return { adults: 1, children: 0, total: 1 };
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    const adults = Math.max(0, parseInt(value.adults, 10) || 0);
    const children = Math.max(0, parseInt(value.children, 10) || 0);
    const total = parseInt(value.total, 10);
    if (!Number.isNaN(total) && total >= 0) {
      return { adults, children, total };
    }
    return {
      adults: adults || 1,
      children,
      total: Math.max(0, adults + children) || 1,
    };
  }

  const str = String(value).trim();
  if (str.startsWith('{')) {
    try {
      return parseGuests(JSON.parse(str));
    } catch {
      // fall through
    }
  }

  const num = parseInt(str, 10);
  if (!Number.isNaN(num) && num >= 0) {
    return { adults: num, children: 0, total: num };
  }

  return { adults: 1, children: 0, total: 1 };
}

function serializeGuestsForDb(data = {}) {
  const { adults, children, guests } = data;

  if (adults !== undefined || children !== undefined) {
    const a = Math.max(1, parseInt(adults, 10) || 1);
    const c = Math.max(0, parseInt(children, 10) || 0);
    return JSON.stringify({ adults: a, children: c, total: a + c });
  }

  if (guests !== undefined && guests !== null && guests !== '') {
    if (typeof guests === 'string' && guests.trim().startsWith('{')) {
      const parsed = parseGuests(guests);
      return JSON.stringify(parsed);
    }
    if (typeof guests === 'object') {
      const parsed = parseGuests(guests);
      return JSON.stringify(parsed);
    }
    const total = parseInt(guests, 10);
    if (!Number.isNaN(total) && total >= 0) {
      if (total === 0) {
        return JSON.stringify({ adults: 0, children: 0, total: 0 });
      }
      return JSON.stringify({ adults: total, children: 0, total });
    }
  }

  return JSON.stringify({ adults: 1, children: 0, total: 1 });
}

function getGuestsTotal(value) {
  return parseGuests(value).total;
}

function formatGuestsForDisplay(value) {
  const { adults, children, total } = parseGuests(value);
  if (total === 0) return '0 guests';
  const parts = [];
  if (adults > 0) parts.push(`${adults} Adult${adults !== 1 ? 's' : ''}`);
  if (children > 0) parts.push(`${children} Child${children !== 1 ? 'ren' : ''}`);
  if (parts.length === 0) return `${total} guest${total !== 1 ? 's' : ''}`;
  return parts.join(', ');
}

/** SQL expression: extract guest total from numeric or JSON `guests` column */
const GUESTS_TOTAL_SQL = `CASE
  WHEN b.guests IS NULL OR b.guests = '' THEN 1
  WHEN JSON_VALID(CAST(b.guests AS CHAR)) THEN COALESCE(
    CAST(JSON_UNQUOTE(JSON_EXTRACT(CAST(b.guests AS CHAR), '$.total')) AS UNSIGNED),
    1
  )
  ELSE CAST(b.guests AS UNSIGNED)
END`;

const ADVANCE_GUESTS_TOTAL_SQL = GUESTS_TOTAL_SQL.replace(/b\.guests/g, 'ab.guests');

module.exports = {
  parseGuests,
  serializeGuestsForDb,
  getGuestsTotal,
  formatGuestsForDisplay,
  GUESTS_TOTAL_SQL,
  ADVANCE_GUESTS_TOTAL_SQL,
};
