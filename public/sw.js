// Bumped to v3 so the old cache (which held the previous manifest + single
// "any maskable" icon) is purged and the corrected icons propagate to installs.
const CACHE_NAME = 'pitchnest-cache-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/icon.svg',
  '/logo.png',
  '/logo.svg',
  '/logo-maskable-192.png',
  '/logo-maskable-512.png',
  '/dashboard-mockup.png'
];

// Install event: cache initial static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('🧹 Clearing old PWA Cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event: serve from cache or network, bypassing API and WebSockets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass API requests, non-GET requests, Supabase database calls, and WebSocket connections
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api') ||
    url.hostname.includes('supabase') ||
    event.request.headers.get('Upgrade') === 'websocket'
  ) {
    return; // Let browser fetch naturally without intercepting
  }

  // Stale-While-Revalidate caching strategy for static frontend assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh version in the background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {}); // Silence background errors if offline
        return cachedResponse;
      }

      // Network fallback
      return fetch(event.request).then((response) => {
        // Cache dynamic static files if successful
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return response;
      }).catch((err) => {
        console.error('SW fetch failed for:', url.href, err);
        throw err;
      });
    })
  );
});
