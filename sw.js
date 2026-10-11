// Service worker: cache powłoki aplikacji (offline po pierwszym wczytaniu).
// UWAGA: przy KAŻDEJ zmianie plików podnieś VERSION – stary cache zostanie usunięty przy aktywacji.
const VERSION = 'v1';
const CACHE = `pierwsze-slowa-${VERSION}`;
const SHELL = [
  './', 'index.html', 'icon.svg', 'css/app.css', 'audio/manifest.json',
  'js/app.js', 'js/parent.js', 'js/core/narrator.js', 'js/core/progress.js', 'js/core/say.js', 'js/core/ui.js',
  'js/art/words.js', 'js/art/worlds.js',
  'modules/index.js', 'modules/reading/index.js', 'modules/reading/curriculum.js', 'modules/reading/runner.js', 'modules/math/index.js',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('pierwsze-slowa-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // manifest nagrań: sieć najpierw (może się zmienić); reszta: cache, potem sieć
  if (new URL(req.url).pathname.endsWith('/audio/manifest.json')) {
    e.respondWith(fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; }).catch(() => caches.match(req)));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit ?? fetch(req).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  })).catch(() => caches.match('index.html')));
});
