import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const sw = readFileSync(join(root, 'sw.js'), 'utf8');
const shell = [...sw.match(/const SHELL = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? ((n.startsWith('.') || ['node_modules', 'tests', 'tools', 'docs'].includes(n)) ? [] : walk(p)) : [p]; });

test('sw: każdy plik z SHELL istnieje', () => { for (const f of shell) if (f !== './') assert.ok(existsSync(join(root, f)), f); });
test('sw: wszystkie pliki js/css/html są w cache powłoki', () => {
  const files = walk(root).map((p) => relative(root, p)).filter((f) => /\.(js|css|html|svg|json|webp)$/.test(f) && f !== 'sw.js' && f !== 'package.json');
  for (const f of files) assert.ok(shell.includes(f), `brak w SHELL: ${f}`);
});
test('sw: wersja cache jest zdefiniowana i nazwa ma prefiks', () => { assert.match(sw, /const VERSION = 'v\d+'/); assert.match(sw, /pierwsze-slowa-\$\{VERSION\}/); });
test('sw: nagrania audio są cache\'owane leniwie (nie w SHELL), a wiadomość precache-audio obsłużona', () => {
  assert.ok(!shell.some((f) => f.endsWith('.mp3')), 'mp3 nie powinny być w SHELL (ciężki pierwszy start)');
  assert.match(sw, /precache-audio/); assert.match(sw, /status === 200/);
});
