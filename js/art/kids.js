// Bohater-przewodnik wybierany przez gracza: zwierzęce postacie narysowane przez Artystę (Grok) na podstawie dzieci.
// UWAGA: gra jest rodzinna – zawiera podobizny dzieci; przed publicznym udostępnieniem repo ustaw jako prywatne albo usuń art/kids/.
// Każda postać ma wariant (zwierzę) dla świata i cztery pozy: stoi (domyślna), macha (start), cieszy (nagroda/pochwała), mysli (podpowiedź/ponowna próba).
// Pliki: art/kids/<wariant>-<poza>.webp (przezroczyste), twarz do wyboru: art/kids/<id>-face.webp. Brak pozy => poza „stoi”.
import { KID_SIZES } from './kidsizes.js';
export const KIDS = [
  { id: 'piotr', name: 'Piotr', voc: 'Piotrku', variants: { default: 'piotr-lis', dzungla: 'piotr-tygrys', wyspy: 'piotr-pingwin' } },
  { id: 'kuba', name: 'Kuba', voc: 'Kubo', variants: { default: 'kuba-lis', dzungla: 'kuba-wiewiorka', wyspy: 'kuba-wiewiorka' } },
  { id: 'sara', name: 'Sara', voc: 'Saro', variants: { default: 'sara-lisica', dzungla: 'sara-sarna', wyspy: 'sara-sarna' } },
].map((k) => ({ ...k, face: `art/kids/${k.id}-face.webp` }));
export const DEFAULT_KID = 'piotr';
export const POSES = ['stoi', 'macha', 'cieszy', 'mysli'];
export const kidById = (id) => KIDS.find((k) => k.id === id) ?? KIDS.find((k) => k.id === DEFAULT_KID) ?? KIDS[0] ?? null;
/** [nazwa pliku bez rozszerzenia, szerokość, wysokość] dla postaci, świata i pozy (brak pozy w zestawie => „stoi”). */
export function kidFile(k, worldId, pose = 'stoi') {
  const base = k.variants[worldId] ?? k.variants.default;
  const name = KID_SIZES[`${base}-${pose}`] ? `${base}-${pose}` : `${base}-stoi`;
  return [name, ...KID_SIZES[name]];
}
export const kidSrc = (k, worldId, pose) => `art/kids/${kidFile(k, worldId, pose)[0]}.webp`;
export const kidImg = (k, worldId, pose = 'stoi', cls = 'guide-img') => { const [f, w, h] = kidFile(k, worldId, pose); return `<img class='${cls}' src='art/kids/${f}.webp' alt='' width='${w}' height='${h}' draggable='false'>`; };
export const kidHeroHtml = (k, worldId) => kidImg(k, worldId, 'macha');
export const kidDoneUrl = (k, worldId) => new URL(kidSrc(k, worldId, 'cieszy'), document.baseURI).href;
