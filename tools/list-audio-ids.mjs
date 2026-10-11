#!/usr/bin/env node
// Wypisuje identyfikatory wszystkich nagrań potrzebnych lektorowi (patrz audio/README.md).
//   node tools/list-audio-ids.mjs          -> "id<TAB>rodzaj<TAB>tekst" (posortowane)
//   node tools/list-audio-ids.mjs --json   -> JSON [{id, part, kind}] (używa tools/generate-audio.py)
import { collectSpoken } from '../js/core/spoken.js';

const list = [...collectSpoken().values()].sort((a, b) => a.id.localeCompare(b.id));
if (process.argv.includes('--json')) console.log(JSON.stringify(list));
else for (const s of list) console.log(`${s.id}\t${s.kind}\t${s.part}`);
