// Service Worker for NameJam - Client-side CDN
const CACHE_NAME = 'namejam-v1';
const STATIC_CACHE = 'namejam-static-v1';
const DYNAMIC_CACHE = 'namejam-dynamic-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('namejam-') && 
                   cacheName !== CACHE_NAME &&
                   cacheName !== STATIC_CACHE &&
                   cacheName !== DYNAMIC_CACHE;
          })
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API requests
  if (url.pathname.startsWith('/api/')) return;

  // Cache-first strategy for static assets
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'font' ||
      request.destination === 'image' ||
      url.pathname.match(/\.(js|css|woff2?|ttf|otf|png|jpg|jpeg|svg|ico)$/)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version and update cache in background
          fetch(request).then((freshResponse) => {
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, freshResponse);
            });
          }).catch(() => {/* Ignore errors */});
          return cachedResponse;
        }
        // If not cached, fetch and cache
        return fetch(request).then((freshResponse) => {
          return caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, freshResponse.clone());
            return freshResponse;
          });
        });
      })
    );
    return;
  }

  // Network-first strategy for HTML
  if (request.destination === 'document' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, response.clone());
            return response;
          });
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Default: network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        return caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, response.clone());
          return response;
        });
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Message handler for cache management
self.addEventListener('message', (event) => {
  if (event.data.action === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});