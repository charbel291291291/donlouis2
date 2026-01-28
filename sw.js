const CACHE_NAME = 'don-louis-v6';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './logo.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Allow caching of local files and CDN assets
  const isAllowed = url.origin === location.origin || 
                    url.hostname === 'cdn.tailwindcss.com';

  if (!isAllowed) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      const networkFetch = fetch(event.request).then((networkResponse) => {
        if (networkResponse.ok) {
           cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || networkFetch;
    })
  );
});

self.addEventListener('push', (event) => {
  if (event.data) {
    let data = {};
    try { data = event.data.json(); } catch (e) { data = { title: 'Don Louis', body: event.data.text() }; }
    event.waitUntil(
      self.registration.showNotification(data.title || 'Don Louis', {
        body: data.body || 'New update available',
        icon: './logo.svg',
        data: { url: data.url || '/' }
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});