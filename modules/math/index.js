// Moduł „Matematyka”: mapa poziomów (ten sam interfejs co „Nauka czytania”), zabawy i uruchamianie zadań.
import { h, clear, STAR } from '../../js/core/ui.js';
import * as P from '../../js/core/progress.js';
import { MATH_LEVELS, MATH_GROUPS } from './curriculum.js';
import { runMathLevel } from './runner.js';
import { gamesSection, startBonus } from '../../js/games/map.js';

export default {
  id: 'math',
  title: 'Matematyka',
  tagline: 'Liczenie, dodawanie, figury i zabawy',
  available: true,
  icon: `<svg viewBox='0 0 100 100' aria-hidden='true'><rect x='8' y='14' width='84' height='72' rx='18' fill='#fff' stroke='currentColor' stroke-width='4'/><text x='50' y='64' font-size='34' font-weight='800' text-anchor='middle' fill='#2f6fd0' font-family='Nunito,Segoe UI,Verdana,sans-serif'>1+2</text></svg>`,
  mount(ctx, box, { exit }) {
    const showMap = () => {
      ctx.onWorld = null; clear(box);
      const wrap = h('div', { class: 'scroll-screen' });
      wrap.append(ctx.topbar({ back: 'Menu', onBack: exit, title: 'Matematyka' }));
      const done = P.completedCount(ctx.state, MATH_LEVELS);
      wrap.append(h('p', { class: 'lead on-bg' }, `Ukończone poziomy: ${done} z ${MATH_LEVELS.length}. Wybierz poziom i licz!`));
      for (const [g, gname] of Object.entries(MATH_GROUPS)) {
        const row = h('div', { class: 'tiles-grid' });
        for (const l of MATH_LEVELS.filter((x) => x.group === g)) {
          const unlocked = P.isUnlocked(ctx.state, MATH_LEVELS, l.num - 1), rating = P.levelRating(ctx.state, l), d = P.tasksDone(ctx.state, l);
          const tile = h('button', { class: 'tile-level' + (unlocked ? '' : ' locked') + (rating ? ' done' : ''), type: 'button', 'data-level': l.id, 'aria-disabled': unlocked ? null : 'true', 'aria-label': `Poziom ${l.num}: ${l.title}. ${unlocked ? `Ukończone zadania: ${d} z ${l.tasks.length}` : 'Zablokowany'}` },
            h('span', { class: 'lnum' }, l.num), h('span', { class: 'ltitle' }, l.title), h('span', { class: 'lprev' }, unlocked ? l.preview : 'Zablokowany'),
            h('span', { class: 'lstars', 'aria-hidden': 'true' }, [1, 2, 3].map((n) => h('span', { class: 'ms' + (n <= rating ? ' on' : ''), html: STAR }))),
            h('span', { class: 'lbar', 'aria-hidden': 'true' }, h('span', { style: `width:${(100 * d) / l.tasks.length}%` })));
          tile.addEventListener('click', () => { if (!unlocked) { ctx.toast('Najpierw ukończ poprzedni poziom.'); return; } start(l); });
          row.append(tile);
        }
        wrap.append(h('section', { class: 'group' }, h('h2', { class: 'on-bg' }, gname), row));
      }
      wrap.append(gamesSection(ctx, 'math', MATH_LEVELS, showMap, box));
      box.append(wrap);
    };
    const start = (level) => { ctx.onWorld = null; runMathLevel(ctx, box, level, { onExit: showMap, onNext: start, onBonus: (l) => startBonus(ctx, box, 'math', l, showMap) }); };
    showMap();
  },
};
