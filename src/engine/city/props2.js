// Models for the second wave of town landmarks (funfair rides, museums, parks, shops' street furniture).
// Built from the shared kit (toon colours, soft outlines); moving parts are marked live() and animated by updaters.
import { Quaternion, Vector3 } from 'three';
import { box, ball, cyl, cone, torus, capsule, star3d, heart3d, group, at, live } from '../world/kit.js';
import { buildLandmark } from '../world/landmarks.js';
import { flowerBed } from '../world/props.js';
import { animal } from './models.js';

const W = '#ffffff';
const UP = new Vector3(0, 1, 0), DIR = new Vector3();
void Quaternion;
const wobble = (t, k) => Math.sin(t * 1.3 + k * 1.7);

function bin(color, x = 0, s = 1) {
  return group(box(0.9 * s, 1.15 * s, 0.85 * s, color, { x, y: 0.58 * s, r: 0.08 }), box(1.0 * s, 0.14 * s, 0.95 * s, color, { x, y: 1.2 * s, r: 0.05 }),
    box(0.5 * s, 0.05 * s, 0.05 * s, '#ffffff', { x, y: 0.9 * s, z: 0.44 * s, outline: 0 }));
}
function pet(kind) {
  if (kind === 'cat') return group(ball(0.32, '#ffa86b', { y: 0.4, sz: 1.4, seg: 12 }), ball(0.24, '#ffa86b', { y: 0.72, z: 0.36, seg: 12 }),
    cone(0.08, 0.16, '#ffa86b', { x: -0.12, y: 0.95, z: 0.34, seg: 6 }), cone(0.08, 0.16, '#ffa86b', { x: 0.12, y: 0.95, z: 0.34, seg: 6 }),
    cyl(0.05, 0.04, 0.5, '#ffa86b', { y: 0.6, z: -0.5, rx: 0.6, seg: 6 }));
  if (kind === 'dog') return group(ball(0.36, '#e8c39a', { y: 0.45, sz: 1.4, seg: 12 }), ball(0.27, '#e8c39a', { y: 0.82, z: 0.42, seg: 12 }),
    ball(0.12, '#8a5a3c', { x: -0.22, y: 0.82, z: 0.36, sy: 1.6, seg: 8 }), ball(0.12, '#8a5a3c', { x: 0.22, y: 0.82, z: 0.36, sy: 1.6, seg: 8 }),
    ball(0.06, '#3d3436', { y: 0.8, z: 0.68, seg: 6 }));
  return group(ball(0.3, W, { y: 0.35, sz: 1.2, seg: 12 }), ball(0.22, W, { y: 0.62, z: 0.28, seg: 12 }),
    capsule(0.06, 0.32, W, { x: -0.08, y: 0.95, z: 0.24 }), capsule(0.06, 0.32, W, { x: 0.08, y: 0.95, z: 0.24 }), ball(0.1, W, { y: 0.38, z: -0.36, seg: 8 }));
}
function bird(color) {
  const g = group(ball(0.22, color, { sz: 1.5, seg: 10 }), cone(0.06, 0.16, '#ffb43c', { z: 0.36, rx: Math.PI / 2, seg: 6, outline: 0 }));
  const wl = live(box(0.5, 0.04, 0.22, color, { x: -0.3, outline: 0 })), wr = live(box(0.5, 0.04, 0.22, color, { x: 0.3, outline: 0 }));
  g.add(wl, wr); g.userData.wings = [wl, wr];
  return g;
}
function plane(scale = 1) {
  const g = group(capsule(0.9, 6, W, { rx: Math.PI / 2 }), box(9, 0.18, 1.8, '#7fcbff', { y: -0.1 }), box(3.2, 0.14, 1.0, '#7fcbff', { y: 0.2, z: -3.4 }),
    box(0.14, 1.6, 1.2, '#ff7eb6', { y: 1.0, z: -3.6 }), box(1.2, 0.5, 0.9, '#bfe7ff', { y: 0.55, z: 2.6, r: 0.2 }),
    cyl(0.18, 0.18, 0.4, '#ffd23f', { z: 4.0, rx: Math.PI / 2 }));
  g.scale.setScalar(scale);
  return g;
}

/** Returns the model for one of the new prop kinds, or null when the kind is not one of them. */
export function props2(p, updaters) {
  const o = (obj) => at(obj, p.x, 0, p.z, p.yaw || 0);
  switch (p.kind) {
    case 'factboard': return o(group(cyl(0.08, 0.08, 2.2, '#9a6340', { y: 1.1, seg: 8 }), box(1.8, 1.25, 0.12, '#ffd65a', { y: 2.15, r: 0.12, outline: 0.02 }),
      box(1.5, 0.95, 0.14, '#fffaf1', { y: 2.15, r: 0.08, outline: 0 }), star3d(0.22, 0.08, '#ff7eb6', { y: 2.95, outline: 0.012 })));
    case 'recycleBins': return o(group(bin('#3d8bfd', -1.1), bin('#ff9a3c', 0), bin('#a8693f', 1.1)));
    case 'bigBins': return o(group(bin('#3d8bfd', -7, 3), bin('#ff9a3c', 0, 3), bin('#a8693f', 7, 3)));
    case 'pavilion': {
      const g = group(box(p.w, 0.4, p.d, '#ff9a3c', { y: 4.2, r: 0.1 }), box(p.w * 0.7, 1.2, p.d * 0.6, '#ffb43c', { y: 4.9, r: 0.3 }));
      for (const [x, z] of [[-24, -8], [24, -8], [-24, 8], [24, 8]]) g.add(cyl(0.25, 0.25, 4, '#ffffff', { x, y: 2, z, seg: 10 }));
      return o(g);
    }
    case 'foodStall': { const s = buildLandmark('stall', { color: p.color }).obj; s.scale.setScalar(1.5); return o(s); }
    case 'picnicTable': return o(group(box(3, 0.12, 1.4, '#e0b988', { y: 0.8 }), box(0.12, 0.8, 1.2, '#b07a52', { x: -1.2, y: 0.4 }), box(0.12, 0.8, 1.2, '#b07a52', { x: 1.2, y: 0.4 }),
      box(3, 0.1, 0.4, '#e0b988', { y: 0.45, z: 1.0 }), box(3, 0.1, 0.4, '#e0b988', { y: 0.45, z: -1.0 }), cyl(0.05, 0.05, 2.4, '#ffffff', { y: 1.6, seg: 6 }),
      cone(1.6, 0.7, ['#ff6b6b', '#ffd23f', '#5cc46a', '#7fcbff'][Math.abs(Math.round(p.x + p.z)) % 4], { y: 2.9, seg: 10 })));
    case 'trolleys': {
      const g = group();
      for (let k = 0; k < 3; k++) g.add(group(box(1.0, 0.6, 0.7, '#c9c4d6', { x: k * 1.1 - 1.1, y: 0.8, r: 0.04 }), cyl(0.1, 0.1, 0.06, '#3d3436', { x: k * 1.1 - 1.4, y: 0.1, rx: Math.PI / 2, seg: 8 }), cyl(0.1, 0.1, 0.06, '#3d3436', { x: k * 1.1 - 0.8, y: 0.1, rx: Math.PI / 2, seg: 8 })));
      return o(g);
    }
    case 'bumperCars': {
      const g = group(box(20, 0.3, 14, '#4a4350', { y: 0.15, r: 0.05 }), box(20.4, 0.7, 0.3, '#ffd23f', { y: 0.5, z: -7.1 }), box(20.4, 0.7, 0.3, '#ffd23f', { y: 0.5, z: 7.1 }),
        box(0.3, 0.7, 14, '#ffd23f', { x: -10.1, y: 0.5 }), box(0.3, 0.7, 14, '#ffd23f', { x: 10.1, y: 0.5 }), box(20, 0.2, 14, '#ff6fa8', { y: 4.6, r: 0.1 }));
      for (const [x, z] of [[-9.8, -6.8], [9.8, -6.8], [-9.8, 6.8], [9.8, 6.8]]) g.add(cyl(0.12, 0.12, 4.4, '#ffffff', { x, y: 2.4, z, seg: 8 }));
      const cars = ['#ff6b6b', '#4a90e2', '#5cc46a', '#ffd23f', '#9b6bff'].map((c, k) => {
        const car = live(group(box(1.6, 0.6, 2.0, c, { y: 0.6, r: 0.25 }), box(1.8, 0.25, 2.2, '#3d3436', { y: 0.35, r: 0.1 }), ball(0.28, '#f6cfb0', { y: 1.15, z: -0.2, seg: 10 }), cyl(0.03, 0.03, 3.2, '#c9c4d6', { y: 2.6, z: -0.7, seg: 4, outline: 0 })));
        g.add(car); return { car, k };
      });
      updaters.push((t, r) => {
        cars.forEach(({ car, k }) => {
          const s = r ? 0 : t * (0.5 + k * 0.08);
          const x = Math.sin(s + k * 1.3) * 7.2, z = Math.cos(s * 1.3 + k * 2.1) * 4.6;
          const nx = Math.sin(s + 0.05 + k * 1.3) * 7.2, nz = Math.cos((s + 0.05) * 1.3 + k * 2.1) * 4.6;
          car.position.set(x, 0.15, z); car.rotation.y = Math.atan2(nx - x, nz - z);
        });
      });
      return o(g);
    }
    case 'dropTower': {
      const seats = live(group(torus(2.2, 0.35, '#ff6fa8', { rx: Math.PI / 2 }), ...[0, 1, 2, 3, 4, 5].map((k) => box(0.8, 0.8, 0.8, ['#ffd23f', '#7fcbff', '#5cc46a'][k % 3], { x: Math.cos(k) * 2.2, z: Math.sin(k) * 2.2, r: 0.2 }))));
      const g = group(cyl(0.7, 0.9, 14, '#e9e4ef', { y: 7, seg: 14 }), cone(1.4, 1.6, '#ff6fa8', { y: 14.8, seg: 14 }), cyl(2.6, 2.8, 0.4, '#9b6bff', { y: 0.2, seg: 18 }), seats);
      updaters.push((t, r) => { const u = r ? 0 : (t * 0.18) % 1; seats.position.y = u < 0.6 ? 1.2 + (u / 0.6) * 10 : u < 0.68 ? 11.2 : 11.2 - Math.min(1, (u - 0.68) / 0.08) * 10; });
      return o(g);
    }
    case 'gym': return o(group(cyl(0.08, 0.08, 2.2, '#4a90e2', { x: -4, y: 1.1, seg: 8 }), cyl(0.08, 0.08, 2.2, '#4a90e2', { x: 0, y: 1.1, seg: 8 }), cyl(0.08, 0.08, 2.2, '#4a90e2', { x: 4, y: 1.1, seg: 8 }),
      cyl(0.06, 0.06, 8, '#ffd23f', { y: 2.1, rz: Math.PI / 2, seg: 8 }), box(1.6, 0.12, 0.5, '#ff6b6b', { x: 2, y: 0.5 })));
    case 'iceCreamCart': return o(group(box(1.8, 1.0, 1.0, '#ffffff', { y: 0.9, r: 0.15 }), box(1.82, 0.25, 1.02, '#ff8fc0', { y: 0.95, r: 0.05 }),
      cyl(0.32, 0.32, 0.12, '#3d3436', { x: -0.6, y: 0.32, z: 0.52, rx: Math.PI / 2, seg: 10 }), cyl(0.32, 0.32, 0.12, '#3d3436', { x: 0.6, y: 0.32, z: 0.52, rx: Math.PI / 2, seg: 10 }),
      cyl(0.04, 0.04, 1.8, '#ffffff', { y: 2.2, seg: 6 }), cone(1.3, 0.6, '#7fcbff', { y: 3.2, seg: 10 }), ball(0.3, '#ffc8de', { x: 0.5, y: 1.7, seg: 10 }), cone(0.22, 0.5, '#e8b06b', { x: 0.5, y: 1.35, rx: Math.PI, seg: 8 })));
    case 'whaleStatue': return o(group(cyl(3.6, 3.8, 0.6, '#c9e6f7', { y: 0.3, seg: 20 }), ball(2.4, '#4a90e2', { y: 2.6, sz: 1.7, sy: 0.85, seg: 20 }), ball(2.2, '#bfe7ff', { y: 2.0, sz: 1.6, sy: 0.55, seg: 18 }),
      box(2.8, 0.3, 1.0, '#4a90e2', { y: 3.2, z: -4.6, r: 0.12 }), ball(0.25, '#3d3436', { x: -1.4, y: 3.0, z: 2.6, seg: 8 }), ball(0.25, '#3d3436', { x: 1.4, y: 3.0, z: 2.6, seg: 8 }),
      cyl(0.12, 0.3, 1.6, '#bfe7ff', { y: 5.0, z: 1.0, seg: 8 })));
    case 'dinoStatue': {
      if (p.dino === 'trex') return o(group(cyl(3.4, 3.6, 0.5, '#e8d6b4', { y: 0.25, seg: 18 }), ball(1.7, '#ff9a3c', { y: 3.6, sz: 1.5, seg: 18 }), capsule(0.5, 2.6, '#ff9a3c', { x: -0.9, y: 1.6, rx: 0.2 }),
        capsule(0.5, 2.6, '#ff9a3c', { x: 0.9, y: 1.6, rx: 0.2 }), cone(1.1, 4.4, '#ff9a3c', { y: 3.4, z: -3.6, rx: -Math.PI / 2 + 0.25, seg: 14 }), box(1.8, 1.4, 2.6, '#ff9a3c', { y: 5.4, z: 2.2, r: 0.5 }),
        box(1.4, 0.18, 1.2, '#ffffff', { y: 4.85, z: 3.0, r: 0.05 }), ball(0.18, '#3d3436', { x: -0.6, y: 5.8, z: 3.0, seg: 8 }), ball(0.18, '#3d3436', { x: 0.6, y: 5.8, z: 3.0, seg: 8 }),
        capsule(0.18, 0.7, '#ff9a3c', { x: -0.9, y: 3.6, z: 1.6, rx: 1.2 }), capsule(0.18, 0.7, '#ff9a3c', { x: 0.9, y: 3.6, z: 1.6, rx: 1.2 })));
      return o(group(box(10, 0.5, 6, '#e8d6b4', { y: 0.25, r: 0.2 }), ball(2.0, '#6fcf6a', { y: 3.2, sz: 1.7, seg: 18 }), ...[[-1.2, 1.6], [1.2, 1.6], [-1.2, -1.6], [1.2, -1.6]].map(([x, z]) => cyl(0.45, 0.5, 2.4, '#6fcf6a', { x, y: 1.4, z, seg: 10 })),
        capsule(0.55, 4.8, '#6fcf6a', { y: 6.4, z: 3.0, rx: 0.55 }), ball(0.75, '#6fcf6a', { y: 8.8, z: 4.6, sz: 1.3, seg: 14 }), ball(0.14, '#3d3436', { x: -0.45, y: 9.0, z: 5.2, seg: 8 }),
        ball(0.14, '#3d3436', { x: 0.45, y: 9.0, z: 5.2, seg: 8 }), cone(0.9, 5, '#6fcf6a', { y: 2.8, z: -4.6, rx: -Math.PI / 2 + 0.15, seg: 12 }), ...[0, 1, 2, 3].map((k) => cone(0.3, 0.6, '#ffd23f', { y: 5.2 - k * 0.35, z: 1.5 - k * 1.2, seg: 6 }))));
    }
    case 'fossilPit': {
      const g = group(box(16, 0.3, 12, '#f2d38a', { y: 0.15, r: 0.1 }), box(16.4, 0.6, 0.3, '#b07a52', { y: 0.3, z: -6.1 }), box(16.4, 0.6, 0.3, '#b07a52', { y: 0.3, z: 6.1 }),
        box(0.3, 0.6, 12, '#b07a52', { x: -8.1, y: 0.3 }), box(0.3, 0.6, 12, '#b07a52', { x: 8.1, y: 0.3 }));
      for (let k = 0; k < 7; k++) g.add(capsule(0.18, 1.6 - (k % 3) * 0.3, '#fffaf0', { x: -5 + k * 1.6, y: 0.4, z: Math.sin(k) * 2.5, rz: Math.PI / 2, ry: k }));
      g.add(ball(0.9, '#fffaf0', { x: 4, y: 0.5, z: 2.5, sz: 1.3, seg: 12 }), box(0.15, 1.2, 0.15, '#9a6340', { x: -6, y: 0.9, z: -4 }), box(0.8, 0.5, 0.1, '#c9c4d6', { x: -6, y: 1.6, z: -4 }));
      return o(g);
    }
    case 'greenhouse': {
      const g = group(box(36, 0.3, 24, '#d6f5d6', { y: 0.15, r: 0.1 }), ball(11, '#bfe7ff', { y: 0.2, sx: 1.55, sz: 1.0, sy: 0.75, seg: 22, matOpts: { transparent: true, opacity: 0.45 }, outline: 0.02 }));
      for (let k = 0; k < 5; k++) g.add(flowerBedSmall(-12 + k * 6, 0, 3, 1.4));
      return o(g);
    }
    case 'butterflies': {
      const g = group();
      const fl = ['#ff8fc0', '#ffd23f', '#9b6bff', '#7fcbff', '#ff9a3c', '#5cc46a', '#ff6b6b', '#b79cff'].map((c, k) => {
        const wl = box(0.36, 0.03, 0.3, c, { x: -0.18, outline: 0, shadow: false }), wr = box(0.36, 0.03, 0.3, c, { x: 0.18, outline: 0, shadow: false });
        const b = live(group(capsule(0.04, 0.22, '#3d3436', { rx: Math.PI / 2, outline: 0 }), wl, wr));
        g.add(b); return { b, wl, wr, k };
      });
      updaters.push((t, r) => fl.forEach(({ b, wl, wr, k }) => {
        const s = r ? k : t * (0.35 + k * 0.03) + k * 0.8;
        b.position.set(Math.sin(s) * (8 + k), 1.4 + Math.sin(s * 2.3) * 0.6 + (k % 3) * 0.4, Math.cos(s * 0.8) * (6 + (k % 4)));
        b.rotation.y = s + Math.PI / 2;
        const f = r ? 0.3 : Math.sin(t * 14 + k) * 0.9; wl.rotation.z = f; wr.rotation.z = -f;
      }));
      return o(g);
    }
    case 'postbox': return o(group(cyl(0.38, 0.38, 1.3, '#e8202a', { y: 0.65, seg: 14 }), ball(0.38, '#e8202a', { y: 1.3, sy: 0.6, seg: 14 }), box(0.4, 0.06, 0.06, '#3d3436', { y: 1.05, z: 0.37, outline: 0 })));
    case 'piggyStatue': return o(group(box(6, 0.5, 4, '#ffe0a0', { y: 0.25, r: 0.15 }), ball(1.8, '#ffb3c7', { y: 2.4, sz: 1.3, seg: 18 }), ball(0.6, '#ff9fb6', { y: 2.4, z: 2.4, sx: 1.2, sy: 0.8, seg: 12 }),
      cone(0.4, 0.6, '#ffb3c7', { x: -0.8, y: 4.1, z: 0.8, seg: 8 }), cone(0.4, 0.6, '#ffb3c7', { x: 0.8, y: 4.1, z: 0.8, seg: 8 }), ...[[-0.9, 1.2], [0.9, 1.2], [-0.9, -1.2], [0.9, -1.2]].map(([x, z]) => cyl(0.35, 0.35, 1.0, '#ffb3c7', { x, y: 0.9, z, seg: 10 })),
      box(0.9, 0.12, 0.2, '#3d3436', { y: 4.2, outline: 0 }), cyl(0.5, 0.5, 0.15, '#ffd23f', { y: 5.0, rx: Math.PI / 2, seg: 16 }), ball(0.12, '#3d3436', { x: -0.6, y: 3.0, z: 2.0, seg: 8 }), ball(0.12, '#3d3436', { x: 0.6, y: 3.0, z: 2.0, seg: 8 })));
    case 'clockTower': {
      // the hands turn round their pivots at the centre of the face (the boxes sit above the pivot)
      const hourHand = live(group(box(0.18, 1.0, 0.06, '#3d3436', { y: 0.45, outline: 0 }))), minHand = live(group(box(0.12, 1.45, 0.06, '#3d3436', { y: 0.65, outline: 0 })));
      const face = group(cyl(1.7, 1.7, 0.2, '#fffaf1', { rx: Math.PI / 2, seg: 24 }), torus(1.7, 0.14, '#8f86e8', {}), hourHand, minHand);
      for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; face.add(box(0.12, 0.3, 0.05, '#8f86e8', { x: Math.sin(a) * 1.4, y: Math.cos(a) * 1.4, z: 0.12, rz: -a, outline: 0 })); }
      hourHand.position.z = minHand.position.z = 0.16;
      face.position.set(0, 7.2, 1.32);
      const g = group(box(2.6, 9, 2.6, '#e7dcff', { y: 4.5, r: 0.15 }), box(3.0, 0.5, 3.0, '#8f86e8', { y: 9.2, r: 0.1 }), cone(2.2, 2.6, '#8f86e8', { y: 10.7, seg: 4, ry: Math.PI / 4 }), star3d(0.35, 0.12, '#ffd23f', { y: 12.3 }), face);
      updaters.push(() => { const d = new Date(); const m = d.getMinutes() + d.getSeconds() / 60, h = (d.getHours() % 12) + m / 60; minHand.rotation.z = -(m / 60) * Math.PI * 2; hourHand.rotation.z = -(h / 12) * Math.PI * 2; });
      return o(g);
    }
    case 'pool': {
      const g = group(box(52, 0.5, 28, '#e9e4ef', { y: 0.25, r: 0.15 }), box(48, 0.1, 24, '#5fc8f0', { y: 0.52, outline: 0 }));
      for (let k = 0; k < 4; k++) g.add(box(48, 0.06, 0.12, '#ffffff', { y: 0.58, z: -9 + k * 6, outline: 0 }));
      const rings = ['#ff6b6b', '#ffd23f', '#5cc46a'].map((c, k) => { const r = live(torus(0.6, 0.18, c, { rx: Math.PI / 2, outline: 0.015 })); r.position.set(-12 + k * 12, 0.65, k % 2 ? 4 : -4); g.add(r); return r; });
      updaters.push((t, rd) => rings.forEach((r, k) => { r.position.y = 0.65 + (rd ? 0 : wobble(t, k) * 0.06); }));
      return o(g);
    }
    case 'waterSlide': return o(group(box(4, 7, 4, '#7fcbff', { y: 3.5, r: 0.3 }), cyl(0.12, 0.12, 7.4, '#ffffff', { x: 1.8, y: 3.7, z: 1.8, seg: 6 }),
      ...[0, 1, 2, 3, 4].map((k) => box(2.2, 0.4, 3.4, ['#ff6b6b', '#ffd23f', '#5cc46a', '#ff8fc0', '#9b6bff'][k], { x: -1 - k * 0.2, y: 6.4 - k * 1.4, z: 3.4 + k * 2.6, rx: 0.45, r: 0.15 }))));
    case 'splashPad': {
      const g = group(cyl(7, 7, 0.12, '#7fcbff', { y: 0.06, seg: 28, outline: 0 }), cyl(5, 5, 0.14, '#bfe7ff', { y: 0.07, seg: 24, outline: 0 }));
      const jets = [0, 1, 2, 3, 4].map((k) => { const a = (k / 5) * Math.PI * 2; const j = live(cyl(0.12, 0.25, 1, '#dff4ff', { x: Math.cos(a) * 3.4, y: 0.5, z: Math.sin(a) * 3.4, seg: 8, outline: 0, matOpts: { transparent: true, opacity: 0.75 } })); g.add(j); return j; });
      updaters.push((t, r) => jets.forEach((j, k) => { const h = r ? 1 : 0.6 + Math.abs(Math.sin(t * 2.4 + k)) * 2.2; j.scale.y = h; j.position.y = h / 2 + 0.1; }));
      return o(g);
    }
    case 'court': {
      if (p.sport === 'basketball') {
        const g = group(box(30, 0.08, 16, '#ff9a3c', { y: 0.04, outline: 0 }), box(28, 0.1, 14, '#ffb36b', { y: 0.06, outline: 0 }), box(0.12, 0.12, 14, '#ffffff', { y: 0.12, outline: 0 }), torus(1.8, 0.06, '#ffffff', { y: 0.12, rx: Math.PI / 2, outline: 0 }));
        for (const sx of [-1, 1]) g.add(cyl(0.12, 0.12, 3.4, '#c9c4d6', { x: sx * 14, y: 1.7, seg: 8 }), box(0.1, 1.1, 1.8, '#ffffff', { x: sx * 13.6, y: 3.3 }), torus(0.28, 0.04, '#ff5a5a', { x: sx * 13.2, y: 3.0, rx: Math.PI / 2, outline: 0 }));
        return o(g);
      }
      return o(group(box(14, 0.08, 7, '#4cc46a', { y: 0.04, outline: 0 }), box(13.4, 0.1, 6.1, '#6fdcb4', { y: 0.06, outline: 0 }), box(0.06, 0.06, 6.1, '#ffffff', { y: 0.11, outline: 0 }),
        cyl(0.06, 0.06, 1.55, '#c9c4d6', { y: 0.78, z: -3.3, seg: 6 }), cyl(0.06, 0.06, 1.55, '#c9c4d6', { y: 0.78, z: 3.3, seg: 6 }), box(0.04, 0.7, 6.6, '#ffffff', { y: 1.2, outline: 0, matOpts: { transparent: true, opacity: 0.6 } })));
    }
    case 'petPen': {
      const g = group(box(20, 0.1, 16, '#d6f5d6', { y: 0.05, outline: 0 }));
      for (const [x0, z0, x1, z1] of [[-10, -8, 10, -8], [-10, 8, 10, 8], [-10, -8, -10, 8], [10, -8, 10, 8]]) g.add(box(Math.abs(x1 - x0) || 0.12, 0.9, Math.abs(z1 - z0) || 0.12, '#ffffff', { x: (x0 + x1) / 2, y: 0.45, z: (z0 + z1) / 2, r: 0.04 }));
      const pets = ['cat', 'dog', 'rabbit', 'cat', 'rabbit'].map((k, i) => { const m = live(pet(k)); m.position.set(-6 + i * 3, 0, (i % 2 ? 3 : -3)); g.add(m); return m; });
      updaters.push((t, r) => pets.forEach((m, i) => { if (r) return; const s = t * 0.4 + i * 1.7; m.position.set(Math.sin(s) * 6 - 0, 0, Math.cos(s * 1.3) * 4.5); m.rotation.y = s * 1.2; }));
      return o(g);
    }
    case 'hibiscusBed': {
      const g = group(box(10, 0.4, 4, '#b07a52', { y: 0.2, r: 0.08 }), box(9.6, 0.1, 3.6, '#8a5a3c', { y: 0.42, outline: 0 }));
      for (let k = 0; k < 8; k++) { const x = -4 + (k % 4) * 2.6, z = k < 4 ? -0.9 : 0.9; g.add(ball(0.45, '#3fa64a', { x, y: 0.8, z, seg: 8 }), ball(0.32, '#e8202a', { x, y: 1.25, z: z + 0.2, sy: 0.5, seg: 10 }), ball(0.08, '#ffd23f', { x, y: 1.4, z: z + 0.25, seg: 6, outline: 0 })); }
      return o(g);
    }
    case 'gazebo': {
      const g = group(cyl(4.5, 4.5, 0.4, '#e8d6b4', { y: 0.2, seg: 6 }), cone(5.4, 2.6, '#e8202a', { y: 5.2, seg: 6 }), ball(0.4, '#ffd23f', { y: 6.6, seg: 10 }));
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; g.add(cyl(0.2, 0.2, 3.8, '#ffffff', { x: Math.cos(a) * 4, y: 2.3, z: Math.sin(a) * 4, seg: 8 })); }
      return o(g);
    }
    case 'paddy': {
      const g = group(box(20, 0.2, 16, '#9bd0e6', { y: 0.1, outline: 0 }));
      for (let r = 0; r < 7; r++) for (let c = 0; c < 9; c++) g.add(cone(0.35, 0.9, r % 2 ? '#8fd45e' : '#6fcf6a', { x: -8.5 + c * 2.1, y: 0.6, z: -6.6 + r * 2.2, seg: 5, outline: 0, shadow: false }));
      g.add(cyl(0.08, 0.08, 2.2, '#9a6340', { x: 8, y: 1.1, z: 6.4, seg: 6 }), box(1.6, 0.12, 0.12, '#9a6340', { x: 8, y: 1.7, z: 6.4 }), ball(0.3, '#f6cfb0', { x: 8, y: 2.4, z: 6.4, seg: 8 }), cone(0.6, 0.5, '#ffd23f', { x: 8, y: 2.75, z: 6.4, seg: 10 }));
      return o(g);
    }
    case 'wauDisplay': return o(group(cyl(0.1, 0.1, 3.2, '#9a6340', { y: 1.6, seg: 8 }), torus(1.0, 0.18, '#ff6b6b', { y: 3.6, arc: Math.PI, rz: Math.PI, outline: 0.015 }),
      box(2.6, 0.9, 0.08, '#ffd23f', { y: 4.0, r: 0.3 }), box(0.9, 1.6, 0.08, '#5cc46a', { y: 4.9, r: 0.3 }), box(0.12, 2.6, 0.1, '#9a6340', { y: 4.0, outline: 0 })));
    case 'controlTower': return o(group(cyl(1.4, 1.8, 9, '#e9e4ef', { y: 4.5, seg: 14 }), cyl(2.4, 2.2, 1.8, '#bfe7ff', { y: 9.9, seg: 12, matOpts: { transparent: true, opacity: 0.85 } }), cyl(2.6, 2.6, 0.4, '#4a90e2', { y: 11.0, seg: 12 }), cyl(0.06, 0.06, 1.6, '#c9c4d6', { y: 12.0, seg: 6 }), ball(0.18, '#ff6b6b', { y: 12.9, seg: 8 })));
    case 'planeTakeoff': {
      const pl = live(plane(1));
      updaters.push((t, r) => {
        const u = r ? 0 : (t / 24) % 1;                     // taxi, take off, climb away, come back
        const x = -40 + u * 120, y = x < 0 ? 1.2 : 1.2 + (x * x) / 160;
        pl.position.set(Math.min(x, 70), Math.min(y, 30), 0); pl.rotation.set(x < 0 ? 0 : -Math.min(0.35, x / 120), Math.PI / 2, 0);
        pl.visible = x < 70;
      });
      const parked = plane(0.8); parked.position.set(-30, 1.0, 14); parked.rotation.y = Math.PI / 2;
      return o(group(pl, parked));
    }
    case 'windsock': {
      const sock = live(group(cone(0.4, 2, '#ff9a3c', { z: 1, rx: Math.PI / 2, seg: 10 }), torus(0.4, 0.05, '#ffffff', { z: 0.5, outline: 0 })));
      sock.position.y = 4.5;
      updaters.push((t, r) => { sock.rotation.y = r ? 0.6 : 0.6 + Math.sin(t * 0.7) * 0.3; sock.rotation.x = r ? 0 : Math.sin(t * 2) * 0.08; });
      return o(group(cyl(0.08, 0.1, 4.6, '#c9c4d6', { y: 2.3, seg: 8 }), sock));
    }
    case 'kites': {
      const g = group();
      const kites = [[-20, -10, '#ff6b6b'], [10, -18, '#ffd23f'], [24, 6, '#7fcbff']].map(([ax, az, col], k) => {
        g.add(cyl(0.12, 0.12, 0.6, '#9a6340', { x: ax, y: 0.3, z: az, seg: 6 }));
        const kite = live(group(box(1.6, 1.6, 0.06, col, { rz: Math.PI / 4, r: 0.1, outline: 0.015 }), box(0.06, 1.8, 0.07, '#ffffff', { outline: 0 }), box(1.8, 0.06, 0.07, '#ffffff', { outline: 0 }),
          ...[0, 1, 2].map((i) => box(0.3, 0.2, 0.04, ['#ff8fc0', '#5cc46a', '#9b6bff'][i], { y: -1.4 - i * 0.5, outline: 0 }))));
        const line = live(cyl(0.015, 0.015, 1, '#ffffff', { seg: 3, outline: 0, shadow: false }));
        g.add(kite, line); return { kite, line, ax, az, k };
      });
      updaters.push((t, r) => kites.forEach(({ kite, line, ax, az, k }) => {
        const x = ax + 4 + (r ? 0 : Math.sin(t * 0.6 + k) * 2), y = 8 + (r ? 0 : Math.sin(t * 0.9 + k * 2) * 1.2), z = az - 6;
        kite.position.set(x, y, z); kite.rotation.z = r ? 0 : Math.sin(t * 1.4 + k) * 0.25;
        const dx = x - ax, dy = y - 0.6, dz = z - az, len = Math.hypot(dx, dy, dz);
        line.position.set((x + ax) / 2, (y + 0.6) / 2, (z + az) / 2); line.scale.set(1, len, 1); line.quaternion.setFromUnitVectors(UP, DIR.set(dx, dy, dz).normalize());
      }));
      return o(g);
    }
    case 'windTurbine': {
      const rotor = live(group(ball(0.5, '#ffffff', { seg: 10 }), ...[0, 1, 2].map((k) => box(0.5, 7, 0.12, '#ffffff', { y: 3.5, rz: (k / 3) * Math.PI * 2, r: 0.1 }))));
      rotor.children.slice(1).forEach((b, k) => { const a = (k / 3) * Math.PI * 2; b.position.set(-Math.sin(a) * 3.5, Math.cos(a) * 3.5, 0); b.rotation.z = a; });
      rotor.position.set(0, 16, 1.3);
      updaters.push((t, r) => { rotor.rotation.z = r ? 0 : t * 0.9; });
      return o(group(cyl(0.35, 0.6, 16, '#ffffff', { y: 8, seg: 12 }), box(1.0, 1.0, 2.4, '#ffffff', { y: 16, r: 0.3 }), rotor));
    }
    case 'lighthouse': {
      const beam = live(cone(1.2, 12, '#fff7b0', { rz: Math.PI / 2, x: 6, seg: 10, outline: 0, shadow: false, matOpts: { transparent: true, opacity: 0.35, emissive: '#fff3a0', emissiveIntensity: 0.6 } }));
      const head = live(group(beam)); head.position.y = 13.4;
      const g = group(cyl(2.2, 3.2, 12, '#ffffff', { y: 6, seg: 18 }), cyl(2.3, 2.9, 1.6, '#e8202a', { y: 3, seg: 18 }), cyl(2.0, 2.4, 1.6, '#e8202a', { y: 8, seg: 18 }),
        cyl(2.6, 2.6, 0.4, '#3d3436', { y: 12.2, seg: 18 }), cyl(1.4, 1.4, 1.8, '#fff7b0', { y: 13.4, seg: 12, matOpts: { emissive: '#fff3a0', emissiveIntensity: 0.5 } }), cone(1.8, 1.6, '#e8202a', { y: 15.1, seg: 12 }), head);
      updaters.push((t, r) => { head.rotation.y = r ? 0 : t * 0.8; });
      return o(g);
    }
    case 'anchor': return o(group(cyl(1.2, 1.4, 0.4, '#c9c4d6', { y: 0.2, seg: 14 }), box(0.3, 2.8, 0.3, '#4a4350', { y: 1.8 }), torus(0.4, 0.1, '#4a4350', { y: 3.4 }),
      torus(1.0, 0.14, '#4a4350', { y: 1.4, arc: Math.PI, rz: Math.PI }), box(1.6, 0.2, 0.2, '#4a4350', { y: 2.6 })));
    case 'aviary': {
      const g = group(cyl(16, 16, 0.2, '#d6f5d6', { y: 0.1, seg: 28, outline: 0 }));
      for (let k = 0; k < 8; k++) g.add(torus(15.8, 0.08, '#c9c4d6', { y: 0.2, rx: 0, ry: (k / 8) * Math.PI, arc: Math.PI, outline: 0 }));
      g.add(torus(15.8, 0.1, '#c9c4d6', { y: 0.3, rx: Math.PI / 2, outline: 0 }));
      for (const [x, z] of [[-6, -4], [5, 6], [8, -7]]) g.add(cyl(0.25, 0.3, 3, '#9a6340', { x, y: 1.5, z, seg: 8 }), ball(1.8, '#5cc46a', { x, y: 3.8, z, seg: 10 }));
      const birds = ['#ff6b6b', '#ffd23f', '#7fcbff', '#5cc46a', '#ff9a3c', '#9b6bff'].map((c, k) => { const b = live(bird(c)); g.add(b); return { b, k }; });
      updaters.push((t, r) => birds.forEach(({ b, k }) => {
        const s = r ? k : t * (0.5 + k * 0.05) + k;
        b.position.set(Math.sin(s) * (5 + k), 4 + Math.sin(s * 1.7) * 1.5 + k * 0.3, Math.cos(s) * (5 + k)); b.rotation.y = s + Math.PI / 2;
        const f = r ? 0 : Math.sin(t * 12 + k) * 0.7; b.userData.wings[0].rotation.z = f; b.userData.wings[1].rotation.z = -f;
      }));
      return o(g);
    }
    case 'hornbillStatue': return o(group(box(3, 1.2, 3, '#e8d6b4', { y: 0.6, r: 0.15 }), ball(1.1, '#3d3436', { y: 2.4, sz: 1.3, seg: 14 }), ball(0.6, '#3d3436', { y: 3.5, z: 0.8, seg: 12 }),
      cone(0.3, 1.6, '#ffd23f', { y: 3.4, z: 2.0, rx: Math.PI / 2, seg: 10 }), box(0.4, 0.4, 1.0, '#ff6b4a', { y: 3.95, z: 1.4, r: 0.15 }), ball(0.9, '#ffffff', { y: 2.0, z: -0.3, sz: 1.2, sy: 0.6, seg: 12 }),
      box(0.8, 0.12, 1.6, '#ffffff', { y: 2.2, z: -1.6, r: 0.05 })));
    case 'fenceRow': {
      const g = group(box(p.w, 0.08, 0.08, W, { y: 0.75, outline: 0 }), box(p.w, 0.08, 0.08, W, { y: 0.4, outline: 0 }));
      for (let x = -p.w / 2; x <= p.w / 2; x += 3) g.add(box(0.12, 0.95, 0.12, W, { x, y: 0.48, outline: 0, shadow: false }));
      return o(g);
    }
    case 'garbageTruck': return o(group(box(4.6, 2.2, 2.2, '#5cc46a', { y: 1.5, r: 0.2 }), box(1.6, 1.6, 2.2, '#ffffff', { x: 3.0, y: 1.2, r: 0.2 }), box(1.0, 0.7, 2.24, '#bfe7ff', { x: 3.3, y: 1.6, r: 0.1, outline: 0.01 }),
      ...[[-1.4, 1.1], [-1.4, -1.1], [2.8, 1.1], [2.8, -1.1]].map(([x, z]) => cyl(0.45, 0.45, 0.3, '#3d3436', { x, y: 0.45, z, rx: Math.PI / 2, seg: 12 })),
      heart3d(0.3, 0.1, '#ffffff', { x: -0.5, y: 1.6, z: 1.12, outline: 0 })));
    case 'gardenLamp': return o(group(cyl(0.07, 0.09, 2.6, '#4a4350', { y: 1.3, seg: 6 }), ball(0.28, '#fff3b0', { y: 2.75, seg: 10, matOpts: { emissive: '#fff3a0', emissiveIntensity: 0.4 } }), cone(0.36, 0.25, '#4a4350', { y: 3.05, seg: 8 })));
    case 'flowers': return o(flowerBedLite(p.w, p.d));
    case 'joggers': return null;                               // drawn by the town builder (they move round the track)
    default: return null;
  }
}
function flowerBedSmall(x, z, w, d) { const b = flowerBedLite(w, d); b.position.set(x, 0, z); return b; }
/** A town flower bed: the same look from the game camera with far fewer triangles than the garden's (no stems, no outlines). */
export function flowerBedLite(w, d) {
  const cols = ['#ff8fc0', '#ffd23f', '#b79cff', '#ff9a3c', '#7fcbff', '#ff6b6b'];
  const g = group(box(w, 0.4, 0.2, '#e0b988', { y: 0.2, z: -d / 2 + 0.1, r: 0.04 }), box(w, 0.4, 0.2, '#e0b988', { y: 0.2, z: d / 2 - 0.1, r: 0.04 }),
    box(0.2, 0.4, d - 0.4, '#e0b988', { x: -w / 2 + 0.1, y: 0.2, r: 0.04 }), box(0.2, 0.4, d - 0.4, '#e0b988', { x: w / 2 - 0.1, y: 0.2, r: 0.04 }),
    box(w - 0.4, 0.06, d - 0.4, '#8a5a3c', { y: 0.3, r: 0.01, outline: 0 }));
  const n = Math.max(4, Math.round(w * d * 0.5));
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + 0.6 + ((i * 0.618) % 1) * (w - 1.2), z = -d / 2 + 0.6 + ((i * 0.381 + 0.17) % 1) * (d - 1.2);
    g.add(ball(0.17, cols[i % cols.length], { x, y: 0.55, z, seg: 6, outline: 0, shadow: false }));
  }
  return g;
}
export { pet, bird, plane };
void animal; void ball;
