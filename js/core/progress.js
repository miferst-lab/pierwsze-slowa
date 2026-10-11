// Postępy: localStorage, klucz z wersją, bezpieczne parsowanie. Czyste funkcje (testowalne w node).
export const STORAGE_KEY = 'pierwsze-slowa:v1';
export const STATE_VERSION = 1;
export const ITEMS_PER_WORLD = 12;

export function defaultState() {
  return { v: STATE_VERSION, world: 'kosmos', narrator: true, rate: 0.8, voiceMode: 'recorded', speed: 1, volume: 1, voiceURI: null, unlockAll: false, levels: {}, hits: {}, misses: {}, updatedAt: 0 };
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
export function parseState(raw, worldIds = ['kosmos', 'dzungla', 'wyspy']) {
  const d = defaultState();
  let o;
  try { o = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return d; }
  if (!isObj(o) || o.v !== STATE_VERSION) return d;
  if (typeof o.world === 'string' && worldIds.includes(o.world)) d.world = o.world;
  if (typeof o.narrator === 'boolean') d.narrator = o.narrator;
  if (Number.isFinite(o.rate)) d.rate = clamp(o.rate, 0.5, 1.2);
  if (o.voiceMode === 'recorded' || o.voiceMode === 'system') d.voiceMode = o.voiceMode;
  if (Number.isFinite(o.speed)) d.speed = clamp(o.speed, 0.7, 1.3);
  if (Number.isFinite(o.volume)) d.volume = clamp(o.volume, 0.2, 1);
  if (typeof o.voiceURI === 'string') d.voiceURI = o.voiceURI.slice(0, 300);
  if (typeof o.unlockAll === 'boolean') d.unlockAll = o.unlockAll;
  if (isObj(o.levels)) {
    for (const [lid, lv] of Object.entries(o.levels)) {
      if (!isObj(lv) || !isObj(lv.tasks)) continue;
      const tasks = {};
      for (const [tid, s] of Object.entries(lv.tasks)) if (Number.isInteger(s) && s >= 1 && s <= 3) tasks[tid] = s;
      d.levels[lid] = { tasks, done: lv.done === true };
    }
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
