self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // PWA requires a fetch handler to be recognized as installable.
  // We can just fall back to network.
  e.respondWith(fetch(e.request).catch(() => new Response('Offline', { status: 503 })));
});
