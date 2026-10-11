# Nagrania lektora

Ten katalog zawiera **wygenerowane** nagrania lektora (`<id>.mp3`) i `manifest.json`. Nie edytuj ich ręcznie:
uruchom `python tools/generate-audio.py` (kroki w głównym README, rozdział „Lektor i nagrania”).

**Głos syntetyczny (Microsoft Azure Neural TTS)**, `pl-PL-ZofiaNeural` – szczegóły i zastrzeżenie licencyjne: `VOICE-LICENSE.md`.

- Aplikacja odtwarza `audio/<id>.mp3`, jeśli id jest w `manifest.json` (`clips`), w przeciwnym razie czyta głosem systemowym.
- Identyfikatory: głoska `s-<litera>` (litery z ogonkami jako `s-u142` dla „ł”, kod Unicode szesnastkowo),
  reszta `t-<tekst małymi literami>` (spacja → `_`, interpunkcja i polskie litery → `u<kod>`). Lista: `npm run audio:list`.

## Jak powstają nagrania

| Rodzaj | SSML `<prosody>` |
|---|---|
| głoski (litery) | `<phoneme alphabet="ipa">`, rate −25%, volume +100%; głoski ciągłe (m n ń l ł r j f s ś sz ch z ź ż w) wydłużone do ok. 0,7 s, samogłoski do ok. 0,45 s (rubberband) |
| sylaby | rate −25%, volume loud |
| słowa, zdania, polecenia | rate −8% |
| pochwały, zakończenia | pitch +6%, rate −3% (kilka wariantów w `js/core/lines.js`) |
| ponowna próba | pitch +2%, rate −5% |
| „Przeczytaj wszystko” | sklejone z nagrań pojedynczych zdań (przerwa 0,28 s) |

## Kontrola jakości bez odsłuchu

Każdy plik jest dekodowany i mierzony (`docs/audio-report.json`): czas, głośność (cel: −16 LUFS zdania/słowa/pochwały, −13 LUFS głoski i sylaby),
szczyt (po mp3 ≤ −0,8 dBFS), centroid widma, przejścia przez zero, „dźwięczność”. Sekcja `suspicious` wymienia nagrania do odsłuchu
(np. bardzo ciche głoski bezdźwięczne – Azure oddaje je szeptem – wymagają dużego wzmocnienia).
