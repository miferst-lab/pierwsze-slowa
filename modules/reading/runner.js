// Uruchamianie poziomu: pętla zadań, gwiazdki, delikatna informacja zwrotna, ekran ukończenia.
import { h, clear, shuffle, delay, soundLabel, STAR } from '../../js/core/ui.js';
import { artSvg, WORD_ART } from '../../js/art/words.js';
import { stripPunct } from '../../js/core/say.js';
import * as P from '../../js/core/progress.js';
import { LEVELS } from './curriculum.js';

import { PRAISE, RETRY, FINISH, variantPicker } from '../../js/core/lines.js';

// jedno losowanie na całą grę: wariant nigdy nie powtarza się dwa razy z rzędu (także między zadaniami)
const nextPraise = variantPicker(PRAISE), nextRetry = variantPicker(RETRY), nextFinish = variantPicker(FINISH);
const testMode = () => new URLSearchParams(globalThis.location?.search ?? '').has('test');
const sayPart = (task, v) => (task.kind === 'sound' ? '#' + v : v);
const label = (task, v) => (task.kind === 'sound' ? soundLabel(v) : v);

function optButtons(task, options, content, onPick) {
  const wrap = h('div', { class: 'opts n' + options.length, role: 'group', 'aria-label': 'Odpowiedzi' });
  const btns = options.map((o, i) => {
    const b = h('button', { class: 'opt', type: 'button', 'data-val': o, 'aria-label': content(o).aria }, h('span', { class: 'num', 'aria-hidden': 'true' }, i + 1), h('span', { class: 'inner', html: content(o).html }));
    if (testMode() && o === task.answer) b.setAttribute('data-correct', '1');
    b.addEventListener('click', () => onPick(o, b, btns));
    return b;
  });
  wrap.append(...btns);
  return { wrap, btns };
}
const textContent = (task) => (o) => ({ aria: label(task, o), html: `<span class='txt k-${task.kind}'>${label(task, o).replace(/</g, '&lt;')}</span>` });
const artContent = (o) => ({ aria: WORD_ART[o]?.label ?? o, html: artSvg(o, { label: WORD_ART[o]?.label }) });
const pulseCorrect = (btns, task) => btns.find((b) => b.dataset.val === task.answer)?.classList.add('pulse');
const lockAll = (btns) => btns.forEach((b) => { b.disabled = true; });

function fallbackLine(api, text) {
  return api.audible() ? document.createDocumentFragment() : h('p', { class: 'nosound' }, text);
}

const RENDER = {
  hear(task, stage, api) {
    const { wrap, btns } = optButtons(task, shuffle(task.options), textContent(task), (o, b) => {
      if (o === task.answer) { lockAll(btns); b.classList.add('good'); api.right(task.answer, [sayPart(task, o)]); }
      else { b.classList.add('soft'); b.setAttribute('aria-disabled', 'true'); api.wrong(task.answer); }
    });
    stage.append(fallbackLine(api, `Bez dźwięku: znajdź „${label(task, task.answer)}”.`), wrap);
    return { hint: (n) => n >= 2 && pulseCorrect(btns, task) };
  },
  initial(task, stage, api) {
    const { wrap, btns } = optButtons(task, shuffle(task.options), artContent, (o, b) => {
      if (o === task.answer) { lockAll(btns); b.classList.add('good'); api.right(task.target, [WORD_ART[o].label]); }
      else { b.classList.add('soft'); api.wrong(task.target); }
    });
    stage.append(fallbackLine(api, `Bez dźwięku: szukamy obrazka na „${soundLabel(task.target)}”.`), wrap);
    return { hint: (n) => n >= 2 && pulseCorrect(btns, task) };
  },
  hearPic(task, stage, api) {
    const { wrap, btns } = optButtons(task, shuffle(task.options), artContent, (o, b) => {
      if (o === task.answer) { lockAll(btns); b.classList.add('good'); api.right(task.word, [task.word]); }
      else { b.classList.add('soft'); api.wrong(task.word); }
    });
    stage.append(fallbackLine(api, `Bez dźwięku: znajdź obrazek „${task.word}”.`), wrap);
    return { hint: (n) => n >= 2 && pulseCorrect(btns, task) };
  },
  pick(task, stage, api) {
    const { wrap, btns } = optButtons(task, shuffle(task.options), textContent(task), (o, b) => {
      if (o === task.answer) { lockAll(btns); b.classList.add('good'); api.right(task.answer, [o]); }
      else { b.classList.add('soft'); api.wrong(task.answer); }
    });
    stage.append(h('div', { class: 'scene', html: artSvg(task.art, { label: 'obrazek' }) }), wrap);
    return { hint: (n) => n >= 2 && pulseCorrect(btns, task) };
  },
  sentpic(task, stage, api) {
    const { wrap, btns } = optButtons(task, shuffle(task.options), (o) => ({ aria: o, html: `<span class='txt k-sentence'>${o}</span>` }), (o, b) => {
      if (o === task.answer) { lockAll(btns); b.classList.add('good'); api.right(task.answer, [o]); }
      else { b.classList.add('soft'); api.wrong(task.answer); }
    });
    stage.append(h('div', { class: 'scene wide', html: artSvg(task.scene, { label: 'obrazek' }) }), wrap);
    return { hint: (n) => n >= 2 && pulseCorrect(btns, task) };
  },
  readtap(task, stage, api) {
    const words = task.sentence.split(' ');
    const tapped = new Set();
    const line = h('div', { class: 'sentence-line', role: 'group', 'aria-label': 'Zdanie' });
    words.forEach((w, i) => {
      const b = h('button', { class: 'tapword', type: 'button' }, w);
      b.addEventListener('click', () => {
        tapped.add(i); b.classList.add('read');
        if (tapped.size === words.length) api.right(null, [stripPunct(w), task.sentence]);
        else api.speak([stripPunct(w)]);
      });
      line.append(b);
    });
    const whole = h('button', { class: 'btn ghost', type: 'button', onclick: () => api.speak([task.sentence]) }, 'Przeczytaj całe zdanie');
    if (task.scene) stage.append(h('div', { class: 'scene wide', html: artSvg(task.scene, { label: 'obrazek' }) }));
    stage.append(line, h('p', { class: 'small-hint' }, 'Dotknij każde słowo po kolei.'), whole);
    return { hint: () => line.querySelector('.tapword:not(.read)')?.classList.add('pulse') };
  },
  build(task, stage, api) {
    const units = task.units;
    let order = units.map((_, i) => i);
    for (let k = 0; k < 5 && units.length > 1 && order.join() === units.map((_, i) => i).join(); k++) order = shuffle(order);
    const slots = units.map(() => null); // indeks kafelka w slocie
    const slotsRow = h('div', { class: 'slots', role: 'group', 'aria-label': 'Miejsca na kafelki' });
    const tilesRow = h('div', { class: 'tiles', role: 'group', 'aria-label': 'Kafelki do ułożenia' });
    let checking = false, finished = false, hintOn = false;
    const say = (i) => api.speak([task.unitKind === 'sound' ? '#' + units[i] : units[i]]);
    const place = (tile, slot) => {
      if (checking || finished || slots[slot] != null) return;
      const prev = slots.indexOf(tile); if (prev >= 0) slots[prev] = null;
      slots[slot] = tile; draw(); say(tile);
      if (slots.every((s) => s != null)) check();
    };
    const check = async () => {
      checking = true;
      const got = slots.map((i) => units[i]).join('');
      if (got === task.word) { finished = true; slotsRow.classList.add('good'); api.right(task.word, [task.word]); }
      else {
        slotsRow.classList.add('soft'); api.wrong(task.word);
        await delay(1100);
        slots.fill(null); slotsRow.classList.remove('soft'); checking = false; draw();
      }
    };
    function draw() {
      clear(slotsRow); clear(tilesRow);
      slots.forEach((t, s) => {
        const b = h('button', { class: 'slot' + (t != null ? ' filled' : ''), type: 'button', 'aria-label': t != null ? `Miejsce ${s + 1}: ${units[t]}. Dotknij, by cofnąć.` : `Puste miejsce ${s + 1}` }, t != null ? units[t] : '');
        b.addEventListener('click', () => { if (t != null && !checking && !finished) { slots[s] = null; draw(); } });
        b.addEventListener('dragover', (ev) => ev.preventDefault());
        b.addEventListener('drop', (ev) => { ev.preventDefault(); const i = Number(ev.dataTransfer.getData('text/plain')); if (Number.isInteger(i)) place(i, s); });
        slotsRow.append(b);
      });
      const nextSlot = slots.indexOf(null);
      order.filter((i) => !slots.includes(i)).forEach((i) => {
        const b = h('button', { class: 'tile', type: 'button', draggable: 'true', 'data-pos': i }, units[i]);
        if (hintOn && nextSlot >= 0 && units[i] === units[nextSlot]) b.classList.add('pulse');
        b.addEventListener('click', () => { const s = slots.indexOf(null); if (s >= 0) place(i, s); });
        b.addEventListener('dragstart', (ev) => { ev.dataTransfer.setData('text/plain', String(i)); });
        tilesRow.append(b);
      });
    }
    draw();
    if (task.art) stage.append(h('div', { class: 'scene', html: artSvg(task.art, { label: 'obrazek' }) }));
    else stage.append(fallbackLine(api, `Bez dźwięku: ułóż „${task.word}”.`));
    stage.append(slotsRow, h('p', { class: 'small-hint' }, 'Dotknij kafelki po kolei albo przeciągnij je na miejsca.'), tilesRow);
    return { hint: (n) => { if (n >= 2) { hintOn = true; draw(); } } };
  },
  story(task, stage, api) {
    const read = new Set();
    const card = h('div', { class: 'story' });
    task.sentences.forEach((s, i) => {
      const b = h('button', { class: 'sline', type: 'button' }, s);
      b.addEventListener('click', () => { read.add(i); b.classList.add('read'); api.speak([s]); });
      card.append(b);
    });
    card.append(h('button', { class: 'btn ghost', type: 'button', onclick: () => api.speak([task.sentences.join(' ')]) }, 'Przeczytaj wszystko'));
    const { wrap, btns } = optButtons(task, shuffle(task.options), textContent({ ...task, kind: 'word' }), (o, b) => {
      if (o === task.answer) { lockAll(btns); b.classList.add('good'); api.right(task.answer, [o]); }
      else { b.classList.add('soft'); api.wrong(task.answer); }
    });
    const q = h('div', { class: 'question' }, h('p', { class: 'q-text' }, task.question.text), wrap);
    stage.classList.add('two-col');
    stage.append(card, q);
    return { hint: (n) => n >= 2 && pulseCorrect(btns, task) };
  },
};
export const TASK_RENDERERS = RENDER;

export function runLevel(ctx, box, level, { onExit, onNext }) {
  const { state, narrator } = ctx;
  let idx = P.resumeIndex(state, level);
  const itemsBefore = P.itemsUnlocked(state, LEVELS);
  let cleanup = () => {};

  function strip() {
    const s = h('div', { class: 'starstrip', role: 'img', 'aria-label': `Gwiazdki: ${P.tasksDone(state, level)} z ${level.tasks.length} zadań` });
    level.tasks.forEach((t, i) => s.append(h('span', { class: 'sstar' + (state.levels[level.id]?.tasks?.[t.id] ? ' on' : '') + (i === idx ? ' cur' : ''), html: STAR })));
    return s;
  }

  function showTask() {
    cleanup(); narrator.cancel();
    const task = level.tasks[idx];
    clear(box);
    let wrongs = 0, finished = false;
    const stageEl = h('main', { class: 'stage t-' + task.type, id: 'stage' });
    const bubble = h('div', { class: 'bubble', 'aria-live': 'polite' }, 'Posłuchaj i wybierz.');
    const nextBtn = h('button', { class: 'btn primary next', type: 'button', hidden: true, onclick: () => { idx++; idx >= level.tasks.length ? showDone() : showTask(); } }, idx === level.tasks.length - 1 ? 'Koniec poziomu' : 'Dalej');
    const mascot = h('div', { class: 'mascot', 'data-mascot': idx % 3, html: ctx.mascot(idx % 3).svg, 'aria-hidden': 'true' });
    const listen = h('button', { class: 'btn listen', type: 'button', onclick: () => narrator.speak(task.say) }, h('span', { class: 'ico', 'aria-hidden': 'true', html: `<svg viewBox='0 0 24 24'><path d='M3 9v6h4l5 4V5L7 9z'/><path d='M15 8q3 4 0 8M17.5 5.5q5.5 6.5 0 13' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round'/></svg>` }), 'Posłuchaj');
    const bar = ctx.topbar({ back: 'Poziomy', onBack: () => { cleanup(); narrator.cancel(); onExit(); }, title: `${level.num}. ${level.title}`, extra: strip() });
    box.append(h('div', { class: 'task-screen' }, bar, h('div', { class: 'prompt-row' }, h('p', { class: 'prompt' }, task.prompt), listen), stageEl, h('footer', { class: 'feedback' }, mascot, bubble, nextBtn)));

    const api = {
      speak: (p) => narrator.speak(p),
      audible: () => narrator.audible,
      right(item, say = []) {
        if (finished) return; finished = true;
        const stars = P.starsForWrongs(wrongs);
        P.recordHit(state, item);
        P.recordTask(state, level, task.id, stars);
        ctx.save();
        const word = nextPraise();
        bubble.textContent = `${word} ${'★'.repeat(stars)}`;
        mascot.classList.add('cheer');
        const s = strip(); bar.querySelector('.starstrip').replaceWith(s);
        stageEl.classList.add('done');
        nextBtn.hidden = false; nextBtn.focus();
        narrator.speak([...say, word]);
      },
      wrong(item) {
        if (finished) return;
        wrongs++; P.recordMiss(state, item); ctx.save();
        const retry = nextRetry();
        bubble.textContent = retry;
        mascot.classList.remove('cheer'); void mascot.offsetWidth; mascot.classList.add('think');
        narrator.speak([retry, ...task.say.filter((p, i) => i > 0 || task.type !== 'story')]);
        r?.hint?.(wrongs);
      },
    };
    const r = RENDER[task.type](task, stageEl, api);
    // numery 1–4 wybierają odpowiedź (wygoda przy klawiaturze)
    const onKey = (ev) => {
      if (ev.target?.tagName === 'INPUT' || ev.ctrlKey || ev.altKey || ev.metaKey) return;
      if (/^[1-4]$/.test(ev.key)) stageEl.querySelectorAll('.opt')[Number(ev.key) - 1]?.click();
    };
    window.addEventListener('keydown', onKey);
    cleanup = () => window.removeEventListener('keydown', onKey);
    setTimeout(() => narrator.speak(task.say), 250);
  }

  function showDone() {
    cleanup(); narrator.cancel(); clear(box);
    const rating = P.levelRating(state, level);
    const itemsAfter = P.itemsUnlocked(state, LEVELS);
    const world = ctx.world();
    const fresh = world.items.slice(itemsBefore, itemsAfter);
    const nextLevel = LEVELS[level.num];
    const stars = h('div', { class: 'bigstars', role: 'img', 'aria-label': `${rating} z 3 gwiazdek` });
    for (let i = 1; i <= 3; i++) stars.append(h('span', { class: 'bstar' + (i <= rating ? ' on' : ''), style: `--i:${i}`, html: STAR }));
    const reward = fresh.length ? h('div', { class: 'reward' }, h('p', {}, fresh.length > 1 ? 'Nowe skarby!' : 'Nowy skarb!'), h('div', { class: 'items' }, fresh.map((it) => h('figure', {}, h('div', { class: 'item-art', html: it.svg }), h('figcaption', {}, it.name))))) : h('p', { class: 'muted' }, 'Zbierasz kolejne skarby – już niedługo następny!');
    box.append(h('div', { class: 'done-screen' }, ctx.topbar({ back: 'Poziomy', onBack: onExit, title: level.title }),
      h('div', { class: 'card center' }, h('h2', {}, 'Poziom ukończony!'), stars, reward,
        h('div', { class: 'btn-row' }, nextLevel && P.isUnlocked(state, LEVELS, nextLevel.num - 1) ? h('button', { class: 'btn primary', type: 'button', onclick: () => onNext(nextLevel) }, 'Następny poziom') : null,
          h('button', { class: 'btn', type: 'button', onclick: onExit }, 'Poziomy'),
          h('button', { class: 'btn ghost', type: 'button', onclick: () => ctx.go('collection') }, 'Moje skarby')))));
    narrator.speak([nextFinish()]);
  }

  showTask();
}
