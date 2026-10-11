import test from 'node:test';
import assert from 'node:assert/strict';
import { pickVoice } from '../js/core/narrator.js';
import { audioId, stripPunct } from '../js/core/say.js';

const v = (name, lang, localService, extra = {}) => ({ name, lang, localService, voiceURI: name, ...extra });
test('pickVoice: wybiera tylko polskie, preferuje lokalne', () => {
  const voices = [v('Microsoft David', 'en-US', true), v('Microsoft Zofia Online (Natural) - Polish (Poland)', 'pl-PL', false), v('Microsoft Paulina - Polish (Poland)', 'pl-PL', true)];
  assert.match(pickVoice(voices).name, /Paulina/);
});
test('pickVoice: bez polskiego głosu -> null; online tylko gdy nie ma lokalnego', () => {
  assert.equal(pickVoice([v('David', 'en-US', true)]), null); assert.equal(pickVoice([]), null); assert.equal(pickVoice(undefined), null);
  assert.match(pickVoice([v('Zofia Online', 'pl_PL', false)]).name, /Zofia/);
});
test('pickVoice: wybór rodzica ma pierwszeństwo', () => {
  const a = v('A', 'pl-PL', true), b = v('B', 'pl-PL', false);
  assert.equal(pickVoice([a, b], 'B').name, 'B');
});
test('audioId: stabilne, ASCII', () => {
  assert.equal(audioId('#m'), 's-m'); assert.equal(audioId('Mama'), 't-mama'); assert.equal(audioId('#ł'), 's-u142'); assert.match(audioId('To jest dom.'), /^t-[a-z0-9_]+$/);
});
test('stripPunct', () => assert.equal(stripPunct('dom.'), 'dom'));
