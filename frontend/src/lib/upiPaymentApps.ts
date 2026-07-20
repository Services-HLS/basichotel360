export type UpiPaymentAppId =
  | 'phonepe'
  | 'googlepay'
  | 'paytm'
  | 'bhim'
  | 'amazonpay'
  | 'other';

export type UpiPaymentApp = {
  id: UpiPaymentAppId;
  label: string;
  /** Path under frontend/public — replace PNG/SVG files to use client logos */
  image: string;
};

/** Add or replace images in `frontend/public/payments/` (same file names). */
export const UPI_PAYMENT_APPS: UpiPaymentApp[] = [
  { id: 'phonepe', label: 'PhonePe', image: '/payments/phonepe.svg' },
  { id: 'googlepay', label: 'Google Pay', image: '/payments/googlepay.svg' },
  { id: 'paytm', label: 'Paytm', image: '/payments/paytm.svg' },
  { id: 'bhim', label: 'BHIM UPI', image: '/payments/bhim.svg' },
  { id: 'amazonpay', label: 'Amazon Pay', image: '/payments/amazonpay.svg' },
  { id: 'other', label: 'Other UPI', image: '/payments/other.svg' },
];

export function getUpiPaymentAppLabel(id?: string | null): string {
  if (!id) return '';
  return UPI_PAYMENT_APPS.find((app) => app.id === id)?.label || id;
}

export function formatBookingPaymentLabel(
  paymentMethod?: string | null,
  onlinePaymentApp?: string | null
): string {
  const method = String(paymentMethod || 'cash').toLowerCase();
  if (method !== 'online') {
    return method === 'cash' ? 'Cash' : method.charAt(0).toUpperCase() + method.slice(1);
  }
  const app = getUpiPaymentAppLabel(onlinePaymentApp);
  return app ? `Online · ${app}` : 'Online';
}

/** e.g. remarks: "Online payment (phonepe) - TXN: ..." */
export function parseOnlineAppFromRemarks(remarks?: string | null): string {
  if (!remarks) return '';
  const match = String(remarks).match(/Online payment\s*\(([^)]+)\)/i);
  if (!match) return '';
  return getUpiPaymentAppLabel(match[1].trim().toLowerCase()) || match[1].trim();
}

export function formatCollectionPaymentLabel(
  paymentMode?: string | null,
  remarks?: string | null
): string {
  const mode = String(paymentMode || 'cash').toLowerCase();
  if (mode === 'cash') return 'Cash';
  const app = parseOnlineAppFromRemarks(remarks);
  if (app) return app;
  if (['online', 'upi', 'card'].includes(mode)) return 'Online';
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

export function isUpiPaymentAppId(value?: string | null): value is UpiPaymentAppId {
  return !!value && UPI_PAYMENT_APPS.some((app) => app.id === value);
}
