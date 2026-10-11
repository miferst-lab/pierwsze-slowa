// Polecenia lektora w zabawach (nowe nagrania). Szablony: czasownik zależy od gry i rodzaju zadania; po nim pada nagranie elementu
// (głoska, sylaba, słowo, liczba) – czyli bez generowania osobnego zdania dla każdej wartości.
export const VERBS = {
  catch: { sound: 'Złap literę', syllable: 'Złap sylabę', word: 'Złap słowo', number: 'Złap liczbę', result: 'Złap wynik.' },
  path: { sound: 'Idź do litery', syllable: 'Idź do sylaby', word: 'Idź do słowa', number: 'Idź do liczby', result: 'Idź do wyniku.' },
  balloons: { sound: 'Przebij balon z literą', syllable: 'Przebij balon z sylabą', word: 'Przebij balon ze słowem', number: 'Przebij balon z liczbą', result: 'Przebij balon z wynikiem.' },
};
export const GAME_PHRASES = Object.values(VERBS).flatMap((v) => Object.values(v)).concat(['Ile to jest', 'plus', 'minus']);

export const GAMES = {
  lap: { id: 'lap', title: 'Łap i czytaj', mathTitle: 'Łap i licz', verb: 'catch', blurb: 'Złap w koszyk to, o co prosi lektor.' },
  sciezka: { id: 'sciezka', title: 'Ścieżka', mathTitle: 'Ścieżka', verb: 'path', blurb: 'Poprowadź bohatera właściwą drogą.' },
  balony: { id: 'balony', title: 'Balony', mathTitle: 'Balony', verb: 'balloons', blurb: 'Przebij balon z właściwą odpowiedzią.' },
};
export const GAME_IDS = Object.keys(GAMES);
