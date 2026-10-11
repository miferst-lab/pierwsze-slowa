# Głos lektora – pochodzenie i licencje

Nagrania w tym katalogu (`*.mp3`) zostały wygenerowane **lokalnie, offline** skryptem `tools/generate-audio.py`
neuronowym modelem syntezy mowy:

| | |
|---|---|
| Model | **NeonGeckoCom/tts-vits-mai-pl** (Coqui TTS, architektura VITS, jeden głos żeński, polski, 22,05 kHz) |
| Strona modelu | https://huggingface.co/neongeckocom/tts-vits-mai-pl |
| Licencja modelu | **BSD-3-Clause** (metadane karty modelu: `license: bsd-3-clause`; ta sama licencja w katalogu modeli Coqui: `tts_models/pl/mai_female/vits`, https://github.com/idiap/coqui-ai-TTS/blob/dev/TTS/.models.json) |
| Dane treningowe | **M-AILABS Speech Dataset**, część polska (nagrania audiobooków), https://github.com/imdatceleste/m-ailabs-dataset |
| Licencja danych | „Redistribution and use in any form, **including any commercial use**, with or without modification are permitted” + zakaz używania nazw autorów do promocji (warunki BSD) |
| Silnik | coqui-tts (idiap fork), licencja MPL-2.0 – nie jest rozpowszechniany w tym repozytorium |

Wnioski:
- licencja modelu i danych dopuszcza ponowne rozpowszechnianie wyników (nagrań) w grze publicznej i komercyjnej;
- model **nie jest** pochodną nagrań na licencjach „tylko do badań” (w odróżnieniu od polskich głosów Piper `gosia`/`darkman`/`mc_speech`,
  które są dotrenowane z korpusu Lessac Blizzard 2013 – licencja „Research Purposes only”, albo `mls_6892` z RyanSpeech CC BY-NC-SA);
- nie użyto Coqui XTTS (licencja CPML, ograniczenia komercyjne), MMS-TTS (CC-BY-NC) ani żadnych usług online
  (Edge/Azure TTS, Google, ElevenLabs itp.).

Atrybucja (BSD-3-Clause, §3: nie używamy nazw autorów danych/modelu do promocji):
> Voice: NeonGeckoCom/tts-vits-mai-pl (BSD-3-Clause), trained on the M-AILABS Speech Dataset (Copyright (c) 2017-2019 M-AILABS, BSD-style licence).
> THE MODEL AND DATA ARE PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND.

Modelu (ok. 110 MB) nie ma w repozytorium – skrypt pobiera go z Hugging Face (`--download`).
Przeróbki sygnału: wycinanie i wydłużanie głosek, korekta wysokości (rubberband), normalizacja głośności, limiter, kodowanie mp3 (ffmpeg).
Głoski „f” i część składowych „w/z/ż/ź” to prosty sygnał syntetyczny (szum filtrowany), nie nagranie modelu – patrz `audio/README.md`.
