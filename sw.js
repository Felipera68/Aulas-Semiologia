const VERSAO = 'semiologia-v8';
const CASCA = [
  './', './index.html', './manifest.webmanifest',
  './assets/style.css', './assets/app.js',
  './data/aulas.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(CASCA)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(resp => {
      if (resp && resp.status === 200 && resp.type === 'basic') {
        const copia = resp.clone();
        caches.open(VERSAO).then(c => c.put(e.request, copia));
      }
      return resp;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
