# Głos lektora – pochodzenie i licencje

**Głos syntetyczny (Microsoft Azure Neural TTS)** – nagrania `*.mp3` zostały wygenerowane skryptem `tools/generate-audio.py`
usługą Azure AI Speech (REST), głos `pl-PL-ZofiaNeural` (region northeurope), a następnie przetworzone lokalnie
(przycięcie ciszy, wydłużenie głosek ciągłych rubberbandem, normalizacja głośności, limiter, mp3 24 kHz / 48 kb/s mono).
Teksty wejściowe są własnością autora gry. Klucza usługi nie ma w repozytorium.

Ujawnienie: Microsoft wymaga informowania użytkowników, że głos jest syntetyczny – gra to robi w panelu rodzica
(„Głos syntetyczny (Microsoft Azure Neural TTS)”) i w README.

## Ważne zastrzeżenie licencyjne (stan na 2026-10)

Warunki produktowe Microsoft przyznają prawa do **komercyjnego użycia wyników** syntezy głosami prebuilt neural wyłącznie klientom
**płatnego** poziomu usługi; darmowy poziom **F0** jest przeznaczony do oceny/testów (źródła: Microsoft Q&A
https://learn.microsoft.com/answers/questions/652774/ oraz https://learn.microsoft.com/en-au/answers/questions/5805156/ ; Product Terms: https://www.microsoft.com/licensing/terms/productoffering/MicrosoftAzure/MCA).
Te nagrania powstały na zasobie **F0**. Dopóki gra jest darmowa i niekomercyjna (Piotrek, bez reklam), jest to akceptowalne; **przed jakąkolwiek
sprzedażą/subskrypcją** wygeneruj nagrania ponownie na zasobie płatnym (S0 – to ok. 1,5 tys. znaków, grosze) tym samym skryptem (`--force`)
albo użyj zapasowego generatora offline.

## Zapasowa ścieżka offline

`tools/generate-audio-offline.py` – lokalny model NeonGeckoCom/tts-vits-mai-pl (Coqui VITS; model BSD-3-Clause, dane M-AILABS
z wyraźną zgodą na użycie komercyjne; https://huggingface.co/neongeckocom/tts-vits-mai-pl). Nie jest używany domyślnie i nie ma modelu w repozytorium.
Nie użyto polskich głosów Piper (`gosia`/`darkman`/`mc_speech` – dotrenowane z korpusu Lessac „Research Purposes only”; `mls_6892` – CC BY-NC-SA).

Przeróbki sygnału nie zmieniają charakteru głosu; głosek ciągłych (mmm, sss…) Azure nie potrafi przytrzymać, więc są przedłużane algorytmicznie.
