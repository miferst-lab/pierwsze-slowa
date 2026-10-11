// Service worker: cache powłoki aplikacji (offline po pierwszym wczytaniu).
// Nagrania lektora (audio/*.mp3, ok. 1,3 MB razem) NIE są w SHELL: pierwsze wczytanie zostaje lekkie.
// Są cache'owane leniwie (przy pierwszym odtworzeniu, patrz handler fetch) oraz dociągane w tle po komunikacie
// {type:'precache-audio'} wysyłanym przez stronę ~6 s po starcie (pomijane przy włączonym oszczędzaniu danych).
// UWAGA: przy KAŻDEJ zmianie plików podnieś VERSION – stary cache zostanie usunięty przy aktywacji.
const VERSION = 'v25';
const CACHE = `pierwsze-slowa-${VERSION}`;
const SHELL = [
  './',
  'art/badges/dzungla.webp',
  'art/badges/kosmos.webp',
  'art/badges/wyspy.webp',
  'art/guides/dzungla-cieszy.webp',
  'art/guides/dzungla-macha.webp',
  'art/guides/kosmos-cieszy.webp',
  'art/guides/kosmos-macha.webp',
  'art/guides/kosmos-mysli.webp',
  'art/guides/kosmos-stoi.webp',
  'art/guides/wyspy-cieszy.webp',
  'art/guides/wyspy-macha.webp',
  'art/helpers/dzungla-cieszy.webp',
  'art/helpers/dzungla-macha.webp',
  'art/helpers/kosmos-cieszy.webp',
  'art/helpers/kosmos-macha.webp',
  'art/helpers/lesna-cieszy.webp',
  'art/helpers/lesna-macha.webp',
  'art/helpers/wyspy-cieszy.webp',
  'art/helpers/wyspy-macha.webp',
  'art/kids/kuba-face.webp',
  'art/kids/kuba-lis-cieszy.webp',
  'art/kids/kuba-lis-macha.webp',
  'art/kids/kuba-lis-mysli.webp',
  'art/kids/kuba-lis-stoi.webp',
  'art/kids/kuba-wiewiorka-cieszy.webp',
  'art/kids/kuba-wiewiorka-macha.webp',
  'art/kids/kuba-wiewiorka-mysli.webp',
  'art/kids/kuba-wiewiorka-stoi.webp',
  'art/kids/piotr-face.webp',
  'art/kids/piotr-lis-cieszy.webp',
  'art/kids/piotr-lis-macha.webp',
  'art/kids/piotr-lis-mysli.webp',
  'art/kids/piotr-lis-stoi.webp',
  'art/kids/piotr-pingwin-cieszy.webp',
  'art/kids/piotr-pingwin-macha.webp',
  'art/kids/piotr-pingwin-mysli.webp',
  'art/kids/piotr-pingwin-stoi.webp',
  'art/kids/piotr-tygrys-cieszy.webp',
  'art/kids/piotr-tygrys-macha.webp',
  'art/kids/piotr-tygrys-mysli.webp',
  'art/kids/piotr-tygrys-stoi.webp',
  'art/kids/sara-face.webp',
  'art/kids/sara-lisica-cieszy.webp',
  'art/kids/sara-lisica-macha.webp',
  'art/kids/sara-lisica-mysli.webp',
  'art/kids/sara-lisica-stoi.webp',
  'art/kids/sara-sarna-cieszy.webp',
  'art/kids/sara-sarna-macha.webp',
  'art/kids/sara-sarna-stoi.webp',
  'art/lektor/dzungla-cieszy.webp',
  'art/lektor/dzungla-mysli.webp',
  'art/lektor/kosmos-cieszy.webp',
  'art/lektor/kosmos-mowi.webp',
  'art/lektor/kosmos-mysli.webp',
  'art/lektor/lesna-cieszy.webp',
  'art/lektor/lesna-mowi.webp',
  'art/lektor/lesna-mysli.webp',
  'art/lektor/wyspy-cieszy.webp',
  'art/lektor/wyspy-mowi.webp',
  'art/lektor/wyspy-mysli.webp',
  'art/lesna/ekipa.webp',
  'art/lesna/jez.webp',
  'art/lesna/lis-cieszy.webp',
  'art/lesna/lis-macha.webp',
  'art/lesna/lis.webp',
  'art/lesna/mis.webp',
  'art/lesna/sowa.webp',
  'art/lesna/tlo-lesna.webp',
  'art/lesna/wiewiorka.webp',
  'art/lesna/wyprawa.webp',
  'art/lesna/zajac.webp',
  'art/scenes/mapa-dzungla.webp',
  'art/scenes/mapa-kosmos.webp',
  'art/scenes/mapa-lesna.webp',
  'art/scenes/mapa-wyspy.webp',
  'art/scenes/start-dzungla.webp',
  'art/scenes/start-kosmos.webp',
  'art/scenes/start-lesna.webp',
  'art/scenes/start-wyspy.webp',
  'art/scenes/zad-dzungla.webp',
  'art/scenes/zad-kosmos.webp',
  'art/scenes/zad-wyspy.webp',
  'art/stars/dzungla.webp',
  'art/stars/kosmos.webp',
  'art/stars/lesna.webp',
  'art/stars/wyspy.webp',
  'art/ui/ramka-dzungla.webp',
  'art/ui/ramka-kosmos.webp',
  'art/ui/ramka-wyspy.webp',
  'art/words/balon.webp',
  'art/words/dom.webp',
  'art/words/kot.webp',
  'art/words/mak.webp',
  'art/words/mama.webp',
  'art/words/ryba.webp',
  'art/words/zaba.webp',
  'css/app.css',
  'css/lesna.css',
  'css/pron.css',
  'icon.svg',
  'index.html',
  'js/app.js',
  'js/art/kids.js',
  'js/art/kidsizes.js',
  'js/art/lesna.js',
  'js/art/manip.js',
  'js/art/words.js',
  'js/art/worlds.js',
  'js/core/avatar.js',
  'js/core/lines.js',
  'js/core/narrator.js',
  'js/core/numerals.js',
  'js/core/progress.js',
  'js/core/say.js',
  'js/core/spoken.js',
  'js/core/ui.js',
  'js/games/index.js',
  'js/games/logic.js',
  'js/games/map.js',
  'js/games/phrases.js',
  'js/parent.js',
  'modules/index.js',
  'modules/math/curriculum.js',
  'modules/math/index.js',
  'modules/math/runner.js',
  'modules/math/say.js',
  'modules/pron/curriculum.js',
  'modules/pron/index.js',
  'modules/pron/mouth.js',
  'modules/pron/recorder.js',
  'modules/pron/runner.js',
  'modules/reading/curriculum.js',
  'modules/reading/index.js',
  'modules/reading/runner.js',
  'audio/manifest.json',
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
    if (res.ok && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  })).catch(() => caches.match('index.html')));
});

// Dociąganie nagrań w tle (po 3 naraz). Błędy ignorujemy: lektor i tak pobierze brakujący plik przy odtwarzaniu.
let precaching = false;
self.addEventListener('message', (e) => {
  if (e.data?.type !== 'precache-audio' || precaching) return;
  precaching = true;
  e.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE);
      const res = await fetch('audio/manifest.json', { cache: 'no-cache' });
      if (!res.ok) return;
      await cache.put('audio/manifest.json', res.clone());
      const j = await res.json();
      const ids = Object.keys(j.clips ?? j);
      const todo = [];
      for (const id of ids) if (/^[st]-[a-z0-9_]+$/.test(id) && !(await cache.match(`audio/${id}.mp3`))) todo.push(`audio/${id}.mp3`);
      const worker = async () => { for (let u; (u = todo.shift());) { try { const r = await fetch(u); if (r.ok && r.status === 200) await cache.put(u, r); } catch { /* offline – spróbujemy następnym razem */ } } };
      await Promise.all([worker(), worker(), worker()]);
    } catch { /* ignore */ } finally { precaching = false; }
  })());
});
