#!/usr/bin/env node
// Uzupełnia listę SHELL w sw.js wszystkimi plikami aplikacji (js/css/html/svg/woff2/json poza tests/tools/docs) i podnosi VERSION (--bump).
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
const root = new URL('..', import.meta.url).pathname;
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? ((n.startsWith('.') || ['node_modules', 'tests', 'tools', 'docs', 'audio'].includes(n)) ? [] : walk(p)) : [p]; });
const files = walk(root).map((p) => relative(root, p)).filter((f) => /\.(js|css|html|svg|json|woff2)$/.test(f) && !['sw.js', 'package.json', 'package-lock.json'].includes(f)).sort();
const list = ['./', ...files, 'audio/manifest.json'].filter((f, i, a) => a.indexOf(f) === i).map((f) => `'${f}'`);
let sw = readFileSync(join(root, 'sw.js'), 'utf8');
sw = sw.replace(/const SHELL = \[[\s\S]*?\];/, `const SHELL = [\n  ${list.join(',\n  ')},\n];`);
if (process.argv.includes('--bump')) sw = sw.replace(/const VERSION = 'v(\d+)'/, (_, n) => `const VERSION = 'v${Number(n) + 1}'`);
writeFileSync(join(root, 'sw.js'), sw);
console.log(`SHELL: ${list.length} plików; ` + sw.match(/const VERSION = '[^']+'/)[0]);
