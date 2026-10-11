// Czysta logika zabaw zręcznościowych (bez DOM): wybór treści z programu, harmonogram pojawiania się elementów, punktacja.
// Zabawy nie mają czasu, porażek ani żyć: błędny element tylko odpływa, a lektor powtarza polecenie.
import { VERBS } from './phrases.js';

export const GAME_TARGET = 6;                                   // tyle poprawnych trafień kończy rundę
export const GAME_SPEEDS = { slow: 0.55, normal: 1 };           // mnożnik prędkości (ustawienie rodzica „wolno / normalnie”)
export const speedFactor = (setting, { reduced = false, test = false } = {}) => (GAME_SPEEDS[setting] ?? GAME_SPEEDS.slow) * (reduced ? 0.7 : 1) * (test ? 2.5 : 1);
/** Gwiazdki za rundę: 3 gdy ≤ 1 pomyłka, 2 gdy ≤ 4, w pozostałych razach 1 – ukończona runda zawsze daje gwiazdkę. */
export const starsForGame = (wrongs) => (wrongs <= 1 ? 3 : wrongs <= 4 ? 2 : 1);

export function createTracker(target = GAME_TARGET) {
  const t = { target, correct: 0, wrongs: 0, hit() { t.correct++; return t.done; }, miss() { t.wrongs++; }, get done() { return t.correct >= t.target; }, get stars() { return starsForGame(t.wrongs); } };
  return t;
}

/* ---------- czego dziecko już się nauczyło ---------- */
const uniq = (a) => [...new Set(a)];
/** Poziomy „znane”: ukończone (lub wszystkie przy odblokowaniu); na początku – pierwszy poziom, żeby zabawa nie była pusta. */
function knownLevels(state, levels) {
  const done = levels.filter((l) => state.unlockAll || state.levels?.[l.id]?.done === true);
  return done.length ? done : levels.slice(0, 1);
}
export function learnedReading(state, levels) {
  const ks = knownLevels(state, levels);
  return { sounds: uniq(ks.flatMap((l) => l.learn?.sounds ?? [])), syllables: uniq(ks.flatMap((l) => l.learn?.syllables ?? [])), words: uniq(ks.flatMap((l) => l.learn?.words ?? [])) };
}
export function learnedMath(state, levels) {
  const done = levels.filter((l) => state.unlockAll || state.levels?.[l.id]?.done === true);
  const ks = done.length ? done : levels.slice(0, 1);
  const max = (k) => Math.max(0, ...ks.map((l) => l.learn?.[k] ?? 0));
  return { maxNum: max('maxNum'), add: max('add'), sub: max('sub') };
}
export const learnedFor = (subject, state, levels) => (subject === 'math' ? learnedMath(state, levels) : learnedReading(state, levels));

/* ---------- pytania ---------- */
const pickOne = (arr, rand) => arr[Math.min(arr.length - 1, Math.floor(rand() * arr.length))];
const sample = (arr, k, rand) => { const a = [...arr]; const out = []; while (a.length && out.length < k) out.push(a.splice(Math.floor(rand() * a.length), 1)[0]); return out; };
const soundLabel = (s) => (s.length > 1 ? `${s[0].toUpperCase()}${s.slice(1)} ${s}` : `${s.toUpperCase()}${s}`);

/**
 * Jedno pytanie: { kind, key, ask: {text, say[]}, correct: item, items: [item…] }.
 * item = { id, label, say, key } – say to część dla lektora (np. '#m', 'ma', 'kot', {num: 7}).
 * n = ile elementów razem (poprawny + rozpraszacze). last = key poprzedniego pytania (nie powtarzamy z rzędu).
 */
export function makeQuestion(subject, learned, game, rand = Math.random, { n = 4, last = null } = {}) {
  return subject === 'math' ? mathQuestion(learned, game, rand, n, last) : readingQuestion(learned, game, rand, n, last);
}
function withVerb(game, kind, itemSay) { const verb = VERBS[game][kind]; return kind === 'result' ? { before: [], verb } : { before: [verb, itemSay], verb }; }

function readingQuestion(L, game, rand, n, last) {
  const kinds = [];
  if (L.sounds.length >= 3) kinds.push('sound');
  if (L.syllables.length >= 3) kinds.push('syllable', 'syllable');
  if (L.words.length >= 3) kinds.push('word', 'word');
  if (!kinds.length) kinds.push('sound');
  const kind = pickOne(kinds, rand), pool = { sound: L.sounds, syllable: L.syllables, word: L.words }[kind];
  const cand = pool.filter((x) => (kind === 'sound' ? '#' : '') + x !== last);
  const ans = pickOne(cand.length ? cand : pool, rand);
  const mk = (x) => ({ id: x, key: x, label: kind === 'sound' ? soundLabel(x) : x, say: kind === 'sound' ? '#' + x : x });
  let others = pool.filter((x) => x !== ans);
  if (kind === 'syllable') { const sim = others.filter((x) => x[0] === ans[0] || x.slice(-1) === ans.slice(-1)); others = [...sample(sim, 1, rand), ...sample(others.filter((x) => !sim.includes(x)), n, rand)]; }
  const items = [ans, ...uniq(others).slice(0, n - 1)].map(mk);
  const correct = items[0];
  return { kind, key: (kind === 'sound' ? '#' : '') + ans, correct, items, ask: { text: { sound: `Litera ${soundLabel(ans)}`, syllable: `Sylaba ${ans}`, word: `Słowo „${ans}”` }[kind], say: [VERBS[game][kind], correct.say] } };
}

function mathQuestion(L, game, rand, n, last) {
  const ops = []; if (L.add > 0) ops.push('+'); if (L.sub > 0) ops.push('-');
  const wantResult = ops.length && rand() < 0.55;
  const near = (v, lo, hi) => { const c = []; for (let d = 1; d <= 4; d++) for (const s of [-1, 1]) if (v + s * d >= lo && v + s * d <= hi) c.push(v + s * d); return c; };
  const item = (v) => ({ id: String(v), key: 'm:' + v, label: String(v), say: { num: v } });
  if (wantResult) {
    const op = pickOne(ops, rand), top = op === '+' ? L.add : L.sub;
    let a, b, c, tries = 0;
    do {
      if (op === '+') { c = 2 + Math.floor(rand() * (top - 1)); a = 1 + Math.floor(rand() * (c - 1)); b = c - a; } else { a = 2 + Math.floor(rand() * (top - 1)); b = 1 + Math.floor(rand() * (a - 1)); c = a - b; }
    } while (`m:${a}${op}${b}` === last && ++tries < 10);
    const vals = [c, ...sample(near(c, 0, Math.max(top, c + 2)), n - 1, rand)];
    const items = vals.map(item);
    return { kind: 'result', key: `m:${a}${op}${b}`, expr: { a, op, b, c }, correct: items[0], items, ask: { text: `${a} ${op === '+' ? '+' : '−'} ${b} = ?`, say: ['Ile to jest', { num: a }, op === '+' ? 'plus' : 'minus', { num: b }, VERBS[game].result] } };
  }
  const hi = L.maxNum, lo = 0;
  let v, tries = 0; do { v = lo + Math.floor(rand() * (hi - lo + 1)); } while (`m:${v}` === last && ++tries < 10);
  const pool = hi > 30 ? near(v, 0, 100) : [...Array(hi + 1).keys()].filter((x) => x !== v);
  const items = [v, ...sample(pool, n - 1, rand)].map(item);
  return { kind: 'number', key: 'm:' + v, correct: items[0], items, ask: { text: `Liczba ${v}`, say: [VERBS[game].number, { num: v }] } };
}

/** Zawsze zawiera poprawny element; reszta losowo. */
export function pickItems(q, n, rand = Math.random) {
  const wrong = q.items.filter((i) => i.id !== q.correct.id);
  return [q.correct, ...sample(wrong, Math.max(0, n - 1), rand)];
}

/* ---------- harmonogram pojawiania się elementów (czas wstrzykiwany: testowalny z „fałszywym zegarem”) ---------- */
/**
 * tick(dt, {alive, aliveCorrect}) → lista zleceń {lane, correct}. Pierwszy element pojawia się od razu; potem co `interval` sekund,
 * nie więcej niż `maxAlive` naraz; poprawny element jest zawsze na planszy (gdy go brak) i co najwyżej co `correctEvery`-ty element.
 */
export function createSpawner({ interval = 2.4, maxAlive = 4, lanes = 5, correctEvery = 3, rand = Math.random } = {}) {
  let timer = interval, since = 0, lastLane = -1;
  return {
    reset() { timer = interval; since = 0; lastLane = -1; },
    tick(dt, { alive = 0, aliveCorrect = 0 } = {}) {
      timer += dt; const out = []; let a = alive, ac = aliveCorrect;
      while (timer >= interval && a < maxAlive) {
        timer = 0; // bez nadrabiania zaległości: odstęp między elementami ≥ interval
        const correct = ac === 0 || since >= correctEvery - 1;
        let lane = Math.floor(rand() * lanes); if (lane === lastLane) lane = (lane + 1 + Math.floor(rand() * Math.max(1, lanes - 1))) % lanes;
        lastLane = lane; since = correct ? 0 : since + 1; a++; if (correct) ac++;
        out.push({ lane, correct });
      }
      if (a >= maxAlive) timer = Math.min(timer, interval); // gdy plansza pełna, kolejny pojawi się najwcześniej po `interval` od zwolnienia miejsca
      return out;
    },
  };
}
