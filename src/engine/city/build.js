// Builds and streams the town around the child: each 240 m square ("chunk") is made when the child comes near and
// removed when far away, with its colliders. Everything is generated from city/plan.js, so it is the same every time.
import {
  Group, Mesh, InstancedMesh, Object3D, Color, PlaneGeometry, CylinderGeometry, IcosahedronGeometry, MeshBasicMaterial, CanvasTexture, RepeatWrapping, SRGBColorSpace
} from 'three';
import { Geo } from './geo.js';
import {
  CITY, XS, ZS, PITCH, ROAD_HALF, CURB, CHUNK, CHUNKS, BEACH, SEA_Z, CAMPUS, CAMPUS_INNER, CAMPUS_PLAN, BLOCK_COLS, BLOCK_ROWS, blockPlan, roadSegments, isCampus, landmarkById, BUS_ROUTES, routePath, pavementLamps,
  HIGHWAY, roadHalf, curbOf, RAIL, railPath, railPillars, hasTrafficLight, trafficLightSpot
} from './plan.js';
import { toonVertexMaterial, outlineMaterial, lambert, toon, grassTexture, makeCanvas, tint } from '../world/paint.js';
import { mergeStatic, group, box, ball, cyl, cone, torus, star3d, heart3d, live, at } from '../world/kit.js';
import { fountain, benchWood, swingSet, slideKid, climberDome, vegPatch, easelKid, flowerBed, treeRound } from '../world/props.js';
import { buildLandmark } from '../world/landmarks.js';
import { createSign } from '../world/signs.js';
import { poiMarker } from '../world/zones.js';
import { addBox, addCircle, removeItems } from '../core/collision.js';
import { unicorn, kidCar, animal, bus as busModel } from './models.js';

const C = {
  asphalt: '#878c9a', lane: '#ffffff', laneY: '#ffd23f', walk: '#efe2c9', walkEdge: '#d9c6a6', paved: '#f5e9d2', zebra: '#ffffff',
  window: '#a8dcff', windowLit: '#fff3b0', door: '#8a5a3c', lamp: '#4a4350', lampHead: '#fff3b0', sand: '#f7e2a8'
};
const LOAD = 300, UNLOAD = 430;
const near700 = (x, z) => Math.max(Math.abs(x), Math.abs(z)) < 700;
const HW = HIGHWAY.z, RAIL_X0 = Math.min(...RAIL.corners.map((c) => c[0])), RAIL_X1 = Math.max(...RAIL.corners.map((c) => c[0]));

// ------------------------------------------------------------------------------------------------ buildings
function windowsOnFace(G, b, face, y0, floors, h) {
  const along = face === 'n' || face === 's' ? b.w : b.d;
  const cols = Math.max(1, Math.floor((along - 2) / 3.6));
  const off = 0.07;
  for (let f = 0; f < floors; f++) {
    const wy = y0 + 1.1 + f * 3.2;
    if (wy + 1.4 > h - 0.4) break;
    for (let c = 0; c < cols; c++) {
      const u = -along / 2 + (along / cols) * (c + 0.5);
      const lit = ((c * 7 + f * 3 + Math.round(b.x)) % 5) === 0;
      const hx = 0.75, hy = 0.7, colr = lit ? C.windowLit : C.window;
      if (face === 'n') G.quad([b.x + u - hx, wy, b.z - b.d / 2 - off], [b.x + u + hx, wy, b.z - b.d / 2 - off], [b.x + u + hx, wy + hy * 2, b.z - b.d / 2 - off], [b.x + u - hx, wy + hy * 2, b.z - b.d / 2 - off], [0, 0, -1], colr);
      if (face === 's') G.quad([b.x + u - hx, wy, b.z + b.d / 2 + off], [b.x + u + hx, wy, b.z + b.d / 2 + off], [b.x + u + hx, wy + hy * 2, b.z + b.d / 2 + off], [b.x + u - hx, wy + hy * 2, b.z + b.d / 2 + off], [0, 0, 1], colr);
      if (face === 'w') G.quad([b.x - b.w / 2 - off, wy, b.z + u - hx], [b.x - b.w / 2 - off, wy, b.z + u + hx], [b.x - b.w / 2 - off, wy + hy * 2, b.z + u + hx], [b.x - b.w / 2 - off, wy + hy * 2, b.z + u - hx], [-1, 0, 0], colr);
      if (face === 'e') G.quad([b.x + b.w / 2 + off, wy, b.z + u - hx], [b.x + b.w / 2 + off, wy, b.z + u + hx], [b.x + b.w / 2 + off, wy + hy * 2, b.z + u + hx], [b.x + b.w / 2 + off, wy + hy * 2, b.z + u - hx], [1, 0, 0], colr);
    }
  }
}
// A landmark's square: cream paving with a checker of tiles and a border in the landmark's colour, and a walkway
// from the street to the middle.
const mixHex = (a, b, t) => '#' + new Color(a).lerp(new Color(b), t).getHexString();
function landmarkGround(G, lot, lm) {
  const pale = mixHex(lm.color, '#ffffff', 0.78), mid = mixHex(lm.color, '#ffffff', 0.45);
  G.flat(lot.x0, lot.z0, lot.x1, lot.z1, 0.05, C.paved);
  for (let x = lot.x0 + 3, a = 0; x + 6 <= lot.x1 - 3; x += 6, a++) {
    for (let z = lot.z0 + 3, b = 0; z + 6 <= lot.z1 - 3; z += 6, b++) if ((a + b) % 2 === 0) G.flat(x + 0.2, z + 0.2, x + 5.8, z + 5.8, 0.055, pale);
  }
  G.flat(lot.x0, lot.z0, lot.x1, lot.z0 + 1.2, 0.058, mid); G.flat(lot.x0, lot.z1 - 1.2, lot.x1, lot.z1, 0.058, mid);
  G.flat(lot.x0, lot.z0, lot.x0 + 1.2, lot.z1, 0.058, mid); G.flat(lot.x1 - 1.2, lot.z0, lot.x1, lot.z1, 0.058, mid);
  const cx = (lot.x0 + lot.x1) / 2, cz = (lot.z0 + lot.z1) / 2;
  G.flat(cx - 3, cz, cx + 3, lot.z1, 0.06, C.walk); G.flat(cx - 3.3, cz, cx - 3, lot.z1, 0.062, C.walkEdge); G.flat(cx + 3, cz, cx + 3.3, lot.z1, 0.062, C.walkEdge);
}
function door(G, b, face, w = 1.6, h = 2.4, hex = C.door) {
  const off = 0.08;
  if (face === 's') G.quad([b.x - w / 2, 0.06, b.z + b.d / 2 + off], [b.x + w / 2, 0.06, b.z + b.d / 2 + off], [b.x + w / 2, h, b.z + b.d / 2 + off], [b.x - w / 2, h, b.z + b.d / 2 + off], [0, 0, 1], hex);
  else if (face === 'n') G.quad([b.x - w / 2, 0.06, b.z - b.d / 2 - off], [b.x + w / 2, 0.06, b.z - b.d / 2 - off], [b.x + w / 2, h, b.z - b.d / 2 - off], [b.x - w / 2, h, b.z - b.d / 2 - off], [0, 0, -1], hex);
  else if (face === 'e') G.quad([b.x + b.w / 2 + off, 0.06, b.z - w / 2], [b.x + b.w / 2 + off, 0.06, b.z + w / 2], [b.x + b.w / 2 + off, h, b.z + w / 2], [b.x + b.w / 2 + off, h, b.z - w / 2], [1, 0, 0], hex);
  else if (face === 'w') G.quad([b.x - b.w / 2 - off, 0.06, b.z - w / 2], [b.x - b.w / 2 - off, 0.06, b.z + w / 2], [b.x - b.w / 2 - off, h, b.z + w / 2], [b.x - b.w / 2 - off, h, b.z - w / 2], [-1, 0, 0], hex);
}
function drawBuilding(G, b) {
  const x0 = b.x - b.w / 2, x1 = b.x + b.w / 2, z0 = b.z - b.d / 2, z1 = b.z + b.d / 2;
  G.box(x0, 0, z0, x1, b.h, z1, b.color);
  const floors = Math.floor(b.h / 3.2);
  if (b.kind === 'tower' || b.kind === 'flats' || b.kind === 'civic' || b.kind === 'school') {
    G.box(x0 - 0.12, 0, z0 - 0.12, x1 + 0.12, 3.0, z1 + 0.12, b.trim || tint(b.color, -0.12));               // ground-floor band
    ['n', 's', 'w', 'e'].forEach((f) => windowsOnFace(G, b, f, 3.1, floors, b.h));
    door(G, b, b.face || 's', b.kind === 'civic' ? 3.2 : 2.2, 2.6, b.garage ? '#ff8a7a' : C.door);
  } else if (b.kind === 'house') {
    ['n', 's'].forEach((f) => windowsOnFace(G, b, f, 0.4, 1, b.h + 1));
    door(G, b, 's', 1.3, 2.2);
  } else if (b.kind === 'shop') {
    const f = b.face || 's', zf = f === 's' ? z1 : z0, nz = f === 's' ? 1 : -1, off = 0.08 * nz;
    G.quad([x0 + 1, 0.3, zf + off], [x1 - 1, 0.3, zf + off], [x1 - 1, 3.0, zf + off], [x0 + 1, 3.0, zf + off], [0, 0, nz], C.window);
    // striped awning
    const n = Math.max(2, Math.round(b.w / 1.6));
    for (let k = 0; k < n; k++) {
      const ax0 = x0 + (b.w / n) * k, ax1 = ax0 + b.w / n;
      G.quad([ax0, 3.6, zf], [ax1, 3.6, zf], [ax1, 3.0, zf + 1.6 * nz], [ax0, 3.0, zf + 1.6 * nz], [0, 0.94, 0.35 * nz], k % 2 ? '#ffffff' : (b.awning || '#ff7e7e'));
    }
    windowsOnFace(G, b, f === 's' ? 's' : 'n', 3.8, 2, b.h);
  }
  if (b.roof === 'gable') { G.gable(x0, z0, x1, z1, b.h, Math.min(b.w, b.d) * 0.32, b.roofColor || '#ff7e7e', !!b.along, b.color); if (b.kind === 'house') G.cbox(x1 - 2.2, b.h, b.z, 0.8, Math.min(b.w, b.d) * 0.4, 0.8, '#b06a5a'); }
  else if (b.roof === 'dome') {
    G.box(x0 - 0.2, b.h, z0 - 0.2, x1 + 0.2, b.h + 0.5, z1 + 0.2, tint(b.color, -0.06));
    G.cyl(b.x, b.h + 0.5, b.z, Math.min(b.w, b.d) * 0.28, 1.4, tint(b.color, -0.03), 14);
    G.dome(b.x, b.h + 1.9, b.z, Math.min(b.w, b.d) * 0.28, b.roofColor || '#3aa98f', 14, 6);
    G.cyl(b.x, b.h + 1.9 + Math.min(b.w, b.d) * 0.28, b.z, 0.12, 1.4, '#ffd23f', 6, 0.05);
    if (b.minaret) {
      const mx = x1 + 6, mz = z0 - 6;
      G.cyl(mx, 0, mz, 1.4, b.h + 9, '#f4fbf8', 10); G.cyl(mx, b.h + 9, mz, 1.8, 0.6, tint(b.color, -0.06), 10);
      G.dome(mx, b.h + 9.6, mz, 1.4, b.roofColor || '#3aa98f', 10, 4); G.cyl(mx, b.h + 11, mz, 0.08, 1.2, '#ffd23f', 6, 0.03);
    }
  } else {
    G.box(x0 - 0.2, b.h, z0 - 0.2, x1 + 0.2, b.h + 0.5, z1 + 0.2, b.trim || tint(b.color, -0.1));                 // parapet
    if (b.kind === 'tower') G.cbox(b.x + b.w * 0.15, b.h + 0.5, b.z - b.d * 0.12, 4, 2.4, 4, '#d9d4e6');
  }
  if (b.cross) { const zf = z1 + 0.1; G.quad([b.x - 0.5, b.h - 4.5, zf], [b.x + 0.5, b.h - 4.5, zf], [b.x + 0.5, b.h - 1.5, zf], [b.x - 0.5, b.h - 1.5, zf], [0, 0, 1], '#ff5a5a'); G.quad([b.x - 1.5, b.h - 3.5, zf], [b.x + 1.5, b.h - 3.5, zf], [b.x + 1.5, b.h - 2.5, zf], [b.x - 1.5, b.h - 2.5, zf], [0, 0, 1], '#ff5a5a'); }
  if (b.garage) for (const dx of [-18, 18]) { const zf = z1 + 0.09; G.quad([b.x + dx - 4, 0.06, zf], [b.x + dx + 4, 0.06, zf], [b.x + dx + 4, 4.6, zf], [b.x + dx - 4, 4.6, zf], [0, 0, 1], '#ff8a7a'); }
}
function drawParkedCar(G, c) {
  const along = Math.abs(Math.sin(c.yaw)) > 0.7;
  const L = 3.8, W = 1.8;
  const [hx, hz] = along ? [L / 2, W / 2] : [W / 2, L / 2];
  G.box(c.x - hx, 0.35, c.z - hz, c.x + hx, 1.05, c.z + hz, c.color);
  const [cx2, cz2] = along ? [hx * 0.5, hz * 0.85] : [hx * 0.85, hz * 0.5];
  G.box(c.x - cx2, 1.05, c.z - cz2, c.x + cx2, 1.65, c.z + cz2, '#bfe7ff');
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) G.cbox(c.x + sx * (along ? hx * 0.62 : hx + 0.05), 0, c.z + sz * (along ? hz + 0.05 : hz * 0.62), along ? 0.7 : 0.25, 0.7, along ? 0.25 : 0.7, '#3d3436');
}
function lamp(G, x, z) { G.cyl(x, 0, z, 0.1, 4.2, C.lamp, 6); G.cbox(x, 4.2, z, 0.5, 0.18, 0.5, C.lamp); G.ball(x, 4.0, z, 0.32, C.lampHead); }
function trafficLight(G, x, z) {
  G.cyl(x, 0, z, 0.12, 3.4, '#4a4350', 6);
  G.cbox(x, 3.4, z, 0.6, 1.7, 0.6, '#3d3436');
  G.ball(x, 4.75, z, 0.2, '#ff5a5a'); G.ball(x, 4.25, z, 0.2, '#ffd23f'); G.ball(x, 3.75, z, 0.2, '#4cc46a');
}

// ------------------------------------------------------------------------------------------------ camera blockers
// Boxes [x0, y0, z0, x1, y1, z1] the follow camera must not look through: tall buildings, and overhead structures
// (the train deck, station platforms). segmentHit = where (0..1) the segment a->b first enters the box, 1 = never.
function segmentHit(a, b, box) {
  let t0 = 0, t1 = 1;
  const o = [a.x, a.y, a.z], d = [b.x - a.x, b.y - a.y, b.z - a.z];
  if (o[0] > box[0] && o[0] < box[3] && o[1] > box[1] && o[1] < box[4] && o[2] > box[2] && o[2] < box[5]) return 1;   // starts inside: ignore
  for (let k = 0; k < 3; k++) {
    const lo = box[k], hi = box[k + 3];
    if (Math.abs(d[k]) < 1e-9) { if (o[k] < lo || o[k] > hi) return 1; continue; }
    let ta = (lo - o[k]) / d[k], tb = (hi - o[k]) / d[k];
    if (ta > tb) { const s = ta; ta = tb; tb = s; }
    t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
    if (t0 > t1) return 1;
  }
  return t0;
}

// ------------------------------------------------------------------------------------------------ highway, viaduct, stations
/** Road markings and the planted middle of a stretch of highway from x0 to x1 (no crossings inside). */
function highwayStretch(paved, bld, x0, x1) {
  paved.flat(x0, HW - HIGHWAY.median, x1, HW + HIGHWAY.median, 0.045, '#7cc76c');
  for (const sz of [-1, 1]) {
    paved.flat(x0, HW + sz * (HIGHWAY.median + 0.15) - 0.1, x1, HW + sz * (HIGHWAY.median + 0.15) + 0.1, 0.048, C.laneY);       // next to the middle
    paved.flat(x0, HW + sz * 8.6 - 0.12, x1, HW + sz * 8.6 + 0.12, 0.048, '#ffffff');                                              // edge of the shoulder
    for (let x = x0 + 3; x + 4 < x1; x += 9) paved.flat(x, HW + sz * 5.0 - 0.12, x + 4, HW + sz * 5.0 + 0.12, 0.048, '#ffffff');   // between the lanes
  }
  bld.box(x0 + 2, 0, HW - 0.28, x1 - 2, 0.55, HW + 0.28, '#e6e1ea'); bld.box(x0 + 2, 0.55, HW - 0.16, x1 - 2, 0.9, HW + 0.16, '#d6cfe0');   // the barrier
}
/** A beam of the deck between two path points, using the points' mitred normals (one continuous ribbon). */
function deckPiece(G, a, b, hw, y0, y1, hex, sideHex, bottomHex) {
  const P = (p, s, y) => [p.x + p.nx * hw * s, y, p.z + p.nz * hw * s];
  G.quad(P(a, 1, y1), P(b, 1, y1), P(b, -1, y1), P(a, -1, y1), [0, 1, 0], hex);
  G.quad(P(a, 1, y0), P(b, 1, y0), P(b, -1, y0), P(a, -1, y0), [0, -1, 0], bottomHex);
  const nl = Math.hypot(a.nx, a.nz) || 1;
  G.quad(P(a, 1, y0), P(b, 1, y0), P(b, 1, y1), P(a, 1, y1), [a.nx / nl, 0, a.nz / nl], sideHex);
  G.quad(P(a, -1, y0), P(b, -1, y0), P(b, -1, y1), P(a, -1, y1), [-a.nx / nl, 0, -a.nz / nl], sideHex);
}
function railStrip(G, a, b, off, w, y, hex) {
  const P = (p, s) => [p.x + p.nx * (off + s * w), y, p.z + p.nz * (off + s * w)];
  G.quad(P(a, -1), P(b, -1), P(b, 1), P(a, 1), [0, 1, 0], hex);
}
/** A station's platform, canopy, legs and the little bridge to the lift (all in station-frame metres). */
function drawStation(G, st) {
  const [nx, nz] = st.n, [tx, tz] = st.t, [ex, ez] = st.edge, pf = st.platform;
  const P = (a, b) => [ex + nx * a + tx * b, ez + nz * a + tz * b];
  const rect = (a0, a1, b0, b1, y0, y1, hex, bottom) => {
    const p = P(a0, b0), q = P(a1, b1);
    const x0 = Math.min(p[0], q[0]), x1 = Math.max(p[0], q[0]), z0 = Math.min(p[1], q[1]), z1 = Math.max(p[1], q[1]);
    G.box(x0, y0, z0, x1, y1, z1, hex);
    if (bottom) G.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], bottom);
  };
  rect(pf.a0, pf.a1, pf.b0, pf.b1, 8.4, 9.0, '#f4effa', '#d9d0e6');                                   // platform floor
  rect(pf.a1 - 0.75, pf.a1 - 0.4, pf.b0, pf.b1, 9.0, 9.03, '#ffd23f');                                // "stand behind the line"
  rect(pf.a0 + 0.3, pf.a1, pf.b0, pf.b1, 12.6, 12.95, RAIL.color, '#b9a8ff');                          // canopy
  for (const b of [pf.b0 + 2, -10, 10, pf.b1 - 2]) for (const a of [pf.a0 + 1, pf.a1 - 1.2]) { const p = P(a, b); G.cyl(p[0], 9.0, p[1], 0.12, 3.6, '#ffffff', 6); }
  for (const b of [pf.b0, pf.b1]) rect(pf.a0, pf.a1 - 1.2, b - 0.06, b + 0.06, 9.0, 10.1, '#ffffff');   // rails at the ends
  for (const b of [-26, -12, 12, 26]) { const p = P(-1, b); G.cyl(p[0], 0, p[1], 0.4, 8.4, '#ece6f2', 10); }
  rect(-6.6, -3.4, -35.4, pf.b0, 8.4, 9.0, '#f4effa', '#d9d0e6');                                     // bridge to the lift
}

// ------------------------------------------------------------------------------------------------ the whole town
export function createCity(scene, collision, { iconSvg }) {
  const root = new Group();
  root.name = 'city';
  scene.add(root);
  const vc = toonVertexMaterial();
  const ol = outlineMaterial(0.05);
  const groundMeshes = [];

  // ---- town-wide ground (grass), sea, beach horizon, hills
  const g = grassTexture().clone(); g.repeat.set(1, 1); g.needsUpdate = true;
  const gp = new PlaneGeometry(5200, 5200);
  const uv = gp.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 650, uv.getY(i) * 650);
  const ground = new Mesh(gp, lambert('#ffffff', g));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.06; ground.receiveShadow = true; ground.name = 'city-ground';
  root.add(ground); groundMeshes.push(ground);
  const seaCanvas = makeCanvas(256, 256), sctx = seaCanvas.getContext('2d');
  sctx.fillStyle = '#56c3ee'; sctx.fillRect(0, 0, 256, 256);
  for (let k = 0; k < 60; k++) { sctx.strokeStyle = 'rgba(255,255,255,.35)'; sctx.lineWidth = 3; const y = Math.random() * 256, x = Math.random() * 256; sctx.beginPath(); sctx.moveTo(x, y); sctx.quadraticCurveTo(x + 14, y - 6, x + 28, y); sctx.stroke(); }
  const seaTex = new CanvasTexture(seaCanvas); seaTex.wrapS = seaTex.wrapT = RepeatWrapping; seaTex.repeat.set(160, 30); seaTex.colorSpace = SRGBColorSpace;
  const sea = new Mesh(new PlaneGeometry(5200, 900), new MeshBasicMaterial({ map: seaTex }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, -0.02, SEA_Z + 450); root.add(sea);
  addBox(collision, CITY.minX - 50, SEA_Z - 2, CITY.maxX + 50, CITY.maxZ + 50, 'static');
  const sandG = new Geo(); sandG.flat(CITY.minX, BEACH.z0, CITY.maxX, SEA_Z + 4, 0.03, C.sand); sandG.flat(CITY.minX, SEA_Z - 3, CITY.maxX, SEA_Z + 1, 0.04, '#fff6dd');
  const sand = new Mesh(sandG.geometry(), vc); sand.receiveShadow = true; root.add(sand);
  const hills = new Group();
  for (let k = 0; k < 40; k++) {
    const a = (k / 40) * Math.PI * 2, R = 2600 + (k % 3) * 120;
    const x = Math.cos(a) * R, z = Math.sin(a) * R;
    if (z > 1900) continue;
    const h = new Mesh(new IcosahedronGeometry(1, 2), toon(['#8fd27a', '#7cc76c', '#9be082'][k % 3]));
    h.scale.set(320 + (k % 4) * 60, 140 + (k % 5) * 30, 280); h.position.set(x, -40, z); hills.add(h);
  }
  root.add(hills);
  // the highway runs on past the edge of the town into the hills
  const tails = new Geo(), tb = new Geo();
  for (const [x0, x1] of [[-2600, XS[0] - ROAD_HALF], [XS[XS.length - 1] + ROAD_HALF, 2600]]) {
    tails.flat(x0, HW - HIGHWAY.half, x1, HW + HIGHWAY.half, 0.03, C.asphalt);
    highwayStretch(tails, tb, x0, x1);
    addBox(collision, x0 + 2, HW - 0.3, x1 - 2, HW + 0.3, 'static');
  }
  const tailMesh = new Mesh(tails.geometry(), vc); tailMesh.receiveShadow = true; root.add(tailMesh);
  const tbMesh = new Mesh(tb.geometry(), vc); tbMesh.castShadow = true; root.add(tbMesh);
  // the train line: deck pieces and pillars by chunk
  const rail = railPath();
  const railByChunk = new Map(), pillarsByChunk = new Map();
  const put = (m, k, v) => { if (!m.has(k)) m.set(k, []); m.get(k).push(v); };

  // ---- tree instancing parts (shared)
  const trunkGeo = new CylinderGeometry(0.22, 0.32, 1, 7); trunkGeo.translate(0, 0.5, 0);
  const crownGeo = new IcosahedronGeometry(1, 1);
  const trunkMat = toon('#9a6340'), crownMat = toon('#ffffff'), crownOl = outlineMaterial(0.06);

  // ---- streets: all of them, assigned to the chunk that holds their middle
  const segsByChunk = new Map();
  const chunkKey = (x, z) => `${Math.floor((x - CITY.minX) / CHUNK)},${Math.floor((z - CITY.minZ) / CHUNK)}`;
  for (const s of roadSegments()) {
    const mx = s.axis === 'z' ? s.x : (s.a + s.b) / 2, mz = s.axis === 'z' ? (s.a + s.b) / 2 : s.z;
    const k = chunkKey(mx, mz);
    if (!segsByChunk.has(k)) segsByChunk.set(k, []);
    segsByChunk.get(k).push(s);
  }
  const blocksByChunk = new Map();
  for (let i = 0; i < BLOCK_COLS; i++) for (let j = 0; j < BLOCK_ROWS; j++) {
    const k = chunkKey(XS[i] + PITCH / 2, ZS[j] + PITCH / 2);
    if (!blocksByChunk.has(k)) blocksByChunk.set(k, []);
    blocksByChunk.get(k).push([i, j]);
  }
  rail.pts.forEach((a, k) => { const b = rail.pts[(k + 1) % rail.pts.length]; put(railByChunk, chunkKey((a.x + b.x) / 2, (a.z + b.z) / 2), k); });
  for (const p of railPillars()) put(pillarsByChunk, chunkKey(p.x, p.z), p);
  const stopsByChunk = new Map();
  for (const r of BUS_ROUTES) for (const st of routePath(r).stops) { const k = chunkKey(st.wait.x, st.wait.z); if (!stopsByChunk.has(k)) stopsByChunk.set(k, []); stopsByChunk.get(k).push(Object.assign({ color: r.color }, st)); }

  // rides that have been moved by the child live outside the chunks
  const looseRides = new Group(); root.add(looseRides);
  const rides = new Map();                   // key -> { key, kind, x, z, yaw, obj, chunk, taken }
  const chunks = new Map();
  const updaters = new Set();

  function buildChunk(cx, cz) {
    const key = `${cx},${cz}`;
    const grp = new Group(); grp.name = 'chunk-' + key;
    const paved = new Geo(), bld = new Geo();
    const items = [];                       // colliders added for this chunk
    const trees = [];
    const props = new Group();
    const signs = [];
    const myUpdaters = [];
    const blockers = [];                    // what the camera must not look through (see segmentHit)
    const addB = (b) => items.push(addBox(collision, b[0], b[1], b[2], b[3], 'city'));
    const addC = (c) => items.push(addCircle(collision, c[0], c[1], c[2], 'city'));

    // streets: asphalt, centre dashes, zebra crossings, traffic lights; the highway gets its own markings
    for (const s of segsByChunk.get(key) || []) {
      if (s.axis === 'z') {
        const ha = roadHalf('x', s.a), hb = roadHalf('x', s.b);
        paved.flat(s.x - ROAD_HALF, s.a - ROAD_HALF, s.x + ROAD_HALF, s.b + ROAD_HALF, 0.03, C.asphalt);
        for (let z = s.a + Math.max(14, ha + 10); z < s.b - Math.max(14, hb + 10); z += 7) paved.flat(s.x - 0.13, z, s.x + 0.13, z + 3.2, 0.045, C.laneY);
        if (near700(s.x, (s.a + s.b) / 2) || ha > ROAD_HALF || hb > ROAD_HALF) for (const zc of [s.a + ha + 4, s.b - hb - 6.6]) for (let k = 0; k < 7; k++) paved.flat(s.x - ROAD_HALF + 0.6 + k * 1.95, zc, s.x - ROAD_HALF + 1.6 + k * 1.95, zc + 2.6, 0.05, C.zebra);
      } else {
        const h = roadHalf('x', s.z), hw = s.z === HW;
        paved.flat(s.a - ROAD_HALF, s.z - h, s.b + ROAD_HALF, s.z + h, 0.03, C.asphalt);
        if (hw) {
          highwayStretch(paved, bld, s.a + ROAD_HALF + 2, s.b - ROAD_HALF - 2);
          addB([s.a + ROAD_HALF + 4, HW - 0.3, s.b - ROAD_HALF - 4, HW + 0.3]);
          // tall lamps in the middle (not under the train line), and a green sign over the road every third block
          if (!(s.a >= RAIL_X0 && s.b <= RAIL_X1)) for (const lx of [s.a + 50, s.a + 90]) { bld.cyl(lx, 0.9, HW, 0.12, 7.2, C.lamp, 6); bld.cbox(lx, 8.0, HW, 0.3, 0.2, 4.4, C.lamp); bld.ball(lx, 7.9, HW - 2.1, 0.32, C.lampHead); bld.ball(lx, 7.9, HW + 2.1, 0.32, C.lampHead); }
          if (Math.round((s.a - XS[0]) / PITCH) % 3 === 1) {
            const gx = s.a + 25;
            for (const sz of [-1, 1]) { bld.cyl(gx, 0, HW + sz * 12.5, 0.25, 7.0, '#6b7280', 8); addC([gx, HW + sz * 12.5, 0.3]); }
            bld.box(gx - 0.3, 6.4, HW - 12.5, gx + 0.3, 7.0, HW + 12.5, '#6b7280');
            for (const [sz, lab, rot] of [[-1, { ms: 'Ke Timur', en: 'To the East' }, -Math.PI / 2], [1, { ms: 'Ke Barat', en: 'To the West' }, Math.PI / 2]]) {
              const sg = createSign({ label: lab, color: '#2f9e5a', w: 6.4, h: 1.7, px: 640, iconKey: 'car', iconSvg });
              sg.mesh.position.set(gx + (rot < 0 ? -0.35 : 0.35), 5.5, HW + sz * 5); sg.mesh.rotation.y = rot; signs.push(sg); grp.add(sg.mesh);
            }
          }
        } else for (let x = s.a + 14; x < s.b - 14; x += 7) paved.flat(x, s.z - 0.13, x + 3.2, s.z + 0.13, 0.045, C.laneY);
        if (near700((s.a + s.b) / 2, s.z) || hw) for (const xc of [s.a + 11, s.b - 13]) for (let k = 0; k < Math.floor((2 * h - 1.2) / 1.95); k++) paved.flat(xc, s.z - h + 0.6 + k * 1.95, xc + 2.6, s.z - h + 1.6 + k * 1.95, 0.05, C.zebra);
        if (hasTrafficLight(s.a, s.z)) { const tl = trafficLightSpot(s.a, s.z); trafficLight(bld, tl.x, tl.z); addC([tl.x, tl.z, 0.3]); }
      }
    }
    // the train line overhead: deck, rails, purple stripe; pillars in the street middles
    for (const k of railByChunk.get(key) || []) {
      const a = rail.pts[k], b = rail.pts[(k + 1) % rail.pts.length];
      deckPiece(bld, a, b, 2.1, 7.7, 9.0, '#efeaf3', '#e3dcef', '#cfc6dc');
      blockers.push([Math.min(a.x, b.x) - 2.2, 7.6, Math.min(a.z, b.z) - 2.2, Math.max(a.x, b.x) + 2.2, 9.1, Math.max(a.z, b.z) + 2.2]);
      deckPiece(bld, a, b, 2.13, 8.0, 8.45, RAIL.color, RAIL.color, RAIL.color);
      for (const off of [-0.75, 0.75]) railStrip(bld, a, b, off, 0.07, 9.03, '#8a8296');
    }
    for (const p of pillarsByChunk.get(key) || []) {
      bld.cyl(p.x, 0, p.z, p.r, 7.7, '#ece6f2', 12);
      bld.cbox(p.x, 6.9, p.z, p.alongX ? 1.2 : 4.6, 0.8, p.alongX ? 4.6 : 1.2, '#ddd5e8');
      addC([p.x, p.z, p.r]);
    }
    // blocks
    for (const [i, j] of blocksByChunk.get(key) || []) {
      const bp = blockPlan(i, j);
      const { x0, z0, x1, z1, lot } = bp;
      const campus = bp.type === 'campus';
      if (campus && x0 === 0) continue;                       // the two campus blocks are drawn once, as one
      const rx0 = campus ? CAMPUS.minX : x0, rx1 = campus ? CAMPUS.maxX : x1, rz0 = z0, rz1 = z1;
      // pavement ring with a darker kerb
      const o0 = [rx0 + roadHalf('z', rx0), rz0 + roadHalf('x', rz0), rx1 - roadHalf('z', rx1), rz1 - roadHalf('x', rz1)], o1 = [rx0 + curbOf('z', rx0), rz0 + curbOf('x', rz0), rx1 - curbOf('z', rx1), rz1 - curbOf('x', rz1)];
      paved.flat(o0[0], o0[1], o0[2], o1[1], 0.06, C.walk); paved.flat(o0[0], o1[3], o0[2], o0[3], 0.06, C.walk);
      paved.flat(o0[0], o1[1], o1[0], o1[3], 0.06, C.walk); paved.flat(o1[2], o1[1], o0[2], o1[3], 0.06, C.walk);
      paved.flat(o0[0], o0[1], o0[2], o0[1] + 0.35, 0.065, C.walkEdge); paved.flat(o0[0], o0[3] - 0.35, o0[2], o0[3], 0.065, C.walkEdge);
      paved.flat(o0[0], o0[1], o0[0] + 0.35, o0[3], 0.065, C.walkEdge); paved.flat(o0[2] - 0.35, o0[1], o0[2], o0[3], 0.065, C.walkEdge);
      // lamps on the pavement corners and middles
      for (const [lx, lz] of pavementLamps(rx0, rz0, rx1, rz1)) { lamp(bld, lx, lz); addC([lx, lz, 0.25]); }
      if (campus) { buildCampus(paved, props, trees, addB, addC, signs, grp); continue; }
      if (bp.ground === 'paved' && bp.landmark) landmarkGround(paved, lot, bp.landmark);
      else if (bp.ground === 'paved') paved.flat(lot.x0, lot.z0, lot.x1, lot.z1, 0.05, C.paved);
      for (const b of bp.buildings) { drawBuilding(bld, b); if (b.h > 3) blockers.push([b.x - b.w / 2, 0, b.z - b.d / 2, b.x + b.w / 2, b.h + 2.5, b.z + b.d / 2]); }
      for (const c of bp.parked) drawParkedCar(bld, c);
      for (const t of bp.trees) trees.push(t);
      for (const pr of bp.props) props.add(propModel(pr, myUpdaters));
      bp.boxes.forEach(addB); bp.circles.forEach(addC);
      // landmark sign at the street side and markers on its learning places
      if (bp.landmark) {
        const lm = bp.landmark;
        if (!bp.station) {                                   // (a station shows its name on its canopy and hall instead)
          const sg = createSign({ label: lm.name, color: lm.color, w: 9, h: 1.9, px: 768, iconKey: lm.icon, iconSvg });
          sg.mesh.position.set((lot.x0 + lot.x1) / 2, 5.6, lot.z1 + 0.2); signs.push(sg);
          props.add(group(cyl(0.18, 0.18, 6, '#9a6340', { x: (lot.x0 + lot.x1) / 2 - 4.2, y: 3, z: lot.z1, seg: 8, outline: 0.012 }), cyl(0.18, 0.18, 6, '#9a6340', { x: (lot.x0 + lot.x1) / 2 + 4.2, y: 3, z: lot.z1, seg: 8, outline: 0.012 }), box(9.4, 2.3, 0.2, '#ffffff', { x: (lot.x0 + lot.x1) / 2, y: 5.6, z: lot.z1 + 0.05, r: 0.4, shadow: false, outline: 0.02 })));
          grp.add(sg.mesh);
        }
        for (const p of bp.pois) grp.add(poiMarker(p, lm.color, iconSvg, myUpdaters));
        for (const b of bp.buildings) if (b.sign) { const s2 = createSign({ label: b.sign, color: lm.color, w: Math.min(16, b.w * 0.5), h: 2.2, px: 768 }); s2.mesh.position.set(b.x, Math.max(4.2, b.h - 2.2), b.z + b.d / 2 + 0.3); signs.push(s2); grp.add(s2.mesh); }
        if (bp.station) {
          const st = bp.station, [nx, nz] = st.n, [ex, ez] = st.edge, rot = Math.atan2(nx, nz);
          drawStation(bld, st);
          const pf = st.platform, [tx, tz] = st.t, q0 = [ex + nx * pf.a0 + tx * pf.b0, ez + nz * pf.a0 + tz * pf.b0], q1 = [ex + nx * pf.a1 + tx * pf.b1, ez + nz * pf.a1 + tz * pf.b1];
          blockers.push([Math.min(q0[0], q1[0]), 8.4, Math.min(q0[1], q1[1]), Math.max(q0[0], q1[0]), 13.0, Math.max(q0[1], q1[1])]);
          // the name high on the canopy (seen from the street) and over the hall door (seen from the ticket spot)
          for (const [a, y, w] of [[st.platform.a1 + 0.05, 13.95, 12], [-7.85, 6.2, 10]]) {
            const sg2 = createSign({ label: lm.name, color: lm.color, w, h: 1.9, px: 768, iconKey: 'train', iconSvg });
            sg2.mesh.position.set(ex + nx * a, y, ez + nz * a); sg2.mesh.rotation.y = rot; signs.push(sg2); grp.add(sg2.mesh);
          }
        }
      }
      for (const r of bp.rides) registerRide(`${i},${j},${r.x.toFixed(1)},${r.z.toFixed(1)}`, r, key, grp);
    }
    // beach: umbrellas, palms and sandcastles along the shore
    const X0 = CITY.minX + cx * CHUNK, Z0 = CITY.minZ + cz * CHUNK;
    if (Z0 + CHUNK > BEACH.z0 && Z0 < SEA_Z) {
      for (let x = X0 + 12; x < X0 + CHUNK; x += 26) {
        const z = BEACH.z0 + 40 + ((x * 13) % 30);
        props.add(at(group(cyl(0.06, 0.06, 2.6, '#ffffff', { y: 1.3, seg: 6, outline: 0.01 }), cone(1.6, 0.8, ['#ff6b6b', '#ffd23f', '#4a90e2', '#ff8fc0'][Math.abs(Math.round(x)) % 4], { y: 2.7, seg: 10, outline: 0.02 })), x, 0, z));
        addC([x, z, 0.3]);
        trees.push({ x: x + 9, z: BEACH.z0 + 12, s: 1.1, palm: true }); addC([x + 9, BEACH.z0 + 12, 0.5]);
        if (Math.abs(Math.round(x)) % 3 === 0) props.add(at(group(cyl(0.9, 1.1, 0.7, '#f2d38a', { y: 0.35, seg: 10 }), cyl(0.5, 0.6, 0.6, '#f2d38a', { y: 0.95, seg: 10 }), cone(0.25, 0.4, '#ff6b6b', { y: 1.5, seg: 6 })), x - 6, 0, z + 18));
      }
    }
    // bus stops: shelter + sign + marker
    for (const st of stopsByChunk.get(key) || []) {
      const p = { id: 'bus-' + st.id, x: st.wait.x, z: st.wait.z, radius: 1.2, icon: 'bus' };
      const sh = group(box(3.4, 0.12, 1.6, st.color, { y: 2.6, r: 0.05, outline: 0.015 }), cyl(0.07, 0.07, 2.6, '#4a4350', { x: -1.5, y: 1.3, seg: 6, outline: 0.01 }), cyl(0.07, 0.07, 2.6, '#4a4350', { x: 1.5, y: 1.3, seg: 6, outline: 0.01 }), box(3.0, 0.15, 0.5, '#ffffff', { y: 0.55, z: -0.4, r: 0.04, outline: 0.012 }));
      const dx = st.wait.x - st.x, dz = st.wait.z - st.z;
      sh.position.set(st.wait.x + Math.sign(dx) * 0.9, 0, st.wait.z + Math.sign(dz) * 0.9);
      sh.rotation.y = Math.abs(dx) > Math.abs(dz) ? Math.PI / 2 : 0;
      props.add(sh);
      const sg = createSign({ label: st.name, color: st.color, w: 3.4, h: 0.8, px: 512, iconKey: 'bus', iconSvg });
      sg.mesh.position.set(sh.position.x, 3.25, sh.position.z); sg.mesh.rotation.y = sh.rotation.y + (Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? Math.PI : 0) : (dz > 0 ? 0 : Math.PI));
      signs.push(sg); grp.add(sg.mesh);
      grp.add(poiMarker(p, st.color, iconSvg, myUpdaters));
    }
    // meshes
    if (!paved.empty) { const m = new Mesh(paved.geometry(), vc); m.receiveShadow = true; m.userData.chunkGeometry = true; grp.add(m); }
    if (!bld.empty) {
      const geo = bld.geometry();
      const m = new Mesh(geo, vc); m.castShadow = true; m.receiveShadow = true; m.userData.chunkGeometry = true; grp.add(m);
      const o = new Mesh(geo, ol); o.userData.isOutline = true; grp.add(o);
    }
    if (trees.length) {
      const tm = new InstancedMesh(trunkGeo, trunkMat, trees.length), cm = new InstancedMesh(crownGeo, crownMat, trees.length), co = new InstancedMesh(crownGeo, crownOl, trees.length);
      const d = new Object3D(), cc = new Color();
      trees.forEach((t, k) => {
        const s = t.s || 1, h = (t.palm ? 4.2 : 2.6) * s;
        d.position.set(t.x, 0, t.z); d.rotation.set(0, (t.x * 7) % 6, 0); d.scale.set(s * (t.palm ? 0.7 : 1), h, s * (t.palm ? 0.7 : 1)); d.updateMatrix(); tm.setMatrixAt(k, d.matrix);
        d.position.set(t.x, h + 1.0 * s, t.z); d.scale.set(2.1 * s * (t.palm ? 1.2 : 1), (t.palm ? 0.9 : 1.8) * s, 2.1 * s * (t.palm ? 1.2 : 1)); d.updateMatrix(); cm.setMatrixAt(k, d.matrix); co.setMatrixAt(k, d.matrix);
        const pink = !t.palm && ((Math.round(t.x * 3) + Math.round(t.z)) % 9 === 0);
        cm.setColorAt(k, cc.set(t.palm ? '#5cc46a' : pink ? '#ffb3d4' : ['#5cc46a', '#68cf6e', '#4fb862', '#7ad66f'][Math.abs(Math.round(t.x + t.z)) % 4]));
      });
      tm.castShadow = cm.castShadow = true; cm.receiveShadow = true;
      grp.add(tm, cm, co);
    }
    mergeStatic(props);
    grp.add(props);
    root.add(grp);
    chunks.set(key, { key, cx, cz, grp, items, signs, blockers, updaters: myUpdaters });
    myUpdaters.forEach((u) => updaters.add(u));
  }

  function unloadChunk(key) {
    const c = chunks.get(key);
    if (!c) return;
    removeItems(collision, c.items);
    c.signs.forEach((s) => s.dispose());
    c.updaters.forEach((u) => updaters.delete(u));
    for (const [k, r] of rides) if (r.chunk === key && !r.taken && !r.loose) rides.delete(k);
    root.remove(c.grp);
    c.grp.traverse((o) => { if (o.isMesh && (o.userData.ownGeometry || o.userData.chunkGeometry)) o.geometry.dispose(); });
    chunks.delete(key);
  }

  // ---- rides (unicorns and cars) ----------------------------------------------------------------------------
  function makeRideModel(r) { return r.kind === 'unicorn' ? unicorn() : kidCar(r.color || '#ff6b6b'); }
  function registerRide(key, r, chunkKey2, grp) {
    if (rides.has(key)) return;                              // already exists (moved by the child, or loaded)
    const obj = makeRideModel(r);
    obj.position.set(r.x, 0, r.z); obj.rotation.y = r.yaw || 0;
    obj.traverse((o) => { if (o.isMesh && !o.userData.isOutline) o.castShadow = true; });
    grp.add(obj);
    rides.set(key, { key, kind: r.kind, x: r.x, z: r.z, yaw: r.yaw || 0, obj, chunk: chunkKey2, taken: false, loose: false });
  }

  // ---- the campus around the preschool -----------------------------------------------------------------------------
  function buildCampus(paved, props, trees, addB, addC, signs, grp) {
    const I = CAMPUS_INNER;
    // paths: south garden gate -> pavement, east gate -> stable, car park
    paved.flat(37, 22, 43, I.maxZ, 0.04, '#e9d6b4');
    paved.flat(64, -3.5, I.maxX, 1.5, 0.04, '#e9d6b4');
    paved.flat(-108, 22, -66, I.maxZ - 2, 0.04, '#c9c9d6');
    for (let x = -104; x <= -70; x += 8) paved.flat(x, 26, x + 0.25, 38, 0.05, '#ffffff');
    paved.flat(-66, 34, 37, 38, 0.04, '#e9d6b4');
    // stable for the unicorns
    const s = CAMPUS_PLAN.stable;
    props.add(at(group(box(18, 0.2, 9, '#f2c1d4', { y: 0.1, r: 0.05 }), box(18, 3.4, 0.4, '#ffe3ef', { y: 1.7, z: -4.4, r: 0.1 }), box(0.4, 3.4, 9, '#ffe3ef', { x: -8.8, y: 1.7, r: 0.1 }), box(0.4, 3.4, 9, '#ffe3ef', { x: 8.8, y: 1.7, r: 0.1 }),
      box(19, 0.4, 10, '#ff8fc0', { y: 3.7, r: 0.15 }), star3d(0.6, 0.2, '#ffd23f', { y: 4.4, outline: 0.02 }), heart3d(0.4, 0.15, '#ffffff', { y: 2.6, z: -4.1, outline: 0.015 })), s.x, 0, s.z - 1));
    CAMPUS_PLAN.boxes.forEach(addB);
    addB([s.x - 9, s.z - 6, s.x - 8.4, s.z + 3.5]); addB([s.x + 8.4, s.z - 6, s.x + 9, s.z + 3.5]);
    const sg = createSign({ label: { ms: 'Tunggang Unicorn!', en: 'Ride a Unicorn!' }, color: '#ff7eb6', w: 5, h: 1.1, px: 640, iconKey: 'star', iconSvg });
    sg.mesh.position.set(s.x, 5.4, s.z + 3.6); signs.push(sg); grp.add(sg.mesh);
    const gate = createSign({ label: 'Tadika AmmaraGames', color: '#ff7eb6', w: 8, h: 1.6, px: 768, iconKey: 'star', iconSvg });
    gate.mesh.position.set(CAMPUS_PLAN.sign.x, 5.2, CAMPUS_PLAN.sign.z + 0.2); signs.push(gate); grp.add(gate.mesh);
    props.add(group(cyl(0.3, 0.3, 6, '#ff8fc0', { x: 35.5, y: 3, z: 44, seg: 10, outline: 0.02 }), cyl(0.3, 0.3, 6, '#ff8fc0', { x: 44.5, y: 3, z: 44, seg: 10, outline: 0.02 }), box(10, 2, 0.3, '#ffffff', { x: 40, y: 5.2, z: 44, r: 0.5, outline: 0.02 }), star3d(0.6, 0.2, '#ffd23f', { x: 40, y: 6.8, z: 44, outline: 0.02 })));
    addC([35.5, 44, 0.35]); addC([44.5, 44, 0.35]);
    for (const [x, z] of [[-110, -45], [-80, -45], [-30, -45], [20, -45], [70, -45], [108, -45], [-110, 45], [108, 45], [100, 20], [-50, 45], [70, 45], [-110, 0]]) { trees.push({ x, z, s: 1.2 }); addC([x, z, 0.65]); }
    for (const r of CAMPUS_PLAN.rides) registerRide(`campus,${r.x},${r.z}`, r, 'campus', looseRides);
  }

  // ---- streaming -------------------------------------------------------------------------------------------------
  let timer = 0;
  const want = [];
  function desired(px, pz) {
    want.length = 0;
    const ccx = Math.floor((px - CITY.minX) / CHUNK), ccz = Math.floor((pz - CITY.minZ) / CHUNK);
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
      const cx = ccx + dx, cz = ccz + dz;
      if (cx < -1 || cz < -1 || cx > CHUNKS || cz > CHUNKS) continue;
      const x0 = CITY.minX + cx * CHUNK, z0 = CITY.minZ + cz * CHUNK;
      const ddx = Math.max(x0 - px, 0, px - (x0 + CHUNK)), ddz = Math.max(z0 - pz, 0, pz - (z0 + CHUNK));
      const d = Math.hypot(ddx, ddz);
      if (d < LOAD) want.push({ cx, cz, d });
    }
    want.sort((a, b) => a.d - b.d);
    return want;
  }
  function stream(px, pz, budget = 1) {
    let built = 0;
    for (const w of desired(px, pz)) {
      if (chunks.has(`${w.cx},${w.cz}`)) continue;
      buildChunk(w.cx, w.cz);
      if (++built >= budget) break;
    }
    for (const [k, c] of chunks) {
      const x0 = CITY.minX + c.cx * CHUNK, z0 = CITY.minZ + c.cz * CHUNK;
      const d = Math.hypot(Math.max(x0 - px, 0, px - (x0 + CHUNK)), Math.max(z0 - pz, 0, pz - (z0 + CHUNK)));
      if (d > UNLOAD) unloadChunk(k);
    }
    return built;
  }
  let seaT = 0;
  return {
    root, groundMeshes, rides, looseRides,
    get loaded() { return chunks.size; },
    /** Builds everything near (x, z) at once (used while the loading screen is up). */
    preload(x, z) { let n = 0; while (stream(x, z, 4) && n < 40) n++; },
    update(px, pz, dt, t, reduced) {
      timer -= dt;
      if (timer <= 0) { timer = 0.12; stream(px, pz, 1); }
      for (const u of updaters) u(t, reduced);
      if (!reduced) { seaT += dt; seaTex.offset.set(seaT * 0.004, Math.sin(seaT * 0.3) * 0.01); }
    },
    /** A ride the child can get on: within `gap` metres of its edge. */
    nearRide(x, z, gap) {
      let best = null, bd = Infinity;
      for (const r of rides.values()) { if (r.taken) continue; const d = Math.hypot(r.x - x, r.z - z) - (r.kind === 'car' ? 1.8 : 1.2); if (d < gap && d < bd) { bd = d; best = r; } }
      return best;
    },
    take(r) { r.taken = true; r.loose = true; if (r.obj.parent !== looseRides) looseRides.attach(r.obj); },
    leave(r, x, z, yaw) { r.taken = false; r.x = x; r.z = z; r.yaw = yaw; r.obj.position.set(x, 0, z); r.obj.rotation.y = yaw; },
    /**
     * Keeps the follow camera `cam` (a Vector3, changed in place) from looking at the child `head` through the town:
     * under a train deck or platform it stays below it; behind a tall building it moves in front of it.
     */
    clipCamera(head, cam) {
      const minX = Math.min(head.x, cam.x), maxX = Math.max(head.x, cam.x), minZ = Math.min(head.z, cam.z), maxZ = Math.max(head.z, cam.z);
      const near = [];
      for (const c of chunks.values()) for (const b of c.blockers) if (b[3] >= minX && b[0] <= maxX && b[5] >= minZ && b[2] <= maxZ) near.push(b);
      // (repeat: ducking under one structure can put the camera into another one lower down)
      for (let pass = 0, moved = true; moved && pass < 4; pass++) {
        moved = false;
        for (const b of near) if (b[1] >= 4 && cam.y > b[1] - 0.5 + 1e-6 && segmentHit(head, cam, b) < 1) { cam.y = Math.max(2.2, b[1] - 0.5); moved = true; }
      }
      let t = 1;
      for (const b of near) if (b[1] < 4) t = Math.min(t, segmentHit(head, cam, b));
      if (t >= 1) return 1;
      // a building in the way: look down more steeply (over it) at the same distance...
      const hx = cam.x - head.x, hz = cam.z - head.z, hd = Math.hypot(hx, hz) || 1, L = Math.hypot(hd, cam.y - head.y);
      const tmp = { x: 0, y: 0, z: 0 };
      for (let el = Math.atan2(cam.y - head.y, hd) + 0.1; el <= 1.36; el += 0.1) {
        tmp.x = head.x + (hx / hd) * L * Math.cos(el); tmp.y = head.y + L * Math.sin(el); tmp.z = head.z + (hz / hd) * L * Math.cos(el);
        if (near.every((b) => segmentHit(head, tmp, b) >= 1)) { cam.set(tmp.x, tmp.y, tmp.z); return t; }
      }
      // ...or, when nothing else works, come in closer
      const dy = cam.y - head.y, d = Math.max(1.6, t * L - 0.6) / L;
      cam.set(head.x + hx * d, head.y + dy * d, head.z + hz * d);
      return t;
    },
    stats() { let tris = 0; return { chunks: chunks.size, rides: rides.size, colliders: collision.boxes.length + collision.circles.length, tris }; }
  };
}

// ------------------------------------------------------------------------------------------------ props
function propModel(p, updaters) {
  const o = (obj) => at(obj, p.x, 0, p.z, p.yaw || 0);
  switch (p.kind) {
    case 'fountain': { const f = fountain(2.8); return o(f); }
    case 'bench': return o(benchWood(2, '#e0b988'));
    case 'swing': return o(swingSet());
    case 'playset': return o(group(slideKid(), at(climberDome(), 5, 0, 0)));
    case 'pond': {
      const r = p.r || 12;
      return o(group(cyl(r, r, 0.08, '#5fc8f0', { y: 0.06, seg: 28, outline: 0 }), torus(r, 0.35, '#d9d2c4', { y: 0.12, rx: Math.PI / 2, outline: 0.02 }), at(group(ball(0.35, '#ffffff', { sz: 1.3, seg: 10 }), ball(0.22, '#ffffff', { y: 0.32, z: 0.3, seg: 8 }), cone(0.08, 0.16, '#ff9a3c', { y: 0.3, z: 0.55, rx: Math.PI / 2, seg: 6 })), r * 0.4, 0.2, -r * 0.2)));
    }
    case 'zoo': return o(group(box(6, 4, 0.4, '#ff9a3c', { x: 0, y: 2, z: 38, r: 0.2 }), star3d(0.8, 0.3, '#ffd23f', { y: 4.6, z: 38 })));
    case 'animal': {
      const a = animal(p.animal);
      const fence = group();
      for (const [x0, z0, x1, z1] of [[-9, -8, 9, -8], [-9, 8, 9, 8], [-9, -8, -9, 8], [9, -8, 9, 8]]) {
        const len = Math.hypot(x1 - x0, z1 - z0);
        fence.add(box(Math.abs(x1 - x0) || 0.18, 0.18, Math.abs(z1 - z0) || 0.18, '#c48a5a', { x: (x0 + x1) / 2, y: 0.9, z: (z0 + z1) / 2, r: 0.04, outline: 0.01 }));
        for (let k = 0; k <= len; k += 3) fence.add(cyl(0.1, 0.1, 1.2, '#9a6340', { x: x0 + ((x1 - x0) * k) / len, y: 0.6, z: z0 + ((z1 - z0) * k) / len, seg: 6, outline: 0.008 }));
      }
      if (p.animal === 'cow' || p.animal === 'goat' || p.animal === 'duck') return o(a);
      return o(group(fence, a));
    }
    case 'stall': return o(buildLandmark('stall', { color: p.color }).obj);
    case 'vehicle': {
      if (p.vehicle === 'bus' || p.vehicle === 'schoolbus') { const b = busModel(p.vehicle === 'schoolbus' ? '#ffd23f' : '#ffb43c'); b.scale.setScalar(0.9); return o(b); }
      const v = buildLandmark('vehicle', { vehicle: p.vehicle }).obj; v.scale.setScalar(1.6); return o(v);
    }
    case 'trafficPark': return o(buildLandmark('trafficLight', {}).obj);
    case 'wheel': {
      const wheel = live(group());
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; wheel.add(box(0.2, 7, 0.2, '#ffffff', { rz: a, outline: 0.01 }), at(group(box(1.4, 1.2, 1.4, ['#ff6b6b', '#ffd23f', '#4a90e2', '#5cc46a', '#ff8fc0', '#9b6bff', '#ff9a3c', '#3fc8d8'][k], { r: 0.2, outline: 0.015 })), Math.cos(a) * 7, Math.sin(a) * 7, 0)); }
      wheel.add(torus(7, 0.18, '#ff8fc0', { outline: 0.012 }));
      wheel.position.y = 9;
      updaters.push((t, r) => { if (!r) { wheel.rotation.z = t * 0.2; wheel.children.forEach((c) => { if (c.type === 'Group') c.rotation.z = -t * 0.2; }); } });
      return o(group(cyl(0.4, 0.5, 9, '#ffffff', { x: -2, y: 4.5, rz: 0.2 }), cyl(0.4, 0.5, 9, '#ffffff', { x: 2, y: 4.5, rz: -0.2 }), wheel));
    }
    case 'carousel': {
      const top = live(group(cone(7, 2.4, '#ff8fc0', { y: 5.4, seg: 12 }), cyl(6.8, 6.8, 0.4, '#ffd23f', { y: 4.1, seg: 18 })));
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; const u = unicornMini(); u.position.set(Math.cos(a) * 4.8, 0.4, Math.sin(a) * 4.8); u.rotation.y = -a; top.add(u, cyl(0.06, 0.06, 4, '#ffd23f', { x: Math.cos(a) * 4.8, y: 2.2, z: Math.sin(a) * 4.8, seg: 6, outline: 0 })); }
      updaters.push((t, r) => { if (!r) top.rotation.y = t * 0.4; });
      return o(group(cyl(7, 7, 0.4, '#fff3dc', { y: 0.2, seg: 20 }), cyl(0.5, 0.5, 4, '#ffffff', { y: 2.2 }), top));
    }
    case 'balloons': {
      const b = live(group());
      ['#ff6b6b', '#ffd23f', '#4a90e2', '#5cc46a', '#ff8fc0'].forEach((c, k) => b.add(ball(0.6, c, { x: (k - 2) * 0.8, y: 5 + (k % 2) * 0.6, seg: 12, outline: 0.015 }), cyl(0.015, 0.015, 4, '#ffffff', { x: (k - 2) * 0.4, y: 3, seg: 4, outline: 0 })));
      updaters.push((t, r) => { if (!r) b.position.y = Math.sin(t * 1.3) * 0.25; });
      return o(group(box(2, 1.2, 1.4, '#ffe3ef', { y: 0.6, r: 0.1 }), b));
    }
    case 'pitch': {
      const g2 = group(box(70, 0.04, 44, '#58c46a', { y: 0.03, r: 0.01, outline: 0 }));
      for (const [w, d, x, z] of [[70, 0.3, 0, -22], [70, 0.3, 0, 22], [0.3, 44, -35, 0], [0.3, 44, 35, 0], [0.3, 44, 0, 0]]) g2.add(box(w, 0.06, d, '#ffffff', { x, y: 0.05, z, r: 0.01, outline: 0 }));
      g2.add(torus(6, 0.15, '#ffffff', { y: 0.06, rx: Math.PI / 2, outline: 0 }));
      for (const x of [-35, 35]) g2.add(box(0.2, 2.4, 7, '#ffffff', { x, y: 1.2, r: 0.05, outline: 0.012 }), box(0.2, 0.2, 7, '#ffffff', { x, y: 2.4, r: 0.05 }));
      for (const z of [-45, 45]) for (let k = 0; k < 3; k++) g2.add(box(92, 0.6, 1.2, ['#ff8fc0', '#7fcbff', '#ffd23f'][k], { y: 0.3 + k * 0.6, z: z + Math.sign(z) * k * 0.6, r: 0.1 }));
      g2.add(ball(0.5, '#ffffff', { y: 0.5, seg: 12, outline: 0.02 }));
      return o(g2);
    }
    case 'flag': return o(group(cyl(0.12, 0.12, 9, '#e9e4ef', { y: 4.5, seg: 8 }), box(3, 1.8, 0.06, '#4a90e2', { x: 1.5, y: 8, r: 0.02, outline: 0.012 }), star3d(0.5, 0.1, '#ffd23f', { x: 1.5, y: 8, z: 0.06, outline: 0 })));
    case 'rocket': { const r = buildLandmark('rocket', {}).obj; r.scale.setScalar(2.2); return o(r); }
    case 'telescope': return o(buildLandmark('telescope', {}).obj);
    case 'easels': return o(group(at(easelKid(null, '#ff8fc0'), -6, 0, 0), at(easelKid(null, '#7fcbff'), 0, 0, 0), at(easelKid(null, '#ffd23f'), 6, 0, 0)));
    case 'barn': { const b2 = buildLandmark('barn', {}).obj; b2.scale.setScalar(2.4); return o(b2); }
    case 'flowers': return o(flowerBed(p.w, p.d));
    case 'lift': return o(group(box(3.2, 12.2, 3.2, '#bfe7ff', { y: 6.1, r: 0.15, outline: 0.02, matOpts: { transparent: true, opacity: 0.75 } }), box(3.5, 0.5, 3.5, '#8a6cff', { y: 12.4, r: 0.1, outline: 0.02 }),
      box(1.4, 2.4, 0.08, '#e9e4ef', { y: 1.2, z: 1.62, r: 0.04, outline: 0.01 }), box(1.4, 2.4, 0.08, '#e9e4ef', { y: 1.2, z: -1.62, r: 0.04, outline: 0.01 })));
    case 'veg': return o(group(at(vegPatch(20, 5), 0, 0, -3), at(flowerBed(20, 4), 0, 0, 4)));
    case 'bigteddy': { const b3 = buildLandmark('teddy', {}).obj; b3.scale.setScalar(2.5); return o(b3); }
    case 'bigplay': return o(group(at(slideKid(), -8, 0, 0), at(climberDome(), 0, 0, 0), at(swingSet(), 9, 0, 0)));
    case 'stage': return o(group(box(36, 1.2, 18, '#ffe3ef', { y: 0.6, r: 0.2 }), box(36, 9, 0.6, '#ff6fa8', { y: 5, z: -8.7, r: 0.3 }), torus(10, 0.5, '#ffd23f', { y: 6, z: -8, outline: 0.02, arc: Math.PI }),
      ...[-8, -3, 3, 8].map((x, k) => box(2.6, 0.5, 1.4, ['#ff6b6b', '#ff9a3c', '#ffd23f', '#5cc46a'][k], { x, y: 1.45, z: -2, r: 0.1 })), box(2, 3, 2, '#4a4350', { x: -16, y: 2.7, z: -6, r: 0.3 }), box(2, 3, 2, '#4a4350', { x: 16, y: 2.7, z: -6, r: 0.3 })));
    case 'stable': return o(group(box(12, 0.2, 5, '#f2c1d4', { y: 0.1 }), box(12, 3, 0.3, '#ffe3ef', { y: 1.5, z: 2.4 }), box(13, 0.3, 6, '#ff8fc0', { y: 3.2 })));
    default: return new Group();
  }
}
function unicornMini() {
  return group(ball(0.5, '#ffffff', { y: 1.0, sz: 1.4, seg: 12, outline: 0.02 }), ball(0.3, '#ffffff', { y: 1.6, z: 0.6, seg: 10, outline: 0.015 }), cone(0.06, 0.4, '#ffd23f', { y: 1.95, z: 0.7, seg: 6, outline: 0.01 }), ball(0.15, '#ff8fc0', { y: 1.75, z: 0.35, seg: 8, outline: 0.01 }));
}
void PlaneGeometry; void treeRound; void CAMPUS; void isCampus; void landmarkById; void lambert;
