# Grafika – „Leśna Wyprawa”

Kierunek graficzny (postacie, paleta, drewniane tabliczki, ścieżka poziomów, odznaki) pochodzi od **Artysty z projektu Grok**
(makiety i notatki: `grok-art/NOTES.md`, zestawy `new`, `new2`). Makiety zawierają wpalone napisy, więc nie używamy ich jako ekranów –
wycinamy tylko fragmenty bez tekstu albo rysujemy elementy od nowa.

## Pochodne z JPG Artysty (WebP w `art/lesna/`, narzędzia w `tools/`)
| Plik | Źródło | Jak |
|---|---|---|
| `lis.webp`, `mis.webp`, `sowa.webp`, `wiewiorka.webp`, `zajac.webp`, `jez.webp` | makiety `zwierzatka-odkrywcy` i `przytulne-zwierzatka` | okrągłe portrety (`tools/make-art.py`) |
| `wyprawa.webp`, `ekipa.webp` | te same makiety | kadr grupy bez napisów, brzegi wtapiane maską CSS |
| `lis-macha.webp`, `lis-cieszy.webp` | `new2/07_lis_macha_green`, `06_lis_cieszy_sie_green` | klucz zielonego tła + despill (`tools/key-art.py`) |
| `tlo-lesna.webp` (tła kosmos/dżungla/wyspy z new2 zastąpiły sceny z zestawu 6) | `new2/01–04_tlo_*` | zmniejszone, nakładka w kolorze świata (kontrast) |

## Oryginalne SVG/CSS (własne, rysowane w kodzie)
- 12 skarbów (żołądź, liść dębu, muchomor, kompas, mapa, latarnia, gwiazdka, puchar, skrzynia, namiot, szyszka, plecak) – `js/art/lesna.js`
- odznaki „Odkrywca Liter” i „Mistrz Liczenia” (SVG, odblokowują się po ukończeniu wszystkich poziomów modułu)
- drewniane tabliczki, przyciski, pergamin ze ściegiem, tabliczki poziomów z odznaką-tarczą, „zasłona z liści” zablokowanych poziomów – `css/lesna.css`
- paleta (tokeny sprawdzane testem kontrastu WCAG AA) – `js/art/lesna.js`

## Czego nie odwzorowano wiernie
Kręta ścieżka mapy poziomów to zygzak tabliczek połączonych deskami (mapa poziomów jest siatką, nie jedną ilustracją); nie mamy wersji
postaci z przezroczystością w wielu pozach, więc w zadaniach jako przewodnik działa okrągły portret lisa. Zdania lektora i wszystkie teksty zostały bez zmian.

## Gra rodzinna – podobizny dzieci
Wybór bohatera (przycisk „Mój bohater” na starcie i sekcja „Bohater gry” w panelu rodzica; domyślnie Piotr, zapis w localStorage) używa zwierzęcych
postaci narysowanych przez Artystę na podstawie dzieci (Piotr, Sara, Kuba), katalog `art/kids/` (lista w `js/art/kids.js`). Do repozytorium trafiają
wyłącznie te rysunki, nigdy oryginalne zdjęcia. **Ponieważ gra zawiera podobizny dzieci, jest tylko do użytku rodzinnego: przed jakimkolwiek
publicznym udostępnieniem ustaw repozytorium (i GitHub Pages) jako prywatne albo usuń `art/kids/` i wpisy z `js/art/kids.js`.**

## Ramki i inne elementy UI
`art/ui/ramka-{kosmos,dzungla,wyspy}.webp` – ramki kart startowych z `new4/p2_01, p2_04, p2_06` (klucz zieleni z wnętrzem, `--holes`).
Nie użyto (SVG/CSS zamiast): karta poziomu dżungli (zielona ramka na ciemniejszej zieleni), wieniec odznaki (zielony), kamyki ścieżki, gwiazdka i żołądź z `p2_09/12`,
pomocnicy (małpka, miś polarny), pozy „myśli”.

## Zestaw 5, postacie dzieci i zakończenie integracji (11.10.2026)

- `art/kids/` – stylizowane zwierzęce postacie (Piotr: lis / tygrysek / pingwin; Kuba: lis-odkrywca / wiewiórka; Sara: lisica / sarna) + okrągłe twarze do wyboru (`*-face.webp`, wycięte z górnej części postaci). Wybór przewodnika: przycisk „Mój bohater" i panel rodzica; zapis w `localStorage` (`guide`), domyślnie Piotr. W dżungli i na wyspach Piotr/Kuba/Sara pojawiają się w wersjach zwierząt pasujących do świata (`kidFile` w `js/art/kids.js`).
- `art/guides/kosmos-macha.webp`, `kosmos-mysli.webp` – lis astronauta (b_01/b_02).
- `art/words/` – balon, mak, kot, dom (a_01–a_04) obok mama/ryba/żaba; drzewo, auto, słońce i robot-pomocnik (b_03) są w folderach Artysty, ale nie mają jeszcze miejsca w grze.
- `art/stars/*.webp` (gwiazdki nagród per świat; b_04–b_06 i p2_09) i `art/badges/*.webp` (odznaki kosmos/dżungla/wyspy, b_07–b_09) – klucz zieleni wyłącznie od krawędzi, więc zielona wyspa/palma na odznace zostaje.
- Niewykorzystane (zostają fallbacki SVG/CSS): kamyki ścieżki dżungli/wyspy (b_10/b_11), karta poziomu dżungli v2 (b_12).
- Klucz zieleni: `tools/key-art.py` zmniejsza obraz (`--pre 900`) przed wycinaniem; progi obejmują ciemniejszą zieleń (25–67, 182–210, 39–95) i szarozielony pingwin.

### UWAGA: gra tylko rodzinna
Postacie w `art/kids/` to stylizowane podobizny dzieci Daniela (zdjęć oryginalnych w repo nie ma). Dlatego **gra jest przeznaczona wyłącznie do użytku rodzinnego**: przed jakimkolwiek publicznym udostępnieniem trzeba ustawić repozytorium (i stronę GitHub Pages) jako prywatne albo usunąć `art/kids/` i wpisy w `js/art/kids.js`.

## Zestaw 6 (11.10.2026) – drugi przebieg integracji

- **Pozy bohatera** (`art/kids/<wariant>-<poza>.webp`, 20 plików z `dz_*` + istniejące „stoi”): `macha` na ekranie startowym, `cieszy` na ekranie nagrody (`--done-art`) i po dobrej odpowiedzi, `mysli` po pomyłce/podpowiedzi, `stoi` w pozostałych miejscach (mały bohater w stopce zadań; poza zmienia się z klasami `.cheer`/`.think`). Brak `dz_sara_sarna_mysli` (dziewczynka poza stylem – pominięta): Sara-sarna używa wtedy pozy „stoi”.
- **Pomocnicy 2** (`art/helpers/`): robot (kosmos), małpka (dżungla), foka (wyspy), jeż (las) – ekrany ukończenia poziomu i zabawy, po prawej stronie karty.
- **Sceny** (`art/scenes/*.webp`, 3:2, `background-size:cover`, środek bezpieczny): tła zadań (kosmos/dżungla/wyspy; las zostaje `tlo-lesna.webp`), mapy poziomów (4 światy) i ekrany startowe (4 światy), każde z półprzezroczystą nakładką w kolorze świata (`--ov`, `--ov-task/-start/-map` w `css/lesna.css`), żeby kontrast tekstu się nie zmienił. Wybór sceny: `html:has(.start|.tiles-grid)`.
- **Awatar lektorki** (`js/core/avatar.js`, `art/lektor/`): mała postać przy zadaniu (lisica z mapą / robot / sowa / miś polarny). Podskakuje, gdy gra lektor; „cieszy się” po pochwale, „myśli” po pomyłce – nastrój wynika z rodzaju wypowiedzi w `Narrator.speak` (zdarzenia `onSpeak`), więc działa też przy wyłączonym dźwięku. Dżungla: Artysta dał „mówi” tylko jako małpkę, więc mówienie = sowa „cieszy się” z podskokiem. Wyłączenie: Dla rodzica → „Awatar lektora” (`state.avatar`). Awatar jest ukryty na ekranach startu, map, skarbów i ukończenia oraz poniżej 1000 px szerokości.
- **Powitanie** na starcie używa imienia wybranego bohatera (Piotrku / Kubo / Saro). Jest to tekst, nie głos – bez nowego audio.
- Niewykorzystane: lektorka_07 (małpka „mówi”, niespójna), `pom2_dzungla_malpka_macha` i inne pozy „macha” pomocników. Mapy poziomów: karty poziomów zasłaniają większość ilustracji ścieżki (poza lasem, gdzie karty idą wężykiem), ścieżka z grafiki nie jest zgrana z kartami.
- Rozmiar `art/`: ok. 2,8 MB.

## Ćwiczenia wymowy (grafika)
Rysunki buzi (przekrój z boku, buzia z przodu, wiatraczek, zupa) są własnym SVG/CSS w `modules/pron/mouth.js` i `css/pron.css` – bez nowych plików graficznych. To uproszczone ilustracje poglądowe, nie schematy medyczne.
