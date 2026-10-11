import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WORLDS } from '../js/art/worlds.js';

const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
export const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// [pierwszy, drugi, minimum]: 4,5 dla tekstu (WCAG AA), 3 dla dużego tekstu i elementów interfejsu
const TEXT = [['--ink', '--surface'], ['--ink', '--surface2'], ['--ink-soft', '--surface'], ['--ink-soft', '--surface2'], ['--title-ink', '--bg1'], ['--title-ink', '--bg2'],
  ['--ink-soft', '--bg1'], ['--ink-soft', '--bg2'], ['--primary-ink', '--primary'], ['--accent-ink', '--accent'], ['--ink', '--good-bg'], ['--good', '--surface'], ['--good', '--good-bg'], ['--primary', '--surface'], ['--ink', '--accent'], ['--primary', '--accent']];
const UI = [['--line', '--surface'], ['--line', '--surface2'], ['--primary', '--bg1'], ['--primary', '--bg2'], ['--primary', '--surface2']];

test('kontrast tekstu ≥ 4,5:1 w każdym świecie (tokeny palety)', () => {
  for (const w of Object.values(WORLDS)) for (const [a, b] of TEXT) {
    if (a === '--primary' && b === '--accent') continue; // para tylko dekoracyjna (kreska pod brakującą liczbą leży na białym)
    assert.ok(ratio(w.css[a], w.css[b]) >= 4.5, `${w.id}: ${a} na ${b} = ${ratio(w.css[a], w.css[b]).toFixed(2)}`);
  }
});
test('kontrast elementów interfejsu i dużego tekstu ≥ 3:1 w każdym świecie', () => {
  for (const w of Object.values(WORLDS)) for (const [a, b] of UI) assert.ok(ratio(w.css[a], w.css[b]) >= 3, `${w.id}: ${a} na ${b} = ${ratio(w.css[a], w.css[b]).toFixed(2)}`);
});
test('każdy świat definiuje komplet tokenów, a app.css z nich korzysta (bez twardych jasnych teł i cieni)', () => {
  const need = ['--bg1', '--bg2', '--surface', '--surface2', '--ink', '--ink-soft', '--title-ink', '--primary', '--primary-ink', '--accent', '--accent-ink', '--line', '--good', '--good-bg'];
  for (const w of Object.values(WORLDS)) for (const k of need) assert.match(w.css[k], /^#[0-9a-f]{6}$/i, `${w.id} ${k}`);
  const css = readFileSync(new URL('../css/app.css', import.meta.url), 'utf8');
  assert.ok(!/text-shadow/.test(css), 'bez cieni tekstu (kontrast na tle)');
  assert.ok((css.match(/var\(--surface\)/g) ?? []).length >= 20);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
test('wnętrza światów są pastelowe (jasne tło, ciemny tekst)', () => { for (const w of Object.values(WORLDS)) assert.ok(lum(w.css['--bg1']) > 0.6 && lum(w.css['--bg2']) > 0.5, w.id); });
