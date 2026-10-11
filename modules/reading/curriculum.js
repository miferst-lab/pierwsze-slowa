// PROGRAM NAUKI CZYTANIA jako dane. Poziomy są budowane z krótkich specyfikacji poniżej,
// ale wynik (LEVELS) to zwykła tablica obiektów (JSON-owalna) – patrz README "Jak dodać poziom".
// Typy zadań: hear, initial, hearPic, pick, build, readtap, sentpic, story.

export const GROUPS = {
  sounds: 'Dźwięki', syllables: 'Sylaby', words: 'Słowa', sentences: 'Zdania', stories: 'Czytanki',
};

/** Głoska -> klucz ilustracji słowa zaczynającego się tą głoską (do zadań "który obrazek zaczyna się na…"). */
export const INITIAL = { m: 'mama', t: 'tata', l: 'lala', k: 'kot', d: 'dom', s: 'sok', o: 'osa', b: 'balon', n: 'noga', w: 'woda', r: 'ryba', j: 'jajo', 'ż': 'zaba', sz: 'szafa', cz: 'czapka', ch: 'chata' };

/** Słowa: jednostki do układania (sylaby albo – dla słów jednosylabowych – litery/dwuznaki) i ilustracja. */
export const WORDS = {
  mama: { units: ['ma', 'ma'], art: 'mama' }, tata: { units: ['ta', 'ta'], art: 'tata' }, lala: { units: ['la', 'la'], art: 'lala' },
  kot: { units: ['k', 'o', 't'], art: 'kot' }, dom: { units: ['d', 'o', 'm'], art: 'dom' }, las: { units: ['l', 'a', 's'], art: 'las' },
  lis: { units: ['l', 'i', 's'], art: 'lis' }, sok: { units: ['s', 'o', 'k'], art: 'sok' }, osa: { units: ['o', 'sa'], art: 'osa' },
  lody: { units: ['lo', 'dy'], art: 'lody' }, mak: { units: ['m', 'a', 'k'], art: 'mak' },
  sowa: { units: ['so', 'wa'], art: 'sowa' }, kura: { units: ['ku', 'ra'], art: 'kura' }, woda: { units: ['wo', 'da'], art: 'woda' },
  ryba: { units: ['ry', 'ba'], art: 'ryba' }, buty: { units: ['bu', 'ty'], art: 'buty' }, balon: { units: ['ba', 'lon'], art: 'balon' },
  noga: { units: ['no', 'ga'], art: 'noga' }, jajo: { units: ['ja', 'jo'], art: 'jajo' },
  'żaba': { units: ['ża', 'ba'], art: 'zaba' }, mysz: { units: ['m', 'y', 'sz'], art: 'mysz' }, szafa: { units: ['sza', 'fa'], art: 'szafa' },
  czapka: { units: ['czap', 'ka'], art: 'czapka' }, chata: { units: ['cha', 'ta'], art: 'chata' }, 'koło': { units: ['ko', 'ło'], art: 'kolo' },
  ser: { units: ['s', 'e', 'r'], art: 'ser' }, rower: { units: ['ro', 'wer'], art: 'rower' },
};
const ART_OF = { ...Object.fromEntries(Object.entries(WORDS).map(([w, d]) => [w, d.art])), ryby: 'ryba', 'rybę': 'ryba' };

const VOWELS = ['a', 'o', 'u', 'e', 'i', 'y'];
const BAD_SYL = new Set(['ky', 'gy']);
const STORIES = {
  R1: { sentences: ['Mama ma kota.', 'Kot ma na imię Mruk.', 'Mruk lubi rybę.'], question: { text: 'Co lubi Mruk?', options: ['rybę', 'mak', 'ser'], answer: 'rybę' } },
  R2: { sentences: ['To jest las.', 'W lesie jest lis.', 'Lis ma buty.', 'Lis idzie do domu.'], question: { text: 'Kto jest w lesie?', options: ['lis', 'sowa', 'kura'], answer: 'lis' } },
  R3: { sentences: ['Tata ma rower.', 'Rower ma koła.', 'Tata jedzie do lasu.', 'Mama ma balon.'], question: { text: 'Co ma tata?', options: ['rower', 'balon', 'lody'], answer: 'rower' } },
  R4: { sentences: ['Żaba ma czapkę.', 'Czapka jest zielona.', 'Żaba lubi wodę.'], question: { text: 'Co ma żaba?', options: ['czapkę', 'szafę', 'ser'], answer: 'czapkę' } },
  R5: { sentences: ['Mysz ma ser.', 'Mysz chowa ser w szafie.', 'Kot nie ma sera.'], question: { text: 'Gdzie mysz chowa ser?', options: ['w szafie', 'w lesie', 'w wodzie'], answer: 'w szafie' } },
  R6: { sentences: ['Ola ma lody.', 'Lody są dobre.', 'Mama lubi lody.', 'Ola i mama jedzą lody.'], question: { text: 'Co ma Ola?', options: ['lody', 'ser', 'mak'], answer: 'lody' } },
};

const rot = (arr, start) => arr.map((_, i) => arr[(i + start) % arr.length]);
/** n elementów z puli, różnych od `not`, zaczynając od przesunięcia `off` (deterministycznie). */
const others = (pool, not, n, off = 0) => rot(pool.filter((x) => x !== not), off).slice(0, n);
const opts = (target, pool, off) => [target, ...others(pool, target, 2, off)];

let levelNo = 0;
const mk = (group, title, intro, tasks, preview = '') => {
  const id = 'L' + String(++levelNo).padStart(2, '0');
  return { id, num: levelNo, group, title, intro, preview, tasks: tasks.slice(0, 8).map((t, i) => ({ id: `${id}-${i + 1}`, ...t })) };
};

const learnedSounds = [];
function soundLevel(title, letters, intro) {
  const pool = [...learnedSounds, ...letters];
  const tasks = [];
  const hear = (L, off) => ({ type: 'hear', kind: 'sound', prompt: 'Posłuchaj i dotknij literę, którą słyszysz.', say: ['Posłuchaj.', '#' + L], options: opts(L, pool, off), answer: L });
  letters.forEach((L, i) => tasks.push(hear(L, i)));
  letters.forEach((L, i) => {
    if (INITIAL[L]) {
      const arts = Object.entries(INITIAL).filter(([k]) => k !== L && pool.includes(k)).map(([, v]) => v);
      const all = Object.entries(INITIAL).filter(([k]) => k !== L).map(([, v]) => v);
      const dis = [...new Set([...rot(arts, i), ...rot(all, i)])].slice(0, 2);
      tasks.push({ type: 'initial', kind: 'sound', prompt: 'Który obrazek zaczyna się od tego dźwięku?', say: ['Który obrazek zaczyna się od dźwięku', '#' + L], target: L, options: [INITIAL[L], ...dis], answer: INITIAL[L] });
    } else tasks.push(hear(L, i + 1));
  });
  learnedSounds.push(...letters);
  return mk('sounds', title, intro, tasks, letters.join(' '));
}

const learnedCons = [];
function sylLevel(title, cons, intro) {
  const vs = (c) => VOWELS.filter((v) => !BAD_SYL.has(c + v));
  const cpool = [...learnedCons, ...cons];
  const mkHearV = (c, v) => ({ type: 'hear', kind: 'syl', prompt: 'Posłuchaj i dotknij sylabę.', say: ['Posłuchaj.', c + v], options: opts(c + v, vs(c).map((x) => c + x), VOWELS.indexOf(v)), answer: c + v });
  const mkHearC = (c, v) => ({ type: 'hear', kind: 'syl', prompt: 'Posłuchaj i dotknij sylabę.', say: ['Posłuchaj.', c + v], options: [c + v, ...others(cpool.filter((x) => !BAD_SYL.has(x + v)), c, 2, cons.indexOf(c)).map((x) => x + v)], answer: c + v });
  const mkBuild = (c, v) => ({ type: 'build', kind: 'syl', unitKind: 'sound', prompt: 'Ułóż sylabę z liter.', say: ['Ułóż sylabę.'], units: [c, v], word: c + v });
  const C = (i) => cons[i % cons.length];
  const tasks = [
    mkHearV(C(0), 'a'), mkHearC(C(1), 'o'), mkBuild(C(0), 'e'), mkHearV(C(1), 'u'),
    mkHearC(C(2), 'i'), mkBuild(C(1), 'a'), mkHearV(C(2), 'y'), mkHearC(C(0), 'u'),
  ].map((t) => (t.options ? { ...t, options: [...new Set(t.options)] } : t));
  learnedCons.push(...cons);
  return mk('syllables', title, intro, tasks, cons.map((c) => c + 'a').join(' '));
}

const learnedWords = [];
function wordLevel(title, words, intro) {
  learnedWords.push(...words);
  const pool = [...learnedWords];
  const n = Math.min(8, Math.max(6, words.length));
  const tasks = [];
  for (let i = 0; i < n; i++) {
    const w = words[(i + Math.floor(i / 3)) % words.length];
    const def = WORDS[w];
    const type = ['build', 'pick', 'hearPic'][i % 3];
    if (type === 'build') tasks.push({ type, kind: 'word', unitKind: def.units.length >= 3 ? 'sound' : 'syl', prompt: def.units.length >= 3 ? 'Ułóż słowo z liter.' : 'Ułóż słowo z sylab.', say: [def.units.length >= 3 ? 'Ułóż słowo z liter.' : 'Ułóż słowo z sylab.'], units: def.units, word: w, art: def.art });
    else if (type === 'pick') tasks.push({ type, kind: 'word', prompt: 'Które słowo pasuje do obrazka?', say: ['Które słowo pasuje do obrazka?'], art: def.art, options: opts(w, pool, i), answer: w });
    else tasks.push({ type, kind: 'word', prompt: 'Posłuchaj i dotknij obrazek.', say: ['Posłuchaj.', w], options: opts(def.art, pool.map((x) => WORDS[x].art), i), answer: def.art, word: w });
  }
  return mk('words', title, intro, tasks, words.slice(0, 3).join(' · '));
}

function sentenceLevel(title, defs, intro) {
  const texts = defs.map((d) => d[0]);
  const sp = (i) => ({ type: 'sentpic', kind: 'sentence', prompt: 'Które zdanie pasuje do obrazka?', say: ['Które zdanie pasuje do obrazka?'], scene: defs[i][1], options: opts(texts[i], texts, i), answer: texts[i] });
  const rt = (i) => ({ type: 'readtap', kind: 'sentence', prompt: 'Dotykaj słów, a lektor je przeczyta.', say: ['Dotykaj słów.'], sentence: texts[i], scene: defs[i][1] });
  const order = [[sp, 0], [rt, 1], [sp, 2], [rt, 3], [sp, 1], [rt, 0], [sp, 3], [rt, 2]];
  return mk('sentences', title, intro, order.filter(([, i]) => i < defs.length).map(([f, i]) => f(i)), texts[0]);
}

function storyLevel(title, ids, intro) {
  const tasks = [];
  ids.forEach((id, k) => {
    const s = STORIES[id];
    tasks.push({ type: 'story', kind: 'story', prompt: 'Przeczytaj czytankę i odpowiedz na pytanie.', say: ['Przeczytaj czytankę, dotykając zdań. Potem odpowiedz na pytanie.'], sentences: s.sentences, question: s.question, answer: s.question.answer, options: s.question.options });
    if (k < ids.length - 1 || ids.length < 3) tasks.push({ type: 'readtap', kind: 'sentence', prompt: 'Dotykaj słów, a lektor je przeczyta.', say: ['Dotykaj słów.'], sentence: s.sentences[1] });
  });
  return mk('stories', title, intro, tasks, STORIES[ids[0]].sentences[0]);
}

export const LEVELS = [
  soundLevel('Samogłoski: A O E', ['a', 'o', 'e'], 'Pierwsze dźwięki. Słuchaj uważnie!'),
  soundLevel('Samogłoski: U I Y', ['u', 'i', 'y'], 'Jeszcze trzy samogłoski.'),
  soundLevel('Dźwięki M T L', ['m', 't', 'l'], 'Pierwsze spółgłoski.'),
  sylLevel('Sylaby: ma, ta, la…', ['m', 't', 'l'], 'Łączymy spółgłoskę z samogłoską.'),
  wordLevel('Pierwsze słowa', ['mama', 'tata', 'lala'], 'Z sylab robimy słowa!'),
  soundLevel('Dźwięki S K D', ['s', 'k', 'd'], 'Nowe dźwięki.'),
  sylLevel('Sylaby: sa, ko, du…', ['s', 'k', 'd'], 'Coraz więcej sylab.'),
  wordLevel('Słowa z S K D', ['kot', 'dom', 'las', 'lis', 'sok', 'osa', 'lody', 'mak'], 'Czytamy proste słowa.'),
  soundLevel('Dźwięki P B N', ['p', 'b', 'n'], 'Nowe dźwięki.'),
  soundLevel('Dźwięki W R Z', ['w', 'r', 'z'], 'Jeszcze trzy dźwięki.'),
  sylLevel('Sylaby: pa, bo, nu…', ['p', 'b', 'n'], 'Sylaby z P, B, N.'),
  sylLevel('Sylaby: wa, ro, zu…', ['w', 'r', 'z'], 'Sylaby z W, R, Z.'),
  soundLevel('Dźwięki J Ł G', ['j', 'ł', 'g'], 'Prawie cały alfabet!'),
  wordLevel('Słowa ze zwierzątkami', ['sowa', 'kura', 'woda', 'ryba', 'buty', 'balon', 'noga', 'jajo'], 'Dłuższe słowa.'),
  soundLevel('Dźwięki F C H', ['f', 'c', 'h'], 'Jeszcze trzy litery. Litera h brzmi tak samo jak ch.'),
  soundLevel('Miękkie: Ś Ć Ń Ź', ['ś', 'ć', 'ń', 'ź'], 'Miękkie, delikatne dźwięki.'),
  soundLevel('Ż Ą Ę Ó', ['ż', 'ą', 'ę', 'ó'], 'Specjalne litery. Ó brzmi tak samo jak U.'),
  soundLevel('Dwuznaki: SZ CZ CH RZ', ['sz', 'cz', 'ch', 'rz'], 'Dwie litery, jeden dźwięk. Rz brzmi jak ż.'),
  soundLevel('Dwuznaki: DZ DŹ DŻ', ['dz', 'dź', 'dż'], 'Ostatnie dźwięki.'),
  wordLevel('Słowa z dwuznakami', ['żaba', 'mysz', 'szafa', 'czapka', 'chata', 'koło'], 'Trudniejsze słowa.'),
  sentenceLevel('Zdania: To jest…', [['To jest dom.', ['dom']], ['To jest las.', ['las']], ['To jest kot.', ['kot']], ['To jest ser.', ['ser']]], 'Pierwsze zdania.'),
  sentenceLevel('Zdania: …ma…', [['Mama ma lody.', ['mama', 'lody']], ['Tata ma rower.', ['tata', 'rower']], ['Kura ma jajo.', ['kura', 'jajo']], ['Mysz ma ser.', ['mysz', 'ser']]], 'Kto co ma?'),
  sentenceLevel('Zdania: …lubi…', [['Kot lubi rybę.', ['kot', 'ryba']], ['Osa lubi mak.', ['osa', 'mak']], ['Lis ma buty.', ['lis', 'buty']], ['Żaba ma czapkę.', ['zaba', 'czapka']]], 'Kto co lubi?'),
  storyLevel('Czytanki 1', ['R1', 'R2', 'R3'], 'Krótkie historyjki.'),
  storyLevel('Czytanki 2', ['R4', 'R5', 'R6'], 'Jeszcze więcej historyjek.'),
];

export const levelById = (id) => LEVELS.find((l) => l.id === id);
export { STORIES, ART_OF, VOWELS };
