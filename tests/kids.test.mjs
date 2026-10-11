import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { KIDS, kidById, kidFile, DEFAULT_KID } from '../js/art/kids.js';
import * as P from '../js/core/progress.js';
const root = new URL('../', import.meta.url).pathname;

test('bohaterowie: każdy wpis ma komplet plików, a domyślny to Piotr (gdy jest na liście)', () => {
  for (const k of KIDS) { assert.ok(existsSync(root + k.face), k.face); for (const [f] of Object.values(k.files)) assert.ok(existsSync(root + `art/kids/${f}.webp`), f); }
  assert.equal(kidFile(KIDS[0], 'dzungla')[0], 'piotr-tygrys'); assert.equal(kidFile(KIDS[0], 'kosmos')[0], 'piotr-hero');
  if (KIDS.length) { assert.equal(kidById(null).id, DEFAULT_KID); assert.equal(kidById('nieznany').id, DEFAULT_KID); }
  else assert.equal(kidById('x'), null);
});
test('wybór bohatera jest zapisywany i odporny na śmieci', () => {
  const s = P.defaultState(); assert.equal(s.guide, null);
  assert.equal(P.parseState({ v: 1, guide: 'sara' }).guide, 'sara');
  assert.equal(P.parseState({ v: 1, guide: '<img onerror=1>' }).guide, null);
  assert.equal(P.importJSON(P.exportJSON({ ...s, guide: 'kuba' })).guide, 'kuba');
});
