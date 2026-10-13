// Uruchamianie poziomu „Ćwiczenia wymowy”: kroki z gwiazdkami, samoocena „Powtórz” / „Super!”, nagrywanie lokalne, ekran ukończenia.
// Nie oceniamy wymowy automatycznie – dziecko (lub rodzic) wybiera sam, czy powtórzyć, czy jest „Super!”.
import { h, clear, STAR } from '../../js/core/ui.js';
import { artSvg, WORD_ART } from '../../js/art/words.js';
import * as P from '../../js/core/progress.js';
import { PRAISE, FINISH, variantPicker } from '../../js/core/lines.js';
import { PRON_LEVELS, EXERCISES } from './curriculum.js';
import { mouthFigure, exerciseSvg } from './mouth.js';
import { reducedMotion } from '../../js/core/ui.js';
import { createRecorder } from './recorder.js';

const nextPraise = variantPicker(PRAISE), nextFinish = variantPicker(FINISH);
const ICON = `<svg viewBox='0 0 24 24'><path d='M3 9v6h4l5 4V5L7 9z'/><path d='M15 8q3 4 0 8M17.5 5.5q5.5 6.5 0 13' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round'/></svg>`;

export function runPronLevel(ctx, box, level, { onExit, onNext }) {
  const { state, narrator } = ctx;
  let idx = P.resumeIndex(state, level);
  let cleanup = () => {};
  const leave = (fn) => () => { cleanup(); narrator.cancel(); fn(); };

  function strip() {
    const s = h('div', { class: 'starstrip', role: 'img', 'aria-label': `Gwiazdki: ${P.tasksDone(state, level)} z ${level.tasks.length} kroków` });
    level.tasks.forEach((t, i) => s.append(h('span', { class: 'sstar' + (state.levels[level.id]?.tasks?.[t.id] ? ' on' : '') + (i === idx ? ' cur' : ''), html: STAR })));
    return s;
  }

  function showTask() {
    cleanup(); narrator.cancel();
    const task = level.tasks[idx], def = level.def;
    P.setLast(state, 'pron', level.id, idx); ctx.save();
    clear(box);
    let repeats = 0, finished = false;
    const heard = new Set();
    const needAll = ['syll', 'words', 'sentence'].includes(task.type);
    const stageEl = h('main', { class: 'stage pron-stage t-' + task.type, id: 'stage' });
    const bubble = h('div', { class: 'bubble', 'aria-live': 'polite' }, needAll ? 'Dotknij każdą kartę i powtórz.' : task.type === 'listen' ? 'Posłuchaj i spróbuj powtórzyć.' : 'Zrób to powoli, razem z lektorem.');
    const nextBtn = h('button', { class: 'btn primary next', type: 'button', hidden: true, id: 'pron-next', onclick: () => { idx++; idx >= level.tasks.length ? showDone() : showTask(); } }, idx === level.tasks.length - 1 ? 'Koniec' : 'Dalej');
    const again = h('button', { class: 'btn', type: 'button', id: 'pron-again', onclick: () => { if (finished) return; repeats++; bubble.textContent = 'Jeszcze raz – powoli. Dasz radę!'; narrator.speak(task.say); } }, 'Powtórz');
    const great = h('button', { class: 'btn accent', type: 'button', id: 'pron-great', disabled: needAll, onclick: finish }, 'Super!');
    const mascot = h('div', { class: 'mascot', 'data-mascot': idx % 3, html: ctx.mascot(idx % 3).svg, 'aria-hidden': 'true' });
    const listen = h('button', { class: 'btn listen', type: 'button', onclick: () => narrator.speak(task.say) }, h('span', { class: 'ico', 'aria-hidden': 'true', html: ICON }), 'Posłuchaj');
    const bar = ctx.topbar({ back: 'Głoski', onBack: leave(onExit), title: `${level.title}`, extra: strip() });
    box.append(h('div', { class: 'task-screen' }, bar, h('div', { class: 'prompt-row' }, h('p', { class: 'prompt' }, task.prompt), listen), stageEl, h('footer', { class: 'feedback' }, mascot, bubble, again, great, nextBtn)));

    function finish() {
      if (finished || great.disabled) return; finished = true;
      const stars = P.starsForWrongs(repeats);
      P.recordTask(state, level, task.id, stars); ctx.save();
      const word = nextPraise();
      bubble.textContent = `${word} ${'★'.repeat(stars)}`;
      mascot.classList.add('cheer');
      bar.querySelector('.starstrip').replaceWith(strip());
      again.hidden = true; great.hidden = true; stageEl.classList.add('done'); nextBtn.hidden = false; nextBtn.focus();
      narrator.speak([word]);
    }
    const markHeard = (key) => { heard.add(key); if (needAll && heard.size >= task.items.length) { great.disabled = false; bubble.textContent = 'Świetnie! Powiedz to jeszcze raz sam(a) i dotknij „Super!”.'; } };

    let rec = null;
    const fig = (inner, cls = '') => h('div', { class: 'pron-fig ' + cls, html: inner });
    const tip = h('p', { class: 'pron-tip' }, task.tip);
    if (task.type === 'listen') {
      const chips = task.say.filter((p) => p !== 'Posłuchaj.').map((p) => h('button', { class: 'btn pron-chip', type: 'button', 'data-say': p, onclick: () => narrator.speak([p]) }, p.startsWith('#') ? p.slice(1).toUpperCase() : p));
      rec = createRecorder({ narrator, onModel: () => narrator.speak(task.say) });
      stageEl.append(h('div', { class: 'pron-main' }, fig(mouthFigure(def.id, { anim: !reducedMotion() }), 'big mouth'), h('div', { class: 'pron-side' }, h('div', { class: 'pron-chips' }, chips), rec.el)));
    } else if (needAll) {
      const cards = task.items.map((it, i) => {
        const art = task.type === 'words' && WORD_ART[it] ? h('span', { class: 'pc-art', html: artSvg(it, { label: WORD_ART[it].label }) }) : null;
        return h('button', { class: 'pron-card' + (task.type === 'sentence' ? ' wide' : ''), type: 'button', 'data-item': it, onclick: (e) => { e.currentTarget.classList.add('read'); narrator.speak([it]); markHeard(i); } }, art, h('span', { class: 'pc-txt' }, it));
      });
      rec = createRecorder({ narrator, onModel: () => narrator.speak(task.say) });
      stageEl.append(h('div', { class: 'pron-main' }, fig(mouthFigure(def.id, { anim: !reducedMotion() }), 'mouth'), h('div', { class: 'pron-side' }, h('div', { class: 'pron-cards n' + task.items.length }, cards), tip, rec.el)));
    } else { // fun
      const ex = EXERCISES[task.ex];
      stageEl.append(h('div', { class: 'pron-main' }, fig(exerciseSvg(ex.anim), 'big ex'), h('div', { class: 'pron-side' }, h('p', { class: 'pron-ex' }, ex.text), tip, h('p', { class: 'pron-note' }, 'Ćwicz spokojnie. Gdy poczujesz zmęczenie, zrób przerwę.'))));
    }
    cleanup = () => { rec?.dispose(); window.removeEventListener('pagehide', cleanup); };
    window.addEventListener('pagehide', cleanup);
    setTimeout(() => narrator.speak(task.say), 300);
  }

  function showDone() {
    cleanup(); narrator.cancel(); clear(box);
    const rating = P.levelRating(state, level);
    const next = PRON_LEVELS[level.num];
    const stars = h('div', { class: 'bigstars', role: 'img', 'aria-label': `${rating} z 3 gwiazdek` });
    for (let i = 1; i <= 3; i++) stars.append(h('span', { class: 'bstar' + (i <= rating ? ' on' : ''), style: `--i:${i}`, html: STAR }));
    box.append(h('div', { class: 'done-screen' }, ctx.topbar({ back: 'Głoski', onBack: onExit, title: level.title }),
      h('div', { class: 'card center' }, h('h2', {}, 'Ćwiczenie ukończone!'), stars, h('p', { class: 'muted' }, 'Ćwicz małymi krokami, kilka minut dziennie – to wystarczy.'),
        h('div', { class: 'btn-row' }, next ? h('button', { class: 'btn primary', type: 'button', onclick: () => onNext(next) }, `Dalej: ${next.title}`) : null, h('button', { class: 'btn', type: 'button', onclick: onExit }, 'Głoski')))));
    narrator.speak([nextFinish()]);
  }
  showTask();
}
