import test from 'node:test';
import assert from 'node:assert/strict';
import { PRON_LEVELS, SOUND_DEFS, EXERCISES, pronSpoken } from '../modules/pron/curriculum.js';
import { mouthSvg, mouthFigure, ARTIC, exerciseSvg } from '../modules/pron/mouth.js';
import { collectSpoken } from '../js/core/spoken.js';
import { audioId, SAY } from '../js/core/say.js';
import { isPhoneticKind } from '../js/core/spoken.js';
import * as P from '../js/core/progress.js';

test('ćwiczenia wymowy: poziomy mają unikalne id, kroki każdego typu i znane ćwiczenia', () => {
  assert.ok(PRON_LEVELS.length >= 10);
  assert.deepEqual(PRON_LEVELS.map((l) => l.sound), ['s2', 'z2', 'c2', 'dz3', 'c', 'dz', 'sz', 'zrz', 'cz', 'dz2', 'r']);
  assert.equal(PRON_LEVELS.at(-1).id, 'W-r');
  const ids = new Set();
  for (const l of PRON_LEVELS) {
    assert.match(l.id, /^W-[a-z0-9]+$/);
    assert.ok(!ids.has(l.id)); ids.add(l.id);
    const types = new Set(l.tasks.map((t) => t.type));
    for (const t of ['listen', 'syll', 'words', 'sentence', 'fun']) assert.ok(types.has(t), l.id + ' brak ' + t);
    assert.equal(new Set(l.tasks.map((t) => t.id)).size, l.tasks.length, 'zduplikowane id kroków w ' + l.id);
    for (const t of l.tasks) { assert.ok(t.say.length && t.prompt && t.tip); if (t.type === 'fun') assert.ok(EXERCISES[t.ex]); }
    assert.ok(ARTIC[l.def.id], 'brak ułożenia buzi dla ' + l.def.id);
    const f = mouthFigure(l.def.id); assert.ok(f.includes('<svg') && !/undefined|NaN/.test(f));
    for (const w of ['język', 'zęby', 'wargi', 'podniebienie']) assert.ok(f.includes(w), l.def.id + ' bez podpisu ' + w);
    if (ARTIC[l.def.id].lips === 'round') assert.ok(f.includes('lips-svg'), l.def.id + ': widok ust z przodu');
  }
  assert.notEqual(mouthSvg('c'), mouthSvg('dz'), 'dz musi różnić się od c'); assert.ok(mouthSvg('dz').includes('bzzz'));
  const shapes = new Set(['r', 'sz', 'c', 's2'].map((k) => mouthSvg(k, { anim: false }).match(/class='tg' d='([^']+)'/)[1])); assert.equal(shapes.size, 4, 'każda grupa ma inny kształt języka');
  for (const k of Object.keys(EXERCISES)) assert.ok(exerciseSvg(EXERCISES[k].anim).includes('<svg'));
});
test('każda wypowiedź modułu ma nagranie (jest w spisie wypowiedzi) i głoski wzorcowe istnieją', () => {
  const spoken = collectSpoken();
  for (const s of pronSpoken()) assert.ok(spoken.has(audioId(s.part)), s.part);
  for (const l of PRON_LEVELS) for (const t of l.tasks) for (const p of t.say) { assert.ok(spoken.has(audioId(p)), p); if (p.startsWith('#')) assert.ok(p.slice(1) in SAY, p); }
  assert.ok(isPhoneticKind('drill'));
});
test('postęp i wznawianie: gwiazdki za kroki, ostatni krok zapisany dla modułu „pron”', () => {
  const s = P.defaultState(); const l = PRON_LEVELS[0];
  assert.equal(P.resumeIndex(s, l), 0);
  P.recordTask(s, l, l.tasks[0].id, P.starsForWrongs(0)); P.recordTask(s, l, l.tasks[1].id, P.starsForWrongs(2));
  assert.equal(P.resumeIndex(s, l), 2);
  P.setLast(s, 'pron', l.id, 2);
  const back = P.parseState(JSON.parse(P.exportJSON(s)));
  assert.equal(back.last.module, 'pron');
  const r = P.resumeTarget(back, { pron: PRON_LEVELS });
  assert.equal(r.level.id, l.id); assert.equal(r.idx, 2);
});
test('dźwięk nagrywany nie trafia do pamięci trwałej: moduł nie używa localStorage, fetch ani XHR', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../modules/pron/recorder.js', import.meta.url), 'utf8');
  assert.ok(!/localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|sendBeacon|FileReader/.test(src));
  assert.ok(/revokeObjectURL/.test(src) && /getUserMedia/.test(src) && /video/.test(src) && /getTracks\(\)\.forEach\(\(t\) => t\.stop\(\)\)/.test(src));
  const R = await import('../modules/pron/recorder.js');
  assert.ok(R.MAX_MS <= 8000 && R.DELETE_AFTER_MS <= 60000 && /zniknie samo po obejrzeniu/.test(R.AUTO_DELETE));
});
test('ikony modułów: dwa warianty na moduł, pliki istnieją, zmiana co sesję i zapis', async () => {
  const { existsSync } = await import('node:fs');
  const { MODULES } = await import('../modules/index.js');
  for (const m of MODULES) for (const v of ['a', 'b']) assert.ok(existsSync(new URL('../' + m.icons[v], import.meta.url)), m.id + v);
  assert.equal(P.nextIconSet('a'), 'b'); assert.equal(P.nextIconSet('b'), 'a');
  assert.equal(P.parseState({ v: 1, iconSet: 'a' }).iconSet, 'a'); assert.equal(P.parseState({ v: 1, iconSet: 'x' }).iconSet, 'b');
});

test('pron: migracja starych id P01..P11 -> W-<głoska> (postępy i Kontynuuj)', async () => {
  const { recommendedLevel } = await import('../modules/pron/curriculum.js');
  const st = P.parseState(JSON.stringify({ v: 1, levels: { P01: { tasks: { 'r-listen': 3 }, done: true }, P08: { tasks: { 's2-listen': 2 }, done: false }, L01: { tasks: { 'L01-1': 3 }, done: true } }, last: { module: 'pron', level: 'P08', task: 1 } }));
  assert.equal(st.levels['W-r'].done, true); assert.equal(st.levels['W-s2'].tasks['s2-listen'], 2);
  assert.ok(st.levels.L01 && !st.levels.P01 && !st.levels.P08);
  assert.equal(st.last.level, 'W-s2');
  assert.equal(recommendedLevel((l) => st.levels[l.id]?.done).id, 'W-s2');
  assert.equal(recommendedLevel(() => false).id, 'W-s2');
  assert.equal(recommendedLevel((l) => l.id !== 'W-r').id, 'W-r');
});
