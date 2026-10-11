import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { LEKTOR, lektorSrc } from '../js/core/avatar.js';
import { Narrator } from '../js/core/narrator.js';
import * as P from '../js/core/progress.js';
const root = new URL('../', import.meta.url).pathname;

test('awatar lektorki: każdy świat ma komplet plików, dżungla mówi sową', () => {
  for (const w of Object.keys(LEKTOR)) for (const m of ['mowi', 'cieszy', 'mysli']) assert.ok(existsSync(root + lektorSrc(w, m)), w + m);
  assert.equal(lektorSrc('dzungla', 'mowi'), lektorSrc('dzungla', 'cieszy'));
});
test('nastrój awatara wynika z rodzaju wypowiedzi i jest zgłaszany słuchaczom', async () => {
  const n = new Narrator(); const ev = [];
  n.onSpeak((e) => ev.push(e));
  n.enabled = false; // bez dźwięku: nastrój i tak jest zgłaszany
  await n.speak(['Brawo!']); await n.speak(['Spróbuj jeszcze raz.']); await n.speak(['Posłuchaj.']);
  assert.deepEqual(ev.filter((e) => e.type === 'start').map((e) => [e.mood, e.talk]), [['cieszy', false], ['mysli', false], ['mowi', false]]);
  assert.equal(ev.filter((e) => e.type === 'end').length, 3);
});
test('ustawienie awatara jest zapisywane', () => {
  assert.equal(P.defaultState().avatar, true);
  assert.equal(P.parseState({ v: 1, avatar: false }).avatar, false);
  assert.equal(P.parseState({ v: 1, avatar: 'x' }).avatar, true);
});
