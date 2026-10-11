#!/usr/bin/env node
// Test w prawdziwym (headless) Chrome: przeklikuje aplikację, sprawdza błędy konsoli, brak zewnętrznych
// żądań, brak przewijania w zadaniach i robi zrzuty ekranu.
// Użycie: PUPPETEER_CORE=/ścieżka/do/puppeteer-core node tools/browser-check.mjs [katalog-zrzutów]
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_CORE ?? 'puppeteer-core');
const CHROME = process.env.CHROME ?? '/usr/bin/google-chrome';
const OUT = process.argv[2] ?? '/workspace/pierwsze-slowa-shots';
const PORT = 8765, ORIGIN = `http://localhost:${PORT}`;
mkdirSync(OUT, { recursive: true });
const root = new URL('..', import.meta.url).pathname;
const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: root, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));

const report = { consoleErrors: [], pageErrors: [], externalRequests: [], failedRequests: [], noScrollViolations: [], steps: [], tasksSolved: {}, spoken: [] };
const ok = (m) => { report.steps.push(m); console.log('✔', m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required'] });

async function newPage(w = 1366, h = 768, stub = false) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) report.consoleErrors.push(`${m.type()}: ${m.text()} @${m.location()?.url ?? ''}`); });
  page.on('pageerror', (e) => report.pageErrors.push(String(e)));
  page.on('request', (r) => { const u = r.url(); if (!u.startsWith(ORIGIN) && !u.startsWith('data:') && !u.startsWith('blob:')) report.externalRequests.push(u); });
  page.on('requestfailed', (r) => report.failedRequests.push(r.url() + ' ' + r.failure()?.errorText));
  page.on('response', (r) => { if (r.status() >= 400) report.failedRequests.push(r.status() + ' ' + r.url()); });
  if (stub) await page.evaluateOnNewDocument(() => {
    const voice = { name: 'Stub Paulina', lang: 'pl-PL', localService: true, voiceURI: 'stub-paulina', default: true };
    window.__spoken = [];
    const synth = { getVoices: () => [voice], speak(u) { window.__spoken.push({ text: u.text, rate: Math.round(u.rate * 100) / 100, lang: u.lang }); setTimeout(() => u.onend?.(), 30); }, cancel() {}, addEventListener() {} };
    Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
  });
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
    if (/źle|błąd|nie /i.test(msg)) throw new Error('niełagodny komunikat: ' + msg);
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

try {
  // ---------- Faza 1: bez głosu polskiego (headless Chrome na Linuksie zwykle nie ma głosów) ----------
  const page = await newPage();
  await page.goto(ORIGIN + '/?test=1', { waitUntil: 'networkidle0' });
  await page.waitForSelector('.module-card');
  await sleep(3500); // czas na wykrycie braku głosów
  const banner = await page.$eval('#voice-banner', (b) => !b.hidden && b.textContent);
  ok('ekran startowy; baner braku głosu: ' + (banner || 'brak (są głosy)'));
  await shot(page, '01-start-kosmos');
  // ekran startowy może się przewijać na bardzo niskich oknach; sprawdzamy tylko zadania

  await click(page, '.module-card[data-module="math"]');
  await page.waitForFunction(() => document.body.textContent.includes('Wkrótce!'));
  await shot(page, '02-matematyka-wkrotce'); ok('matematyka: ekran „Wkrótce!”');
  await click(page, '.back');

  for (const w of ['dzungla', 'wyspy', 'kosmos']) { await chooseWorld(page, w); await sleep(300); await shot(page, `03-start-${w}`); }
  ok('przełączanie światów na ekranie startowym');

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
  const ids = await page.$$eval('.tile-level', (t) => t.map((x) => x.dataset.level));
  for (const lid of ids) {
    if (['L01', 'L02', 'L03', 'L04', 'L05', 'L21', 'L22', 'L24'].includes(lid)) continue;
    await playLevel(page, lid, {}); await click(page, '.btn:not(.primary):not(.ghost)'); await page.waitForSelector('.tile-level');
  }
  ok('wszystkie ' + ids.length + ' poziomów rozwiązanych w przeglądarce');
  await shot(page, '06-mapa-po-ukonczeniu');

  // zmiana świata w trakcie zadania
  await click(page, '.tile-level[data-level="L08"]'); await page.waitForSelector('#stage');
  for (const w of ['dzungla', 'wyspy', 'kosmos']) { await chooseWorld(page, w); await sleep(250); await shot(page, `07-zadanie-swiat-${w}`); await noScroll(page, 'zadanie ' + w); }
  ok('przełączenie świata w trakcie zadania');
  await click(page, '.back');

  // skarby
  await click(page, '.back'); await click(page, '.start-foot .btn:first-child'); await page.waitForSelector('.collection');
  for (const w of ['kosmos', 'dzungla', 'wyspy']) { await chooseWorld(page, w); await sleep(250); await shot(page, `08-skarby-${w}`); }
  const got = await page.$$eval('.coll.got', (e) => e.length); ok(`skarby: ${got} z 12 zebrane po wszystkich poziomach`);
  await click(page, '.back');

  // rodzic
  await click(page, '.start-foot .btn.ghost'); await page.waitForSelector('#gate-in');
  await shot(page, '09-rodzic-bramka');
  const q = await page.$eval('.gate .lead', (e) => e.textContent); const [a, b] = q.match(/\d+/g).map(Number);
  await page.type('#gate-in', String(a + b + 1)); await click(page, '.gate .btn.primary'); await sleep(200);
  if (!(await page.$('#gate-in'))) throw new Error('bramka przepuściła zły wynik');
  await page.type('#gate-in', String(a + b)); await click(page, '.gate .btn.primary'); await page.waitForSelector('#rate');
  await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));
  await shot(page, '10-rodzic-panel'); ok('panel rodzica: bramka i dashboard');
  // reset
  await click(page, '.btn.danger'); await click(page, '.btn.danger'); await page.waitForSelector('#gate-in');
  const after = await page.evaluate(() => localStorage.getItem('pierwsze-slowa:v1'));
  ok('reset postępów: ' + (after === null ? 'localStorage wyczyszczony' : 'zapis po resecie: ' + after.slice(0, 30)));

  // offline (service worker)
  await page.goto(ORIGIN + '/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => navigator.serviceWorker.ready); await sleep(800);
  await page.setOfflineMode(true); await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.module-card', { timeout: 6000 }); ok('offline po pierwszym wczytaniu: aplikacja startuje z cache');
  await page.setOfflineMode(false);
  await page.close();

  // ---------- Faza 2: pełny ekran 1920x1080 i atrapa polskiego głosu ----------
  const p2 = await newPage(1920, 1080, true);
  await p2.goto(ORIGIN + '/?test=1', { waitUntil: 'networkidle0' });
  await p2.waitForSelector('.module-card'); await sleep(500);
  if (!(await p2.$eval('#voice-banner', (b) => b.hidden))) throw new Error('baner widoczny mimo głosu');
  await shot(p2, '11-start-1920x1080');
  await p2.evaluate(() => localStorage.setItem('pierwsze-slowa:v1', JSON.stringify({ v: 1, unlockAll: true })));
  await p2.reload({ waitUntil: 'networkidle0' }); await click(p2, '.module-card[data-module="reading"]'); await click(p2, '.tile-level[data-level="L03"]');
  await p2.waitForSelector('#stage'); await sleep(700);
  await shot(p2, '12-zadanie-1920x1080-hear');
  await noScroll(p2, '1920 hear');
  let spoken = await p2.evaluate(() => window.__spoken.map((s) => s.text + '@' + s.rate)); report.spoken.push(...spoken);
  if (!spoken.some((s) => /^mmm@0\.8$/.test(s))) throw new Error('lektor nie powiedział „mmm” z tempem 0.8: ' + spoken);
  await click(p2, '.btn.listen'); await sleep(500);
  spoken = await p2.evaluate(() => window.__spoken.map((s) => s.text)); ok('lektor (atrapa): wypowiedzi: ' + [...new Set(spoken)].join(' | '));
  await p2.evaluate(() => { window.__ps.state.rate = 1; });
  await p2.close();
} catch (e) {
  console.error('BŁĄD TESTU:', e); report.fatal = String(e.stack ?? e);
}
await browser.close(); server.kill();
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
const bad = report.fatal || report.pageErrors.length || report.externalRequests.length || report.consoleErrors.length || report.failedRequests.length || report.noScrollViolations.length;
console.log('\nPodsumowanie:', JSON.stringify({ tasksSolved: report.tasksSolved, consoleErrors: report.consoleErrors.length, pageErrors: report.pageErrors.length, externalRequests: report.externalRequests.length, failedRequests: report.failedRequests.length, noScrollViolations: report.noScrollViolations.length }));
process.exit(bad ? 1 : 0);
