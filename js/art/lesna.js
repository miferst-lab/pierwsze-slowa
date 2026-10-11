// Świat „Leśna Wyprawa” – kierunek graficzny Artysty (projekt Grok): ciepły las, lisek-odkrywca, drewniane tabliczki.
// Postacie to okrągłe portrety wycięte z makiet Artysty (art/lesna/*.webp), reszta (tło, skarby, odznaki) to własne SVG.
import { c, e, r, p, ln } from './words.js';

const wrap = (inner) => `<svg viewBox='0 0 100 100' aria-hidden='true' focusable='false'>${inner}</svg>`;
const portrait = (file) => `<img class='sprite' src='art/lesna/${file}.webp' alt='' width='200' height='200' draggable='false'>`;
const star = (col, st = '#9a6a10') => `<polygon points='50,8 62,38 94,38 68,58 78,90 50,70 22,90 32,58 6,38 38,38' fill='${col}' stroke='${st}' stroke-width='4' stroke-linejoin='round'/>`;
const oak = (col, vein) => p('M50 94Q44 84 46 76Q30 80 26 66Q16 62 22 50Q12 42 24 34Q20 22 34 22Q36 10 50 12Q64 10 66 22Q80 22 76 34Q88 42 78 50Q84 62 74 66Q70 80 54 76Q56 84 50 94z', col) + ln('M50 92V24M50 70L34 60M50 56L66 44M50 44L36 36M50 70L66 60M50 56L34 46M50 44L64 34', vein, 2.5);
const BROWN = '#8a5a2b', DARK = '#5c3a1c', HONEY = '#f2b84b', GREEN = '#5f9a4a', TERRA = '#c8553d';

export const lesna = {
  id: 'lesna', name: 'Leśna Wyprawa', short: 'Leśna Wyprawa',
  css: { '--bg1': '#fff3d6', '--bg2': '#fbdcb0', '--surface': '#fffaf0', '--surface2': '#f7e8c6', '--ink': '#3b2412', '--ink-soft': '#5c3f26', '--title-ink': '#3b2412', '--primary': '#2f6b3a', '--primary-ink': '#fffaf0', '--accent': '#f2b84b', '--accent-ink': '#3b2412', '--line': '#8a5a2b', '--good': '#1f6b3a', '--good-bg': '#e3f1d2' },
  // zdjęcia grup (bez napisów) – używane na ekranie startowym i w „Twojej ekipie”
  parade: `<img class='parade-img' src='art/lesna/wyprawa.webp' alt='' width='960' height='587' draggable='false'>`,
  crewArt: `<img class='crew-img' src='art/lesna/ekipa.webp' alt='' width='960' height='595' draggable='false'>`,
  bg: '', // tło to zdjęcie-ilustracja z Artysty (css/lesna.css, #bg), z kremową nakładką dla kontrastu
  heroArt: `<img class='fox-hero' src='art/lesna/lis-macha.webp' alt='' width='267' height='420' draggable='false'>`,
  mascots: [
    { name: 'Lisek Odkrywca', bio: 'Sprytny lisek z plecakiem i mapą. Prowadzi całą wyprawę.', svg: portrait('lis') },
    { name: 'Miś z kompasem', bio: 'Niedźwiadek, który zawsze wie, w którą stronę iść.', svg: portrait('mis') },
    { name: 'Sowa z lupą', bio: 'Mądra sowa, która sprawdza wszystko lupą.', svg: portrait('sowa') },
    { name: 'Wiewiórka', bio: 'Zbiera żołędzie i skarby na szlaku.', svg: portrait('wiewiorka') },
    { name: 'Zajączek z chorągiewką', bio: 'Maszeruje na czele z chorągiewką.', svg: portrait('zajac') },
    { name: 'Jeż Czytelnik', bio: 'Jeż, który kocha czytać książki.', svg: portrait('jez') },
  ],
  items: [
    { name: 'Żołądź', svg: wrap(ln('M50 22V12', DARK, 5) + p('M24 46Q26 90 50 95Q74 90 76 46z', '#e0a04a', `stroke='${BROWN}' stroke-width='3'`) + e(40, 62, 6, 14, '#fff', "opacity='.3'") + p('M18 46Q16 18 50 20Q84 18 82 46z', BROWN, `stroke='${DARK}' stroke-width='3'`) + ln('M28 34l12 12M44 26l14 18M62 28l12 14', DARK, 2)) },
    { name: 'Liść dębu', svg: wrap(oak(GREEN, '#3d6b2a')) },
    { name: 'Muchomor', svg: wrap(r(38, 52, 24, 38, '#f6ecd2', 9, `stroke='${BROWN}' stroke-width='3'`) + p('M8 56Q8 12 50 12Q92 12 92 56z', TERRA, `stroke='#8f3322' stroke-width='3'`) + c(30, 38, 6, '#fff7e6') + c(58, 28, 7, '#fff7e6') + c(74, 46, 5, '#fff7e6')) },
    { name: 'Kompas', svg: wrap(c(50, 52, 42, HONEY, `stroke='${BROWN}' stroke-width='5'`) + c(50, 52, 33, '#fff6dc', `stroke='${BROWN}' stroke-width='2'`) + ln('M50 24v6M50 74v6M22 52h6M72 52h6', DARK, 3) + p('M50 28L58 52L50 76L42 52z', '#fff', `stroke='${DARK}' stroke-width='2'`) + p('M50 28L58 52H42z', TERRA) + c(50, 52, 4, DARK) + r(44, 4, 12, 8, BROWN, 3)) },
    { name: 'Mapa skarbów', svg: wrap(p('M8 18l26 8 28-8 30 8V84L62 76 34 84 8 76z', '#f3dfaa', `stroke='${BROWN}' stroke-width='3'`) + ln('M20 62Q36 44 48 58T74 42', TERRA, 3) + ln('M68 36l12 12M80 36L68 48', TERRA, 4) + p('M24 34l6-8 6 8zM36 36l7-10 7 10z', GREEN)) },
    { name: 'Latarnia', svg: wrap(ln('M42 18Q50 4 58 18', DARK, 4) + r(36, 18, 28, 8, DARK, 3) + r(38, 26, 24, 44, '#ffe27a', 4, `stroke='${DARK}' stroke-width='4'`) + e(50, 48, 7, 11, '#fff6c0') + ln('M50 26V70M38 48H62', DARK, 2.5) + r(32, 70, 36, 10, DARK, 3) + r(40, 80, 20, 8, BROWN, 3)) },
    { name: 'Złota gwiazdka', svg: wrap(star(HONEY)) },
    { name: 'Puchar odkrywcy', svg: wrap(p('M28 14h44v20q0 24-22 28Q28 58 28 34z', '#f6c64a', `stroke='${BROWN}' stroke-width='4' stroke-linejoin='round'`) + ln('M28 22Q10 22 14 38Q18 48 32 48M72 22Q90 22 86 38Q82 48 68 48', '#d9a02a', 5) + r(44, 62, 12, 14, '#d9a02a', 2) + r(30, 76, 40, 12, BROWN, 4) + star('#fff3b0', '#d9a02a').replace('<polygon', "<polygon transform='translate(38,20) scale(.24)'")) },
    { name: 'Skrzynia skarbów', svg: wrap(r(10, 40, 80, 46, '#9a6a36', 6, `stroke='${DARK}' stroke-width='4'`) + p('M10 44Q10 16 50 16Q90 16 90 44z', '#b07c42', `stroke='${DARK}' stroke-width='4'`) + ln('M10 52h80M30 20v66M70 20v66', DARK, 3) + r(42, 44, 16, 18, HONEY, 3, `stroke='${DARK}' stroke-width='3'`) + c(50, 52, 3, DARK)) },
    { name: 'Namiot odkrywców', svg: wrap(p('M6 86L50 14L94 86z', TERRA, `stroke='#8f3322' stroke-width='4' stroke-linejoin='round'`) + p('M50 14L38 86H62z', '#f4d9a0', `stroke='#8f3322' stroke-width='3'`) + p('M50 40L40 86H60z', '#5c3a1c') + ln('M50 14V4', DARK, 4) + p('M50 4h14l-4 5 4 5H50z', GREEN)) },
    { name: 'Szyszka', svg: wrap(e(50, 56, 26, 38, '#a8703a', `stroke='${DARK}' stroke-width='4'`) + [[34, 40], [50, 36], [66, 40], [30, 56], [46, 54], [62, 54], [74, 56], [36, 72], [52, 72], [66, 70]].map(([x, y]) => p(`M${x - 8} ${y}q8-10 16 0q-8 10-16 0z`, '#c98a4a', `stroke='${DARK}' stroke-width='2'`)).join('') + ln('M50 18V8', DARK, 4)) },
    { name: 'Plecak odkrywcy', svg: wrap(p('M22 34Q22 14 50 14Q78 14 78 34V84Q78 90 70 90H30Q22 90 22 84z', '#a8703a', `stroke='${DARK}' stroke-width='4'`) + r(30, 52, 40, 28, '#8a5a2b', 6, `stroke='${DARK}' stroke-width='3'`) + r(46, 62, 8, 12, HONEY, 2, `stroke='${DARK}' stroke-width='2'`) + ln('M30 38H70', DARK, 3) + ln('M28 20Q16 40 24 70M72 20Q84 40 76 70', '#6b4220', 5)) },
  ],
  // odznaki (na ekranie „Moje skarby”): wyświetlane z napisem po polsku
  badges: [
    { id: 'czytanie', name: 'Odkrywca Liter', hint: 'Ukończ wszystkie poziomy czytania.', module: 'reading', svg: wrap(p('M50 6L88 20V54Q88 80 50 94Q12 80 12 54V20z', '#8a5a2b', `stroke='${DARK}' stroke-width='4'`) + p('M50 14L80 25V54Q80 74 50 86Q20 74 20 54V25z', '#f6dfaa') + p('M26 38q12-5 24 3v26q-12-8-24-3zM74 38q-12-5-24 3v26q12-8 24-3z', '#fffaf0', `stroke='${DARK}' stroke-width='3' stroke-linejoin='round'`) + star(HONEY).replace('<polygon', "<polygon transform='translate(34,6) scale(.32)'")) },
    { id: 'liczenie', name: 'Mistrz Liczenia', hint: 'Ukończ wszystkie poziomy matematyki.', module: 'math', svg: wrap(p('M50 6L88 20V54Q88 80 50 94Q12 80 12 54V20z', '#8a5a2b', `stroke='${DARK}' stroke-width='4'`) + p('M50 14L80 25V54Q80 74 50 86Q20 74 20 54V25z', '#f6dfaa') + `<text x='50' y='64' font-size='38' font-weight='800' text-anchor='middle' fill='#2f6b3a' font-family='Segoe UI,Verdana,sans-serif'>1+2</text>` + star(HONEY).replace('<polygon', "<polygon transform='translate(34,6) scale(.32)'")) },
  ],
  // przedmioty do liczenia w matematyce: tylko rzeczowniki, które lektor już nagrał
  skin: { platform: 'kłoda', balloon: ['#f2b84b', '#9bc47a', '#f0a07a', '#f7d9a0'], plat: ['#d9b27a', '#a9c98a', '#e8c48a'] },
};
