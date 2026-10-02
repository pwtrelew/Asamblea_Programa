```javascript
const CACHE_NAME = 'asamblea-pwa-v5';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Obliga a instalar la actualización inmediatamente
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
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

self.addEventListener('fetch', event => {
  // Ignorar peticiones a Firebase
  if (event.request.method !== 'GET' || event.request.url.includes('firestore.googleapis.com')) {
    return;
  }

  // ESTRATEGIA: Red Primero, Respaldo en Caché (Network First)
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Si hay internet y responde bien, mostramos la versión nueva y actualizamos el caché
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Si no hay internet, servimos la versión guardada en el celular
        return caches.match(event.request);
      })
  );
});
```