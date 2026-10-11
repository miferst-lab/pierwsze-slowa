// Węzły „Zabawa” na mapie poziomów (czytanie i matematyka) oraz zabawa bonusowa co kilka poziomów.
import { h, STAR } from '../core/ui.js';
import * as P from '../core/progress.js';
import { GAMES, GAME_IDS } from './phrases.js';
import { runGame } from './index.js';

export const GAME_UNLOCK_AFTER = 3;
export const gamesUnlocked = (state, levels) => state.unlockAll || P.completedCount(state, levels) >= GAME_UNLOCK_AFTER;
/** Zabawa bonusowa po poziomach 4, 8, 12… – kolejne zabawy po kolei. */
export const bonusGameFor = (level) => (level.num % 4 === 0 ? GAME_IDS[(level.num / 4 - 1) % GAME_IDS.length] : null);

export function gamesSection(ctx, subject, levels, onExit, box) {
  const open = gamesUnlocked(ctx.state, levels);
  const row = h('div', { class: 'tiles-grid games-grid' });
  for (const id of GAME_IDS) {
    const g = GAMES[id], info = P.gameInfo(ctx.state, subject, id);
    const tile = h('button', { class: 'tile-level tile-game' + (open ? '' : ' locked') + (info.stars ? ' done' : ''), type: 'button', 'data-game': id, 'aria-disabled': open ? null : 'true',
      'aria-label': `Zabawa: ${subject === 'math' ? g.mathTitle : g.title}. ${open ? `Najlepszy wynik: ${info.stars} z 3 gwiazdek` : `Odblokuje się po ukończeniu ${GAME_UNLOCK_AFTER} poziomów`}` },
    h('span', { class: 'lnum game-badge' }, '★'), h('span', { class: 'ltitle' }, subject === 'math' ? g.mathTitle : g.title), h('span', { class: 'lprev' }, open ? g.blurb : `Po ${GAME_UNLOCK_AFTER} poziomach`),
    h('span', { class: 'lstars', 'aria-hidden': 'true' }, [1, 2, 3].map((n) => h('span', { class: 'ms' + (n <= info.stars ? ' on' : ''), html: STAR }))));
    tile.addEventListener('click', () => { if (!open) { ctx.toast(`Zabawa odblokuje się po ukończeniu ${GAME_UNLOCK_AFTER} poziomów.`); return; } ctx.onWorld = null; runGame(ctx, box, { subject, gameId: id, onExit }); });
    row.append(tile);
  }
  return h('section', { class: 'group games' }, h('h2', { class: 'on-bg' }, 'Zabawa'), row);
}
export function startBonus(ctx, box, subject, level, onExit) {
  const gameId = bonusGameFor(level); if (!gameId) return;
  ctx.onWorld = null; runGame(ctx, box, { subject, gameId, onExit, bonus: true });
}
