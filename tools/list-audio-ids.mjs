#!/usr/bin/env node
// Wypisuje identyfikatory wszystkich nagrań potrzebnych do pełnego lektora (patrz audio/README.md).
import { LEVELS } from '../modules/reading/curriculum.js';
import { SOUND_KEYS, audioId, stripPunct } from '../js/core/say.js';

const parts = new Set(SOUND_KEYS.map((k) => '#' + k));
for (const l of LEVELS) for (const t of l.tasks) {
  t.say.forEach((p) => parts.add(p));
  t.options?.forEach((o) => { if (t.kind !== 'sound' && t.type !== 'initial' && t.type !== 'hearPic') parts.add(o); });
  t.units?.forEach((u) => parts.add(t.unitKind === 'sound' ? '#' + u : u)); if (t.word) parts.add(t.word);
  for (const s of [t.sentence, ...(t.sentences ?? [])].filter(Boolean)) { parts.add(s); s.split(' ').forEach((w) => parts.add(stripPunct(w))); }
}
['Spróbuj jeszcze raz.', 'Brawo!', 'Świetnie!', 'Super!', 'Tak jest!', 'Pięknie!', 'Doskonale!'].forEach((p) => parts.add(p));
for (const p of [...parts].sort()) console.log(audioId(p) + '\t' + p);
