// PROGRAM MATEMATYKI (klasa 1, szkoła podstawowa) jako dane. Poziomy powstają z krótkich konstruktorów zadań;
// wynik (MATH_LEVELS) to zwykłe, JSON-owalne obiekty. Działania liczone są w kodzie, a testy liczą je ponownie.
//
// Typy zadań (type): tapNum, count, make, seq, order, cmpGroups, cmpWords, sign, eq, frame, problem, pattern,
//                    shapeTap, shapeName, shapeSides, ruler, coinSum, coin100, pay, clock, clockPick.
// Części wypowiedzi (say/right): zwykły tekst = nagranie; {num:n} = liczebnik; {count:n[, noun]} = „pięć jabłek”
// (noun: zl|gr|cm albo przedmiot z zadań tekstowych; domyślnie przedmiot ze świata); {ord:h} = godzina. Rozwija je say.js.
import { numberText, countPhrase, pluralIndex } from '../../js/core/numerals.js';
import { PROBLEM_ITEMS, SHAPES } from '../../js/art/manip.js';

export const MATH_GROUPS = {
  to10: 'Liczby do 10', to20: 'Liczby do 20', tasks: 'Zadania i wzory', to100: 'Liczby do 100', extra: 'Miary, pieniądze, zegar (dodatkowe)',
};
export const TOPIC_NAMES = {
  count5: 'Liczenie do 5', count10: 'Liczenie do 10', seq10: 'Ciąg liczb do 10', compare: 'Porównywanie ilości', sign: 'Znaki < > =', compose: 'Skład liczby',
  pairs10: 'Pary do 10', add5: 'Dodawanie do 5', add10: 'Dodawanie do 10', sub10: 'Odejmowanie do 10', count20: 'Liczenie do 20', tens: 'Dziesiątki i jedności',
  add20: 'Dodawanie do 20', sub20: 'Odejmowanie do 20', add20x: 'Dodawanie z przekroczeniem dziesiątki', sub20x: 'Odejmowanie z przekroczeniem dziesiątki',
  problems: 'Zadania tekstowe', patterns: 'Wzorki i ciągi', shapes: 'Figury', count100: 'Liczby do 100', length: 'Długość (cm)', money: 'Pieniądze', clock: 'Zegar',
};

// deterministyczny los (powtarzalny program, bez Math.random)
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
let R = mulberry32(1);
const shuf = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** Odpowiedź + k różnych, bliskich liczb z [lo, hi] (razem zawsze ≤ 4 opcje). */
export function numOpts(ans, lo, hi, k = 2, step = 1) {
  const near = [];
  for (let d = 1; d <= 6; d++) for (const s of [-1, 1]) { const v = ans + s * d * step; if (v >= lo && v <= hi) near.push(v); }
  const picked = shuf(near.slice(0, 6)).slice(0, k);
  for (let v = lo; picked.length < k && v <= hi; v += step) if (v !== ans && !picked.includes(v)) picked.push(v);
  return [ans, ...picked];
}

let levelNo = 0;
const level = (group, title, intro, preview, learn, extra, makeTasks) => {
  const id = 'M' + String(++levelNo).padStart(2, '0');
  R = mulberry32(levelNo * 7919);
  const tasks = makeTasks().slice(0, 8).map((t, i) => ({ id: `${id}-${i + 1}`, obj: i % 3, ...t }));
  return { id, num: levelNo, group, title, intro, preview, learn, ...extra, tasks };
};

/* ---------- konstruktory zadań ---------- */
const tapNum = (n, lo, hi, topic, options) => ({ type: 'tapNum', topic, prompt: 'Dotknij właściwą liczbę.', say: ['Dotknij liczbę', { num: n }], options: options ?? numOpts(n, lo, hi), answer: n, right: [{ num: n }] });
const count = (n, lo, hi, topic) => ({ type: 'count', topic, prompt: 'Policz i dotknij właściwą liczbę.', say: ['Policz i dotknij właściwą liczbę.'], n, options: numOpts(n, lo, hi), answer: n, right: [{ count: n }] });
const make = (n, topic) => ({ type: 'make', topic, prompt: 'Połóż na talerzu tyle, ile trzeba.', say: ['Połóż na talerzu', { count: n }], n, pile: Math.min(20, Math.max(n + 3, 6)), right: [{ count: n }] });
const seq = (items, lo, hi, topic, step = 1) => {
  const gap = items.indexOf(null), ans = gap > 0 ? items[gap - 1] + step : items[gap + 1] - step;
  const full = items.map((v) => (v === null ? ans : v));
  return { type: 'seq', topic, prompt: 'Jakiej liczby brakuje?', say: ['Jakiej liczby brakuje?'], items, answer: ans, options: numOpts(ans, lo, hi, 2, step), right: full.slice(0, 5).map((v) => ({ num: v })) };
};
const ORD = { asc: 'Dotykaj liczb od najmniejszej do największej.', desc: 'Dotykaj liczb od największej do najmniejszej.' };
const order = (nums, dir, topic) => ({ type: 'order', topic, dir, prompt: ORD[dir], say: [ORD[dir]], nums, right: [...nums].sort((x, y) => (dir === 'asc' ? x - y : y - x)).map((n) => ({ num: n })) });
const cmpGroups = (a, b, ask, topic = 'compare') => ({ type: 'cmpGroups', topic, ask, a, b, prompt: ask === 'more' ? 'Gdzie jest więcej?' : 'Gdzie jest mniej?', say: [ask === 'more' ? 'Gdzie jest więcej?' : 'Gdzie jest mniej?'], options: ['left', 'right'], answer: (ask === 'more') === (a > b) ? 'left' : 'right',
  right: ask === 'more' ? [{ num: Math.max(a, b) }, 'jest więcej niż', { num: Math.min(a, b) }] : [{ num: Math.min(a, b) }, 'jest mniej niż', { num: Math.max(a, b) }] });
const cmpWords = (a, b, topic = 'compare') => { const ans = a > b ? 'więcej' : a < b ? 'mniej' : 'tyle samo'; return { type: 'cmpWords', topic, a, b, prompt: 'Po lewej jest… więcej, mniej czy tyle samo?', say: ['Porównaj grupy.', 'Po lewej jest'], options: ['więcej', 'mniej', 'tyle samo'], answer: ans, right: ['Po lewej jest', ans] }; };
const sign = (a, b, pics) => ({ type: 'sign', topic: 'sign', a, b, pics, prompt: 'Wybierz znak: <, > albo =.', say: ['Wybierz znak.'], options: ['<', '>', '='], answer: a < b ? '<' : a > b ? '>' : '=', right: [{ num: a }, a < b ? 'jest mniejsze niż' : a > b ? 'jest większe niż' : 'jest równe', { num: b }] });
/** eq: a op b = c z jedną niewiadomą (blank: 'a' | 'b' | 'c'). art: pokaż przedmioty. */
const eq = (a, op, b, blank, topic, { art = false, hi = 20 } = {}) => {
  const c = op === '+' ? a + b : a - b, ans = { a, b, c }[blank], w = op === '+' ? 'plus' : 'minus';
  const say = blank === 'c' ? ['Ile to jest', { num: a }, w, { num: b }] : blank === 'b' ? ['Uzupełnij.', { num: a }, w, 'ile', 'równa się', { num: c }] : ['Uzupełnij.', 'Ile', w, { num: b }, 'równa się', { num: c }];
  return { type: 'eq', topic, eq: { a, op, b, blank }, art, prompt: blank === 'c' ? 'Ile to jest?' : 'Uzupełnij brakującą liczbę.', say, options: numOpts(ans, 0, Math.max(hi, ans), 2), answer: ans, right: [{ num: a }, w, { num: b }, 'równa się', { num: c }] };
};
const frame = (pre, add, { topic, to10 = false, frames = 1 } = {}) => ({ type: 'frame', topic, pre, add, frames, prompt: to10 ? 'Dopełnij ramkę do dziesięciu.' : pre ? 'Zaznacz na ramce: dodaj kółka.' : 'Zaznacz na ramce tyle kółek, ile trzeba.',
  say: to10 ? ['Dopełnij ramkę do dziesięciu.'] : pre ? ['Zaznacz na ramce', { num: pre }, 'plus', { num: add }] : ['Zaznacz na ramce', { num: add }], right: pre ? [{ num: pre }, 'plus', { num: add }, 'równa się', { num: pre + add }] : [{ num: add }] });

/* ---------- zadania tekstowe: tekst budowany z liczebników i poprawnej odmiany ---------- */
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const few = (n) => pluralIndex(n) === 1;
const NAMES = { Ala: 'f', Ola: 'f', Kasia: 'f', Tomek: 'm', Piotrek: 'm' };
export function problemText(kind, item, a, b, name = 'Ala') {
  const noun = PROBLEM_ITEMS[item].noun, f = NAMES[name] === 'f', cp = (n) => countPhrase(n, noun).text, nb = numberText(b, noun.gender);
  switch (kind) {
    case 'add1': return `${name} ma ${cp(a)}. ${f ? 'Dostała' : 'Dostał'} jeszcze ${nb}. Ile ma teraz?`;
    case 'add2': return `Na talerzu ${few(a) ? 'leżą' : 'leży'} ${cp(a)}. Mama kładzie jeszcze ${nb}. Ile jest teraz na talerzu?`;
    case 'add3': return `W koszyku ${few(a) ? 'są' : 'jest'} ${cp(a)}. Dokładamy jeszcze ${nb}. Ile jest teraz w koszyku?`;
    case 'sub1': return `${name} ${f ? 'miała' : 'miał'} ${cp(a)}. ${f ? 'Oddała' : 'Oddał'} ${nb}. Ile ${f ? 'jej' : 'mu'} zostało?`;
    case 'sub2': return `Na łące ${few(a) ? 'rosły' : 'rosło'} ${cp(a)}. ${f ? 'Dziewczynka zerwała' : 'Chłopiec zerwał'} ${nb}. Ile zostało?`;
    case 'sub3': return `${name} ${f ? 'miała' : 'miał'} ${cp(a)}. ${cap(cp(b))} ${few(b) ? 'odleciały' : 'odleciało'}. Ile ${f ? 'jej' : 'mu'} zostało?`;
    default: throw new Error('szablon ' + kind);
  }
}
const problem = (kind, item, a, b, name) => {
  const op = kind.startsWith('add') ? '+' : '-', c = op === '+' ? a + b : a - b, text = problemText(kind, item, a, b, name);
  return { type: 'problem', topic: 'problems', text, prompt: text, say: [text], art: { item, a, b, op }, calc: { a, op, b }, options: numOpts(c, 0, 20, 2), answer: c, right: [{ count: c, noun: item }] };
};

/* ---------- wzorki, figury, miary, pieniądze, zegar ---------- */
const TOK = ['kolo:#ff9aa2', 'kwadrat:#9ad1ff', 'trojkat:#ffe08a', 'gwiazda:#b5e48c'];
const pattern = (cycle, shownLen) => {
  const full = [...Array(shownLen + 1)].map((_, i) => TOK[cycle[i % cycle.length]]);
  const answer = full[shownLen];
  return { type: 'pattern', topic: 'patterns', prompt: 'Co będzie dalej?', say: ['Co będzie dalej?'], seq: full.slice(0, shownLen), options: [answer, ...TOK.filter((t) => t !== answer).slice(0, 2)], answer, right: [] };
};
const shapeTap = (target, others) => ({ type: 'shapeTap', topic: 'shapes', target, prompt: `Dotknij: ${SHAPES[target].label}.`, say: ['Dotknij', SHAPES[target].label], options: [target, ...others], answer: target, right: [SHAPES[target].label] });
const shapeName = (target, others) => ({ type: 'shapeName', topic: 'shapes', target, prompt: 'Jak się nazywa ta figura?', say: ['Jak się nazywa ta figura?'], options: [target, ...others], answer: target, right: [SHAPES[target].label] });
const shapeSides = (target, opts) => ({ type: 'shapeSides', topic: 'shapes', target, prompt: 'Ile boków ma ta figura?', say: ['Ile boków ma ta figura?'], options: opts, answer: SHAPES[target].sides, right: [{ num: SHAPES[target].sides }] });
const ruler = (len) => ({ type: 'ruler', topic: 'length', len, prompt: 'Ile centymetrów ma patyczek?', say: ['Ile centymetrów ma patyczek?'], options: numOpts(len, 1, 10), answer: len, right: [{ count: len, noun: 'cm' }] });
const coinSum = (vals) => { const s = vals.reduce((a, b) => a + b, 0); return { type: 'coinSum', topic: 'money', vals, prompt: 'Ile pieniędzy jest razem?', say: ['Ile pieniędzy jest razem?'], options: numOpts(s, 1, 40), answer: s, right: [{ count: s, noun: 'zl' }] }; };
const coin100 = () => ({ type: 'coin100', topic: 'money', prompt: 'Ile groszy ma jeden złoty?', say: ['Ile groszy ma jeden złoty?'], options: [100, 10, 50], answer: 100, right: [{ count: 1, noun: 'zl' }, 'to', { count: 100, noun: 'gr' }] });
const pay = (amount) => ({ type: 'pay', topic: 'money', amount, prompt: `Zapłać ${amount} zł.`, say: ['Zapłać', { count: amount, noun: 'zl' }], right: [{ count: amount, noun: 'zl' }] });
const clock = (h) => ({ type: 'clock', topic: 'clock', hour: h, prompt: 'Która jest godzina?', say: ['Która jest godzina?'], options: numOpts(h, 1, 12), answer: h, right: ['Jest', { ord: h }] });
const clockPick = (h) => ({ type: 'clockPick', topic: 'clock', hour: h, prompt: 'Znajdź zegar z tą godziną.', say: ['Znajdź zegar.', 'Jest', { ord: h }], options: numOpts(h, 1, 12), answer: h, right: ['Jest', { ord: h }] });

/* ---------- POZIOMY ---------- */
const E = (...a) => eq(...a);
export const MATH_LEVELS = [
  level('to10', 'Liczymy do 5', 'Liczymy przedmioty: od jednego do pięciu.', '1 2 3 4 5', { maxNum: 5, add: 0, sub: 0 }, {}, () => [
    count(2, 1, 5, 'count5'), tapNum(3, 1, 5, 'count5'), count(4, 1, 5, 'count5'), make(3, 'count5'), count(5, 1, 5, 'count5'), tapNum(1, 1, 5, 'count5'), make(5, 'count5')]),
  level('to10', 'Liczymy do 10', 'Teraz liczymy aż do dziesięciu.', '6 7 8 9 10', { maxNum: 10, add: 0, sub: 0 }, {}, () => [
    count(6, 1, 10, 'count10'), count(8, 1, 10, 'count10'), tapNum(7, 1, 10, 'count10'), make(6, 'count10'), count(10, 1, 10, 'count10'), count(9, 1, 10, 'count10'), make(8, 'count10'), tapNum(10, 1, 10, 'count10')]),
  level('to10', 'Jakiej liczby brakuje?', 'Liczby stoją w rzędzie. Co było przed, a co będzie po?', '3 4 _ 6', { maxNum: 10, add: 0, sub: 0 }, {}, () => [
    seq([1, 2, null, 4], 0, 10, 'seq10'), seq([4, 5, 6, null], 0, 10, 'seq10'), seq([null, 6, 7], 0, 10, 'seq10'), order([3, 1, 2], 'asc', 'seq10'), seq([7, null, 9], 0, 10, 'seq10'), order([8, 5, 9], 'desc', 'seq10'), seq([null, 1, 2], 0, 10, 'seq10'), order([6, 2, 9, 4], 'asc', 'seq10')]),
  level('to10', 'Więcej, mniej, tyle samo', 'Porównujemy grupy przedmiotów.', '○○○ ○○○○○', { maxNum: 10, add: 0, sub: 0 }, {}, () => [
    cmpGroups(3, 5, 'more'), cmpGroups(6, 4, 'less'), cmpWords(4, 4), cmpWords(7, 5), cmpGroups(8, 9, 'less'), cmpWords(2, 6), cmpGroups(5, 2, 'more')]),
  level('to10', 'Znaki < > =', 'Mniejsze, większe, takie samo. Najpierw na obrazkach.', '3 < 5', { maxNum: 10, add: 0, sub: 0 }, {}, () => [
    sign(3, 5, true), sign(6, 2, true), sign(4, 4, true), sign(7, 9, false), sign(8, 3, false), sign(5, 5, false), sign(10, 6, false)]),
  level('to10', 'Z czego składa się liczba', 'Liczbę można złożyć z dwóch mniejszych.', '7 = 5 + 2', { maxNum: 10, add: 10, sub: 0 }, {}, () => [
    E(2, '+', 3, 'b', 'compose', { hi: 10 }), E(4, '+', 2, 'b', 'compose', { hi: 10 }), frame(0, 6, { topic: 'compose' }), E(5, '+', 2, 'b', 'compose', { hi: 10 }), E(3, '+', 4, 'b', 'compose', { hi: 10 }), E(6, '+', 2, 'b', 'compose', { hi: 10 }), E(3, '+', 5, 'a', 'compose', { hi: 10 })]),
  level('to10', 'Pary do 10', 'Które dwie liczby dają dziesięć?', '7 + 3', { maxNum: 10, add: 10, sub: 0 }, {}, () => [
    frame(7, 3, { topic: 'pairs10', to10: true }), E(1, '+', 9, 'b', 'pairs10', { hi: 10 }), E(2, '+', 8, 'b', 'pairs10', { hi: 10 }), frame(4, 6, { topic: 'pairs10', to10: true }), E(3, '+', 7, 'b', 'pairs10', { hi: 10 }), E(6, '+', 4, 'b', 'pairs10', { hi: 10 }), E(5, '+', 5, 'b', 'pairs10', { hi: 10 }), E(8, '+', 2, 'b', 'pairs10', { hi: 10 })]),
  level('to10', 'Dodajemy do 5', 'Do ilu razem? Najpierw obrazki, potem znaki.', '2 + 3', { maxNum: 10, add: 5, sub: 0 }, {}, () => [
    E(1, '+', 2, 'c', 'add5', { art: true, hi: 5 }), E(2, '+', 2, 'c', 'add5', { art: true, hi: 5 }), frame(3, 1, { topic: 'add5' }), E(3, '+', 2, 'c', 'add5', { hi: 5 }), E(4, '+', 1, 'c', 'add5', { hi: 5 }), frame(2, 3, { topic: 'add5' }), E(1, '+', 3, 'c', 'add5', { hi: 5 }), E(2, '+', 1, 'c', 'add5', { art: true, hi: 5 })]),
  level('to10', 'Dodajemy do 10', 'Dodajemy coraz większe liczby.', '4 + 5', { maxNum: 10, add: 10, sub: 0 }, {}, () => [
    E(4, '+', 3, 'c', 'add10', { art: true, hi: 10 }), E(5, '+', 4, 'c', 'add10', { hi: 10 }), frame(6, 3, { topic: 'add10' }), E(7, '+', 2, 'c', 'add10', { hi: 10 }), E(3, '+', 6, 'c', 'add10', { hi: 10 }), frame(5, 4, { topic: 'add10' }), E(8, '+', 2, 'c', 'add10', { hi: 10 }), E(1, '+', 9, 'c', 'add10', { hi: 10 })]),
  level('to10', 'Odejmujemy do 10', 'Ile zostało? Zabieramy przedmioty.', '7 − 3', { maxNum: 10, add: 10, sub: 10 }, {}, () => [
    E(5, '-', 2, 'c', 'sub10', { art: true, hi: 10 }), E(7, '-', 3, 'c', 'sub10', { art: true, hi: 10 }), E(9, '-', 4, 'c', 'sub10', { hi: 10 }), E(8, '-', 5, 'c', 'sub10', { hi: 10 }), E(6, '-', 1, 'c', 'sub10', { hi: 10 }), E(10, '-', 7, 'c', 'sub10', { hi: 10 }), E(10, '-', 4, 'c', 'sub10', { hi: 10 }), E(9, '-', 9, 'c', 'sub10', { hi: 10 })]),
  level('to20', 'Liczymy do 20', 'Dziesięć i jeszcze trochę.', '11 … 20', { maxNum: 20, add: 10, sub: 10 }, {}, () => [
    count(12, 10, 20, 'count20'), count(15, 10, 20, 'count20'), make(13, 'count20'), tapNum(17, 10, 20, 'count20'), count(20, 10, 20, 'count20'), make(16, 'count20'), tapNum(19, 10, 20, 'count20'), count(14, 10, 20, 'count20')]),
  level('to20', 'Dziesiątki i jedności', 'Liczba po dziesięciu: 10 i jeszcze kilka.', '10 + 4 = 14', { maxNum: 20, add: 10, sub: 10 }, {}, () => [
    E(10, '+', 4, 'c', 'tens'), E(10, '+', 7, 'c', 'tens'), frame(0, 13, { topic: 'tens', frames: 2 }), E(10, '+', 5, 'b', 'tens'), E(10, '+', 8, 'b', 'tens'), frame(0, 16, { topic: 'tens', frames: 2 }), E(10, '+', 10, 'c', 'tens'), E(10, '+', 2, 'c', 'tens')]),
  level('to20', 'Dodawanie do 20', 'Bez przekraczania dziesiątki.', '12 + 5', { maxNum: 20, add: 20, sub: 10 }, {}, () => [
    E(10, '+', 5, 'c', 'add20'), E(12, '+', 3, 'c', 'add20'), frame(12, 4, { topic: 'add20', frames: 2 }), E(13, '+', 4, 'c', 'add20'), E(11, '+', 6, 'c', 'add20'), E(14, '+', 5, 'c', 'add20'), E(15, '+', 2, 'c', 'add20'), E(16, '+', 3, 'c', 'add20')]),
  level('to20', 'Odejmowanie do 20', 'Bez przekraczania dziesiątki.', '15 − 3', { maxNum: 20, add: 20, sub: 20 }, {}, () => [
    E(15, '-', 3, 'c', 'sub20'), E(17, '-', 5, 'c', 'sub20'), E(18, '-', 4, 'c', 'sub20'), E(19, '-', 6, 'c', 'sub20'), E(16, '-', 2, 'c', 'sub20'), E(14, '-', 3, 'c', 'sub20'), E(20, '-', 10, 'c', 'sub20'), E(13, '-', 1, 'c', 'sub20')]),
  level('to20', 'Dodawanie przez dziesiątkę', 'Najpierw dopełniamy do dziesięciu, potem dodajemy resztę.', '8 + 5', { maxNum: 20, add: 20, sub: 20 }, {}, () => [
    frame(8, 5, { topic: 'add20x', frames: 2 }), E(9, '+', 4, 'c', 'add20x'), E(7, '+', 6, 'c', 'add20x'), frame(9, 6, { topic: 'add20x', frames: 2 }), E(6, '+', 7, 'c', 'add20x'), E(8, '+', 7, 'c', 'add20x'), E(9, '+', 9, 'c', 'add20x'), E(5, '+', 8, 'c', 'add20x')]),
  level('to20', 'Odejmowanie przez dziesiątkę', 'Najpierw schodzimy do dziesięciu, potem odejmujemy resztę.', '13 − 5', { maxNum: 20, add: 20, sub: 20 }, {}, () => [
    E(13, '-', 5, 'c', 'sub20x'), E(12, '-', 4, 'c', 'sub20x'), E(15, '-', 7, 'c', 'sub20x'), E(14, '-', 6, 'c', 'sub20x'), E(16, '-', 8, 'c', 'sub20x'), E(11, '-', 3, 'c', 'sub20x'), E(17, '-', 9, 'c', 'sub20x'), E(12, '-', 7, 'c', 'sub20x')]),
  level('tasks', 'Zadania z dodawaniem', 'Słuchaj uważnie opowieści i licz.', 'Ala ma… Dostała…', { maxNum: 20, add: 20, sub: 20 }, {}, () => [
    problem('add1', 'jablko', 3, 2, 'Ala'), problem('add2', 'ciastko', 4, 3), problem('add3', 'pilka', 5, 4), problem('add1', 'balon', 6, 3, 'Piotrek'), problem('add2', 'jablko', 7, 5), problem('add3', 'kwiatek', 8, 6), problem('add1', 'ciastko', 9, 8, 'Kasia'), problem('add3', 'balon', 10, 7)]),
  level('tasks', 'Zadania z odejmowaniem', 'Ile zostało? Słuchaj i licz.', 'Ola miała… Oddała…', { maxNum: 20, add: 20, sub: 20 }, {}, () => [
    problem('sub1', 'ciastko', 5, 2, 'Ola'), problem('sub2', 'kwiatek', 7, 3), problem('sub3', 'balon', 8, 3, 'Piotrek'), problem('sub1', 'jablko', 9, 4, 'Tomek'), problem('sub2', 'kwiatek', 12, 5), problem('sub3', 'balon', 14, 6, 'Kasia'), problem('sub1', 'pilka', 15, 8, 'Ala'), problem('sub1', 'ciastko', 17, 9, 'Ola')]),
  level('tasks', 'Wzorki i ciągi', 'Co będzie dalej? Szukamy reguły.', '○ □ ○ □', { maxNum: 20, add: 20, sub: 20 }, {}, () => [
    pattern([0, 1], 4), pattern([0, 0, 1], 5), pattern([0, 1, 2], 6), pattern([0, 1, 1], 5), seq([2, 4, null, 8], 0, 20, 'patterns', 2), seq([5, 10, null], 0, 20, 'patterns', 5), seq([7, 8, null, 10], 0, 20, 'patterns')]),
  level('tasks', 'Figury', 'Koło, kwadrat, trójkąt i prostokąt.', '○ □ △', { maxNum: 20, add: 20, sub: 20 }, {}, () => [
    shapeTap('kolo', ['kwadrat', 'trojkat']), shapeTap('kwadrat', ['kolo', 'trojkat', 'prostokat']), shapeTap('trojkat', ['kolo', 'prostokat']), shapeName('prostokat', ['kwadrat', 'trojkat']), shapeSides('trojkat', [3, 4, 5]), shapeSides('kwadrat', [3, 4, 6]), shapeTap('prostokat', ['kwadrat', 'kolo', 'trojkat'])]),
  level('to100', 'Dziesiątki do 100', 'Liczymy dziesiątkami: 10, 20, 30…', '10 20 30', { maxNum: 100, add: 20, sub: 20 }, {}, () => [
    seq([10, 20, null, 40], 10, 100, 'count100', 10), seq([50, 60, null], 10, 100, 'count100', 10), seq([null, 30, 40], 10, 100, 'count100', 10), tapNum(30, 10, 100, 'count100', [30, 20, 40]),
    tapNum(70, 10, 100, 'count100', [70, 60, 80]), order([30, 80, 50], 'asc', 'count100'), E(20, '+', 30, 'c', 'count100', { hi: 100 }), E(50, '-', 20, 'c', 'count100', { hi: 100 })]),
  level('to100', 'Liczby do 100', 'Liczby jedna po drugiej, aż do stu.', '34 35 36', { maxNum: 100, add: 20, sub: 20 }, {}, () => [
    seq([34, 35, null, 37], 30, 40, 'count100'), seq([null, 59, 60], 55, 65, 'count100'), order([45, 12, 78], 'asc', 'count100'), sign(47, 52, false), tapNum(56, 50, 60, 'count100'), seq([88, null, 90], 85, 95, 'count100'), sign(63, 36, false), tapNum(99, 90, 100, 'count100')]),
  level('extra', 'Długość: centymetry', 'Mierzymy patyczki linijką.', '3 cm', { maxNum: 100, add: 20, sub: 20 }, { optional: true }, () => [ruler(3), ruler(5), ruler(7), ruler(8), ruler(2), ruler(10)]),
  level('extra', 'Pieniądze: złote', 'Monety i banknoty. Jeden złoty to sto groszy.', '5 zł', { maxNum: 100, add: 20, sub: 20 }, { optional: true }, () => [
    coinSum([1, 2]), coinSum([5, 2]), coin100(), pay(3), pay(7), pay(12), coinSum([10, 5, 1]), pay(15)]),
  level('extra', 'Zegar: pełne godziny', 'Która jest godzina?', '3:00', { maxNum: 100, add: 20, sub: 20 }, { optional: true }, () => [
    clock(3), clock(6), clock(9), clockPick(12), clockPick(5), clockPick(8), clock(1)]),
];

export const mathLevelById = (id) => MATH_LEVELS.find((l) => l.id === id);
