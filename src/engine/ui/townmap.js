// The town on a map: streets, districts, landmarks, bus lines and the child. Used by the big map ("Bandar" tab) and by
// the small corner map when the child is out in the town.
import {
  CITY, XS, ZS, PITCH, ROAD_HALF, CURB, SEA_Z, CAMPUS, LANDMARKS, BUS_ROUTES, BLOCK_COLS, BLOCK_ROWS, blockTypeAt, cityPois, HIGHWAY, RAIL, railPath
} from '../city/plan.js';

const TYPE_COLOR = {
  tower: '#cfe3ff', shops: '#ffe0b8', plaza: '#fff0c4', flats: '#e3d9ff', houses: '#ffd9cf', park: '#bfe8b0', forest: '#8fd18a', campus: '#ffc6df'
};
const ROAD = '#b9bccb', GRASS = '#cfeec0', SAND = '#f7e2a8', SEA = '#8fd3f5';
const FULL = { x0: CITY.minX, x1: CITY.maxX, z0: CITY.minZ, z1: SEA_Z + 140 };

let types = null;
function blockTypes() {
  if (!types) {
    types = [];
    for (let i = 0; i < BLOCK_COLS; i++) for (let j = 0; j < BLOCK_ROWS; j++) types.push({ i, j, type: blockTypeAt(i, j) });
  }
  return types;
}
const lmAt = new Map(LANDMARKS.map((l) => [`${l.x0},${l.z0}`, l]));

/** Where a landmark is drawn (its middle) and where a fast trip there arrives (the pavement in front of it). */
export const landmarkSpot = (l) => ({ x: l.x0 + PITCH / 2, z: l.z0 + PITCH / 2 });
export const landmarkArrival = (l) => ({ x: l.x0 + PITCH / 2 + 6, z: l.z0 + PITCH - (CURB + ROAD_HALF) / 2 });
export const busStops = () => cityPois().filter((p) => p.action === 'bus');
export const inTown = (x, z) => x >= CITY.minX && x <= CITY.maxX && z >= CITY.minZ && z <= SEA_Z;

function projection(w, h, view) {
  if (view) {
    const k = w / view.span;
    return { k, X: (x) => w / 2 + (x - view.x) * k, Z: (z) => h / 2 + (z - view.z) * k, inv: (px, pz) => ({ x: view.x + (px - w / 2) / k, z: view.z + (pz - h / 2) / k }) };
  }
  const k = Math.min(w / (FULL.x1 - FULL.x0), h / (FULL.z1 - FULL.z0));
  const ox = (w - (FULL.x1 - FULL.x0) * k) / 2, oz = (h - (FULL.z1 - FULL.z0) * k) / 2;
  return { k, X: (x) => ox + (x - FULL.x0) * k, Z: (z) => oz + (z - FULL.z0) * k, inv: (px, pz) => ({ x: FULL.x0 + (px - ox) / k, z: FULL.z0 + (pz - oz) / k }) };
}

function drawBase(ctx, w, h, P, view) {
  const { k, X, Z } = P;
  ctx.fillStyle = GRASS; ctx.fillRect(0, 0, w, h);
  const vis = (x0, z0, x1, z1) => X(x1) >= 0 && X(x0) <= w && Z(z1) >= 0 && Z(z0) <= h;
  // the street grid, then the blocks on top of it
  ctx.fillStyle = ROAD;
  ctx.fillRect(X(XS[0] - ROAD_HALF), Z(ZS[0] - ROAD_HALF), (XS[XS.length - 1] - XS[0] + 2 * ROAD_HALF) * k, (ZS[ZS.length - 1] - ZS[0] + 2 * ROAD_HALF) * k);
  ctx.fillStyle = SAND; ctx.fillRect(X(FULL.x0), Z(ZS[ZS.length - 1] + ROAD_HALF), (FULL.x1 - FULL.x0) * k, (SEA_Z - ZS[ZS.length - 1] - ROAD_HALF) * k);
  ctx.fillStyle = SEA; ctx.fillRect(X(FULL.x0), Z(SEA_Z), (FULL.x1 - FULL.x0) * k, Math.max(h, (FULL.z1 - SEA_Z) * k + h));
  const gap = view ? ROAD_HALF : Math.max(ROAD_HALF, 1.2 / k);
  for (const b of blockTypes()) {
    const x0 = XS[b.i] + gap, z0 = ZS[b.j] + gap, x1 = XS[b.i + 1] - gap, z1 = ZS[b.j + 1] - gap;
    if (!vis(x0, z0, x1, z1)) continue;
    if (b.type === 'campus') continue;
    const lm = b.type === 'landmark' ? lmAt.get(`${XS[b.i]},${ZS[b.j]}`) : null;
    ctx.fillStyle = lm ? lm.color : TYPE_COLOR[b.type] || GRASS;
    ctx.globalAlpha = lm ? 0.55 : 1;
    ctx.fillRect(X(x0), Z(z0), (x1 - x0) * k, (z1 - z0) * k);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = TYPE_COLOR.campus;
  ctx.fillRect(X(CAMPUS.minX + gap), Z(CAMPUS.minZ + gap), (CAMPUS.maxX - CAMPUS.minX - 2 * gap) * k, (CAMPUS.maxZ - CAMPUS.minZ - 2 * gap) * k);
  // the highway: a wide grey band with its green middle
  ctx.fillStyle = '#8f93a3'; ctx.fillRect(X(-2600), Z(HIGHWAY.z - HIGHWAY.half), 5200 * k, Math.max(2.5, 2 * HIGHWAY.half * k));
  ctx.fillStyle = '#7cc76c'; ctx.fillRect(X(-2600), Z(HIGHWAY.z) - Math.max(0.5, HIGHWAY.median * k), 5200 * k, Math.max(1, 2 * HIGHWAY.median * k));
  // bus lines
  ctx.lineWidth = Math.max(2, Math.min(6, 4 * k)); ctx.lineJoin = 'round';
  for (const r of BUS_ROUTES) {
    ctx.strokeStyle = r.color; ctx.beginPath();
    r.nodes.forEach(([x, z], n) => (n ? ctx.lineTo(X(x), Z(z)) : ctx.moveTo(X(x), Z(z))));
    ctx.closePath(); ctx.stroke();
  }
  // the train loop (purple, with white sleepers)
  const rp = railPath();
  const loop = () => { ctx.beginPath(); rp.pts.forEach((p, n) => (n ? ctx.lineTo(X(p.x), Z(p.z)) : ctx.moveTo(X(p.x), Z(p.z)))); ctx.closePath(); };
  loop(); ctx.strokeStyle = RAIL.color; ctx.lineWidth = Math.max(3, Math.min(9, 4.4 * k)); ctx.stroke();
  loop(); ctx.setLineDash([4, 5]); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, Math.min(3, 1.4 * k)); ctx.stroke(); ctx.setLineDash([]);
}

/**
 * Draws the town. `view` = { x, z, span } shows `span` metres around a spot (the corner map); without it the whole
 * town fits the canvas. Returns the projection, so a tap can be turned back into town metres.
 */
export function drawTown(canvas, { player = null, view = null, time = 0, markers = true, cache = null } = {}) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const P = projection(w, h, view);
  const { k, X, Z } = P;
  ctx.save();
  if (!view && cache) {
    if (!cache.canvas || cache.canvas.width !== w || cache.canvas.height !== h) {
      cache.canvas = document.createElement('canvas'); cache.canvas.width = w; cache.canvas.height = h;
      drawBase(cache.canvas.getContext('2d'), w, h, P, null);
    }
    ctx.drawImage(cache.canvas, 0, 0);
  } else drawBase(ctx, w, h, P, view);
  // bus stops: small squares in the line's colour
  const R = view ? Math.max(4, 3.2 * k) : 4.5;
  for (const s of busStops()) {
    const route = BUS_ROUTES.find((r) => r.id === s.route);
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = route ? route.color : '#ffb43c'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.rect(X(s.x) - R * 0.8, Z(s.z) - R * 0.8, R * 1.6, R * 1.6); ctx.fill(); ctx.stroke();
  }
  // landmarks: round badges in their colour (the big map lists their names beside it)
  if (markers) {
    const r = view ? Math.max(5, 7 * k) : 8;
    for (const l of LANDMARKS) {
      const p = landmarkSpot(l);
      ctx.beginPath(); ctx.arc(X(p.x), Z(p.z), r, 0, 7);
      ctx.fillStyle = l.color; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    }
    // the preschool: a pink star
    star(ctx, X(0), Z(0), view ? Math.max(6, 9 * k) : 10, '#ff8fc0');
  }
  if (player) arrow(ctx, X(player.x), Z(player.z), view ? 7 : 8, player.yaw, time);
  ctx.restore();
  return P;
}

function star(ctx, x, y, R, color) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? R * 0.45 : R; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.stroke();
}
/** The child: a pink arrow pointing the way they face (yaw 0 = towards +z). */
export function arrow(ctx, x, y, R, yaw, time) {
  const pulse = 1 + Math.sin(time * 4) * 0.12;
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, R * 1.5 * pulse, 0, 7); ctx.fillStyle = 'rgba(255,90,150,.25)'; ctx.fill();
  ctx.translate(x, y); ctx.rotate(Math.PI - yaw);
  ctx.beginPath(); ctx.moveTo(0, -R * 1.15); ctx.lineTo(R * 0.85, R * 0.85); ctx.lineTo(0, R * 0.4); ctx.lineTo(-R * 0.85, R * 0.85); ctx.closePath();
  ctx.fillStyle = '#ff4f95'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  ctx.restore();
}

/** The landmark or bus stop drawn nearest to a tap (canvas pixels), or null. */
export function pickTown(P, px, pz, maxPx = 16) {
  let best = null, bd = maxPx;
  for (const l of LANDMARKS) { const p = landmarkSpot(l), d = Math.hypot(P.X(p.x) - px, P.Z(p.z) - pz); if (d < bd) { bd = d; best = { kind: 'landmark', landmark: l }; } }
  for (const s of busStops()) { const d = Math.hypot(P.X(s.x) - px, P.Z(s.z) - pz); if (d < bd) { bd = d; best = { kind: 'stop', stop: s }; } }
  const d0 = Math.hypot(P.X(0) - px, P.Z(0) - pz);
  if (d0 < bd) best = { kind: 'home' };
  return best;
}
