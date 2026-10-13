// Prosty, przyjazny rysunek buzi w przekroju z boku (twarz zwrócona w prawo) oraz buzi z przodu do ćwiczeń.
// To ilustracja ogólna – pomoc w zabawie, nie schemat medyczny. Animacje: css/pron.css.
// Ułożenie dla każdej głoski: kształt języka (shape), usta (lips: round = dzióbek, smile = uśmiech, open = lekko otwarte),
// stop = najpierw język dotyka (zwarcie), potem puszcza powietrze; voiced = „brzęczy” gardło.
export const ARTIC = {
  r: { shape: 'r', lips: 'open', vib: true, say: 'Czubek języka idzie do góry, za górne zęby, i drży.' },
  sz: { shape: 'sz', lips: 'round', say: 'Czubek języka do góry, usta w dzióbek, powietrze szumi.' },
  cz: { shape: 'sz', lips: 'round', stop: true, say: 'Język dotyka góry, potem puszcza powietrze. Usta w dzióbek.' },
  zrz: { shape: 'sz', lips: 'round', voiced: true, say: 'Jak SZ, a gardło brzęczy.' },
  dz2: { shape: 'sz', lips: 'round', stop: true, voiced: true, say: 'Jak CZ, a gardło brzęczy.' },
  c: { shape: 'c', lips: 'smile', stop: true, say: 'Uśmiech, czubek języka na dole za zębami. Język dotyka zębów i puszcza powietrze.' },
  dz: { shape: 'c', lips: 'smile', stop: true, voiced: true, say: 'Jak C, a gardło brzęczy: bzz!' },
  s2: { shape: 'ś', lips: 'smile', say: 'Uśmiech, środek języka wysoko do podniebienia, cichy szum.' },
  c2: { shape: 'ś', lips: 'smile', stop: true, say: 'Środek języka dotyka podniebienia, potem puszcza powietrze.' },
  z2: { shape: 'ś', lips: 'smile', voiced: true, say: 'Jak Ś, a gardło brzęczy.' },
  dz3: { shape: 'ś', lips: 'smile', stop: true, voiced: true, say: 'Jak Ć, a gardło brzęczy.' },
};
// Język jako funkcja kilku punktów: zawsze ta sama lista poleceń ścieżki, więc da się płynnie animować (SMIL).
const T = (tx, ty, blade, mid) => `M112 204 C130 ${mid + 34} 168 ${mid} 210 ${mid} C250 ${mid} 270 ${blade} ${tx - 14} ${ty + 6} Q${tx + 6} ${ty - 4} ${tx + 2} ${ty + 14} C${tx - 4} ${ty + 40} 292 200 250 206 L112 206 Z`;
const REST = T(294, 170, 168, 156);
const TARGET = { r: T(296, 92, 112, 146), sz: T(286, 92, 104, 156), c: T(298, 158, 120, 142), ś: T(296, 166, 124, 90) };
const CONTACT = { sz: T(290, 82, 94, 146), c: T(298, 140, 104, 138), ś: T(296, 166, 122, 70) };
const DUR = '8s';

/** Rysunek buzi z boku (duży, z podpisami) + buzia z przodu (dla głosek, gdzie liczy się kształt ust) + kroki ruchu. */
export function mouthFigure(soundId, { anim = true } = {}) {
  const a = ARTIC[soundId] ?? ARTIC.r;
  return `<div class='mouth-wrap' data-sound='${soundId}'>${mouthSvg(soundId, { anim })}${a.lips !== 'open' ? lipsSvg(a.lips, { anim }) : ''}</div>
<ol class='mouth-steps${a.stop ? ' stop' : ''}' aria-label='Kroki'><li>spokój</li><li>${a.stop ? 'dotknij' : 'ruch'}</li><li>${a.stop ? 'puść powietrze' : a.vib ? 'drży!' : 'głoska'}</li></ol>
<p class='mouth-say'>${a.say}</p>`;
}

export function mouthSvg(soundId = 'r', { anim = true } = {}) {
  const a = ARTIC[soundId] ?? ARTIC[{ cz: 'cz', ś: 's2' }[soundId]] ?? ARTIC.r;
  const target = TARGET[a.shape], contact = CONTACT[a.shape];
  const kt = a.stop ? '0;0.25;0.4;0.5;0.56;0.875;1' : '0;0.25;0.44;0.875;1';
  const vals = a.stop ? [REST, REST, contact, contact, target, target, REST] : [REST, REST, target, target, REST];
  const onKt = a.stop ? '0;0.56;0.875;1' : '0;0.44;0.875;1', on = '0;1;0;0';
  const tongue = anim ? `<path class='tg' d='${REST}'><animate attributeName='d' dur='${DUR}' repeatCount='indefinite' keyTimes='${kt}' values='${vals.join(';')}'/></path>` : `<path class='tg' d='${target}'/>`;
  const show = (inner, cls, kts = onKt, v = on, still = true) => (anim ? `<g class='${cls}' opacity='0'><animate attributeName='opacity' dur='${DUR}' repeatCount='indefinite' keyTimes='${kts}' values='${v}' calcMode='discrete'/>${inner}</g>` : still ? `<g class='${cls}'>${inner}</g>` : '');
  const lipsX = a.lips === 'round' ? 14 : a.lips === 'smile' ? -4 : 0;
  const jaw = a.lips === 'smile' ? -14 : 0; // przy uśmiechu zęby bliżej siebie
  const tip = (a.shape === 'c' || a.shape === 'ś') ? [300, 150] : [298, 96];
  const air = a.shape === 'r' ? '' : show(`<path d='M332 128 h52' stroke='#1f5fd0' stroke-width='7' stroke-linecap='round'/><path d='M378 116 l16 12 l-16 12' fill='none' stroke='#1f5fd0' stroke-width='7' stroke-linecap='round' stroke-linejoin='round'/><text x='346' y='108' class='lbl air-l'>powietrze</text>`, 'air');
  const vib = a.vib ? show(`<path d='M304 74 l8 -8 l8 8 l8 -8 M304 120 l8 8 l8 -8 l8 8' fill='none' stroke='#1f5fd0' stroke-width='4' stroke-linecap='round'/><text x='330' y='62' class='lbl'>drży!</text>`, 'vib') : '';
  const buzz = a.voiced ? `<g class='buzz'><path d='M70 196 q-10 9 0 18 q10 9 0 18 M54 192 q-12 11 0 22 q12 11 0 22' fill='none' stroke='#7a3fd0' stroke-width='5' stroke-linecap='round'/><text x='18' y='254' class='lbl voice'>gardło: bzzz</text></g>` : '';
  const stopMark = a.stop ? show(`<circle cx='${tip[0] - 6}' cy='${tip[1] - 8}' r='9' fill='#ffd24a' stroke='#8a5a00' stroke-width='3'/><text x='${tip[0] - 10}' y='${tip[1] - 3}' font-size='13' font-weight='900' fill='#5a3a00'>!</text>`, 'stopm', '0;0.4;0.55;1', '0;1;0;0') : '';
  const moveArrow = show(`<path d='M300 176 Q330 ${a.shape === 'c' ? 168 : a.shape === 'ś' ? 150 : 140} ${a.shape === 'ś' ? 230 : 306} ${a.shape === 'ś' ? 100 : a.shape === 'c' ? 150 : 104}' fill='none' stroke='#e07a10' stroke-width='5' stroke-dasharray='8 6' stroke-linecap='round' marker-end='url(#ah)'/>`, 'move', '0;0.22;0.46;1', '0;1;0;0', false);
  return `<svg class='mouth-svg' data-sound='${soundId}' viewBox='0 0 420 262' role='img' aria-label='Buzia z boku: ${a.say}'>
<defs><marker id='ah' viewBox='0 0 10 10' refX='6' refY='5' markerWidth='5' markerHeight='5' orient='auto'><path d='M0 0 L10 5 L0 10 Z' fill='#e07a10'/></marker></defs>
<path d='M30 262 L36 120 Q48 28 172 22 Q300 18 346 70 Q364 92 354 112 L364 126 Q368 142 354 152 L358 178 Q342 218 282 226 L210 230 Q150 232 132 262 Z' fill='#ffe0c2' stroke='#7a5236' stroke-width='4'/>
<path d='M114 204 L114 98 Q160 64 232 60 Q292 62 320 86 L320 ${178 + jaw} Q292 ${206 + jaw} 220 206 Z' fill='#4a1420'/>
<path class='palate' d='M118 98 Q160 68 232 64 Q284 66 306 84' fill='none' stroke='#ff9fb2' stroke-width='12' stroke-linecap='round'/>
${tongue}
<rect class='teeth' x='300' y='84' width='20' height='32' rx='6'/>
<rect class='teeth' x='300' y='${146 + jaw}' width='20' height='30' rx='6'/>
<g transform='translate(${lipsX} 0)'><path class='lip' d='M318 76 Q350 72 356 94 Q350 118 320 112 Z'/><path class='lip' d='M320 ${142 + jaw} Q352 ${136 + jaw} 358 ${158 + jaw} Q350 ${184 + jaw} 320 ${178 + jaw} Z'/></g>
${air}${vib}${buzz}${stopMark}${moveArrow}
<g class='labels'><path d='M200 46 L200 62' class='lead'/><text x='150' y='40' class='lbl'>podniebienie</text>
<path d='M170 222 L178 184' class='lead'/><text x='140' y='242' class='lbl'>język</text>
<path d='M322 100 L384 76' class='lead'/><text x='374' y='70' class='lbl' text-anchor='middle'>zęby</text>
<path d='M${354 + lipsX} ${168 + jaw} L392 ${196}' class='lead'/><text x='392' y='212' class='lbl' text-anchor='middle'>wargi</text></g>
</svg>`;
}

/** Usta z przodu: neutralne -> dzióbek / uśmiech (w tym samym rytmie co rysunek z boku). */
export function lipsSvg(kind, { anim = true } = {}) {
  const target = kind === 'round'
    ? `<ellipse cx='80' cy='86' rx='30' ry='26' fill='#e8475f' stroke='#8a2030' stroke-width='4'/><ellipse cx='80' cy='86' rx='11' ry='9' fill='#4a1420'/><rect x='73' y='78' width='14' height='5' rx='2' fill='#fff'/>`
    : `<path d='M30 80 Q80 66 130 80 Q80 112 30 80 Z' fill='#e8475f' stroke='#8a2030' stroke-width='4' stroke-linejoin='round'/><path d='M42 82 Q80 74 118 82 Q80 98 42 82 Z' fill='#fff' stroke='#bbb' stroke-width='2'/><path d='M42 86 H118' stroke='#bbb' stroke-width='2'/>`;
  const neutral = `<path d='M46 84 Q80 74 114 84 Q80 102 46 84 Z' fill='#e8475f' stroke='#8a2030' stroke-width='4' stroke-linejoin='round'/><path d='M50 85 H110' stroke='#8a2030' stroke-width='3'/>`;
  const sw = (inner, vals) => (anim ? `<g opacity='${vals[0]}'><animate attributeName='opacity' dur='${DUR}' repeatCount='indefinite' keyTimes='0;0.3;0.875;1' values='${vals.join(';')}' calcMode='discrete'/>${inner}</g>` : '');
  return `<svg class='lips-svg' viewBox='0 0 160 170' role='img' aria-label='Usta z przodu: ${kind === 'round' ? 'dzióbek' : 'uśmiech'}'>
<circle cx='80' cy='70' r='66' fill='#ffe0c2' stroke='#7a5236' stroke-width='4'/><circle cx='56' cy='46' r='6' fill='#3a2a22'/><circle cx='104' cy='46' r='6' fill='#3a2a22'/>
${anim ? sw(neutral, [1, 0, 1, 1]) + sw(target, [0, 1, 0, 0]) : target}
<text x='80' y='160' class='lbl' text-anchor='middle'>${kind === 'round' ? 'wargi w dzióbek' : 'uśmiech'}</text></svg>`;
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
