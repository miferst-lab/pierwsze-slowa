import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, GROUPS, WORDS, INITIAL } from '../modules/reading/curriculum.js';
import { SAY, SOUND_KEYS, resolveSay } from '../js/core/say.js';
import { WORD_ART } from '../js/art/words.js';

const ALPHABET = ['a','ą','b','c','ć','d','e','ę','f','g','h','i','j','k','l','ł','m','n','ń','o','ó','p','r','s','ś','t','u','w','y','z','ź','ż'];
const DIGRAPHS = ['ch','cz','dz','dź','dż','rz','sz'];
const allTasks = LEVELS.flatMap((l) => l.tasks.map((t) => ({ l, t })));
const TYPES = ['hear', 'initial', 'hearPic', 'pick', 'build', 'readtap', 'sentpic', 'story'];

test('poziomy: unikalne id, 5–8 zadań, znane grupy', () => {
  assert.equal(new Set(LEVELS.map((l) => l.id)).size, LEVELS.length);
  for (const l of LEVELS) {
    assert.ok(l.tasks.length >= 5 && l.tasks.length <= 8, `${l.id} ma ${l.tasks.length} zadań`);
    assert.ok(GROUPS[l.group], `${l.id}: grupa`);
    assert.ok(l.title && l.intro);
  }
});
test('zadania: unikalne id i znany typ', () => {
  const ids = allTasks.map(({ t }) => t.id);
  assert.equal(new Set(ids).size, ids.length, 'duplikaty id zadań');
  for (const { t } of allTasks) { assert.ok(TYPES.includes(t.type), t.id + ' typ ' + t.type); assert.ok(t.prompt && Array.isArray(t.say) && t.say.length, t.id + ' prompt/say'); }
});
test('zadania wyboru: odpowiedź jest w opcjach, opcje unikalne (≥2)', () => {
  for (const { t } of allTasks.filter(({ t }) => t.options)) {
    assert.ok(t.options.includes(t.answer), `${t.id}: brak odpowiedzi „${t.answer}” w ${t.options}`);
    assert.equal(new Set(t.options).size, t.options.length, t.id + ' duplikaty opcji');
    assert.ok(t.options.length >= 2, t.id + ' za mało opcji');
  }
});
test('układanie: jednostki składają się w słowo', () => {
  for (const { t } of allTasks.filter(({ t }) => t.type === 'build')) {
    assert.equal(t.units.join(''), t.word, t.id);
    assert.ok(t.units.length >= 2 && t.units.length <= 4, t.id);
    if (t.art) assert.ok(WORD_ART[t.art], t.id + ' brak ilustracji');
  }
});
test('ilustracje: każdy klucz użyty w zadaniach istnieje', () => {
  for (const { t } of allTasks) {
    const keys = [t.art, ...(t.scene ?? []), ...(['initial', 'hearPic'].includes(t.type) ? t.options : [])].filter(Boolean);
    for (const k of keys) assert.ok(WORD_ART[k], `${t.id}: brak ilustracji „${k}”`);
  }
  for (const [w, d] of Object.entries(WORDS)) { assert.ok(WORD_ART[d.art], w); assert.equal(d.units.join(''), w, w); }
});
test('zdania i czytanki: poprawne struktury', () => {
  for (const { t } of allTasks) {
    if (t.type === 'sentpic') assert.ok(t.scene?.length && t.options.includes(t.answer), t.id);
    if (t.type === 'readtap') assert.ok(t.sentence.split(' ').length >= 2, t.id);
    if (t.type === 'story') { assert.ok(t.sentences.length >= 3 && t.sentences.length <= 5, t.id + ' 3–5 zdań'); assert.ok(t.question.options.includes(t.question.answer), t.id); }
  }
});
test('każda głoska ma wpis "say"; alfabet i dwuznaki pokryte', () => {
  for (const k of [...ALPHABET.filter((x) => !['q','v','x'].includes(x)), ...DIGRAPHS]) assert.ok(SAY[k], `brak say dla „${k}”`);
  for (const { t } of allTasks.filter(({ t }) => t.kind === 'sound')) for (const o of t.options ?? []) if (t.type === 'hear') assert.ok(SAY[o], `${t.id}: brak say dla „${o}”`);
  for (const k of Object.keys(INITIAL)) assert.ok(SAY[k], k);
});
test('say używa głosek zamiast nazw liter', () => {
  assert.equal(resolveSay('#m'), 'mmm'); assert.equal(resolveSay('#s'), 'sss'); assert.equal(resolveSay('ma'), 'ma'); assert.equal(resolveSay('#zzz-nieznane'), 'zzz-nieznane');
  for (const k of SOUND_KEYS) assert.ok(resolveSay('#' + k).length >= 1);
});
test('wszystkie odwołania #x w say mają wpis w tabeli', () => {
  for (const { t } of allTasks) for (const p of t.say) if (p.startsWith('#')) assert.ok(SAY[p.slice(1)], `${t.id}: ${p}`);
});
test('każda głoska poziomów dźwięków jest nauczona przed użyciem w sylabie', () => {
  const learned = new Set();
  for (const l of LEVELS) {
    if (l.group === 'sounds') l.tasks.forEach((t) => t.options?.forEach((o) => t.type === 'hear' && learned.add(o)));
    if (l.group === 'syllables') for (const t of l.tasks.filter((x) => x.type === 'build')) for (const u of t.units) assert.ok(learned.has(u), `${l.id}: litera „${u}” jeszcze nie poznana`);
  }
});
test('sumarycznie: liczba poziomów i zadań', () => {
  assert.ok(LEVELS.length >= 20); assert.ok(allTasks.length >= 120);
  for (const g of Object.keys(GROUPS)) assert.ok(LEVELS.some((l) => l.group === g), g);
  for (const type of TYPES) assert.ok(allTasks.some(({ t }) => t.type === type), 'brak typu ' + type);
});
