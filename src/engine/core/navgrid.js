// A walkable-cell grid over the collision world, with A* path finding and line-of-sight smoothing.
// Pure functions, so the whole map's connectivity can be unit-tested without a browser.
import { penetration } from './collision.js';

export function buildNavGrid(world, radius, { cell = 0.5, ignoreTags = [] } = {}) {
  const w = {
    bounds: world.bounds,
    boxes: world.boxes.filter((b) => !ignoreTags.includes(b.tag)),
    circles: world.circles.filter((c) => !ignoreTags.includes(c.tag))
  };
  const b = world.bounds;
  const x0 = b.minX + radius, z0 = b.minZ + radius;
  const nx = Math.floor((b.maxX - b.minX - 2 * radius) / cell) + 1;
  const nz = Math.floor((b.maxZ - b.minZ - 2 * radius) / cell) + 1;
  const free = new Uint8Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) free[j * nx + i] = penetration(w, { x: x0 + i * cell, z: z0 + j * cell }, radius) < 1e-3 ? 1 : 0;
  const grid = { cell, x0, z0, nx, nz, free, world: w, radius };
  grid.cellOf = (x, z) => ({ i: Math.round((x - x0) / cell), j: Math.round((z - z0) / cell) });
  grid.centre = (i, j) => ({ x: x0 + i * cell, z: z0 + j * cell });
  grid.isFree = (i, j) => i >= 0 && j >= 0 && i < nx && j < nz && free[j * nx + i] === 1;
  return grid;
}

// Nearest free cell to a point (spiral search). Returns null when nothing is free within `maxRing` cells.
export function nearestFree(grid, x, z, maxRing = 12) {
  const { i, j } = grid.cellOf(x, z);
  if (grid.isFree(i, j)) return { i, j };
  for (let ring = 1; ring <= maxRing; ring++) {
    let best = null, bestD = Infinity;
    for (let dj = -ring; dj <= ring; dj++) for (let di = -ring; di <= ring; di++) {
      if (Math.max(Math.abs(di), Math.abs(dj)) !== ring) continue;
      if (!grid.isFree(i + di, j + dj)) continue;
      const c = grid.centre(i + di, j + dj);
      const d = Math.hypot(c.x - x, c.z - z);
      if (d < bestD) { bestD = d; best = { i: i + di, j: j + dj }; }
    }
    if (best) return best;
  }
  return null;
}

// Is the straight segment a -> b free for a circle of the grid's radius?
export function lineFree(grid, a, b) {
  const d = Math.hypot(b.x - a.x, b.z - a.z);
  const steps = Math.max(1, Math.ceil(d / 0.2));
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    if (penetration(grid.world, { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }, grid.radius) > 1e-3) return false;
  }
  return true;
}

const SQ2 = Math.SQRT2;
const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, SQ2], [1, -1, SQ2], [-1, 1, SQ2], [-1, -1, SQ2]];

/**
 * @returns {Array<{x,z}>|null} waypoints from `from` to `to` (inclusive), or null when unreachable.
 */
export function findPath(grid, from, to) {
  const s = nearestFree(grid, from.x, from.z), g = nearestFree(grid, to.x, to.z);
  if (!s || !g) return null;
  const { nx, nz } = grid;
  const idx = (i, j) => j * nx + i;
  const gScore = new Float32Array(nx * nz).fill(Infinity);
  const prev = new Int32Array(nx * nz).fill(-1);
  const closed = new Uint8Array(nx * nz);
  // binary heap of [f, index]
  const heap = [];
  const push = (f, k) => { heap.push([f, k]); let c = heap.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (heap[p][0] <= heap[c][0]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; } };
  const pop = () => { const top = heap[0]; const last = heap.pop(); if (heap.length) { heap[0] = last; let c = 0; for (;;) { const l = 2 * c + 1, r = l + 1; let m = c; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === c) break; [heap[m], heap[c]] = [heap[c], heap[m]]; c = m; } } return top; };
  const h = (i, j) => { const dx = Math.abs(i - g.i), dz = Math.abs(j - g.j); return (dx + dz) + (SQ2 - 2) * Math.min(dx, dz); };
  gScore[idx(s.i, s.j)] = 0;
  push(h(s.i, s.j), idx(s.i, s.j));
  let found = false;
  while (heap.length) {
    const [, k] = pop();
    if (closed[k]) continue;
    closed[k] = 1;
    const ci = k % nx, cj = (k / nx) | 0;
    if (ci === g.i && cj === g.j) { found = true; break; }
    for (const [di, dj, cost] of DIRS) {
      const ni = ci + di, nj = cj + dj;
      if (!grid.isFree(ni, nj)) continue;
      if (di && dj && (!grid.isFree(ci + di, cj) || !grid.isFree(ci, cj + dj))) continue; // no corner cutting
      const nk = idx(ni, nj);
      if (closed[nk]) continue;
      const ng = gScore[k] + cost;
      if (ng < gScore[nk]) { gScore[nk] = ng; prev[nk] = k; push(ng + h(ni, nj), nk); }
    }
  }
  if (!found) return null;
  const cells = [];
  for (let k = idx(g.i, g.j); k !== -1; k = prev[k]) cells.push(grid.centre(k % nx, (k / nx) | 0));
  cells.reverse();
  // end exactly at the requested spot when it is walkable, otherwise at the nearest walkable cell
  const goalFree = penetration(grid.world, to, grid.radius) < 1e-3;
  const start = penetration(grid.world, from, grid.radius) < 1e-3 ? { x: from.x, z: from.z } : grid.centre(s.i, s.j);
  const pts = [start, ...cells.slice(1, -1), goalFree ? { x: to.x, z: to.z } : grid.centre(g.i, g.j)];
  // string pulling: keep only the corners that are really needed
  const out = [pts[0]];
  let anchor = 0;
  for (let k = 2; k < pts.length; k++) {
    if (!lineFree(grid, pts[anchor], pts[k])) { out.push(pts[k - 1]); anchor = k - 1; }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** All free cells reachable from a start point (used by tests and the debug tools). */
export function reachable(grid, from) {
  const s = nearestFree(grid, from.x, from.z);
  const seen = new Uint8Array(grid.nx * grid.nz);
  if (!s) return seen;
  const stack = [s.j * grid.nx + s.i];
  seen[stack[0]] = 1;
  while (stack.length) {
    const k = stack.pop();
    const ci = k % grid.nx, cj = (k / grid.nx) | 0;
    for (const [di, dj] of DIRS) {
      const ni = ci + di, nj = cj + dj;
      if (!grid.isFree(ni, nj)) continue;
      if (di && dj && (!grid.isFree(ci + di, cj) || !grid.isFree(ci, cj + dj))) continue;
      const nk = nj * grid.nx + ni;
      if (!seen[nk]) { seen[nk] = 1; stack.push(nk); }
    }
  }
  return seen;
}
