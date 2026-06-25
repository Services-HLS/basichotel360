/**
 * Normalize booking/API dates to YYYY-MM-DD (local calendar date).
 * Avoids invalid comparisons from Date.toString().slice(0, 10) etc.
 */
function normalizeDateToYMD(value) {
  if (value === null || value === undefined || value === '') return '';

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const str = String(value).trim();
  const isoMatch = str.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];

  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return '';
}

function isCheckoutOnOrAfterCheckin(fromDate, toDate) {
  const from = normalizeDateToYMD(fromDate);
  const to = normalizeDateToYMD(toDate);
  if (!from || !to) return true;
  return to >= from;
}

module.exports = {
  normalizeDateToYMD,
  isCheckoutOnOrAfterCheckin,
};
