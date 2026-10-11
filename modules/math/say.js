// Wypowiedzi lektora w matematyce: rozwija części {num}, {count}, {ord} do osobnych nagrań (liczby 0–100 składane z małego zbioru).
import { numberWords, countPhrase, HOUR_ORDINALS } from '../../js/core/numerals.js';
import { manipOf, MANIP, PROBLEM_ITEMS } from '../../js/art/manip.js';

export const SPECIAL_NOUNS = {
  zl: { one: 'złoty', few: 'złote', many: 'złotych', gender: 'm' },
  gr: { one: 'grosz', few: 'grosze', many: 'groszy', gender: 'm' },
  cm: { one: 'centymetr', few: 'centymetry', many: 'centymetrów', gender: 'm' },
};
export const nounFor = (key, worldId, idx) => SPECIAL_NOUNS[key] ?? PROBLEM_ITEMS[key]?.noun ?? manipOf(worldId, idx).noun;
export const ALL_NOUNS = [...Object.values(SPECIAL_NOUNS), ...Object.values(PROBLEM_ITEMS).map((i) => i.noun), ...Object.values(MANIP).flat().map((m) => m.noun)];

/** Jedna część → tekst (nagranie) albo tablica tekstów (grupa „ciasna”: liczba / liczba + rzeczownik). */
export function resolvePart(part, worldId = 'kosmos', idx = 0) {
  if (typeof part === 'string') return part;
  if (part.num != null) return numberWords(part.num);
  if (part.count != null) return countPhrase(part.count, nounFor(part.noun, worldId, idx)).words;
  if (part.ord != null) return HOUR_ORDINALS[part.ord];
  throw new Error('nieznana część wypowiedzi: ' + JSON.stringify(part));
}
export const resolveParts = (parts, worldId, idx) => parts.map((p) => resolvePart(p, worldId, idx));
const flat = (x) => (Array.isArray(x) ? x.flatMap(flat) : [x]);
/** Wszystkie teksty (osobne nagrania), jakie mogą paść w tym zadaniu w danym świecie. */
export const taskStrings = (task, worldId) => [...task.say, ...(task.right ?? [])].flatMap((p) => flat(resolvePart(p, worldId, task.obj ?? 0)));
