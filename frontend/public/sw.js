/*
  HMS Service Worker - PRODUCTION READY
  Optimized for TWA (APK) and Standard PWA
*/

const CACHE_NAME = "hms-v3.1"; // Increment this to force all clients to update
const OFFLINE_URL = "/offline.html";

const PRE_CACHE_RESOURCES = [
  "/",
  "/index.html",
  OFFLINE_URL,
  "/manifest.json",
  "/favicon.ico",
];

importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js",
);

if (workbox) {
  // 1. Immediate Activation
  self.skipWaiting();
  workbox.core.clientsClaim();

  // 2. Clear Old Caches
  self.addEventListener("activate", (event) => {
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) return caches.delete(key);
          }),
        ),
      ),
    );
  });

  // 3. Cache Hashed Assets (Vite/Build Assets)
  // These are immutable, so we can use CacheFirst
  workbox.routing.registerRoute(
    ({ url }) =>
      url.origin === self.location.origin &&
      (url.pathname.startsWith("/assets/") || url.pathname.includes("-")),
    new workbox.strategies.CacheFirst({
      cacheName: "static-assets",
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        }),
      ],
    }),
  );

  // 4. Standard Strategy for other scripts/styles
  workbox.routing.registerRoute(
    ({ request }) =>
      request.destination === "script" || request.destination === "style",
    new workbox.strategies.StaleWhileRevalidate({ cacheName: "hms-resources" }),
  );

  // 5. Offline Navigation Handler (CRITICAL FOR APK)
  self.addEventListener("fetch", (event) => {
    if (event.request.mode === "navigate") {
      event.respondWith(
        fetch(event.request).catch(() => {
          return caches.match(OFFLINE_URL) || caches.match("/");
        }),
      );
    }
  });

  // 6. Push Update Listener
  self.addEventListener("push", (event) => {
    const data = event.data
      ? event.data.json()
      : { title: "HMS Update", body: "New features added!" };
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
      }),
    );
  });
}
