export interface GuestBreakdown {
  adults: number;
  children: number;
  total: number;
  names: string[];
}

/** Keep names array length in sync with total guest count */
export function resizeGuestNames(
  names: string[] | undefined,
  total: number,
  primaryName?: string
): string[] {
  const count = Math.max(0, total);
  const next = Array.from({ length: count }, (_, i) => {
    const existing = names?.[i];
    if (existing != null && String(existing).trim() !== '') return String(existing);
    if (i === 0 && primaryName && String(primaryName).trim()) return String(primaryName).trim();
    return '';
  });
  return next;
}

/** Parse guests from DB (number or JSON string) */
export function parseGuests(value: unknown): GuestBreakdown {
  if (value == null || value === '') {
    return { adults: 1, children: 0, total: 1, names: [''] };
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const adults = Math.max(0, parseInt(String(obj.adults), 10) || 0);
    const children = Math.max(0, parseInt(String(obj.children), 10) || 0);
    const total = parseInt(String(obj.total), 10);
    const rawNames = Array.isArray(obj.names)
      ? (obj.names as unknown[]).map((n) => String(n ?? ''))
      : Array.isArray(obj.guest_names)
        ? (obj.guest_names as unknown[]).map((n) => String(n ?? ''))
        : [];

    if (!Number.isNaN(total) && total >= 0) {
      return {
        adults,
        children,
        total,
        names: resizeGuestNames(rawNames, total || 1),
      };
    }
    const computed = Math.max(0, adults + children) || 1;
    return {
      adults: adults || 1,
      children,
      total: computed,
      names: resizeGuestNames(rawNames, computed),
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
      names: resizeGuestNames([], num),
    };
  }

  return { adults: 1, children: 0, total: 1, names: [''] };
}

/** Format for invoice / UI: "2 Adults, 1 Child" */
export function formatGuestsForDisplay(value: unknown): string {
  const { adults, children, total } = parseGuests(value);
  if (total === 0) return '0 guests';
  const parts: string[] = [];
  if (adults > 0) parts.push(`${adults} Adult${adults !== 1 ? 's' : ''}`);
  if (children > 0) parts.push(`${children} Child${children !== 1 ? 'ren' : ''}`);
  if (parts.length === 0) return `${total} guest${total !== 1 ? 's' : ''}`;
  return parts.join(', ');
}

/** Comma-separated guest member names */
export function formatGuestNamesForDisplay(value: unknown): string {
  const { names } = parseGuests(value);
  return names.map((n) => n.trim()).filter(Boolean).join(', ');
}

/** Adults / children name lists for invoice */
export function getGuestNameGroups(value: unknown): {
  adultNames: string[];
  childNames: string[];
  allNames: string[];
} {
  const { adults, names } = parseGuests(value);
  const filled = names.map((n) => String(n || '').trim());
  const adultCount = Math.max(0, adults || 0);
  const adultNames = filled.slice(0, adultCount).filter(Boolean);
  const childNames = filled.slice(adultCount).filter(Boolean);
  const allNames = filled.filter(Boolean);
  return { adultNames, childNames, allNames };
}
