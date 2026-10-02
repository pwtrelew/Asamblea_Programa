```javascript
const CACHE_NAME = 'asamblea-pwa-v3';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', event => {
  // Ya NO hacemos self.skipWaiting() aquí, porque queremos 
  // controlar manualmente cuándo se instala la nueva versión
  // a través del botón "Actualizar" en la App.
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('firestore.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request).then(fetchRes => {
          return caches.open(CACHE_NAME).then(cache => {
            if (event.request.url.startsWith(self.location.origin) && fetchRes.status === 200) {
                cache.put(event.request, fetchRes.clone());
            }
            return fetchRes;
          });
        });
      }).catch(() => {})
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Escuchar mensaje desde la App (cuando el usuario toca el botón "Actualizar")
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```