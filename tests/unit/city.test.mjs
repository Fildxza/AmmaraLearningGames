import test from 'node:test';
import assert from 'node:assert/strict';
import { createCollisionWorld, addBox, addCircle, penetration, enableIndex } from '../../src/engine/core/collision.js';
import { addStaticColliders, addVehicleBarriers } from '../../src/engine/world/layout.js';
import {
  CITY, XS, ZS, PITCH, CURB, ROAD_HALF, BLOCK_COLS, BLOCK_ROWS, LANDMARKS, BUS_ROUTES, BUS_STOPS, CAMPUS, CAMPUS_PLAN,
  blockPlan, blockTypeAt, routePath, routeAt, cityPois, districtAt, onRoad, pavementLamps, isCampus,
  HIGHWAY, roadHalf, curbOf, lanePoint, RAIL, railPath, railAt, railPillars, hasTrafficLight, trafficLightSpot
} from '../../src/engine/city/plan.js';
import { validated } from './helpers.mjs';
import { GAMES } from '../../src/engine/minigames/index.js';

const { config } = validated();
const R = 0.45;                                   // the child
const RIDE_R = { unicorn: 0.85, car: 1.35 };
const plans = [];
for (let i = 0; i < BLOCK_COLS; i++) for (let j = 0; j < BLOCK_ROWS; j++) plans.push(blockPlan(i, j));

function blockWorld(bp) {
  const w = createCollisionWorld(CITY);
  bp.boxes.forEach((b) => addBox(w, ...b));
  bp.circles.forEach((c) => addCircle(w, ...c));
  for (const [x, z] of pavementLamps(bp.x0, bp.z0, bp.x1, bp.z1)) addCircle(w, x, z, 0.25);
  return w;
}

test('the town is big: more than 4 km on each side, a thousand blocks, thousands of buildings', () => {
  assert.ok(CITY.maxX - CITY.minX >= 4000 && CITY.maxZ - CITY.minZ >= 4000);
  assert.equal(plans.length, BLOCK_COLS * BLOCK_ROWS);
  assert.ok(plans.length > 1000, `blocks ${plans.length}`);
  const buildings = plans.reduce((n, p) => n + p.buildings.length, 0);
  assert.ok(buildings > 4000, `buildings ${buildings}`);
  assert.equal(LANDMARKS.length, 22);
  assert.equal(LANDMARKS.filter((l) => l.station).length, 4);
});

test('blocks are the same every time (the town is generated from a fixed seed)', () => {
  assert.deepEqual(blockPlan(5, 7), blockPlan(5, 7));
  assert.deepEqual(blockPlan(20, 3).buildings, plans[20 * BLOCK_ROWS + 3].buildings);
});

test('every building, tree and prop collider stays inside its lot (never on the street or pavement)', () => {
  const bad = [];
  for (const bp of plans) {
    const L = bp.lot;
    for (const [x0, z0, x1, z1] of bp.boxes) if (x0 < L.x0 - 1e-6 || z0 < L.z0 - 1e-6 || x1 > L.x1 + 1e-6 || z1 > L.z1 + 1e-6) bad.push(`${bp.i},${bp.j} box`);
    for (const [x, z, r] of bp.circles) if (x - r < L.x0 - 1e-6 || z - r < L.z0 - 1e-6 || x + r > L.x1 + 1e-6 || z + r > L.z1 + 1e-6) bad.push(`${bp.i},${bp.j} circle`);
  }
  assert.deepEqual(bad.slice(0, 10), []);
});

test('buildings never overlap each other', () => {
  for (const bp of plans) {
    const b = bp.buildings;
    for (let a = 0; a < b.length; a++) for (let c = a + 1; c < b.length; c++) {
      const ox = Math.min(b[a].x + b[a].w / 2, b[c].x + b[c].w / 2) - Math.max(b[a].x - b[a].w / 2, b[c].x - b[c].w / 2);
      const oz = Math.min(b[a].z + b[a].d / 2, b[c].z + b[c].d / 2) - Math.max(b[a].z - b[a].d / 2, b[c].z - b[c].d / 2);
      assert.ok(ox <= 0 || oz <= 0, `block ${bp.i},${bp.j}: buildings ${a} and ${c} overlap`);
    }
  }
});

test('every landmark is on its own block, has a learning place and a name in both languages', () => {
  const seen = new Set();
  for (const l of LANDMARKS) {
    const i = XS.indexOf(l.x0), j = ZS.indexOf(l.z0);
    assert.ok(i >= 0 && j >= 0, `${l.id} not on the grid`);
    assert.ok(!isCampus(l.x0, l.z0), `${l.id} on the campus`);
    assert.equal(blockTypeAt(i, j), 'landmark');
    assert.ok(!seen.has(`${i},${j}`)); seen.add(`${i},${j}`);
    assert.ok(l.name.ms && l.name.en, `${l.id} name`);
    assert.ok(blockPlan(i, j).pois.length >= 1, `${l.id} has nothing to do`);
  }
});

test('every learning place in the town opens something that exists and can be reached', () => {
  const games = new Set(GAMES.map((g) => g.id));
  const pois = cityPois();
  assert.ok(pois.length >= 35, `town places ${pois.length}`);
  for (const p of pois) {
    assert.ok(p.cue && p.cue.ms && p.cue.en, `${p.id} cue`);
    if (p.action === 'quiz') for (const s of p.stations) assert.ok(config.stations[s], `${p.id}: station ${s}`);
    if (p.action === 'game') assert.ok(games.has(p.game), `${p.id}: game ${p.game}`);
    if (p.action === 'bus') assert.ok(BUS_STOPS.some((s) => s.id === p.stop));
    if (p.action === 'train') assert.ok(railPath().stations.some((s) => s.id === p.station), `${p.id}: station ${p.station}`);
    assert.ok(['quiz', 'game', 'bus', 'islamic', 'train'].includes(p.action), `${p.id}: action ${p.action}`);
  }
  // nothing solid on a place, and the child can stand next to it
  for (const bp of plans) {
    if (!bp.pois.length) continue;
    const w = blockWorld(bp);
    for (const p of bp.pois) assert.ok(penetration(w, p, R) < 1e-3, `${p.id} is blocked`);
  }
});

test('unicorns and cars stand free, inside the town, on their own spot', () => {
  for (const bp of plans) {
    if (!bp.rides.length) continue;
    const w = blockWorld(bp);
    for (const r of bp.rides) {
      assert.ok(penetration(w, r, RIDE_R[r.kind]) < 1e-3, `${r.kind} in block ${bp.i},${bp.j} is stuck`);
      assert.ok(!onRoad(r.x, r.z), `${r.kind} in block ${bp.i},${bp.j} parked on the road`);
    }
  }
  const total = plans.reduce((n, p) => n + p.rides.length, 0);
  assert.ok(total >= 40, `rides in the town: ${total}`);
});

test('the campus unicorns and cars are free of the preschool walls, hedges and vehicle barriers', () => {
  const w = enableIndex(createCollisionWorld(CITY), 24);
  addStaticColliders(w); addVehicleBarriers(w);
  CAMPUS_PLAN.boxes.forEach((b) => addBox(w, ...b));
  for (const r of CAMPUS_PLAN.rides) assert.ok(penetration(w, r, RIDE_R[r.kind]) < 1e-3, `campus ${r.kind} at ${r.x},${r.z}`);
  for (const r of CAMPUS_PLAN.rides) assert.ok(r.x > CAMPUS.minX + CURB && r.x < CAMPUS.maxX - CURB && r.z > CAMPUS.minZ + CURB && r.z < CAMPUS.maxZ - CURB);
});

test('bus routes run along streets and every stop is on the pavement beside its route', () => {
  for (const r of BUS_ROUTES) {
    for (const [x, z] of r.nodes) assert.ok(XS.includes(x) && ZS.includes(z), `route ${r.id} node ${x},${z} is not a crossing`);
    const rp = routePath(r);
    assert.ok(rp.total > 500, `route ${r.id} is ${rp.total} m`);
    for (let s = 0; s < rp.total; s += 25) { const p = routeAt(rp, s); assert.ok(onRoad(p.x, p.z), `route ${r.id} leaves the road at s=${s}`); }
    for (const st of rp.stops) {
      assert.ok(!onRoad(st.wait.x, st.wait.z), `stop ${st.id} waits on the road`);
      const b = plans.find((p) => st.wait.x >= p.x0 && st.wait.x < p.x1 && st.wait.z >= p.z0 && st.wait.z < p.z1);
      const lot = b.lot;
      assert.ok(!(st.wait.x > lot.x0 && st.wait.x < lot.x1 && st.wait.z > lot.z0 && st.wait.z < lot.z1), `stop ${st.id} is inside a lot`);
      // no lamp on the stop (lamps of the four blocks around it)
      for (const p of plans) {
        if (Math.abs(p.x0 + PITCH / 2 - st.wait.x) > PITCH || Math.abs(p.z0 + PITCH / 2 - st.wait.z) > PITCH) continue;
        for (const [x, z] of pavementLamps(p.x0, p.z0, p.x1, p.z1)) assert.ok(Math.hypot(x - st.wait.x, z - st.wait.z) > 2, `lamp on stop ${st.id}`);
      }
    }
    assert.equal(rp.stops.length, BUS_STOPS.filter((s) => s.route === r.id).length);
  }
  assert.ok(BUS_STOPS.length >= 10);
});

test('every part of the town has a named district with music', () => {
  const music = new Set(['town', 'yard', 'islamic', 'arcade']);
  for (let x = CITY.minX + 5; x < CITY.maxX; x += 97) for (let z = CITY.minZ + 5; z < CITY.maxZ; z += 97) {
    const d = districtAt(x, z);
    assert.ok(d.id && d.name && d.name.ms && d.name.en && d.icon && d.color, `district at ${x},${z}`);
    assert.ok(music.has(d.music), `music ${d.music} at ${x},${z}`);
  }
  assert.equal(districtAt(0, 0).id, 'city-campus');
  assert.equal(districtAt(-180, -120).id, 'city-masjid');
  assert.equal(districtAt(-180, -120).music, 'islamic');
});

test('streets: every street line is asphalt, and lots are not', () => {
  assert.ok(onRoad(XS[3], 500) && onRoad(300, ZS[4]));
  assert.ok(!onRoad(XS[3] + PITCH / 2, ZS[4] + PITCH / 2));
  assert.ok(!onRoad(0, 0), 'no street through the preschool');
  assert.ok(ROAD_HALF < CURB);
});

const LANE_EDGE = 1.95 - 0.95;           // inner edge of a town car in its lane (lane centre 1.95 m, car 1.9 m wide)

test('the highway: wider than a street, two lanes each way, crossing the whole town', () => {
  assert.ok(ZS.includes(HIGHWAY.z), 'the highway is on a street line');
  assert.ok(HIGHWAY.half >= 10 && HIGHWAY.curb - HIGHWAY.half >= 3, 'four lanes and a pavement');
  assert.equal(roadHalf('x', HIGHWAY.z), HIGHWAY.half);
  assert.equal(roadHalf('x', HIGHWAY.z + PITCH), ROAD_HALF);
  for (let x = XS[0]; x <= XS[XS.length - 1]; x += 37) {
    for (const off of [HIGHWAY.fast, HIGHWAY.slow]) for (const sz of [-1, 1]) assert.ok(onRoad(x, HIGHWAY.z + sz * off), `lane at ${x}`);
    assert.ok(!onRoad(x, HIGHWAY.z + HIGHWAY.curb + 1) || XS.some((X) => Math.abs(x - X) <= ROAD_HALF), `lot at ${x} counted as road`);
  }
  // fast lane next to the middle, slow lane outside it, both clear of the planted middle and of the shoulder
  assert.ok(HIGHWAY.median + 1 < HIGHWAY.fast && HIGHWAY.fast + 2.5 < HIGHWAY.slow && HIGHWAY.slow + 1.8 < HIGHWAY.half);
  // town cars on the highway keep left in the slow lane
  const p = lanePoint({ x: 0, z: HIGHWAY.z }, { x: 120, z: HIGHWAY.z }, 30);
  assert.ok(Math.abs(p.z - (HIGHWAY.z - HIGHWAY.slow)) < 1e-9, `eastbound lane z ${p.z}`);
  // the lots beside it stay off the wider road
  for (const bp of plans) {
    if (bp.z1 === HIGHWAY.z) assert.equal(bp.lot.z1, HIGHWAY.z - HIGHWAY.curb);
    if (bp.z0 === HIGHWAY.z) assert.equal(bp.lot.z0, HIGHWAY.z + HIGHWAY.curb);
  }
  assert.equal(districtAt(500, HIGHWAY.z + 3).id, 'city-highway');
  assert.equal(curbOf('x', HIGHWAY.z), HIGHWAY.curb);
});

test('every highway crossing has a traffic light, and no street lamp stands on it', () => {
  for (const x of XS.slice(0, -1)) {
    assert.ok(hasTrafficLight(x, HIGHWAY.z));
    const t = trafficLightSpot(x, HIGHWAY.z);
    assert.ok(!onRoad(t.x, t.z), `light at ${x} on the road`);
  }
  for (const bp of plans) for (const [x, z] of pavementLamps(bp.x0, bp.z0, bp.x1, bp.z1)) {
    if (hasTrafficLight(bp.x0, bp.z1)) { const t = trafficLightSpot(bp.x0, bp.z1); assert.ok(Math.hypot(t.x - x, t.z - z) > 1, `lamp on a traffic light at block ${bp.i},${bp.j}`); }
    assert.ok(!onRoad(x, z), `lamp on the road at ${x},${z}`);
  }
});

test('the train loop: closed, smooth, high above the streets, with four stations on it', () => {
  const rp = railPath();
  assert.ok(rp.total > 3000, `loop ${rp.total.toFixed(0)} m`);
  for (let k = 0; k < rp.pts.length; k++) {
    const a = rp.pts[k], b = rp.pts[(k + 1) % rp.pts.length];
    const d = Math.hypot(b.x - a.x, b.z - a.z);
    assert.ok(d > 0.1 && d <= 10.01, `gap ${d.toFixed(2)} m at point ${k}`);
    const n = Math.hypot(a.nx, a.nz); assert.ok(n >= 0.99 && n < 1.1, `normal ${n}`);
    // the line follows street middles (or the round corners over the crossings)
    assert.ok(onRoad(a.x, a.z) || Math.min(...RAIL.corners.map(([cx, cz]) => Math.hypot(a.x - cx, a.z - cz))) < RAIL.R * 1.5, `track over a lot at ${a.x.toFixed(1)},${a.z.toFixed(1)}`);
  }
  // railAt is continuous and wraps
  const p0 = railAt(rp, 0), p1 = railAt(rp, rp.total);
  assert.ok(Math.hypot(p0.x - p1.x, p0.z - p1.z) < 1e-6);
  for (let s = 0; s < rp.total; s += 7) { const a = railAt(rp, s), b = railAt(rp, s + 1); assert.ok(Math.abs(Math.hypot(b.x - a.x, b.z - a.z) - 1) < 0.05, `jump at ${s}`); }
  assert.ok(RAIL.y > 8, 'the train runs above the traffic, lamps and signs');
  assert.equal(rp.stations.length, 4);
  for (const st of rp.stations) {
    assert.ok(st.d < 1e-6, `${st.id} is ${st.d} m off the line`);
    assert.ok(!onRoad(st.exit.x, st.exit.z), `${st.id}: the ticket spot is on the road`);
  }
  const gaps = rp.stations.map((s, k) => ((rp.stations[(k + 1) % 4].s - s.s + rp.total) % rp.total));
  assert.ok(Math.min(...gaps) > 400, `stations too close: ${gaps.map((g) => g.toFixed(0))}`);
});

test('train pillars stand in street middles, away from crossings, clear of the traffic lanes', () => {
  const pl = railPillars();
  assert.ok(pl.length > 60, `pillars ${pl.length}`);
  for (const p of pl) {
    const onX = ZS.includes(p.z), onZ = XS.includes(p.x);
    assert.ok(onX !== onZ, `pillar ${p.x},${p.z} is not on exactly one street line`);
    if (onX) { assert.ok(XS.every((X) => Math.abs(p.x - X) >= 16), `pillar in a crossing at ${p.x},${p.z}`); assert.ok(p.r + 0.2 < (p.z === HIGHWAY.z ? HIGHWAY.median : LANE_EDGE)); }
    else { assert.ok(ZS.every((Z) => Math.abs(p.z - Z) >= 16), `pillar in a crossing at ${p.x},${p.z}`); assert.ok(p.r + 0.2 < LANE_EDGE); }
  }
  // no bus stop, traffic light or lamp touches a pillar
  for (const p of pl) for (const s of cityPois().filter((q) => q.action === 'bus')) assert.ok(Math.hypot(p.x - s.x, p.z - s.z) > 4);
});

test('train stations: hall, platform legs and lift inside the lot; the platform reaches the train', () => {
  for (const lm of LANDMARKS.filter((l) => l.station)) {
    const bp = blockPlan(XS.indexOf(lm.x0), ZS.indexOf(lm.z0));
    const st = bp.station;
    assert.ok(st, `${lm.id} has no station data`);
    const [tx, tz] = st.track;
    assert.ok(onRoad(tx, tz), `${lm.id}: the track point is not over the street`);
    assert.ok(st.platform.a1 > st.curb - 2.6 && st.platform.a1 < st.curb - 2.0, `${lm.id}: platform edge ${st.platform.a1} vs curb ${st.curb}`);
    const w = blockWorld(bp);
    for (const p of bp.pois) assert.ok(penetration(w, p, R) < 1e-3, `${p.id} blocked`);
    assert.equal(bp.pois.filter((p) => p.action === 'train').length, 1);
    assert.equal(districtAt((bp.lot.x0 + bp.lot.x1) / 2, (bp.lot.z0 + bp.lot.z1) / 2).music, 'town');
  }
});
