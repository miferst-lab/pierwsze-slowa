import test from 'node:test';
import assert from 'node:assert/strict';
import * as P from '../js/core/progress.js';
import { LEVELS } from '../modules/reading/curriculum.js';

const mem = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k), m }; };

test('parseState: śmieci -> stan domyślny', () => {
  for (const raw of [null, '', '{', 'null', '[]', '"x"', '{"v":999}', '{"v":1,"levels":5}']) assert.deepEqual(P.parseState(raw).levels, {});
  assert.equal(P.parseState('{broken').world, 'kosmos');
});
test('parseState: poprawia pojedyncze pola', () => {
  const s = P.parseState({ v: 1, world: 'nieznany', rate: 99, narrator: 'tak', levels: { L01: { tasks: { 'L01-1': 3, 'L01-2': 7, 'L01-3': 'x' }, done: true } }, misses: { m: 2, bad: -1 } });
  assert.equal(s.world, 'kosmos'); assert.equal(s.rate, 1.2); assert.equal(s.narrator, true);
  assert.deepEqual(s.levels.L01.tasks, { 'L01-1': 3 }); assert.deepEqual(s.misses, { m: 2 });
});
test('zapis i odczyt z (sztucznego) localStorage; klucz z wersją', () => {
  const st = mem(); const s = P.defaultState(); s.world = 'wyspy'; assert.ok(P.saveState(st, s));
  assert.ok(P.STORAGE_KEY.includes(':v1')); assert.equal(P.loadState(st).world, 'wyspy');
  st.setItem(P.STORAGE_KEY, '%%%'); assert.equal(P.loadState(st).world, 'kosmos');
});
test('zapis nie wywala się, gdy storage rzuca wyjątek', () => {
  const bad = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } };
  assert.equal(P.saveState(bad, P.defaultState()), false); assert.equal(P.loadState(bad).v, 1); assert.equal(P.resetState(bad).v, 1);
});
test('gwiazdki: 3/2/1 wg pomyłek', () => { assert.deepEqual([0, 1, 2, 5].map(P.starsForWrongs), [3, 2, 1, 1]); });
test('ukończenie poziomu, ocena, odblokowanie następnego', () => {
  const s = P.defaultState(); const l1 = LEVELS[0];
  assert.ok(P.isUnlocked(s, LEVELS, 0)); assert.ok(!P.isUnlocked(s, LEVELS, 1));
  l1.tasks.forEach((t, i) => { const fin = P.recordTask(s, l1, t.id, 3); assert.equal(fin, i === l1.tasks.length - 1); });
  assert.ok(P.isLevelDone(s, l1)); assert.equal(P.levelRating(s, l1), 3); assert.ok(P.isUnlocked(s, LEVELS, 1));
  assert.equal(P.levelStarTotal(s, l1), 3 * l1.tasks.length);
});
test('recordTask zachowuje najlepszy wynik', () => {
  const s = P.defaultState(); const l = LEVELS[0];
  P.recordTask(s, l, l.tasks[0].id, 3); P.recordTask(s, l, l.tasks[0].id, 1);
  assert.equal(s.levels[l.id].tasks[l.tasks[0].id], 3);
});
test('resumeIndex: pierwsze nieukończone zadanie, a po ukończeniu od początku', () => {
  const s = P.defaultState(); const l = LEVELS[2];
  assert.equal(P.resumeIndex(s, l), 0); P.recordTask(s, l, l.tasks[0].id, 2); P.recordTask(s, l, l.tasks[1].id, 2); assert.equal(P.resumeIndex(s, l), 2);
  l.tasks.forEach((t) => P.recordTask(s, l, t.id, 2)); assert.equal(P.resumeIndex(s, l), 0);
});
test('skarby: pierwszy po 1. poziomie, komplet po wszystkich', () => {
  const s = P.defaultState(); assert.equal(P.itemsUnlocked(s, LEVELS), 0);
  LEVELS.forEach((l, i) => { l.tasks.forEach((t) => P.recordTask(s, l, t.id, 3)); if (i === 0) assert.equal(P.itemsUnlocked(s, LEVELS), 1); });
  assert.equal(P.itemsUnlocked(s, LEVELS), P.ITEMS_PER_WORLD);
});
test('słabe elementy sortowane po odsetku pomyłek', () => {
  const s = P.defaultState(); ['m', 'm', 'ma'].forEach((x) => P.recordMiss(s, x)); P.recordHit(s, 'm'); P.recordHit(s, 'ma'); P.recordHit(s, 'ma');
  const w = P.weakItems(s); assert.equal(w[0].item, 'm'); assert.equal(w.length, 2);
});
test('eksport/import i reset', () => {
  const s = P.defaultState(); s.world = 'dzungla'; const back = P.importJSON(P.exportJSON(s)); assert.equal(back.world, 'dzungla');
  assert.equal(P.importJSON('nie json'), null); assert.equal(P.importJSON('{"v":2}'), null);
  const st = mem(); P.saveState(st, s); P.resetState(st); assert.equal(st.getItem(P.STORAGE_KEY), null);
});
