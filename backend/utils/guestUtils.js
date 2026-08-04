/**
 * Guest field helpers — stores breakdown as JSON in the `guests` column:
 * {"adults":2,"children":1,"total":3,"names":["John","Jane","Kid"]}
 *
 * Legacy rows may still hold a plain number (e.g. 3).
 */

function normalizeGuestNames(names, total) {
  if (!Array.isArray(names)) return [];
  const cleaned = names
    .map((n) => (n == null ? '' : String(n).trim()))
    .slice(0, Math.max(0, total));
  while (cleaned.length < total) cleaned.push('');
  return cleaned;
}

function parseGuests(value) {
  if (value == null || value === '') {
    return { adults: 1, children: 0, total: 1, names: [''] };
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    const adults = Math.max(0, parseInt(value.adults, 10) || 0);
    const children = Math.max(0, parseInt(value.children, 10) || 0);
    const totalRaw = parseInt(value.total, 10);
    const total =
      !Number.isNaN(totalRaw) && totalRaw >= 0
        ? totalRaw
        : Math.max(0, adults + children) || 1;
    const names = normalizeGuestNames(value.names || value.guest_names, total);
    return {
      adults: adults || (total > 0 ? 1 : 0),
      children,
      total: total || 1,
      names,
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
    return {
      adults: num,
      children: 0,
      total: num,
      names: normalizeGuestNames([], num),
    };
  }

  return { adults: 1, children: 0, total: 1, names: [''] };
}

function serializeGuestsForDb(data = {}) {
  const { adults, children, guests, guest_names, guestNames, names } = data;
  // Prefer explicit names; also recover names already embedded in guests JSON
  let incomingNames = guest_names || guestNames || names;
  if (
    (!incomingNames || (Array.isArray(incomingNames) && incomingNames.length === 0)) &&
    guests != null
  ) {
    const fromGuests = parseGuests(guests);
    if ((fromGuests.names || []).some((n) => String(n || '').trim())) {
      incomingNames = fromGuests.names;
    }
  }

  if (adults !== undefined || children !== undefined) {
    const a = Math.max(1, parseInt(adults, 10) || 1);
    const c = Math.max(0, parseInt(children, 10) || 0);
    const total = a + c;
    const payload = { adults: a, children: c, total };
    if (incomingNames && normalizeGuestNames(incomingNames, total).some((n) => n)) {
      payload.names = normalizeGuestNames(incomingNames, total);
    }
    return JSON.stringify(payload);
  }

  if (guests !== undefined && guests !== null && guests !== '') {
    if (typeof guests === 'string' && guests.trim().startsWith('{')) {
      const parsed = parseGuests(guests);
      const payload = {
        adults: parsed.adults,
        children: parsed.children,
        total: parsed.total,
      };
      const nameList = incomingNames
        ? normalizeGuestNames(incomingNames, parsed.total)
        : parsed.names;
      if ((nameList || []).some((n) => String(n || '').trim())) {
        payload.names = nameList;
      }
      return JSON.stringify(payload);
    }
    if (typeof guests === 'object') {
      const parsed = parseGuests({
        ...guests,
        names: incomingNames || guests.names || guests.guest_names,
      });
      const payload = {
        adults: parsed.adults,
        children: parsed.children,
        total: parsed.total,
      };
      if ((parsed.names || []).some((n) => String(n || '').trim())) {
        payload.names = parsed.names;
      }
      return JSON.stringify(payload);
    }
    const total = parseInt(guests, 10);
    if (!Number.isNaN(total) && total >= 0) {
      if (total === 0) {
        return JSON.stringify({ adults: 0, children: 0, total: 0 });
      }
      const payload = { adults: total, children: 0, total };
      if (incomingNames && normalizeGuestNames(incomingNames, total).some((n) => n)) {
        payload.names = normalizeGuestNames(incomingNames, total);
      }
      return JSON.stringify(payload);
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

function formatGuestNamesForDisplay(value) {
  const { names } = parseGuests(value);
  const filled = (names || []).map((n) => String(n || '').trim()).filter(Boolean);
  return filled.length ? filled.join(', ') : '';
}

function getGuestNameGroups(value) {
  const { adults, names } = parseGuests(value);
  const filled = (names || []).map((n) => String(n || '').trim());
  const adultCount = Math.max(0, adults || 0);
  return {
    adultNames: filled.slice(0, adultCount).filter(Boolean),
    childNames: filled.slice(adultCount).filter(Boolean),
    allNames: filled.filter(Boolean),
  };
}

/** Invoice line: "2 Adults, 2 Children — Adults: A, B | Children: C, D" */
function formatGuestsDetailedForDisplay(value) {
  const summary = formatGuestsForDisplay(value);
  const { adultNames, childNames, allNames } = getGuestNameGroups(value);
  if (allNames.length === 0) return summary;

  const parts = [];
  if (adultNames.length) parts.push(`Adults: ${adultNames.join(', ')}`);
  if (childNames.length) parts.push(`Children: ${childNames.join(', ')}`);
  if (parts.length === 0) parts.push(allNames.join(', '));
  return `${summary} — ${parts.join(' | ')}`;
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
  formatGuestNamesForDisplay,
  getGuestNameGroups,
  formatGuestsDetailedForDisplay,
  normalizeGuestNames,
  GUESTS_TOTAL_SQL,
  ADVANCE_GUESTS_TOTAL_SQL,
};
