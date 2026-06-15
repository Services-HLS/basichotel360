/**
 * Google Sheets (Basic / free plan) login used after registration and on login page.
 */

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwA1sC2rREM50Ri9p0r-tWy3Jz-RSe39N9iu90qiRopKUvJ17fxYptB4yhbfQOBM62z/exec';

export type BasicLoginResult = {
  userData: Record<string, unknown>;
};

const loadScript = (src: string): Promise<any> =>
  new Promise((resolve, reject) => {
    const callbackName = 'cb_' + String(Date.now());
    (window as any)[callbackName] = (data: any) => {
      resolve(data);
      delete (window as any)[callbackName];
    };
    const script = document.createElement('script');
    script.src = src + (src.includes('?') ? '&' : '?') + 'callback=' + callbackName;
    script.onerror = () => reject(new Error('Network error'));
    document.head.appendChild(script);
  });

export async function fetchBasicPlanHotels(): Promise<any[]> {
  const data = await loadScript(`${APPS_SCRIPT_URL}?action=getHotels`);
  if (!data?.hotels || !Array.isArray(data.hotels)) return [];

  return data.hotels
    .map((hotel: any) => ({
      name: hotel.name || hotel.Name || hotel.hotelName || 'Unnamed Hotel',
      spreadsheetId: hotel.spreadsheetId || hotel.spreadsheetid || '',
      address: hotel.address || '',
      phone: hotel.phone || '',
      email: hotel.email || '',
      plan: hotel.plan || 'basic',
    }))
    .filter((h: any) => h.spreadsheetId);
}

export async function loginBasicPlanUser(
  username: string,
  password: string
): Promise<BasicLoginResult> {
  const hotels = await fetchBasicPlanHotels();
  if (!hotels.length) {
    throw new Error('Could not load hotel list. Please try again.');
  }

  for (const hotel of hotels) {
    try {
      const loginData = await loadScript(
        `${APPS_SCRIPT_URL}?action=getLoginDetails&spreadsheetid=${encodeURIComponent(hotel.spreadsheetId)}`
      );
      const users = loginData.loginDetails || loginData.data || [];
      const user = users.find(
        (u: any) =>
          u?.username &&
          u?.password &&
          String(u.username).trim().toLowerCase() === username.trim().toLowerCase() &&
          String(u.password).trim() === password.trim()
      );

      if (user) {
        if (user.status && user.status !== 'active') {
          throw new Error('Your account is pending approval.');
        }

        const userData = {
          ...user,
          hotelName: hotel.name || 'Hotel',
          spreadsheetId: hotel.spreadsheetId,
          source: 'google_sheets',
          plan: hotel.plan || 'free',
          role: user.role || 'admin',
          permissions: user.permissions?.length
            ? user.permissions
            : ['view_rooms', 'view_bookings', 'create_booking', 'manage_housekeeping'],
          hotelAddress: hotel.address || '',
          hotelPhone: hotel.phone || '',
          hotelEmail: hotel.email || '',
        };

        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem('basicPlanSession', 'true');

        return { userData };
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('pending')) throw err;
      continue;
    }
  }

  throw new Error('Invalid username or password');
}
