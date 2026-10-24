// The mini-game registry. Every game has the same shape:
//   { id, icon, color, sticker, title{ms,en}, blurb{ms,en}, how{ms,en}, create(ctx) -> { destroy, restart, debug } }
// and is drawn inside the shared arcade frame (ui/arcade.js), which gives it Back / Home / Help / Restart / Sound,
// the level for the child's age group, star progress, the celebration and the activity record.
import { ruler, dots, trace } from './g-draw.js';
import { xo, memory, patterns } from './g-board.js';
import { puzzle, find, counting } from './g-pick.js';
import { music } from './g-music.js';

export const GAMES = [ruler, xo, dots, trace, memory, puzzle, find, patterns, counting, music];
export const gameById = Object.fromEntries(GAMES.map((g) => [g.id, g]));
