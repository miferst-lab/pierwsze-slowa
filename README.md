# Pierwsze Słowa

Statyczna gra w przeglądarce do nauki czytania po polsku dla pierwszoklasisty (prototyp dla Piotrka, 7 lat).
Litery i głoski → sylaby → słowa → zdania → krótkie czytanki. Lektor czyta po polsku (synteza mowy przeglądarki),
za zadania są gwiazdki, a za ukończone poziomy – skarby w jednym z trzech światów.

**Wszystko działa na jednej domenie, bez żadnych zewnętrznych zapytań:** bez CDN-ów, czcionek Google, analityki,
reklam, zakupów i logowania. Dzięki temu w Microsoft Family Safety wystarczy dodać jedną domenę do listy dozwolonych stron.

Dostępne jest tylko „Nauka czytania”. „Matematyka” to przygotowany, pusty moduł z ekranem „Wkrótce!”.

## Uruchomienie lokalnie

```bash
cd pierwsze-slowa
python3 -m http.server 8000      # albo: npm run serve
# otwórz http://localhost:8000 w Edge lub Chrome
```

Nie ma kroku budowania – to zwykły HTML/CSS/JS (moduły ES). Plików nie otwieraj przez `file://` (moduły ES i service worker
wymagają serwera HTTP). Parametr `?test=1` w adresie znaczy poprawne odpowiedzi atrybutem `data-correct` (używa go test przeglądarkowy).

## Testy i sprawdzenia

```bash
npm test                         # node --test tests/*.test.mjs (bez zależności)
npm run check                    # node tools/check-external.mjs – brak zewnętrznych adresów w plikach aplikacji
PUPPETEER_CORE=/ścieżka/do/puppeteer-core node tools/browser-check.mjs [katalog-na-zrzuty]
```

- `tests/curriculum.test.mjs` – poprawność programu: unikalne id, każde zadanie ma odpowiedź w opcjach, każda głoska ma wpis „say”, ilustracje istnieją, litery poznane przed użyciem w sylabie itd.
- `tests/progress.test.mjs` – zapis/odczyt postępów, odporność na uszkodzone dane, gwiazdki, odblokowania, reset.
- `tests/narrator.test.mjs` – wybór polskiego głosu, identyfikatory nagrań. `tests/sw.test.mjs` – lista plików w cache.
- `tools/check-external.mjs` – szuka `http://`, `https://`, `//host`, `@import` w plikach aplikacji (wyjątek: `xmlns`, komentarze).
- `tools/browser-check.mjs` – prawdziwy headless Chrome (puppeteer-core): przeklikuje wszystkie poziomy i typy zadań, światy, panel rodzica, tryb offline;
  sprawdza błędy konsoli, zewnętrzne żądania i brak przewijania w zadaniach; robi zrzuty ekranu. Z atrapą polskiego głosu sprawdza też, co mówi lektor.

## Struktura

```
index.html            jedyna strona (CSP: tylko własna domena)
css/app.css           style (duże cele dotykowe, wysoki kontrast, prefers-reduced-motion)
sw.js                 service worker – działanie offline (podnoś VERSION przy zmianach!)
audio/                opcjonalne nagrania lektora + manifest.json (patrz audio/README.md)
js/app.js             start, nawigacja, ekran startowy, skarby, przełącznik światów
js/parent.js          panel rodzica (bramka 7+8, postępy, lektor, dane)
js/core/say.js        TABELA WYMOWY głosek + identyfikatory nagrań
js/core/narrator.js   lektor: głosy, kolejka wypowiedzi, nagrania, zachowanie bez głosu
js/core/progress.js   postępy w localStorage (klucz pierwsze-slowa:v1), czyste funkcje
js/core/ui.js         drobne narzędzia DOM
js/art/words.js       ilustracje słów (inline SVG)
js/art/worlds.js      3 światy: motyw, tło, maskotki, skarby (inline SVG)
modules/index.js      rejestr modułów
modules/reading/      curriculum.js (program jako dane), runner.js (zadania), index.js (mapa poziomów)
modules/math/         pusty moduł „Wkrótce!” z tym samym interfejsem
tests/ tools/         testy i narzędzia (nie trafiają do cache aplikacji)
```

Moduł to obiekt `{ id, title, tagline, available, icon, mount(ctx, box, { exit }) }`. Aby dodać matematykę:
uzupełnij `modules/math/` (własny `curriculum.js`, ekrany), skorzystaj z `ctx.narrator`, `ctx.state`, `ctx.topbar`, ustaw `available: true`.
Nic więcej w aplikacji nie trzeba zmieniać (kartę na ekranie startowym tworzy rejestr modułów).

## Program nauki (25 poziomów, ok. 170 zadań)

| Grupa | Poziomy | Zawartość |
|---|---|---|
| Dźwięki | 1–3, 6, 9, 10, 13, 15–19 | a o e · u i y · m t l · s k d · p b n · w r z · j ł g · f c h · ś ć ń ź · ż ą ę ó · sz cz ch rz · dz dź dż |
| Sylaby | 4, 7, 11, 12 | spółgłoska + samogłoska (ma mo mu me mi my, ta…, la…, sa…, ka…, da…, pa…, ba…, na…, wa…, ra…, za…) |
| Słowa | 5, 8, 14, 20 | mama tata lala · kot dom las lis sok osa lody mak · sowa kura woda ryba buty balon noga jajo · żaba mysz szafa czapka chata koło |
| Zdania | 21–23 | „To jest dom.” · „Mama ma lody.” · „Kot lubi rybę.” |
| Czytanki | 24–25 | 6 krótkich historyjek (3–4 zdania) z pytaniem |

Pisownia „trudna” (ó/u, ż/rz, ch/h) jest wprowadzana wprost dopiero w poziomach 15–19 („Ó brzmi tak samo jak U”, „Rz brzmi jak ż”, „h brzmi jak ch”).
Nowa litera jest zawsze poznana przed użyciem w sylabie (pilnuje tego test).

Typy zadań: `hear` (posłuchaj i dotknij literę/sylabę), `initial` (który obrazek zaczyna się na ten dźwięk), `hearPic` (posłuchaj słowa, dotknij obrazek),
`pick` (obrazek → właściwe słowo), `build` (przeciągnij albo dotykaj kafelków, by ułożyć sylabę/słowo), `readtap` (dotykaj słów, lektor je czyta),
`sentpic` (które zdanie pasuje do obrazka), `story` (czytanka + pytanie).

Bez presji czasu i bez negatywnych dźwięków: po błędzie pojawia się „Spróbuj jeszcze raz”, lektor powtarza polecenie, a po drugiej pomyłce poprawna odpowiedź delikatnie pulsuje.
Gwiazdki za zadanie: 3 (bez pomyłki), 2 (jedna pomyłka), 1 (więcej). Kolejny poziom odblokowuje się po ukończeniu poprzedniego.

## Jak dodać poziom lub zadanie

Program jest w `modules/reading/curriculum.js`. Poziomy powstają z krótkich specyfikacji (`soundLevel`, `sylLevel`, `wordLevel`, `sentenceLevel`, `storyLevel`)
na liście `LEVELS`; wynik to zwykłe obiekty, które można też wpisać ręcznie przez `mk(grupa, tytuł, opis, [zadania])`.

- **Nowe słowo:** dopisz do `WORDS` (`units` = sylaby albo litery do ułożenia, `art` = klucz ilustracji), dorysuj ilustrację w `js/art/words.js` (`WORD_ART`), potem dodaj słowo do `wordLevel(...)`.
- **Nowy poziom:** dopisz wywołanie w `LEVELS` we właściwym miejscu (kolejność = kolejność nauki). Ma mieć 5–8 zadań.
- **Własne zadanie:** obiekt `{ type, kind, prompt, say, options, answer, ... }` – wzory w funkcjach generujących.
- Po zmianach: `npm test`, podnieś `VERSION` w `sw.js` i dopisz nowe pliki do `SHELL` (test `sw.test.mjs` przypomni).

## Lektor i strojenie wymowy

Lektor używa `speechSynthesis` z głosem `pl-PL`. Głosy ładują się asynchronicznie (czekamy na `voiceschanged` i dopytujemy przez ok. 3 s).
Wybierany jest głos polski, **lokalny** (działa offline i nie wysyła nic do sieci), np. Microsoft Paulina lub Zofia; głosy „Online (Natural)” tylko gdy nie ma innych.
Tempo domyślnie 0,8; w panelu rodzica można je zmienić, wyłączyć lektora albo wybrać głos.

**Pojedyncze głoski.** Syntezator czyta samotną literę jej *nazwą* („em”), a uczymy *głoski* („mmm”). Dlatego zadania odwołują się do głosek przez klucz `#m`,
a tabela `SAY` w `js/core/say.js` zamienia go na tekst dla syntezatora: ciągłe głoski są przedłużone (`mmm`, `sss`, `szzz`), zwarte mają krótkie „y” (`ty`, `ky`, `py`),
samogłoski nosowe to przybliżenia (`ą` → `oł`, `ę` → `eł`). Sylaby, słowa i zdania czytane są tak, jak są zapisane.
**Dostrajanie:** zmień wartość w `SAY` – to jedyne miejsce. W panelu rodzica jest „Test głosek” (przycisk „Odtwórz” przy każdej głosce).
Jakość polskiego głosu i przybliżeń trzeba posłuchać na docelowym komputerze (Windows 11) – nie da się tego sprawdzić bez głosu.

**Bez głosu polskiego:** aplikacja nie zawiesza się; zadania pokazują duży tekst i żółty komunikat „Bez dźwięku: znajdź …”,
a na ekranie startowym jest baner z odnośnikiem do panelu rodzica z instrukcją: *Ustawienia → Czas i język → Mowa → Dodaj głosy → Polski (Polska)*, potem restart przeglądarki.

**Nagrania zamiast syntezatora (zaczep):** jeśli id jest w `audio/manifest.json`, odtwarzany jest `audio/<id>.mp3`; inaczej mówi syntezator. Brak plików niczego nie psuje.
`node tools/list-audio-ids.mjs` wypisuje wszystkie potrzebne identyfikatory wraz z tekstem do nagrania. Szczegóły: `audio/README.md`.

## Postępy i panel rodzica

Postępy są w `localStorage` (klucz `pierwsze-slowa:v1`), tylko w tej przeglądarce i na tym komputerze. Uszkodzone dane są ignorowane (zaczynamy od zera).
Panel „Dla rodzica” (przycisk na ekranie startowym) chroni zadanie rachunkowe (np. 7 + 8), którego siedmiolatek szybko nie rozwiąże. W środku:
postępy i gwiazdki, lista głosek/sylab sprawiających kłopot, ustawienia lektora, instrukcja instalacji głosu, pobranie postępów do pliku, reset (dwuklik), odblokowanie wszystkich poziomów.
Uwaga: to prosta bramka, nie zabezpieczenie – chodzi o to, by dziecko nie wchodziło tam przypadkiem.

## Światy

Trzy motywy (zmiana w dowolnej chwili przyciskiem „Świat” na górze): **Kosmos**, **Zwierzątka z dżungli**, **Pingwiny z Wysp Palmowych**.
Zmieniają tylko kolory, tło, maskotki i skarby (12 na świat); program nauki jest ten sam. Wszystkie postacie są **własne i oryginalne** (Zielek, Pyłek, Rakieta Iskra;
Małpka Figa, Tukan Dziobek, Słonik Trąbek; pingwiny Kapitan Pik, Fiku i Bryza, Lew Grzywacz, lemur Tupi, krab Klik) – rysowane w SVG, bez cudzych nazw, znaków i charakterystycznych projektów.
Skarby odblokowują się z ukończonymi poziomami (po wszystkich – komplet).

## Wdrożenie (nic nie jest jeszcze opublikowane)

To czysta strona statyczna – wystarczy wgrać zawartość katalogu (bez `tests/`, `tools/`, `docs/`) na dowolny hosting statyczny: **GitHub Pages** albo **Vercel**.

- Family Safety wymaga **dokładnej domeny** na liście dozwolonych stron; aplikacja nie łączy się z niczym innym, więc to jedyny wpis.
- Zalecana jest **własna domena** (np. `pierwsze-slowa.pl`): adres się nie zmieni przy przenosinach hostingu, a domyślne adresy `*.github.io`/`*.vercel.app` bywają trudniejsze do utrzymania na liście.
- **Adres i publikację wybiera i zatwierdza Daniel.** Przed publikacją: przejrzeć tekst w panelu rodzica i sprawdzić głos na komputerze Piotrka.
- Aplikacja działa offline po pierwszym wczytaniu (service worker). Przy każdym wdrożeniu zmień `VERSION` w `sw.js`, inaczej dzieci zobaczą starą wersję z cache.
- Podkatalog (np. `/pierwsze-slowa/` na GitHub Pages) też działa – wszystkie ścieżki są względne.
