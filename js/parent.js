// Panel rodzica: bramka (zadanie rachunkowe), postępy, słabe miejsca, lektor, dane.
import { h, clear, soundLabel } from './core/ui.js';
import * as P from './core/progress.js';
import { SAY, audioId } from './core/say.js';
import { LEVELS } from '../modules/reading/curriculum.js';
import { MATH_LEVELS, TOPIC_NAMES } from '../modules/math/curriculum.js';
import { GAMES, GAME_IDS } from './games/phrases.js';
import { WORLDS } from './art/worlds.js';

const VOICE_HELP = [
  'Otwórz Ustawienia → Czas i język → Mowa.',
  'W sekcji „Zarządzaj głosami” (lub „Głosy”) kliknij „Dodaj głosy”.',
  'Wpisz „polski” i zaznacz „Polski (Polska)”, potem „Dodaj”. Poczekaj, aż głos się pobierze (to potrzebuje internetu tylko raz).',
  'Zamknij WSZYSTKIE okna przeglądarki i uruchom ją ponownie. W Edge lub Chrome pojawi się głos Microsoft Paulina lub Zofia.',
  'Domyślnie gra używa nagranego głosu i nie potrzebuje głosu systemowego. Głos systemowy to rezerwa: gra wybiera najlepszy polski głos (najpierw „Online (Natural)”, np. Microsoft Zofia, potem Paulina/Zofia lokalna). Głosy „Online” Edge pobiera sam z internetu – to robi przeglądarka, nie gra – i mogą być blokowane przez Family Safety.',
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
    const done = P.completedCount(state, LEVELS), mdone = P.completedCount(state, MATH_LEVELS);
    const maxStars = LEVELS.reduce((s, l) => s + 3 * l.tasks.length, 0), mMaxStars = MATH_LEVELS.reduce((s, l) => s + 3 * l.tasks.length, 0);
    const weakAll = P.weakItems(state, 200);
    const weak = weakAll.filter((w) => !/^[mt]:/.test(w.item)).slice(0, 10);
    const weakMath = weakAll.filter((w) => w.item.startsWith('t:') && TOPIC_NAMES[w.item.slice(2)]).slice(0, 6);
    const weakMathItems = weakAll.filter((w) => /^m:\d+[+-]\d+$/.test(w.item)).slice(0, 5);
    const speedRadio = (value, text, hint) => {
      const input = h('input', { type: 'radio', name: 'game-speed', value, id: 'gspeed-' + value }); input.checked = state.gameSpeed === value;
      input.addEventListener('change', () => { if (input.checked) { state.gameSpeed = value; ctx.save(); } });
      return h('label', { class: 'row' }, input, ' ', h('b', {}, text), h('span', { class: 'muted' }, ' ' + hint));
    };
    const gameRows = ['reading', 'math'].flatMap((subj) => GAME_IDS.map((id) => { const g = P.gameInfo(state, subj, id); return h('tr', {}, h('td', {}, subj === 'math' ? 'Matematyka' : 'Czytanie'), h('td', {}, subj === 'math' ? GAMES[id].mathTitle : GAMES[id].title), h('td', {}, g.stars ? '★'.repeat(g.stars) + '☆'.repeat(3 - g.stars) : '–'), h('td', {}, `${g.plays}`)); }));
    const clipsTxt = narrator.hasClips ? `Nagrany głos jest dostępny (${narrator.manifest.size} nagrań, działa bez internetu).` : 'Brak plików z nagraniami – gra używa głosu systemowego.';
    const sysTxt = { ready: `Głos systemowy: ${narrator.voice?.name ?? ''}`, loading: 'Wyszukiwanie głosów systemowych…', none: 'Nie znaleziono polskiego głosu systemowego.', unsupported: 'Ta przeglądarka nie obsługuje syntezy mowy.' }[narrator.status];
    const statusTxt = `${clipsTxt} ${sysTxt}${!narrator.hasClips && ['none', 'unsupported'].includes(narrator.status) ? ' Dziecko widzi duży tekst zamiast mowy – zobacz instrukcję poniżej.' : ''}`;
    const statusCls = narrator.hasClips || narrator.status === 'ready' ? 'ready' : narrator.status;

    const slider = (id, label, min, max, key, fmt, onSet) => {
      const input = h('input', { type: 'range', min: String(min), max: String(max), step: '0.05', value: String(state[key]), id, 'aria-label': label });
      const out = h('output', { for: id }, fmt(state[key]));
      input.addEventListener('input', () => { state[key] = Number(input.value); onSet(); out.textContent = fmt(state[key]); ctx.save(); });
      input.addEventListener('change', () => narrator.speak(['Tak brzmi lektor w tym tempie.'], { force: true }));
      return h('label', { class: 'row' }, label + ': ', input, ' ', out);
    };
    const speed = slider('speed', 'Tempo', 0.7, 1.3, 'speed', (v) => `${Math.round(v * 100)}%`, () => { narrator.speed = state.speed; });
    const volume = slider('volume', 'Głośność', 0.2, 1, 'volume', (v) => `${Math.round(v * 100)}%`, () => { narrator.volume = state.volume; });
    const radio = (value, text, hint) => {
      const input = h('input', { type: 'radio', name: 'voice-mode', value, id: 'mode-' + value });
      input.checked = state.voiceMode === value;
      input.addEventListener('change', () => { if (!input.checked) return; state.voiceMode = value; narrator.mode = value; ctx.save(); narrator.speak(['Cześć Piotrku! Zaczynamy czytać.'], { force: true }); });
      return h('label', { class: 'row' }, input, ' ', h('b', {}, text), h('span', { class: 'muted' }, ' ' + hint));
    };
    const onoff = h('input', { type: 'checkbox', id: 'narr-on', checked: state.narrator ? '' : null });
    onoff.checked = state.narrator;
    onoff.addEventListener('change', () => { state.narrator = onoff.checked; narrator.enabled = state.narrator; ctx.save(); ctx.refreshControls(); });
    const sel = h('select', { id: 'voice-sel', 'aria-label': 'Głos systemowy' }, h('option', { value: '' }, 'Automatycznie (najlepszy polski głos)'), narrator.plVoices.map((v) => h('option', { value: v.voiceURI }, `${v.name}${/natural/i.test(v.name) ? ' ★' : ''}${v.localService ? '' : ' (online)'}`)));
    sel.value = state.voiceURI ?? '';
    sel.addEventListener('change', () => { state.voiceURI = sel.value || null; narrator.setPreferred(state.voiceURI); ctx.save(); narrator.speak(['Cześć Piotrku! Zaczynamy czytać.'], { mode: 'system', force: true }); });
    const unlock = h('input', { type: 'checkbox', id: 'unlock-all' }); unlock.checked = state.unlockAll;
    unlock.addEventListener('change', () => { state.unlockAll = unlock.checked; ctx.save(); });

    const play = (k, mode) => narrator.speak(['#' + k], { mode, force: true });
    const soundRows = Object.entries(SAY).map(([k, v]) => h('tr', {}, h('td', {}, soundLabel(k)), h('td', { class: 'muted' }, v),
      h('td', {}, h('button', { class: 'btn small', type: 'button', 'data-play': k, disabled: narrator.manifest.has(audioId('#' + k)) ? null : '', onclick: () => play(k, 'recorded') }, 'Nagranie'),
        ' ', h('button', { class: 'btn small ghost', type: 'button', disabled: narrator.status === 'ready' ? null : '', onclick: () => play(k, 'system') }, 'Głos systemowy'))));
    const playAll = h('button', { class: 'btn', type: 'button', id: 'play-all-sounds', onclick: async () => {
      for (const k of Object.keys(SAY)) { await narrator.speak(['#' + k], { mode: 'recorded', force: true }); await new Promise((r) => setTimeout(r, 250)); }
    } }, 'Odtwórz wszystkie nagrane głoski');

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
      h('section', { class: 'card', id: 'math-progress' }, h('h2', {}, 'Matematyka'),
        h('p', {}, `Ukończone poziomy: ${mdone} z ${MATH_LEVELS.length}. Gwiazdki: ${P.totalStars(state, MATH_LEVELS)} z ${mMaxStars}.`),
        h('div', { class: 'lvl-table' }, MATH_LEVELS.map((l) => h('span', { class: 'lvl-chip' + (P.isLevelDone(state, l) ? ' ok' : '') }, `${l.num}. ${l.title}${l.optional ? ' (dodatkowy)' : ''}: `, P.isLevelDone(state, l) ? '★'.repeat(P.levelRating(state, l)) : `${P.tasksDone(state, l)}/${l.tasks.length}`))),
        h('h3', {}, 'Do powtórzenia w matematyce'),
        weakMath.length ? h('ul', { id: 'math-weak' }, weakMath.map((w) => h('li', {}, `${TOPIC_NAMES[w.item.slice(2)]} – ${w.misses} pomyłek, ${w.hits} trafień`)), weakMathItems.map((w) => h('li', { class: 'muted' }, `działanie ${w.item.slice(2).replace('-', ' − ').replace('+', ' + ')} – ${w.misses} pomyłek`))) : h('p', { class: 'muted' }, 'Na razie brak danych z matematyki.')),
      h('section', { class: 'card', id: 'pron-note' }, h('h2', {}, 'Ćwiczenia wymowy'),
        h('p', {}, 'Moduł „Ćwiczenia wymowy” to zabawa w ćwiczenie trudnych głosek (r, sz, cz, ż/rz, dż, c, dz, ś, ć, ź, dź): słuchanie wzoru lektora, sylaby, słowa, zdania oraz ćwiczenia oddechu, języka i ust. To zabawa, a nie terapia.'),
        h('p', {}, 'Jeśli dziecko ma stałą trudność z wymową, warto skonsultować się z logopedą – gra tego nie zastąpi i niczego nie diagnozuje. Gra nie ocenia wymowy automatycznie: dziecko albo Ty wybieracie „Powtórz” lub „Super!”.'),
        h('p', { class: 'muted' }, 'Mikrofon (przycisk „Nagraj siebie”) działa wyłącznie lokalnie: przeglądarka zawsze pyta o zgodę, nagranie trwa do 8 sekund, jest trzymane tylko w pamięci i znika po wyjściu z ekranu. Nic nie jest wysyłane ani zapisywane. Zgodę możesz w każdej chwili cofnąć w ustawieniach przeglądarki.')),
      h('section', { class: 'card', id: 'avatar-choice' }, h('h2', {}, 'Awatar lektora'), h('p', { class: 'muted' }, 'Mała postać przy zadaniu: porusza się, gdy lektor mówi, cieszy się po dobrej odpowiedzi i myśli po pomyłce.'),
        (() => { const input = h('input', { type: 'checkbox', id: 'avatar-on' }); input.checked = state.avatar !== false; input.addEventListener('change', () => { state.avatar = input.checked; ctx.save(); document.documentElement.dataset.avatar = state.avatar ? 'on' : 'off'; }); return h('label', { class: 'row' }, input, ' ', h('b', {}, 'Pokazuj awatara lektora')); })()),
      ctx.kids?.length ? h('section', { class: 'card', id: 'guide-choice' }, h('h2', {}, 'Bohater gry'), h('p', { class: 'muted' }, 'Postać, która prowadzi dziecko przez grę (domyślnie Piotr). Dziecko też może ją zmienić przyciskiem „Mój bohater” na ekranie startowym.'),
        h('div', { role: 'radiogroup', 'aria-label': 'Bohater gry' }, ctx.kids.map((k) => { const input = h('input', { type: 'radio', name: 'guide', value: k.id, id: 'guide-' + k.id }); input.checked = ctx.kid()?.id === k.id;
          input.addEventListener('change', () => { if (input.checked) { state.guide = k.id; ctx.save(); } }); return h('label', { class: 'row' }, input, ' ', h('b', {}, k.name)); }))) : null,
      h('section', { class: 'card', id: 'games-progress' }, h('h2', {}, 'Zabawy'),
        h('p', { class: 'muted' }, 'Zabawy zręcznościowe nie mają czasu ani porażek. Odblokowują się po trzech ukończonych poziomach, a co cztery poziomy czeka zabawa bonusowa. Treść zabaw wynika z tego, czego dziecko już się nauczyło.'),
        h('div', { class: 'game-speed', role: 'radiogroup', 'aria-label': 'Tempo zabaw' }, speedRadio('slow', 'Wolno (zalecane)', '– elementy poruszają się powoli.'), speedRadio('normal', 'Normalnie', '– około dwa razy szybciej.')),
        h('table', { class: 'say-table game-table' }, h('thead', {}, h('tr', {}, ['Przedmiot', 'Zabawa', 'Najlepszy wynik', 'Rundy'].map((x) => h('th', {}, x)))), h('tbody', {}, gameRows))),
      h('section', { class: 'card' }, h('h2', {}, 'Do powtórzenia w czytaniu'),
        weak.length ? h('ul', {}, weak.map((w) => h('li', {}, `„${w.item}” – ${w.misses} ${w.misses === 1 ? 'pomyłka' : 'pomyłki/pomyłek'}, ${w.hits} trafień`))) : h('p', { class: 'muted' }, 'Na razie brak danych. Pojawią się, gdy Piotrek będzie ćwiczył.')),
      h('section', { class: 'card' }, h('h2', {}, 'Lektor (głos)'),
        h('p', { class: 'status ' + statusCls }, statusTxt),
        h('label', { class: 'row' }, onoff, ' Lektor włączony'),
        h('div', { class: 'voice-mode', role: 'radiogroup', 'aria-label': 'Rodzaj głosu' },
          radio('recorded', 'Nagrany głos (zalecany)', '– ten sam miły, kobiecy głos na każdym komputerze, działa bez internetu.'),
          radio('system', 'Głos systemowy', '– głos z Windows/przeglądarki (jakość zależy od komputera).')),
        speed, volume,
        h('p', { class: 'muted', id: 'voice-credit' }, 'Głos syntetyczny (Microsoft Azure Neural TTS) – nagrania wygenerowane komputerowo, to nie jest głos człowieka.'),
        h('label', { class: 'row' }, 'Głos systemowy: ', sel),
        h('div', { class: 'btn-row' }, h('button', { class: 'btn', type: 'button', onclick: () => narrator.speak(['Cześć Piotrku! Zaczynamy czytać.'], { force: true }) }, 'Wypróbuj głos')),
        h('details', {}, h('summary', {}, 'Jak zainstalować polski głos w Windows 11 (dla głosu systemowego)'), h('ol', {}, VOICE_HELP.map((t) => h('li', {}, t)))),
        h('details', {}, h('summary', {}, 'Test głosek'), h('p', { class: 'muted' }, 'Odtwarza nagrane głoski (spółgłoski ciągłe jak „mmm”, „sss” są wydłużone). Przycisk „Głos systemowy” pokazuje, jak czyta je syntezator przeglądarki (tabela wymowy w js/core/say.js).'), h('div', { class: 'btn-row' }, playAll), h('table', { class: 'say-table' }, h('tbody', {}, soundRows)))),
      h('section', { class: 'card' }, h('h2', {}, 'Dane'),
        h('p', { class: 'muted' }, 'Postępy są zapisane tylko w tej przeglądarce (localStorage). Nic nie jest wysyłane do internetu.'),
        h('div', { class: 'btn-row' }, exportBtn, resetBtn))));
  }
}
