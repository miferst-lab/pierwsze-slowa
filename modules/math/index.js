// Moduł "Matematyka" – na razie miejsce na przyszłość (ten sam interfejs co "Nauka czytania").
// Aby dodać matematykę: zrób tu curriculum.js (poziomy z zadaniami), użyj wspólnych narzędzi
// z js/core (narrator, progress, ui) i ustaw `available: true`. Reszta aplikacji się nie zmienia.
import { h, clear } from '../../js/core/ui.js';

export default {
  id: 'math',
  title: 'Matematyka',
  tagline: 'Liczenie i dodawanie',
  available: false,
  icon: `<svg viewBox='0 0 100 100' aria-hidden='true'><rect x='8' y='14' width='84' height='72' rx='14' fill='#fff' stroke='#334' stroke-width='4'/><text x='50' y='64' font-size='34' font-weight='800' text-anchor='middle' fill='#2f6fd0' font-family='Verdana,sans-serif'>1+2</text></svg>`,
  mount(ctx, box, { exit }) {
    clear(box);
    ctx.onWorld = () => this.mount(ctx, box, { exit });
    const m = ctx.mascot(0);
    box.append(h('div', { class: 'scroll-screen' }, ctx.topbar({ back: 'Menu', onBack: exit, title: 'Matematyka' }),
      h('div', { class: 'card center soon' }, h('div', { class: 'mascot big', 'data-mascot': 0, html: m.svg, 'aria-hidden': 'true' }),
        h('h2', {}, 'Wkrótce!'), h('p', { class: 'lead' }, `${m.name} jeszcze przygotowuje zadania z liczeniem. Na razie poćwicz czytanie.`),
        h('button', { class: 'btn primary', type: 'button', onclick: exit }, 'Wróć do menu'))));
  },
};
