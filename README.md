# Pierwsze Słowa

Statyczna gra w przeglądarce do nauki czytania i matematyki po polsku dla pierwszoklasisty (dla Piotrka, 7 lat).
Litery i głoski → sylaby → słowa → zdania → krótkie czytanki. Lektor czyta po polsku: domyślnie NAGRANYM, miłym kobiecym głosem (neuronowy TTS, nagrania są w repozytorium), a zapasowo głosem systemowym przeglądarki,
za zadania są gwiazdki, a za ukończone poziomy – skarby w jednym z trzech światów.

**Wszystko działa na jednej domenie, bez żadnych zewnętrznych zapytań:** bez CDN-ów, czcionek Google, analityki,
reklam, zakupów i logowania. Dzięki temu w Microsoft Family Safety wystarczy dodać jedną domenę do listy dozwolonych stron.

Trzy moduły: **„Nauka czytania”**, **„Matematyka”** i **„Ćwiczenia wymowy”** (opis niżej) (klasa 1: liczenie do 10, 20 i 100, porównywanie, skład liczby, dodawanie i odejmowanie do 20 z przekraczaniem dziesiątki,
proste zadania tekstowe, wzorki, figury, a na końcu miary, złote i zegar). Do tego trzy **zabawy zręcznościowe** (Łap i czytaj/licz, Ścieżka, Balony) bez czasu, żyć i porażek.
Wygląd: pastelowe, spokojne światy, duże zaokrąglenia, miękkie cienie, systemowa czcionka (Segoe UI / Verdana – bez pobierania czcionek).

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
npm test                         # node --test tests/*.test.mjs (bez zależności; ok. 80 testów)
npm run check                    # node tools/check-external.mjs – brak zewnętrznych adresów w plikach aplikacji
npm run audio:list               # lista wszystkich wypowiedzi lektora (id, rodzaj, tekst)
PUPPETEER_CORE=/workspace/tools-pptr/node_modules/puppeteer-core node tools/browser-check.mjs [katalog-na-zrzuty]
```

- `tests/curriculum.test.mjs` – poprawność programu: unikalne id, każde zadanie ma odpowiedź w opcjach, każda głoska ma wpis „say”, ilustracje istnieją, litery poznane przed użyciem w sylabie itd.
- `tests/progress.test.mjs` – zapis/odczyt postępów, odporność na uszkodzone dane, gwiazdki, odblokowania, reset.
- `tests/narrator.test.mjs` – ranking głosów (Natural/Online pierwsze), parametry głosu systemowego (głoski wolniej/głośniej), identyfikatory nagrań. `tests/lines.test.mjs` – pochwały: warianty bez powtórzeń z rzędu.
- `tests/numerals.test.mjs` – polskie liczebniki 0–100 (rodzaj: jedna/dwie), odmiana rzeczownika 1 / 2–4 / 5+ / 12–14 („dwa jabłka”, „pięć jabłek”, „dwanaście bananów”).
- `tests/math.test.mjs` – program matematyki: unikalne id, odpowiedź w opcjach, wszystkie działania i zadania tekstowe liczone ponownie, zakresy 10 → 20 → 100, poprawna odmiana w tekstach.
- `tests/games.test.mjs` – czysta logika zabaw: dobór treści z tego, co poznane, harmonogram pojawiania się elementów (fałszywy zegar), punktacja, prędkości, zapis postępów zabaw.
- `tests/contrast.test.mjs` – kontrast WCAG AA (tekst ≥ 4,5:1, elementy interfejsu ≥ 3:1) liczony po tokenach palety w każdym świecie.
- `tests/audio.test.mjs` – każda wypowiedź w grze ma id i nagranie, manifest = pliki na dysku, poprawne mp3, razem < 15 MB. `tests/sw.test.mjs` – lista plików w cache.
- `tools/check-external.mjs` – szuka `http://`, `https://`, `//host`, `@import` w plikach aplikacji (wyjątek: `xmlns`, komentarze).
- `tools/browser-check.mjs` – prawdziwy headless Chrome (puppeteer-core): przeklikuje wszystkie poziomy i typy zadań, światy, panel rodzica, tryb offline;
  serwowany pod podścieżką `/pierwsze-slowa/` (jak GitHub Pages); sprawdza błędy konsoli, zewnętrzne żądania i brak przewijania w zadaniach; robi zrzuty ekranu.
  Sprawdza też, że nagrania naprawdę grają (zdarzenia `<audio>`, status 200, `audio/mpeg`), że każda wypowiedź z całej gry ma nagranie, panel rodzica (przełącznik głosu, suwaki, „Test głosek”),
  głos systemowy z atrapą (ranking głosów, tempo/głośność/pitch) oraz działanie gry, gdy plików audio nie ma (404).

## Struktura

```
index.html            jedyna strona (CSP: tylko własna domena)
css/app.css           style oparte na tokenach (zmienne CSS ustawiane per świat w js/art/worlds.js), prefers-reduced-motion
sw.js                 service worker – działanie offline (podnoś VERSION przy zmianach!); nagrania cache'owane leniwie + w tle
tools/generate-audio.py  generator nagrań (Azure Neural TTS, REST; klucz tylko ze zmiennej środowiskowej)
tools/generate-audio-offline.py  zapasowy generator w pełni offline (Coqui VITS, licencja BSD-3; nieużywany domyślnie)
audio/                nagrania lektora (mp3) + manifest.json (generowane), VOICE-LICENSE.md (patrz audio/README.md)
js/app.js             start, nawigacja, ekran startowy, skarby, przełącznik światów
js/parent.js          panel rodzica (bramka 7+8, postępy, lektor, dane)
js/core/say.js        TABELA WYMOWY głosek (dla głosu systemowego) + identyfikatory nagrań
js/core/lines.js      pochwały, zachęty, teksty końca poziomu + losowanie wariantów bez powtórzeń z rzędu
js/core/spoken.js     spis WSZYSTKICH wypowiedzi z rodzajem (głoska/sylaba/słowo/zdanie/pochwała…) – źródło prawdy dla nagrań i testów
js/core/narrator.js   lektor: nagrania (domyślnie) + głos systemowy (ranking głosów), kolejka wypowiedzi, tempo/głośność
js/core/progress.js   postępy w localStorage (klucz pierwsze-slowa:v1), czyste funkcje
js/core/ui.js         drobne narzędzia DOM
js/art/words.js       ilustracje słów (inline SVG)
js/art/manip.js       przedmioty do liczenia (per świat), ramki dziesiątki, monety, zegar, linijka, figury (inline SVG)
js/core/numerals.js   polskie liczebniki i odmiana rzeczowników (1–100)
js/games/             zabawy: index.js (silnik + 3 gry), logic.js (czysta logika), phrases.js (polecenia lektora), map.js (węzły „Zabawa”, bonus)
js/art/worlds.js      3 światy: motyw, tło, maskotki, skarby (inline SVG)
modules/index.js      rejestr modułów
modules/reading/      curriculum.js (program jako dane), runner.js (zadania), index.js (mapa poziomów)
modules/math/         curriculum.js (25 poziomów, ok. 190 zadań), say.js (składanie wypowiedzi z liczebników), runner.js (zadania), index.js (mapa)
tests/ tools/         testy i narzędzia (nie trafiają do cache aplikacji)
```

Moduł to obiekt `{ id, title, tagline, available, icon, mount(ctx, box, { exit }) }`; kartę na ekranie startowym tworzy rejestr modułów (`modules/index.js`).

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

## Matematyka (25 poziomów, 191 zadań)

| Grupa | Poziomy | Zawartość |
|---|---|---|
| Liczby do 10 | 1–10 | liczenie do 5 i 10, brakująca liczba i porządek, więcej/mniej/tyle samo, znaki < > =, skład liczby, pary do 10, dodawanie do 5 i do 10, odejmowanie do 10 |
| Liczby do 20 | 11–16 | liczenie do 20, dziesiątki i jedności, dodawanie i odejmowanie do 20 bez i z przekraczaniem dziesiątki (ramki dziesiątki → symbole) |
| Zadania i wzory | 17–20 | zadania tekstowe z dodawaniem i odejmowaniem (16 różnych), wzorki i ciągi, figury (koło, kwadrat, trójkąt, prostokąt) |
| Liczby do 100 | 21–22 | dziesiątkami, ciąg liczb, porządkowanie, porównywanie |
| Dodatkowe | 23–25 | długość w cm (linijka), złote (1, 2, 5, 10 zł; 1 zł = 100 groszy), zegar – pełne godziny |

Typy zadań: `tapNum`, `count`, `make` (połóż na talerzu), `seq`, `order`, `cmpGroups`, `cmpWords`, `sign`, `eq` (działanie z brakującą liczbą), `frame` (ramka dziesiątki), `problem` (zadanie tekstowe),
`pattern`, `shapeTap/shapeName/shapeSides`, `ruler`, `coinSum`, `coin100`, `pay`, `clock`, `clockPick`. Przedmioty do liczenia zależą od świata (gwiazdy/banany/ryby itd.).
Liczby i rzeczowniki lektor składa z krótkich nagrań (`js/core/numerals.js`: „dwa jabłka”, „pięć jabłek”, „dwie gwiazdy”); do zadań tekstowych są pełne zdania.
Postępy matematyki (gwiazdki, poziomy, trafienia i pomyłki z tematami „do powtórzenia”) są w tym samym `localStorage` i widać je w panelu rodzica. Poziomy matematyki wchodzą też do puli skarbów.

## Ćwiczenia wymowy (11 głosek, 131 kroków)

**Kolejność (od 14.10.2026):** szereg ciszący **Ś, Ź, Ć, DŹ** → syczący **C, DZ** → szumiący **SZ, Ż/RZ, CZ, DŻ** → **R na końcu**. Wszystkie poziomy są otwarte; mapa podświetla „Polecaną teraz” głoskę (pierwszą nieukończoną w tej kolejności), a przy R jest notka dla rodzica, dlaczego jest ostatnia. Id poziomów są oparte na głosce (`W-s2`, …, `W-r`); stare zapisy `P01…P11` są automatycznie przenoszone (`LEGACY_IDS` w `modules/pron/curriculum.js`, migracja w `parseState`), więc postępy i „Kontynuuj” się nie gubią. (Moduł nie zawiera głosek S i Z.)

Źródła kolejności (zweryfikowane):
- „Program terapii głosek dentalizowanych”, sklep.logopedia.pl – „W literaturze podawana jest zazwyczaj następująca kolejność wywoływania głosek: ciszące (ś, ź, ć, dź), syczące (s, z, c, dz), szumiące (sz, rz, cz, dż)” (za m.in. Antos, Demel, Styczek; Demel „Minimum logopedyczne…”): https://www.sklep.logopedia.pl/publikacjefachowe/program-terapii-glosek-dentalizowanych/
- „Kolejność wprowadzania głosek”, verbis-logopedia.pl – szumiące i [r] pojawiają się ok. 5.–6. r.ż.; „najczęściej nie zaczyna się terapii od [r]”: https://verbis-logopedia.pl/kolejnosc-wprowadzania-glosek.htm

Kolejność warto dopasować do dziecka – najlepiej z logopedą.

Trzeci moduł na ekranie startowym (`modules/pron/`): zabawowe ćwiczenia trudnych głosek – **to nie jest terapia**; przy stałych trudnościach z mową warto iść do logopedy (informacja jest też w panelu rodzica i na mapie głosek).

- **Głoski** (jeden poziom P01…P11 na głoskę, wszystkie odblokowane – dziecko wybiera): R, SZ, CZ, Ż/RZ, DŻ, C, DZ, Ś, Ć, Ź, DŹ. Dodanie głoski = jeden wpis w `SOUND_DEFS` w `modules/pron/curriculum.js` (słowa, sylaby, zdania, ćwiczenia, klucz rysunku buzi) i `python tools/generate-audio.py` dla nowych nagrań.
- **Kroki głoski (każdy z gwiazdkami, zapis, „Kontynuuj”):** 1) Posłuchaj (wzór lektora Azure + animowana buzia z boku), 2) sylaby (3 zadania: otwarte, odwrócone, grupy), 3) słowa (początek / środek / koniec słowa), 4) zdania i łamańce, 5) ćwiczenia: oddech (wiatraczek, „zimno–ciepło”), język (koniki, malarz, liczymy zęby), usta/policzki (uśmiech i dzióbek, balonik) – każde z prostą animacją.
- **Samoocena zamiast oceniania:** „Powtórz” (ponowne odtworzenie wzoru, zmniejsza gwiazdki: 3 → 2 → 1) i „Super!” (zalicza krok). Gra niczego nie ocenia automatycznie.
- **„Nagraj siebie” i „Lusterko”** (`modules/pron/recorder.js`): „Lusterko” pokazuje obraz z kamery odbity jak w lustrze (bez nagrywania). „Nagraj siebie” prosi o kamerę i mikrofon (`getUserMedia` video+audio; bez kamery – sam dźwięk), nagrywa do 8 s z podglądem, odtwarza raz obok wzoru lektora i **samo usuwa nagranie** po obejrzeniu (najpóźniej po 60 s lub po wyjściu z kroku): `revokeObjectURL` + zatrzymanie wszystkich ścieżek. Nic nie jest wysyłane ani zapisywane (test pilnuje braku `localStorage`/`fetch`). Bez mikrofonu/zgody – przyjazny komunikat.
- **Rysunek buzi** (`modules/pron/mouth.js`): przekrój z boku z podpisami (język, zęby, wargi, podniebienie), strzałką ruchu języka i powietrza, krokami „spokój → ruch/dotknij → głoska” (animacja SMIL, 8 s); widok ust z przodu (dzióbek / uśmiech); osobne ułożenie dla każdej grupy oraz znacznik zwarcia (c, cz, ć…) i „brzęczącego” gardła (dz, ż, ź…).
- **Ikony modułów**: `art/icons/<moduł>-a|b.webp` od Artysty, warianty A/B zmieniają się przy każdej nowej sesji gry (`state.iconSet`). W module: `icons: {a, b}` albo jedna `iconSrc`.
- **Nagrania:** nowy rodzaj `drill` (sylaby-ćwiczenia czytane wolniej: SSML `rate=-30%`, np. „rrra”), pozostałe to słowa, zdania i polecenia ćwiczeń; głoski wzorcowe (#sz, #cz, …) już istniały. 250 nowych klipów, 1675 znaków Azure; wygenerowane przez `tools/generate-audio.py` (potrzebne: librosa, pyloudnorm, soundfile, scipy, ffmpeg).
- Awatar lektorki i bohater dziecka działają tak jak w pozostałych modułach (nastrój awatara z rodzaju wypowiedzi).
- Test w przeglądarce (`tools/browser-check.mjs`) używa atrapy mikrofonu: `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream`.

## Zabawy zręcznościowe

Trzy zabawy wspólne dla obu przedmiotów, bez czasu, żyć i porażek (błędny element tylko odpływa albo się chwieje, a lektor powtarza polecenie). Runda kończy się po 6 trafieniach (1–3 gwiazdki za mniej pomyłek):

- **Łap i czytaj / Łap i licz** – z góry spadają głoski, sylaby, słowa albo liczby i wyniki; kosz łapie to, o co prosi lektor („Złap sylabę ma”, „Ile to jest trzy plus dwa? Złap wynik.”).
- **Ścieżka** – bohater skacze na jedną z trzech platform (planeta, kłoda, liść – zależnie od świata); przeszkody to tylko dekoracja.
- **Balony** – unoszące się balony; przebij ten z właściwą odpowiedzią, błędne tylko się chwieją.

Sterowanie: mysz i dotyk, strzałki lub WASD (Łap: kosz; Ścieżka: wybór platformy + Enter/spacja; Balony: celownik + spacja), a także tryb tylko-klawiaturowy: Tab przechodzi po elementach (w Łap i Balonach ruch wstrzymuje się na czas fokusu), Enter wybiera.
Zabawy odblokowują się po 3 ukończonych poziomach (węzły „Zabawa” na końcu każdej mapy), a po poziomach 4, 8, 12… pojawia się przycisk „Zabawa bonusowa”. Treść pochodzi z programu: tylko poznane głoski/sylaby/słowa albo liczby i działania z ukończonych poziomów.
Prędkość: w panelu rodzica „Wolno (zalecane)” albo „Normalnie”; `prefers-reduced-motion` dodatkowo zwalnia i wyłącza kołysanie. Pętla `requestAnimationFrame` z czasem delta, pauza przy ukrytej karcie.

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
- Po zmianie plików uruchom `node tools/sync-sw.mjs --bump` (uzupełnia listę plików powłoki w `sw.js` i podnosi `VERSION`).
- **Adres i publikację wybiera i zatwierdza Daniel.** Przed publikacją: przejrzeć tekst w panelu rodzica i sprawdzić głos na komputerze Piotrka.
- Aplikacja działa offline po pierwszym wczytaniu (service worker). Przy każdym wdrożeniu zmień `VERSION` w `sw.js`, inaczej dzieci zobaczą starą wersję z cache.
- Podkatalog (np. `/pierwsze-slowa/` na GitHub Pages) też działa – wszystkie ścieżki są względne.

## Lektor i nagrania

Domyślnie lektor odtwarza **nagrania** (`audio/<id>.mp3`, mono 24 kHz, 48 kb/s, razem ok. 2,9 MB) – Piotrek słyszy ten sam głos na każdym komputerze, także bez internetu.
Zapasowo (brak plików, błąd odtwarzania albo wybór rodzica „Głos systemowy”) działa `speechSynthesis`:

- ranking głosów: wybór rodzica → polski głos z „Natural”/„Online” (np. *Microsoft Zofia Online (Natural)*) → Paulina/Zofia lokalna → dowolny `pl-PL`; głosy męskie na końcu;
- głoski i sylaby: `rate 0.65`, `volume 1.0`; zdania: `rate 0.85`, `volume 0.9`; `pitch` 1.12 (pochwały 1.15); suwaki w panelu rodzica skalują tempo (70–130%) i głośność;
- głosy „Online” Edge pobiera sam z internetu – to robi przeglądarka, nie gra (gra nie wysyła własnych żądań poza domenę); dlatego domyślne są nagrania.

**Głos syntetyczny (Microsoft Azure Neural TTS)** – `pl-PL-ZofiaNeural`. Nagrania zostały wygenerowane syntezatorem mowy, nie są głosem człowieka (informacja także w panelu rodzica). Uwagi o licencji wyników: `audio/VOICE-LICENSE.md`.

### Jak wygenerować nagrania od nowa (po zmianie zdań/poziomów)

```bash
python3 -m venv .venv-tts && . .venv-tts/bin/activate
pip install numpy scipy librosa soundfile pyloudnorm       # + ffmpeg (libmp3lame, rubberband) i node w systemie
export AZURE_SPEECH_KEY=...                                 # klucz zasobu Azure Speech (nie zapisuj go w plikach!)
export AZURE_SPEECH_REGION=northeurope                      # domyślnie northeurope
python tools/generate-audio.py                              # tylko brakujące; --force = wszystko, --only s-m,t-mama = wybrane
npm test                                                    # manifest = pliki = lista wypowiedzi
```

Skrypt bierze listę wypowiedzi z `js/core/spoken.js` (przez `tools/list-audio-ids.mjs --json`), wysyła SSML (`<prosody>`: głoski i sylaby rate −25% i głośno, zdania −8%, pochwały pitch +6% / rate −3%; pojedyncze głoski przez `<phoneme alphabet="ipa">` i wydłużenie ciągłych), normalizuje głośność, koduje mp3, aktualizuje `audio/manifest.json` i zapisuje `docs/audio-report.json`.
Czytanki „Przeczytaj wszystko” są sklejane lokalnie z nagrań pojedynczych zdań (bez dodatkowych znaków).
**Limit darmowego poziomu F0:** twardy limit 4500 znaków na uruchomienie, odpowiedzi cache'owane po haszu SSML w `~/.cache/pierwsze-slowa-azure` (niezmienione nagrania nie są pobierane ponownie), po HTTP 401/403/429 skrypt kończy działanie bez ponawiania. Nagrania do matematyki i zabaw dodały 165 klipów (ok. 2,65 tys. znaków; liczby 0–100 jako osobne klipy, odmienione rzeczowniki, spójniki „plus/minus”, 16 zadań tekstowych, polecenia zabaw). Limit na uruchomienie można świadomie podnieść zmienną `PS_CHAR_CAP`; `python tools/generate-audio.py --dry` tylko liczy znaki brakujących nagrań (bez Azure).

### Cache offline (service worker)

Nagrania **nie** są w cache powłoki (pierwsze wczytanie zostaje lekkie). Są cache'owane leniwie przy pierwszym odtworzeniu, a ok. 6 s po starcie strona prosi service worker o dociągnięcie reszty w tle (3 pliki naraz; pomijane przy włączonym oszczędzaniu danych) – razem ok. 2,8 MB, więc po pierwszej wizycie wszystko działa offline.
Lektor pobiera pliki zwykłym `fetch` (całe pliki, bez nagłówka Range) i gra z `blob:`, dzięki czemu odpowiedzi trafiają do cache, a ścieżki są względne (działają pod `/pierwsze-slowa/`).
Po zmianie nagrań podnieś `VERSION` w `sw.js`.
