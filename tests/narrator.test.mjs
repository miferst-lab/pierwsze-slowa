import test from 'node:test';
import assert from 'node:assert/strict';
import { pickVoice, rankVoices, liveParams, LIVE_STYLE, Narrator } from '../js/core/narrator.js';
import { audioId, stripPunct } from '../js/core/say.js';

const v = (name, lang, localService, extra = {}) => ({ name, lang, localService, voiceURI: name, ...extra });
const ZOFIA_NAT = v('Microsoft Zofia Online (Natural) - Polish (Poland)', 'pl-PL', false);
const PAULINA = v('Microsoft Paulina - Polish (Poland)', 'pl-PL', true);
const ADAM = v('Microsoft Adam - Polish (Poland)', 'pl-PL', true);

test('rankVoices: Natural/Online pl-PL pierwsze, potem Paulina/Zofia lokalna, potem reszta', () => {
  const other = v('eSpeak Polish', 'pl-PL', true);
  const r = rankVoices([other, PAULINA, v('Microsoft David', 'en-US', true), ZOFIA_NAT]);
  assert.deepEqual(r.map((x) => x.name), [ZOFIA_NAT.name, PAULINA.name, other.name]);
});
test('rankVoices: dowolny głos z „Natural” lub „Online” wygrywa z lokalną Paulina', () => {
  assert.match(pickVoice([PAULINA, v('Google Polish Online', 'pl-PL', false)]).name, /Online/);
  assert.match(pickVoice([PAULINA, v('Foo Natural', 'pl_PL', false)]).name, /Natural/);
});
test('rankVoices: tylko polskie; bez polskiego -> null', () => {
  assert.equal(pickVoice([v('David', 'en-US', true)]), null); assert.equal(pickVoice([]), null); assert.equal(pickVoice(undefined), null);
  assert.equal(rankVoices([v('Natural Voice', 'en-US', false)]).length, 0);
});
test('rankVoices: głos żeński przed męskim (Zofia Online > Marek Online; Paulina > Adam)', () => {
  const marek = v('Microsoft Marek Online (Natural) - Polish (Poland)', 'pl-PL', false);
  assert.match(pickVoice([marek, ZOFIA_NAT]).name, /Zofia/);
  assert.match(pickVoice([ADAM, PAULINA]).name, /Paulina/);
  assert.match(pickVoice([ADAM]).name, /Adam/, 'męski lepszy niż brak głosu');
});
test('rankVoices: wybór rodzica ma pierwszeństwo przed wszystkim', () => {
  assert.equal(pickVoice([ZOFIA_NAT, PAULINA], PAULINA.voiceURI).name, PAULINA.name);
  assert.equal(pickVoice([ZOFIA_NAT, ADAM], ADAM.voiceURI).name, ADAM.name);
});
test('liveParams: głoski wolniej i głośniej niż zdania; pitch ok. 1.1–1.15', () => {
  const ph = liveParams('sound'), syl = liveParams('syllable'), se = liveParams('sentence'), pr = liveParams('praise');
  assert.equal(ph.rate, 0.65); assert.equal(syl.rate, 0.65); assert.equal(ph.volume, 1.0);
  assert.equal(se.rate, 0.85); assert.equal(se.volume, 0.9);
  assert.ok(ph.rate < se.rate && ph.volume > se.volume);
  for (const p of [ph, se, pr]) assert.ok(p.pitch >= 1.1 && p.pitch <= 1.15, String(p.pitch));
  assert.ok(pr.pitch >= se.pitch, 'pochwały nie niżej niż zdania');
  assert.equal(LIVE_STYLE.phonetic.rate, 0.65);
});
test('liveParams: suwaki skalują tempo i głośność, z ograniczeniami', () => {
  assert.equal(liveParams('word', 1.3, 1).rate, 0.85 * 1.3);
  assert.ok(liveParams('sound', 1, 0.5).volume === 0.5);
  assert.ok(liveParams('sentence', 1, 1).volume <= 1);
});
test('Narrator: kindOf zna rodzaje z programu (głoska, sylaba, pochwała)', () => {
  const n = new Narrator();
  assert.equal(n.kindOf('#m'), 'sound'); assert.equal(n.kindOf('ma'), 'syllable'); assert.equal(n.kindOf('Brawo!'), 'praise');
  assert.equal(n.kindOf('Nieznane zdanie.'), 'sentence');
});
test('Narrator: bez nagrań i bez syntezatora nic nie jest słyszalne, bez wyjątków', async () => {
  const n = new Narrator(); n.status = 'none';
  assert.equal(n.audible, false);
  await n.speak(['Posłuchaj.', '#m']); n.cancel(); n.refresh();
});
test('audioId: stabilne, ASCII', () => {
  assert.equal(audioId('#m'), 's-m'); assert.equal(audioId('Mama'), 't-mama'); assert.equal(audioId('#ł'), 's-u142'); assert.match(audioId('To jest dom.'), /^t-[a-z0-9_]+$/);
});
test('stripPunct', () => assert.equal(stripPunct('dom.'), 'dom'));
