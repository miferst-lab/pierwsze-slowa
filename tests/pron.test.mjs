import test from 'node:test';
import assert from 'node:assert/strict';
import { PRON_LEVELS, SOUND_DEFS, EXERCISES, pronSpoken } from '../modules/pron/curriculum.js';
import { mouthSvg, exerciseSvg } from '../modules/pron/mouth.js';
import { collectSpoken } from '../js/core/spoken.js';
import { audioId, SAY } from '../js/core/say.js';
import { isPhoneticKind } from '../js/core/spoken.js';
import * as P from '../js/core/progress.js';

test('ćwiczenia wymowy: poziomy mają unikalne id, kroki każdego typu i znane ćwiczenia', () => {
  assert.ok(PRON_LEVELS.length >= 10);
  assert.equal(PRON_LEVELS[0].def.id, 'r');
  const ids = new Set();
  for (const l of PRON_LEVELS) {
    assert.match(l.id, /^P\d\d$/);
    assert.ok(!ids.has(l.id)); ids.add(l.id);
    const types = new Set(l.tasks.map((t) => t.type));
    for (const t of ['listen', 'syll', 'words', 'sentence', 'fun']) assert.ok(types.has(t), l.id + ' brak ' + t);
    assert.equal(new Set(l.tasks.map((t) => t.id)).size, l.tasks.length, 'zduplikowane id kroków w ' + l.id);
    for (const t of l.tasks) { assert.ok(t.say.length && t.prompt && t.tip); if (t.type === 'fun') assert.ok(EXERCISES[t.ex]); }
    assert.ok(mouthSvg(l.def.mouth).includes('<svg'));
  }
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
  assert.ok(/revokeObjectURL/.test(src) && /getUserMedia/.test(src));
});
