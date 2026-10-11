// TABELA WYMOWY ("say"). Łatwa do dostrojenia: lewa strona = klucz głoski (zapis),
// prawa = tekst, który dostaje syntezator mowy.
// Syntezator czyta pojedynczą literę jej NAZWĄ ("em"), a my uczymy GŁOSKI ("mmm"),
// dlatego głoski mają własne "nośniki". Ciągłe głoski (m, s, sz...) przedłużamy,
// zwarte (t, k, p, b, d, g) czytamy z krótkim "y" (ty, ky...) – to najbliższe, co da się
// zrobić bez nagrań. Najlepiej przesłuchać w panelu rodzica ("Test głosek") i poprawić.
export const SAY = {
  // samogłoski
  a: 'a', o: 'o', e: 'e', u: 'u', i: 'i', y: 'yyy', 'ą': 'oł', 'ę': 'eł', 'ó': 'u',
  // spółgłoski ciągłe
  m: 'mmm', n: 'nnn', l: 'lll', 'ł': 'łłł', s: 'sss', z: 'zzz', f: 'fff', w: 'wwww', r: 'rrrr', j: 'jjj', h: 'hhh',
  'ś': 'śśś', 'ź': 'źźź', 'ż': 'żżż', 'ń': 'ńńń', 'ć': 'ćć',
  // zwarte i zwarto-szczelinowe (z krótkim "y")
  t: 'ty', k: 'ky', d: 'dy', p: 'py', b: 'by', g: 'gy', c: 'cy',
  // dwuznaki
  ch: 'chhh', cz: 'czy', sz: 'szzz', rz: 'żżż', dz: 'dzy', 'dź': 'dźi', 'dż': 'dży',
};

/** Wszystkie głoski (litery i dwuznaki) uczone w programie. */
export const SOUND_KEYS = Object.keys(SAY);

/** "#m" -> "mmm"; zwykły tekst (sylaba, słowo, zdanie, polecenie) zostaje bez zmian. */
export function resolveSay(part) {
  if (typeof part !== 'string') return '';
  if (part.startsWith('#')) {
    const k = part.slice(1);
    return SAY[k] ?? k;
  }
  return part;
}

/** Usuwa interpunkcję wokół słowa (do czytania pojedynczych słów zdania). */
export const stripPunct = (w) => w.replace(/[.,!?;:„”"()]/g, '');

/** Stabilny, ASCII-owy identyfikator nagrania: "#m" -> "s-m", "mama" -> "t-mama", "ł" -> "s-u142". */
export function audioId(part) {
  const sound = part.startsWith('#');
  const raw = sound ? part.slice(1) : part.toLowerCase();
  const slug = [...raw].map((ch) => (/[a-z0-9]/.test(ch) ? ch : ch === ' ' ? '_' : 'u' + ch.codePointAt(0).toString(16))).join('');
  return (sound ? 's-' : 't-') + slug;
}
