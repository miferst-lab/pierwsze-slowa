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
| `tlo-lesna.webp`, `tlo-kosmos.webp`, `tlo-dzungla.webp`, `tlo-wyspy.webp` | `new2/01–04_tlo_*` | zmniejszone, nakładka w kolorze świata (kontrast) |

## Oryginalne SVG/CSS (własne, rysowane w kodzie)
- 12 skarbów (żołądź, liść dębu, muchomor, kompas, mapa, latarnia, gwiazdka, puchar, skrzynia, namiot, szyszka, plecak) – `js/art/lesna.js`
- odznaki „Odkrywca Liter” i „Mistrz Liczenia” (SVG, odblokowują się po ukończeniu wszystkich poziomów modułu)
- drewniane tabliczki, przyciski, pergamin ze ściegiem, tabliczki poziomów z odznaką-tarczą, „zasłona z liści” zablokowanych poziomów – `css/lesna.css`
- paleta (tokeny sprawdzane testem kontrastu WCAG AA) – `js/art/lesna.js`

## Czego nie odwzorowano wiernie
Kręta ścieżka mapy poziomów to zygzak tabliczek połączonych deskami (mapa poziomów jest siatką, nie jedną ilustracją); nie mamy wersji
postaci z przezroczystością w wielu pozach, więc w zadaniach jako przewodnik działa okrągły portret lisa. Zdania lektora i wszystkie teksty zostały bez zmian.
