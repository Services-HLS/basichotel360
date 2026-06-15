import { getCurrentUser } from '@/lib/storage';
import type { Permission } from '@/lib/permissions';

/** Hotel plans stored in DB for the free/basic tier */
const BASIC_HOTEL_PLANS = ['free', 'base', 'basic'];

/** Permissions allowed for database basic-plan users */
export const BASIC_PLAN_PERMISSIONS: Permission[] = [
  'view_dashboard',
  'view_rooms',
  'view_bookings',
  'create_booking',
  'manage_hotel_settings',
];

export function normalizePlan(plan?: string | null, hotelPlan?: string | null): string {
  const raw = (plan || hotelPlan || '').toLowerCase();
  if (BASIC_HOTEL_PLANS.includes(raw)) return 'basic';
  if (raw === 'pro') return 'pro';
  return raw || 'basic';
}

export function isBasicHotelPlan(plan?: string | null): boolean {
  const normalized = normalizePlan(plan);
  return normalized === 'basic';
}

/** Database-backed basic plan (not legacy Google Sheets) */
export function isBasicDatabaseUser(user = getCurrentUser()): boolean {
  if (!user) return false;
  if (user.source === 'google_sheets') return false;
  return isBasicHotelPlan(user.plan) || isBasicHotelPlan(user.hotelPlan);
}

/** Legacy Google Sheets basic users */
export function isGoogleSheetsBasicUser(user = getCurrentUser()): boolean {
  return user?.source === 'google_sheets';
}

export function isAnyBasicUser(user = getCurrentUser()): boolean {
  return isBasicDatabaseUser(user) || isGoogleSheetsBasicUser(user);
}

export function getPostLoginPath(user = getCurrentUser()): string {
  if (isBasicDatabaseUser(user)) return '/dashboard';
  if (isGoogleSheetsBasicUser(user)) return '/dashboard';
  return '/roombooking';
}

export function isRouteAllowedForBasicUser(pathname: string): boolean {
  /** Staff management stays Pro-only (not in sidebar for basic) */
  const blockedPrefixes = ['/staff'];
  return !blockedPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Pro sections basic users can open in view-only mode (actions disabled on page) */
export const BASIC_PLAN_VIEW_ONLY_PATHS = [
  '/advance-bookings',
  '/reports',
  '/collections',
  '/expenses',
  '/salaries',
  '/housekeeping',
  '/function-rooms',
  '/customers',
  '/refund-management',
] as const;

/** @deprecated use BASIC_PLAN_VIEW_ONLY_PATHS */
export const BASIC_PLAN_LOCKED_NAV_PATHS = BASIC_PLAN_VIEW_ONLY_PATHS;

export function isBasicPlanViewOnlyPath(
  path: string,
  user = getCurrentUser()
): boolean {
  if (!isBasicDatabaseUser(user)) return false;
  return BASIC_PLAN_VIEW_ONLY_PATHS.some(
    (p) => path === p || path.startsWith(`${p}/`)
  );
}

export function isNavPathLockedForBasicUser(
  path: string,
  user = getCurrentUser()
): boolean {
  return isBasicPlanViewOnlyPath(path, user);
}
