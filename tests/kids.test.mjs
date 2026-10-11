import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { KIDS, POSES, kidById, kidFile, kidSrc, DEFAULT_KID } from '../js/art/kids.js';
import * as P from '../js/core/progress.js';
const root = new URL('../', import.meta.url).pathname;

test('bohaterowie: każdy wpis ma komplet plików, a domyślny to Piotr (gdy jest na liście)', () => {
  for (const k of KIDS) { assert.ok(existsSync(root + k.face), k.face); for (const w of ['lesna', 'kosmos', 'dzungla', 'wyspy']) for (const pose of POSES) assert.ok(existsSync(root + kidSrc(k, w, pose)), k.id + w + pose); }
  assert.equal(kidFile(KIDS[0], 'dzungla', 'mysli')[0], 'piotr-tygrys-mysli'); assert.equal(kidFile(KIDS[0], 'kosmos')[0], 'piotr-lis-stoi');
  assert.equal(kidFile(KIDS[2], 'dzungla', 'mysli')[0], 'sara-sarna-stoi'); // brak pozy => „stoi”
  assert.deepEqual(KIDS.map((k) => k.voc), ['Piotrku', 'Kubo', 'Saro']);
  if (KIDS.length) { assert.equal(kidById(null).id, DEFAULT_KID); assert.equal(kidById('nieznany').id, DEFAULT_KID); }
  else assert.equal(kidById('x'), null);
});
test('wybór bohatera jest zapisywany i odporny na śmieci', () => {
  const s = P.defaultState(); assert.equal(s.guide, null);
  assert.equal(P.parseState({ v: 1, guide: 'sara' }).guide, 'sara');
  assert.equal(P.parseState({ v: 1, guide: '<img onerror=1>' }).guide, null);
  assert.equal(P.importJSON(P.exportJSON({ ...s, guide: 'kuba' })).guide, 'kuba');
});
