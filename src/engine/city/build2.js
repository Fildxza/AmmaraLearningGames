// Town builder, second part: the new kinds of buildings (shophouses, terrace and village houses, mall, aquarium,
// cinema, bank, grand mosque), traffic lights that change colour, coins, the jogging track with joggers, the
// airstrip, the jetty with boats, and the roller coaster you can ride.
import { InstancedMesh, Object3D, Color, SphereGeometry, CylinderGeometry, MeshBasicMaterial, Group, Vector3 } from 'three';
import { toon } from '../world/paint.js';
import { box, ball, cyl, cone, capsule, group, live } from '../world/kit.js';
import { tint } from '../world/paint.js';
import { lightPhase } from './plan.js';
import { coasterTrack } from './landmarks2.js';

const WIN = '#a8dcff';

// ------------------------------------------------------------------------------------------------ buildings
/** Extra drawing for the new building kinds. Returns true when the building was drawn completely here. */
export function drawBuilding2(G, b, windowsOnFace) {
  const x0 = b.x - b.w / 2, x1 = b.x + b.w / 2, z0 = b.z - b.d / 2, z1 = b.z + b.d / 2;
  switch (b.kind) {
    case 'kampung': {
      // a wooden village house on stilts with a steep thatched roof and a small staircase
      const legs = [[x0 + 0.4, z0 + 0.4], [x1 - 0.4, z0 + 0.4], [x0 + 0.4, z1 - 0.4], [x1 - 0.4, z1 - 0.4], [b.x, z0 + 0.4], [b.x, z1 - 0.4]];
      for (const [lx, lz] of legs) G.cbox(lx, 0, lz, 0.35, 1.8, 0.35, '#8a5a3c');
      G.box(x0, 1.8, z0, x1, 2.1, z1, '#b07a52');
      G.box(x0 + 0.5, 2.1, z0 + 0.5, x1 - 0.5, 4.4, z1 - 0.5, b.color);
      for (const f of ['n', 's']) { const zf = f === 's' ? z1 - 0.48 : z0 + 0.48, nz = f === 's' ? 1 : -1; for (const dx of [-b.w * 0.28, b.w * 0.28]) G.quad([b.x + dx - 0.8, 2.8, zf + 0.02 * nz], [b.x + dx + 0.8, 2.8, zf + 0.02 * nz], [b.x + dx + 0.8, 3.8, zf + 0.02 * nz], [b.x + dx - 0.8, 3.8, zf + 0.02 * nz], [0, 0, nz], '#5b3f33'); }
      G.quad([b.x - 0.7, 2.1, z1 - 0.46], [b.x + 0.7, 2.1, z1 - 0.46], [b.x + 0.7, 4.0, z1 - 0.46], [b.x - 0.7, 4.0, z1 - 0.46], [0, 0, 1], '#8a5a3c');
      G.gable(x0, z0, x1, z1, 4.4, 2.8, '#8a6a4a', true, b.color);
      // stairs down to the yard
      G.quad([b.x - 0.8, 0.05, z1 + 1.8], [b.x + 0.8, 0.05, z1 + 1.8], [b.x + 0.8, 2.05, z1], [b.x - 0.8, 2.05, z1], [0, 0.67, 0.74], '#c98a52');
      return true;
    }
    case 'shophouse': {
      // shop front on the ground floor, a covered five-foot way with pillars, windows above
      const f = b.face, sg = f === 's' ? 1 : -1, zf = f === 's' ? z1 : z0, off = 0.08 * sg;
      G.quad([x0 + 0.5, 0.25, zf + off], [x1 - 0.5, 0.25, zf + off], [x1 - 0.5, 2.7, zf + off], [x0 + 0.5, 2.7, zf + off], [0, 0, sg], WIN);
      G.quad([b.x - 0.8, 0.06, zf + off * 1.5], [b.x + 0.8, 0.06, zf + off * 1.5], [b.x + 0.8, 2.4, zf + off * 1.5], [b.x - 0.8, 2.4, zf + off * 1.5], [0, 0, sg], '#8a5a3c');
      const za = zf + sg * 2.2;
      G.box(x0, 2.95, Math.min(zf, za), x1, 3.3, Math.max(zf, za), b.awning || '#ff7e7e');
      for (const px of [x0 + 0.2, x1 - 0.2]) G.box(px - 0.15, 0, za - 0.15, px + 0.15, 2.95, za + 0.15, tint(b.color, -0.1));
      const floors = Math.max(1, Math.floor((b.h - 3.4) / 3));
      windowsOnFace(G, b, 'n', 3.5, floors, b.h); windowsOnFace(G, b, 's', 3.5, floors, b.h);
      return false;
    }
    case 'terrace': {
      const f = b.face, sg = f === 's' ? 1 : -1, zf = f === 's' ? z1 : z0, off = 0.08 * sg;
      G.quad([b.x - 0.6, 0.06, zf + off], [b.x + 0.6, 0.06, zf + off], [b.x + 0.6, 2.2, zf + off], [b.x - 0.6, 2.2, zf + off], [0, 0, sg], '#8a5a3c');
      for (const dx of [-b.w * 0.3, b.w * 0.3]) G.quad([b.x + dx - 0.7, 0.9, zf + off], [b.x + dx + 0.7, 0.9, zf + off], [b.x + dx + 0.7, 2.0, zf + off], [b.x + dx - 0.7, 2.0, zf + off], [0, 0, sg], WIN);
      for (const dx of [-b.w * 0.25, b.w * 0.25]) G.quad([b.x + dx - 0.7, 3.6, zf + off], [b.x + dx + 0.7, 3.6, zf + off], [b.x + dx + 0.7, 4.7, zf + off], [b.x + dx - 0.7, 4.7, zf + off], [0, 0, sg], WIN);
      const zp = zf + sg * 1.6;
      G.box(b.x - 1.6, 2.5, Math.min(zf, zp), b.x + 1.6, 2.7, Math.max(zf, zp), b.roofColor || '#ff7e7e');
      return false;
    }
    case 'mall': {
      const fronts = b.fronts || ['#ff7eb6'], n = fronts.length, uw = b.w / n;
      fronts.forEach((col, k) => {
        const ax0 = x0 + uw * k + 1, ax1 = x0 + uw * (k + 1) - 1, zf = z1 + 0.08;
        G.quad([ax0, 0.3, zf], [ax1, 0.3, zf], [ax1, 3.6, zf], [ax0, 3.6, zf], [0, 0, 1], WIN);
        G.quad([(ax0 + ax1) / 2 - 1.2, 0.06, zf + 0.02], [(ax0 + ax1) / 2 + 1.2, 0.06, zf + 0.02], [(ax0 + ax1) / 2 + 1.2, 2.8, zf + 0.02], [(ax0 + ax1) / 2 - 1.2, 2.8, zf + 0.02], [0, 0, 1], tint(col, -0.2));
        G.box(ax0 - 0.5, 3.9, z1, ax1 + 0.5, 4.3, z1 + 2.2, col);
      });
      windowsOnFace(G, b, 's', 5.2, 2, b.h); windowsOnFace(G, b, 'n', 1.2, 3, b.h);
      return false;
    }
    case 'aquarium': {
      const zf = z1 + 0.08;
      G.quad([x0 + 2, 0.8, zf], [x1 - 2, 0.8, zf], [x1 - 2, b.h - 1.6, zf], [x0 + 2, b.h - 1.6, zf], [0, 0, 1], '#4fb8e8');
      const fish = ['#ffd23f', '#ff9a3c', '#ff6b6b', '#ffffff', '#ff8fc0', '#5cc46a'];
      for (let k = 0; k < 14; k++) {
        const fx = x0 + 4 + ((k * 7.3) % (b.w - 8)), fy = 1.6 + ((k * 2.9) % (b.h - 4)), c = fish[k % fish.length], s = 0.5 + (k % 3) * 0.25;
        G.tri([fx - s, fy, zf + 0.03], [fx + s * 0.6, fy + s * 0.55, zf + 0.03], [fx + s * 0.6, fy - s * 0.55, zf + 0.03], [0, 0, 1], c);
        G.tri([fx + s * 0.5, fy, zf + 0.03], [fx + s * 1.2, fy + s * 0.45, zf + 0.03], [fx + s * 1.2, fy - s * 0.45, zf + 0.03], [0, 0, 1], c);
      }
      G.quad([b.x - 1.5, 0.06, zf + 0.04], [b.x + 1.5, 0.06, zf + 0.04], [b.x + 1.5, 2.8, zf + 0.04], [b.x - 1.5, 2.8, zf + 0.04], [0, 0, 1], '#2f6fa8');
      return false;
    }
    case 'cinema': {
      G.box(b.x - 9, 3.6, z1, b.x + 9, 5.4, z1 + 2.0, '#ffd23f');
      for (let k = 0; k < 10; k++) G.ball(b.x - 8.4 + k * 1.86, 5.6, z1 + 2.0, 0.18, '#fff7b0');
      G.quad([b.x - 3, 0.06, z1 + 0.08], [b.x + 3, 0.06, z1 + 0.08], [b.x + 3, 3.2, z1 + 0.08], [b.x - 3, 3.2, z1 + 0.08], [0, 0, 1], '#ff6fa8');
      for (const dx of [-14, 14]) G.quad([b.x + dx - 3, 1.0, z1 + 0.08], [b.x + dx + 3, 1.0, z1 + 0.08], [b.x + dx + 3, 5.0, z1 + 0.08], [b.x + dx - 3, 5.0, z1 + 0.08], [0, 0, 1], ['#ffd23f', '#7fcbff'][dx > 0 ? 1 : 0]);
      return false;
    }
    case 'bank': {
      for (let k = 0; k < 6; k++) G.cyl(x0 + 4 + k * ((b.w - 8) / 5), 0, z1 + 1.4, 0.55, b.h - 0.4, '#ffffff', 10);
      G.box(x0 + 2, b.h - 0.6, z1, x1 - 2, b.h, z1 + 2.4, '#fff3dc');
      G.quad([b.x - 1.4, 0.06, z1 + 0.08], [b.x + 1.4, 0.06, z1 + 0.08], [b.x + 1.4, 3.0, z1 + 0.08], [b.x - 1.4, 3.0, z1 + 0.08], [0, 0, 1], '#8a5a3c');
      windowsOnFace(G, b, 's', 3.2, 2, b.h);
      return false;
    }
    default: return false;
  }
}
/** The four minarets of the grand mosque, at the corners of the hall. */
export function minarets(G, b) {
  const x0 = b.x - b.w / 2, x1 = b.x + b.w / 2, z0 = b.z - b.d / 2, z1 = b.z + b.d / 2;
  for (const [mx, mz] of [[x0 + 2.2, z0 + 2.2], [x1 - 2.2, z0 + 2.2], [x0 + 2.2, z1 - 2.2], [x1 - 2.2, z1 - 2.2]]) {
    G.cyl(mx, 0, mz, 1.5, b.h + 8, '#f4fbf8', 10); G.cyl(mx, b.h + 8, mz, 1.9, 0.6, tint(b.color, -0.06), 10);
    G.dome(mx, b.h + 8.6, mz, 1.5, b.roofColor || '#3aa98f', 10, 4); G.cyl(mx, b.h + 10.1, mz, 0.08, 1.2, '#ffd23f', 6, 0.03);
  }
}
/** Where the shop sign of a shophouse goes: over the five-foot way for south-facing shops, on the back roof edge otherwise. */
export function shopSign(signs, b, atlas) {
  const w = Math.min(b.w - 1.2, 4.6), h = w * (96 / 256);
  if (b.face === 's') signs.south(b.x, 3.35 + h / 2 + 0.05, b.z + b.d / 2 + 2.25, w, h, atlas.uv(b.signId));
  else signs.south(b.x, b.h + h / 2 + 0.1, b.z + b.d / 2 + 0.06, w, h, atlas.uv(b.signId));
}

// ------------------------------------------------------------------------------------------------ traffic lights
/** The pole and the dark lamp housings; the lit lamps are separate (see createLightLamps). */
export function trafficLightPole(G, x, z) {
  G.cyl(x, 0, z, 0.12, 3.4, '#4a4350', 6);
  G.cbox(x, 3.4, z, 0.62, 1.7, 0.62, '#3d3436');
  for (const y of [4.75, 4.25, 3.75]) {
    G.cbox(x, y - 0.17, z + 0.31, 0.34, 0.34, 0.04, '#5a5260'); G.cbox(x, y - 0.17, z - 0.31, 0.34, 0.34, 0.04, '#5a5260');
    G.cbox(x + 0.31, y - 0.17, z, 0.04, 0.34, 0.34, '#5a5260'); G.cbox(x - 0.31, y - 0.17, z, 0.04, 0.34, 0.34, '#5a5260');
  }
}
const LAMP_Y = { red: 4.75, yellow: 4.25, green: 3.75 };
const LAMP_COL = { red: new Color('#ff3b3b'), yellow: new Color('#ffd23f'), green: new Color('#3bdc5a') };
const lampGeo = new SphereGeometry(0.17, 10, 8), lampMat = new MeshBasicMaterial({ color: '#ffffff' });
/**
 * Lit lamps for the traffic lights of one chunk: on each light, the faces looking along the east-west road show the
 * east-west colour and the others the north-south colour. lights: [{ x, z, nx, nz }] (nx, nz = the crossing).
 */
export function createLightLamps(lights) {
  const mesh = new InstancedMesh(lampGeo, lampMat, Math.max(1, lights.length * 4));
  mesh.count = lights.length * 4; mesh.frustumCulled = false;
  const d = new Object3D();
  const faces = [[0.36, 0, 'ew'], [-0.36, 0, 'ew'], [0, 0.36, 'ns'], [0, -0.36, 'ns']];
  function update(t) {
    lights.forEach((l, i) => {
      const ph = lightPhase(l.nx, l.nz, t);
      faces.forEach(([dx, dz, dir], f) => {
        const c = ph[dir];
        d.position.set(l.x + dx, LAMP_Y[c], l.z + dz); d.updateMatrix(); mesh.setMatrixAt(i * 4 + f, d.matrix); mesh.setColorAt(i * 4 + f, LAMP_COL[c]);
      });
    });
    mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }
  update(0);
  return { mesh, update };
}

// ------------------------------------------------------------------------------------------------ coins
const coinGeo = new CylinderGeometry(0.42, 0.42, 0.1, 18); coinGeo.rotateX(Math.PI / 2);
const coinMat = toon('#ffd23f', { emissive: '#ffb400', emissiveIntensity: 0.35 });
/** Spinning gold coins of one chunk. coins: [{ id, x, z }]; taken: a Map of picked-up coin ids. */
export function createCoins(coins, taken) {
  const mesh = new InstancedMesh(coinGeo, coinMat, Math.max(1, coins.length));
  mesh.count = coins.length; mesh.castShadow = true; mesh.frustumCulled = false;
  const d = new Object3D();
  function update(t, reduced) {
    coins.forEach((c, k) => {
      const gone = taken.has(c.id);
      d.position.set(c.x, gone ? -20 : 0.9 + (reduced ? 0 : Math.sin(t * 2 + k) * 0.1), c.z);
      d.rotation.set(0, reduced ? 0 : t * 2.2 + k, 0); d.scale.setScalar(gone ? 0.001 : 1); d.updateMatrix(); mesh.setMatrixAt(k, d.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }
  update(0, true);
  return { mesh, coins, update };
}

// ------------------------------------------------------------------------------------------------ grounds
export function jogTrack(G, tr) {
  const N = 72, ring = (rx, rz, w, y, col) => {
    for (let k = 0; k < N; k++) {
      const a0 = (k / N) * Math.PI * 2, a1 = ((k + 1) / N) * Math.PI * 2;
      const p = (a, rr) => [tr.x + Math.cos(a) * (rx + rr), y, tr.z + Math.sin(a) * (rz + rr)];
      G.quad(p(a0, 0), p(a1, 0), p(a1, w), p(a0, w), [0, 1, 0], col);
    }
  };
  ring(tr.rx, tr.rz, 4, 0.052, '#e8735a');
  ring(tr.rx + 1.9, tr.rz + 1.9, 0.15, 0.056, '#ffffff');
}
export function runway(G, r) {
  G.flat(r.x0, r.z - 6, r.x1, r.z + 6, 0.05, '#6b6f7a');
  for (let x = r.x0 + 4; x + 5 < r.x1 - 4; x += 10) G.flat(x, r.z - 0.2, x + 5, r.z + 0.2, 0.056, '#ffffff');
  for (const sz of [-1, 1]) G.flat(r.x0, r.z + sz * 5.6 - 0.15, r.x1, r.z + sz * 5.6 + 0.15, 0.056, '#ffd23f');
}
export function jetty(G, x, zBeach, zSea) {
  G.box(x - 1.6, 0.9, zBeach, x + 1.6, 1.15, zSea, '#c98a52');
  for (let z = zBeach + 2; z < zSea; z += 6) for (const sx of [-1.5, 1.5]) G.cbox(x + sx, -1.5, z, 0.35, 2.5, 0.35, '#8a5a3c');
  G.box(x - 1.7, 1.15, zBeach, x - 1.55, 2.0, zSea, '#b07a52'); G.box(x + 1.55, 1.15, zBeach, x + 1.7, 2.0, zSea, '#b07a52');
}
/** A small boat (bobbing, used at the jetty and out at sea). */
export function boat(color = '#ff6b6b') {
  return group(box(2.4, 1.0, 6, color, { y: 0.5, r: 0.4 }), box(2.0, 0.2, 5.4, '#fff3dc', { y: 1.05, r: 0.1 }), box(1.4, 1.2, 1.6, '#ffffff', { y: 1.7, z: -0.8, r: 0.2 }),
    cyl(0.06, 0.06, 3.2, '#8a5a3c', { y: 2.6, z: 1.2, seg: 6 }), cone(1.0, 2.2, '#ffd23f', { y: 2.9, z: 1.7, rx: Math.PI / 2, seg: 3 }));
}

// ------------------------------------------------------------------------------------------------ joggers
/** People jogging round the track of the jogging park (they wave their arms and swing their legs). */
export function createJoggers(tr) {
  const g = new Group();
  const looks = [['#ff6b6b', '#2f4a86'], ['#4a90e2', '#3d3436'], ['#5cc46a', '#7a5aa8'], ['#ffd23f', '#2f4a86'], ['#ff8fc0', '#4a4350']];
  const people = looks.map(([shirt, legs], k) => {
    const legL = live(group(box(0.18, 0.75, 0.18, legs, { y: -0.38, outline: 0 }))), legR = live(group(box(0.18, 0.75, 0.18, legs, { y: -0.38, outline: 0 })));
    legL.position.set(-0.13, 0.8, 0); legR.position.set(0.13, 0.8, 0);
    const p = live(group(capsule(0.24, 0.5, shirt, { y: 1.2, outline: 0.015 }), ball(0.23, '#f6cfb0', { y: 1.78, seg: 12 }), ball(0.24, k % 2 ? '#3a2418' : '#2f4a86', { y: 1.86, sy: 0.75, seg: 12, outline: 0 }), legL, legR));
    g.add(p); return { p, legL, legR, speed: 2.2 + k * 0.35, phase: k * 1.25 };
  });
  return {
    obj: g,
    update(t, reduced) {
      for (const j of people) {
        const s = reduced ? j.phase : (t * j.speed) / (tr.rx + 2) + j.phase;
        const x = tr.x + Math.cos(s) * (tr.rx + 2 - 0.0), z = tr.z + Math.sin(s) * (tr.rz + 2);
        j.p.position.set(x, 0, z); j.p.rotation.y = Math.atan2(-Math.sin(s) * (tr.rx + 2), Math.cos(s) * (tr.rz + 2));
        const sw = reduced ? 0 : Math.sin(t * 9 + j.phase) * 0.7; j.legL.rotation.x = sw; j.legR.rotation.x = -sw;
      }
    }
  };
}

// ------------------------------------------------------------------------------------------------ roller coaster
/**
 * The roller coaster: rails on supports and a three-car train. The train waits at the station, is pulled up the lift
 * hill, rolls down by gravity and brakes back into the station. A child can ride one lap.
 * origin: { x, z } (the middle of the ride). Returns { obj, update, ride api }.
 */
export function createCoaster(G, origin) {
  const pts = coasterTrack().map((p) => ({ x: p.x + origin.x, y: p.y, z: p.z + origin.z }));
  const n = pts.length;
  let total = 0;
  pts.forEach((p, k) => { const q = pts[(k + 1) % n]; p.s = total; total += Math.hypot(q.x - p.x, q.y - p.y, q.z - p.z); });
  const at = (s) => {
    s = ((s % total) + total) % total;
    let k = 0; while (k < n - 1 && pts[k + 1].s <= s) k++;
    const a = pts[k], b = pts[(k + 1) % n], len = (k + 1 < n ? b.s : total) - a.s, u = (s - a.s) / (len || 1);
    return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, z: a.z + (b.z - a.z) * u, yaw: Math.atan2(b.x - a.x, b.z - a.z), pitch: Math.atan2(b.y - a.y, Math.hypot(b.x - a.x, b.z - a.z)) };
  };
  // rails, sleepers and supports go into the chunk's merged geometry
  for (let k = 0; k < n; k++) {
    const a = pts[k], b = pts[(k + 1) % n];
    const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, px = -dz / l, pz = dx / l;
    for (const sd of [-0.75, 0.75]) {
      const A = [a.x + px * sd, a.y, a.z + pz * sd], B = [b.x + px * sd, b.y, b.z + pz * sd];
      G.quad([A[0] - px * 0.09, A[1] + 0.12, A[2] - pz * 0.09], [B[0] - px * 0.09, B[1] + 0.12, B[2] - pz * 0.09], [B[0] + px * 0.09, B[1] + 0.12, B[2] + pz * 0.09], [A[0] + px * 0.09, A[1] + 0.12, A[2] + pz * 0.09], [0, 1, 0], '#ff6fa8');
      G.quad([A[0], A[1] - 0.1, A[2]], [B[0], B[1] - 0.1, B[2]], [B[0], B[1] + 0.12, B[2]], [A[0], A[1] + 0.12, A[2]], [px * Math.sign(sd), 0, pz * Math.sign(sd)], '#e85a92');
    }
    if (k % 2 === 0) G.quad([a.x - px * 0.9, a.y - 0.05, a.z - pz * 0.9], [a.x + px * 0.9, a.y - 0.05, a.z + pz * 0.9], [a.x + px * 0.9 + dx / l * 0.25, a.y - 0.05, a.z + pz * 0.9 + dz / l * 0.25], [a.x - px * 0.9 + dx / l * 0.25, a.y - 0.05, a.z - pz * 0.9 + dz / l * 0.25], [0, 1, 0], '#8d879c');
    if (k % 10 === 5) G.cyl(a.x, 0, a.z, 0.3, a.y - 0.1, '#d7dde6', 8);
  }
  // the station: a platform and a pink roof
  const st = at(pts[Math.round(n / 2)].s);
  G.box(st.x - 6, 0, st.z + 3.2, st.x + 6, 1.4, st.z + 6.8, '#ffe3ef');
  G.box(st.x - 6, 4.6, st.z - 2.4, st.x + 6, 5.0, st.z + 6.8, '#ff6fa8');
  for (const [dx, dz] of [[-5.6, 6.4], [5.6, 6.4], [-5.6, -2.0], [5.6, -2.0]]) G.cyl(st.x + dx, 0, st.z + dz, 0.15, 4.6, '#ffffff', 6);
  // the train
  const train = new Group();
  const cars = ['#ff6fa8', '#ffd23f', '#7fcbff'].map((col) => {
    const c = live(group(box(1.7, 0.7, 2.1, col, { y: 0.55, r: 0.25 }), box(1.5, 0.5, 0.25, tint(col, -0.15), { y: 1.05, z: -0.85, r: 0.1 }), box(1.3, 0.12, 1.2, '#ffffff', { y: 0.95, r: 0.05, outline: 0 }),
      box(1.6, 0.12, 0.12, '#ffd23f', { y: 1.15, z: 0.55, outline: 0 })));
    train.add(c); return c;
  });
  const stationS = pts[Math.round(n / 2)].s, peak = pts.reduce((m, p) => (p.y > m.y ? p : m), pts[0]);
  // run = metres travelled since the train left the station (it is back after one lap)
  const ctl = { s: stationS, speed: 0, dwell: 4, run: 0, riding: false, lapStarted: false, lapDone: false };
  const gap = (a, b) => (((b - a) % total) + total) % total;
  function place() {
    cars.forEach((c, k) => { const p = at(ctl.s - k * 2.4); c.position.set(p.x, p.y, p.z); c.rotation.set(0, 0, 0); c.rotation.y = p.yaw; c.rotateX(-p.pitch); });
  }
  function step(dt) {
    if (ctl.dwell > 0) { ctl.dwell -= dt; ctl.speed = 0; if (ctl.dwell <= 0) { ctl.run = 0; ctl.lapStarted = ctl.riding; } return; }
    const p = at(ctl.s), left = total - ctl.run;
    const lifting = ctl.run < gap(stationS, peak.s);
    let target;
    if (lifting) target = 3.2;                                                    // the chain pulls the train up
    else target = Math.min(15, Math.sqrt(3.2 * 3.2 + 2 * 9.81 * Math.max(0, peak.y - p.y)) * 0.78);
    if (left < 25) target = Math.min(target, Math.max(1.2, left * 0.35));        // brakes before the station
    ctl.speed += (target - ctl.speed) * Math.min(1, dt * 2.5);
    const ds = Math.min(ctl.speed * dt, left);
    ctl.s = (ctl.s + ds) % total; ctl.run += ds;
    if (left - ds < 0.02) {                                                       // back in the station
      ctl.s = stationS; ctl.speed = 0; ctl.dwell = 5; ctl.run = 0;
      if (ctl.riding && ctl.lapStarted) ctl.lapDone = true;
      ctl.lapStarted = false;
    }
  }
  place();
  return {
    obj: train,
    stationPoint: { x: st.x, z: st.z + 4.4 },
    update(dt, reduced) { if (!reduced || ctl.riding) step(Math.min(dt, 0.05)); place(); },
    /** where the middle car is (the child sits in it) */
    seat() { const p = at(ctl.s - 2.4); return { x: p.x, y: p.y + 0.6, z: p.z, yaw: p.yaw }; },
    get atStation() { return ctl.dwell > 0; },
    get speed() { return ctl.speed; },
    board() { ctl.riding = true; ctl.lapDone = false; ctl.lapStarted = false; if (ctl.dwell > 0) ctl.dwell = Math.min(ctl.dwell, 1.5); },
    get lapDone() { return ctl.lapDone; },
    leave() { ctl.riding = false; ctl.lapDone = false; }
  };
}
void Vector3;
