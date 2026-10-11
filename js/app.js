// Start aplikacji: stan, motyw świata, nawigacja, ekran startowy, skarby.
import { h, clear, STAR } from './core/ui.js';
import * as P from './core/progress.js';
import { Narrator } from './core/narrator.js';
import { WORLDS, WORLD_IDS } from './art/worlds.js';
import { MODULES } from '../modules/index.js';
import { LEVELS } from '../modules/reading/curriculum.js';
import { MATH_LEVELS } from '../modules/math/curriculum.js';
import { showParent } from './parent.js';

const root = document.getElementById('app');
const bg = document.getElementById('bg');
const state = P.loadState(globalThis.localStorage, WORLD_IDS);
const narrator = new Narrator();
const applyVoice = () => { narrator.enabled = state.narrator; narrator.mode = state.voiceMode; narrator.speed = state.speed; narrator.volume = state.volume; narrator.preferredURI = state.voiceURI; };
applyVoice();

const ctx = {
  state, narrator, onWorld: null, showBanner: true,
  readingLevels: LEVELS, mathLevels: MATH_LEVELS, allLevels: [...LEVELS, ...MATH_LEVELS],
  save: () => P.saveState(globalThis.localStorage, state),
  world: () => WORLDS[state.world] ?? WORLDS.lesna,
  mascot: (i) => ctx.world().mascots[i % ctx.world().mascots.length],
  resetAll() { Object.assign(state, P.resetState(globalThis.localStorage)); applyTheme(); applyVoice(); narrator.refresh?.(); },
  go: (name) => go(name),
  toast(text) {
    const t = h('div', { class: 'toast', role: 'status' }, text); document.body.append(t); setTimeout(() => t.remove(), 2600);
  },
  refreshControls: () => document.querySelectorAll('.snd-toggle').forEach(syncSound),
  topbar({ back, onBack, title, extra }) {
    const snd = h('button', { class: 'btn small snd-toggle', type: 'button', onclick: () => { state.narrator = !state.narrator; narrator.enabled = state.narrator; if (!state.narrator) narrator.cancel(); ctx.save(); ctx.refreshControls(); } });
    syncSound(snd);
    const wbtn = h('button', { class: 'btn small world-btn', type: 'button', onclick: openWorlds }, h('span', { class: 'wl' }, 'Świat: '), h('b', {}, ctx.world().short));
    return h('header', { class: 'topbar' }, back ? h('button', { class: 'btn small back', type: 'button', onclick: onBack }, '← ' + back) : null, title ? h('h1', { class: 'bar-title' }, title) : null, extra ?? null, h('span', { class: 'spacer' }), wbtn, snd);
  },
};
function syncSound(btn) {
  const on = state.narrator;
  btn.setAttribute('aria-pressed', String(on));
  btn.setAttribute('aria-label', on ? 'Lektor włączony. Dotknij, aby wyłączyć.' : 'Lektor wyłączony. Dotknij, aby włączyć.');
  btn.innerHTML = `<svg viewBox='0 0 24 24' class='ico' aria-hidden='true'><path d='M3 9v6h4l5 4V5L7 9z' fill='currentColor'/>${on ? "<path d='M15 8q3 4 0 8M17.5 5.5q5.5 6.5 0 13' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round'/>" : "<path d='M16 9l6 6M22 9l-6 6' stroke='currentColor' stroke-width='2.5' stroke-linecap='round'/>"}</svg><span>${on ? 'Dźwięk' : 'Cisza'}</span>`;
}

function applyTheme() {
  const w = ctx.world();
  for (const [k, v] of Object.entries(w.css)) document.documentElement.style.setProperty(k, v);
  bg.innerHTML = w.bg;
  document.documentElement.dataset.world = w.id;
  document.querySelectorAll('[data-mascot]').forEach((el) => { el.innerHTML = ctx.mascot(Number(el.dataset.mascot)).svg; });
}
function setWorld(id) {
  state.world = id; ctx.save(); applyTheme();
  document.querySelectorAll('.world-btn b').forEach((b) => { b.textContent = ctx.world().short; });
  ctx.onWorld?.();
}
function openWorlds() {
  const prev = document.activeElement;
  const close = () => { ov.remove(); window.removeEventListener('keydown', esc); prev?.focus?.(); };
  const esc = (e) => { if (e.key === 'Escape') close(); };
  const ov = h('div', { class: 'overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Wybierz świat', onclick: (e) => { if (e.target === ov) close(); } },
    h('div', { class: 'card center' }, h('h2', {}, 'Wybierz świat'), h('div', { class: 'world-choices' }, WORLD_IDS.map((id) => {
      const w = WORLDS[id];
      return h('button', { class: 'world-choice' + (id === state.world ? ' sel' : ''), type: 'button', 'data-world': id, 'aria-pressed': String(id === state.world), onclick: () => { setWorld(id); close(); } },
        h('span', { class: 'wmascots', html: w.mascots.slice(0, 3).map((m) => m.svg).join('') }), h('span', { class: 'wname' }, w.name));
    })), h('button', { class: 'btn', type: 'button', onclick: close }, 'Zamknij')));
  document.body.append(ov); window.addEventListener('keydown', esc);
  ov.querySelector('.world-choice.sel, .world-choice')?.focus();
}

function voiceBanner() {
  const el = document.getElementById('voice-banner');
  const bad = ctx.showBanner && state.narrator && !narrator.hasClips && (narrator.status === 'none' || narrator.status === 'unsupported');
  el.hidden = !bad;
  el.innerHTML = '';
  if (bad) el.append(h('span', {}, 'Brak polskiego głosu lektora – zadania pokazują duży tekst. '), h('button', { class: 'btn small', type: 'button', onclick: () => go('parent') }, 'Dla rodzica: jak to naprawić'));
}
narrator.onChange(voiceBanner);

function start() {
  ctx.onWorld = start; ctx.showBanner = true;
  clear(root);
  const cards = MODULES.map((m) => h('button', { class: 'module-card' + (m.available ? '' : ' soon'), type: 'button', 'data-module': m.id, onclick: () => openModule(m) },
    h('span', { class: 'micon', html: m.icon }), h('span', { class: 'mtitle' }, m.title), h('span', { class: 'mtag' }, m.available ? m.tagline : 'Wkrótce')));
  const m0 = ctx.mascot(0), w0 = ctx.world();
  root.append(h('div', { class: 'start' + (w0.parade ? ' has-parade' : '') }, ctx.topbar({}),
    h('div', { class: 'hero' }, h('div', { class: 'mascot big' + (w0.heroArt ? ' guide' : ''), 'data-mascot': w0.heroArt ? null : 0, html: w0.heroArt ?? m0.svg, 'aria-hidden': 'true' }),
      h('div', {}, h('h1', { class: 'logo' }, 'Pierwsze Słowa'), h('p', { class: 'lead on-bg' }, `Cześć Piotrku! Co dziś robimy?`))),
    resumeBtn(),
    h('div', { class: 'module-row' }, cards),
    h('div', { class: 'start-foot' },
      h('button', { class: 'btn', type: 'button', onclick: () => go('collection') }, h('span', { html: STAR, class: 'ico star-ico', 'aria-hidden': 'true' }), `Moje skarby`),
      h('button', { class: 'btn ghost', type: 'button', onclick: () => go('parent') }, 'Dla rodzica')),
    w0.parade ? h('div', { class: 'parade', 'aria-hidden': 'true', html: w0.parade }) : null));
  voiceBanner();
}
function resumeBtn() {
  const r = P.resumeTarget(state, { reading: LEVELS, math: MATH_LEVELS });
  if (!r) return null;
  const m = MODULES.find((x) => x.id === r.module);
  return h('button', { class: 'btn primary resume', type: 'button', 'data-resume': r.level.id, onclick: () => openModule(m, { resumeLevel: r.level }),
    'aria-label': `Kontynuuj: ${m.title}, poziom ${r.level.num}, zadanie ${r.idx + 1} z ${r.tasks}` },
    h('b', {}, 'Kontynuuj'), h('span', { class: 'resume-sub' }, `${m.title} · poziom ${r.level.num} · zadanie ${r.idx + 1}/${r.tasks}`));
}
function openModule(m, opts = {}) {
  ctx.onWorld = null; ctx.showBanner = false; voiceBanner(); clear(root);
  const box = h('div', { class: 'module-box', 'data-module-box': m.id }); root.append(box);
  m.mount(ctx, box, { exit: start, resumeLevel: opts.resumeLevel });
}
function collection() {
  ctx.onWorld = collection; ctx.showBanner = false; voiceBanner(); clear(root);
  const w = ctx.world();
  const got = P.itemsUnlockedCombined(state, LEVELS, ctx.allLevels);
  const grid = h('div', { class: 'collection' }, w.items.map((it, i) => h('figure', { class: 'coll' + (i < got ? ' got' : ' locked'), 'aria-label': i < got ? it.name : 'Jeszcze nie zdobyty skarb' }, h('div', { class: 'item-art', html: it.svg }), h('figcaption', {}, i < got ? it.name : 'Ukończ kolejne poziomy'))));
  const crew = h('div', { class: 'crew' }, w.mascots.map((m) => h('figure', {}, h('div', { class: 'item-art', html: m.svg }), h('figcaption', {}, h('b', {}, m.name), h('br'), m.bio))));
  const doneAll = (levels) => P.completedCount(state, levels) >= levels.length;
  const badges = w.badges ? h('div', { class: 'badges' }, w.badges.map((b) => { const on = doneAll(b.module === 'math' ? MATH_LEVELS : LEVELS);
    return h('figure', { class: 'badge' + (on ? ' got' : ' locked'), 'aria-label': on ? b.name : `${b.name} – jeszcze nie zdobyta` }, h('div', { class: 'item-art', html: b.svg }), h('figcaption', {}, h('b', {}, b.name), h('br'), on ? 'Zdobyta!' : b.hint)); })) : null;
  root.append(h('div', { class: 'scroll-screen' }, ctx.topbar({ back: 'Menu', onBack: start, title: 'Moje skarby' }),
    h('p', { class: 'lead on-bg' }, `${w.name}: zebrane skarby ${got} z ${w.items.length}`), grid,
    badges ? h('h2', { class: 'on-bg' }, 'Odznaki') : null, badges,
    h('h2', { class: 'on-bg' }, 'Twoja ekipa'), w.crewArt ? h('div', { class: 'crew-art', 'aria-hidden': 'true', html: w.crewArt }) : null, crew));
}
function go(name) {
  narrator.cancel(); ctx.showBanner = false; voiceBanner();
  ({ start, collection, parent: () => { clear(root); showParent(ctx, root); } }[name] ?? start)();
}

applyTheme();
start();
narrator.init().then(() => { voiceBanner(); precacheAudioLater(); });
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* offline-first jest dodatkiem */ });
}
/** Po pierwszym wczytaniu, gdy strona „ostygnie”, service worker dociąga resztę nagrań w tle (offline bez gadania syntezatora). */
function precacheAudioLater() {
  if (!narrator.hasClips || !('serviceWorker' in navigator) || navigator.connection?.saveData) return;
  setTimeout(() => navigator.serviceWorker.ready.then((reg) => reg.active?.postMessage({ type: 'precache-audio' })).catch(() => {}), 6000);
}
globalThis.__ps = { state, narrator, applyVoice };
