# Nagrania lektora

Ten katalog zawiera **wygenerowane** nagrania lektora (`<id>.mp3`) i `manifest.json`. Nie edytuj ich ręcznie:
uruchom `python tools/generate-audio.py` (kroki w głównym README, rozdział „Lektor i nagrania”).

- Aplikacja odtwarza `audio/<id>.mp3`, jeśli id jest w `manifest.json` (`clips`), w przeciwnym razie czyta głosem systemowym.
  Gdy plików nie ma w ogóle, gra działa tak samo jak przedtem (głos systemowy).
- Identyfikatory: głoska `s-<litera>` (litery z ogonkami jako `s-u142` dla „ł”, kod Unicode szesnastkowo),
  reszta `t-<tekst małymi literami>` (spacja → `_`, interpunkcja i polskie litery → `u<kod>`). Lista: `npm run audio:list`.
- Głos i licencje: `VOICE-LICENSE.md` (model BSD-3-Clause, dane M-AILABS – użycie komercyjne dozwolone).

## Jak powstają głoski (litery i dźwięki)

Model czyta tekst litera po literze, więc „mmm” czy „sss” podane jako tekst daje losowy szum, a pojedyncze litery bywają prawie ciche.
Dlatego (`tools/generate-audio.py`, tabela `SOUNDS`):

| Głoski | Sposób |
|---|---|
| m n ń l ł r j, s ś sz ch (h=ch) | wycinamy spółgłoskę z nośnika („ma”, „sa”, „sza”…) i **wydłużamy ją w modelu** (własne czasy trwania tokenów, ok. 0,7 s), reszta nośnika odpada; s/ś/sz/ch dostają różne pasma (EQ), żeby się odróżniały (kontrola: centroid widma s > ś > sz > ch) |
| a o e u i y ą ę (ó=u) | nazwa litery = głoska, wydłużona umiarkowanie (ok. 0,4 s) w kontekście „X X”; zbyt długi sustain zlewał samogłoski |
| t k d p b g c cz dz dź dż ć | nośnik „Cy” (ty, ky, …) z krótką samogłoską – jak dotychczasowa tabela `SAY` |
| z ź ż (rz=ż), w | model nie utrzymuje dźwięczności szumu: miks bzyczenia (dolne pasmo) + szumu modulowanego ~205 Hz – **sygnał syntetyczny, do odsłuchu** |
| f | model oddaje „f” jako dźwięczne – zastąpione szumem szerokopasmowym 1,1–9,5 kHz (**syntetyczne**) |

Krótkie teksty (sylaby, krótkie słowa) renderujemy w kontekście „X X” i bierzemy pierwsze X (pojedyncze krótkie teksty model oddaje prawie ciszą).
Sylaby: `length_scale` 1,55 (wolniej), +3 dB względem zdań. Pochwały: jaśniej (`noise_scale` 0,6, `length_scale` 0,95, pitch +10% rubberband).

## Kontrola jakości bez odsłuchu

Każdy plik jest dekodowany z powrotem i mierzony (`docs/audio-report.json`): czas, głośność (cel: **−16 LUFS** zdania/słowa/pochwały, **−13 LUFS** = +3 dB głoski i sylaby),
szczyt (limiter 0,85, po mp3 ≤ −0,8 dBFS), centroid widma, przejścia przez zero i „dźwięczność” (autokorelacja). Dla głosek sprawdzane są oczekiwane klasy
(samogłoski/nosowe/płynne dźwięczne, szczelinowe bezdźwięczne szumowe). Sekcja `suspicious` w raporcie wymienia nagrania, które trzeba odsłuchać.
