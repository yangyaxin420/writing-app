const CACHE = 'write-page-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png'
];

// Install: cache app shell
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

// Fetch: cache-first for assets, network-first for everything else
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  // For app assets: cache first
  if (ASSETS.includes(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
    return;
  }

  // For everything else: network first, fall back to cache
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache a copy of successful responses
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
