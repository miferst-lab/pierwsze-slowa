import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { collectSpoken } from '../js/core/spoken.js';
import { audioId, SOUND_KEYS, stripPunct } from '../js/core/say.js';
import { LEVELS } from '../modules/reading/curriculum.js';
import { PRAISE, RETRY, FINISH, PARENT_LINES } from '../js/core/lines.js';
import { WORD_ART } from '../js/art/words.js';

const root = new URL('..', import.meta.url).pathname;
const dir = join(root, 'audio');
const spoken = collectSpoken();
const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
const clips = manifest.clips;
const files = readdirSync(dir).filter((f) => f.endsWith('.mp3')).map((f) => f.slice(0, -4));

test('każda wypowiedź z programu i linii lektora ma identyfikator na liście nagrań', () => {
  const need = new Set(SOUND_KEYS.map((k) => '#' + k));
  for (const l of LEVELS) for (const t of l.tasks) {
    t.say.forEach((p) => need.add(p));                              // polecenia i elementy „Posłuchaj”
    t.units?.forEach((u) => need.add(t.unitKind === 'sound' ? '#' + u : u));   // kafelki
    if (t.word) need.add(t.word);
    if (t.type === 'hear' && t.kind === 'sound') t.options.forEach((o) => need.add('#' + o));
    else if (['pick', 'story', 'sentpic'].includes(t.type) || (t.type === 'hear')) t.options.forEach((o) => need.add(o));
    for (const s of [t.sentence, ...(t.sentences ?? [])].filter(Boolean)) { need.add(s); s.split(' ').forEach((w) => need.add(stripPunct(w))); }
    if (t.sentences) need.add(t.sentences.join(' '));
  }
  Object.values(WORD_ART).forEach((a) => need.add(a.label));
  [...PRAISE, ...RETRY, ...FINISH, ...PARENT_LINES].forEach((p) => need.add(p));
  const missing = [...need].filter((p) => !spoken.has(audioId(p)));
  assert.deepEqual(missing, [], 'brak id dla: ' + missing.join(' | '));
});
test('identyfikatory są unikalne i mają dozwolony format', () => {
  const seen = new Map();
  for (const s of spoken.values()) { assert.match(s.id, /^[st]-[a-z0-9_]+$/); assert.ok(!seen.has(s.id)); seen.set(s.id, s.part); }
  for (const s of spoken.values()) assert.equal(s.id.startsWith('s-'), s.kind === 'sound', s.id + ' ' + s.kind);
});
test('manifest zgadza się z plikami na dysku i listą wypowiedzi (nic nie brakuje, nic nie jest zbędne)', () => {
  assert.deepEqual(Object.keys(clips).sort(), files.slice().sort(), 'manifest ≠ pliki .mp3');
  assert.deepEqual(Object.keys(clips).sort(), [...spoken.keys()].sort(), 'manifest ≠ lista wypowiedzi (uruchom tools/generate-audio.py)');
  for (const [id, c] of Object.entries(clips)) {
    assert.equal(c.bytes, statSync(join(dir, id + '.mp3')).size, id + ': rozmiar');
    assert.equal(c.kind, spoken.get(id).kind, id + ': rodzaj');
    assert.ok(c.dur > 0.1 && c.dur < 15, id + ': czas ' + c.dur);
  }
});
test('pliki mp3 mają poprawny nagłówek (ID3/ramka MPEG), niepuste, razem < 15 MB', () => {
  let total = 0;
  for (const id of files) {
    const b = readFileSync(join(dir, id + '.mp3'));
    total += b.length;
    assert.ok(b.length > 500, id + ' za mały');
    const ok = (b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0);
    assert.ok(ok, id + ': to nie mp3');
  }
  assert.ok(total < 15 * 1024 * 1024, 'audio razem ' + total);
});
test('rodzaje wypowiedzi: głoski i sylaby fonetyczne, pochwały osobno; wszystkie klasy obecne', () => {
  const kinds = new Set([...spoken.values()].map((s) => s.kind));
  for (const k of ['sound', 'syllable', 'word', 'sentence', 'instruction', 'praise', 'retry', 'finish', 'parent']) assert.ok(kinds.has(k), k);
  assert.equal(spoken.get('s-m').kind, 'sound'); assert.equal(spoken.get('t-ma').kind, 'syllable'); assert.equal(spoken.get(audioId('Brawo!')).kind, 'praise');
});
test('wszystkie 39 głosek z tabeli SAY ma nagranie', () => {
  for (const k of SOUND_KEYS) assert.ok(existsSync(join(dir, audioId('#' + k) + '.mp3')), k);
});
test('audio/README i licencja głosu istnieją i wskazują model oraz licencję', () => {
  const lic = readFileSync(join(dir, 'VOICE-LICENSE.md'), 'utf8');
  assert.match(lic, /BSD-3-Clause/); assert.match(lic, /tts-vits-mai-pl/); assert.match(lic, /M-AILABS/);
});
