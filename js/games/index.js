// Zabawy zręcznościowe (wspólne dla czytania i matematyki): „Łap i czytaj/licz”, „Ścieżka”, „Balony”.
// Bez czasu, żyć i porażek. Sterowanie: mysz/dotyk, strzałki i WASD oraz tryb tylko-klawiaturowy (Tab do elementów, Enter).
// Pętla requestAnimationFrame z czasem delta; pauza, gdy karta jest ukryta lub element ma fokus klawiatury. Bez migotania.
import { h, clear, STAR, reducedMotion } from '../core/ui.js';
import * as P from '../core/progress.js';
import { PRAISE, RETRY, variantPicker } from '../core/lines.js';
import { GAMES } from './phrases.js';
import { createSpawner, createTracker, makeQuestion, pickItems, learnedFor, speedFactor, GAME_TARGET } from './logic.js';
import { resolvePart } from '../../modules/math/say.js';

const nextPraise = variantPicker(PRAISE), nextRetry = variantPicker(RETRY);
const testMode = () => new URLSearchParams(globalThis.location?.search ?? '').has('test');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const place = (el, x, y) => { el.style.left = x * 100 + '%'; el.style.top = y * 100 + '%'; };
const speakParts = (parts) => parts.map((p) => (typeof p === 'string' ? p : resolvePart(p)));

/** Skórki światów: kształt „platform” i balonów. */
const SKIN = {
  kosmos: { platform: 'planeta', balloon: ['#b9a8ff', '#8fd3f4', '#ffd98a', '#ffb3d1'], plat: ['#c9b8ff', '#9fd0f5', '#ffd6a0'] },
  dzungla: { platform: 'kłoda', balloon: ['#ffb870', '#9fdc9a', '#ffd86b', '#f59fb5'], plat: ['#c9a06b', '#a9d18e', '#d9b77a'] },
  wyspy: { platform: 'liść', balloon: ['#7fd6e8', '#ffcf7a', '#ff9fb2', '#a8e6a1'], plat: ['#8fd9a3', '#a8e6c0', '#7fcfa0'] },
};
const itemClass = 'gitem';

export function runGame(ctx, box, { subject, gameId, onExit, bonus = false }) {
  const { state, narrator } = ctx;
  const def = GAMES[gameId];
  const levels = subject === 'math' ? ctx.mathLevels : ctx.readingLevels;
  const learned = learnedFor(subject, state, levels);
  const test = testMode();
  const speed = () => speedFactor(state.gameSpeed, { reduced: reducedMotion(), test });
  const tracker = createTracker(GAME_TARGET);
  const rand = Math.random;
  let q = null, lastKey = null, destroyed = false, raf = 0, lastT = 0, over = false;
  const cleanups = [];
  const on = (t, ev, fn, opt) => { t.addEventListener(ev, fn, opt); cleanups.push(() => t.removeEventListener(ev, fn, opt)); };

  clear(box);
  const title = subject === 'math' ? def.mathTitle : def.title;
  const askEl = h('p', { class: 'prompt', id: 'game-ask', 'aria-live': 'polite' });
  const bubble = h('div', { class: 'bubble', 'aria-live': 'polite' }, def.blurb);
  const mascot = h('div', { class: 'mascot', html: ctx.mascot(1).svg, 'aria-hidden': 'true' });
  const prog = h('div', { class: 'starstrip', role: 'img' });
  const field = h('main', { class: `stage game-field g-${gameId}`, id: 'stage', tabindex: '-1' });
  const listen = h('button', { class: 'btn listen', type: 'button', onclick: () => narrator.speak(speakParts(q.ask.say)) }, 'Posłuchaj');
  const drawProg = () => { clear(prog); for (let i = 0; i < GAME_TARGET; i++) prog.append(h('span', { class: 'sstar' + (i < tracker.correct ? ' on' : ''), html: STAR })); prog.setAttribute('aria-label', `Trafienia: ${tracker.correct} z ${GAME_TARGET}`); };
  const bar = ctx.topbar({ back: 'Mapa', onBack: () => { destroy(); onExit(); }, title: (bonus ? 'Zabawa bonusowa: ' : 'Zabawa: ') + title, extra: prog });
  box.append(h('div', { class: 'task-screen game-screen' }, bar, h('div', { class: 'prompt-row' }, askEl, listen), field, h('footer', { class: 'feedback' }, mascot, bubble)));
  drawProg();

  const itemEl = (it, extraClass = '') => {
    const b = h('button', { class: `${itemClass} ${extraClass}`, type: 'button', 'data-id': it.id, 'aria-label': subject === 'math' ? it.label : it.label.replace(/ .*/, '') }, h('span', { class: 'gl' }, it.label));
    if (test && it.id === q.correct.id) b.setAttribute('data-correct', '1');
    return b;
  };

  function newQuestion() {
    q = makeQuestion(subject, learned, def.verb, rand, { n: 6, last: lastKey });
    lastKey = q.key;
    askEl.textContent = q.ask.text;
    globalThis.__ps && (globalThis.__ps.game = { tracker, get q() { return q; }, gameId, subject });
    narrator.speak(speakParts(q.ask.say));
    game.onQuestion?.();
  }
  function correct(el) {
    if (over) return;
    P.recordHit(state, q.correct.key); tracker.hit(); ctx.save(); drawProg();
    mascot.classList.remove('cheer'); void mascot.offsetWidth; mascot.classList.add('cheer');
    const word = nextPraise(); bubble.textContent = `${word} ${tracker.correct} z ${GAME_TARGET}`;
    game.onCorrect?.(el);
    if (tracker.done) { over = true; setTimeout(finish, reducedMotion() ? 200 : 700); narrator.speak([word]); return; }
    narrator.speak([word]);
    setTimeout(() => { if (!destroyed && !over) newQuestion(); }, reducedMotion() ? 500 : 1200);
  }
  function wrong(el, itemKey) {
    if (over) return;
    tracker.miss(); P.recordMiss(state, itemKey ?? q.correct.key); ctx.save();
    const retry = nextRetry(); bubble.textContent = retry;
    mascot.classList.remove('think'); void mascot.offsetWidth; mascot.classList.add('think');
    narrator.speak([retry, ...speakParts(q.ask.say)]);
    game.onWrong?.(el);
  }
  function finish() {
    if (destroyed) return;
    destroy(); narrator.cancel();
    const stars = tracker.stars; P.recordGame(state, subject, gameId, stars); ctx.save();
    const big = h('div', { class: 'bigstars', role: 'img', 'aria-label': `${stars} z 3 gwiazdek` });
    for (let i = 1; i <= 3; i++) big.append(h('span', { class: 'bstar' + (i <= stars ? ' on' : ''), style: `--i:${i}`, html: STAR }));
    clear(box);
    box.append(h('div', { class: 'done-screen game-done' }, ctx.topbar({ back: 'Mapa', onBack: onExit, title }),
      h('div', { class: 'card center' }, h('h2', {}, 'Super zabawa!'), big, h('p', { class: 'lead' }, `Trafienia: ${tracker.correct}, pomyłki: ${tracker.wrongs}.`),
        h('div', { class: 'btn-row' }, h('button', { class: 'btn primary', type: 'button', id: 'again-btn', onclick: () => runGame(ctx, box, { subject, gameId, onExit, bonus }) }, 'Jeszcze raz'), h('button', { class: 'btn', type: 'button', onclick: onExit }, 'Wróć do mapy')))));
    narrator.speak([nextPraise()]);
  }

  /* ---------- pętla: pauza na ukrytej karcie i przy fokusie klawiatury ---------- */
  const keyboardFocus = () => { const a = document.activeElement; return !!a?.classList?.contains(itemClass) && field.contains(a) && a.matches(':focus-visible'); }; // tylko fokus z klawiatury (kliknięcie myszą nie wstrzymuje gry)
  const frame = (t) => {
    if (destroyed) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0); lastT = t;
    if (document.hidden || over) return;
    if (keyboardFocus()) return; // tryb klawiaturowy: elementy stoją w miejscu, gdy wybierasz je Tab-em
    game.update(dt);
  };
  const onVis = () => { if (document.hidden) narrator.cancel(); lastT = performance.now(); };
  on(document, 'visibilitychange', onVis);
  function destroy() { destroyed = true; cancelAnimationFrame(raf); cleanups.forEach((f) => f()); cleanups.length = 0; }
  const env = { ctx, field, itemEl, correct, wrong, get q() { return q; }, speed, rand, on, test, skin: SKIN[ctx.world().id] ?? SKIN.kosmos, worldId: ctx.world().id, bubble, mascot, tracker };
  const game = { lap, sciezka, balony }[gameId](env);
  newQuestion();
  lastT = performance.now(); raf = requestAnimationFrame(frame);
  return { destroy };
}

/* ======================= Łap i czytaj ======================= */
function lap(env) {
  const { field, itemEl, correct, wrong, rand, on } = env;
  const LANES = 5, laneX = (l) => 0.12 + l * 0.19;
  const basket = h('div', { class: 'basket', 'aria-hidden': 'true', html: `<svg viewBox='0 0 120 70'><path d='M8 14h104l-12 48q-2 6-8 6H28q-6 0-8-6z' fill='var(--accent)' stroke='var(--line)' stroke-width='4' stroke-linejoin='round'/><path d='M28 14v50M60 14v54M92 14v50' stroke='var(--line)' stroke-width='3' opacity='.5'/></svg>` });
  field.append(basket);
  let bx = 0.5, bTarget = 0.5, keyDir = 0;
  const items = []; const spawner = createSpawner({ interval: 2.6, maxAlive: 4, lanes: LANES, correctEvery: 3, rand });
  const rect = () => field.getBoundingClientRect();
  on(field, 'pointermove', (e) => { const r = rect(); bTarget = clamp((e.clientX - r.left) / r.width, 0.07, 0.93); });
  on(field, 'pointerdown', (e) => { const r = rect(); bTarget = clamp((e.clientX - r.left) / r.width, 0.07, 0.93); });
  on(window, 'keydown', (e) => {
    if (e.target?.classList?.contains(itemClass) || e.ctrlKey || e.altKey || e.metaKey) return;
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') { keyDir = -1; bTarget = clamp(bTarget - 0.09, 0.07, 0.93); e.preventDefault(); }
    if (k === 'arrowright' || k === 'd') { keyDir = 1; bTarget = clamp(bTarget + 0.09, 0.07, 0.93); e.preventDefault(); }
  });
  const remove = (it) => { it.el.remove(); const i = items.indexOf(it); if (i >= 0) items.splice(i, 1); };
  const spawn = (lane, wantCorrect) => {
    const picks = pickItems(env.q, 6, rand), item = wantCorrect ? env.q.correct : picks.filter((p) => p.id !== env.q.correct.id)[Math.floor(rand() * Math.max(1, picks.length - 1))] ?? picks[0];
    const el = itemEl(item, 'falling');
    const it = { el, item, x: laneX(lane), y: -0.08, lane, state: 'fall', t: 0, isCorrect: item.id === env.q.correct.id };
    el.addEventListener('click', (e) => { if (e.detail > 0) el.blur(); resolve(it, true); }); field.append(el); items.push(it); place(el, it.x, it.y);
  };
  function resolve(it, byTap = false) {
    if (it.state !== 'fall') return;
    if (it.isCorrect) { it.state = 'caught'; it.el.classList.add('caught'); correct(it.el); setTimeout(() => remove(it), 500); }
    else { it.state = 'drift'; it.dir = it.x < bx ? -1 : 1; it.el.classList.add('drift'); wrong(it.el, it.item.key); }
  }
  return {
    onQuestion() { items.slice().forEach(remove); spawner.reset(); },
    update(dt) {
      const sp = env.speed();
      bx += clamp(bTarget - bx, -1.6 * dt, 1.6 * dt); place(basket, bx, 0.9);
      const alive = items.filter((i) => i.state === 'fall');
      for (const s of spawner.tick(dt * sp, { alive: alive.length, aliveCorrect: alive.filter((i) => i.isCorrect).length })) spawn(s.lane, s.correct);
      for (const it of items.slice()) {
        it.t += dt;
        if (it.state === 'fall') {
          it.y += 0.2 * sp * dt;
          if (it.y > 0.78 && it.y < 0.98 && Math.abs(it.x - bx) < 0.1) resolve(it);
          if (it.y > 1.08) { if (it.isCorrect) { it.y = -0.08; } else remove(it); }
        } else if (it.state === 'drift') { it.x += it.dir * 0.3 * dt; it.y += 0.12 * dt; it.el.style.opacity = String(Math.max(0, 1 - (it.t % 100) * 0)); if (it.x < -0.1 || it.x > 1.1 || it.y > 1.1) remove(it); }
        place(it.el, it.x, it.y);
      }
    },
    onCorrect() {},
    onWrong() {},
  };
}

/* ======================= Ścieżka ======================= */
function sciezka(env) {
  const { field, itemEl, correct, wrong, rand, on, skin, ctx } = env;
  const heroEl = h('div', { class: 'hero', 'aria-hidden': 'true', html: ctx.mascot(0).svg });
  const decor = h('div', { class: 'decor', 'aria-hidden': 'true', html: `<svg viewBox='0 0 100 60' preserveAspectRatio='none'><path d='M50 58 C50 40 20 38 18 22 M50 58 C50 40 50 36 50 22 M50 58 C50 40 80 38 82 22' fill='none' stroke='var(--line)' stroke-width='1.2' stroke-dasharray='3 3' opacity='.55'/></svg>` });
  field.append(decor, heroEl);
  const LANES = [0.18, 0.5, 0.82];
  let sel = 1, lanes = [], hero = { x: 0.5, y: 0.86 }, mode = 'idle', t = 0, target = null, goodHop = false;
  place(heroEl, hero.x, hero.y);
  const platform = (i, it) => {
    const b = itemEl(it, 'platform p-' + skin.platform);
    b.style.setProperty('--plat', skin.plat[i % skin.plat.length]);
    b.addEventListener('click', () => { sel = i; paintSel(); go(i); });
    b.addEventListener('focus', () => { sel = i; paintSel(); });
    return b;
  };
  const paintSel = () => lanes.forEach((l, i) => l.el.classList.toggle('sel', i === sel));
  function build() {
    lanes.forEach((l) => l.el.remove());
    const picks = pickItems(env.q, 3, rand);
    const order = [...picks].sort(() => rand() - 0.5);
    lanes = order.map((it, i) => { const el = platform(i, it); place(el, LANES[i], 0.3 + (i === 1 ? -0.06 : 0)); field.append(el); return { el, item: it, x: LANES[i], y: 0.3 + (i === 1 ? -0.06 : 0) }; });
    sel = 1; paintSel(); hero = { x: 0.5, y: 0.86 }; place(heroEl, hero.x, hero.y); mode = 'idle'; heroEl.classList.remove('hop');
  }
  function go(i) {
    if (mode !== 'idle') return;
    const l = lanes[i]; target = { x: l.x, y: l.y + 0.1, lane: i }; goodHop = l.item.id === env.q.correct.id; mode = 'out'; t = 0; heroEl.classList.add('hop');
  }
  on(window, 'keydown', (e) => {
    if (e.ctrlKey || e.altKey || e.metaKey || e.target?.tagName === 'INPUT') return;
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') { sel = Math.max(0, sel - 1); paintSel(); e.preventDefault(); }
    else if (k === 'arrowright' || k === 'd') { sel = Math.min(2, sel + 1); paintSel(); e.preventDefault(); }
    else if ((k === 'arrowup' || k === 'w' || k === ' ' || k === 'enter') && !e.target?.classList?.contains(itemClass) && !(e.target?.tagName === 'BUTTON')) { go(sel); e.preventDefault(); }
  });
  return {
    onQuestion: build,
    update(dt) {
      const sp = env.speed(), dur = 1.1 / Math.max(0.5, sp);
      if (mode === 'out') {
        t += dt; const k = Math.min(1, t / dur), e = k * k * (3 - 2 * k);
        hero.x = 0.5 + (target.x - 0.5) * e; hero.y = 0.86 + (target.y - 0.86) * e - Math.sin(k * Math.PI) * 0.08; place(heroEl, hero.x, hero.y);
        if (k >= 1) { mode = goodHop ? 'celebrate' : 'back'; t = 0; heroEl.classList.remove('hop'); const l = lanes[target.lane]; if (goodHop) { l.el.classList.add('caught'); correct(l.el); } else { l.el.classList.add('bounce'); wrong(l.el, l.item.key); } }
      } else if (mode === 'back') {
        t += dt; const k = Math.min(1, t / dur), e = k * k * (3 - 2 * k);
        hero.x = target.x + (0.5 - target.x) * e; hero.y = target.y + (0.86 - target.y) * e - Math.sin(k * Math.PI) * 0.05; place(heroEl, hero.x, hero.y);
        if (k >= 1) { mode = 'idle'; lanes[target.lane]?.el.classList.remove('bounce'); }
      }
    },
    onCorrect() {}, onWrong() {},
  };
}

/* ======================= Balony ======================= */
function balony(env) {
  const { field, itemEl, correct, wrong, rand, on, skin } = env;
  const cross = h('div', { class: 'cross', 'aria-hidden': 'true', hidden: true, html: `<svg viewBox='0 0 40 40'><circle cx='20' cy='20' r='14' fill='none' stroke='var(--ink)' stroke-width='3'/><path d='M20 2v10M20 28v10M2 20h10M28 20h10' stroke='var(--ink)' stroke-width='3'/></svg>` });
  field.append(cross);
  let cx = 0.5, cy = 0.5, keys = new Set(); const balls = []; const spawner = createSpawner({ interval: 1.5, maxAlive: 5, lanes: 6, correctEvery: 3, rand });
  const laneX = (l) => 0.1 + l * 0.16;
  const remove = (b) => { b.el.remove(); const i = balls.indexOf(b); if (i >= 0) balls.splice(i, 1); };
  const spawn = (lane, wantCorrect) => {
    const picks = pickItems(env.q, 6, rand), item = wantCorrect ? env.q.correct : picks.filter((p) => p.id !== env.q.correct.id)[Math.floor(rand() * Math.max(1, picks.length - 1))] ?? picks[0];
    const el = itemEl(item, 'balloon'); el.style.setProperty('--bal', skin.balloon[balls.length % skin.balloon.length]);
    const b = { el, item, x: laneX(lane), y: 1.12, isCorrect: item.id === env.q.correct.id, state: 'up', ph: rand() * 6 };
    el.addEventListener('click', (e) => { if (e.detail > 0) el.blur(); pop(b); }); field.append(el); balls.push(b); place(el, b.x, b.y);
  };
  function pop(b) {
    if (b.state !== 'up') return;
    if (b.isCorrect) { b.state = 'pop'; b.el.classList.add('popped'); correct(b.el); setTimeout(() => remove(b), 450); }
    else { b.el.classList.remove('wob'); void b.el.offsetWidth; b.el.classList.add('wob'); wrong(b.el, b.item.key); }
  }
  on(window, 'keydown', (e) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return; const k = e.key.toLowerCase();
    if (e.target?.classList?.contains(itemClass)) return;
    if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'a', 'd', 'w', 's'].includes(k)) { keys.add(k); cross.hidden = false; e.preventDefault(); }
    if (k === ' ' || k === 'enter') { const hit = balls.filter((b) => b.state === 'up').sort((p, r) => Math.hypot(p.x - cx, p.y - cy) - Math.hypot(r.x - cx, r.y - cy))[0]; if (hit && Math.hypot(hit.x - cx, hit.y - cy) < 0.13) pop(hit); e.preventDefault(); }
  });
  on(window, 'keyup', (e) => keys.delete(e.key.toLowerCase()));
  return {
    onQuestion() { balls.slice().forEach(remove); spawner.reset(); },
    update(dt) {
      const sp = env.speed();
      const dx = (keys.has('arrowright') || keys.has('d') ? 1 : 0) - (keys.has('arrowleft') || keys.has('a') ? 1 : 0), dy = (keys.has('arrowdown') || keys.has('s') ? 1 : 0) - (keys.has('arrowup') || keys.has('w') ? 1 : 0);
      cx = clamp(cx + dx * 0.55 * dt, 0.04, 0.96); cy = clamp(cy + dy * 0.55 * dt, 0.06, 0.94); place(cross, cx, cy);
      const alive = balls.filter((b) => b.state === 'up');
      for (const s of spawner.tick(dt * sp, { alive: alive.length, aliveCorrect: alive.filter((b) => b.isCorrect).length })) spawn(s.lane, s.correct);
      for (const b of balls) {
        b.ph += dt; b.y -= 0.11 * sp * dt; if (b.y < -0.14) b.y = 1.12;
        place(b.el, b.x + (reducedMotion() ? 0 : Math.sin(b.ph * 1.3) * 0.012), b.y);
      }
    },
    onCorrect() {}, onWrong() {},
  };
}
