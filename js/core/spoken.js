// Spis WSZYSTKICH wypowiedzi lektora w grze: jedno źródło prawdy dla narzędzia
// tools/list-audio-ids.mjs / tools/generate-audio.py, dla testów i dla lektora (rodzaj wypowiedzi).
// Rodzaje (kind): sound (głoska), syllable (sylaba), word (słowo/fraza), sentence (zdanie/czytanka),
// instruction (polecenie), praise, retry, finish, parent.
import { LEVELS } from '../../modules/reading/curriculum.js';
import { WORD_ART } from '../art/words.js';
import { SOUND_KEYS, audioId, stripPunct } from './say.js';
import { PRAISE, RETRY, FINISH, PARENT_LINES } from './lines.js';

/** Rodzaje czytane wolniej i głośniej („fonetyczne”). */
export const PHONETIC_KINDS = new Set(['sound', 'syllable']);
export const isPhoneticKind = (k) => PHONETIC_KINDS.has(k);

/** Zwraca Map: id -> { id, part, kind }. */
export function collectSpoken() {
  const out = new Map();
  const add = (part, kind) => {
    if (!part) return;
    const id = audioId(part);
    const prev = out.get(id);
    // ten sam tekst bywa sylabą i słowem (np. „ma”): jeden plik, więc wygrywa sylaba (wolniej i głośniej – bezpieczniej dla dziecka);
    // głoska (#) ma osobny identyfikator „s-…”, więc nie koliduje.
    if (prev && prev.kind === 'syllable' && kind === 'word') return;
    out.set(id, { id, part, kind });
  };
  SOUND_KEYS.forEach((k) => add('#' + k, 'sound'));
  Object.values(WORD_ART).forEach((a) => add(a.label, 'word'));
  for (const l of LEVELS) for (const t of l.tasks) {
    const phon = t.kind === 'syl';
    t.say.forEach((p, i) => {
      if (p.startsWith('#')) add(p, 'sound');
      else if (i > 0 && t.type === 'hear') add(p, phon ? 'syllable' : 'word');
      else if (i > 0 && t.type === 'hearPic') add(p, 'word');
      else add(p, 'instruction');
    });
    for (const o of t.options ?? []) {
      if (t.type === 'hear' && t.kind === 'sound') add('#' + o, 'sound');
      else if (t.type === 'hear' && phon) add(o, 'syllable');
      else if (t.type === 'pick' || t.type === 'story') add(o, 'word');
      else if (t.type === 'sentpic') { add(o, 'sentence'); o.split(' ').forEach((w) => add(stripPunct(w), 'word')); }
    }
    for (const u of t.units ?? []) add(t.unitKind === 'sound' ? '#' + u : u, t.unitKind === 'sound' ? 'sound' : 'syllable');
    if (t.word) add(t.word, t.kind === 'syl' ? 'syllable' : 'word');
    for (const s of [t.sentence, ...(t.sentences ?? [])].filter(Boolean)) { add(s, 'sentence'); s.split(' ').forEach((w) => add(stripPunct(w), 'word')); }
    if (t.sentences) add(t.sentences.join(' '), 'sentence'); // „Przeczytaj wszystko”
  }
  PRAISE.forEach((p) => add(p, 'praise'));
  RETRY.forEach((p) => add(p, 'retry'));
  FINISH.forEach((p) => add(p, 'finish'));
  PARENT_LINES.forEach((p) => add(p, 'parent'));
  return out;
}
