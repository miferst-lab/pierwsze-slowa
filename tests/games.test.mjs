import test from 'node:test';
import assert from 'node:assert/strict';
import { createSpawner, createTracker, starsForGame, makeQuestion, pickItems, learnedReading, learnedMath, speedFactor, GAME_TARGET, GAME_SPEEDS } from '../js/games/logic.js';
import { VERBS, GAMES, GAME_IDS } from '../js/games/phrases.js';
import { LEVELS } from '../modules/reading/curriculum.js';
import { MATH_LEVELS } from '../modules/math/curriculum.js';
import { defaultState, parseState, recordGame, gameInfo, STATE_VERSION } from '../js/core/progress.js';

const seeded = (s = 7) => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
const doneState = (ids) => { const st = defaultState(); for (const id of ids) st.levels[id] = { tasks: {}, done: true }; return st; };

test('treści czytania: tylko to, co poznane (ukończone poziomy); na starcie pierwszy poziom', () => {
  const L0 = learnedReading(defaultState(), LEVELS);
  assert.deepEqual(L0.sounds, ['a', 'o', 'e']); assert.equal(L0.syllables.length, 0); assert.equal(L0.words.length, 0);
  const L1 = learnedReading(doneState(['L01', 'L02', 'L03', 'L04', 'L05']), LEVELS);
  assert.ok(L1.sounds.includes('m') && !L1.sounds.includes('s'));
  assert.ok(L1.syllables.includes('ma') && L1.syllables.every((s) => /^[mtl]/.test(s)));
  assert.deepEqual(L1.words, ['mama', 'tata', 'lala']);
  const all = learnedReading({ ...defaultState(), unlockAll: true }, LEVELS);
  assert.ok(all.words.length >= 25 && all.sounds.length >= 39);
});
test('treści matematyki: zakres rośnie z ukończonymi poziomami', () => {
  assert.deepEqual(learnedMath(defaultState(), MATH_LEVELS), { maxNum: 5, add: 0, sub: 0 });
  const m = learnedMath(doneState(MATH_LEVELS.slice(0, 11).map((l) => l.id)), MATH_LEVELS);
  assert.equal(m.maxNum, 20); assert.equal(m.add, 10); assert.equal(m.sub, 10);
  assert.equal(learnedMath({ ...defaultState(), unlockAll: true }, MATH_LEVELS).maxNum, 100);
});
test('pytania z czytania: poprawny element w zbiorze, unikalne, tylko poznane, polecenie ma czasownik gry', () => {
  const rand = seeded(), st = doneState(LEVELS.slice(0, 8).map((l) => l.id)), L = learnedReading(st, LEVELS);
  const seen = new Set();
  for (let i = 0; i < 300; i++) {
    for (const game of GAME_IDS.map((g) => GAMES[g].verb)) {
      const q = makeQuestion('reading', L, game, rand, { n: 4 }); seen.add(q.kind);
      assert.ok(q.items.length >= 3 && q.items.length <= 4); assert.equal(new Set(q.items.map((x) => x.id)).size, q.items.length);
      assert.ok(q.items.includes(q.correct)); assert.equal(q.ask.say[0], VERBS[game][q.kind]);
      const pool = { sound: L.sounds, syllable: L.syllables, word: L.words }[q.kind]; for (const it of q.items) assert.ok(pool.includes(it.id), it.id);
    }
  }
  assert.deepEqual([...seen].sort(), ['sound', 'syllable', 'word']);
});
test('pytania z matematyki: wynik policzony, w zakresie poznanych działań, odpowiedź wśród opcji', () => {
  const rand = seeded(3);
  for (const upto of [0, 5, 10, 16, 25]) {
    const st = upto ? doneState(MATH_LEVELS.slice(0, upto).map((l) => l.id)) : defaultState(), L = learnedMath(st, MATH_LEVELS);
    let results = 0;
    for (let i = 0; i < 300; i++) {
      const q = makeQuestion('math', L, 'catch', rand, { n: 4 });
      assert.ok(q.items.includes(q.correct) && q.items.length <= 4 && new Set(q.items.map((x) => x.id)).size === q.items.length);
      for (const it of q.items) assert.ok(Number(it.id) >= 0 && Number(it.id) <= Math.max(L.maxNum, L.add, L.sub) + 4, 'poza zakresem ' + it.id);
      if (q.kind === 'result') {
        results++; const { a, op, b, c } = q.expr; assert.equal(c, op === '+' ? a + b : a - b); assert.equal(Number(q.correct.id), c); assert.ok(c >= 0 && a >= 0 && b >= 0);
        assert.ok(op === '+' ? c <= L.add : a <= L.sub, `${a}${op}${b}`);
      } else assert.ok(Number(q.correct.id) <= L.maxNum);
    }
    if (L.add === 0 && L.sub === 0) assert.equal(results, 0, 'przed poznaniem działań nie ma wyników');
    else assert.ok(results > 50);
  }
});
test('pickItems zawsze zawiera poprawny element', () => {
  const rand = seeded(5), L = learnedMath(doneState(['M01', 'M02']), MATH_LEVELS);
  for (let i = 0; i < 100; i++) { const q = makeQuestion('math', L, 'balloons', rand, { n: 6 }); const p = pickItems(q, 3, rand); assert.equal(p.length, 3); assert.ok(p.includes(q.correct)); }
});
test('harmonogram (fałszywy zegar): pierwszy od razu, odstęp, limit naraz, poprawny zawsze obecny', () => {
  const sp = createSpawner({ interval: 2, maxAlive: 3, lanes: 5, correctEvery: 3, rand: seeded(11) });
  let alive = 0, aliveC = 0; const log = [];
  for (let t = 0; t < 20; t += 0.5) { const out = sp.tick(0.5, { alive, aliveCorrect: aliveC }); for (const o of out) { alive++; if (o.correct) aliveC++; log.push({ t, ...o }); } }
  assert.equal(log[0].t, 0); assert.equal(log[0].correct, true);
  assert.equal(log.length, 3, 'limit 3 naraz'); assert.ok(log.every((o, i) => i === 0 || o.t - log[i - 1].t >= 2 - 1e-9));
  // po zdjęciu elementów z planszy znów się pojawiają
  alive = 0; aliveC = 0; const more = sp.tick(2, { alive, aliveCorrect: aliveC }); assert.equal(more.length, 1); assert.equal(more[0].correct, true);
  // poprawny co najwyżej co correctEvery
  const sp2 = createSpawner({ interval: 1, maxAlive: 99, lanes: 4, correctEvery: 3, rand: seeded(2) }); let c = 0, tot = 0, ac = 0, a = 0;
  for (let i = 0; i < 30; i++) for (const o of sp2.tick(1, { alive: a, aliveCorrect: ac })) { a++; tot++; if (o.correct) { c++; ac++; } }
  assert.equal(c, Math.ceil(tot / 3)); assert.ok(tot >= 29);
  // jeden duży krok zegara nie tworzy lawiny
  const sp3 = createSpawner({ interval: 2, maxAlive: 4 }); assert.ok(sp3.tick(100, { alive: 0 }).length <= 4);
});
test('harmonogram: kolejne pasy się nie powtarzają', () => {
  const sp = createSpawner({ interval: 1, maxAlive: 99, lanes: 5, rand: seeded(9) }); let last = -1;
  for (let i = 0; i < 50; i++) for (const o of sp.tick(1, { alive: 0, aliveCorrect: 1 })) { assert.notEqual(o.lane, last); last = o.lane; }
});
test('punktacja: 6 trafień kończy rundę, gwiazdki 3/2/1, zawsze ≥ 1, brak porażki', () => {
  assert.equal(GAME_TARGET, 6);
  assert.deepEqual([0, 1, 2, 4, 5, 20].map(starsForGame), [3, 3, 2, 2, 1, 1]);
  const t = createTracker(); for (let i = 0; i < 5; i++) assert.equal(t.hit(), false); t.miss(); t.miss(); assert.equal(t.done, false); assert.equal(t.hit(), true); assert.equal(t.stars, 2);
});
test('prędkość: wolno < normalnie, ograniczony ruch zwalnia, domyślnie wolno', () => {
  assert.ok(speedFactor('slow') < speedFactor('normal')); assert.ok(speedFactor('normal', { reduced: true }) < speedFactor('normal'));
  assert.equal(speedFactor('???'), GAME_SPEEDS.slow); assert.equal(defaultState().gameSpeed, 'slow');
});
test('postęp zabaw: zapis najlepszych gwiazdek, parsowanie odporne na śmieci', () => {
  const s = defaultState(); recordGame(s, 'reading', 'lap', 2); recordGame(s, 'reading', 'lap', 1); recordGame(s, 'math', 'balony', 3);
  assert.deepEqual(gameInfo(s, 'reading', 'lap'), { stars: 2, plays: 2 }); assert.equal(gameInfo(s, 'math', 'sciezka').plays, 0);
  const back = parseState(JSON.stringify(s)); assert.deepEqual(back.games, s.games);
  const bad = parseState(JSON.stringify({ v: STATE_VERSION, gameSpeed: 'warp', games: { 'x:y': { stars: 9 }, 'math:lap': { stars: 99, plays: -3 }, 'reading:lap': 5 } }));
  assert.equal(bad.gameSpeed, 'slow'); assert.deepEqual(Object.keys(bad.games), ['math:lap']); assert.equal(bad.games['math:lap'].stars, 3);
});

test('każdy element, który lektor może wypowiedzieć w zabawie, ma nagranie (manifest)', async () => {
  const { readFileSync } = await import('node:fs'); const { audioId } = await import('../js/core/say.js'); const { resolvePart } = await import('../modules/math/say.js');
  const have = new Set(Object.keys(JSON.parse(readFileSync(new URL('../audio/manifest.json', import.meta.url), 'utf8')).clips));
  const rand = seeded(21), st = { ...defaultState(), unlockAll: true };
  for (const subject of ['reading', 'math']) {
    const L = subject === 'math' ? learnedMath(st, MATH_LEVELS) : learnedReading(st, LEVELS);
    for (let i = 0; i < 400; i++) for (const game of ['catch', 'path', 'balloons']) {
      const q = makeQuestion(subject, L, game, rand, { n: 6 });
      for (const p of [...q.ask.say, q.correct.say]) { const parts = [typeof p === 'string' ? p : resolvePart(p)].flat(Infinity); for (const x of parts) assert.ok(have.has(audioId(x)), `brak nagrania: ${x}`); }
    }
  }
});
