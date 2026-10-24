// Pure game rules for the mini-games (no DOM): tested in Node. Each mini-game's screen only draws and listens.
import { createRng } from '../core/rng.js';

// ---------------------------------------------------------------- age -> level
export const AGE_LEVEL = { '2-3': 1, '3-4': 2, '4+': 3 };
export const levelFor = (age) => AGE_LEVEL[age] || 2;
const rngOf = (seed) => (typeof seed === 'function' ? { next: seed, int: (n) => Math.floor(seed() * n), shuffle: (a) => { const o = a.slice(); for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(seed() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; } } : createRng(seed === undefined ? Date.now() : seed));

// ---------------------------------------------------------------- X and O (tic-tac-toe)
export const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
export const emptyBoard = () => Array(9).fill(null);
export function winner(board) {
  for (const [a, b, c] of LINES) if (board[a] && board[a] === board[b] && board[a] === board[c]) return { mark: board[a], line: [a, b, c] };
  return board.every(Boolean) ? { mark: 'draw', line: [] } : null;
}
const empties = (board) => board.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
function findLineCell(board, mark) {
  for (const [a, b, c] of LINES) {
    const cells = [a, b, c];
    const mine = cells.filter((i) => board[i] === mark).length, free = cells.filter((i) => !board[i]);
    if (mine === 2 && free.length === 1) return free[0];
  }
  return -1;
}
/**
 * The robot friend's move. Level 1 is a gentle random player that never blocks; level 2 takes a win when it sees one and
 * blocks about half of the time; level 3 wins, blocks, takes the centre and corners, and slips now and then (never perfect).
 */
export function chooseMove(board, robot, level, rand = Math.random) {
  const free = empties(board);
  if (!free.length) return -1;
  const human = robot === 'O' ? 'X' : 'O';
  const random = () => free[Math.floor(rand() * free.length)];
  if (level <= 1) return random();
  const win = findLineCell(board, robot), block = findLineCell(board, human);
  if (level === 2) { if (win >= 0) return win; if (block >= 0 && rand() < 0.5) return block; return random(); }
  if (rand() < 0.2) return random();
  if (win >= 0) return win;
  if (block >= 0) return block;
  if (!board[4]) return 4;
  const corners = [0, 2, 6, 8].filter((i) => !board[i]);
  if (corners.length) return corners[Math.floor(rand() * corners.length)];
  return random();
}

// ---------------------------------------------------------------- patterns of beads
export const BEADS = [
  { id: 0, color: '#ff6b6b', shape: 'circle' }, { id: 1, color: '#4a90e2', shape: 'circle' }, { id: 2, color: '#ffd23f', shape: 'circle' },
  { id: 3, color: '#4cc46a', shape: 'circle' }, { id: 4, color: '#9b6bff', shape: 'circle' }, { id: 5, color: '#ff9a3c', shape: 'circle' }
];
const UNITS = { 1: [[0, 1]], 2: [[0, 0, 1], [0, 1, 1], [0, 1]], 3: [[0, 1, 2], [0, 0, 1, 1], [0, 1, 0, 2], [0, 0, 1]] };
const LENGTH = { 1: 6, 2: 7, 3: 8 };
export function makePattern(level, seed) {
  const rng = rngOf(seed);
  const lv = Math.min(3, Math.max(1, level));
  const units = UNITS[lv];
  const shape = units[rng.int(units.length)];
  const kinds = [...new Set(shape)].length;
  const palette = rng.shuffle(BEADS.map((b) => b.id)).slice(0, kinds);
  const unit = shape.map((i) => palette[i]);
  const full = Array.from({ length: LENGTH[lv] }, (_, i) => unit[i % unit.length]);
  const answer = full[full.length - 1];
  const others = rng.shuffle(BEADS.map((b) => b.id).filter((b) => b !== answer)).slice(0, 2);
  const options = rng.shuffle([answer, ...others]);
  return { unit, full, shown: full.slice(0, -1), answer, options };
}

// ---------------------------------------------------------------- memory cards
export const MEMORY_KEYS = ['cow', 'cat', 'dog', 'duck', 'frog', 'fish', 'bird', 'rabbit', 'apple', 'banana', 'orange', 'grapes', 'car', 'boat', 'ball', 'star'];
export const MEMORY_PAIRS = { 1: 3, 2: 6, 3: 8 };
export function makeDeck(pairs, seed, keys = MEMORY_KEYS) {
  const rng = rngOf(seed);
  const pick = rng.shuffle(keys).slice(0, Math.min(pairs, keys.length));
  const cards = [];
  pick.forEach((k, i) => { cards.push({ id: i * 2, key: k, pair: i }); cards.push({ id: i * 2 + 1, key: k, pair: i }); });
  return rng.shuffle(cards);
}

// ---------------------------------------------------------------- counting and sorting
export const COUNT_RANGE = { 1: [1, 5], 2: [1, 10], 3: [5, 20] };
export const COUNT_ITEMS = ['apple', 'banana', 'orange', 'star', 'ball', 'flower', 'duck', 'cat', 'fish', 'car'];
export function makeCountRound(level, seed) {
  const rng = rngOf(seed);
  const [lo, hi] = COUNT_RANGE[Math.min(3, Math.max(1, level))];
  const n = lo + rng.int(hi - lo + 1);
  const item = COUNT_ITEMS[rng.int(COUNT_ITEMS.length)];
  const near = [n - 1, n + 1, n - 2, n + 2].filter((v) => v >= 1 && v <= Math.max(hi, n + 2) && v !== n);
  const options = rng.shuffle([n, ...rng.shuffle(near).slice(0, 2)]);
  return { n, item, options };
}
export const SORT_SETS = {
  1: [{ bins: ['ball:red', 'ball:blue'], items: ['ball:red', 'ball:blue'] }, { bins: ['ball:yellow', 'ball:green'], items: ['ball:yellow', 'ball:green'] }],
  2: [{ bins: ['apple', 'cat'], items: ['apple', 'banana', 'orange', 'cat', 'dog', 'cow'], binOf: { apple: 0, banana: 0, orange: 0, cat: 1, dog: 1, cow: 1 } }],
  3: [{ bins: ['ball:red', 'ball:blue', 'ball:yellow'], items: ['ball:red', 'ball:blue', 'ball:yellow'] }, { bins: ['car', 'bird', 'apple'], items: ['car', 'bus', 'bird', 'duck', 'apple', 'grapes'], binOf: { car: 0, bus: 0, bird: 1, duck: 1, apple: 2, grapes: 2 } }]
};
export function makeSortRound(level, seed) {
  const rng = rngOf(seed);
  const lv = Math.min(3, Math.max(1, level));
  const set = SORT_SETS[lv][rng.int(SORT_SETS[lv].length)];
  const items = [];
  if (set.binOf) set.items.forEach((k, i) => items.push({ id: i, key: k, bin: set.binOf[k] }));
  else { let id = 0; set.items.forEach((k, b) => { for (let i = 0; i < (lv === 1 ? 3 : 2); i++) items.push({ id: id++, key: k, bin: b }); }); }
  return { bins: set.bins.slice(), items: rng.shuffle(items) };
}

// ---------------------------------------------------------------- ruler: is this stroke a straight line between two dots?
/** points: [{x,y}], a: start dot, b: end dot. Returns { ok, startOk, endOk, maxDev, length }. */
export function checkLine(points, a, b, { tol = 18, endTol = 26 } = {}) {
  if (!points || points.length < 2) return { ok: false, startOk: false, endOk: false, maxDev: Infinity, length: 0 };
  const first = points[0], last = points[points.length - 1];
  const startOk = Math.hypot(first.x - a.x, first.y - a.y) <= endTol;
  const endOk = Math.hypot(last.x - b.x, last.y - b.y) <= endTol;
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  let maxDev = 0;
  for (const p of points) maxDev = Math.max(maxDev, Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / len);
  return { ok: startOk && endOk && maxDev <= tol, startOk, endOk, maxDev, length: len };
}
/** Projects a point onto the segment a-b (the ruler edge keeps the pencil straight). */
export function snapToLine(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
  return { x: a.x + dx * t, y: a.y + dy * t, t };
}
/** An X drawn with two strokes: they must cross near the target and be roughly diagonal. */
export function checkX(s1, s2, target, { r = 46 } = {}) {
  if (!s1 || !s2 || s1.length < 2 || s2.length < 2) return false;
  const mid = (s) => { const f = s[0], l = s[s.length - 1]; return { x: (f.x + l.x) / 2, y: (f.y + l.y) / 2, dx: l.x - f.x, dy: l.y - f.y }; };
  const m1 = mid(s1), m2 = mid(s2);
  const near = (m) => Math.hypot(m.x - target.x, m.y - target.y) <= r;
  const dir = (m) => Math.atan2(m.dy, m.dx);
  const diff = Math.abs(((dir(m1) - dir(m2)) * 180) / Math.PI) % 180;
  const crossing = Math.min(diff, 180 - diff) >= 40;
  const long = (m) => Math.hypot(m.dx, m.dy) >= r * 0.8;
  return near(m1) && near(m2) && crossing && long(m1) && long(m2);
}

// ---------------------------------------------------------------- tracing: how much of the glyph have the strokes covered?
/**
 * target: array of {x,y} sample points inside the glyph. strokes: array of {x,y}. brush: radius.
 * Returns { coverage 0..1, covered, total, outside 0..1 } where outside = share of stroke points far from every target point.
 */
export function traceCoverage(target, strokePoints, brush, cell = brush) {
  const key = (x, y) => `${Math.floor(x / cell)},${Math.floor(y / cell)}`;
  const grid = new Map();
  target.forEach((p, i) => { const k = key(p.x, p.y); (grid.get(k) || grid.set(k, []).get(k)).push(i); });
  const covered = new Uint8Array(target.length);
  let near = 0;
  for (const s of strokePoints) {
    let hit = false;
    const cx = Math.floor(s.x / cell), cy = Math.floor(s.y / cell);
    for (let gx = cx - 1; gx <= cx + 1; gx++) for (let gy = cy - 1; gy <= cy + 1; gy++) {
      const list = grid.get(`${gx},${gy}`);
      if (!list) continue;
      for (const i of list) if (Math.hypot(target[i].x - s.x, target[i].y - s.y) <= brush) { covered[i] = 1; hit = true; }
    }
    if (hit) near++;
  }
  const done = covered.reduce((a, b) => a + b, 0);
  return { coverage: target.length ? done / target.length : 0, covered: done, total: target.length, outside: strokePoints.length ? 1 - near / strokePoints.length : 0 };
}
export const TRACE_NEEDS = { 1: 0.6, 2: 0.7, 3: 0.78 };
export const TRACE_SETS = {
  1: { abc: ['A', 'I', 'L', 'O', 'T', 'H'], num: ['1', '2', '3', '4', '5'], ar: ['ا', 'ب', 'ت', 'د', 'ر'] },
  2: { abc: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), num: '0123456789'.split(''), ar: ['ا', 'ب', 'ت', 'ج', 'د', 'ر', 'س', 'ف', 'ك', 'ل', 'م', 'ن', 'و', 'ه'] },
  3: { abc: 'abcdefghijklmnopqrstuvwxyz'.split(''), num: '0123456789'.split(''), ar: ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'و', 'ه', 'ي'] }
};

// ---------------------------------------------------------------- connect the dots (coordinates in a 100 x 100 box, drawn in order)
export const DOT_PICTURES = {
  1: [
    { id: 'triangle', name: { ms: 'Segi tiga', en: 'Triangle' }, color: '#3fe0a8', pts: [[50, 12], [90, 84], [10, 84]] },
    { id: 'square', name: { ms: 'Segi empat sama', en: 'Square' }, color: '#ffd23f', pts: [[18, 18], [82, 18], [82, 82], [18, 82]] },
    { id: 'house', name: { ms: 'Rumah', en: 'House' }, color: '#ff8fc0', pts: [[50, 10], [88, 40], [78, 40], [78, 86], [22, 86], [22, 40], [12, 40]] }
  ],
  2: [
    { id: 'star', name: { ms: 'Bintang', en: 'Star' }, color: '#ffd23f', pts: [[50, 8], [61, 38], [93, 39], [68, 59], [77, 90], [50, 72], [23, 90], [32, 59], [7, 39], [39, 38]] },
    { id: 'boat', name: { ms: 'Kapal', en: 'Boat' }, color: '#6cc4ff', pts: [[50, 8], [76, 50], [92, 50], [80, 80], [20, 80], [8, 50], [44, 50]] },
    { id: 'heart', name: { ms: 'Hati', en: 'Heart' }, color: '#ff6f9f', pts: [[50, 86], [14, 50], [12, 30], [26, 16], [42, 20], [50, 32], [58, 20], [74, 16], [88, 30], [86, 50]] }
  ],
  3: [
    { id: 'fish', name: { ms: 'Ikan', en: 'Fish' }, color: '#ff9a3c', pts: [[6, 50], [24, 28], [48, 18], [70, 30], [84, 46], [96, 30], [96, 70], [84, 54], [70, 70], [48, 82], [24, 72]] },
    { id: 'tree', name: { ms: 'Pokok', en: 'Tree' }, color: '#4cc46a', pts: [[50, 6], [70, 30], [60, 30], [80, 56], [64, 56], [88, 82], [56, 82], [56, 94], [44, 94], [44, 82], [12, 82], [36, 56], [20, 56], [40, 30], [30, 30]] }
  ]
};
export function dotsInOrder(pic) { return pic.pts.map((p, i) => ({ n: i + 1, x: p[0], y: p[1] })); }

// ---------------------------------------------------------------- shape sorter
export const SHAPE_SETS = {
  1: ['circle', 'square', 'triangle'],
  2: ['circle', 'square', 'triangle', 'star', 'rectangle'],
  3: ['circle', 'square', 'triangle', 'star', 'rectangle', 'heart', 'oval']
};
export const SHAPE_COLORS = { circle: '#6cc4ff', square: '#ffd23f', triangle: '#5fd6a8', star: '#ffc94a', rectangle: '#ffb38a', heart: '#ff8ccf', oval: '#b79cff' };

// ---------------------------------------------------------------- find it
export const FIND_THEMES = {
  toys: ['ball', 'teddy', 'kite', 'car', 'gift', 'toy_box', 'hat', 'book', 'pencil', 'shoe', 'bag', 'umbrella', 'clock', 'lamp', 'pillow', 'boat', 'bus', 'airplane'],
  fruit: ['apple', 'banana', 'orange', 'grapes', 'watermelon', 'strawberry', 'pineapple', 'mango', 'lemon', 'coconut', 'carrot', 'corn', 'tomato', 'cake', 'egg', 'milk', 'candy', 'pizza'],
  animals: ['cow', 'cat', 'dog', 'duck', 'goat', 'lion', 'bee', 'frog', 'owl', 'elephant', 'monkey', 'rabbit', 'fish', 'bird', 'horse', 'tiger', 'panda', 'turtle'],
  nature: ['sun', 'moon', 'star', 'cloud', 'rain', 'rainbow', 'tree', 'flower', 'leaf', 'seed', 'sprout', 'mountain', 'snow', 'rock', 'water_drop', 'bird', 'butterfly', 'bee']
};
export const FIND_COUNT = { 1: 6, 2: 12, 3: 18 };
export function makeFindRound(level, theme, seed) {
  const rng = rngOf(seed);
  const pool = FIND_THEMES[theme] || FIND_THEMES.toys;
  const keys = rng.shuffle(pool).slice(0, FIND_COUNT[Math.min(3, Math.max(1, level))]);
  const target = keys[rng.int(keys.length)];
  return { target, items: keys, targetIndex: keys.indexOf(target) };
}

// ---------------------------------------------------------------- music: a C-major xylophone and short songs (bar index 0..7)
export const XYLO_NOTES = [60, 62, 64, 65, 67, 69, 71, 72];          // C D E F G A B C
export const XYLO_COLORS = ['#ff6b6b', '#ff9a3c', '#ffd23f', '#4cc46a', '#3fc8d8', '#4a90e2', '#9b6bff', '#ff8ccf'];
export const SONGS = {
  twinkle: { name: { ms: 'Bintang Kecil', en: 'Little Star' }, notes: [0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0] },
  mary: { name: { ms: 'Mary Ada Domba', en: 'Mary Had a Little Lamb' }, notes: [2, 1, 0, 1, 2, 2, 2, 1, 1, 1, 2, 4, 4] },
  scale: { name: { ms: 'Tangga Nada', en: 'Up the Scale' }, notes: [0, 1, 2, 3, 4, 5, 6, 7] }
};
export const SONG_BY_LEVEL = { 1: ['scale'], 2: ['mary'], 3: ['twinkle'] };
/** "Copy me": a random short tune of `len` bars. */
export function makeTune(len, seed) { const rng = rngOf(seed); return Array.from({ length: len }, () => rng.int(8)); }
export const TUNE_LENGTH = { 1: 3, 2: 4, 3: 6 };
