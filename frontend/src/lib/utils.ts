import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type RoomSortKey = {
  section: string;
  num: number;
  tier: number;
  raw: string;
};

/** Parse hotel room names like A1-Lower, C35-Upper, C King 51 Lower, F53-Lower */
export function parseRoomSortKey(roomNumber: string): RoomSortKey {
  const raw = String(roomNumber ?? '').trim();
  const fallback = { section: '~', num: Number.MAX_SAFE_INTEGER, tier: 0, raw };

  if (!raw) return fallback;

  const kingMatch = raw.match(/^([A-Za-z])\s+King\s+(\d+)\s+(Lower|Upper)$/i);
  if (kingMatch) {
    return {
      section: kingMatch[1].toUpperCase(),
      num: parseInt(kingMatch[2], 10),
      tier: kingMatch[3].toLowerCase() === 'lower' ? 0 : 1,
      raw,
    };
  }

  const standardMatch = raw.match(/^([A-Za-z])(\d+)-(Lower|Upper)$/i);
  if (standardMatch) {
    return {
      section: standardMatch[1].toUpperCase(),
      num: parseInt(standardMatch[2], 10),
      tier: standardMatch[3].toLowerCase() === 'lower' ? 0 : 1,
      raw,
    };
  }

  const letter = (raw.match(/^([A-Za-z])/)?.[1] ?? '~').toUpperCase();
  const numMatch = raw.match(/(\d+)/);
  const num = numMatch ? parseInt(numMatch[1], 10) : Number.MAX_SAFE_INTEGER;
  const tier = /upper/i.test(raw) ? 1 : 0;

  return { section: letter, num, tier, raw };
}

/** Sort rooms by section (A→B→C→F), then number (35→50→51), then Lower before Upper */
export function compareRoomNumbers(a: string, b: string): number {
  const ka = parseRoomSortKey(a);
  const kb = parseRoomSortKey(b);

  if (ka.section !== kb.section) {
    return ka.section.localeCompare(kb.section);
  }
  if (ka.num !== kb.num) {
    return ka.num - kb.num;
  }
  if (ka.tier !== kb.tier) {
    return ka.tier - kb.tier;
  }
  return ka.raw.localeCompare(kb.raw, undefined, { numeric: true, sensitivity: 'base' });
}
