// 2D collision on the floor plane (x, z). The player is a circle; furniture is
// boxes and circles. Movement is sub-stepped so fast steps cannot tunnel.

export function createCollisionWorld(bounds) {
  return { bounds: Object.assign({}, bounds), boxes: [], circles: [] };
}

export function addBox(world, minX, minZ, maxX, maxZ, tag = '') {
  const b = { minX: Math.min(minX, maxX), minZ: Math.min(minZ, maxZ), maxX: Math.max(minX, maxX), maxZ: Math.max(minZ, maxZ), tag };
  world.boxes.push(b);
  if (world.index) indexItem(world, b, 'boxes');
  return b;
}
export function addCircle(world, x, z, r, tag = '') {
  const c = { x, z, r, tag };
  world.circles.push(c);
  if (world.index) indexItem(world, c, 'circles');
  return c;
}
export function clearTagged(world, tag) {
  world.boxes = world.boxes.filter((b) => b.tag !== tag);
  world.circles = world.circles.filter((c) => c.tag !== tag);
  if (world.index) rebuildIndex(world);
}
/** Removes these exact boxes/circles (used when a part of the city is unloaded). */
export function removeItems(world, items) {
  const gone = new Set(items);
  world.boxes = world.boxes.filter((b) => !gone.has(b));
  world.circles = world.circles.filter((c) => !gone.has(c));
  if (world.index) for (const it of items) unindexItem(world, it);
}

// ---------- optional spatial index: a big world (the city) only tests the obstacles near the circle ----------
export function enableIndex(world, cell = 24) {
  world.index = { cell, map: new Map() };
  rebuildIndex(world);
  return world;
}
const rectOf = (it) => (it.r !== undefined ? [it.x - it.r, it.z - it.r, it.x + it.r, it.z + it.r] : [it.minX, it.minZ, it.maxX, it.maxZ]);
function cellsOf(world, [x0, z0, x1, z1]) {
  const c = world.index.cell, out = [];
  for (let i = Math.floor(x0 / c); i <= Math.floor(x1 / c); i++) for (let j = Math.floor(z0 / c); j <= Math.floor(z1 / c); j++) out.push(i + ',' + j);
  return out;
}
function indexItem(world, it, kind) {
  for (const k of cellsOf(world, rectOf(it))) {
    let cell = world.index.map.get(k);
    if (!cell) world.index.map.set(k, (cell = { boxes: [], circles: [] }));
    cell[kind].push(it);
  }
}
function unindexItem(world, it) {
  const kind = it.r !== undefined ? 'circles' : 'boxes';
  for (const k of cellsOf(world, rectOf(it))) { const cell = world.index.map.get(k); if (cell) cell[kind] = cell[kind].filter((x) => x !== it); }
}
function rebuildIndex(world) {
  world.index.map.clear();
  world.boxes.forEach((b) => indexItem(world, b, 'boxes'));
  world.circles.forEach((c) => indexItem(world, c, 'circles'));
}
const near = { boxes: [], circles: [] };
const seen = new Set();
/** The obstacles that can touch a circle at p with radius r (all of them when there is no index). Skips tags in world.skip. */
function candidates(world, p, r) {
  const skip = world.skip;
  if (!world.index) {
    if (!skip) return world;
    near.boxes = world.boxes.filter((b) => !skip.has(b.tag)); near.circles = world.circles.filter((c) => !skip.has(c.tag));
    return near;
  }
  near.boxes = []; near.circles = []; seen.clear();
  for (const k of cellsOf(world, [p.x - r, p.z - r, p.x + r, p.z + r])) {
    const cell = world.index.map.get(k);
    if (!cell) continue;
    for (const b of cell.boxes) if (!seen.has(b) && !(skip && skip.has(b.tag))) { seen.add(b); near.boxes.push(b); }
    for (const c of cell.circles) if (!seen.has(c) && !(skip && skip.has(c.tag))) { seen.add(c); near.circles.push(c); }
  }
  return near;
}

function clampBounds(world, p, r) {
  const b = world.bounds;
  p.x = Math.min(b.maxX - r, Math.max(b.minX + r, p.x));
  p.z = Math.min(b.maxZ - r, Math.max(b.minZ + r, p.z));
}

// Pushes a circle out of every obstacle. Returns true if it moved.
export function resolve(world, p, r, iterations = 4) {
  let moved = false;
  for (let it = 0; it < iterations; it++) {
    let any = false;
    const cand = candidates(world, p, r + 0.5);
    for (const b of cand.boxes) {
      if (b.off) continue;
      const cx = Math.max(b.minX, Math.min(p.x, b.maxX));
      const cz = Math.max(b.minZ, Math.min(p.z, b.maxZ));
      let dx = p.x - cx;
      let dz = p.z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      if (d2 > 1e-10) {
        const d = Math.sqrt(d2);
        const push = r - d + 1e-4;
        p.x += (dx / d) * push;
        p.z += (dz / d) * push;
      } else {
        // centre is inside the box: leave by the nearest side
        const left = p.x - b.minX, right = b.maxX - p.x, top = p.z - b.minZ, bottom = b.maxZ - p.z;
        const m = Math.min(left, right, top, bottom);
        if (m === left) p.x = b.minX - r - 1e-4;
        else if (m === right) p.x = b.maxX + r + 1e-4;
        else if (m === top) p.z = b.minZ - r - 1e-4;
        else p.z = b.maxZ + r + 1e-4;
      }
      any = true;
    }
    for (const c of cand.circles) {
      const dx = p.x - c.x, dz = p.z - c.z;
      const min = r + c.r;
      const d2 = dx * dx + dz * dz;
      if (d2 >= min * min) continue;
      const d = Math.sqrt(d2);
      if (d > 1e-6) { p.x = c.x + (dx / d) * (min + 1e-4); p.z = c.z + (dz / d) * (min + 1e-4); }
      else { p.x = c.x + min + 1e-4; }
      any = true;
    }
    clampBounds(world, p, r);
    if (!any) break;
    moved = true;
  }
  return moved;
}

// Deepest overlap with any obstacle or wall (0 = completely free).
export function penetration(world, p, r) {
  let worst = 0;
  const b = world.bounds;
  worst = Math.max(worst, b.minX + r - p.x, p.x - (b.maxX - r), b.minZ + r - p.z, p.z - (b.maxZ - r));
  const cand = candidates(world, p, r + 0.5);
  for (const box of cand.boxes) {
    if (box.off) continue;
    const cx = Math.max(box.minX, Math.min(p.x, box.maxX));
    const cz = Math.max(box.minZ, Math.min(p.z, box.maxZ));
    const inside = p.x > box.minX && p.x < box.maxX && p.z > box.minZ && p.z < box.maxZ;
    const d = Math.hypot(p.x - cx, p.z - cz);
    worst = Math.max(worst, inside ? r + Math.min(p.x - box.minX, box.maxX - p.x, p.z - box.minZ, box.maxZ - p.z) : r - d);
  }
  for (const c of cand.circles) worst = Math.max(worst, r + c.r - Math.hypot(p.x - c.x, p.z - c.z));
  return Math.max(0, worst);
}

/**
 * Moves a circle by (dx, dz) with collision. Returns the actual movement.
 */
export function moveCircle(world, p, r, dx, dz) {
  const startX = p.x, startZ = p.z;
  const dist = Math.hypot(dx, dz);
  const steps = Math.max(1, Math.ceil(dist / (r * 0.4)));
  const sx = dx / steps, sz = dz / steps;
  for (let i = 0; i < steps; i++) {
    p.x += sx; p.z += sz;
    resolve(world, p, r);
  }
  return { x: p.x - startX, z: p.z - startZ };
}

// Finds the nearest free spot (used if a player is ever spawned inside furniture).
export function findFreeSpot(world, p, r) {
  if (penetration(world, p, r) <= 1e-3) return { x: p.x, z: p.z };
  for (let ring = 1; ring <= 40; ring++) {
    const rad = ring * r * 0.5;
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const q = { x: p.x + Math.cos(a) * rad, z: p.z + Math.sin(a) * rad };
      clampBounds(world, q, r);
      if (penetration(world, q, r) <= 1e-3) return q;
    }
  }
  return { x: (world.bounds.minX + world.bounds.maxX) / 2, z: (world.bounds.minZ + world.bounds.maxZ) / 2 };
}
