// Moduł „Ćwiczenia wymowy”: mapa głosglobalnie odblokowana (dziecko wybiera głoskę), kroki z gwiazdkami, wznawianie.
import { h, clear, STAR } from '../../js/core/ui.js';
import * as P from '../../js/core/progress.js';
import { PRON_LEVELS, GROUPS, R_NOTE, recommendedLevel } from './curriculum.js';
import { runPronLevel } from './runner.js';

export default {
  id: 'pron',
  title: 'Ćwiczenia wymowy',
  tagline: 'Trudne głoski: r, sz, cz i inne',
  available: true,
  // ikony od Artysty (dwa warianty, zmieniane co sesję gry); iconSrc = jedna stała ikona; brak obu = rysunek SVG poniżej
  icons: { a: 'art/icons/pron-a.webp', b: 'art/icons/pron-b.webp' },
  iconSrc: null,
  icon: `<svg viewBox='0 0 100 100' aria-hidden='true'><circle cx='50' cy='50' r='40' fill='#fff' stroke='currentColor' stroke-width='4'/><path d='M30 56 Q50 80 70 56' fill='#c43c55' stroke='#8a2a3c' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/><path d='M40 60 Q50 46 60 60 Z' fill='#ff7b8f'/><circle cx='36' cy='38' r='5' fill='#334'/><circle cx='64' cy='38' r='5' fill='#334'/></svg>`,
  mount(ctx, box, { exit, resumeLevel }) {
    const showMap = () => {
      ctx.onWorld = null; clear(box);
      const wrap = h('div', { class: 'scroll-screen' });
      wrap.append(ctx.topbar({ back: 'Menu', onBack: exit, title: 'Ćwiczenia wymowy' }));
      const done = P.completedCount(ctx.state, PRON_LEVELS);
      wrap.append(h('p', { class: 'lead on-bg' }, `Ukończone głoski: ${done} z ${PRON_LEVELS.length}. Kolejność jak u logopedów: najpierw ciszące, potem syczące, szumiące, a R na końcu. Każdą głoskę można otworzyć.`));
      const rec = recommendedLevel((l) => P.levelRating(ctx.state, l) > 0 || ctx.state.levels[l.id]?.done);
      for (const [g, gname] of Object.entries(GROUPS)) {
        const row = h('div', { class: 'tiles-grid' });
        for (const l of PRON_LEVELS.filter((x) => x.group === g)) {
          const rating = P.levelRating(ctx.state, l), d = P.tasksDone(ctx.state, l);
          const tile = h('button', { class: 'tile-level' + (rating ? ' done' : '') + (rec === l ? ' recommended' : ''), 'aria-current': rec === l ? 'step' : null, type: 'button', 'data-level': l.id, 'aria-label': `${l.title}${rec === l ? ' (polecana teraz)' : ''}. Ukończone kroki: ${d} z ${l.tasks.length}` },
            rec === l ? h('span', { class: 'lrec' }, 'Polecana teraz') : null,
            h('span', { class: 'lnum' }, l.num), h('span', { class: 'ltitle' }, l.title), h('span', { class: 'lprev' }, l.preview),
            h('span', { class: 'lstars', 'aria-hidden': 'true' }, [1, 2, 3].map((n) => h('span', { class: 'ms' + (n <= rating ? ' on' : ''), html: STAR }))),
            h('span', { class: 'lbar', 'aria-hidden': 'true' }, h('span', { style: `width:${(100 * d) / l.tasks.length}%` })));
          tile.addEventListener('click', () => start(l));
          row.append(tile);
        }
        wrap.append(h('section', { class: 'group', 'data-group': g }, h('h2', { class: 'on-bg' }, gname), g === 'r' ? h('p', { class: 'muted on-bg r-note' }, R_NOTE) : null, row));
      }
      wrap.append(h('p', { class: 'muted on-bg pron-disclaimer' }, 'To zabawa w ćwiczenie, a nie terapia. Przy trudnościach z mową warto skonsultować się z logopedą.'));
      box.append(wrap);
    };
    const start = (level) => { ctx.onWorld = null; runPronLevel(ctx, box, level, { onExit: showMap, onNext: start }); };
    if (resumeLevel) start(resumeLevel); else showMap();
  },
};
