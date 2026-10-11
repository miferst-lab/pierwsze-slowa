// Ilustracje słów: czyste inline SVG (viewBox 0 0 100 100), bez plików graficznych.
// Klucz = identyfikator ilustracji (ASCII). Każda ma etykietę (słowo po polsku).
const c = (x, y, r, f, x2 = '') => `<circle cx='${x}' cy='${y}' r='${r}' fill='${f}' ${x2}/>`;
const e = (x, y, rx, ry, f, x2 = '') => `<ellipse cx='${x}' cy='${y}' rx='${rx}' ry='${ry}' fill='${f}' ${x2}/>`;
const r = (x, y, w, h, f, rx = 0, x2 = '') => `<rect x='${x}' y='${y}' width='${w}' height='${h}' rx='${rx}' fill='${f}' ${x2}/>`;
const p = (d, f, x2 = '') => `<path d='${d}' fill='${f}' ${x2}/>`;
const ln = (d, s, w = 3) => `<path d='${d}' fill='none' stroke='${s}' stroke-width='${w}' stroke-linecap='round' stroke-linejoin='round'/>`;
const eye = (x, y, rr = 3) => c(x, y, rr, '#222');
const smile = (x, y, w = 8) => ln(`M${x - w} ${y}q${w} ${w} ${2 * w} 0`, '#a02828');
const SKIN = '#f5c9a0';

export const WORD_ART = {
  mama: { label: 'mama', svg: e(50, 58, 33, 40, '#7a4a2a') + p('M18 100q0-22 32-22t32 22z', '#e86a92') + c(50, 50, 26, SKIN) + p('M24 50C22 24 40 18 50 18s28 6 26 32c-6-14-14-20-26-20S30 36 24 50z', '#7a4a2a') + eye(41, 50) + eye(59, 50) + smile(50, 60) + c(35, 58, 4, '#f4a3a3', "opacity='.7'") + c(65, 58, 4, '#f4a3a3', "opacity='.7'") },
  tata: { label: 'tata', svg: p('M16 100q0-24 34-24t34 24z', '#3b6fd4') + c(50, 52, 26, SKIN) + p('M24 48Q22 22 50 22Q78 22 76 48Q62 34 24 48z', '#3b2a1a') + eye(41, 52) + eye(59, 52) + e(50, 64, 11, 3.5, '#3b2a1a') + smile(50, 69, 6) },
  lala: { label: 'lala', svg: p('M50 52L26 94h48z', '#e86a92') + ln('M34 66L18 76M66 66L82 76', SKIN, 5) + c(50, 34, 17, SKIN) + c(28, 40, 8, '#e0a030') + c(72, 40, 8, '#e0a030') + p('M33 32Q50 8 67 32Q50 22 33 32z', '#e0a030') + eye(44, 36, 2.5) + eye(56, 36, 2.5) + smile(50, 42, 5) },
  kot: { label: 'kot', svg: p('M24 44L28 12L48 30z', '#f0a040') + p('M76 44L72 12L52 30z', '#f0a040') + c(50, 58, 30, '#f0a040') + p('M44 30h12l-6 10z', '#d98428') + e(39, 54, 4, 5.5, '#222') + e(61, 54, 4, 5.5, '#222') + p('M45 63h10l-5 6z', '#e86a92') + ln('M50 69q-6 8-12 4M50 69q6 8 12 4', '#222', 2) + ln('M14 58h16M14 68l15-3M86 58H70M86 68L71 65', '#444', 2) },
  dom: { label: 'dom', svg: r(72, 20, 8, 20, '#a04030') + r(20, 48, 60, 44, '#f2d28b') + p('M10 52L50 16l40 36z', '#c0504a') + r(44, 64, 14, 28, '#8a5a2b') + r(27, 58, 12, 12, '#9fd3f0', 1) + r(63, 58, 12, 12, '#9fd3f0', 1) },
  las: { label: 'las', svg: r(46, 66, 8, 28, '#7a4a2a') + p('M50 8L76 44H24z', '#2e8b57') + p('M50 28L82 70H18z', '#2f9e5f') + r(14, 80, 72, 4, '#5a8a3a', 2) },
  sok: { label: 'sok', svg: ln('M58 8L52 48', '#e84a5f', 5) + p('M28 30h44l-5 62H33z', '#ffa726', "stroke='#555' stroke-width='3'") + p('M30 40h40l-1 8H31z', '#fb8c00') + c(28, 30, 11, '#ffb300', "stroke='#e65100' stroke-width='2'") + ln('M20 30h16M28 22v16', '#e65100', 2) },
  osa: { label: 'osa', svg: e(52, 40, 12, 20, '#cfe9ff', "stroke='#7aa' stroke-width='1.5'") + e(66, 42, 12, 18, '#cfe9ff', "stroke='#7aa' stroke-width='1.5'") + e(54, 62, 26, 17, '#f6d02f') + r(48, 46, 6, 32, '#222', 0, "opacity='.85'") + r(62, 48, 6, 28, '#222', 0, "opacity='.85'") + c(26, 60, 12, '#f6d02f') + eye(22, 58, 2.5) + smile(26, 66, 4) + p('M78 62l14 2-14 4z', '#333') },
  lody: { label: 'lody', svg: p('M32 52L50 96L68 52z', '#d9a05b') + ln('M38 60l22 12M42 70l14 8', '#b9803b', 2) + c(50, 42, 20, '#f8a5c2') + c(50, 26, 15, '#8de0c0') + c(50, 12, 5, '#d22') },
  mak: { label: 'mak', svg: ln('M50 96V48', '#3a8a3a', 4) + p('M50 80Q30 70 26 76Q34 86 50 80z', '#3a8a3a') + c(36, 38, 15, '#e53935') + c(64, 38, 15, '#e53935') + c(43, 24, 14, '#e53935') + c(58, 24, 14, '#e53935') + c(50, 34, 8, '#222') },
  sowa: { label: 'sowa', svg: p('M26 30l10 10-14 4zM74 30L64 40l14 4z', '#6d4f33') + e(50, 58, 28, 34, '#8d6e4f') + e(50, 68, 18, 22, '#ead7b5') + c(39, 44, 11, '#fff') + c(61, 44, 11, '#fff') + c(39, 44, 5, '#222') + c(61, 44, 5, '#222') + p('M45 52h10l-5 9z', '#f5a623') + ln('M38 94l-4 4M44 94v4M56 94v4M62 94l4 4', '#f5a623', 3) },
  kura: { label: 'kura', svg: p('M16 40Q6 56 20 66Q24 50 24 44z', '#a85a1e') + e(46, 62, 30, 24, '#c8742e') + e(46, 66, 18, 12, '#e0a060') + c(72, 38, 14, '#c8742e') + c(72, 22, 5, '#e53935') + c(80, 24, 4, '#e53935') + p('M84 38l12 5-12 5z', '#f5a623') + eye(76, 35) + ln('M40 86v10M54 86v10M34 96h12M48 96h12', '#f5a623', 3) },
  noga: { label: 'noga', svg: r(36, 6, 24, 54, SKIN, 6) + p('M32 54h30v16q24 4 28 16v10H24V80z', '#e53935') + r(24, 90, 66, 4, '#fff', 2) + ln('M36 66h20', '#fff', 3) },
  woda: { label: 'woda', svg: p('M48 8C48 8 20 44 20 64a28 28 0 0 0 56 0C76 44 48 8 48 8z', '#3aa0e8') + ln('M34 66q0 14 12 18', '#fff', 4) + p('M82 56C82 56 72 68 72 76a10 10 0 0 0 20 0C92 68 82 56 82 56z', '#7cc4f4') },
  ryba: { label: 'ryba', svg: e(44, 50, 30, 19, '#ff8c42') + p('M70 50L94 30V70z', '#ff6f1f') + p('M40 32q8-14 20-4z', '#ff6f1f') + c(28, 46, 4, '#fff') + c(28, 46, 2, '#222') + ln('M52 36q6 14 0 28M62 38q5 12 0 24', '#ffd0a0', 3) + c(14, 64, 3, '#bfe6ff') + c(20, 76, 4, '#bfe6ff') },
  buty: { label: 'buty', svg: [0, 38].map((d, i) => `<g transform='translate(${d},0)'>` + p('M10 18h20v36l26 12v22H10z', i ? '#2f8f5b' : '#8b4a2b') + r(10, 80, 46, 8, '#fff', 3) + ln('M10 30h20', '#fff', 3) + `</g>`).join('') },
  balon: { label: 'balon', svg: e(50, 38, 27, 33, '#e53935') + p('M45 70h10l-5 9z', '#c62828') + ln('M50 79q-9 7 0 14t0 6', '#555', 2) + e(39, 26, 6, 10, '#fff', "opacity='.45'") },
  ser: { label: 'ser', svg: p('M10 72L58 28L92 40V76z', '#ffd54f', "stroke='#c99a00' stroke-width='2'") + p('M10 72L92 76H10z', '#f2b900') + c(40, 62, 5, '#f0b429') + c(66, 62, 6, '#f0b429') + c(76, 48, 3.5, '#f0b429') + c(30, 70, 3, '#d9a000') },
  rower: { label: 'rower', svg: c(24, 68, 18, 'none', "stroke='#333' stroke-width='5'") + c(78, 68, 18, 'none', "stroke='#333' stroke-width='5'") + ln('M24 68L42 38L68 38L78 68M42 38L54 68L24 68M68 38L54 68', '#e53935', 4) + ln('M68 38L64 24h12M36 34h14', '#333', 4) + c(54, 68, 4, '#333') },
  jajo: { label: 'jajo', svg: e(50, 56, 28, 36, '#fff7e0', "stroke='#c9b27a' stroke-width='3'") + ln('M30 50l10 8 8-10 10 10 8-8 6 8', '#c9b27a', 2.5) + c(40, 76, 2.5, '#d9c28a') + c(62, 74, 2.5, '#d9c28a') + c(58, 32, 2.5, '#d9c28a') },
  kolo: { label: 'koło', svg: c(50, 50, 36, 'none', "stroke='#333' stroke-width='9'") + c(50, 50, 7, '#888') + ln('M50 14V86M14 50H86M24 24L76 76M76 24L24 76', '#999', 2.5) },
  zaba: { label: 'żaba', svg: e(50, 64, 34, 24, '#5cb85c') + c(32, 40, 12, '#5cb85c') + c(68, 40, 12, '#5cb85c') + c(32, 40, 8, '#fff') + c(68, 40, 8, '#fff') + c(33, 41, 4, '#222') + c(67, 41, 4, '#222') + ln('M30 66q20 14 40 0', '#2e7d32', 3) + c(22, 84, 7, '#4aa04a') + c(78, 84, 7, '#4aa04a') },
  mysz: { label: 'mysz', svg: ln('M78 74q20-4 14-24', '#d98a9a', 3) + e(48, 62, 28, 22, '#b0b0b8') + c(28, 36, 12, '#b0b0b8') + c(58, 36, 12, '#b0b0b8') + c(28, 36, 7, '#f4a3a3') + c(58, 36, 7, '#f4a3a3') + c(24, 62, 5, '#f4a3a3') + eye(36, 54) + eye(52, 54) + ln('M16 66h-10M16 70l-10 4M16 62L6 58', '#555', 1.8) },
  szafa: { label: 'szafa', svg: r(18, 10, 64, 78, '#a9744a', 3) + r(24, 16, 24, 66, '#c08a5a', 2) + r(52, 16, 24, 66, '#c08a5a', 2) + c(44, 50, 3, '#f6d02f') + c(56, 50, 3, '#f6d02f') + r(20, 88, 8, 8, '#6b4226') + r(72, 88, 8, 8, '#6b4226') },
  czapka: { label: 'czapka', svg: p('M16 62Q16 26 50 26Q84 26 84 62z', '#e53935') + ln('M34 30q-6 14-4 30M50 26v34M66 30q6 14 4 30', '#c62828', 3) + r(12, 58, 76, 16, '#fff', 8, "stroke='#ccc' stroke-width='2'") + c(50, 18, 10, '#fff', "stroke='#ccc' stroke-width='2'") },
  chata: { label: 'chata', svg: r(22, 52, 56, 40, '#c8a165') + p('M8 56L50 14L92 56z', '#d9a521') + ln('M22 50l56 0M16 44l68 0', '#b8860b', 2) + r(42, 66, 16, 26, '#7a5230') + r(26, 62, 10, 10, '#9fd3f0') + r(64, 62, 10, 10, '#9fd3f0') },
  lis: { label: 'lis', svg: p('M16 24L38 42L62 42L84 24L88 66Q50 100 12 66z', '#f08a24') + p('M12 66Q30 62 50 82Q70 62 88 66Q50 100 12 66z', '#fff') + p('M16 24L30 40L20 46z', '#7a3a10') + p('M84 24L70 40L80 46z', '#7a3a10') + eye(36, 56) + eye(64, 56) + c(50, 84, 5, '#222') },
  oko: { label: 'oko', svg: p('M6 50Q50 10 94 50Q50 90 6 50z', '#fff', "stroke='#333' stroke-width='4'") + c(50, 50, 20, '#3a7bd5') + c(50, 50, 9, '#111') + c(56, 43, 4, '#fff') },
};

// Obrazki od Artysty (art/words/*.webp, klucz zieleni) zastępują rysunki SVG tam, gdzie je dostarczył; reszta słów zostaje w SVG.
for (const k of ['mama', 'ryba', 'zaba', 'balon', 'mak', 'kot', 'dom']) WORD_ART[k].svg = `<image href='art/words/${k}.webp' x='4' y='4' width='92' height='92' preserveAspectRatio='xMidYMid meet'/>`;
export const WORD_ART_KEYS = Object.keys(WORD_ART);

/** Zwraca <svg> ilustracji; dla kilku kluczy układa scenę obok siebie. */
export function artSvg(keys, { label = '' } = {}) {
  const list = Array.isArray(keys) ? keys : [keys];
  const w = 100 * list.length;
  const inner = list.map((k, i) => `<g transform='translate(${i * 100},0)'>${WORD_ART[k]?.svg ?? ''}</g>`).join('');
  return `<svg class='art' viewBox='0 0 ${w} 100' role='img' aria-label='${label.replace(/'/g, '')}' focusable='false'>${inner}</svg>`;
}
export { c, e, r, p, ln, eye, smile };
