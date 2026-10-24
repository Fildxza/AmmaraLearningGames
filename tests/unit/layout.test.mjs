import test from 'node:test';
import assert from 'node:assert/strict';
import { createCollisionWorld, addCircle, moveCircle, penetration } from '../../src/engine/core/collision.js';
import { buildNavGrid, findPath, reachable, nearestFree, lineFree } from '../../src/engine/core/navgrid.js';
import { WALK, STATION_SLOTS, SPAWN, YARD_SPAWN, DOOR, POIS, ZONES, NPC_SEATS, addStaticColliders, zoneAt, BUILDING, YARD } from '../../src/engine/world/layout.js';

const R = 0.45;
const STATION_R = 1.6;
function makeWorld(withDoor = false) {
  const w = createCollisionWorld(WALK);
  addStaticColliders(w);
  for (const s of STATION_SLOTS) addCircle(w, s.x, s.z, STATION_R, 'station');
  if (!withDoor) w.boxes = w.boxes.filter((b) => b.tag !== 'door');    // the door opens by itself when the child arrives
  return w;
}

test('the spawn points and every station are free', () => {
  const w = makeWorld();
  assert.ok(penetration(w, SPAWN, R) < 1e-3, 'indoor spawn blocked');
  assert.ok(penetration(w, YARD_SPAWN, R) < 1e-3, 'yard spawn blocked');
});

test('every walkable spot of the whole map is reachable from the spawn (no sealed pockets)', () => {
  const w = makeWorld();
  const grid = buildNavGrid(w, R, { cell: 0.5 });
  const seen = reachable(grid, SPAWN);
  let freeCount = 0, orphans = [];
  for (let j = 0; j < grid.nz; j++) for (let i = 0; i < grid.nx; i++) {
    if (!grid.isFree(i, j)) continue;
    freeCount++;
    if (!seen[j * grid.nx + i]) orphans.push(grid.centre(i, j));
  }
  assert.ok(freeCount > 10000, 'map is unexpectedly small: ' + freeCount);
  assert.equal(orphans.length, 0, `${orphans.length} unreachable free cells, e.g. ${orphans.slice(0, 5).map((o) => `(${o.x},${o.z})`).join(' ')}`);
});

test('the front door is the only link between indoors and outdoors, and is wide enough to walk through', () => {
  const closed = makeWorld(true);
  const gridClosed = buildNavGrid(closed, R, { cell: 0.5 });
  assert.equal(findPath(gridClosed, SPAWN, YARD_SPAWN), null, 'closed door must block the way');
  const open = makeWorld(false);
  const grid = buildNavGrid(open, R, { cell: 0.5 });
  const p = findPath(grid, SPAWN, YARD_SPAWN);
  assert.ok(p && p.length >= 2, 'no path through the open door');
  let crossZ = null;
  for (let k = 1; k < p.length; k++) {
    const a = p[k - 1], b = p[k];
    if ((a.x - DOOR.x) * (b.x - DOOR.x) <= 0 && a.x !== b.x) crossZ = a.z + ((DOOR.x - a.x) / (b.x - a.x)) * (b.z - a.z);
  }
  assert.ok(crossZ !== null && Math.abs(crossZ - DOOR.z) < DOOR.width / 2, 'path does not use the doorway (crosses x=13 at z=' + crossZ + ')');
  assert.ok(DOOR.width >= 2.4, 'door too narrow for a child and a helper');
});

test('every point of interest, station, NPC seat and yard spot can be reached and returned from', () => {
  const w = makeWorld();
  const grid = buildNavGrid(w, R, { cell: 0.5 });
  const targets = [...POIS.map((p) => ({ id: p.id, x: p.x, z: p.z, radius: p.radius })), ...STATION_SLOTS.map((s, i) => ({ id: 'station' + (i + 1), x: s.x, z: s.z, radius: STATION_R }))];
  for (const t of targets) {
    // a spot within interaction distance (1.8 m from the object's edge) must be free and reachable from the spawn
    let ok = false;
    for (let a = 0; a < 24 && !ok; a++) {
      const d = t.radius + R + 0.9;
      const spot = { x: t.x + Math.cos((a / 24) * Math.PI * 2) * d, z: t.z + Math.sin((a / 24) * Math.PI * 2) * d };
      if (penetration(w, spot, R) > 1e-3) continue;
      const back = findPath(grid, spot, SPAWN), there = findPath(grid, SPAWN, spot);
      if (back && there) ok = true;
    }
    assert.ok(ok, `cannot reach and return from ${t.id}`);
  }
  for (const n of Object.values(NPC_SEATS)) assert.ok(n.x > BUILDING.minX && n.x < BUILDING.maxX);
});

test('zones: every point of interest belongs to a defined zone and lies inside it; zones cover the building and yard', () => {
  const ids = new Set(ZONES.map((z) => z.id));
  for (const p of POIS) {
    assert.ok(ids.has(p.zone), `${p.id}: unknown zone ${p.zone}`);
    const z = ZONES.find((q) => q.id === p.zone);
    assert.ok(p.x >= z.rect[0] - 0.5 && p.x <= z.rect[2] + 0.5 && p.z >= z.rect[1] - 0.5 && p.z <= z.rect[3] + 0.5, `${p.id} (${p.x},${p.z}) is outside zone ${p.zone}`);
  }
  assert.equal(zoneAt(0, 0).id, 'hall');
  assert.equal(zoneAt(-17, -5).id, 'mengaji');
  assert.equal(zoneAt(-26, 3).id, 'art');
  assert.equal(zoneAt(16, -1).id, 'gate');
  assert.equal(zoneAt(50, -10).id, 'playground');
  for (const z of ZONES.filter((q) => q.area === 'indoor')) assert.ok(z.rect[0] >= BUILDING.minX && z.rect[2] <= BUILDING.maxX);
  for (const z of ZONES.filter((q) => q.area === 'outdoor')) assert.ok(z.rect[0] >= YARD.minX && z.rect[2] <= YARD.maxX);
  for (const id of ['mengaji', 'arcade', 'art', 'numbers', 'shapes', 'animals', 'music', 'wardrobe', 'rest', 'reading', 'hall']) assert.ok(ids.has(id), 'missing required corner ' + id);
});

test('all 10 mini-games can be started from the preschool, and there are several outdoor discovery points', () => {
  const games = new Set(POIS.filter((p) => p.action === 'game').map((p) => p.game));
  for (const g of ['ruler', 'xo', 'dots', 'trace', 'memory', 'puzzle', 'find', 'patterns', 'counting', 'music']) assert.ok(games.has(g), 'no place to start ' + g);
  const outdoor = POIS.filter((p) => ZONES.find((z) => z.id === p.zone).area === 'outdoor' && p.id !== 'door');
  assert.ok(outdoor.length >= 5, 'only ' + outdoor.length + ' outdoor points');
});

test('pressing two arrows into furniture slides along it instead of pinning the child away from right-angle corners', () => {
  const w = makeWorld();
  const grid = buildNavGrid(w, R, { cell: 0.5 });
  // boxes and walls only: a right-angle corner made of flat walls is a normal place to stop
  const flat = { bounds: w.bounds, boxes: w.boxes, circles: [] };
  const press = (c, ang) => {
    const p = { x: c.x, z: c.z };
    let moved = 0;
    for (let k = 0; k < 90; k++) { const m = moveCircle(w, p, R, Math.cos(ang) * 4.4 / 60, Math.sin(ang) * 4.4 / 60); moved += Math.hypot(m.x, m.z); }
    return moved;
  };
  const pinned = [];
  for (let j = 0; j < grid.nz; j++) for (let i = 0; i < grid.nx; i++) {
    if (!grid.isFree(i, j)) continue;
    const c = grid.centre(i, j);
    if (penetration(w, c, R + 0.9) <= 0) continue;           // open floor can never pin the child
    for (const base of [Math.PI / 4, -Math.PI / 4, (3 * Math.PI) / 4, (-3 * Math.PI) / 4]) {
      // two slightly different angles: pressing exactly head-on into the middle of a round object cannot slide, and nobody does that twice
      if (press(c, base + 0.14) >= 0.2 || press(c, base - 0.21) >= 0.2) continue;
      const sx = Math.cos(base) > 0 ? 1 : -1, sz = Math.sin(base) > 0 ? 1 : -1;
      const blockedX = penetration(flat, { x: c.x + sx * 0.8, z: c.z }, R) > 0;
      const blockedZ = penetration(flat, { x: c.x, z: c.z + sz * 0.8 }, R) > 0;
      if (!(blockedX && blockedZ)) pinned.push(`${c.x.toFixed(2)},${c.z.toFixed(2)} press ${sx},${sz}`);
    }
  }
  assert.equal(pinned.length, 0, `pinned away from right-angle corners: ${pinned.slice(0, 8).join(' | ')}`);
});

test('path finding: smooth paths avoid obstacles and never cut through them', () => {
  const w = makeWorld();
  const grid = buildNavGrid(w, R, { cell: 0.5 });
  const trips = [[SPAWN, { x: -53.5, z: 4.5 }], [{ x: -53.5, z: 4.5 }, { x: 55, z: 15 }], [{ x: 20, z: -15 }, { x: -26.5, z: 3 }], [YARD_SPAWN, { x: 58, z: -18 }]];
  for (const [a, b] of trips) {
    const p = findPath(grid, a, b);
    assert.ok(p, `no path ${JSON.stringify(a)} -> ${JSON.stringify(b)}`);
    for (let k = 1; k < p.length; k++) assert.ok(lineFree(grid, p[k - 1], p[k]), 'segment crosses an obstacle');
    assert.ok(p.length < 40, 'path is not smoothed: ' + p.length + ' points');
  }
  assert.equal(findPath(grid, SPAWN, { x: 300, z: 300 }), null, 'a goal far outside the map gives no path (the game then ignores the tap)');
  assert.ok(findPath(grid, SPAWN, { x: 62.4, z: 0 }), 'a goal just outside the hedge snaps to the nearest walkable spot');
  assert.ok(nearestFree(grid, -1000, -1000, 3) === null);
});
