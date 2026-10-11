import test from 'node:test';
import assert from 'node:assert/strict';
import { PRAISE, RETRY, FINISH, pickVariant, variantPicker } from '../js/core/lines.js';

test('pochwały: kilka wariantów, unikalne, z wymaganymi liniami', () => {
  assert.ok(PRAISE.length >= 8); assert.equal(new Set(PRAISE).size, PRAISE.length);
  for (const p of ['Brawo!', 'Super!', 'Świetnie ci idzie!', 'Gwiazdka dla Ciebie!']) assert.ok(PRAISE.includes(p), p);
  for (const p of PRAISE) assert.match(p, /!$/, 'pochwała z wykrzyknikiem: ' + p);
  assert.ok(RETRY.length >= 3 && FINISH.length >= 2);
  assert.ok(RETRY.some((r) => /Spróbuj jeszcze raz/.test(r)));
});
test('pickVariant: nigdy nie powtarza poprzedniego (1000 losowań, różne generatory)', () => {
  for (const list of [PRAISE, RETRY, FINISH, ['a', 'b']]) {
    const next = variantPicker(list); let last = null;
    for (let i = 0; i < 1000; i++) { const x = next(); assert.notEqual(x, last); assert.ok(list.includes(x)); last = x; }
  }
});
test('pickVariant: skrajne wartości generatora losowego też nie powtarzają', () => {
  for (const r of [0, 0.999999, 0.5]) { let last = null; for (let i = 0; i < 20; i++) { const x = pickVariant(PRAISE, last, () => r); assert.notEqual(x, last); last = x; } }
  assert.equal(pickVariant(['x'], 'x'), 'x', 'jedna opcja – nie ma wyboru');
});
test('pickVariant: wszystkie warianty bywają wybierane', () => {
  const next = variantPicker(PRAISE); const seen = new Set();
  for (let i = 0; i < 2000; i++) seen.add(next());
  assert.equal(seen.size, PRAISE.length);
});
