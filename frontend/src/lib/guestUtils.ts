export interface GuestBreakdown {
  adults: number;
  children: number;
  total: number;
}

/** Parse guests from DB (number or JSON string) */
export function parseGuests(value: unknown): GuestBreakdown {
  if (value == null || value === '') {
    return { adults: 1, children: 0, total: 1 };
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const adults = Math.max(0, parseInt(String(obj.adults), 10) || 0);
    const children = Math.max(0, parseInt(String(obj.children), 10) || 0);
    const total = parseInt(String(obj.total), 10);
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
