// Prosty, przyjazny rysunek buzi w przekroju z boku (twarz zwrócona w prawo) oraz buzi z przodu do ćwiczeń.
// To ilustracja ogólna – pomoc w zabawie, nie schemat medyczny. Animacje: css/pron.css.
const TONGUE = {
  // czubek języka uniesiony za górne zęby (r) – czubek drży
  r: 'M92 168 C112 150 140 142 164 130 C184 120 198 108 208 99 C216 94 224 100 220 109 C214 122 208 134 200 146 C190 160 172 170 150 172 Z',
  // czubek uniesiony do góry, środek języka lekko wklęsły (sz, cz, ż, dż)
  sz: 'M92 168 C112 156 138 150 160 142 C178 136 192 124 202 108 C208 99 216 98 218 106 C218 118 210 134 198 148 C186 162 170 172 150 172 Z',
  // czubek za dolnymi zębami, języka „płasko” (c, dz)
  c: 'M92 168 C116 156 146 148 170 138 C190 130 206 130 220 138 C226 142 224 152 216 156 C200 164 176 172 150 172 Z',
  // czubek za dolnymi zębami, środek języka wysoko do podniebienia (ś, ć, ź, dź)
  ś: 'M92 168 C110 150 134 124 160 106 C176 96 196 100 206 116 C214 128 220 140 220 148 C214 158 190 168 168 172 L150 172 Z',
};
const AIR = { r: 0, sz: 1, c: 1, ś: 1 };

export function mouthSvg(kind = 'r', { voiced = false } = {}) {
  const t = TONGUE[kind] ?? TONGUE.r;
  const round = kind === 'sz'; // dzióbek
  const lipX = round ? 12 : 0;
  const vib = kind === 'r';
  return `<svg class='mouth-svg' data-kind='${kind}' viewBox='0 0 300 220' role='img' aria-label='Buzia z boku: ${kind === 'r' ? 'czubek języka drży za górnymi zębami' : round ? 'usta w dzióbek, czubek języka u góry' : kind === 'c' ? 'uśmiech, czubek języka za dolnymi zębami' : 'uśmiech, środek języka wysoko'}'>
<path d='M52 200 Q36 110 70 56 Q112 18 190 28 Q248 36 262 86 L262 160 Q258 204 214 206 Z' fill='#ffe3c8' stroke='#b98a66' stroke-width='3'/>
<path d='M78 150 L78 86 Q96 62 150 66 Q196 70 232 84 L236 156 Q200 180 150 180 Q104 180 78 150 Z' fill='#7a2e3a'/>
<path d='M96 76 Q150 56 232 86 L232 92 Q170 74 100 90 Z' fill='#f4a6a6'/>
<g class='tongue'><g class='${vib ? 'vib' : ''}' style='transform-origin:96px 168px'><path d='${t}' fill='#ff7b8f' stroke='#c24a60' stroke-width='3' stroke-linejoin='round'/>${vib ? "<path class='vlines' d='M222 92 q8 -6 14 0 M226 104 q8 -6 14 0 M222 116 q8 -6 14 0' fill='none' stroke='#2f6fd0' stroke-width='3' stroke-linecap='round'/>" : ''}</g></g>
<rect x='222' y='84' width='16' height='26' rx='5' fill='#fff' stroke='#c9b8a8' stroke-width='2'/>
<rect x='224' y='130' width='14' height='24' rx='5' fill='#fff' stroke='#c9b8a8' stroke-width='2'/>
<g class='lips' style='transform:translateX(${lipX}px)'>
<path d='M236 74 Q262 70 268 88 Q262 108 238 104 Z' fill='#f06a7a' stroke='#b8404f' stroke-width='3'/>
<path d='M238 128 Q264 122 270 142 Q262 164 238 158 Z' fill='#f06a7a' stroke='#b8404f' stroke-width='3'/>
</g>
${AIR[kind] ? `<g class='air' fill='none' stroke='#2f6fd0' stroke-width='4' stroke-linecap='round'><path d='M250 116 h22'/><path d='M254 124 h26'/><path d='M250 132 h22'/></g>` : ''}
${voiced ? `<g class='buzz' fill='none' stroke='#8a4fd0' stroke-width='3' stroke-linecap='round'><path d='M60 150 q-8 8 0 16 q8 8 0 16'/><path d='M48 146 q-10 10 0 20 q10 10 0 20'/></g>` : ''}
<text x='66' y='214' font-size='13' fill='#6b5846' font-family='Nunito,Segoe UI,Verdana,sans-serif'>${voiced ? 'gardło „brzęczy”' : ''}</text>
</svg>`;
}

/** Buzia z przodu do ćwiczeń i wiatraczek / zupa. */
export function exerciseSvg(anim) {
  const face = (inner, extra = '') => `<svg class='ex-svg' data-anim='${anim}' viewBox='0 0 240 220' role='img' aria-label='Ilustracja ćwiczenia'><circle cx='120' cy='112' r='88' fill='#ffe3c8' stroke='#b98a66' stroke-width='4'/><circle cx='88' cy='88' r='9' fill='#3a2a22'/><circle cx='152' cy='88' r='9' fill='#3a2a22'/><circle cx='64' cy='122' r='14' fill='#ffb3b3' opacity='.6'/><circle cx='176' cy='122' r='14' fill='#ffb3b3' opacity='.6'/>${inner}${extra}</svg>`;
  switch (anim) {
    case 'usta': return face(`<g class='m-smile'><path d='M82 138 Q120 176 158 138' fill='#7a2e3a' stroke='#b8404f' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'/><rect x='96' y='144' width='48' height='9' rx='3' fill='#fff'/></g><g class='m-pucker'><ellipse cx='120' cy='148' rx='15' ry='12' fill='#7a2e3a' stroke='#e0566a' stroke-width='9'/></g>`);
    case 'balonik': return face(`<ellipse cx='120' cy='150' rx='12' ry='8' fill='#7a2e3a' stroke='#e0566a' stroke-width='5'/>`, `<g class='cheeks'><circle cx='58' cy='132' r='26' fill='#ffd0b0' stroke='#b98a66' stroke-width='3'/><circle cx='182' cy='132' r='26' fill='#ffd0b0' stroke='#b98a66' stroke-width='3'/></g>`);
    case 'koniki': return face(`<path d='M88 138 Q120 168 152 138' fill='#7a2e3a' stroke='#b8404f' stroke-width='5' stroke-linecap='round'/>`, `<g class='tg-up'><ellipse cx='120' cy='142' rx='20' ry='11' fill='#ff7b8f' stroke='#c24a60' stroke-width='3'/></g><text class='klask' x='170' y='70' font-size='20' fill='#6b5846' font-family='Nunito,Segoe UI,sans-serif'>klask!</text>`);
    case 'malarz': return face(`<path d='M84 136 Q120 176 156 136 Z' fill='#7a2e3a' stroke='#b8404f' stroke-width='5' stroke-linejoin='round'/><path d='M92 138 Q120 126 148 138' fill='none' stroke='#f4a6a6' stroke-width='9' stroke-linecap='round'/>`, `<g class='tg-sweep'><ellipse cx='120' cy='158' rx='16' ry='10' fill='#ff7b8f' stroke='#c24a60' stroke-width='3'/></g>`);
    case 'zeby': return face(`<path d='M82 138 Q120 176 158 138 Z' fill='#7a2e3a' stroke='#b8404f' stroke-width='5' stroke-linejoin='round'/><g fill='#fff' stroke='#c9b8a8' stroke-width='2'>${[0, 1, 2, 3, 4, 5].map((i) => `<rect x='${90 + i * 10}' y='139' width='9' height='13' rx='3'/>`).join('')}</g>`, `<circle class='tg-tip' cx='94' cy='156' r='7' fill='#ff7b8f' stroke='#c24a60' stroke-width='3'/>`);
    case 'wiatraczek': return `<svg class='ex-svg' data-anim='wiatraczek' viewBox='0 0 240 220' role='img' aria-label='Wiatraczek kręci się od dmuchania'><path d='M120 120 L120 210' stroke='#8a6a4a' stroke-width='7' stroke-linecap='round'/><g class='pin'><path d='M120 120 L120 54 Q158 56 150 92 Z' fill='#ff7b8f'/><path d='M120 120 L186 120 Q184 158 148 148 Z' fill='#ffd24a'/><path d='M120 120 L120 186 Q82 184 90 148 Z' fill='#4ec3a0'/><path d='M120 120 L54 120 Q56 82 92 92 Z' fill='#6a9bff'/><circle cx='120' cy='120' r='8' fill='#fff' stroke='#6b5846' stroke-width='3'/></g><g class='puffs' fill='none' stroke='#2f6fd0' stroke-width='5' stroke-linecap='round'><path d='M12 112 h36'/><path d='M8 128 h40'/><path d='M12 144 h36'/></g></svg>`;
    case 'zimno': return `<svg class='ex-svg' data-anim='zimno' viewBox='0 0 240 220' role='img' aria-label='Dmuchamy na gorącą zupę, potem na zimne dłonie'><path d='M50 120 h140 q-6 56 -70 56 q-64 0 -70 -56 Z' fill='#f2a24b' stroke='#9a5a1a' stroke-width='5'/><ellipse cx='120' cy='120' rx='70' ry='12' fill='#ffcf7a' stroke='#9a5a1a' stroke-width='4'/><g class='steam' fill='none' stroke='#9aa7b8' stroke-width='5' stroke-linecap='round'><path d='M95 96 q-10 -14 0 -26 q10 -12 0 -24'/><path d='M125 96 q-10 -14 0 -26 q10 -12 0 -24'/><path d='M155 96 q-10 -14 0 -26 q10 -12 0 -24'/></g><g class='puffs' fill='none' stroke='#2f6fd0' stroke-width='5' stroke-linecap='round'><path d='M8 104 h34'/><path d='M4 120 h38'/></g></svg>`;
    default: return face('');
  }
}
