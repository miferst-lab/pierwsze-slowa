import test from 'node:test';
import assert from 'node:assert/strict';
import { numberWords, numberText, pluralIndex, nounForm, countPhrase, allNumberWordForms, HOUR_ORDINALS } from '../js/core/numerals.js';

const JABLKO = { one: 'jabłko', few: 'jabłka', many: 'jabłek', gender: 'n' };
const GWIAZDA = { one: 'gwiazda', few: 'gwiazdy', many: 'gwiazd', gender: 'f' };
const BANAN = { one: 'banan', few: 'banany', many: 'bananów', gender: 'm' };

test('liczebniki 0–20 i dziesiątki', () => {
  const exp = { 0: 'zero', 1: 'jeden', 2: 'dwa', 5: 'pięć', 9: 'dziewięć', 10: 'dziesięć', 11: 'jedenaście', 12: 'dwanaście', 14: 'czternaście', 15: 'piętnaście', 19: 'dziewiętnaście', 20: 'dwadzieścia',
    30: 'trzydzieści', 40: 'czterdzieści', 50: 'pięćdziesiąt', 60: 'sześćdziesiąt', 70: 'siedemdziesiąt', 80: 'osiemdziesiąt', 90: 'dziewięćdziesiąt', 100: 'sto' };
  for (const [n, w] of Object.entries(exp)) assert.equal(numberText(Number(n)), w, n);
});
test('liczebniki złożone 21–99 = dziesiątki + jedności (osobne słowa)', () => {
  assert.deepEqual(numberWords(21), ['dwadzieścia', 'jeden']);
  assert.deepEqual(numberWords(37), ['trzydzieści', 'siedem']);
  assert.deepEqual(numberWords(99), ['dziewięćdziesiąt', 'dziewięć']);
  assert.equal(numberText(56), 'pięćdziesiąt sześć');
});
test('rodzaj: jedna/jedno/dwie tylko tam, gdzie trzeba', () => {
  assert.equal(numberText(1, 'f'), 'jedna'); assert.equal(numberText(1, 'n'), 'jedno'); assert.equal(numberText(1, 'm'), 'jeden');
  assert.equal(numberText(2, 'f'), 'dwie'); assert.equal(numberText(2, 'n'), 'dwa'); assert.equal(numberText(22, 'f'), 'dwadzieścia dwie');
  assert.equal(numberText(12, 'f'), 'dwanaście'); assert.equal(numberText(21, 'f'), 'dwadzieścia jeden'); assert.equal(numberText(5, 'f'), 'pięć');
});
test('forma rzeczownika: 1 / 2–4 / 5+ / 12–14 / 0', () => {
  const idx = (n) => pluralIndex(n);
  assert.equal(idx(1), 0);
  for (const n of [2, 3, 4, 22, 23, 24, 32, 54, 102 % 100]) if (n !== 2 || true) assert.equal(idx(n), 1, String(n));
  for (const n of [0, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 19, 20, 21, 25, 31, 100]) assert.equal(idx(n), 2, String(n));
});
test('pełne frazy: dwa jabłka, pięć jabłek, jedna gwiazda, dwie gwiazdy, dwanaście bananów', () => {
  assert.equal(countPhrase(1, JABLKO).text, 'jedno jabłko'); assert.equal(countPhrase(2, JABLKO).text, 'dwa jabłka'); assert.equal(countPhrase(5, JABLKO).text, 'pięć jabłek');
  assert.equal(countPhrase(12, JABLKO).text, 'dwanaście jabłek'); assert.equal(countPhrase(22, JABLKO).text, 'dwadzieścia dwa jabłka'); assert.equal(countPhrase(21, JABLKO).text, 'dwadzieścia jeden jabłek');
  assert.equal(countPhrase(1, GWIAZDA).text, 'jedna gwiazda'); assert.equal(countPhrase(2, GWIAZDA).text, 'dwie gwiazdy'); assert.equal(countPhrase(4, GWIAZDA).text, 'cztery gwiazdy');
  assert.equal(countPhrase(24, GWIAZDA).text, 'dwadzieścia cztery gwiazdy'); assert.equal(countPhrase(0, GWIAZDA).text, 'zero gwiazd');
  assert.equal(countPhrase(3, BANAN).text, 'trzy banany'); assert.equal(countPhrase(12, BANAN).text, 'dwanaście bananów'); assert.equal(nounForm(100, BANAN), 'bananów');
  assert.deepEqual(countPhrase(23, BANAN).words, ['dwadzieścia', 'trzy', 'banany']);
});
test('zakres: poza 0–100 i nie-liczby rzucają błąd', () => {
  for (const bad of [-1, 101, 1.5, NaN, '3']) assert.throws(() => numberWords(bad), RangeError);
});
test('wszystkie formy: tylko słowa z małego zbioru (do nagrań), godziny 1–12', () => {
  const forms = allNumberWordForms();
  assert.ok(forms.length <= 40, 'za dużo form: ' + forms.length);
  for (const n of [0, 1, 20, 100]) for (const w of numberWords(n)) assert.ok(forms.includes(w));
  assert.equal(HOUR_ORDINALS.filter(Boolean).length, 12);
});
