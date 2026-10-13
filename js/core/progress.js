// Postępy: localStorage, klucz z wersją, bezpieczne parsowanie. Czyste funkcje (testowalne w node).
export const STORAGE_KEY = 'pierwsze-slowa:v1';
export const STATE_VERSION = 1;
export const ITEMS_PER_WORLD = 12;

export function defaultState() {
  return { v: STATE_VERSION, world: 'lesna', guide: null, avatar: true, iconSet: 'b', narrator: true, rate: 0.8, voiceMode: 'recorded', speed: 1, volume: 1, voiceURI: null, unlockAll: false, gameSpeed: 'slow', games: {}, levels: {}, hits: {}, misses: {}, last: null, updatedAt: 0 };
}

const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const cleanCounts = (o) => {
  const out = {};
  if (!isObj(o)) return out;
  for (const [k, v] of Object.entries(o)) if (Number.isFinite(v) && v > 0 && k.length < 40) out[k] = Math.floor(v);
  return out;
};

/** Bezpieczne parsowanie: dowolny śmieć -> stan domyślny; pola poprawiane pojedynczo. */
export function parseState(raw, worldIds = ['lesna', 'kosmos', 'dzungla', 'wyspy']) {
  const d = defaultState();
  let o;
  try { o = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return d; }
  if (!isObj(o) || o.v !== STATE_VERSION) return d;
  if (typeof o.world === 'string' && worldIds.includes(o.world)) d.world = o.world;
  if (typeof o.avatar === 'boolean') d.avatar = o.avatar;
  if (o.iconSet === 'a' || o.iconSet === 'b') d.iconSet = o.iconSet;
  if (typeof o.guide === 'string' && /^[a-z]{2,16}$/.test(o.guide)) d.guide = o.guide;
  if (typeof o.narrator === 'boolean') d.narrator = o.narrator;
  if (Number.isFinite(o.rate)) d.rate = clamp(o.rate, 0.5, 1.2);
  if (o.voiceMode === 'recorded' || o.voiceMode === 'system') d.voiceMode = o.voiceMode;
  if (Number.isFinite(o.speed)) d.speed = clamp(o.speed, 0.7, 1.3);
  if (Number.isFinite(o.volume)) d.volume = clamp(o.volume, 0.2, 1);
  if (typeof o.voiceURI === 'string') d.voiceURI = o.voiceURI.slice(0, 300);
  if (typeof o.unlockAll === 'boolean') d.unlockAll = o.unlockAll;
  if (o.gameSpeed === 'slow' || o.gameSpeed === 'normal') d.gameSpeed = o.gameSpeed;
  if (isObj(o.games)) {
    for (const [k, g] of Object.entries(o.games)) {
      if (!/^(reading|math):[a-z]{3,12}$/.test(k) || !isObj(g)) continue;
      d.games[k] = { stars: Number.isInteger(g.stars) ? clamp(g.stars, 0, 3) : 0, plays: Number.isInteger(g.plays) ? clamp(g.plays, 0, 100000) : 0 };
    }
  }
  if (isObj(o.levels)) {
    for (const [lid, lv] of Object.entries(o.levels)) {
      if (!isObj(lv) || !isObj(lv.tasks)) continue;
      const tasks = {};
      for (const [tid, s] of Object.entries(lv.tasks)) if (Number.isInteger(s) && s >= 1 && s <= 3) tasks[tid] = s;
      d.levels[lid] = { tasks, done: lv.done === true };
    }
  }
  if (isObj(o.last) && ['reading', 'math', 'pron'].includes(o.last.module) && typeof o.last.level === 'string' && /^[A-Za-z0-9_-]{1,20}$/.test(o.last.level)) {
    d.last = { module: o.last.module, level: o.last.level, idx: Number.isInteger(o.last.idx) ? clamp(o.last.idx, 0, 200) : 0, world: d.world, at: Number.isFinite(o.last.at) ? o.last.at : 0 };
  }
  d.hits = cleanCounts(o.hits);
  d.misses = cleanCounts(o.misses);
  d.updatedAt = Number.isFinite(o.updatedAt) ? o.updatedAt : 0;
  return d;
}

export function loadState(storage, worldIds) {
  try { return parseState(storage?.getItem(STORAGE_KEY), worldIds); } catch { return defaultState(); }
}
export function saveState(storage, state) {
  try { state.updatedAt = Date.now(); storage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; } catch { return false; }
}
export function resetState(storage) {
  try { storage?.removeItem(STORAGE_KEY); } catch { /* brak dostępu – trudno */ }
  return defaultState();
}
export const exportJSON = (state) => JSON.stringify(state, null, 2);
export function importJSON(text, worldIds) {
  let o; try { o = JSON.parse(text); } catch { return null; }
  return isObj(o) && o.v === STATE_VERSION ? parseState(o, worldIds) : null;
}

/** Nowa sesja gry = drugi wariant ikon modułów (A/B na zmianę). */
export const nextIconSet = (cur) => (cur === 'a' ? 'b' : 'a');

/** Gwiazdki za zadanie: 3 bez pomyłek, 2 po jednej, 1 po kilku. */
export const starsForWrongs = (wrongs) => (wrongs <= 0 ? 3 : wrongs === 1 ? 2 : 1);

/** Zapisuje wynik zadania (zachowuje najlepszy). Zwraca true, gdy poziom właśnie ukończono. */
export function recordTask(state, level, taskId, stars) {
  const lv = (state.levels[level.id] ??= { tasks: {}, done: false });
  lv.tasks[taskId] = Math.max(lv.tasks[taskId] ?? 0, clamp(Math.round(stars), 1, 3));
  const wasDone = lv.done;
  lv.done = level.tasks.every((t) => lv.tasks[t.id]);
  return lv.done && !wasDone;
}
export const recordHit = (s, item) => { if (item) s.hits[item] = (s.hits[item] ?? 0) + 1; };
export const recordMiss = (s, item) => { if (item) s.misses[item] = (s.misses[item] ?? 0) + 1; };

export const isLevelDone = (s, level) => s.levels[level.id]?.done === true;
export const tasksDone = (s, level) => level.tasks.filter((t) => s.levels[level.id]?.tasks?.[t.id]).length;
export const levelStarTotal = (s, level) => level.tasks.reduce((a, t) => a + (s.levels[level.id]?.tasks?.[t.id] ?? 0), 0);
/** 0 gdy nieukończony; 1–3 gdy ukończony (wg średniej z zadań). */
export function levelRating(s, level) {
  if (!isLevelDone(s, level)) return 0;
  const ratio = levelStarTotal(s, level) / (3 * level.tasks.length);
  return ratio >= 0.85 ? 3 : ratio >= 0.6 ? 2 : 1;
}
export const totalStars = (s, levels) => levels.reduce((a, l) => a + levelStarTotal(s, l), 0);
export const completedCount = (s, levels) => levels.filter((l) => isLevelDone(s, l)).length;
export function isUnlocked(s, levels, idx) {
  return s.unlockAll || idx === 0 || isLevelDone(s, levels[idx - 1]);
}
/** Ile skarbów (z ITEMS_PER_WORLD) odblokowano – rośnie z ukończonymi poziomami, po wszystkich = komplet. */
export function itemsUnlocked(s, levels, total = ITEMS_PER_WORLD) {
  return Math.min(total, Math.ceil((completedCount(s, levels) * total) / levels.length));
}
/** Pierwsze nieukończone zadanie poziomu (0 gdy ukończony – powtórka od początku). */
export function resumeIndex(s, level) {
  if (isLevelDone(s, level)) return 0;
  const i = level.tasks.findIndex((t) => !s.levels[level.id]?.tasks?.[t.id]);
  return i < 0 ? 0 : i;
}
/** Najsłabsze elementy: po odsetku pomyłek (min. 1 pomyłka), malejąco. */
export function weakItems(s, n = 10) {
  return Object.keys(s.misses)
    .map((k) => ({ item: k, misses: s.misses[k], hits: s.hits[k] ?? 0 }))
    .map((x) => ({ ...x, ratio: x.misses / (x.misses + x.hits) }))
    .sort((a, b) => b.ratio - a.ratio || b.misses - a.misses)
    .slice(0, n);
}

/** Zabawy zręcznościowe: najlepsze gwiazdki (1–3) i liczba rund. Klucz: „reading:lap”, „math:sciezka”. */
export const gameKey = (subject, id) => `${subject}:${id}`;
export function recordGame(state, subject, id, stars) {
  const g = (state.games[gameKey(subject, id)] ??= { stars: 0, plays: 0 });
  g.stars = Math.max(g.stars, clamp(Math.round(stars), 1, 3)); g.plays += 1;
  return g;
}
export const gameInfo = (state, subject, id) => state.games[gameKey(subject, id)] ?? { stars: 0, plays: 0 };
/** Skarby rosną z ukończonymi poziomami WSZYSTKICH modułów; nigdy nie mniej niż wcześniej (sam moduł czytania). */
export function itemsUnlockedCombined(s, readingLevels, allLevels, total = ITEMS_PER_WORLD) {
  return Math.max(itemsUnlocked(s, readingLevels, total), itemsUnlocked(s, allLevels, total));
}

/** Zapamiętuje, gdzie dziecko skończyło: moduł, poziom i numer zadania (do przycisku „Kontynuuj”). */
export function setLast(state, module, levelId, idx) {
  state.last = { module, level: levelId, idx: Math.max(0, idx | 0), world: state.world, at: Date.now() };
  return state.last;
}
/** Co wznowić: ostatni poziom (od pierwszego nieukończonego zadania); gdy ukończony – następny odblokowany poziom tego modułu. null = brak. */
export function resumeTarget(state, levelsByModule) {
  const l = state.last; if (!l) return null;
  const levels = levelsByModule[l.module]; if (!levels) return null;
  let i = levels.findIndex((x) => x.id === l.level); if (i < 0) return null;
  if (isLevelDone(state, levels[i])) { if (i + 1 >= levels.length || !isUnlocked(state, levels, i + 1)) return null; i++; }
  const level = levels[i];
  return { module: l.module, level, idx: resumeIndex(state, level), tasks: level.tasks.length };
}
