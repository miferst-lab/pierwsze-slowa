// Uruchamianie poziomu matematyki: ten sam przebieg co w czytaniu (gwiazdki, łagodna informacja zwrotna, podpowiedź po drugiej pomyłce),
// inne typy zadań. Przedmioty do liczenia zależą od świata (js/art/manip.js); liczby i rzeczowniki lektor składa z krótkich nagrań.
import { h, clear, shuffle, delay, STAR } from '../../js/core/ui.js';
import * as P from '../../js/core/progress.js';
import { PRAISE, RETRY, FINISH, variantPicker } from '../../js/core/lines.js';
import { manipOf, groupSvg, frameSvg, moneySvg, clockSvg, rulerSvg, shapeSvg, tokenSvg, svgWrap, PROBLEM_ITEMS, SHAPES } from '../../js/art/manip.js';
import { MATH_LEVELS } from './curriculum.js';
import { resolveParts } from './say.js';

const nextPraise = variantPicker(PRAISE), nextRetry = variantPicker(RETRY), nextFinish = variantPicker(FINISH);
const testMode = () => new URLSearchParams(globalThis.location?.search ?? '').has('test');
export const MATH_KEY = (s) => 'm:' + s;

const manip = (task, ctx) => manipOf(ctx.world().id, task.obj);
const one = (inner) => svgWrap(100, 100, inner, 'one');
const numHtml = (v) => `<span class='txt k-num'>${v}</span>`;
const SIGN_TXT = { '<': '<', '>': '>', '=': '=' };
const lockAll = (btns) => btns.forEach((b) => { b.disabled = true; });
const pulseCorrect = (btns, task) => btns.find((b) => b.dataset.val === String(task.answer))?.classList.add('pulse');

/** Przyciski odpowiedzi (≤ 4). content(o) → { aria, html }. */
function optButtons(task, options, content, onPick) {
  const wrap = h('div', { class: 'opts n' + options.length, role: 'group', 'aria-label': 'Odpowiedzi' });
  const btns = options.map((o, i) => {
    const c = content(o);
    const b = h('button', { class: 'opt', type: 'button', 'data-val': String(o), 'aria-label': c.aria }, h('span', { class: 'num', 'aria-hidden': 'true' }, i + 1), h('span', { class: 'inner', html: c.html }));
    if (testMode() && o === task.answer) b.setAttribute('data-correct', '1');
    b.addEventListener('click', () => onPick(o, b, btns));
    return b;
  });
  wrap.append(...btns);
  return { wrap, btns };
}
const numContent = (o) => ({ aria: String(o), html: numHtml(o) });
const textContent = (o) => ({ aria: o, html: `<span class='txt k-word'>${o}</span>` });

/** Wspólne zachowanie zadań „wybierz odpowiedź”. */
function choice(task, stage, api, { content = numContent, top = [], itemKey = (o) => MATH_KEY(o), say } = {}) {
  const { wrap, btns } = optButtons(task, shuffle(task.options), content, (o, b) => {
    if (o === task.answer) { lockAll(btns); b.classList.add('good'); api.right(itemKey(o)); }
    else { b.classList.add('soft'); api.wrong(itemKey(task.answer)); }
  });
  stage.append(...top, wrap);
  return { hint: (n) => n >= 2 && pulseCorrect(btns, task) };
}
const scene = (html, cls = '') => h('div', { class: 'scene ' + cls, html });
const eqHtml = (e, ans = '▢') => {
  const v = (k) => (e.blank === k ? `<span class='blank'>${ans}</span>` : e[k]);
  const c = e.op === '+' ? e.a + e.b : e.a - e.b;
  return `<span class='eq'>${v('a')} <i>${e.op === '+' ? '+' : '−'}</i> ${v('b')} <i>=</i> ${e.blank === 'c' ? `<span class='blank'>${ans}</span>` : c}</span>`;
};
/** a przedmiotów, a przy odejmowaniu ostatnie b przyciemnione. */
function groupsArt(inner, a, b, op) {
  const box = h('div', { class: 'art-row' });
  const g1 = h('span', { class: 'artg', html: groupSvg(inner, a) });
  box.append(g1);
  if (op === '-') { [...g1.querySelectorAll('svg > g')].slice(a - b).forEach((g) => g.setAttribute('opacity', '.22')); return box; }
  box.append(h('span', { class: 'sym' }, '+'), h('span', { class: 'artg', html: groupSvg(inner, b) }));
  return box;
}

const RENDER = {
  tapNum(task, stage, api) { return choice(task, stage, api, { top: [api.nosound(`Bez dźwięku: znajdź liczbę ${task.answer}.`)] }); },
  count(task, stage, api, ctx) { return choice(task, stage, api, { top: [scene(groupSvg(manip(task, ctx).inner, task.n, { label: 'przedmioty do policzenia' }))] }); },
  seq(task, stage, api) {
    const row = h('div', { class: 'seq-row', role: 'img', 'aria-label': 'Ciąg liczb' }, task.items.map((v) => h('span', { class: 'seqbox' + (v === null ? ' gap' : '') }, v === null ? '?' : v)));
    return choice(task, stage, api, { top: [row] });
  },
  eq(task, stage, api, ctx) {
    const top = [];
    if (task.art) top.push(groupsArt(manip(task, ctx).inner, task.eq.a, task.eq.b, task.eq.op));
    top.push(h('div', { class: 'eqline', html: eqHtml(task.eq) }));
    return choice(task, stage, api, { top });
  },
  problem(task, stage, api, ctx) {
    const it = PROBLEM_ITEMS[task.art.item];
    const art = groupsArt(it.inner, task.art.a, task.art.b, task.art.op);
    const card = h('p', { class: 'ptext' }, task.text), again = h('button', { class: 'btn ghost small', type: 'button', onclick: () => api.speak(api.say(task.say)) }, 'Posłuchaj jeszcze raz');
    return choice(task, stage, api, { top: [card, art, again] });
  },
  pattern(task, stage, api) {
    const tok = (s) => { const [k, c] = s.split(':'); return tokenSvg(k, c); };
    const row = h('div', { class: 'pat-row' }, task.seq.map((s) => h('span', { class: 'patitem', html: tok(s) })), h('span', { class: 'patitem q' }, '?'));
    return choice(task, stage, api, { top: [row], content: (o) => ({ aria: o.split(':')[0], html: tok(o) }), itemKey: () => MATH_KEY('wzorek') });
  },
  shapeTap(task, stage, api) { return choice(task, stage, api, { top: [api.nosound(`Bez dźwięku: dotknij ${SHAPES[task.target].label}.`)], content: (o) => ({ aria: SHAPES[o].label, html: shapeSvg(o, shapeColor(o)) }), itemKey: () => MATH_KEY('figury') }); },
  shapeName(task, stage, api) { return choice(task, stage, api, { top: [scene(shapeSvg(task.target, shapeColor(task.target)))], content: (o) => textContent(SHAPES[o].label), itemKey: () => MATH_KEY('figury') }); },
  shapeSides(task, stage, api) { return choice(task, stage, api, { top: [scene(shapeSvg(task.target, shapeColor(task.target)))], itemKey: () => MATH_KEY('figury') }); },
  ruler(task, stage, api) { return choice(task, stage, api, { top: [scene(rulerSvg(task.len), 'wide')], itemKey: () => MATH_KEY('cm') }); },
  coinSum(task, stage, api) { return choice(task, stage, api, { top: [h('div', { class: 'money-row' }, task.vals.map((v) => h('span', { class: 'money', html: moneySvg(v) })))], itemKey: () => MATH_KEY('zl') }); },
  coin100(task, stage, api) { return choice(task, stage, api, { top: [scene(moneySvg(1))], itemKey: () => MATH_KEY('zl') }); },
  clock(task, stage, api) { return choice(task, stage, api, { top: [scene(clockSvg(task.hour, { label: 'zegar' }))], content: (o) => ({ aria: `${o}:00`, html: numHtml(`${o}:00`) }), itemKey: () => MATH_KEY('zegar') }); },
  clockPick(task, stage, api) {
    return choice(task, stage, api, { top: [h('p', { class: 'ptext big' }, `${task.hour}:00`)], content: (o) => ({ aria: `zegar ${o}:00`, html: clockSvg(o) }), itemKey: () => MATH_KEY('zegar') });
  },
  cmpGroups(task, stage, api, ctx) {
    const inner = manip(task, ctx).inner;
    const { wrap, btns } = optButtons(task, task.options, (o) => ({ aria: o === 'left' ? 'grupa po lewej' : 'grupa po prawej', html: groupSvg(inner, o === 'left' ? task.a : task.b) }), (o, b) => {
      if (o === task.answer) { lockAll(btns); b.classList.add('good'); api.right(MATH_KEY('porownanie')); } else { b.classList.add('soft'); api.wrong(MATH_KEY('porownanie')); }
    });
    wrap.classList.add('cmp'); stage.append(wrap);
    return { hint: (n) => n >= 2 && pulseCorrect(btns, task) };
  },
  cmpWords(task, stage, api, ctx) {
    const inner = manip(task, ctx).inner;
    const panels = h('div', { class: 'cmp-panels' }, h('div', { class: 'cmp-panel', html: groupSvg(inner, task.a) }), h('div', { class: 'cmp-panel', html: groupSvg(inner, task.b) }));
    return choice(task, stage, api, { top: [panels], content: textContent, itemKey: () => MATH_KEY('porownanie') });
  },
  sign(task, stage, api, ctx) {
    const inner = manip(task, ctx).inner;
    const side = (n) => (task.pics ? h('span', { class: 'artg', html: groupSvg(inner, n) }) : h('span', { class: 'bignum' }, n));
    const row = h('div', { class: 'art-row' }, side(task.a), h('span', { class: 'blank qs' }, '?'), side(task.b));
    return choice(task, stage, api, { top: [row], content: (o) => ({ aria: { '<': 'mniejsze', '>': 'większe', '=': 'równe' }[o], html: `<span class='txt k-num'>${SIGN_TXT[o]}</span>` }), itemKey: () => MATH_KEY('znaki') });
  },
  order(task, stage, api) {
    let next = 0; const sorted = [...task.nums].sort((x, y) => (task.dir === 'asc' ? x - y : y - x));
    const tiles = shuffle(task.nums).map((n) => {
      const b = h('button', { class: 'tile num', type: 'button', 'data-n': n }, n);
      b.addEventListener('click', () => {
        if (b.classList.contains('read')) return;
        if (n === sorted[next]) {
          b.classList.add('read'); b.setAttribute('aria-pressed', 'true'); b.dataset.order = String(++next);
          if (next === sorted.length) api.right(MATH_KEY('kolejnosc')); else api.speak([{ num: n }].map((p) => api.say([p])[0]));
        } else { b.classList.add('wob'); setTimeout(() => b.classList.remove('wob'), 600); api.wrong(MATH_KEY('kolejnosc')); }
      });
      return b;
    });
    stage.append(h('div', { class: 'tiles' }, tiles), h('p', { class: 'small-hint' }, 'Dotykaj liczb po kolei.'));
    return { hint: () => tiles.find((b) => Number(b.dataset.n) === sorted[next])?.classList.add('pulse') };
  },
  make(task, stage, api, ctx) {
    const m = manip(task, ctx);
    const plate = h('div', { class: 'plate', 'aria-label': 'Talerz', role: 'group' }), pile = h('div', { class: 'pile', role: 'group', 'aria-label': 'Przedmioty do wzięcia' });
    const count = h('p', { class: 'ptext', 'aria-live': 'polite' }), done = h('button', { class: 'btn primary', type: 'button', id: 'done-btn' }, 'Gotowe');
    const upd = () => { count.textContent = `Na talerzu: ${plate.children.length}`; };
    const move = (el, to) => { to.append(el); upd(); };
    for (let i = 0; i < task.pile; i++) {
      const b = h('button', { class: 'manip', type: 'button', draggable: 'true', 'aria-label': 'przedmiot', html: one(m.inner) });
      b.addEventListener('click', () => move(b, b.parentElement === pile ? plate : pile));
      b.addEventListener('dragstart', (ev) => { ev.dataTransfer.setData('text/plain', 'x'); b._drag = true; globalThis.__dragEl = b; });
      pile.append(b);
    }
    for (const [zone, tgt] of [[plate, plate], [pile, pile]]) { zone.addEventListener('dragover', (e) => e.preventDefault()); zone.addEventListener('drop', (e) => { e.preventDefault(); if (globalThis.__dragEl) move(globalThis.__dragEl, tgt); }); }
    done.addEventListener('click', () => { if (plate.children.length === task.n) { done.disabled = true; api.right(MATH_KEY(task.n)); } else api.wrong(MATH_KEY(task.n)); });
    upd(); stage.append(h('div', { class: 'make-area' }, plate, pile), count, done);
    return { hint: (n) => { if (n >= 2) { done.classList.add('pulse'); count.textContent += ` – potrzeba ${task.n}`; } } };
  },
  frame(task, stage, api) {
    const cells = task.frames * 10, added = [];
    const grid = h('div', { class: 'frames' + (task.frames === 2 ? ' two' : '') });
    const btns = [...Array(cells)].map((_, i) => {
      const b = h('button', { class: 'cell', type: 'button', 'data-i': i, 'aria-label': `pole ${i + 1}` });
      b.addEventListener('click', () => {
        if (i < task.pre) return;
        if (b.classList.contains('add')) { if (added[added.length - 1] === i) { b.classList.remove('add'); b.classList.add('empty'); added.pop(); sync(); } return; }
        const free = btns.findIndex((x, k) => k >= task.pre && !x.classList.contains('add'));
        if (free < 0) return; btns[free].classList.remove('empty'); btns[free].classList.add('add'); added.push(free); sync();
      });
      return b;
    });
    const label = h('p', { class: 'ptext', 'aria-live': 'polite' }), done = h('button', { class: 'btn primary', type: 'button', id: 'done-btn' }, 'Gotowe');
    const sync = () => { btns.forEach((b, i) => { b.classList.toggle('pre', i < task.pre); b.classList.toggle('empty', i >= task.pre && !b.classList.contains('add')); }); label.textContent = task.pre ? `${task.pre} + ${added.length} = ${task.pre + added.length}` : `Zaznaczone: ${added.length}`; };
    for (let f = 0; f < task.frames; f++) grid.append(h('div', { class: 'frame' }, btns.slice(f * 10, f * 10 + 10)));
    sync();
    done.addEventListener('click', () => { if (added.length === task.add) { done.disabled = true; api.right(MATH_KEY(task.pre + task.add)); } else api.wrong(MATH_KEY(task.pre + task.add)); });
    stage.append(grid, label, done);
    return { hint: (n) => { if (n >= 2) { done.classList.add('pulse'); label.textContent += ` – dotknij ${task.add}`; } } };
  },
  pay(task, stage, api) {
    const tray = h('div', { class: 'tray', role: 'group', 'aria-label': 'Pieniądze do wzięcia' }), wallet = h('div', { class: 'wallet', role: 'group', 'aria-label': 'Portfel' });
    const sum = h('p', { class: 'ptext', 'aria-live': 'polite' }), done = h('button', { class: 'btn primary', type: 'button', id: 'done-btn' }, 'Gotowe');
    const total = () => [...wallet.children].reduce((a, b) => a + Number(b.dataset.v), 0);
    const upd = () => { sum.textContent = `W portfelu: ${total()} zł`; };
    for (const v of [1, 1, 2, 2, 5, 5, 10]) {
      const b = h('button', { class: 'moneybtn', type: 'button', 'data-v': v, 'aria-label': `${v} złotych`, html: moneySvg(v) });
      b.addEventListener('click', () => { (b.parentElement === tray ? wallet : tray).append(b); upd(); });
      tray.append(b);
    }
    done.addEventListener('click', () => { if (total() === task.amount) { done.disabled = true; api.right(MATH_KEY('zl')); } else api.wrong(MATH_KEY('zl')); });
    upd(); stage.append(h('p', { class: 'ptext big' }, `${task.amount} zł`), wallet, tray, sum, done);
    return { hint: (n) => { if (n >= 2) { done.classList.add('pulse'); sum.textContent += ` – potrzeba ${task.amount} zł`; } } };
  },
};
const shapeColor = (k) => ['#ffb4a2', '#9fd8e8', '#ffe08a', '#b8e2a0'][Object.keys(SHAPES).indexOf(k) % 4];
export const MATH_RENDERERS = RENDER;

export function runMathLevel(ctx, box, level, { onExit, onNext, onBonus }) {
  const { state, narrator } = ctx;
  let idx = P.resumeIndex(state, level);
  const itemsBefore = P.itemsUnlockedCombined(state, ctx.readingLevels, ctx.allLevels);
  let cleanup = () => {};
  const strip = () => {
    const s = h('div', { class: 'starstrip', role: 'img', 'aria-label': `Gwiazdki: ${P.tasksDone(state, level)} z ${level.tasks.length} zadań` });
    level.tasks.forEach((t, i) => s.append(h('span', { class: 'sstar' + (state.levels[level.id]?.tasks?.[t.id] ? ' on' : '') + (i === idx ? ' cur' : ''), html: STAR })));
    return s;
  };
  function showTask() {
    cleanup(); narrator.cancel();
    const task = level.tasks[idx];
    P.setLast(state, 'math', level.id, idx); ctx.save();
    globalThis.__ps && (globalThis.__ps.task = task);
    clear(box);
    let wrongs = 0, finished = false;
    const worldId = ctx.world().id;
    const say = (parts) => resolveParts(parts, worldId, task.obj);
    const stageEl = h('main', { class: 'stage t-' + task.type, id: 'stage' });
    const bubble = h('div', { class: 'bubble', 'aria-live': 'polite' }, 'Posłuchaj i policz.');
    const nextBtn = h('button', { class: 'btn primary next', type: 'button', hidden: true, onclick: () => { idx++; idx >= level.tasks.length ? showDone() : showTask(); } }, idx === level.tasks.length - 1 ? 'Koniec poziomu' : 'Dalej');
    const mascot = h('div', { class: 'mascot', 'data-mascot': idx % 3, html: ctx.mascot(idx % 3).svg, 'aria-hidden': 'true' });
    const listen = h('button', { class: 'btn listen', type: 'button', onclick: () => narrator.speak(say(task.say)) }, h('span', { class: 'ico', 'aria-hidden': 'true', html: `<svg viewBox='0 0 24 24'><path d='M3 9v6h4l5 4V5L7 9z'/><path d='M15 8q3 4 0 8M17.5 5.5q5.5 6.5 0 13' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round'/></svg>` }), 'Posłuchaj');
    const bar = ctx.topbar({ back: 'Poziomy', onBack: () => { cleanup(); narrator.cancel(); onExit(); }, title: `${level.num}. ${level.title}`, extra: strip() });
    const promptEl = h('p', { class: 'prompt' }, task.type === 'problem' ? 'Zadanie' : task.prompt);
    box.append(h('div', { class: 'task-screen' }, bar, h('div', { class: 'prompt-row' }, promptEl, listen), stageEl, h('footer', { class: 'feedback' }, mascot, bubble, nextBtn)));
    const api = {
      say, speak: (p) => narrator.speak(p), audible: () => narrator.audible,
      nosound: (text) => (narrator.audible ? document.createDocumentFragment() : h('p', { class: 'nosound' }, text)),
      right(item) {
        if (finished) return; finished = true;
        const stars = P.starsForWrongs(wrongs);
        P.recordHit(state, item); P.recordHit(state, 't:' + task.topic);
        P.recordTask(state, level, task.id, stars); ctx.save();
        const word = nextPraise();
        bubble.textContent = `${word} ${'★'.repeat(stars)}`;
        mascot.classList.add('cheer');
        bar.querySelector('.starstrip').replaceWith(strip());
        stageEl.classList.add('done'); nextBtn.hidden = false; nextBtn.focus();
        narrator.speak([...say(task.right ?? []), word]);
      },
      wrong(item) {
        if (finished) return;
        wrongs++; P.recordMiss(state, item); P.recordMiss(state, 't:' + task.topic); ctx.save();
        const retry = nextRetry(); bubble.textContent = retry;
        mascot.classList.remove('cheer'); void mascot.offsetWidth; mascot.classList.add('think');
        narrator.speak([retry, ...say(task.say)]);
        r?.hint?.(wrongs);
      },
    };
    const r = RENDER[task.type](task, stageEl, api, ctx);
    const onKey = (ev) => {
      if (ev.target?.tagName === 'INPUT' || ev.ctrlKey || ev.altKey || ev.metaKey) return;
      if (/^[1-4]$/.test(ev.key)) stageEl.querySelectorAll('.opt')[Number(ev.key) - 1]?.click();
    };
    window.addEventListener('keydown', onKey); cleanup = () => window.removeEventListener('keydown', onKey);
    setTimeout(() => narrator.speak(say(task.say)), 250);
  }
  function showDone() {
    cleanup(); narrator.cancel(); clear(box);
    const rating = P.levelRating(state, level);
    const itemsAfter = P.itemsUnlockedCombined(state, ctx.readingLevels, ctx.allLevels);
    const fresh = ctx.world().items.slice(itemsBefore, itemsAfter);
    const nextLevel = MATH_LEVELS[level.num];
    const stars = h('div', { class: 'bigstars', role: 'img', 'aria-label': `${rating} z 3 gwiazdek` });
    for (let i = 1; i <= 3; i++) stars.append(h('span', { class: 'bstar' + (i <= rating ? ' on' : ''), style: `--i:${i}`, html: STAR }));
    const reward = fresh.length ? h('div', { class: 'reward' }, h('p', {}, fresh.length > 1 ? 'Nowe skarby!' : 'Nowy skarb!'), h('div', { class: 'items' }, fresh.map((it) => h('figure', {}, h('div', { class: 'item-art', html: it.svg }), h('figcaption', {}, it.name))))) : h('p', { class: 'muted' }, 'Zbierasz kolejne skarby – już niedługo następny!');
    box.append(h('div', { class: 'done-screen' }, ctx.topbar({ back: 'Poziomy', onBack: onExit, title: level.title }),
      h('div', { class: 'card center' }, h('h2', {}, 'Poziom ukończony!'), stars, reward,
        h('div', { class: 'btn-row' },
          onBonus && level.num % 4 === 0 ? h('button', { class: 'btn accent', type: 'button', id: 'bonus-btn', onclick: () => onBonus(level) }, 'Zabawa bonusowa!') : null,
          nextLevel && P.isUnlocked(state, MATH_LEVELS, nextLevel.num - 1) ? h('button', { class: 'btn primary', type: 'button', onclick: () => onNext(nextLevel) }, 'Następny poziom') : null,
          h('button', { class: 'btn', type: 'button', onclick: onExit }, 'Poziomy'),
          h('button', { class: 'btn ghost', type: 'button', onclick: () => ctx.go('collection') }, 'Moje skarby')))));
    narrator.speak([nextFinish()]);
  }
  showTask();
}
