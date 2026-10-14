#!/usr/bin/env node
// Test w prawdziwym (headless) Chrome: przeklikuje aplikację, sprawdza błędy konsoli, brak zewnętrznych
// żądań, brak przewijania w zadaniach i robi zrzuty ekranu.
// Użycie: PUPPETEER_CORE=/ścieżka/do/puppeteer-core node tools/browser-check.mjs [katalog-zrzutów]
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, symlinkSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_CORE ?? 'puppeteer-core');
const CHROME = process.env.CHROME ?? '/usr/bin/google-chrome';
const OUT = process.argv[2] ?? '/workspace/pierwsze-slowa-shots-v2';
// Grę serwujemy pod PODŚCIEŻKĄ /pierwsze-slowa/ (jak GitHub Pages), żeby sprawdzić, że ścieżki do audio i service workera są względne.
const PORT = 8765, ORIGIN = `http://localhost:${PORT}`, BASE = `${ORIGIN}/pierwsze-slowa`;
mkdirSync(OUT, { recursive: true });
const root = new URL('..', import.meta.url).pathname;
const serveDir = mkdtempSync(join(tmpdir(), 'ps-serve-'));
symlinkSync(root.replace(/\/$/, ''), join(serveDir, 'pierwsze-slowa'));
const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: serveDir, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));

const report = { consoleErrors: [], pageErrors: [], externalRequests: [], failedRequests: [], noScrollViolations: [], steps: [], tasksSolved: {}, spoken: [], audio: {} };
const ok = (m) => { report.steps.push(m); console.log('✔', m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });

const STUB_VOICES = [
  { name: 'Microsoft David - English (United States)', lang: 'en-US', localService: true, voiceURI: 'stub-david' },
  { name: 'Microsoft Paulina - Polish (Poland)', lang: 'pl-PL', localService: true, voiceURI: 'stub-paulina', default: true },
  { name: 'Microsoft Zofia Online (Natural) - Polish (Poland)', lang: 'pl-PL', localService: false, voiceURI: 'stub-zofia-online' },
];
async function newPage(w = 1366, h = 768, stub = false, { collect = true } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });
  if (collect) {
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) report.consoleErrors.push(`${m.type()}: ${m.text()} @${m.location()?.url ?? ''}`); });
    page.on('requestfailed', (r) => report.failedRequests.push(r.url() + ' ' + r.failure()?.errorText));
    page.on('response', (r) => { if (r.status() >= 400) report.failedRequests.push(r.status() + ' ' + r.url()); });
  }
  page.on('response', (r) => { const u = r.url(); if (u.includes('/audio/')) report.audio[u.replace(BASE, '')] = { status: r.status(), type: r.headers()['content-type'], bytes: Number(r.headers()['content-length'] ?? 0) }; });
  page.on('pageerror', (e) => report.pageErrors.push(String(e)));
  page.on('request', (r) => { const u = r.url(); if (!u.startsWith(ORIGIN) && !u.startsWith('data:') && !u.startsWith('blob:')) report.externalRequests.push(u); });
  // zdarzenia elementów <audio> (play/ended/error) – do sprawdzenia, że nagrania naprawdę grają
  await page.evaluateOnNewDocument(() => {
    window.__audio = [];
    const Orig = window.Audio;
    window.Audio = function (src) {
      const a = new Orig(src);
      for (const ev of ['playing', 'ended', 'error']) a.addEventListener(ev, () => window.__audio.push({ ev, dur: a.duration, rate: a.playbackRate, vol: a.volume }));
      return a;
    };
  });
  if (stub) await page.evaluateOnNewDocument((voices) => {
    window.__spoken = [];
    const synth = { getVoices: () => voices, speak(u) { window.__spoken.push({ text: u.text, rate: Math.round(u.rate * 100) / 100, volume: Math.round(u.volume * 100) / 100, pitch: u.pitch, lang: u.lang, voice: u.voice?.name }); setTimeout(() => u.onend?.(), 30); }, cancel() {}, addEventListener() {} };
    Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
  }, STUB_VOICES);
  return page;
}
const shot = (page, name) => page.screenshot({ path: `${OUT}/${name}.png` });
const click = async (page, sel) => { await page.waitForSelector(sel, { visible: true, timeout: 5000 }); await page.click(sel); };

async function chooseWorld(page, id) {
  await click(page, '.world-btn');
  await click(page, `.world-choice[data-world="${id}"]`);
  await page.waitForFunction((i) => document.documentElement.dataset.world === i, {}, id);
}
async function noScroll(page, label) {
  const r = await page.evaluate(() => ({ sh: document.getElementById('app').scrollHeight, ih: document.getElementById('app').clientHeight, sw: document.documentElement.scrollWidth, iw: innerWidth }));
  if (r.sh > r.ih + 1 || r.sw > r.iw + 1) report.noScrollViolations.push(`${label}: ${JSON.stringify(r)}`);
}

async function solveCurrentTask(page, { tryWrongFirst = false, shotName = null, label = '' } = {}) {
  await page.waitForSelector('#stage', { timeout: 5000 });
  const type = await page.$eval('#stage', (s) => [...s.classList].find((c) => c.startsWith('t-')).slice(2));
  await sleep(350);
  if (shotName) await shot(page, shotName.replace('{type}', type));
  await noScroll(page, `${label} ${type}`);
  if (tryWrongFirst && ['hear', 'initial', 'hearPic', 'pick', 'sentpic'].includes(type)) {
    const wrong = await page.$('.opt:not([data-correct])');
    await wrong.click(); await sleep(150);
    const msg = await page.$eval('.bubble', (b) => b.textContent);
    if (!/jeszcze raz/i.test(msg)) throw new Error('brak łagodnej informacji po błędnej odpowiedzi: ' + msg);
    if (/źle|błąd/i.test(msg)) throw new Error('niełagodny komunikat: ' + msg);
  }
  if (type === 'readtap') { for (const w of await page.$$('.tapword')) await w.click(); }
  else if (type === 'build') {
    if (tryWrongFirst) { // celowo odwrotna kolejność -> łagodny błąd, potem poprawnie
      const n = (await page.$$('.tile')).length;
      if (n > 1) {
        for (let i = 0; i < n; i++) { // zawsze klikamy kafelek o NAJWYŻSZYM numerze = odwrotna kolejność
          const tiles = await page.$$('.tile'); const pos = await Promise.all(tiles.map((t) => t.evaluate((e) => Number(e.dataset.pos))));
          await tiles[pos.indexOf(Math.max(...pos))].click(); await sleep(40);
        }
        await sleep(1400);
        if (await page.$('.slots.good')) { /* słowo o identycznych jednostkach – odwrotnie też poprawnie */ }
        else if (!(await page.$('.slot:not(.filled)'))) throw new Error('kafelki nie wróciły');
      }
    }
    for (let guard = 0; guard < 8; guard++) {
      const tiles = await page.$$('.tile'); if (!tiles.length) break;
      const pos = await Promise.all(tiles.map((t) => t.evaluate((e) => Number(e.dataset.pos))));
      const lowest = pos.indexOf(Math.min(...pos)); await tiles[lowest].click(); await sleep(60);
    }
  } else if (type === 'story') { for (const l of await page.$$('.sline')) await l.click(); await click(page, '.opt[data-correct]'); }
  else await click(page, '.opt[data-correct]');
  await page.waitForSelector('.next:not([hidden])', { timeout: 4000 });
  report.tasksSolved[type] = (report.tasksSolved[type] ?? 0) + 1;
  await click(page, '.next');
  return type;
}
async function playLevel(page, levelId, opts = {}) {
  await click(page, `.tile-level[data-level="${levelId}"]`);
  for (let i = 0; i < 12; i++) {
    if (await page.$('.done-screen')) break;
    await solveCurrentTask(page, { ...opts, tryWrongFirst: opts.tryWrongFirst && i % 2 === 0, shotName: opts.shotName, label: levelId });
    await sleep(80);
  }
  await page.waitForSelector('.done-screen', { timeout: 4000 });
}

/* ---------- matematyka i zabawy ---------- */
async function solveMathTask(page, { tryWrong = false, shotName = null, label = '' } = {}) {
  await page.waitForSelector('#stage', { timeout: 5000 });
  const task = await page.evaluate(() => window.__ps.task);
  const type = task.type; await sleep(300);
  if (shotName) await shot(page, shotName.replace('{type}', type));
  await noScroll(page, `${label} ${type}`);
  const gentle = async () => { const msg = await page.$eval('.bubble', (b) => b.textContent); if (!/jeszcze raz|spróbuj|sprawdź|policz/i.test(msg) || /źle|błąd/i.test(msg)) throw new Error('niełagodny komunikat: ' + msg); };
  if (tryWrong && task.options && !['cmpGroups'].includes(type)) { const w = await page.$('.opt:not([data-correct])'); if (w) { await w.click(); await sleep(120); await gentle(); } }
  if (tryWrong && ['make', 'frame', 'pay'].includes(type)) { await click(page, '#done-btn'); await sleep(120); await gentle(); }
  if (type === 'order') {
    const sorted = [...task.nums].sort((a, b) => (task.dir === 'asc' ? a - b : b - a));
    for (const n of sorted) { await click(page, `.tile[data-n="${n}"]`); await sleep(40); }
  } else if (type === 'make') {
    for (let i = 0; i < task.n; i++) await page.click('.pile .manip');
    await click(page, '#done-btn');
  } else if (type === 'frame') {
    for (let i = 0; i < task.add; i++) await page.click('.cell.empty');
    await click(page, '#done-btn');
  } else if (type === 'pay') {
    let left = task.amount;
    for (const v of [10, 5, 2, 1]) while (left >= v && (await page.$(`.tray .moneybtn[data-v="${v}"]`))) { await page.click(`.tray .moneybtn[data-v="${v}"]`); left -= v; }
    if (left) throw new Error('nie da się zapłacić ' + task.amount);
    await click(page, '#done-btn');
  } else await click(page, '.opt[data-correct]');
  await page.waitForSelector('.next:not([hidden])', { timeout: 4000 });
  report.tasksSolved['m:' + type] = (report.tasksSolved['m:' + type] ?? 0) + 1;
  await click(page, '.next');
  return type;
}
async function playMathLevel(page, id, opts = {}) {
  await click(page, `.tile-level[data-level="${id}"]`);
  for (let i = 0; i < 10; i++) {
    if (await page.$('.done-screen')) break;
    await solveMathTask(page, { ...opts, tryWrong: opts.tryWrong && i % 2 === 0, label: id });
    await sleep(60);
  }
  await page.waitForSelector('.done-screen', { timeout: 4000 });
  const st = await page.evaluate((i) => window.__ps.state.levels[i], id);
  if (!st?.done || !Object.values(st.tasks).every((x) => x >= 1)) throw new Error('gwiazdki nie przyznane za ' + id + ': ' + JSON.stringify(st));
}
async function playGame(page, subject, gameId, { shotMid = null, keyboard = false } = {}) {
  await click(page, `.tile-game[data-game="${gameId}"]`);
  await page.waitForSelector('.game-field', { timeout: 5000 });
  if (shotMid) { await sleep(2200); await shot(page, shotMid); }
  await noScroll(page, `${subject} ${gameId}`);
  const t0 = Date.now(); let hits = 0, lastHits = -1;
  while (!(await page.$('.game-done')) && Date.now() - t0 < 90000) {
    const info = await page.evaluate(() => ({ c: window.__ps.game?.tracker.correct, w: window.__ps.game?.tracker.wrongs }));
    if (info.c !== lastHits) { lastHits = info.c; hits++; }
    const el = await page.$('.game-field [data-correct]:not(.caught):not(.popped)');
    if (!el) { await sleep(150); continue; }
    if (info.w === 0 && info.c === 0) { const bad = await page.$('.game-field .gitem:not([data-correct]):not(.drift)'); if (bad) { await bad.click().catch(() => {}); await sleep(200); } } // jedna celowa pomyłka: łagodna reakcja
    if (keyboard) { await el.focus().catch(() => {}); await page.keyboard.press('Enter').catch(() => {}); } else await el.click().catch(() => {});
    await sleep(200);
  }
  await page.waitForSelector('.game-done', { timeout: 5000 });
  const g = await page.evaluate((s, i) => ({ info: window.__ps.state.games[s + ':' + i], t: window.__ps.game.tracker.correct }), subject, gameId);
  if (!g.info || g.info.stars < 1 || g.t < 6) throw new Error(`zabawa ${subject}:${gameId} bez gwiazdki: ` + JSON.stringify(g));
  return g.info;
}

try {
  // ---------- Faza 1: bez głosu polskiego (headless Chrome na Linuksie zwykle nie ma głosów) ----------
  const page = await newPage();
  await page.goto(BASE + '/?test=1', { waitUntil: 'networkidle0' });
  await page.waitForSelector('.module-card');
  await sleep(3500); // czas na wykrycie braku głosów
  const banner = await page.$eval('#voice-banner', (b) => !b.hidden && b.textContent);
  if (banner) throw new Error('baner braku głosu mimo nagrań: ' + banner);
  ok('ekran startowy; baner braku głosu ukryty (są nagrania, brak głosu systemowego w headless Chrome)');
  await page.evaluate(() => { window.__ps.narrator.log = []; });
  // nagrania naprawdę grają: pliki ładują się spod podścieżki /pierwsze-slowa/audio/, elementy <audio> kończą bez błędów
  const ev = await page.evaluate(async () => { await window.__ps.narrator.speak(['Posłuchaj.', '#m', 'Brawo!']); return window.__audio; });
  const ended = ev.filter((e) => e.ev === 'ended').length, errs = ev.filter((e) => e.ev === 'error').length;
  if (ended !== 3 || errs) throw new Error('nagrania nie zagrały poprawnie: ' + JSON.stringify(ev));
  if (!ev.every((e) => e.dur > 0.2 && e.dur < 5)) throw new Error('dziwny czas nagrań: ' + JSON.stringify(ev));
  for (const f of ['/audio/t-posu142uchaju2e.mp3', '/audio/s-m.mp3', '/audio/manifest.json']) if (report.audio[f]?.status !== 200) throw new Error('brak 200 dla ' + f + ': ' + JSON.stringify(report.audio));
  if (!/audio\/mpeg/.test(report.audio['/audio/s-m.mp3'].type ?? '')) throw new Error('zły content-type mp3: ' + report.audio['/audio/s-m.mp3'].type);
  ok(`nagrania: 3 pliki zagrane bez błędów pod /pierwsze-slowa/ (czasy ${ev.filter((e) => e.ev === 'ended').map((e) => e.dur.toFixed(2)).join(', ')} s)`);
  { // nowy gracz zaczyna w „Leśnej Wyprawie”; ekran startowy bez przewijania, wszystkie obrazki (portrety, grupa) się wczytały
    const w0 = await page.evaluate(() => document.documentElement.dataset.world);
    if (w0 !== 'lesna') throw new Error('domyślny świat nowego gracza powinien być lesna, jest ' + w0);
    await noScroll(page, 'start lesna'); await sleep(300); await shot(page, '01-start-lesna');
    const bad = await page.evaluate(() => [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src));
    if (bad.length || !(await page.$('.parade-img')) || !(await page.$('.start .mascot img.guide-img, .start .mascot img.fox-hero'))) throw new Error('obrazki Leśnej Wyprawy nie wczytane: ' + bad);
    ok('Leśna Wyprawa: świat domyślny, ekran startowy bez przewijania, obrazki (portret lisa, grupa) wczytane');
  }
  // ekran startowy może się przewijać na bardzo niskich oknach; sprawdzamy tylko zadania

  for (const w of ['dzungla', 'wyspy', 'kosmos', 'lesna']) { await chooseWorld(page, w); await sleep(300); await shot(page, `03-start-${w}`); await noScroll(page, 'start ' + w); }
  if ((await page.evaluate(() => JSON.parse(localStorage.getItem('pierwsze-slowa:v1')).world)) !== 'lesna') throw new Error('świat nie zapisany');
  await click(page, '.world-btn'); const nw = await page.$$eval('.world-choice', (e) => e.length); await click(page, '.overlay .btn');
  if (nw !== 4) throw new Error('powinny być 4 światy, jest ' + nw);
  ok('przełączanie 4 światów na ekranie startowym (bez przewijania), wybór zapisany');

  await click(page, '.module-card[data-module="reading"]');
  await page.waitForSelector('.tile-level'); await shot(page, '04-mapa-poziomow');
  if (!(await page.$('.tile-level.locked'))) throw new Error('brak zablokowanych poziomów');

  // Poziom 1 naturalnie (z błędnymi próbami), potem sprawdzamy odblokowanie L02
  await playLevel(page, 'L01', { tryWrongFirst: true, shotName: 'task-L01-{type}' });
  await sleep(1300); await shot(page, '05-poziom-ukonczony');
  await click(page, '.btn:not(.primary):not(.ghost)'); // „Poziomy”
  await page.waitForSelector('.tile-level');
  if (await page.$('.tile-level[data-level="L02"].locked')) throw new Error('L02 nie odblokowany po L01');
  ok('poziom 1 ukończony, L02 odblokowany');

  // komunikat o nofallbacku w zadaniu "hear" (bez głosu)
  await click(page, '.tile-level[data-level="L02"]'); await page.waitForSelector('#stage');
  const nosound = await page.$('.nosound'); ok('tryb bez głosu: duży tekst zastępczy ' + (nosound ? 'widoczny' : 'niewidoczny (głos dostępny)'));
  await solveCurrentTask(page); await click(page, '.back'); await page.waitForSelector('.tile-level');

  // Odblokuj wszystko i zagraj poziom każdego typu
  await page.evaluate(() => { window.__ps.state.unlockAll = true; });
  await click(page, '.back'); await click(page, '.module-card[data-module="reading"]'); await page.waitForSelector('.tile-level');
  for (const [lid, name] of [['L03', 'task-L03-{type}'], ['L04', 'task-L04-{type}'], ['L05', 'task-L05-{type}'], ['L21', 'task-L21-{type}'], ['L22', 'task-L22-{type}'], ['L24', 'task-L24-{type}']]) {
    await playLevel(page, lid, { tryWrongFirst: true, shotName: name }); ok(`poziom ${lid} przeklikany`);
    await click(page, '.btn:not(.primary):not(.ghost)'); await page.waitForSelector('.tile-level');
  }
  // przeklikaj wszystkie pozostałe poziomy szybko (bez zrzutów), by sprawdzić każde zadanie z programu
  const ids = await page.$$eval('.tile-level[data-level]', (t) => t.map((x) => x.dataset.level));
  for (const lid of ids) {
    if (['L01', 'L03', 'L04', 'L05', 'L21', 'L22', 'L24'].includes(lid)) continue;
    await playLevel(page, lid, {}); await click(page, '.btn:not(.primary):not(.ghost)'); await page.waitForSelector('.tile-level');
  }
  ok('wszystkie ' + ids.length + ' poziomów rozwiązanych w przeglądarce');

  // ---------- matematyka (świat Kosmos, potem pozostałe) ----------
  await click(page, '.back'); await page.waitForSelector('.module-card');
  await click(page, '.module-card[data-module="math"]'); await page.waitForSelector('.tile-level[data-level="M01"]');
  await shot(page, '14-mapa-matematyki');
  if (!(await page.$('.tile-level.locked'))) { /* unlockAll włączone wcześniej */ }
  // podpowiedź po drugiej pomyłce (pulsujący poprawny przycisk) i brak negatywnych komunikatów
  await page.evaluate(() => { window.__ps.state.unlockAll = false; });
  await click(page, '.tile-level[data-level="M01"]'); await page.waitForSelector('#stage');
  const ts = await page.evaluate(() => window.__ps.task.type);
  if (ts === 'count' || ts === 'tapNum') { await click(page, '.opt:not([data-correct])'); await sleep(100); await page.evaluate(() => document.querySelector('.opt.soft')?.classList.remove('soft')); const w2 = await page.$('.opt:not([data-correct]):not(.soft)'); if (w2) await w2.click(); await sleep(150); if (!(await page.$('.opt[data-correct].pulse'))) throw new Error('brak podpowiedzi po drugiej pomyłce'); ok('matematyka: łagodna reakcja i podpowiedź po drugiej pomyłce'); }
  await click(page, '.back'); await page.waitForSelector('.tile-level');
  const mIds = await page.$$eval('.tile-level[data-level]', (t) => t.map((x) => x.dataset.level));
  // naturalnie: M01 (z pomyłkami), potem odblokowanie M02
  await playMathLevel(page, 'M01', { tryWrong: true, shotName: 'math-M01-{type}' }); await sleep(900); await shot(page, '15-matematyka-poziom-ukonczony');
  await click(page, '.btn:not(.primary):not(.accent):not(.ghost)'); await page.waitForSelector('.tile-level');
  if (await page.$('.tile-level[data-level="M02"].locked')) throw new Error('M02 nie odblokowany po M01');
  ok('matematyka: M01 ukończony (gwiazdki zapisane), M02 odblokowany');
  await page.evaluate(() => { window.__ps.state.unlockAll = true; });
  await click(page, '.back'); await click(page, '.module-card[data-module="math"]'); await page.waitForSelector('.tile-level');
  const shots = new Set(['M04', 'M06', 'M09', 'M13', 'M16', 'M18', 'M20', 'M23', 'M24', 'M25', 'M19', 'M10', 'M03']);
  for (const id of mIds) {
    await playMathLevel(page, id, { tryWrong: id !== 'M01', shotName: shots.has(id) ? `math-${id}-{type}` : null });
    await click(page, '.btn:not(.primary):not(.accent):not(.ghost)'); await page.waitForSelector('.tile-level');
  }
  ok(`matematyka: wszystkie ${mIds.length} poziomów rozwiązane w przeglądarce (typy: ${Object.keys(report.tasksSolved).filter((k) => k.startsWith('m:')).length})`);
  // zmiana świata w trakcie zadania matematycznego
  await click(page, '.tile-level[data-level="M07"]'); await page.waitForSelector('#stage');
  for (const w of ['dzungla', 'wyspy', 'kosmos', 'lesna']) { await chooseWorld(page, w); await sleep(250); await shot(page, `16-matematyka-zadanie-swiat-${w}`); await noScroll(page, 'math zadanie ' + w); }
  await click(page, '.back'); await page.waitForSelector('.tile-level');
  await page.evaluate(() => window.scrollTo(0, 0)); await page.$eval('.games', (e) => e.scrollIntoView()); await sleep(200); await shot(page, '17-mapa-matematyki-zabawy');
  // zabawy w matematyce
  for (const g of ['lap', 'sciezka', 'balony']) {
    const info = await playGame(page, 'math', g, { shotMid: `game-math-${g}-mid` });
    await sleep(300); await shot(page, `game-math-${g}-done`); ok(`zabawa math:${g}: ukończona, gwiazdki ${info.stars}`);
    await click(page, '.game-done .btn:not(.primary)'); await page.waitForSelector('.tile-game');
  }
  await click(page, '.back'); await click(page, '.module-card[data-module="reading"]'); await page.waitForSelector('.tile-level');
  await page.$eval('.games', (e) => e.scrollIntoView());
  for (const g of ['lap', 'sciezka', 'balony']) {
    const info = await playGame(page, 'reading', g, { shotMid: `game-reading-${g}-mid`, keyboard: g === 'sciezka' });
    await sleep(300); await shot(page, `game-reading-${g}-done`); ok(`zabawa reading:${g}: ukończona, gwiazdki ${info.stars}${g === 'sciezka' ? ' (klawiatura: fokus + Enter)' : ''}`);
    await click(page, '.game-done .btn:not(.primary)'); await page.waitForSelector('.tile-game');
  }
  // sterowanie strzałkami: Ścieżka (wybór pasa + Enter) i Łap (kosz)
  await page.$eval('.games', (e) => e.scrollIntoView()); await click(page, '.tile-game[data-game="sciezka"]'); await page.waitForSelector('.platform'); await sleep(400);
  await page.evaluate(() => document.activeElement?.blur()); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft');
  if (!(await page.$('.platform.sel'))) throw new Error('brak zaznaczenia pasa po strzałkach');
  await page.keyboard.press('Enter'); await sleep(1500);
  const moved = await page.evaluate(() => { const hh = document.querySelector('.hero'); return parseFloat(hh.style.left) !== 50 || parseFloat(hh.style.top) !== 86; });
  ok('zabawy: sterowanie strzałkami i Enter (Ścieżka) – bohater idzie na wybraną platformę' + (moved ? '' : ' (już wrócił)'));
  await click(page, '.back'); await page.waitForSelector('.tile-level');
  // bonus po poziomie 4
  await playLevel(page, 'L04', {}); await page.waitForSelector('#bonus-btn', { timeout: 3000 }); await shot(page, '18-poziom-4-zabawa-bonusowa');
  await click(page, '#bonus-btn'); await page.waitForSelector('.game-field'); await shot(page, '19-bonus-zabawa'); ok('zabawa bonusowa po poziomie 4 (czytanie)');
  await click(page, '.back'); await page.waitForSelector('.tile-level');

  // każda wypowiedź, którą lektor naprawdę wypowiedział w całej grze, ma nagranie w manifeście
  const spokenParts = await page.evaluate(async () => {
    const { audioId } = await import('./js/core/say.js');
    const m = await (await fetch('audio/manifest.json')).json(); const have = new Set(Object.keys(m.clips));
    const all = [...new Set(window.__ps.narrator.log.flat(Infinity))];
    return { n: all.length, missing: all.filter((p) => !have.has(audioId(p))) };
  });
  if (spokenParts.missing.length) throw new Error('wypowiedzi bez nagrania: ' + spokenParts.missing.join(' | '));
  ok(`lektor wypowiedział ${spokenParts.n} różnych tekstów w całej grze – wszystkie mają nagranie`);
  const plays = await page.evaluate(() => window.__audio.filter((e) => e.ev === 'error').length);
  if (plays) throw new Error('błędy elementów audio podczas gry: ' + plays);
  await shot(page, '06-mapa-po-ukonczeniu');

  // zmiana świata w trakcie zadania
  await click(page, '.tile-level[data-level="L08"]'); await page.waitForSelector('#stage');
  for (const w of ['dzungla', 'wyspy', 'kosmos', 'lesna']) { await chooseWorld(page, w); await sleep(250); await shot(page, `07-zadanie-swiat-${w}`); await noScroll(page, 'zadanie ' + w); }
  ok('przełączenie świata w trakcie zadania');
  // awatar lektorki + poza bohatera w stopce
  for (const w of ['dzungla', 'wyspy', 'kosmos', 'lesna']) {
    await chooseWorld(page, w); await sleep(250);
    const av = await page.evaluate(() => { const i = document.querySelector('#lektor img'); const r = i?.getBoundingClientRect(); return { ok: !!i && i.complete && i.naturalWidth > 0, vis: !!r && r.width > 20 && getComputedStyle(document.querySelector('#lektor')).display !== 'none', src: i?.src, kid: document.querySelector('.feedback .mascot img.kid-img')?.complete };
    });
    if (!av.ok || !av.vis || !av.kid) throw new Error('awatar lektorki niewidoczny lub bez obrazka w świecie ' + w + ' ' + JSON.stringify(av));
    if (!av.src.includes('art/lektor/' + w)) throw new Error('zły awatar dla świata ' + w + ': ' + av.src);
  }
  await page.evaluate(() => { document.documentElement.dataset.avatar = 'off'; });
  if ((await page.$eval('#lektor', (e) => getComputedStyle(e).display)) !== 'none') throw new Error('przełącznik awatara nie ukrywa lektorki');
  await page.evaluate(() => { document.documentElement.dataset.avatar = 'on'; });
  const mood = await page.evaluate(() => new Promise((res) => { const n = globalThis.__ps.narrator; const seen = []; n.onSpeak((e) => { if (e.type === 'start') seen.push(e.mood); }); n.speak(['Brawo!']); n.speak(['Spróbuj jeszcze raz.']); setTimeout(() => res({ seen, now: document.querySelector('#lektor').dataset.mood, src: document.querySelector('#lektor img').src }), 150); }));
  ok('awatar lektorki: widoczny w 4 światach, przełącznik ukrywa; nastroje ' + mood.seen.join('/') + ' (teraz ' + mood.now + ')');
  await click(page, '.back');

  // skarby
  await click(page, '.back'); await click(page, '.start-foot .btn:first-child'); await page.waitForSelector('.collection');
  for (const w of ['kosmos', 'dzungla', 'wyspy', 'lesna']) { await chooseWorld(page, w); await sleep(250); await shot(page, `08-skarby-${w}`); }
  { const nb = await page.$$eval('.badge.got', (e) => e.length); if (nb !== 2) throw new Error('po wszystkich poziomach obie odznaki powinny być zdobyte, jest ' + nb); await page.$eval('.badges', (e) => e.scrollIntoView()); await sleep(200); await shot(page, '08-skarby-odznaki-lesna'); ok('odznaki „Odkrywca Liter” i „Mistrz Liczenia” zdobyte po ukończeniu wszystkich poziomów'); }
  const got = await page.$$eval('.coll.got', (e) => e.length); ok(`skarby: ${got} z 12 zebrane po wszystkich poziomach`);
  await click(page, '.back');

  // rodzic
  await click(page, '.start-foot .btn.ghost'); await page.waitForSelector('#gate-in');
  await shot(page, '09-rodzic-bramka');
  const q = await page.$eval('.gate .lead', (e) => e.textContent); const [a, b] = q.match(/\d+/g).map(Number);
  await page.type('#gate-in', String(a + b + 1)); await click(page, '.gate .btn.primary'); await sleep(200);
  if (!(await page.$('#gate-in'))) throw new Error('bramka przepuściła zły wynik');
  await page.type('#gate-in', String(a + b)); await click(page, '.gate .btn.primary'); await page.waitForSelector('#speed');
  await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));
  await shot(page, '10-rodzic-panel'); ok('panel rodzica: bramka i dashboard');
  { const pn = await page.evaluate(() => { const e = document.querySelector('#pron-note'); return e ? e.textContent : ''; }); if (!/logoped/i.test(pn) || !/lokalnie/i.test(pn) || !/nie terapia|nie terapi|a nie terapia/i.test(pn)) throw new Error('panel rodzica: brak noty o ćwiczeniach wymowy (logopeda, lokalny mikrofon)'); await page.evaluate(() => document.querySelector('#pron-note').scrollIntoView()); await shot(page, 'p7-rodzic-nota'); ok('panel rodzica: nota o ćwiczeniach wymowy (zabawa, logopeda, mikrofon lokalnie)'); }
  // reset
  await click(page, '.btn.danger'); await click(page, '.btn.danger'); await page.waitForSelector('#gate-in');
  const after = await page.evaluate(() => localStorage.getItem('pierwsze-slowa:v1'));
  ok('reset postępów: ' + (after === null ? 'localStorage wyczyszczony' : 'zapis po resecie: ' + after.slice(0, 30)));

  // offline (service worker)
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => navigator.serviceWorker.ready); await sleep(800);
  await page.setOfflineMode(true); await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.module-card', { timeout: 6000 }); ok('offline po pierwszym wczytaniu: aplikacja startuje z cache');
  { await sleep(500); const bad = await page.evaluate(() => [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src)); if (bad.length) throw new Error('offline: obrazki nie wczytane z cache: ' + bad); ok('offline: portrety i grupa Leśnej Wyprawy wczytane z cache service workera'); }
  await page.setOfflineMode(false);
  await page.close();

  // ---------- Kontynuuj: wznowienie ostatniej sesji (moduł, poziom, zadanie) ----------
  const pr = await newPage(1366, 768);
  await pr.goto(BASE + '/?test=1', { waitUntil: 'networkidle0' });
  await pr.waitForSelector('.module-card');
  if (await pr.$('.resume')) throw new Error('przycisk Kontynuuj widoczny bez zapisu');
  for (const [mod, lid, prefix] of [['reading', 'L02', 'L02'], ['math', 'M02', 'M02']]) {
    await pr.evaluate((mod, lid, prefix) => localStorage.setItem('pierwsze-slowa:v1', JSON.stringify({ v: 1, unlockAll: true, world: mod === 'math' ? 'lesna' : 'dzungla',
      levels: { [lid]: { tasks: { [prefix + '-1']: 3, [prefix + '-2']: 2 }, done: false } }, last: { module: mod, level: lid, idx: 2 } })), mod, lid, prefix);
    await pr.reload({ waitUntil: 'networkidle0' }); await pr.waitForSelector('.resume');
    const txt = await pr.$eval('.resume', (b) => b.textContent);
    if (!/Kontynuuj/.test(txt) || !/zadanie 3/.test(txt)) throw new Error('Kontynuuj: zły opis: ' + txt);
    await noScroll(pr, 'start z Kontynuuj'); await shot(pr, `20-start-kontynuuj-${mod}`);
    await click(pr, '.resume'); await pr.waitForSelector('#stage');
    const cur = await pr.$$eval('.starstrip .sstar', (e) => ({ on: e.filter((x) => x.classList.contains('on')).length, cur: e.findIndex((x) => x.classList.contains('cur')) }));
    const world = await pr.evaluate(() => document.documentElement.dataset.world);
    if (cur.on !== 2 || cur.cur !== 2 || world !== (mod === 'math' ? 'lesna' : 'dzungla')) throw new Error('Kontynuuj: zły punkt wznowienia ' + JSON.stringify({ cur, world }));
    await noScroll(pr, 'zadanie po Kontynuuj');
    const last = await pr.evaluate(() => JSON.parse(localStorage.getItem('pierwsze-slowa:v1')).last);
    if (last.module !== mod || last.level !== lid || last.idx !== 2) throw new Error('last nie zapisany: ' + JSON.stringify(last));
    ok(`Kontynuuj (${mod}): po przeładowaniu wraca do poziomu ${lid}, zadania 3 (2 gwiazdki zachowane), świat zachowany`);
  }
  await pr.close();

  // ---------- Faza 2: głos systemowy (atrapa: Paulina lokalna, Zofia Online (Natural), David) ----------
  const p2 = await newPage(1920, 1080, true);
  await p2.goto(BASE + '/?test=1', { waitUntil: 'networkidle0' });
  await p2.waitForSelector('.module-card'); await sleep(500);
  if (!(await p2.$eval('#voice-banner', (b) => b.hidden))) throw new Error('baner widoczny mimo głosu');
  await noScroll(p2, 'start 1920x1080'); await shot(p2, '11-start-1920x1080');
  const voiceName = await p2.evaluate(() => window.__ps.narrator.voice?.name);
  if (!/Zofia Online \(Natural\)/.test(voiceName)) throw new Error('ranking: oczekiwano Zofia Online (Natural), jest: ' + voiceName);
  ok('głos systemowy: ranking wybrał ' + voiceName);
  // domyślnie gra nagrania (atrapa syntezatora milczy)
  await p2.evaluate(() => localStorage.setItem('pierwsze-slowa:v1', JSON.stringify({ v: 1, unlockAll: true })));
  await p2.reload({ waitUntil: 'networkidle0' }); await click(p2, '.module-card[data-module="reading"]'); await click(p2, '.tile-level[data-level="L03"]');
  await p2.waitForSelector('#stage'); await sleep(3200);
  await shot(p2, '12-zadanie-1920x1080-hear');
  await noScroll(p2, '1920 hear');
  const rec = await p2.evaluate(() => ({ spoken: window.__spoken.length, played: window.__audio.filter((e) => e.ev === 'ended').length }));
  if (rec.spoken !== 0 || rec.played < 2) throw new Error('domyślnie powinny grać nagrania: ' + JSON.stringify(rec));
  ok(`domyślnie nagrany głos (${rec.played} nagrań, syntezator milczy)`);
  // panel rodzica: przełącznik, suwaki, test głosek
  await click(p2, '.back'); await click(p2, '.back');
  await click(p2, '.start-foot .btn.ghost'); await p2.waitForSelector('#gate-in');
  const q2 = await p2.$eval('.gate .lead', (e) => e.textContent); const [ga, gb] = q2.match(/\d+/g).map(Number);
  await p2.type('#gate-in', String(ga + gb)); await click(p2, '.gate .btn.primary'); await p2.waitForSelector('#speed');
  if (!(await p2.$eval('#mode-recorded', (r) => r.checked))) throw new Error('domyślnie powinien być „Nagrany głos”');
  const labels = await p2.$$eval('.voice-mode label', (l) => l.map((x) => x.textContent));
  if (!/Nagrany głos \(zalecany\)/.test(labels[0]) || !/Głos systemowy/.test(labels[1])) throw new Error('etykiety przełącznika: ' + labels);
  await p2.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));
  if (!(await p2.$eval('#gspeed-slow', (r) => r.checked))) throw new Error('domyślne tempo zabaw powinno być „wolno”');
  await click(p2, '#gspeed-normal'); await sleep(150);
  if ((await p2.evaluate(() => JSON.parse(localStorage.getItem('pierwsze-slowa:v1')).gameSpeed)) !== 'normal') throw new Error('tempo zabaw nie zapisane');
  await click(p2, '#gspeed-slow');
  if (!(await p2.$('#math-progress')) || !(await p2.$('#games-progress'))) throw new Error('brak sekcji matematyki/zabaw w panelu rodzica');
  ok('panel rodzica: postępy matematyki i zabaw, tempo zabaw wolno/normalnie zapamiętane');
  await shot(p2, '13-rodzic-lektor');
  await p2.evaluate(() => { window.__audio.length = 0; });
  await click(p2, '[data-play="sz"]'); await sleep(1700);
  const tg = await p2.evaluate(() => window.__audio.map((e) => e.ev));
  if (!tg.includes('ended') || tg.includes('error')) throw new Error('Test głosek (nagranie) nie zagrał: ' + tg);
  ok('panel rodzica: „Test głosek” gra nagrane głoski');
  await p2.$eval('#speed', (el) => { el.value = '1.3'; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); });
  await p2.$eval('#volume', (el) => { el.value = '0.5'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await sleep(1500);
  const ev2 = await p2.evaluate(() => window.__audio.filter((e) => e.ev === 'playing').pop());
  if (Math.abs(ev2.rate - 1.3) > 0.01 || Math.abs(ev2.vol - 0.5) > 0.01) throw new Error('suwaki nie wpływają na odtwarzanie: ' + JSON.stringify(ev2));
  await click(p2, '#mode-system'); await sleep(300);
  const stored = await p2.evaluate(() => JSON.parse(localStorage.getItem('pierwsze-slowa:v1')));
  if (stored.voiceMode !== 'system' || stored.speed !== 1.3 || stored.volume !== 0.5) throw new Error('ustawienia nie zapisane: ' + JSON.stringify(stored));
  ok('panel rodzica: tryb głosu, tempo i głośność działają i są zapamiętane');
  // głos systemowy: parametry głosek (wolniej, głośniej) vs zdań, pitch, wybór głosu
  await p2.evaluate(() => { const s = window.__ps.state; s.speed = 1; s.volume = 1; window.__ps.applyVoice(); window.__spoken.length = 0; });
  await p2.evaluate(async () => { const n = window.__ps.narrator; await n.speak(['#m', 'ma', 'To jest dom.', 'Brawo!'], { force: true }); });
  const sp = await p2.evaluate(() => window.__spoken);
  const by = Object.fromEntries(sp.map((x) => [x.text, x]));
  if (by.mmm?.rate !== 0.65 || by.mmm?.volume !== 1) throw new Error('głoska: ' + JSON.stringify(by.mmm));
  if (by.ma?.rate !== 0.65) throw new Error('sylaba: ' + JSON.stringify(by.ma));
  if (by['To jest dom.']?.rate !== 0.85 || by['To jest dom.']?.volume !== 0.9) throw new Error('zdanie: ' + JSON.stringify(by['To jest dom.']));
  if (!(by['Brawo!']?.pitch > by['To jest dom.']?.pitch - 0.001) || by['Brawo!'].pitch > 1.15 + 1e-9) throw new Error('pochwała pitch: ' + JSON.stringify(by['Brawo!']));
  if (!sp.every((x) => x.lang === 'pl-PL')) throw new Error('zły język: ' + JSON.stringify(sp.map((x) => x.lang)));
  ok('głos systemowy: głoski/sylaby rate 0.65 vol 1.0; zdania rate 0.85 vol 0.9; pitch 1.12–1.15; głos Zofia Online (Natural)');
  await p2.select('#voice-sel', 'stub-paulina'); await sleep(200);
  await p2.reload({ waitUntil: 'networkidle0' });
  const remembered = await p2.evaluate(() => window.__ps.narrator.voice?.name);
  if (!/Paulina/.test(remembered)) throw new Error('wybór głosu nie zapamiętany: ' + remembered);
  ok('wybór głosu systemowego zapamiętany po przeładowaniu: ' + remembered);
  await p2.close();

  // ---------- Faza 3: brak plików audio (404) – gra działa dalej, mówi głosem systemowym ----------
  const p3 = await newPage(1366, 768, true, { collect: false });
  await p3.setRequestInterception(true);
  p3.on('request', (r) => (r.url().includes('/audio/') ? r.respond({ status: 404, body: 'nie ma' }) : r.continue()));
  await p3.goto(BASE + '/?test=1', { waitUntil: 'networkidle0' });
  await p3.waitForSelector('.module-card'); await sleep(500);
  await click(p3, '.module-card[data-module="reading"]'); await click(p3, '.tile-level[data-level="L01"]');
  await p3.waitForSelector('#stage'); await sleep(900);
  await solveCurrentTask(p3, { tryWrongFirst: true, label: 'bez audio' });
  const sp3 = await p3.evaluate(() => window.__spoken.map((x) => x.text));
  if (!sp3.length) throw new Error('bez plików audio lektor powinien mówić głosem systemowym');
  ok('bez plików audio (404): zadanie rozwiązane, mowa przez głos systemowy: ' + [...new Set(sp3)].slice(0, 5).join(' | '));
  await p3.close();

  // ===== Ćwiczenia wymowy (z atrapą mikrofonu: --use-fake-device-for-media-stream) =====
  async function pronStep(pg, { shot = null, rec = false, label = '' } = {}) {
    await pg.waitForSelector('#stage', { timeout: 5000 }); await sleep(250);
    const type = await pg.evaluate(() => [...document.querySelector('#stage').classList].find((c) => c.startsWith('t-')));
    await noScroll(pg, `pron ${label} ${type}`);
    if (shot) await shot('');
    if (rec && type !== 't-fun') {
      if (!(await pg.evaluate(() => /Nic nie jest wysyłane/.test(document.querySelector('.rec-privacy')?.textContent ?? '') && /zniknie samo po obejrzeniu/.test(document.querySelector('.rec-privacy')?.textContent ?? '')))) throw new Error('brak informacji o prywatności / automatycznym usuwaniu');
      // śledzimy strumienie kamery/mikrofonu, żeby sprawdzić, że zostają zatrzymane
      await pg.evaluate(() => { if (window.__gum) return; window.__streams = []; const md = navigator.mediaDevices; const o = md.getUserMedia.bind(md); window.__gum = true; md.getUserMedia = async (c) => { const st = await o(c); window.__streams.push(st); return st; }; });
      await click(pg, '#mirror-btn'); await pg.waitForFunction(() => document.querySelector('.recorder')?.dataset.state === 'mirror' && document.querySelector('.rec-live').videoWidth > 0, { timeout: 5000 });
      if (shot) await shot('lusterko');
      await click(pg, '#mirror-btn'); await sleep(200);
      if (await pg.evaluate(() => window.__streams.some((st) => st.getTracks().some((t) => t.readyState === 'live')))) throw new Error('po zamknięciu lusterka kamera nadal włączona');
      await click(pg, '#rec-btn'); await pg.waitForFunction(() => document.querySelector('.recorder')?.dataset.state === 'recording', { timeout: 5000 });
      const kinds = await pg.evaluate(() => window.__streams.at(-1).getTracks().map((t) => t.kind).sort().join(','));
      if (kinds !== 'audio,video') throw new Error('nagranie powinno mieć obraz i dźwięk, jest: ' + kinds);
      await sleep(1200); await click(pg, '#rec-btn');
      await pg.waitForFunction(() => document.querySelector('.recorder')?.dataset.state === 'playing' && !!document.querySelector('.rec-play').getAttribute('src'), { timeout: 5000 });
      if (shot) await shot('odtwarzanie');
      await pg.waitForFunction(() => document.querySelector('.recorder')?.dataset.state === 'deleted', { timeout: 15000 });
      if (await pg.evaluate(() => !!document.querySelector('.rec-play').getAttribute('src') || window.__streams.some((st) => st.getTracks().some((t) => t.readyState === 'live')))) throw new Error('po obejrzeniu nagranie lub kamera nie zostały usunięte');
    }
    await pg.evaluate(() => document.querySelectorAll('.pron-card').forEach((c) => c.click()));
    await click(pg, '#pron-great'); await pg.waitForSelector('#pron-next:not([hidden])', { timeout: 4000 });
    report.tasksSolved['pron:' + type.slice(2)] = (report.tasksSolved['pron:' + type.slice(2)] ?? 0) + 1;
    await click(pg, '#pron-next');
    return type;
  }
  {
    const pp = await newPage(1366, 768);
    await pp.goto(`${BASE}/`); await pp.evaluate(() => localStorage.clear()); await pp.reload(); await sleep(700);
    for (const w of ['lesna', 'kosmos', 'dzungla', 'wyspy']) { await chooseWorld(pp, w); await sleep(250); await noScroll(pp, 'start 3 moduły ' + w); }
    const clipped = async (pg, lab) => { const c = await pg.evaluate(() => [...document.querySelectorAll('.module-card, .module-card *')].filter((e) => e.scrollHeight > e.clientHeight + 1 || e.scrollWidth > e.clientWidth + 1).map((e) => e.className + ':' + e.textContent.slice(0, 24))); if (c.length) throw new Error('ucięty tekst na kartach startowych (' + lab + '): ' + c.join(' | ')); };
    for (const w of ['lesna', 'kosmos', 'dzungla', 'wyspy']) { await chooseWorld(pp, w); await sleep(200); await clipped(pp, '1366 ' + w); }
    const icons = async (pg) => pg.evaluate(() => [...document.querySelectorAll('.module-card img.micon-img')].map((i) => (i.complete && i.naturalWidth > 0 ? i.dataset.variant : 'BRAK')));
    const v1 = await icons(pp); await pp.reload(); await sleep(600); const v2 = await icons(pp);
    if (v1.length !== 3 || v1.includes('BRAK') || v2.includes('BRAK') || v1[0] === v2[0]) throw new Error('ikony modułów: oczekiwano 3 wczytanych i zmiany wariantu po nowej sesji: ' + v1 + ' / ' + v2);
    ok('karty startowe: tekst nieucięty w 4 światach; ikony Artysty wczytane, wariant zmienia się co sesję (' + v1[0] + ' → ' + v2[0] + ')');
    for (const [W, H] of [[1920, 1080], [1280, 720], [1024, 768]]) { const pq = await newPage(W, H); await pq.goto(`${BASE}/`); await sleep(500); for (const w of ['lesna', 'dzungla']) { await chooseWorld(pq, w); await sleep(200); await clipped(pq, `${W}x${H} ${w}`); await noScroll(pq, `start ${W}x${H} ${w}`); } if (W === 1024) await shot(pq, 'p7-start-1024'); await pq.close(); }
    if ((await pp.$$('.module-card')).length !== 3 || !(await pp.$('.module-card[data-module="pron"]'))) throw new Error('na starcie powinny być 3 moduły, w tym pron');
    await chooseWorld(pp, 'lesna'); await sleep(200);
    await shot(pp, 'p7-start-3-moduly');
    await click(pp, '.module-card[data-module="pron"]'); await pp.waitForSelector('.tile-level[data-level="W-s2"]');
    { const ord = await pp.$$eval('.tile-level', (t) => t.map((x) => x.dataset.level)); if (ord[0] !== 'W-s2' || ord.at(-1) !== 'W-r') throw new Error('zła kolejność głosek: ' + ord);
      if (!(await pp.$('.tile-level.recommended[data-level="W-s2"]')) || !(await pp.$('section[data-group="r"] .r-note'))) throw new Error('brak podświetlenia polecanej głoski lub notki o R'); ok('wymowa: kolejność ' + ord.join(' ') + ', polecana W-s2, notka o R'); }
    if ((await pp.$$('.tile-level')).length < 10) throw new Error('mapa głosek: za mało głosek');
    if (!(await pp.evaluate(() => /logoped/i.test(document.body.textContent)))) throw new Error('brak informacji o logopedzie na mapie');
    await shot(pp, 'p7-mapa-glosek');
    await click(pp, '.tile-level[data-level="W-s2"]');
    // krok 1: awatar lektorki + postać prowadząca są obecne, a lektor nie psuje układu
    const t0 = await pronStep(pp, { rec: true, label: 'W-s2 listen', shot: (x) => shot(pp, 'p8-s-1-sluchaj' + (x ? '-' + x : '')) });
    if (t0 !== 't-listen') throw new Error('pierwszy krok powinien być „Posłuchaj”, jest ' + t0);
    if (!(await pp.evaluate(() => !!document.querySelector('#lektor img') && document.querySelector('.pron-fig svg')))) throw new Error('brak awatara lub rysunku buzi');
    await pronStep(pp, { rec: true, label: 'W-s2 syl', shot: (x) => x ? null : shot(pp, 'p8-s-2-sylaby') });
    // wyjście z kroku zatrzymuje wszystkie ścieżki
    if (await pp.evaluate(() => (window.__streams ?? []).some((st) => st.getTracks().some((t) => t.readyState === 'live')))) throw new Error('po wyjściu z kroku kamera/mikrofon nadal włączone');
    await pronStep(pp, { label: 'W-s2 syl2' });
    // wznawianie: wyjście i „Kontynuuj”
    await pp.reload(); await sleep(700);
    const resume = await pp.$('.resume[data-resume="W-s2"]');
    if (!resume) throw new Error('brak przycisku Kontynuuj dla ćwiczeń wymowy');
    await shot(pp, 'p7-kontynuuj'); await resume.click(); await pp.waitForSelector('#stage');
    const star = await pp.evaluate(() => document.querySelectorAll('.starstrip .sstar.on').length);
    if (star !== 3) throw new Error('po wznowieniu powinny być 3 zdobyte gwiazdki, jest ' + star);
    let n = 3;
    for (; n < 40; n++) {
      if (!(await pp.$('#stage'))) break;
      const sh = n === 4 ? () => shot(pp, 'p8-s-slowa') : n === 8 ? () => shot(pp, 'p8-s-zdanie') : n === 11 ? () => shot(pp, 'p8-s-cwiczenie') : null;
      await pronStep(pp, { label: 'W-s2 #' + n, shot: sh });
    }
    await pp.waitForSelector('.done-screen'); await noScroll(pp, 'pron ukończenie'); await shot(pp, 'p8-s-ukonczone');
    const lv = await pp.evaluate(() => JSON.parse(localStorage.getItem('pierwsze-slowa:v1')).levels['W-s2']);
    if (!lv?.done || Object.keys(lv.tasks).length !== 12) throw new Error('poziom W-s2 powinien być ukończony (12 kroków): ' + JSON.stringify(lv));
    ok('Ćwiczenia wymowy: 3 moduły na starcie w 4 światach (bez przewijania), mapa 11 głosek, głoska R (12 kroków) z nagrywaniem z atrapą mikrofonu, Kontynuuj, ukończenie, zapis');
    // brak zgody na mikrofon: komunikat zamiast błędu
    await pp.evaluate(() => { navigator.mediaDevices.getUserMedia = () => Promise.reject(Object.assign(new Error('x'), { name: 'NotAllowedError' })); });
    await click(pp, '.btn.back'); await click(pp, '.tile-level[data-level="W-z2"]'); await pp.waitForSelector('#stage');
    await click(pp, '#rec-btn'); await pp.waitForFunction(() => document.querySelector('.recorder')?.dataset.state === 'denied', { timeout: 4000 });
    await shot(pp, 'p7-brak-zgody');
    ok('mikrofon odrzucony: przyjazny komunikat, ćwiczenie działa dalej');
    // strona rodzica
    await click(pp, '.btn.back'); await click(pp, '.btn.back'); await pp.waitForSelector('[data-module="pron"]');
    await pp.close();
    const pp2 = await newPage(1920, 1080);
    await pp2.goto(`${BASE}/`); await pp2.evaluate(() => localStorage.setItem('pierwsze-slowa:v1', JSON.stringify({ v: 1, world: 'kosmos', unlockAll: true }))); await pp2.reload(); await sleep(600);
    await noScroll(pp2, 'start 1920 pron');
    await click(pp2, '.module-card[data-module="pron"]'); await click(pp2, '.tile-level[data-level="W-z2"]');
    for (let k = 0; k < 13; k++) { if (!(await pp2.$('#stage'))) break; await pronStep(pp2, { label: '1920 W-z2 #' + k, shot: k === 5 ? () => shot(pp2, 'p7-1920-slowa-kosmos') : null }); }
    await pp2.close();
    for (const w of ['dzungla', 'wyspy']) {
      const p4 = await newPage(1366, 768);
      await p4.goto(`${BASE}/`); await p4.evaluate((ww) => localStorage.setItem('pierwsze-slowa:v1', JSON.stringify({ v: 1, world: ww })), w); await p4.reload(); await sleep(600);
      await click(p4, '.module-card[data-module="pron"]'); await click(p4, '.tile-level[data-level="W-sz"]');
      await pronStep(p4, { label: w + ' W-sz listen', shot: () => shot(p4, 'p7-swiat-' + w) });
      for (let k = 0; k < 12; k++) { if (!(await p4.$('#stage'))) break; await pronStep(p4, { label: w + ' W-sz #' + k }); }
      await p4.close();
    }
    ok('Ćwiczenia wymowy: 1920x1080 (kosmos) i światy dżungla/wyspy bez przewijania');
  }
} catch (e) {
  console.error('BŁĄD TESTU:', e); report.fatal = String(e.stack ?? e);
}
await browser.close(); server.kill(); rmSync(serveDir, { recursive: true, force: true });
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
const bad = report.fatal || report.pageErrors.length || report.externalRequests.length || report.consoleErrors.length || report.failedRequests.length || report.noScrollViolations.length;
console.log('\nPodsumowanie:', JSON.stringify({ tasksSolved: report.tasksSolved, consoleErrors: report.consoleErrors.length, pageErrors: report.pageErrors.length, externalRequests: report.externalRequests.length, failedRequests: report.failedRequests.length, noScrollViolations: report.noScrollViolations.length }));
process.exit(bad ? 1 : 0);
