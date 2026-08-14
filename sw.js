// Service worker com cache real do app shell, pra funcionar offline
const CACHE_NAME = 'meudengo-v4';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).catch(()=>{})
  );
});

self.addEventListener('activate', (e) => {
  self.clients.claim();
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  // Navegação (abrir o app) e o próprio HTML: abre na hora com o que já está salvo,
  // e atualiza por trás dos panos em silêncio pra próxima vez — sem deixar o usuário esperando.
  if (e.request.mode === 'navigate' || e.request.url.endsWith('index.html') || e.request.url === self.location.origin + '/') {
    e.respondWith(
      caches.match('./index.html').then(cached => {
        const fetchPromise = fetch(e.request).then(res => {
          if (res && res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put('./index.html', resClone)).catch(()=>{});
          }
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Demais arquivos (ícones, CSS embutido, etc.): tenta a rede, cai pro cache se falhar
  e.respondWith(
    fetch(e.request).then(res => {
      if (res && (res.status === 200 || res.type === 'opaque')) {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone)).catch(()=>{});
      }
      return res;
    }).catch(() => {
      return caches.match(e.request).then(cached => {
        if (cached) return cached;
        if (e.request.mode === 'navigate') return caches.match('./index.html');
        return new Response('', {status: 408, statusText: 'Offline'});
      });
    })
  );
});
