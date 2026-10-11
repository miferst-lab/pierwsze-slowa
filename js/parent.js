// Panel rodzica: bramka (zadanie rachunkowe), postępy, słabe miejsca, lektor, dane.
import { h, clear, soundLabel } from './core/ui.js';
import * as P from './core/progress.js';
import { SAY } from './core/say.js';
import { LEVELS } from '../modules/reading/curriculum.js';
import { WORLDS } from './art/worlds.js';

const VOICE_HELP = [
  'Otwórz Ustawienia → Czas i język → Mowa.',
  'W sekcji „Zarządzaj głosami” (lub „Głosy”) kliknij „Dodaj głosy”.',
  'Wpisz „polski” i zaznacz „Polski (Polska)”, potem „Dodaj”. Poczekaj, aż głos się pobierze (to potrzebuje internetu tylko raz).',
  'Zamknij WSZYSTKIE okna przeglądarki i uruchom ją ponownie. W Edge lub Chrome pojawi się głos Microsoft Paulina lub Zofia.',
  'Aplikacja używa głosów lokalnych (działają bez internetu). Głosy „Online (Natural)” w Edge wymagają połączenia i mogą być blokowane przez Family Safety – nie są potrzebne.',
];

export function showParent(ctx, box) {
  ctx.onWorld = null;
  clear(box);
  const a = 6 + Math.floor(Math.random() * 4), b = 6 + Math.floor(Math.random() * 4);
  const input = h('input', { id: 'gate-in', type: 'number', inputmode: 'numeric', 'aria-label': 'Wynik', autocomplete: 'off' });
  const msg = h('p', { class: 'muted', 'aria-live': 'polite' }, '');
  const tryGate = () => { if (Number(input.value) === a + b) dashboard(); else { msg.textContent = 'To nie jest dobry wynik. Spróbuj jeszcze raz.'; input.value = ''; input.focus(); } };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryGate(); });
  box.append(h('div', { class: 'scroll-screen' }, ctx.topbar({ back: 'Menu', onBack: () => ctx.go('start'), title: 'Dla rodzica' }),
    h('div', { class: 'card center gate' }, h('h2', {}, 'Tylko dla dorosłych'), h('p', { class: 'lead' }, `Aby wejść, policz: ${a} + ${b} = ?`), input,
      h('div', { class: 'btn-row' }, h('button', { class: 'btn primary', type: 'button', onclick: tryGate }, 'Wejdź')), msg)));
  input.focus();

  function dashboard() {
    clear(box);
    const { state, narrator } = ctx;
    const done = P.completedCount(state, LEVELS);
    const maxStars = LEVELS.reduce((s, l) => s + 3 * l.tasks.length, 0);
    const weak = P.weakItems(state, 10);
    const statusTxt = { ready: `Znaleziono polski głos: ${narrator.voice?.name ?? ''}`, loading: 'Wyszukiwanie głosów…', none: 'Nie znaleziono polskiego głosu – dziecko widzi duży tekst zamiast mowy. Zobacz instrukcję poniżej.', unsupported: 'Ta przeglądarka nie obsługuje syntezy mowy. Użyj Edge lub Chrome.' }[narrator.status];

    const rate = h('input', { type: 'range', min: '0.5', max: '1.1', step: '0.05', value: state.rate, id: 'rate', 'aria-label': 'Tempo lektora' });
    const rateOut = h('output', { for: 'rate' }, state.rate.toFixed(2));
    rate.addEventListener('input', () => { state.rate = Number(rate.value); narrator.rate = state.rate; rateOut.textContent = state.rate.toFixed(2); ctx.save(); });
    rate.addEventListener('change', () => narrator.speak(['Tak brzmi lektor w tym tempie.']));
    const onoff = h('input', { type: 'checkbox', id: 'narr-on', checked: state.narrator ? '' : null });
    onoff.checked = state.narrator;
    onoff.addEventListener('change', () => { state.narrator = onoff.checked; narrator.enabled = state.narrator; ctx.save(); ctx.refreshControls(); });
    const sel = h('select', { id: 'voice-sel', 'aria-label': 'Głos' }, h('option', { value: '' }, 'Automatycznie (zalecane)'), narrator.plVoices.map((v) => h('option', { value: v.voiceURI }, `${v.name}${v.localService ? '' : ' (online)'}`)));
    sel.value = state.voiceURI ?? '';
    sel.addEventListener('change', () => { state.voiceURI = sel.value || null; narrator.setPreferred(state.voiceURI); ctx.save(); });
    const unlock = h('input', { type: 'checkbox', id: 'unlock-all' }); unlock.checked = state.unlockAll;
    unlock.addEventListener('change', () => { state.unlockAll = unlock.checked; ctx.save(); });

    const soundRows = Object.entries(SAY).map(([k, v]) => h('tr', {}, h('td', {}, soundLabel(k)), h('td', {}, v), h('td', {}, h('button', { class: 'btn small', type: 'button', onclick: () => narrator.speak(['#' + k]) }, 'Odtwórz'))));

    let resetArmed = false;
    const resetBtn = h('button', { class: 'btn danger', type: 'button' }, 'Zresetuj postępy');
    resetBtn.addEventListener('click', () => {
      if (!resetArmed) { resetArmed = true; resetBtn.textContent = 'Na pewno? Dotknij jeszcze raz'; setTimeout(() => { resetArmed = false; resetBtn.textContent = 'Zresetuj postępy'; }, 5000); return; }
      ctx.resetAll(); showParent(ctx, box);
    });
    const exportBtn = h('button', { class: 'btn', type: 'button', onclick: () => {
      const blob = new Blob([P.exportJSON(state)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = h('a', { href: url, download: 'pierwsze-slowa-postepy.json' }); document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } }, 'Pobierz postępy (plik)');

    box.append(h('div', { class: 'scroll-screen parent' }, ctx.topbar({ back: 'Menu', onBack: () => ctx.go('start'), title: 'Dla rodzica' }),
      h('section', { class: 'card' }, h('h2', {}, 'Postępy'),
        h('p', {}, `Ukończone poziomy: ${done} z ${LEVELS.length}. Gwiazdki: ${P.totalStars(state, LEVELS)} z ${maxStars}. Wybrany świat: ${WORLDS[state.world]?.name}.`),
        h('div', { class: 'lvl-table' }, LEVELS.map((l) => h('span', { class: 'lvl-chip' + (P.isLevelDone(state, l) ? ' ok' : '') }, `${l.num}. ${l.title}: `, P.isLevelDone(state, l) ? '★'.repeat(P.levelRating(state, l)) : `${P.tasksDone(state, l)}/${l.tasks.length}`))),
        h('label', { class: 'row' }, unlock, ' Odblokuj wszystkie poziomy (np. do sprawdzenia)')),
      h('section', { class: 'card' }, h('h2', {}, 'Do powtórzenia'),
        weak.length ? h('ul', {}, weak.map((w) => h('li', {}, `„${w.item}” – ${w.misses} ${w.misses === 1 ? 'pomyłka' : 'pomyłki/pomyłek'}, ${w.hits} trafień`))) : h('p', { class: 'muted' }, 'Na razie brak danych. Pojawią się, gdy Piotrek będzie ćwiczył.')),
      h('section', { class: 'card' }, h('h2', {}, 'Lektor (głos)'),
        h('p', { class: 'status ' + narrator.status }, statusTxt),
        h('label', { class: 'row' }, onoff, ' Lektor włączony'),
        h('label', { class: 'row' }, 'Tempo: ', rate, ' ', rateOut, h('span', { class: 'muted' }, ' (0,8 = spokojnie, dla dzieci)')),
        h('label', { class: 'row' }, 'Głos: ', sel),
        h('div', { class: 'btn-row' }, h('button', { class: 'btn', type: 'button', onclick: () => narrator.speak(['Cześć Piotrku! Zaczynamy czytać.']) }, 'Wypróbuj głos')),
        h('details', {}, h('summary', {}, 'Jak zainstalować polski głos w Windows 11'), h('ol', {}, VOICE_HELP.map((t) => h('li', {}, t)))),
        h('details', {}, h('summary', {}, 'Test głosek (tabela wymowy)'), h('p', { class: 'muted' }, 'Lektor czyta pojedynczą literę jej nazwą („em”), więc głoski mają własne nośniki. Jeśli któraś brzmi źle, popraw ją w pliku js/core/say.js.'), h('table', { class: 'say-table' }, h('tbody', {}, soundRows)))),
      h('section', { class: 'card' }, h('h2', {}, 'Dane'),
        h('p', { class: 'muted' }, 'Postępy są zapisane tylko w tej przeglądarce (localStorage). Nic nie jest wysyłane do internetu.'),
        h('div', { class: 'btn-row' }, exportBtn, resetBtn))));
  }
}
