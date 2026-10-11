# Nagrania lektora (opcjonalne)

Aby użyć własnych nagrań zamiast syntezatora, wrzuć tu pliki `.mp3` i dopisz ich identyfikatory do `manifest.json`
(np. `{"s-m": true, "t-mama": true}`). Aplikacja odtwarza `audio/<id>.mp3`, jeśli id jest w manifeście;
w przeciwnym razie czyta syntezatorem. Identyfikatory:

- głoska: `s-<litera>` (np. `s-m`, `s-sz`, litery z ogonkami jako `s-u142` dla „ł”, kod Unicode szesnastkowo),
- sylaba/słowo/zdanie/polecenie: `t-<tekst małymi literami>` (spacja → `_`, np. `t-mama`, `t-to_jest_dom_`).

Wylistuj wszystkie potrzebne identyfikatory poleceniem `node tools/list-audio-ids.mjs`.
