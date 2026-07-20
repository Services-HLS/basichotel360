import { useCallback, useState } from 'react';
import { Bell, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MODULE_LABELS,
  MODULE_ORDER,
  NOTIFICATIONS_UPDATED_EVENT,
  clearAllNotificationBadges,
  getReadNotificationIds,
  getStoredNotifications,
  getUnreadNotifications,
  type NotificationModule,
} from '@/lib/notificationStore';
import { pollNotificationData } from '@/lib/notificationPollingService';
import { getCurrentUser } from '@/lib/storage';

import { localDateStr } from '@/lib/dateUtils';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api';

const POLL_ENDPOINTS = [
  '/bookings',
  '/rooms?limit=1000',
  '/housekeeping',
  '/advance-bookings',
  '/function-rooms/bookings/with-rooms',
  '/refunds/cancellable-bookings',
  '/collections',
  '/wallet',
] as const;

type EndpointStatus = { path: string; status: number | 'error'; ok: boolean };

export default function NotificationDiagnostics() {
  const user = getCurrentUser();
  const [loading, setLoading] = useState(false);
  const [endpointStatus, setEndpointStatus] = useState<EndpointStatus[]>([]);
  const [bellByModule, setBellByModule] = useState<Partial<Record<NotificationModule, number>>>({});
  const [bellTotal, setBellTotal] = useState(0);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const runCheck = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const today = localDateStr();
      const statuses: EndpointStatus[] = [];

      for (const path of POLL_ENDPOINTS) {
        const resolved =
          path === '/housekeeping'
            ? `/housekeeping?date=${today}`
            : path === '/collections'
              ? `/collections?startDate=${today}&endDate=${today}&limit=1`
              : path;
        try {
          const res = await fetch(`${API_URL}${resolved}${resolved.includes('?') ? '&' : '?'}_nc=${Date.now()}`, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            cache: 'no-store',
          });
          statuses.push({ path: resolved, status: res.status, ok: res.ok && res.status !== 304 });
        } catch {
          statuses.push({ path: resolved, status: 'error', ok: false });
        }
      }
      setEndpointStatus(statuses);

      const result = await pollNotificationData({ showBookingNotifications: true });
      const grouped: Partial<Record<NotificationModule, number>> = {};
      for (const n of result.liveNotifications) {
        grouped[n.module] = (grouped[n.module] ?? 0) + 1;
      }
      for (const n of getUnreadNotifications()) {
        if (!result.liveNotifications.some((l) => l.id === n.id)) {
          grouped[n.module] = (grouped[n.module] ?? 0) + 1;
        }
      }
      setBellByModule(grouped);
      setBellTotal(
        MODULE_ORDER.reduce((sum, m) => sum + (grouped[m] ?? 0), 0)
      );
      setLastChecked(new Date().toLocaleString());
    } finally {
      setLoading(false);
    }
  }, []);

  const clearDismissed = () => {
    localStorage.removeItem('hms-app-notifications-read');
    localStorage.removeItem('hms-booking-notifications-read');
    localStorage.removeItem('hms-checkout-reminder-read');
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT));
  };

  const clearBadges = async () => {
    setClearing(true);
    try {
      await clearAllNotificationBadges();
      await runCheck();
    } finally {
      setClearing(false);
    }
  };

  if (user?.source !== 'database') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notification diagnostics</CardTitle>
          <CardDescription>
            In-app notifications are only available for database login users.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const stored = getStoredNotifications().length;
  const read = getReadNotificationIds().size;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4" />
          Notification diagnostics
        </CardTitle>
        <CardDescription>
          Check poll APIs and see what the bell should show right now. Poll runs every 30s in the app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void runCheck()} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Run check
          </Button>
          <Button type="button" variant="outline" onClick={clearDismissed}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear dismissed
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={clearing || loading}
            onClick={() => void clearBadges()}
          >
            {clearing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Bell className="mr-2 h-4 w-4" />
            )}
            Clear all badges
          </Button>
        </div>

        {lastChecked && (
          <p className="text-xs text-muted-foreground">Last checked: {lastChecked}</p>
        )}

        <div className="grid gap-2 sm:grid-cols-3 text-sm">
          <div className="rounded-md border p-2">
            <p className="text-muted-foreground text-xs">Bell count</p>
            <p className="font-semibold text-lg">{bellTotal}</p>
          </div>
          <div className="rounded-md border p-2">
            <p className="text-muted-foreground text-xs">Stored instant alerts</p>
            <p className="font-semibold text-lg">{stored}</p>
          </div>
          <div className="rounded-md border p-2">
            <p className="text-muted-foreground text-xs">Dismissed ids</p>
            <p className="font-semibold text-lg">{read}</p>
          </div>
        </div>

        {endpointStatus.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Poll APIs</p>
            <div className="space-y-1">
              {endpointStatus.map((ep) => (
                <div
                  key={ep.path}
                  className="flex items-center justify-between gap-2 text-xs rounded border px-2 py-1"
                >
                  <span className="truncate font-mono">{ep.path}</span>
                  <Badge variant={ep.ok ? 'default' : 'destructive'}>
                    {ep.status === 'error' ? 'ERR' : ep.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {Object.keys(bellByModule).length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Bell by module</p>
            <div className="flex flex-wrap gap-2">
              {MODULE_ORDER.filter((m) => (bellByModule[m] ?? 0) > 0).map((m) => (
                <Badge key={m} variant="secondary">
                  {MODULE_LABELS[m]}: {bellByModule[m]}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
