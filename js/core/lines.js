// Powtarzalne wypowiedzi lektora (pochwały, zachęty) + losowanie wariantów bez powtórzeń z rzędu.
// Każdy tekst stąd ma nagranie (patrz js/core/spoken.js i tools/generate-audio.py).

/** Pochwały po dobrej odpowiedzi – wesołe, z wykrzyknikiem. */
export const PRAISE = [
  'Brawo!', 'Super!', 'Świetnie!', 'Świetnie ci idzie!', 'Gwiazdka dla Ciebie!', 'Tak jest!',
  'Pięknie!', 'Doskonale!', 'Wspaniale!', 'Brawo, Piotrku!', 'Brawo! Tak trzymaj!', 'Rewelacja!',
];

/** Zachęty po błędzie – ciepłe, bez krytyki (spokojniejsze niż pochwały). */
export const RETRY = [
  'Prawie! Spróbuj jeszcze raz.', 'Nic nie szkodzi. Spróbuj jeszcze raz.', 'Spróbuj jeszcze raz.',
  'Jeszcze raz, na pewno dasz radę!', 'Posłuchaj jeszcze raz i spróbuj.',
];

/** Po ukończeniu poziomu. */
export const FINISH = ['Brawo! Ukończyłeś poziom.', 'Hurra! Poziom ukończony!', 'Świetna robota! Ukończyłeś poziom.'];

/** Teksty panelu rodzica (próbki głosu). */
export const PARENT_LINES = ['Cześć Piotrku! Zaczynamy czytać.', 'Tak brzmi lektor w tym tempie.'];

/** Wszystkie linie, które mają rodzaj „pochwała" (jaśniejsza intonacja). */
export const PRAISE_KINDS = { praise: PRAISE, retry: RETRY, finish: FINISH, parent: PARENT_LINES };

/**
 * Losuje wariant z listy, nigdy ten sam co `last` (gdy jest z czego wybierać).
 * rand: () => [0,1) – wstrzykiwalne w testach.
 */
export function pickVariant(list, last = null, rand = Math.random) {
  const pool = list.length > 1 ? list.filter((x) => x !== last) : list;
  return pool[Math.min(pool.length - 1, Math.floor(rand() * pool.length))];
}

/** Losowacz z pamięcią ostatniego wyniku (osobny dla każdej listy). */
export function variantPicker(list, rand = Math.random) {
  let last = null;
  return () => (last = pickVariant(list, last, rand));
}
