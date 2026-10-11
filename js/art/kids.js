// Bohater-przewodnik wybierany przez gracza: zwierzęce postacie narysowane przez Artystę (Grok) na podstawie dzieci.
// UWAGA: gra jest rodzinna – zawiera podobizny dzieci; przed publicznym udostępnieniem repo ustaw jako prywatne albo usuń art/kids/.
// Każda postać: plik domyślny + (opcjonalnie) inna wersja dla wybranego świata, np. Piotr jako tygrysek w dżungli i pingwin na wyspach.
// Pliki: art/kids/<plik>.webp (przezroczyste), twarz do wyboru: art/kids/<id>-face.webp.
export const KIDS = [
  { id: 'piotr', name: 'Piotr', files: { default: ['piotr-hero', 319, 460], dzungla: ['piotr-tygrys', 287, 460], wyspy: ['piotr-pingwin', 274, 460] } },
  { id: 'kuba', name: 'Kuba', files: { default: ['kuba-hero', 318, 460], dzungla: ['kuba-wiewiorka', 364, 460], wyspy: ['kuba-wiewiorka', 364, 460] } },
  { id: 'sara', name: 'Sara', files: { default: ['sara-hero', 280, 460], dzungla: ['sara-sarna', 238, 460], wyspy: ['sara-sarna', 238, 460] } },
].map((k) => ({ ...k, face: `art/kids/${k.id}-face.webp` }));
export const DEFAULT_KID = 'piotr';
export const kidById = (id) => KIDS.find((k) => k.id === id) ?? KIDS.find((k) => k.id === DEFAULT_KID) ?? KIDS[0] ?? null;
export const kidFile = (k, worldId) => k.files[worldId] ?? k.files.default;
export const kidHeroHtml = (k, worldId) => { const [f, w, h] = kidFile(k, worldId); return `<img class='guide-img' src='art/kids/${f}.webp' alt='' width='${w}' height='${h}' draggable='false'>`; };
export const kidDoneUrl = (k, worldId) => new URL(`art/kids/${kidFile(k, worldId)[0]}.webp`, document.baseURI).href;
