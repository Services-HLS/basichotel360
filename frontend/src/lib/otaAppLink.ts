export function getOtaAppUrl() {
  return (import.meta.env.VITE_OTA_APP_URL || 'http://localhost:8081').replace(/\/$/, '');
}

export function isOtaChannelManagerEnabled() {
  const flag = String(import.meta.env.VITE_OTA_CHANNEL_MANAGER_ENABLED ?? '')
    .trim()
    .toLowerCase();

  if (flag === 'true') return true;
  if (flag === 'false') return false;

  // Local dev: open OTA app by default. Production build: show Coming Soon unless enabled above.
  return import.meta.env.DEV;
}

export function openOtaChannelManager() {
  if (!isOtaChannelManagerEnabled()) {
    throw new Error('COMING_SOON');
  }

  const token = localStorage.getItem('authToken');

  if (!token) {
    throw new Error('Please log in to open OTA Channel Manager.');
  }

  const redirect = encodeURIComponent('/ota-channel-manager');
  window.location.href = `${getOtaAppUrl()}/sso?token=${encodeURIComponent(token)}&redirect=${redirect}`;
}
