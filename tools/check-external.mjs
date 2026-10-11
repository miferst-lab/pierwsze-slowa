#!/usr/bin/env node
// Sprawdza, że pliki aplikacji nie odwołują się do niczego spoza własnej domeny.
// Szuka http://, https://, adresów względnych protokołu ("//host"), @import/url() z hostem.
// Wyjątki: xmlns="http://www.w3.org/..." oraz linie będące samym komentarzem.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const SKIP = new Set(['node_modules', '.git', 'tests', 'tools', 'docs', 'README.md', 'package.json', 'package-lock.json']);
const EXT = /\.(html|css|js|mjs|svg|json|webmanifest)$/;
const walk = (d) => readdirSync(d).flatMap((n) => (SKIP.has(n) ? [] : (p => (statSync(p).isDirectory() ? walk(p) : [p]))(join(d, n))));
const isComment = (line) => /^\s*(\/\/|\/\*|\*|<!--)/.test(line);
const PATTERNS = [
  [/https?:\/\/[^\s'"`)<>]+/gi, 'adres http(s)'],
  [/(?:src|href|action)\s*=\s*["']\/\/[^"']+/gi, 'adres względny protokołu'],
  [/@import\s+(?:url\()?["']?(?:https?:)?\/\//gi, '@import z hostem'],
  [/\b(?:wss?):\/\//gi, 'websocket'],
];
const problems = [];
for (const file of walk(root).filter((f) => EXT.test(f))) {
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (isComment(line)) return;
    const cleaned = line.replace(/xmlns(:\w+)?\s*=\s*["']http:\/\/www\.w3\.org\/[^"']*["']/g, '');
    for (const [re, what] of PATTERNS) for (const m of cleaned.matchAll(re)) problems.push(`${relative(root, file)}:${i + 1}: ${what}: ${m[0].slice(0, 80)}`);
  });
}
if (problems.length) { console.error('ZNALEZIONO ZEWNĘTRZNE ODWOŁANIA:\n' + problems.join('\n')); process.exit(1); }
console.log('OK: brak zewnętrznych adresów w plikach aplikacji.');
