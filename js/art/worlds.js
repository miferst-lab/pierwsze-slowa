// Trzy światy = tylko motyw (kolory, tło, maskotki, skarby). Ten sam program nauki.
// Wszystkie postacie są ORYGINALNE (własne imiona i projekty), rysowane w SVG.
import { c, e, r, p, ln, eye, smile } from './words.js';

const wrap = (inner) => `<svg viewBox='0 0 100 100' aria-hidden='true' focusable='false'>${inner}</svg>`;
const star = (col, x = 0, y = 0, s = 1) => `<polygon transform='translate(${x},${y}) scale(${s})' points='50,10 61,38 92,38 67,56 77,86 50,68 23,86 33,56 8,38 39,38' fill='${col}'/>`;
const planet = (col, ring) => (ring ? e(50, 52, 44, 10, 'none', `stroke='${ring}' stroke-width='5' transform='rotate(-18 50 52)'`) : '') + c(50, 50, 26, col) + e(44, 42, 14, 4, '#fff', "opacity='.3'") + (ring ? ln('M10 60Q50 70 90 44', ring, 5) : '');
const face = (x, y, d = 9) => eye(x - d, y, 3) + eye(x + d, y, 3) + smile(x, y + 6, 5);

/* ---------- KOSMOS ---------- */
const kosmos = {
  id: 'kosmos', name: 'Kosmos', short: 'Kosmos',
  css: { '--bg1': '#0d1b4c', '--bg2': '#2b1b6b', '--accent': '#ffd23f', '--accent-ink': '#1b1b2f', '--primary': '#5b3fd6', '--primary-ink': '#ffffff', '--title-ink': '#ffffff' },
  bg: `<svg viewBox='0 0 160 90' preserveAspectRatio='xMidYMid slice' aria-hidden='true'><defs><linearGradient id='kg' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#0d1b4c'/><stop offset='1' stop-color='#3a1f7a'/></linearGradient></defs><rect width='160' height='90' fill='url(#kg)'/>${[[12, 10], [40, 30], [70, 12], [96, 40], [130, 14], [148, 50], [24, 64], [60, 76], [112, 72], [140, 82], [84, 56]].map(([x, y], i) => `<circle cx='${x}' cy='${y}' r='${i % 3 ? 0.6 : 1}' fill='#fff' opacity='.8'/>`).join('')}<circle cx='134' cy='24' r='9' fill='#f2b632'/><ellipse cx='134' cy='25' rx='15' ry='3' fill='none' stroke='#ffd978' stroke-width='1.5' transform='rotate(-18 134 25)'/><circle cx='24' cy='72' r='12' fill='#e0533d' opacity='.9'/><circle cx='21' cy='69' r='3' fill='#c0392b'/></svg>`,
  mascots: [
    { name: 'Zielek', bio: 'Zielony kosmita, uwielbia czytać gwiazdy.', svg: wrap(ln('M36 20L30 6M64 20L70 6', '#2e9e4f', 3) + c(30, 6, 4, '#ffd23f') + c(70, 6, 4, '#ffd23f') + e(50, 56, 32, 36, '#5fd07a') + e(50, 62, 18, 20, '#a7ecb5') + c(38, 46, 9, '#fff') + c(62, 46, 9, '#fff') + c(39, 47, 4, '#222') + c(61, 47, 4, '#222') + smile(50, 66, 8)) },
    { name: 'Pyłek', bio: 'Malutki fioletowy kosmita z jednym okiem.', svg: wrap(p('M20 70Q14 30 50 24Q86 30 80 70Q80 92 50 92Q20 92 20 70z', '#b57cf0') + c(50, 50, 16, '#fff') + c(50, 52, 8, '#222') + c(53, 49, 3, '#fff') + smile(50, 74, 8) + ln('M40 24L34 10M60 24L66 10', '#8a4fd0', 3) + c(34, 10, 4, '#ff7aa8') + c(66, 10, 4, '#ff7aa8')) },
    { name: 'Rakieta Iskra', bio: 'Mała rakieta, która lubi zdania.', svg: wrap(p('M50 6Q74 28 70 70H30Q26 28 50 6z', '#f4f4f8', "stroke='#99a' stroke-width='2'") + p('M50 6Q62 16 66 34H34Q38 16 50 6z', '#e53935') + c(50, 48, 10, '#8fd3f4', "stroke='#556' stroke-width='3'") + p('M30 54L14 76l16-6zM70 54l16 22-16-6z', '#e53935') + p('M38 70h24l-12 24z', '#ffb300') + p('M44 70h12l-6 14z', '#fff2a0')) },
  ],
  items: [
    { name: 'Czerwona planeta', svg: wrap(planet('#e0533d')) },
    { name: 'Planeta z pierścieniem', svg: wrap(planet('#f2b632', '#fff0b0')) },
    { name: 'Gwiazdka', svg: wrap(star('#ffd23f')) },
    { name: 'Księżyc', svg: wrap(p('M60 10A42 42 0 1 0 90 62A34 34 0 1 1 60 10z', '#f3e08a')) },
    { name: 'Niebieska planeta', svg: wrap(planet('#3a8fe0') + p('M38 40q10-6 14 4t-8 12q-10-4-6-16z', '#4cc07a')) },
    { name: 'Kometa', svg: wrap(p('M70 34L8 90 52 28z', '#bfe3ff', "opacity='.8'") + c(70, 34, 15, '#fff3b0')) },
    { name: 'Słońce', svg: wrap(ln('M50 8v14M50 78v14M8 50h14M78 50h14M20 20l10 10M70 70l10 10M80 20L70 30M30 70L20 80', '#ffb300', 5) + c(50, 50, 22, '#ffc933') + face(50, 48)) },
    { name: 'Latający talerz', svg: wrap(e(50, 60, 40, 13, '#9aa5b1') + p('M28 58Q50 8 72 58z', '#8fd3f4') + c(28, 62, 3.5, '#ffd23f') + c(50, 66, 3.5, '#ffd23f') + c(72, 62, 3.5, '#ffd23f')) },
    { name: 'Satelita', svg: wrap(r(40, 38, 20, 24, '#c7ccd4', 3) + r(6, 44, 30, 12, '#2f6fd0') + r(64, 44, 30, 12, '#2f6fd0') + ln('M50 38V22', '#999', 3) + c(50, 20, 4, '#e53935')) },
    { name: 'Hełm astronauty', svg: wrap(c(50, 50, 34, '#f4f4f8', "stroke='#99a' stroke-width='3'") + e(50, 50, 24, 20, '#26376b') + e(42, 44, 7, 4, '#fff', "opacity='.5'")) },
    { name: 'Mała rakieta', svg: wrap(p('M50 8Q70 30 66 68H34Q30 30 50 8z', '#fff', "stroke='#99a' stroke-width='2'") + c(50, 42, 8, '#8fd3f4') + p('M34 54L20 74l14-4zM66 54l14 20-14-6z', '#e53935') + p('M42 68h16l-8 22z', '#ffb300')) },
    { name: 'Gwiazdozbiór', svg: wrap(star('#fff7a8', -2, -6, 0.5) + star('#ffd23f', 38, 24, 0.5) + star('#fff7a8', 6, 46, 0.4) + ln('M22 30L58 46L30 70', '#ffffff66', 2)) },
  ],
};

/* ---------- DŻUNGLA ---------- */
const leaf = (col = '#2e9e4f') => p('M50 94Q8 70 14 20Q60 14 86 52Q80 82 50 94z', col) + ln('M50 94Q40 56 20 26', '#1b6b36', 3);
const jungle = {
  id: 'dzungla', name: 'Zwierzątka z dżungli', short: 'Dżungla',
  css: { '--bg1': '#0f4d2a', '--bg2': '#1d7a3d', '--accent': '#ffd23f', '--accent-ink': '#1b2f1b', '--primary': '#1f8a4c', '--primary-ink': '#ffffff', '--title-ink': '#ffffff' },
  bg: `<svg viewBox='0 0 160 90' preserveAspectRatio='xMidYMid slice' aria-hidden='true'><defs><linearGradient id='jg' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#bfe9a8'/><stop offset='.35' stop-color='#3a9d52'/><stop offset='1' stop-color='#0f4d2a'/></linearGradient></defs><rect width='160' height='90' fill='url(#jg)'/><circle cx='128' cy='16' r='9' fill='#fff7b0' opacity='.9'/><g fill='#1b6b36'><path d='M0 0h30q-6 24-30 34z'/><path d='M160 0h-34q10 26 34 40z'/><path d='M0 90V64q22-14 40 8l14 18z' opacity='.8'/><path d='M160 90V62q-26-10-40 10l-10 18z' opacity='.8'/></g><g stroke='#2f7a3c' stroke-width='1.2' fill='none'><path d='M30 0q8 20 2 40'/><path d='M126 0q-6 24 4 44'/></g><circle cx='32' cy='41' r='2.5' fill='#ffb300'/><circle cx='130' cy='45' r='2.5' fill='#ff7aa8'/></svg>`,
  mascots: [
    { name: 'Małpka Figa', bio: 'Zwinna małpka, która czyta na gałęzi.', svg: wrap(c(16, 54, 11, '#8a5a2b') + c(84, 54, 11, '#8a5a2b') + c(16, 54, 6, '#f1c9a0') + c(84, 54, 6, '#f1c9a0') + c(50, 54, 32, '#8a5a2b') + e(50, 62, 22, 18, '#f1c9a0') + e(38, 46, 11, 12, '#f1c9a0') + e(62, 46, 11, 12, '#f1c9a0') + eye(38, 48) + eye(62, 48) + c(46, 62, 2, '#6b4226') + c(54, 62, 2, '#6b4226') + smile(50, 68, 8)) },
    { name: 'Tukan Dziobek', bio: 'Tukan z wielkim kolorowym dziobem.', svg: wrap(e(40, 56, 28, 34, '#222') + e(40, 66, 16, 22, '#fff') + c(36, 38, 14, '#222') + c(34, 36, 6, '#fff') + c(35, 36, 3, '#222') + p('M44 34Q80 30 92 52Q70 60 44 50z', '#ff9800') + p('M44 44Q76 44 92 52Q70 60 44 50z', '#e65100') + ln('M44 44Q70 42 90 50', '#ffd23f', 2)) },
    { name: 'Słonik Trąbek', bio: 'Mały słonik, który zna wszystkie sylaby.', svg: wrap(c(18, 46, 17, '#8fb0d6') + c(82, 46, 17, '#8fb0d6') + c(18, 46, 10, '#f4b6c2') + c(82, 46, 10, '#f4b6c2') + c(50, 48, 30, '#a9c4e4') + p('M40 62h20v22q0 8-8 8t-8-8z', '#a9c4e4') + ln('M42 72h16M42 80h16', '#8fb0d6', 2) + eye(40, 44, 3.5) + eye(60, 44, 3.5) + c(34, 54, 4, '#f4b6c2', "opacity='.7'") + c(66, 54, 4, '#f4b6c2', "opacity='.7'")) },
  ],
  items: [
    { name: 'Banan', svg: wrap(p('M20 24Q22 70 74 84Q90 78 86 70Q50 66 34 22z', '#ffd93b', "stroke='#c9a100' stroke-width='3'") + p('M20 24l8-8 8 8z', '#6b4a1a')) },
    { name: 'Liść', svg: wrap(leaf()) },
    { name: 'Kwiat', svg: wrap([0, 72, 144, 216, 288].map((a) => e(50, 26, 11, 18, '#ff5c93', `transform='rotate(${a} 50 50)'`)).join('') + c(50, 50, 10, '#ffd23f')) },
    { name: 'Motyl', svg: wrap(e(30, 38, 22, 24, '#ff9f1c') + e(70, 38, 22, 24, '#ff9f1c') + e(34, 68, 15, 16, '#ffd23f') + e(66, 68, 15, 16, '#ffd23f') + r(46, 30, 8, 50, '#4a2f1a', 4) + c(34, 38, 6, '#fff') + c(66, 38, 6, '#fff') + ln('M48 30L40 16M52 30L60 16', '#4a2f1a', 2)) },
    { name: 'Ślimak', svg: wrap(e(46, 78, 42, 10, '#d9c28a') + c(48, 50, 26, '#c8742e') + c(48, 50, 16, '#e0a060') + c(48, 50, 6, '#c8742e') + ln('M78 76L82 44M86 76L92 48', '#d9c28a', 4) + c(82, 42, 4, '#222') + c(92, 46, 4, '#222')) },
    { name: 'Grzybek', svg: wrap(r(38, 52, 24, 36, '#f4ead2', 8) + p('M10 56Q10 12 50 12Q90 12 90 56z', '#e53935') + c(32, 36, 6, '#fff') + c(60, 28, 7, '#fff') + c(72, 46, 5, '#fff')) },
    { name: 'Biedronka', svg: wrap(c(50, 54, 34, '#e53935') + p('M50 20Q70 14 80 30L50 54z', '#c62828', "opacity='.0'") + ln('M50 22V88', '#222', 3) + c(50, 22, 14, '#222') + c(34, 48, 5, '#222') + c(66, 48, 5, '#222') + c(36, 68, 5, '#222') + c(64, 68, 5, '#222')) },
    { name: 'Mango', svg: wrap(p('M50 14Q92 20 82 64Q70 94 40 84Q10 70 20 40Q28 16 50 14z', '#ffa630') + p('M60 20Q80 24 80 50Q70 30 60 20z', '#ff6f3c', "opacity='.5'") + p('M50 14q6-10 18-8-2 10-18 8z', '#2e9e4f')) },
    { name: 'Gąsienica', svg: wrap([16, 34, 52, 70].map((x, i) => c(x, 62 - (i % 2) * 6, 13, i % 2 ? '#8fd16a' : '#5cb85c')).join('') + c(84, 56, 14, '#ffd23f') + eye(88, 52, 2.5) + smile(84, 62, 4) + ln('M80 44L74 32M88 44l4-12', '#4a2f1a', 2)) },
    { name: 'Kropla rosy', svg: wrap(leaf('#4ab86c') + p('M50 30C50 30 34 52 34 62a16 16 0 0 0 32 0C66 52 50 30 50 30z', '#9fe0ff', "stroke='#3aa0e8' stroke-width='2'")) },
    { name: 'Ananas', svg: wrap(p('M50 4l8 18-8-4-8 4zM36 14l12 10-10-2zM64 14L52 24l10-2z', '#2e9e4f') + e(50, 62, 26, 32, '#ffb300') + ln('M30 50l40 24M30 66l40 24M70 50L30 74M70 66L36 88', '#c97f00', 2.5)) },
    { name: 'Papuzie pióro', svg: wrap(p('M50 6Q90 40 56 94Q44 94 44 80Q22 50 50 6z', '#e53935') + p('M50 18Q76 44 54 80Q40 60 50 18z', '#ffd23f') + ln('M50 8V96', '#3a8a3a', 3)) },
  ],
};

/* ---------- WYSPY PALMOWE (pingwiny z własnymi imionami) ---------- */
const penguin = (body, belly, extra) => c(50, 54, 32, body).replace('/>', '/>') + e(50, 62, 20, 26, belly) + c(40, 42, 9, '#fff') + c(60, 42, 9, '#fff') + eye(41, 43, 3.5) + eye(59, 43, 3.5) + p('M43 50h14l-7 9z', '#ff8a00') + p('M14 60q-8 18 8 16zM86 60q8 18-8 16z', body) + e(38, 92, 10, 4, '#ff8a00') + e(62, 92, 10, 4, '#ff8a00') + (extra || '');
const sea = {
  id: 'wyspy', name: 'Pingwiny z Wysp Palmowych', short: 'Wyspy Palmowe',
  css: { '--bg1': '#0b6fa8', '--bg2': '#35b6d9', '--accent': '#ffd23f', '--accent-ink': '#102a3a', '--primary': '#0a7ea4', '--primary-ink': '#ffffff', '--title-ink': '#ffffff' },
  bg: `<svg viewBox='0 0 160 90' preserveAspectRatio='xMidYMid slice' aria-hidden='true'><defs><linearGradient id='sg' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#9be0f5'/><stop offset='.55' stop-color='#3fb8dc'/><stop offset='1' stop-color='#0b6fa8'/></linearGradient></defs><rect width='160' height='90' fill='url(#sg)'/><circle cx='24' cy='16' r='9' fill='#fff2a0'/><path d='M0 66q20-6 40 0t40 0 40 0 40 0V90H0z' fill='#0b6fa8' opacity='.55'/><path d='M40 90Q70 62 120 90z' fill='#f3d99b'/><path d='M96 80Q96 50 104 38' stroke='#7a4a2a' stroke-width='3' fill='none'/><path d='M104 38q-14-6-20 4q10-8 20-4zM104 38q14-6 20 4q-10-8-20-4zM104 38q-4-14-14-14q8 4 14 14zM104 38q6-12 16-12q-10 2-16 12z' fill='#2e9e4f' stroke='#2e9e4f' stroke-width='2'/><circle cx='102' cy='42' r='2.5' fill='#7a4a2a'/><circle cx='107' cy='42' r='2.5' fill='#7a4a2a'/></svg>`,
  mascots: [
    { name: 'Kapitan Pik', bio: 'Dowódca pingwiniej drużyny, w czapce żeglarza.', svg: wrap(penguin('#1f4e79', '#fff3c4', p('M30 22Q50 2 70 22z', '#fff', "stroke='#ccc' stroke-width='2'") + r(28, 20, 44, 6, '#e53935', 3) + c(50, 11, 3, '#ffd23f'))) },
    { name: 'Fiku', bio: 'Najmniejszy pingwin z liściastym kapeluszem.', svg: wrap(penguin('#2a6b6b', '#e8f7a8', p('M30 26Q50 -2 70 26Q50 20 30 26z', '#4ab86c') + ln('M50 24V8', '#2e7d32', 2))) },
    { name: 'Bryza', bio: 'Pingwinka w okularach i z czerwonym szalikiem.', svg: wrap(penguin('#4b3a8c', '#ffe0ef', c(40, 43, 12, 'none', "stroke='#222' stroke-width='2'") + c(60, 43, 12, 'none', "stroke='#222' stroke-width='2'") + ln('M52 43h-4', '#222', 2) + r(26, 66, 48, 8, '#e53935', 4) + r(60, 66, 8, 18, '#e53935', 3))) },
    { name: 'Lew Grzywacz', bio: 'Lew o wielkim sercu i jeszcze większej grzywie.', svg: wrap([...Array(10)].map((_, i) => c(50 + 36 * Math.cos(i * 0.628), 50 + 36 * Math.sin(i * 0.628), 13, '#c9731f')).join('') + c(50, 52, 29, '#f2b04c') + c(34, 30, 8, '#f2b04c') + c(66, 30, 8, '#f2b04c') + eye(40, 48, 3.5) + eye(60, 48, 3.5) + e(50, 62, 11, 8, '#fff3d6') + p('M45 56h10l-5 6z', '#7a3a10') + smile(50, 66, 5)) },
    { name: 'Tupi', bio: 'Zwinny lemur z pręgowanym ogonem.', svg: wrap(ln('M80 80Q100 60 88 34Q82 50 70 56', '#8a8a96', 12) + [0, 1, 2, 3].map((i) => ln(`M${92 - i * 1} ${70 - i * 12}l8 -2`, '#2b2b36', 4)).join('') + c(50, 54, 28, '#a9a9b6') + c(24, 38, 10, '#a9a9b6') + c(76, 38, 10, '#a9a9b6') + e(50, 62, 18, 16, '#f2f2f6') + e(38, 46, 11, 13, '#2b2b36') + e(62, 46, 11, 13, '#2b2b36') + c(38, 47, 5, '#ffd23f') + c(62, 47, 5, '#ffd23f') + eye(38, 47, 2) + eye(62, 47, 2) + c(50, 58, 4, '#2b2b36') + smile(50, 66, 5)) },
  ],
  items: [
    { name: 'Palma', svg: wrap(p('M46 94Q50 60 56 36L62 36Q56 62 58 94z', '#8a5a2b') + p('M58 36q-26-4-40 14q20-12 40-14zM58 36q26-4 38 16q-20-14-38-16zM58 36q-16-24-34-14q22-2 34 14zM58 36q16-22 34-12q-22 0-34 12z', '#2e9e4f', "stroke='#2e9e4f' stroke-width='2'") + c(54, 40, 4, '#7a4a2a') + c(62, 40, 4, '#7a4a2a')) },
    { name: 'Kokos', svg: wrap(c(50, 52, 34, '#7a4a2a') + c(40, 44, 4, '#2b1a0e') + c(56, 42, 4, '#2b1a0e') + c(48, 56, 4, '#2b1a0e') + e(38, 34, 8, 4, '#fff', "opacity='.3'")) },
    { name: 'Muszelka', svg: wrap(p('M10 70Q10 20 50 16Q90 20 90 70Q50 90 10 70z', '#ffb7c5', "stroke='#e58aa0' stroke-width='3'") + ln('M50 20V78M32 26L38 76M68 26L62 76M20 40l10 34M80 40L70 74', '#e58aa0', 2.5) + r(34, 76, 32, 10, '#ffb7c5', 5)) },
    { name: 'Rozgwiazda', svg: wrap(star('#ff8a3c') + c(50, 48, 4, '#ffd9b0') + c(40, 36, 2, '#ffd9b0') + c(60, 36, 2, '#ffd9b0')) },
    { name: 'Rybka', svg: wrap(e(44, 50, 30, 20, '#ffc233') + p('M68 50L94 30V70z', '#ff9f1c') + c(28, 45, 4, '#fff') + c(28, 45, 2, '#222') + ln('M48 34q8 16 0 32', '#fff', 3)) },
    { name: 'Kotwica', svg: wrap(c(50, 18, 8, 'none', "stroke='#37474f' stroke-width='6'") + ln('M50 26V86M30 40h40M16 62Q20 86 50 88Q80 86 84 62', '#37474f', 6) + p('M10 60l10 8 6-14zM90 60L80 68 74 54z', '#37474f')) },
    { name: 'Mapa skarbów', svg: wrap(p('M10 18l26 8 28-8 26 8V84L64 76 36 84 10 76z', '#f0d9a0', "stroke='#b8914a' stroke-width='3'") + ln('M24 60Q40 40 50 56T76 38', '#c0392b', 3) + ln('M70 34l10 10M80 34L70 44', '#c0392b', 4)) },
    { name: 'Łódka', svg: wrap(p('M10 64h80q-10 24-36 24T10 64z', '#e53935') + ln('M50 10V64', '#7a4a2a', 4) + p('M54 12Q84 28 80 56H54z', '#fff', "stroke='#ccc' stroke-width='2'") + p('M46 24Q26 36 24 56h22z', '#ffd23f')) },
    { name: 'Fala', svg: wrap(p('M6 70Q24 28 50 44Q70 56 62 70Q80 60 94 70V90H6z', '#3fb8dc') + ln('M10 78q20-10 40 0t40 0', '#fff', 3)) },
    { name: 'Krab Klik', svg: wrap(ln('M24 66L10 74M30 74L18 86M76 66l14 8M70 74l12 12', '#e0533d', 5) + e(50, 62, 30, 20, '#e0533d') + ln('M30 52Q18 36 26 24M70 52Q82 36 74 24', '#e0533d', 5) + c(26, 22, 8, '#e0533d') + c(74, 22, 8, '#e0533d') + c(40, 50, 6, '#fff') + c(60, 50, 6, '#fff') + eye(40, 50, 2.5) + eye(60, 50, 2.5) + smile(50, 66, 8)) },
    { name: 'Słoneczko', svg: wrap(ln('M50 6v14M50 80v14M6 50h14M80 50h14M18 18l10 10M72 72l10 10M82 18L72 28M28 72L18 82', '#ffb300', 5) + c(50, 50, 24, '#ffd23f')) },
    { name: 'Latarnia', svg: wrap(p('M36 90L42 34h16l6 56z', '#fff', "stroke='#ccc' stroke-width='2'") + p('M39 56h22l1 12H38zM42 34h16l-1 10H43z', '#e53935') + r(40, 20, 20, 14, '#ffe680', 2) + p('M36 20h28l-14-12z', '#37474f') + ln('M30 26L8 20M70 26l22-6', '#ffe680', 3)) },
  ],
};

export const WORLDS = { kosmos, dzungla: jungle, wyspy: sea };
export const WORLD_IDS = Object.keys(WORLDS);
export const DEFAULT_WORLD = 'kosmos';
