// Polskie liczebniki 0–100 i odmiana rzeczowników po liczebnikach (1 / 2–4 / 5+ / 12–14).
// Źródło prawdy dla lektora (nagrania pojedynczych liczb i form rzeczowników) i dla testów.

const ONES = ['zero', 'jeden', 'dwa', 'trzy', 'cztery', 'pięć', 'sześć', 'siedem', 'osiem', 'dziewięć', 'dziesięć', 'jedenaście', 'dwanaście',
  'trzynaście', 'czternaście', 'piętnaście', 'szesnaście', 'siedemnaście', 'osiemnaście', 'dziewiętnaście'];
const TENS = [null, null, 'dwadzieścia', 'trzydzieści', 'czterdzieści', 'pięćdziesiąt', 'sześćdziesiąt', 'siedemdziesiąt', 'osiemdziesiąt', 'dziewięćdziesiąt'];
/** Godziny pełne (rodzaj żeński: „jest trzecia”). */
export const HOUR_ORDINALS = [null, 'pierwsza', 'druga', 'trzecia', 'czwarta', 'piąta', 'szósta', 'siódma', 'ósma', 'dziewiąta', 'dziesiąta', 'jedenasta', 'dwunasta'];

const check = (n) => { if (!Number.isInteger(n) || n < 0 || n > 100) throw new RangeError(`liczba poza zakresem 0–100: ${n}`); };

/**
 * Słowa liczebnika jako lista osobnych słów: 7 → ['siedem'], 23 → ['dwadzieścia', 'trzy'], 100 → ['sto'].
 * gender: 'm' | 'f' | 'n' – wpływa tylko na 1 (jeden/jedna/jedno) i końcowe 2 (dwa/dwie) w pojedynczych jednostkach.
 */
export function numberWords(n, gender = 'm') {
  check(n);
  if (n === 100) return ['sto'];
  if (n < 20) return [unit(n, gender, n)];
  const t = Math.floor(n / 10), u = n % 10;
  return u === 0 ? [TENS[t]] : [TENS[t], unit(u, gender, n)];
}
function unit(u, gender, n) {
  if (u === 1 && n === 1) return gender === 'f' ? 'jedna' : gender === 'n' ? 'jedno' : 'jeden';
  if (u === 2 && gender === 'f') return 'dwie'; // 2, 22, 32… (12 to „dwanaście”, nie trafia tu)
  return ONES[u];
}
export const numberText = (n, gender = 'm') => numberWords(n, gender).join(' ');

/** Indeks formy rzeczownika: 0 = 1 (jabłko), 1 = 2–4 (jabłka), 2 = 0, 5+ i 12–14 (jabłek). */
export function pluralIndex(n) {
  check(n);
  if (n === 1) return 0;
  const last = n % 10, last2 = n % 100;
  return last >= 2 && last <= 4 && !(last2 >= 12 && last2 <= 14) ? 1 : 2;
}
/** noun = { one, few, many, gender } */
export const nounForm = (n, noun) => [noun.one, noun.few, noun.many][pluralIndex(n)];

/** „pięć jabłek”: { words: ['pięć', 'jabłek'], text } – words to też części do lektora (osobne nagrania). */
export function countPhrase(n, noun) {
  const words = [...numberWords(n, noun.gender ?? 'm'), nounForm(n, noun)];
  return { words, text: words.join(' ') };
}

/** Wszystkie słowa liczebników potrzebne w grze (0–100 składane z 0–20 i dziesiątek) – do spisu nagrań. */
export function allNumberWordForms() {
  const set = new Set();
  for (let n = 0; n <= 100; n++) for (const g of ['m', 'f', 'n']) numberWords(n, g).forEach((w) => set.add(w));
  return [...set];
}
