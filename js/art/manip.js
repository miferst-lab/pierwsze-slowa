// Pomoce wizualne do matematyki: przedmioty do liczenia (każdy świat ma własne), obiekty do zadań tekstowych,
// ramki dziesiątek, pieniądze, zegar, linijka, figury, wzorki. Wszystko inline SVG, bez plików graficznych.
import { WORLDS } from './worlds.js';
import { c, e, r, p, ln, eye, smile } from './words.js';

const innerOf = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const itemInner = (worldId, name) => innerOf(WORLDS[worldId].items.find((i) => i.name === name).svg);

/** Przedmioty do liczenia w każdym świecie (rzeczownik z odmianą dla lektora). */
export const MANIP = {
  lesna: [
    { key: 'lisc', noun: { one: 'liść', few: 'liście', many: 'liści', gender: 'm' }, inner: itemInner('lesna', 'Liść dębu') },
    { key: 'gwiazda', noun: { one: 'gwiazda', few: 'gwiazdy', many: 'gwiazd', gender: 'f' }, inner: itemInner('lesna', 'Złota gwiazdka') },
    { key: 'motyl', noun: { one: 'motyl', few: 'motyle', many: 'motyli', gender: 'm' }, inner: itemInner('dzungla', 'Motyl') },
  ],
  kosmos: [
    { key: 'gwiazda', noun: { one: 'gwiazda', few: 'gwiazdy', many: 'gwiazd', gender: 'f' }, inner: itemInner('kosmos', 'Gwiazdka') },
    { key: 'planeta', noun: { one: 'planeta', few: 'planety', many: 'planet', gender: 'f' }, inner: itemInner('kosmos', 'Niebieska planeta') },
    { key: 'rakieta', noun: { one: 'rakieta', few: 'rakiety', many: 'rakiet', gender: 'f' }, inner: itemInner('kosmos', 'Mała rakieta') },
  ],
  dzungla: [
    { key: 'banan', noun: { one: 'banan', few: 'banany', many: 'bananów', gender: 'm' }, inner: itemInner('dzungla', 'Banan') },
    { key: 'lisc', noun: { one: 'liść', few: 'liście', many: 'liści', gender: 'm' }, inner: itemInner('dzungla', 'Liść') },
    { key: 'motyl', noun: { one: 'motyl', few: 'motyle', many: 'motyli', gender: 'm' }, inner: itemInner('dzungla', 'Motyl') },
  ],
  wyspy: [
    { key: 'rybka', noun: { one: 'rybka', few: 'rybki', many: 'rybek', gender: 'f' }, inner: itemInner('wyspy', 'Rybka') },
    { key: 'muszelka', noun: { one: 'muszelka', few: 'muszelki', many: 'muszelek', gender: 'f' }, inner: itemInner('wyspy', 'Muszelka') },
    { key: 'kokos', noun: { one: 'kokos', few: 'kokosy', many: 'kokosów', gender: 'm' }, inner: itemInner('wyspy', 'Kokos') },
  ],
};
export const manipOf = (worldId, i = 0) => (MANIP[worldId] ?? MANIP.kosmos)[((i % 3) + 3) % 3];

/** Przedmioty z zadań tekstowych (tekst jest stały, więc nie zależą od świata). */
export const PROBLEM_ITEMS = {
  jablko: { noun: { one: 'jabłko', few: 'jabłka', many: 'jabłek', gender: 'n' }, inner: c(50, 56, 32, '#e0524a') + e(40, 44, 8, 5, '#fff', "opacity='.35'") + ln('M50 26Q50 14 54 8', '#6b4a1a', 4) + p('M54 18q14-8 22 0-10 8-22 0z', '#4caf50') },
  balon: { noun: { one: 'balon', few: 'balony', many: 'balonów', gender: 'm' }, inner: e(50, 40, 26, 32, '#f06292') + p('M45 71h10l-5 9z', '#c2185b') + ln('M50 80q-8 6 0 12', '#777', 2) + e(40, 28, 6, 10, '#fff', "opacity='.4'") },
  ciastko: { noun: { one: 'ciastko', few: 'ciastka', many: 'ciastek', gender: 'n' }, inner: c(50, 52, 34, '#d9a45b') + [[38, 42], [60, 40], [48, 62], [64, 62], [34, 62]].map(([x, y]) => c(x, y, 5, '#6b3e1e')).join('') },
  kwiatek: { noun: { one: 'kwiatek', few: 'kwiatki', many: 'kwiatków', gender: 'm' }, inner: ln('M50 94V50', '#3a8a3a', 4) + [0, 72, 144, 216, 288].map((a) => e(50, 30, 11, 17, '#ff8fb1', `transform='rotate(${a} 50 50)'`)).join('') + c(50, 50, 9, '#ffd23f') },
  pilka: { noun: { one: 'piłka', few: 'piłki', many: 'piłek', gender: 'f' }, inner: c(50, 52, 34, '#4fa3e0') + p('M16 52Q50 36 84 52Q50 70 16 52z', '#fff', "opacity='.8'") + ln('M50 18V86', '#fff', 4) },
};

const svgWrap = (w, h, inner, cls = '', label = '') => `<svg class='${cls}' viewBox='0 0 ${w} ${h}' ${label ? `role='img' aria-label='${label}'` : "aria-hidden='true'"} focusable='false'>${inner}</svg>`;

/** Grupa n przedmiotów w siatce (po 5 w rzędzie; od 11 – przerwa po dziesiątce, łatwiej policzyć). */
export function groupSvg(inner, n, { perRow = 5, cell = 44, label = '' } = {}) {
  const rows = Math.max(1, Math.ceil(n / perRow)), gap = n > 10 ? 10 : 0;
  const items = [];
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / perRow), col = i % perRow, extra = i >= 10 ? gap : 0;
    items.push(`<g transform='translate(${col * cell},${row * cell + extra}) scale(${(cell - 4) / 100})'>${inner}</g>`);
  }
  const w = Math.min(n, perRow) * cell, h = rows * cell + gap;
  return svgWrap(Math.max(w, cell), Math.max(h, cell), items.join(''), 'group', label || `${n}`);
}

/** Ramka dziesiątek jako SVG (2×5): a komórek w kolorze 1, b w kolorze 2. */
export function frameSvg(a, b = 0, { cells = 10 } = {}) {
  const out = [];
  for (let i = 0; i < cells; i++) {
    const x = (i % 5) * 36 + 4, y = Math.floor(i / 5) * 36 + 4;
    const col = i < a ? '#5b8def' : i < a + b ? '#f0836b' : 'none';
    out.push(`<rect x='${x}' y='${y}' width='32' height='32' rx='8' fill='#fff' stroke='#8a8ab5' stroke-width='2.5'/>` + (col !== 'none' ? `<circle cx='${x + 16}' cy='${y + 16}' r='11' fill='${col}'/>` : ''));
  }
  return svgWrap(184, 76, out.join(''), 'frame');
}

/* ---------- pieniądze (rysunki własne, nie odwzorowują prawdziwych banknotów ani monet) ---------- */
export const COINS = [1, 2, 5];
export const NOTES = [10, 20];
export function moneySvg(value) {
  const note = value >= 10;
  if (note) {
    const col = value === 10 ? '#f2c9a0' : '#cfe3a8';
    return svgWrap(120, 70, r(4, 6, 112, 58, col, 8, "stroke='#7a6a4a' stroke-width='3'") + c(30, 35, 15, '#fff', "opacity='.55'") + `<text x='84' y='45' font-size='26' font-weight='800' text-anchor='middle' fill='#3a3a4a' font-family='Nunito,Segoe UI,Verdana,sans-serif'>${value} zł</text>`, 'money note', `${value} zł`);
  }
  const col = value === 5 ? '#e5c365' : value === 2 ? '#d7dbe3' : '#e8d7a0';
  return svgWrap(80, 80, c(40, 40, 34, col, "stroke='#7a6a4a' stroke-width='4'") + c(40, 40, 26, 'none', "stroke='#fff' stroke-width='2' opacity='.6'") + `<text x='40' y='50' font-size='28' font-weight='800' text-anchor='middle' fill='#3a3a4a' font-family='Nunito,Segoe UI,Verdana,sans-serif'>${value}</text><text x='40' y='64' font-size='12' font-weight='700' text-anchor='middle' fill='#3a3a4a' font-family='Nunito,Segoe UI,Verdana,sans-serif'>zł</text>`, 'money coin', `${value} zł`);
}

/* ---------- zegar (pełne godziny) ---------- */
export function clockSvg(hour, { label = '' } = {}) {
  const ang = ((hour % 12) * 30 - 90) * (Math.PI / 180);
  const hx = 50 + 24 * Math.cos(ang), hy = 50 + 24 * Math.sin(ang);
  const marks = [...Array(12)].map((_, i) => {
    const a = (i * 30 - 90) * (Math.PI / 180);
    const n = i === 0 ? 12 : i;
    return `<text x='${50 + 36 * Math.cos(a)}' y='${50 + 36 * Math.sin(a) + 4}' font-size='11' font-weight='800' text-anchor='middle' fill='#33334d' font-family='Nunito,Segoe UI,Verdana,sans-serif'>${n}</text>`;
  }).join('');
  return svgWrap(100, 100, c(50, 50, 47, '#fff', "stroke='#6b6a99' stroke-width='4'") + marks + ln('M50 50V20', '#33334d', 3) + ln(`M50 50L${hx.toFixed(1)} ${hy.toFixed(1)}`, '#e0533d', 5) + c(50, 50, 4, '#33334d'), 'clock', label || `zegar ${hour}`);
}

/* ---------- linijka z patyczkiem o długości `len` cm (0–10) ---------- */
export function rulerSvg(len, { color = '#f0a040' } = {}) {
  const ticks = [...Array(11)].map((_, i) => `<path d='M${20 + i * 26} 62v${i % 5 === 0 ? 16 : 10}' stroke='#555' stroke-width='2'/><text x='${20 + i * 26}' y='96' font-size='12' font-weight='800' text-anchor='middle' fill='#33334d' font-family='Nunito,Segoe UI,Verdana,sans-serif'>${i}</text>`).join('');
  return svgWrap(300, 104, r(4, 56, 292, 40, '#fff3bf', 6, "stroke='#a08a30' stroke-width='3'") + ticks + r(20, 22, len * 26, 22, color, 11, "stroke='#8a5a1a' stroke-width='3'") + p(`M${20 + len * 26} 22l16 11-16 11z`, '#f5d9a8', "stroke='#8a5a1a' stroke-width='3'"), 'ruler', `patyczek, linijka w centymetrach`);
}

/* ---------- figury ---------- */
export const SHAPES = {
  kolo: { label: 'koło', sides: 0, svg: (col) => c(50, 50, 38, col, "stroke='#33334d' stroke-width='4'") },
  kwadrat: { label: 'kwadrat', sides: 4, svg: (col) => r(16, 16, 68, 68, col, 4, "stroke='#33334d' stroke-width='4'") },
  trojkat: { label: 'trójkąt', sides: 3, svg: (col) => p('M50 12L90 86H10z', col, "stroke='#33334d' stroke-width='4' stroke-linejoin='round'") },
  prostokat: { label: 'prostokąt', sides: 4, svg: (col) => r(8, 26, 84, 48, col, 4, "stroke='#33334d' stroke-width='4'") },
};
export const SHAPE_COLORS = ['#ffb4a2', '#9fd8e8', '#ffe08a', '#b8e2a0'];
export const shapeSvg = (key, col = SHAPE_COLORS[0], label = '') => svgWrap(100, 100, SHAPES[key].svg(col), 'shape', label || SHAPES[key].label);

/* ---------- wzorki: kolorowe żetony ---------- */
export const TOKENS = {
  kolo: (col) => c(50, 50, 34, col, "stroke='#33334d' stroke-width='4'"),
  kwadrat: (col) => r(18, 18, 64, 64, col, 8, "stroke='#33334d' stroke-width='4'"),
  trojkat: (col) => p('M50 14L88 82H12z', col, "stroke='#33334d' stroke-width='4' stroke-linejoin='round'"),
  gwiazda: (col) => `<polygon points='50,10 61,38 92,38 67,56 77,86 50,68 23,86 33,56 8,38 39,38' fill='${col}' stroke='#33334d' stroke-width='4' stroke-linejoin='round'/>`,
};
export const tokenSvg = (shape, col) => svgWrap(100, 100, TOKENS[shape](col), 'token', `${shape}`);

export { svgWrap, eye, smile };
