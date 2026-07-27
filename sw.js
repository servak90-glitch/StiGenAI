
const CACHE_NAME = 'sticker-app-v45-fix-i18n'; 
const urlsToCache = [
  '/',
  '/index.html',
  // Local Upscaler Model
  '/models/model.json',
  '/models/group1-shard1of1.weights'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return Promise.all(
             urlsToCache.map(url => {
                 return cache.add(url).catch(err => {
                     console.warn('Failed to cache ' + url, err);
                 });
             })
        );
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
