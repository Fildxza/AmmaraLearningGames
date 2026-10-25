// Models for the town: a unicorn to ride, the child's car, buses, traffic cars, zoo and farm animals,
// and the school children who walk around. Same toy-like style as the preschool (toon colours, soft outlines).
import { Group, BufferGeometry, Float32BufferAttribute, Color } from 'three';
import { box, ball, cyl, cone, torus, capsule, star3d, heart3d, group, at, live } from '../world/kit.js';
import { tint } from '../world/paint.js';
import { Geo } from './geo.js';

// ------------------------------------------------------------------------------------------------ unicorn
export function unicorn(coat = '#ffffff', mane = ['#ff8fc0', '#b79cff', '#7fcbff', '#ffd23f']) {
  const g = new Group();
  const body = new Group(); g.add(body);
  body.add(ball(0.62, coat, { y: 1.2, sx: 1.55, sy: 0.95, sz: 1.0, seg: 18, outline: 0.03 }));                       // barrel (long along z)
  body.children[0].rotation.y = Math.PI / 2;
  const neck = live(group(capsule(0.24, 0.55, coat, { y: 0.3, rx: -0.5, outline: 0.025 })));
  neck.position.set(0, 1.55, 0.75); body.add(neck);
  const head = live(group(ball(0.36, coat, { sz: 1.25, seg: 16, outline: 0.025 }), ball(0.22, tint(coat, -0.06), { y: -0.08, z: 0.34, seg: 12, outline: 0.02 }),
    cone(0.08, 0.6, '#ffd23f', { y: 0.44, z: 0.12, rx: 0.35, seg: 10, outline: 0.015, matOpts: { emissive: '#ffe680', emissiveIntensity: 0.35 } }),
    ball(0.06, '#2e1f1a', { x: -0.2, y: 0.08, z: 0.22, seg: 8, outline: 0 }), ball(0.06, '#2e1f1a', { x: 0.2, y: 0.08, z: 0.22, seg: 8, outline: 0 }),
    ball(0.07, '#ffb3c7', { x: -0.24, y: -0.06, z: 0.24, seg: 8, outline: 0 }), ball(0.07, '#ffb3c7', { x: 0.24, y: -0.06, z: 0.24, seg: 8, outline: 0 }),
    cone(0.09, 0.2, coat, { x: -0.16, y: 0.36, z: -0.08, seg: 6, outline: 0.012 }), cone(0.09, 0.2, coat, { x: 0.16, y: 0.36, z: -0.08, seg: 6, outline: 0.012 })));
  head.position.set(0, 2.05, 1.05); body.add(head);
  mane.forEach((c, k) => body.add(ball(0.17, c, { x: 0, y: 2.2 - k * 0.2, z: 0.82 - k * 0.12, seg: 10, outline: 0.012 })));
  const tail = live(group(...mane.map((c, k) => ball(0.16 - k * 0.02, c, { y: -k * 0.17, z: -k * 0.05, seg: 8, outline: 0.012 }))));
  tail.position.set(0, 1.35, -0.98); body.add(tail);
  // saddle
  body.add(box(0.7, 0.12, 0.7, '#ff7eb6', { y: 1.82, r: 0.05, outline: 0.015 }), star3d(0.12, 0.05, '#ffd23f', { x: 0.36, y: 1.6, z: 0, ry: Math.PI / 2, outline: 0.01 }));
  const legs = [[-0.32, 0.52], [0.32, 0.52], [-0.32, -0.52], [0.32, -0.52]].map(([x, z]) => {
    const l = live(group(cyl(0.12, 0.1, 0.9, coat, { y: -0.45, seg: 10, outline: 0.02 }), cyl(0.13, 0.13, 0.12, '#ffd23f', { y: -0.92, seg: 10, outline: 0.012 })));
    l.position.set(x, 1.0, z); body.add(l); return l;
  });
  g.userData = { body, legs, head, tail, neck, seatY: 1.86, speed: 7.5, radius: 0.85, kind: 'unicorn' };
  return g;
}
export function animateUnicorn(g, t, speed, reduced) {
  const u = g.userData, k = Math.min(1, speed / 6);
  const f = t * (6 + 6 * k);
  u.legs.forEach((l, i) => { l.rotation.x = reduced ? 0 : Math.sin(f + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * 0.55 * k; });
  u.body.position.y = reduced ? 0 : Math.abs(Math.sin(f)) * 0.12 * k + Math.sin(t * 1.6) * 0.02;
  u.head.rotation.x = reduced ? 0 : Math.sin(f) * 0.08 * k + Math.sin(t * 0.9) * 0.05;
  u.tail.rotation.x = reduced ? 0 : -0.4 + Math.sin(t * 3 + f * 0.3) * 0.25;
}

// ------------------------------------------------------------------------------------------------ cars and buses
const wheel = (x, z, r = 0.36) => group(cyl(r, r, 0.28, '#3d3436', { x, y: r, z, rz: Math.PI / 2, seg: 14, outline: 0.015 }), cyl(r * 0.45, r * 0.45, 0.3, '#e9e4ef', { x, y: r, z, rz: Math.PI / 2, seg: 10, outline: 0 }));
/** The child's open-top toy car (seat in the middle). */
export function kidCar(color = '#ff6b6b') {
  const g = new Group();
  g.add(box(1.9, 0.62, 3.4, color, { y: 0.72, r: 0.28, outline: 0.03 }), box(1.7, 0.2, 1.2, tint(color, -0.08), { y: 1.1, z: 1.0, r: 0.08, outline: 0.02 }));
  g.add(box(1.6, 0.6, 0.12, '#bfe7ff', { y: 1.35, z: 0.45, rx: -0.35, r: 0.04, outline: 0.015, matOpts: { transparent: true, opacity: 0.7 } }));
  g.add(box(0.95, 0.6, 0.9, '#fff6e6', { y: 0.95, z: -0.45, r: 0.12, outline: 0.015 }));                                  // seat
  g.add(torus(0.22, 0.05, '#4a4350', { y: 1.28, z: 0.2, rx: -1.0, outline: 0.01 }));                                        // steering wheel
  g.add(ball(0.13, '#fff7b0', { x: -0.6, y: 0.85, z: 1.72, seg: 10, outline: 0.012, matOpts: { emissive: '#fff3a0', emissiveIntensity: 0.4 } }), ball(0.13, '#fff7b0', { x: 0.6, y: 0.85, z: 1.72, seg: 10, outline: 0.012, matOpts: { emissive: '#fff3a0', emissiveIntensity: 0.4 } }));
  g.add(heart3d(0.18, 0.06, '#ffffff', { y: 0.95, z: -1.72, ry: Math.PI, outline: 0.01 }));
  const wheels = [[-0.95, 1.1], [0.95, 1.1], [-0.95, -1.1], [0.95, -1.1]].map(([x, z]) => { const w = live(wheel(0, 0)); w.position.set(x, 0, z); g.add(w); return w; });
  g.userData = { wheels, seatY: 0.62, seatZ: -0.45, speed: 13, radius: 1.35, kind: 'car', body: color };
  return g;
}
export function bus(color = '#ffb43c', stripe = '#ffffff') {
  const g = new Group();
  g.add(box(2.6, 2.4, 9.6, color, { y: 1.65, r: 0.35, outline: 0.03 }));
  g.add(box(2.64, 0.3, 9.64, stripe, { y: 1.0, r: 0.1, outline: 0 }));
  for (let k = 0; k < 5; k++) for (const sx of [-1, 1]) g.add(box(0.06, 0.8, 1.3, '#bfe7ff', { x: sx * 1.31, y: 2.15, z: -3.4 + k * 1.6, r: 0.08, outline: 0.01 }));
  g.add(box(2.2, 1.0, 0.06, '#bfe7ff', { y: 2.1, z: 4.81, r: 0.1, outline: 0.012 }), box(1.4, 0.36, 0.08, '#4a4350', { y: 2.95, z: 4.8, r: 0.06, outline: 0 }));
  g.add(box(0.06, 1.5, 1.0, '#e9e4ef', { x: -1.31, y: 1.5, z: 3.6, r: 0.06, outline: 0.012 }));                           // door (left side: we keep left)
  const wheels = [[-1.25, 3.2], [1.25, 3.2], [-1.25, -3.2], [1.25, -3.2]].map(([x, z]) => { const w = live(wheel(0, 0, 0.55)); w.position.set(x, 0, z); g.add(w); return w; });
  g.userData = { wheels, seatY: 1.15, seatZ: 0, kind: 'bus' };
  return g;
}
export function spinWheels(g, dist) { for (const w of g.userData.wheels || []) w.rotation.x = dist / 0.4; }

/**
 * One car of the elevated train as a single vertex-coloured geometry (one draw call + outline). Forward is +z.
 * `nose` = 1: driver's nose at the front, -1: at the back, 0: a middle car (gangway at both ends).
 */
export const TRAIN_CAR = { half: 5.6, spacing: 12 };
export function trainCarGeometry(main = '#ffffff', stripe = '#ff8fc0', nose = 0) {
  const G = new Geo(), hl = TRAIN_CAR.half;
  const b = (x0, y0, z0, x1, y1, z1, c) => G.box(Math.min(x0, x1), y0, Math.min(z0, z1), Math.max(x0, x1), y1, Math.max(z0, z1), c);
  b(-1.15, 0, -hl + 1.2, 1.15, 0.55, -hl + 3.2, '#4a4350'); b(-1.15, 0, hl - 3.2, 1.15, 0.55, hl - 1.2, '#4a4350');      // bogies
  b(-1.45, 0.55, -hl, 1.45, 0.95, hl, '#d9d4e6');                                                                          // under-frame
  b(-1.5, 0.95, -hl, 1.5, 3.35, hl, main);                                                                                 // body
  b(-1.53, 1.25, -hl - 0.02, 1.53, 1.6, hl + 0.02, stripe);                                                                // stripe
  b(-1.32, 3.35, -hl + 0.3, 1.32, 3.65, hl - 0.3, '#efeaf6'); b(-0.6, 3.65, -1.4, 0.6, 3.95, 1.4, '#d9d4e6');            // roof, air conditioner
  for (const sx of [-1, 1]) {
    for (let k = 0; k < 4; k++) { const zc = -4.0 + k * 2.3; b(sx * 1.5, 2.0, zc - 0.8, sx * 1.54, 2.95, zc + 0.8, '#bfe7ff'); }
    b(sx * 1.5, 1.0, 4.0, sx * 1.55, 3.05, 5.0, '#e9e4ef'); b(sx * 1.55, 2.1, 4.15, sx * 1.57, 2.9, 4.85, '#bfe7ff');       // door with a window
  }
  for (const f of [1, -1]) {
    if (f === nose) {
      b(-1.45, 0.55, f * hl, 1.45, 2.1, f * (hl + 1.0), main);
      b(-1.47, 1.25, f * hl, 1.47, 1.6, f * (hl + 1.02), stripe);
      G.quad([-1.45, 2.1, f * (hl + 1.0)], [1.45, 2.1, f * (hl + 1.0)], [1.4, 3.35, f * hl], [-1.4, 3.35, f * hl], [0, 0.62, f * 0.78], '#2f3a5a');   // windscreen
      for (const sx of [-1, 1]) G.tri([sx * 1.45, 2.1, f * (hl + 1.0)], [sx * 1.42, 3.35, f * hl], [sx * 1.45, 2.1, f * hl], [sx, 0, 0], main);
      for (const sx of [-1, 1]) b(sx * 0.7, 1.75, f * (hl + 1.0), sx * 1.1, 1.98, f * (hl + 1.05), '#fff7b0');               // lights
    } else b(-0.9, 1.0, f * hl, 0.9, 3.2, f * (hl + 0.42), '#6b6478');                                                     // gangway
  }
  return G.geometry();
}

/** Traffic car as two plain geometries (white body to be tinted per car, and the dark/glass details). */
export function trafficCarGeometries() {
  const col = new Color();
  const mk = () => ({ p: [], n: [], c: [] });
  const body = mk(), det = mk();
  const quad = (G, pts, nrm, hex) => {
    const [a, b, c2] = pts;
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c2[0] - a[0], vy = c2[1] - a[1], vz = c2[2] - a[2];
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    const order = cx * nrm[0] + cy * nrm[1] + cz * nrm[2] >= 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2];
    col.set(hex);
    for (const k of order) { G.p.push(...pts[k]); G.n.push(...nrm); G.c.push(col.r, col.g, col.b); }
  };
  const cube = (G, x0, y0, z0, x1, y1, z1, hex) => {
    quad(G, [[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]], [0, 1, 0], hex);
    quad(G, [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], [1, 0, 0], hex);
    quad(G, [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], hex);
    quad(G, [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], hex);
    quad(G, [[x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]], [0, 0, -1], hex);
  };
  cube(body, -0.95, 0.35, -2.0, 0.95, 1.05, 2.0, '#ffffff');
  cube(body, -0.82, 1.05, -1.1, 0.82, 1.7, 0.9, '#ffffff');
  cube(det, -0.84, 1.15, -1.05, 0.84, 1.6, 0.92, '#a8dcff');                  // windows (slightly larger than the cabin)
  for (const [x, z] of [[-0.98, 1.3], [0.98, 1.3], [-0.98, -1.3], [0.98, -1.3]]) cube(det, x - 0.14, 0, z - 0.38, x + 0.14, 0.72, z + 0.38, '#3d3436');
  cube(det, -0.8, 0.6, 2.0, -0.45, 0.85, 2.04, '#fff7b0'); cube(det, 0.45, 0.6, 2.0, 0.8, 0.85, 2.04, '#fff7b0');
  cube(det, -0.8, 0.6, -2.04, -0.45, 0.85, -2.0, '#ff6b6b'); cube(det, 0.45, 0.6, -2.04, 0.8, 0.85, -2.0, '#ff6b6b');
  const toGeo = (G) => { const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(G.p, 3)); g.setAttribute('normal', new Float32BufferAttribute(G.n, 3)); g.setAttribute('color', new Float32BufferAttribute(G.c, 3)); g.computeBoundingSphere(); return g; };
  return { body: toGeo(body), details: toGeo(det) };
}

// ------------------------------------------------------------------------------------------------ animals (zoo, farm)
export function animal(kind) {
  const g = new Group();
  const eyes = (y, z, sep = 0.16, r = 0.05) => [ball(r, '#2e1f1a', { x: -sep, y, z, seg: 8, outline: 0 }), ball(r, '#2e1f1a', { x: sep, y, z, seg: 8, outline: 0 })];
  const legs4 = (c, h, sx, sz, r = 0.14) => [[-sx, sz], [sx, sz], [-sx, -sz], [sx, -sz]].map(([x, z]) => cyl(r, r, h, c, { x, y: h / 2, z, seg: 10, outline: 0.02 }));
  switch (kind) {
    case 'elephant': {
      const c = '#a9b4c9';
      g.add(ball(1.1, c, { y: 2.0, sz: 1.3, seg: 18, outline: 0.035 }), ...legs4(c, 1.3, 0.6, 0.7, 0.3));
      g.add(ball(0.75, c, { y: 2.5, z: 1.35, seg: 16, outline: 0.03 }), capsule(0.17, 0.9, c, { y: 1.7, z: 1.95, rx: 0.3, outline: 0.02 }));
      g.add(ball(0.55, tint(c, 0.06), { x: -0.75, y: 2.6, z: 1.15, sx: 0.35, seg: 12, outline: 0.02 }), ball(0.55, tint(c, 0.06), { x: 0.75, y: 2.6, z: 1.15, sx: 0.35, seg: 12, outline: 0.02 }), ...eyes(2.65, 1.95, 0.3, 0.07));
      break;
    }
    case 'giraffe': {
      const c = '#ffd06b';
      g.add(ball(0.75, c, { y: 2.0, sz: 1.35, seg: 16, outline: 0.03 }), ...legs4(c, 1.7, 0.4, 0.55, 0.13));
      g.add(cyl(0.2, 0.26, 2.2, c, { y: 3.4, z: 0.75, rx: 0.25, outline: 0.025 }), ball(0.36, c, { y: 4.55, z: 1.15, sz: 1.3, seg: 14, outline: 0.025 }));
      g.add(cyl(0.04, 0.04, 0.3, '#8a5a3c', { x: -0.12, y: 4.95, z: 1.0, outline: 0 }), cyl(0.04, 0.04, 0.3, '#8a5a3c', { x: 0.12, y: 4.95, z: 1.0, outline: 0 }), ...eyes(4.65, 1.5, 0.18, 0.05));
      for (let k = 0; k < 8; k++) g.add(ball(0.13, '#b97a3c', { x: Math.sin(k * 2.3) * 0.55, y: 2.0 + Math.cos(k * 1.7) * 0.4, z: -0.6 + k * 0.17, seg: 6, outline: 0 }));
      break;
    }
    case 'zebra': {
      g.add(ball(0.72, '#ffffff', { y: 1.5, sz: 1.35, seg: 16, outline: 0.03 }), ...legs4('#ffffff', 1.1, 0.35, 0.55, 0.12));
      for (let k = 0; k < 6; k++) g.add(box(1.5, 0.12, 0.08, '#2e2a33', { y: 1.5, z: -0.7 + k * 0.28, rx: 0.2, outline: 0 }));
      g.add(capsule(0.22, 0.6, '#ffffff', { y: 2.15, z: 0.85, rx: 0.55, outline: 0.02 }), ball(0.3, '#ffffff', { y: 2.45, z: 1.2, sz: 1.4, seg: 12, outline: 0.02 }), ball(0.16, '#2e2a33', { y: 2.35, z: 1.6, seg: 8, outline: 0 }), ...eyes(2.55, 1.35, 0.17, 0.05));
      break;
    }
    case 'lion': {
      const c = '#ffc24a';
      g.add(ball(0.68, c, { y: 1.2, sz: 1.3, seg: 16, outline: 0.03 }), ...legs4(c, 0.8, 0.35, 0.5, 0.14));
      g.add(ball(0.62, '#d9822b', { y: 1.75, z: 0.85, seg: 16, outline: 0.03 }), ball(0.42, c, { y: 1.75, z: 1.2, seg: 14, outline: 0.02 }), ball(0.12, '#8a4a2a', { y: 1.68, z: 1.6, seg: 8, outline: 0 }), ...eyes(1.88, 1.55, 0.15, 0.05));
      g.add(cyl(0.05, 0.05, 0.8, c, { y: 1.3, z: -1.0, rx: 0.9, outline: 0.01 }), ball(0.12, '#d9822b', { y: 1.6, z: -1.35, seg: 8, outline: 0.01 }));
      break;
    }
    case 'panda': {
      g.add(ball(0.75, '#ffffff', { y: 0.9, seg: 16, outline: 0.03 }), ball(0.5, '#ffffff', { y: 1.75, z: 0.2, seg: 14, outline: 0.025 }));
      [[-0.3, 0.35], [0.3, 0.35], [-0.3, -0.3], [0.3, -0.3]].forEach(([x, z]) => g.add(ball(0.26, '#2e2a33', { x, y: 0.3, z, seg: 10, outline: 0.015 })));
      g.add(ball(0.16, '#2e2a33', { x: -0.33, y: 2.15, z: 0.1, seg: 8, outline: 0.01 }), ball(0.16, '#2e2a33', { x: 0.33, y: 2.15, z: 0.1, seg: 8, outline: 0.01 }));
      g.add(ball(0.12, '#2e2a33', { x: -0.17, y: 1.82, z: 0.6, sy: 1.3, seg: 8, outline: 0 }), ball(0.12, '#2e2a33', { x: 0.17, y: 1.82, z: 0.6, sy: 1.3, seg: 8, outline: 0 }), ball(0.08, '#2e2a33', { y: 1.66, z: 0.68, seg: 8, outline: 0 }));
      break;
    }
    case 'cow': {
      g.add(ball(0.7, '#ffffff', { y: 1.25, sz: 1.35, seg: 16, outline: 0.03 }), ...legs4('#ffffff', 0.8, 0.35, 0.55, 0.13));
      [[0.4, 1.4, 0.2], [-0.35, 1.2, -0.4], [0.2, 1.6, -0.6]].forEach(([x, y, z]) => g.add(ball(0.25, '#3d3436', { x, y, z, sy: 0.6, seg: 8, outline: 0 })));
      g.add(ball(0.38, '#ffffff', { y: 1.6, z: 1.0, seg: 12, outline: 0.02 }), ball(0.22, '#ffb3c7', { y: 1.48, z: 1.3, sx: 1.2, seg: 10, outline: 0.012 }), ...eyes(1.72, 1.28, 0.16, 0.05));
      g.add(cone(0.06, 0.2, '#f2e3c6', { x: -0.22, y: 1.98, z: 0.95, seg: 6, outline: 0.01 }), cone(0.06, 0.2, '#f2e3c6', { x: 0.22, y: 1.98, z: 0.95, seg: 6, outline: 0.01 }));
      break;
    }
    case 'goat': {
      const c = '#efe6da';
      g.add(ball(0.5, c, { y: 0.95, sz: 1.3, seg: 14, outline: 0.025 }), ...legs4(c, 0.6, 0.25, 0.4, 0.09));
      g.add(ball(0.28, c, { y: 1.35, z: 0.7, seg: 12, outline: 0.02 }), cone(0.07, 0.3, '#8a7a6a', { x: -0.12, y: 1.65, z: 0.6, rx: -0.4, seg: 6, outline: 0.01 }), cone(0.07, 0.3, '#8a7a6a', { x: 0.12, y: 1.65, z: 0.6, rx: -0.4, seg: 6, outline: 0.01 }), ...eyes(1.42, 0.92, 0.12, 0.04));
      break;
    }
    case 'duck': default: {
      g.add(ball(0.45, '#ffd23f', { y: 0.5, sz: 1.3, seg: 14, outline: 0.025 }), ball(0.3, '#ffd23f', { y: 0.95, z: 0.35, seg: 12, outline: 0.02 }), cone(0.12, 0.25, '#ff9a3c', { y: 0.9, z: 0.68, rx: Math.PI / 2, seg: 8, outline: 0.01 }), ...eyes(1.02, 0.6, 0.12, 0.04));
      break;
    }
  }
  return g;
}

// ------------------------------------------------------------------------------------------------ the school children (instanced parts)
// Each child = these parts; the town moves them with one matrix per part per child.
export const PERSON_PARTS = [
  // name, geometry builder args, local position, colour source
  { name: 'head', kind: 'ball', size: [0.27], pos: [0, 1.32, 0], color: 'skin' },
  { name: 'hair', kind: 'ball', size: [0.29], pos: [0, 1.4, -0.04], scale: [1, 0.78, 1], color: 'hair' },
  { name: 'torso', kind: 'capsule', size: [0.2, 0.32], pos: [0, 0.86, 0], color: 'shirt' },
  { name: 'lower', kind: 'cone', size: [0.27, 0.36], pos: [0, 0.6, 0], color: 'lower' },
  { name: 'legL', kind: 'capsule', size: [0.07, 0.36], pos: [-0.09, 0.3, 0], color: 'skin', swing: 1 },
  { name: 'legR', kind: 'capsule', size: [0.07, 0.36], pos: [0.09, 0.3, 0], color: 'skin', swing: -1 },
  { name: 'armL', kind: 'capsule', size: [0.06, 0.32], pos: [-0.27, 0.9, 0], color: 'shirt', swing: -1, arm: true },
  { name: 'armR', kind: 'capsule', size: [0.06, 0.32], pos: [0.27, 0.9, 0], color: 'shirt', swing: 1, arm: true },
  { name: 'bag', kind: 'box', size: [0.34, 0.38, 0.16], pos: [0, 0.92, -0.24], color: 'bag' }
];
export const KID_LOOKS = {
  skin: ['#f6cfb0', '#e9b48f', '#c98d63', '#a8714a', '#f9dcc4'],
  hair: ['#3a2418', '#5a3424', '#1f1a17', '#7a4a2a'],
  shirt: ['#ffffff', '#ffffff', '#fff6e6', '#bfe7ff', '#ffd1dc'],
  lower: ['#2f4a86', '#3b5bb5', '#7a5aa8', '#2f7a5a', '#4a4350'],
  bag: ['#ff6b6b', '#ffd23f', '#5cc46a', '#4a90e2', '#ff8fc0', '#9b6bff']
};
void at;
