import test from 'node:test';
import assert from 'node:assert/strict';
import { MATH_LEVELS, MATH_GROUPS, TOPIC_NAMES, numOpts } from '../modules/math/curriculum.js';
import { resolvePart, taskStrings } from '../modules/math/say.js';
import { numberText, countPhrase } from '../js/core/numerals.js';
import { PROBLEM_ITEMS, SHAPES } from '../js/art/manip.js';

const all = MATH_LEVELS.flatMap((l) => l.tasks.map((t) => ({ l, t })));
const TYPES = ['tapNum', 'count', 'make', 'seq', 'order', 'cmpGroups', 'cmpWords', 'sign', 'eq', 'frame', 'problem', 'pattern', 'shapeTap', 'shapeName', 'shapeSides', 'ruler', 'coinSum', 'coin100', 'pay', 'clock', 'clockPick'];
const calc = (a, op, b) => (op === '+' ? a + b : a - b);

test('poziomy: 20–26, unikalne id, 5–8 zadań, znane grupy i tematy', () => {
  assert.ok(MATH_LEVELS.length >= 20 && MATH_LEVELS.length <= 26, String(MATH_LEVELS.length));
  assert.equal(new Set(MATH_LEVELS.map((l) => l.id)).size, MATH_LEVELS.length);
  MATH_LEVELS.forEach((l, i) => { assert.equal(l.num, i + 1); assert.ok(l.tasks.length >= 5 && l.tasks.length <= 8, l.id); assert.ok(MATH_GROUPS[l.group], l.id); assert.ok(l.title && l.intro && l.learn.maxNum > 0); });
  for (const { t } of all) assert.ok(TOPIC_NAMES[t.topic], t.id + ' temat ' + t.topic);
});
test('zadania: unikalne id, znany typ, prompt i say', () => {
  assert.equal(new Set(all.map(({ t }) => t.id)).size, all.length);
  for (const { t } of all) { assert.ok(TYPES.includes(t.type), t.id); assert.ok(t.prompt && t.say.length, t.id); }
});
test('wybór: odpowiedź jest w opcjach, opcje unikalne, nigdy więcej niż 4', () => {
  for (const { t } of all.filter(({ t }) => t.options)) {
    assert.ok(t.options.includes(t.answer), `${t.id}: brak odpowiedzi ${t.answer} w ${t.options}`);
    assert.equal(new Set(t.options).size, t.options.length, t.id + ' duplikaty');
    assert.ok(t.options.length >= 2 && t.options.length <= 4, t.id);
  }
});
test('działania sprawdzone obliczeniem (eq, problem), wyniki w zakresie 0–poziom', () => {
  for (const { l, t } of all) {
    if (t.type === 'eq') {
      const { a, op, b, blank } = t.eq, c = calc(a, op, b);
      assert.ok(c >= 0, t.id + ' ujemny wynik');
      assert.equal(t.answer, { a, b, c }[blank], t.id);
      assert.ok(a <= l.learn.maxNum + 0 || l.learn.maxNum >= 20, t.id);
      assert.ok(Math.max(a, b, c) <= (l.learn.maxNum === 100 ? 100 : 20), t.id + ' zakres');
      if (l.id <= 'M10') assert.ok(Math.max(a, b, c) <= 10, t.id + ' do 10');
      if (l.title.includes('do 5') && t.topic === 'add5') assert.ok(c <= 5, t.id);
    }
    if (t.type === 'problem') {
      const { a, op, b } = t.calc; assert.equal(t.answer, calc(a, op, b), t.id); assert.ok(t.answer >= 0 && Math.max(a, b) <= 20, t.id);
      assert.equal(t.art.a, a); assert.equal(t.art.b, b); assert.ok(PROBLEM_ITEMS[t.art.item], t.id);
      assert.ok(t.text.includes(numberText(a, 'm')) || t.text.includes(numberText(a, PROBLEM_ITEMS[t.art.item].noun.gender)), t.id + ' liczba a w tekście');
      assert.ok(t.text.includes(countPhrase(a, PROBLEM_ITEMS[t.art.item].noun).text), t.id + ' fraza z rzeczownikiem');
    }
  }
});
test('zadania tekstowe: poprawna odmiana (przykłady) i 15–25 różnych tekstów', () => {
  const texts = all.filter(({ t }) => t.type === 'problem').map(({ t }) => t.text);
  assert.ok(texts.length >= 15 && texts.length <= 25, String(texts.length));
  assert.equal(new Set(texts).size, texts.length);
  assert.ok(texts.some((x) => x.includes('trzy jabłka')) && texts.some((x) => x.includes('siedem jabłek')) && texts.some((x) => x.includes('dwanaście kwiatków')));
  assert.ok(texts.every((x) => !/\d/.test(x)), 'cyfry w tekście do lektora');
});
test('ciągi, porządek, porównania, znaki: spójne z obliczeniem', () => {
  for (const { t } of all) {
    if (t.type === 'seq') {
      assert.equal(t.items.filter((x) => x === null).length, 1, t.id);
      const idx = t.items.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0), first = idx[0], last = idx[idx.length - 1];
      const step = (t.items[last] - t.items[first]) / (last - first); assert.ok(Number.isInteger(step) && step !== 0, t.id);
      assert.equal(t.answer, t.items[first] + step * (t.items.indexOf(null) - first), t.id);
    }
    if (t.type === 'order') { assert.ok(t.nums.length >= 3 && t.nums.length <= 4 && new Set(t.nums).size === t.nums.length, t.id); const s = [...t.nums].sort((x, y) => (t.dir === 'asc' ? x - y : y - x)); assert.deepEqual(t.right.map((p) => p.num), s); }
    if (t.type === 'sign') assert.equal(t.answer, t.a < t.b ? '<' : t.a > t.b ? '>' : '=', t.id);
    if (t.type === 'cmpWords') assert.equal(t.answer, t.a > t.b ? 'więcej' : t.a < t.b ? 'mniej' : 'tyle samo', t.id);
    if (t.type === 'cmpGroups') { assert.notEqual(t.a, t.b, t.id); assert.equal(t.answer, (t.ask === 'more' ? t.a > t.b : t.a < t.b) ? 'left' : 'right', t.id); }
    if (t.type === 'make') { assert.ok(t.pile >= t.n && t.pile <= 20, t.id); }
    if (t.type === 'frame') { assert.ok(t.pre + t.add <= (t.frames === 2 ? 20 : 10) && t.pre <= 20 && t.add >= 1, t.id); }
    if (t.type === 'ruler') assert.ok(t.len >= 1 && t.len <= 10 && t.answer === t.len, t.id);
    if (t.type === 'coinSum') assert.equal(t.answer, t.vals.reduce((a, b) => a + b, 0), t.id);
    if (t.type === 'shapeSides') assert.equal(t.answer, SHAPES[t.target].sides, t.id);
    if (t.type === 'clock' || t.type === 'clockPick') assert.ok(t.hour >= 1 && t.hour <= 12 && t.answer === t.hour, t.id);
    if (t.type === 'pay') assert.ok(t.amount >= 1 && t.amount <= 20, t.id);
  }
});
test('zakresy programu: 10 → 20 → 100, kolejność nauki', () => {
  const maxes = MATH_LEVELS.map((l) => l.learn.maxNum);
  assert.deepEqual([...maxes].sort((a, b) => a - b), maxes, 'maxNum nie maleje');
  assert.equal(MATH_LEVELS[0].learn.maxNum, 5); assert.ok(maxes.includes(20) && maxes.includes(100));
  const n = (title) => MATH_LEVELS.find((l) => l.title === title).num;
  assert.ok(n('Dodawanie do 20') < n('Dodawanie przez dziesiątkę') && n('Dodawanie przez dziesiątkę') < n('Zadania z dodawaniem'));
  assert.ok(MATH_LEVELS.slice(-3).every((l) => l.optional), 'miary/pieniądze/zegar jako dodatkowe na końcu');
  for (const { t } of all.filter(({ l, t }) => l.num <= 10 && t.type === 'count')) assert.ok(t.n <= 10, t.id);
});
test('wypowiedzi: każda część się rozwija, bez cyfr, w każdym świecie', () => {
  for (const { t } of all) for (const w of ['kosmos', 'dzungla', 'wyspy']) for (const s of taskStrings(t, w)) assert.ok(typeof s === 'string' && s && !/\d/.test(s), t.id + ' ' + s);
  assert.deepEqual(resolvePart({ count: 5, noun: 'jablko' }), ['pięć', 'jabłek']);
  assert.deepEqual(resolvePart({ count: 2 }, 'kosmos', 0), ['dwie', 'gwiazdy']);
  assert.deepEqual(resolvePart({ count: 2 }, 'dzungla', 0), ['dwa', 'banany']);
  assert.deepEqual(resolvePart({ count: 22, noun: 'zl' }), ['dwadzieścia', 'dwa', 'złote']);
  assert.equal(resolvePart({ ord: 3 }), 'trzecia');
});
test('numOpts: zawsze odpowiedź + bliskie, w zakresie, ≤ 4', () => {
  for (let a = 0; a <= 20; a++) { const o = numOpts(a, 0, 20); assert.equal(o[0], a); assert.equal(new Set(o).size, 3); assert.ok(o.every((x) => x >= 0 && x <= 20)); }
});
