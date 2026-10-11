// Moduł "Nauka czytania": mapa poziomów + uruchamianie zadań.
import { h, clear, STAR } from '../../js/core/ui.js';
import * as P from '../../js/core/progress.js';
import { LEVELS, GROUPS } from './curriculum.js';
import { runLevel } from './runner.js';
import { gamesSection, startBonus } from '../../js/games/map.js';

export default {
  id: 'reading',
  title: 'Nauka czytania',
  tagline: 'Litery, sylaby, słowa i zdania',
  available: true,
  icon: `<svg viewBox='0 0 100 100' aria-hidden='true'><path d='M8 22q22-6 42 6v58Q30 74 8 80z' fill='#fff' stroke='#334' stroke-width='4' stroke-linejoin='round'/><path d='M92 22Q70 16 50 28v58q20-12 42-6z' fill='#fff7d6' stroke='#334' stroke-width='4' stroke-linejoin='round'/><text x='29' y='62' font-size='28' font-weight='800' text-anchor='middle' fill='#e0533d' font-family='Verdana,sans-serif'>A</text><text x='71' y='60' font-size='22' font-weight='800' text-anchor='middle' fill='#2f6fd0' font-family='Verdana,sans-serif'>ma</text></svg>`,
  mount(ctx, box, { exit }) {
    const showMap = () => {
      ctx.onWorld = null;
      clear(box);
      const wrap = h('div', { class: 'scroll-screen' });
      wrap.append(ctx.topbar({ back: 'Menu', onBack: exit, title: 'Nauka czytania' }));
      const done = P.completedCount(ctx.state, LEVELS);
      wrap.append(h('p', { class: 'lead on-bg' }, `Ukończone poziomy: ${done} z ${LEVELS.length}. Wybierz poziom i zacznij!`));
      for (const [g, gname] of Object.entries(GROUPS)) {
        const levels = LEVELS.filter((l) => l.group === g);
        const row = h('div', { class: 'tiles-grid' });
        for (const l of levels) {
          const i = l.num - 1;
          const unlocked = P.isUnlocked(ctx.state, LEVELS, i);
          const rating = P.levelRating(ctx.state, l);
          const d = P.tasksDone(ctx.state, l);
          const tile = h('button', { class: 'tile-level' + (unlocked ? '' : ' locked') + (rating ? ' done' : ''), type: 'button', 'data-level': l.id, 'aria-disabled': unlocked ? null : 'true', 'aria-label': `Poziom ${l.num}: ${l.title}. ${unlocked ? `Ukończone zadania: ${d} z ${l.tasks.length}` : 'Zablokowany'}` },
            h('span', { class: 'lnum' }, l.num),
            h('span', { class: 'ltitle' }, l.title),
            h('span', { class: 'lprev' }, unlocked ? l.preview : 'Zablokowany'),
            h('span', { class: 'lstars', 'aria-hidden': 'true' }, [1, 2, 3].map((n) => h('span', { class: 'ms' + (n <= rating ? ' on' : ''), html: STAR }))),
            h('span', { class: 'lbar', 'aria-hidden': 'true' }, h('span', { style: `width:${(100 * d) / l.tasks.length}%` })));
          tile.addEventListener('click', () => {
            if (!unlocked) { ctx.toast('Najpierw ukończ poprzedni poziom.'); return; }
            start(l);
          });
          row.append(tile);
        }
        wrap.append(h('section', { class: 'group' }, h('h2', { class: 'on-bg' }, gname), row));
      }
      wrap.append(gamesSection(ctx, 'reading', LEVELS, showMap, box));
      box.append(wrap);
    };
    const start = (level) => {
      ctx.onWorld = null;
      runLevel(ctx, box, level, { onExit: showMap, onNext: start, onBonus: (l) => startBonus(ctx, box, 'reading', l, showMap) });
    };
    showMap();
  },
};
