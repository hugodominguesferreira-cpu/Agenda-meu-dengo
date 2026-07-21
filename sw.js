// Service worker mínimo — só existe pra habilitar a instalação como app de verdade
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { self.clients.claim(); });
self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request));
});
