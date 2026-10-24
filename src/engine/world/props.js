// Reusable furniture, toys and garden pieces for the big preschool and yard.
// Every builder returns a Group standing on the floor at its own origin (y = 0).
import { Mesh, PlaneGeometry, CircleGeometry, InstancedMesh, Object3D, Color, CylinderGeometry, SphereGeometry, ConeGeometry, DoubleSide } from 'three';
import { box, ball, cyl, cone, torus, capsule, star3d, heart3d, prism, decal, group, at, cachedGeo, part, live } from './kit.js';
import { toon, lambert, basic, rugTexture, feltTexture, tint, makeCanvas, canvasTexture, roundRect, grain } from './paint.js';
import { createRng } from '../core/rng.js';

export const PAL = { pink: '#ff8fc0', lav: '#b79cff', sky: '#7fcbff', mint: '#6fdcb4', butter: '#ffd65a', peach: '#ffa86b', red: '#ff6b6b', cream: '#fff6e6', wood: '#c48a5a', woodD: '#9a6340', woodL: '#e0b988', white: '#ffffff', grey: '#c9c4d6', green: '#5cc46a', leaf: '#6fcf6a', blue: '#4a90e2', orange: '#ff9a3c', purple: '#9b6bff', yellow: '#ffd23f', dark: '#4a4350', teal: '#3aa98f', tealL: '#bfeadc', gold: '#f2c14e' };
export const RAINBOW = ['#ff6b6b', '#ff9a3c', '#ffd23f', '#5cc46a', '#4a90e2', '#9b6bff'];

let planeG = null;
// A flat, textured rectangle lying on the floor.
export function flat(w, d, material, x, z, y = 0.012, ry = 0) {
  planeG = planeG || cachedGeo('flatplane', () => new PlaneGeometry(1, 1));
  const m = new Mesh(planeG, material);
  m.scale.set(w, d, 1);
  m.rotation.x = -Math.PI / 2; m.rotation.z = ry;
  m.position.set(x, y, z);
  m.receiveShadow = true;
  return m;
}
export const feltMat = (color) => lambert(color, feltTexture());

export function rugRound(r, color, y = 0.014) {
  const mat = lambert('#ffffff', rugTexture(color, 'rug' + color, 3));
  mat.transparent = true;
  const m = new Mesh(cachedGeo('rugdisc', () => new CircleGeometry(1, 48)), mat);
  m.scale.set(r, r, 1);
  m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true;
  return m;
}
export function rugRect(w, d, color, accent = '#ffffff', y = 0.014) {
  const g = group();
  const base = new Mesh(cachedGeo('rr1', () => new PlaneGeometry(1, 1)), lambert(tint(color, 0)));
  base.scale.set(w, d, 1); base.rotation.x = -Math.PI / 2; base.position.y = y; base.receiveShadow = true;
  const inner = new Mesh(cachedGeo('rr1', () => new PlaneGeometry(1, 1)), lambert(accent));
  inner.scale.set(w - 0.5, d - 0.5, 1); inner.rotation.x = -Math.PI / 2; inner.position.y = y + 0.003; inner.receiveShadow = true;
  const inner2 = new Mesh(cachedGeo('rr1', () => new PlaneGeometry(1, 1)), lambert(color));
  inner2.scale.set(w - 0.9, d - 0.9, 1); inner2.rotation.x = -Math.PI / 2; inner2.position.y = y + 0.006; inner2.receiveShadow = true;
  g.add(base, inner, inner2);
  return g;
}
export const cushion = (r, color, h = 0.3) => group(ball(r, color, { sy: h / r, outline: 0.02 }), ball(r * 0.18, tint(color, -0.15), { y: h * 0.82, outline: 0.01 }));
export function beanbag(color) {
  return group(ball(0.9, color, { sy: 0.55, y: 0.45, outline: 0.03 }), ball(0.5, color, { y: 0.78, z: -0.35, sy: 0.7, outline: 0.03 }));
}
export function lowTable(w, d, h, color = PAL.butter, leg = PAL.wood) {
  const g = group(box(w, 0.12, d, color, { y: h, r: 0.06 }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(cyl(0.06, 0.06, h, leg, { x: sx * (w / 2 - 0.15), y: h / 2, z: sz * (d / 2 - 0.15), outline: 0.01 }));
  return g;
}
export function roundTable(r, h, color = PAL.butter) {
  return group(cyl(r, r, 0.12, color, { y: h }), cyl(0.12, 0.2, h - 0.06, PAL.wood, { y: h / 2 }), cyl(r * 0.45, r * 0.5, 0.06, PAL.wood, { y: 0.03 }));
}
export function stool(color = PAL.pink, h = 0.42) {
  return group(cyl(0.3, 0.3, 0.1, color, { y: h }), cyl(0.04, 0.05, h, PAL.wood, { y: h / 2, x: 0.18, z: 0.1 }), cyl(0.04, 0.05, h, PAL.wood, { y: h / 2, x: -0.18, z: 0.1 }), cyl(0.04, 0.05, h, PAL.wood, { y: h / 2, z: -0.2 }));
}
export function chairKid(color = PAL.sky, faceBack = true) {
  const g = group(box(0.7, 0.12, 0.7, color, { y: 0.46, r: 0.05 }), box(0.7, 0.7, 0.12, color, { y: 0.86, z: faceBack ? -0.3 : 0.3, r: 0.05 }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(cyl(0.05, 0.05, 0.42, PAL.wood, { x: sx * 0.28, y: 0.2, z: sz * 0.28, outline: 0.008 }));
  return g;
}
export function sofa(color = PAL.lav) {
  return group(box(2.6, 0.5, 1.2, color, { y: 0.45, r: 0.15 }), box(2.6, 0.9, 0.35, color, { y: 0.95, z: -0.5, r: 0.15 }), box(0.35, 0.7, 1.2, tint(color, -0.08), { x: -1.2, y: 0.75, r: 0.12 }), box(0.35, 0.7, 1.2, tint(color, -0.08), { x: 1.2, y: 0.75, r: 0.12 }),
    box(0.8, 0.4, 0.2, PAL.butter, { x: -0.5, y: 0.9, z: -0.25, r: 0.08, rx: -0.2 }), box(0.7, 0.4, 0.2, PAL.mint, { x: 0.6, y: 0.9, z: -0.25, r: 0.08, rx: -0.2, rz: 0.15 }));
}
export function plantPot(scale = 1, leafColor = '#4cbf5b') {
  const g = group(cyl(0.45, 0.35, 0.8, '#ff9a6a', { y: 0.4 }), torus(0.44, 0.06, '#ffb38a', { y: 0.8, rx: Math.PI / 2, outline: 0.01 }));
  [[0, 1.4, 0, 0.5], [-0.35, 1.25, 0.1, 0.38], [0.35, 1.3, -0.1, 0.4], [0.05, 1.8, 0.05, 0.36]].forEach(([px, py, pz, r]) => g.add(ball(r, leafColor, { x: px, y: py, z: pz })));
  g.scale.setScalar(scale);
  return g;
}
export function lantern(color = PAL.gold, glow = '#ffe9a8') {
  return group(cyl(0.01, 0.01, 1.2, '#6b4a3a', { y: 0.6, outline: 0 }), cone(0.22, 0.2, color, { y: -0.1, outline: 0.012 }), cyl(0.16, 0.2, 0.36, glow, { y: -0.36, outline: 0.012, matOpts: { emissive: glow, emissiveIntensity: 0.55 } }), cone(0.2, 0.14, color, { y: -0.6, rx: Math.PI, outline: 0.012 }), ball(0.05, color, { y: -0.72, outline: 0.008 }));
}
// A tall bookshelf whose front shows a picture of many books.
export function shelfUnit(w, h, d, spineTex, color = PAL.woodL) {
  const g = group(box(w, h, d, color, { y: h / 2, r: 0.08 }));
  const front = new Mesh(cachedGeo(`shelfp${w}${h}`, () => new PlaneGeometry(w - 0.3, h - 0.3)), basic('#ffffff', { map: spineTex }));
  front.position.set(0, h / 2, d / 2 + 0.006);
  g.add(front);
  return g;
}
// Two posts and an arch over a doorway.
export function archFrame(w, h, color = PAL.teal) {
  const g = group(box(0.4, h, 0.5, color, { x: -w / 2, y: h / 2, r: 0.1 }), box(0.4, h, 0.5, color, { x: w / 2, y: h / 2, r: 0.1 }));
  g.add(torus(w / 2, 0.2, color, { y: h, arc: Math.PI, outline: 0.02 }));
  return g;
}
// A cabinet with a glowing screen showing a picture.
export function arcadeCabinet(color, screenTex) {
  const g = group(box(1.3, 2.3, 1.1, color, { y: 1.15, r: 0.14 }), box(1.4, 0.5, 1.3, tint(color, -0.1), { y: 0.25, r: 0.1 }), box(1.1, 0.25, 0.9, tint(color, 0.1), { y: 2.35, r: 0.1 }));
  const screen = new Mesh(cachedGeo('acscreen', () => new PlaneGeometry(0.96, 0.78)), basic('#ffffff', { map: screenTex }));
  screen.position.set(0, 1.6, 0.562); screen.rotation.x = -0.18;
  g.add(screen);
  g.add(box(1.1, 0.12, 0.5, '#4a4350', { y: 1.0, z: 0.62, r: 0.04, rx: 0.3 }));
  g.add(cyl(0.03, 0.03, 0.22, '#4a4350', { x: -0.3, y: 1.12, z: 0.65, outline: 0.006 }), ball(0.08, '#ff4f4f', { x: -0.3, y: 1.27, z: 0.65, outline: 0.01 }));
  ['#ffd23f', '#3fe06a', '#4a90e2'].forEach((c, i) => g.add(cyl(0.07, 0.07, 0.05, c, { x: 0.1 + i * 0.2, y: 1.04, z: 0.66, rx: 0.3, outline: 0.008 })));
  g.add(star3d(0.18, 0.06, PAL.yellow, { y: 2.62, outline: 0.012 }));
  return g;
}
export function xylophone() {
  const g = group(box(3.4, 0.14, 0.2, PAL.wood, { y: 0.55, z: 0.5, rz: 0.0 }), box(3.4, 0.14, 0.2, PAL.wood, { y: 0.55, z: -0.5 }));
  const cols = RAINBOW.concat(['#ff8fc0', '#7fcbff']);
  for (let i = 0; i < 8; i++) {
    const len = 1.5 - i * 0.12;
    g.add(box(0.34, 0.1, len, cols[i], { x: -1.4 + i * 0.4, y: 0.7, r: 0.04, outline: 0.012 }));
    g.add(ball(0.04, '#ffffff', { x: -1.4 + i * 0.4, y: 0.77, z: len / 2 - 0.1, outline: 0 }));
  }
  g.add(cyl(0.12, 0.12, 0.6, PAL.wood, { x: -1.5, y: 0.3 }), cyl(0.12, 0.12, 0.6, PAL.wood, { x: 1.5, y: 0.3 }));
  g.add(at(group(cyl(0.02, 0.02, 0.8, PAL.woodL, { y: 0.4 }), ball(0.1, PAL.red, { y: 0.82 })), 1.9, 0.1, 0.9));
  return g;
}
export function drumKid(color = PAL.red, r = 0.7) {
  const g = group(cyl(r, r, 0.7, color, { y: 0.45, seg: 20 }), cyl(r + 0.02, r + 0.02, 0.08, PAL.white, { y: 0.82, seg: 20 }), cyl(r + 0.03, r + 0.03, 0.08, PAL.yellow, { y: 0.1, seg: 20 }));
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; g.add(box(0.06, 0.5, 0.04, PAL.gold, { x: Math.cos(a) * (r + 0.02), y: 0.45, z: Math.sin(a) * (r + 0.02), ry: -a, outline: 0 })); }
  g.add(ball(0.08, PAL.woodL, { x: -0.18, y: 0.9, z: 0.1 }), ball(0.08, PAL.woodL, { x: 0.2, y: 0.9, z: -0.1 }));
  return g;
}
// Rehal: a wooden book stand with an open book.
export function rehal(bookTex) {
  const g = group();
  const w = 1.4;
  g.add(box(w, 0.1, 0.9, PAL.woodD, { y: 0.35, r: 0.04, rx: -0.05 }));
  g.add(box(0.1, 0.85, 0.8, PAL.woodD, { x: -0.45, y: 0.4, r: 0.04, rz: 0.4 }), box(0.1, 0.85, 0.8, PAL.woodD, { x: 0.45, y: 0.4, r: 0.04, rz: -0.4 }));
  g.add(box(1.6, 0.06, 0.95, PAL.woodL, { y: 0.9, z: 0.0, rx: -0.55, r: 0.03 }));
  g.add(box(1.4, 0.05, 0.8, '#ffffff', { y: 0.96, z: 0.07, rx: -0.55, r: 0.02, outline: 0.012 }));
  if (bookTex) {
    const pg = new Mesh(cachedGeo('rehalpage', () => new PlaneGeometry(1.3, 0.72)), basic('#ffffff', { map: bookTex }));
    pg.position.set(0, 0.995, 0.1); pg.rotation.x = -Math.PI / 2 - 0.55 + Math.PI; pg.rotation.x = -0.55 - Math.PI / 2;
    pg.position.set(0, 1.0, 0.09);
    g.add(pg);
  }
  g.add(box(0.05, 0.04, 0.8, PAL.teal, { y: 0.98, z: 0.07, rx: -0.55, outline: 0 }));
  return g;
}
export function wardrobeCabinet() {
  const g = group(box(3.6, 3.4, 1.2, '#f2c1d4', { y: 1.7, r: 0.12 }), box(3.9, 0.3, 1.4, '#d99ab4', { y: 3.5, r: 0.1 }));
  g.add(box(1.5, 2.9, 0.1, '#ffe3ef', { x: -0.85, y: 1.7, z: 0.6, r: 0.06 }), box(1.5, 2.9, 0.1, '#ffe3ef', { x: 0.85, y: 1.7, z: 0.6, r: 0.06 }));
  g.add(ball(0.1, PAL.gold, { x: -0.2, y: 1.7, z: 0.7, outline: 0.012 }), ball(0.1, PAL.gold, { x: 0.2, y: 1.7, z: 0.7, outline: 0.012 }));
  g.add(heart3d(0.3, 0.1, PAL.red, { x: 0, y: 3.15, z: 0.62 }));
  // a dress and a hat peeking out of the top
  g.add(cone(0.35, 0.5, '#7fcbff', { x: -1.2, y: 3.8, z: 0.0, outline: 0.015 }), cyl(0.3, 0.3, 0.1, PAL.yellow, { x: 0.9, y: 3.7, outline: 0.012 }), ball(0.22, PAL.yellow, { x: 0.9, y: 3.88, outline: 0.012 }));
  return g;
}
export function mirrorStand() {
  const g = group(cyl(0.7, 0.8, 0.12, PAL.woodD, { y: 0.06 }), box(0.12, 2.4, 0.1, PAL.woodD, { x: -0.8, y: 1.3 }), box(0.12, 2.4, 0.1, PAL.woodD, { x: 0.8, y: 1.3 }));
  g.add(box(1.8, 2.7, 0.14, PAL.gold, { y: 1.55, r: 0.2, rx: -0.08 }));
  g.add(box(1.5, 2.4, 0.05, '#cfeeff', { y: 1.55, z: 0.08, r: 0.1, rx: -0.08, outline: 0.01, matOpts: { emissive: '#ffffff', emissiveIntensity: 0.2 } }));
  g.add(box(0.2, 1.4, 0.02, '#ffffff', { x: -0.3, y: 1.8, z: 0.12, rz: 0.3, rx: -0.08, outline: 0, matOpts: { transparent: true, opacity: 0.6 } }));
  g.add(star3d(0.22, 0.08, PAL.yellow, { y: 3.1, z: 0.05 }));
  return g;
}
export function hatRack() {
  const g = group(box(0.3, 2.4, 1.8, PAL.woodL, { y: 1.2, r: 0.06 }));
  const hats = [[0.3, -0.6, PAL.yellow], [0.3, 0, PAL.sky], [0.3, 0.6, PAL.pink]];
  hats.forEach(([x, z, c], i) => { g.add(cyl(0.05, 0.05, 0.25, PAL.woodD, { x: 0.3, y: 1.7 - i * 0.0, z, rz: Math.PI / 2, outline: 0.006 }), cyl(0.28, 0.28, 0.1, c, { x: 0.65, y: 1.7, z, rz: Math.PI / 2, outline: 0.01 }), ball(0.2, c, { x: 0.7, y: 1.7, z, outline: 0.01 })); });
  g.add(torus(0.3, 0.06, PAL.red, { x: 0.35, y: 0.8, z: -0.4, ry: Math.PI / 2, outline: 0.01 }), torus(0.3, 0.06, PAL.lav, { x: 0.35, y: 0.8, z: 0.4, ry: Math.PI / 2, outline: 0.01 }));
  return g;
}
export function blackboardStand(tex, w = 2.6, h = 1.7) {
  const g = group(box(w + 0.3, h + 0.3, 0.15, PAL.woodD, { y: 1.5, r: 0.06 }));
  const board = new Mesh(cachedGeo(`bb${w}${h}`, () => new PlaneGeometry(w, h)), basic('#ffffff', { map: tex }));
  board.position.set(0, 1.5, 0.085);
  g.add(board);
  g.add(box(w + 0.3, 0.1, 0.35, PAL.woodL, { y: 0.62, z: 0.12, r: 0.03 }), box(0.1, 0.8, 0.1, PAL.woodD, { x: -w / 2, y: 0.4 }), box(0.1, 0.8, 0.1, PAL.woodD, { x: w / 2, y: 0.4 }));
  return g;
}
export function easelKid(tex, color = PAL.sky) {
  const g = group(cyl(0.05, 0.05, 2.2, PAL.woodL, { x: -0.55, y: 1.05, z: 0.1, rz: 0.1 }), cyl(0.05, 0.05, 2.2, PAL.woodL, { x: 0.55, y: 1.05, z: 0.1, rz: -0.1 }), cyl(0.05, 0.05, 2.0, PAL.woodL, { y: 0.95, z: -0.45, rx: -0.35 }));
  g.add(box(1.5, 1.2, 0.1, '#ffffff', { y: 1.45, z: 0.2, rx: -0.1, r: 0.04, outline: 0.015 }));
  if (tex) { const p = new Mesh(cachedGeo('easelp', () => new PlaneGeometry(1.3, 1.0)), basic('#ffffff', { map: tex })); p.position.set(0, 1.45, 0.26); p.rotation.x = -0.1; g.add(p); }
  g.add(box(1.5, 0.08, 0.3, color, { y: 0.8, z: 0.32, r: 0.03 }));
  return g;
}
export function toyCar(color = PAL.red) {
  return group(box(0.7, 0.25, 0.4, color, { y: 0.22, r: 0.08 }), box(0.35, 0.22, 0.36, tint(color, 0.1), { x: -0.05, y: 0.45, r: 0.07 }), cyl(0.1, 0.1, 0.05, PAL.dark, { x: -0.22, y: 0.1, z: 0.2, rx: Math.PI / 2, outline: 0.008 }), cyl(0.1, 0.1, 0.05, PAL.dark, { x: 0.22, y: 0.1, z: 0.2, rx: Math.PI / 2, outline: 0.008 }), cyl(0.1, 0.1, 0.05, PAL.dark, { x: -0.22, y: 0.1, z: -0.2, rx: Math.PI / 2, outline: 0.008 }), cyl(0.1, 0.1, 0.05, PAL.dark, { x: 0.22, y: 0.1, z: -0.2, rx: Math.PI / 2, outline: 0.008 }));
}
export function alphaBlock(tex, size = 0.7, color = '#ffffff') {
  const g = group(box(size, size, size, color, { y: size / 2, r: size * 0.1 }));
  const mat = basic('#ffffff', { map: tex });
  const pg = cachedGeo(`abp${size}`, () => new PlaneGeometry(size * 0.86, size * 0.86));
  const f = new Mesh(pg, mat); f.position.set(0, size / 2, size / 2 + 0.006);
  const s = new Mesh(pg, mat); s.position.set(size / 2 + 0.006, size / 2, 0); s.rotation.y = Math.PI / 2;
  const t = new Mesh(pg, mat); t.position.set(0, size + 0.006, 0); t.rotation.x = -Math.PI / 2;
  g.add(f, s, t);
  return g;
}

// ---------- the yard ---------------------------------------------------------------------------------------------------
export function treeRound(h = 3.2, crown = '#5cc46a', trunk = PAL.woodD, fruit = null) {
  const g = group(cyl(0.22, 0.34, h * 0.55, trunk, { y: h * 0.275, seg: 10 }));
  const c = h * 0.62;
  [[0, c + 0.5, 0, 1.15], [-0.75, c + 0.1, 0.1, 0.85], [0.8, c + 0.15, -0.1, 0.8], [0.05, c + 1.2, 0.05, 0.8], [0.1, c + 0.2, -0.75, 0.75]].forEach(([x, y, z, r]) => g.add(ball(r, crown, { x, y, z, outline: 0.03, seg: 14 })));
  if (fruit) [[-0.6, c + 0.5, 0.85], [0.7, c, 0.8], [0.1, c + 1.0, 0.7], [-0.9, c + 0.0, 0.3]].forEach(([x, y, z]) => g.add(ball(0.15, fruit, { x, y, z, outline: 0.012, seg: 8 })));
  return g;
}
export function treeCone(h = 4, color = '#4cad6a') {
  return group(cyl(0.2, 0.28, h * 0.3, PAL.woodD, { y: h * 0.15, seg: 8 }), cone(1.3, h * 0.5, color, { y: h * 0.45, seg: 10 }), cone(1.0, h * 0.4, tint(color, 0.06), { y: h * 0.68, seg: 10 }), cone(0.65, h * 0.32, tint(color, 0.1), { y: h * 0.88, seg: 10 }));
}
export function bush(r = 0.8, color = '#58c46a', flower = null) {
  const g = group(ball(r, color, { y: r * 0.7, sy: 0.8, seg: 12, outline: 0.025 }), ball(r * 0.7, tint(color, 0.05), { x: r * 0.8, y: r * 0.5, sy: 0.8, seg: 10, outline: 0.02 }), ball(r * 0.65, tint(color, -0.04), { x: -r * 0.75, y: r * 0.45, sy: 0.8, seg: 10, outline: 0.02 }));
  if (flower) for (let i = 0; i < 5; i++) g.add(ball(0.09, flower, { x: Math.cos(i * 1.3) * r * 0.8, y: r * 0.7 + Math.sin(i * 2.1) * 0.2, z: Math.sin(i * 1.3) * r * 0.8, seg: 6, outline: 0 }));
  return g;
}
export function benchWood(w = 1.8, color = PAL.woodL) {
  return group(box(w, 0.12, 0.6, color, { y: 0.5, r: 0.04 }), box(w, 0.5, 0.1, color, { y: 0.85, z: -0.28, r: 0.04, rx: -0.1 }), box(0.12, 0.5, 0.55, PAL.woodD, { x: -w / 2 + 0.15, y: 0.25, r: 0.03 }), box(0.12, 0.5, 0.55, PAL.woodD, { x: w / 2 - 0.15, y: 0.25, r: 0.03 }));
}
export function slideKid() {
  const g = group();
  g.add(box(1.4, 0.14, 1.4, PAL.sky, { y: 1.9, r: 0.05 }));
  for (const [x, z] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) g.add(cyl(0.07, 0.07, 1.9, PAL.yellow, { x, y: 0.95, z, outline: 0.01 }));
  g.add(box(1.4, 0.1, 0.08, PAL.red, { y: 2.55, z: -0.66, r: 0.02 }), box(0.08, 0.5, 1.4, PAL.red, { x: -0.66, y: 2.2 }), box(0.08, 0.5, 1.4, PAL.red, { x: 0.66, y: 2.2 }));
  g.add(box(1.0, 0.1, 2.9, PAL.orange, { y: 1.05, z: 2.0, rx: 0.62, r: 0.04, outline: 0.015 }), box(0.08, 0.3, 2.9, PAL.red, { x: -0.5, y: 1.15, z: 2.0, rx: 0.62 }), box(0.08, 0.3, 2.9, PAL.red, { x: 0.5, y: 1.15, z: 2.0, rx: 0.62 }));
  for (let i = 0; i < 5; i++) g.add(box(0.9, 0.08, 0.2, PAL.woodL, { y: 0.2 + i * 0.35, z: -0.82 - 0.06 * i, outline: 0.008 }));
  g.add(cyl(0.05, 0.05, 1.2, PAL.red, { x: -0.6, y: 2.5, z: -0.6 }), cone(0.7, 0.55, PAL.pink, { y: 3.1, seg: 6 }));
  return g;
}
export function swingSet() {
  const g = group(cyl(0.08, 0.08, 3.1, PAL.red, { x: -2.1, y: 1.5, rz: 0.2, z: 0.4 }), cyl(0.08, 0.08, 3.1, PAL.red, { x: -2.1, y: 1.5, rz: 0.2, z: -0.4, rx: 0 }), cyl(0.08, 0.08, 3.1, PAL.red, { x: 2.1, y: 1.5, rz: -0.2, z: 0.4 }), cyl(0.08, 0.08, 3.1, PAL.red, { x: 2.1, y: 1.5, rz: -0.2, z: -0.4 }));
  g.add(cyl(0.08, 0.08, 4.4, PAL.yellow, { y: 3.0, rz: Math.PI / 2 }));
  const seats = [-0.9, 0.9].map((x) => { const s = group(cyl(0.012, 0.012, 2.1, '#5b3f33', { x: -0.28, y: 1.05, outline: 0 }), cyl(0.012, 0.012, 2.1, '#5b3f33', { x: 0.28, y: 1.05, outline: 0 }), box(0.7, 0.08, 0.3, PAL.sky, { y: 0.1, r: 0.03, outline: 0.012 })); s.position.set(x, 1.95, 0); return live(s); });
  seats.forEach((s) => g.add(s));
  g.userData.seats = seats;
  return g;
}
export function seesawKid() {
  const g = group(prism(0.6, 0.6, 0.4, PAL.yellow, { y: 0.32 }));
  const plank = live(group(box(3.6, 0.12, 0.45, PAL.woodL, { r: 0.04, outline: 0.015 }), ball(0.16, PAL.red, { x: -1.6, y: 0.18, outline: 0.012 }), ball(0.16, PAL.red, { x: 1.6, y: 0.18, outline: 0.012 }), box(0.1, 0.3, 0.4, PAL.sky, { x: -1.3, y: 0.2 }), box(0.1, 0.3, 0.4, PAL.pink, { x: 1.3, y: 0.2 })));
  plank.position.y = 0.72;
  g.add(plank);
  g.userData.plank = plank;
  return g;
}
export function climberDome() {
  const g = group();
  const cols = [PAL.red, PAL.yellow, PAL.blue, PAL.green];
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; g.add(torus(1.5, 0.07, cols[i % 4], { y: 0.05, outline: 0.012, ry: a, arc: Math.PI })); }
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g.add(cyl(0.05, 0.05, 1.7, cols[i % 4], { x: Math.cos(a) * 0.75, y: 0.85, z: Math.sin(a) * 0.75, rz: Math.cos(a) * 0.5, rx: -Math.sin(a) * 0.5, outline: 0.01 })); }
  g.add(ball(0.2, PAL.pink, { y: 1.75, outline: 0.015 }));
  g.add(cyl(1.2, 1.2, 0.08, PAL.green, { y: 0.04, seg: 20 }));
  return g;
}
export function sandboxBox(w, d) {
  const g = group();
  const h = 0.4;
  g.add(box(w, h, 0.3, PAL.woodL, { y: h / 2, z: -d / 2 + 0.15, r: 0.05 }), box(w, h, 0.3, PAL.woodL, { y: h / 2, z: d / 2 - 0.15, r: 0.05 }), box(0.3, h, d - 0.6, PAL.woodL, { x: -w / 2 + 0.15, y: h / 2, r: 0.05 }), box(0.3, h, d - 0.6, PAL.woodL, { x: w / 2 - 0.15, y: h / 2, r: 0.05 }));
  const sand = new Mesh(cachedGeo('sandfill', () => new PlaneGeometry(1, 1)), lambert('#f4d9a0'));
  sand.scale.set(w - 0.6, d - 0.6, 1); sand.rotation.x = -Math.PI / 2; sand.position.y = 0.3; sand.receiveShadow = true;
  g.add(sand);
  // sand castle, bucket and spade
  g.add(cyl(0.5, 0.65, 0.4, '#e8c98a', { x: -1.8, y: 0.5, z: 0.5, seg: 12 }), cyl(0.12, 0.2, 0.3, '#e8c98a', { x: -1.8, y: 0.85, z: 0.5, seg: 10 }), cone(0.18, 0.2, PAL.red, { x: -1.8, y: 1.1, z: 0.5, outline: 0.01 }));
  g.add(cyl(0.22, 0.17, 0.3, PAL.sky, { x: 1.7, y: 0.45, z: -0.6, outline: 0.012 }), box(0.12, 0.4, 0.03, PAL.red, { x: 2.1, y: 0.5, z: 0.4, rz: 0.5 }), box(0.2, 0.18, 0.03, PAL.red, { x: 2.28, y: 0.7, z: 0.4, rz: 0.5 }));
  return g;
}
export function lampPost(color = PAL.yellow) {
  return group(cyl(0.06, 0.09, 2.6, '#4a4350', { y: 1.3, seg: 8 }), ball(0.28, '#fff3b0', { y: 2.75, outline: 0.015, matOpts: { emissive: '#fff3b0', emissiveIntensity: 0.4 } }), cone(0.34, 0.25, color, { y: 3.05, outline: 0.012 }));
}
export function fountain(r = 1.6) {
  const g = group(cyl(r, r + 0.1, 0.5, '#e8dccb', { y: 0.25, seg: 20 }), torus(r, 0.12, '#f4ece0', { y: 0.5, rx: Math.PI / 2, outline: 0.015 }), cyl(r - 0.12, r - 0.12, 0.04, '#7fd0ff', { y: 0.42, seg: 20, outline: 0 }));
  g.add(cyl(0.22, 0.3, 0.9, '#e8dccb', { y: 0.7 }), cyl(0.6, 0.45, 0.14, '#f4ece0', { y: 1.2 }), cyl(0.07, 0.1, 0.6, '#e8dccb', { y: 1.6 }), ball(0.26, '#9fe0ff', { y: 2.0, outline: 0.012, matOpts: { transparent: true, opacity: 0.85 } }));
  const drops = [0, 1, 2, 3, 4, 5].map((i) => live(ball(0.09, '#bfeaff', { y: 1.6, seg: 6, outline: 0, matOpts: { transparent: true, opacity: 0.85 } })));
  drops.forEach((d) => g.add(d));
  g.userData.drops = drops;
  return g;
}
export function gazebo() {
  const g = group();
  for (const [x, z] of [[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]]) g.add(cyl(0.14, 0.16, 3.0, '#ffffff', { x, y: 1.5, z, seg: 10 }));
  g.add(cone(3.1, 1.5, PAL.pink, { y: 3.75, seg: 8, ry: Math.PI / 8 }), cyl(0.15, 0.15, 0.7, '#ffffff', { y: 4.5 }), ball(0.2, PAL.yellow, { y: 4.9, outline: 0.012 }));
  g.add(cyl(2.1, 2.1, 0.12, PAL.woodL, { y: 0.06, seg: 8 }));
  g.add(torus(1.95, 0.05, PAL.yellow, { y: 2.85, rx: Math.PI / 2, outline: 0.01 }));
  return g;
}
export function hopscotch() {
  const g = group();
  const cols = [PAL.red, PAL.orange, PAL.yellow, PAL.green, PAL.sky, PAL.lav];
  const cells = [[0, 0], [0, 1], [-0.5, 2], [0.5, 2], [0, 3], [0, 4], [-0.5, 5], [0.5, 5], [0, 6]];
  cells.forEach(([x, z], i) => {
    const m = new Mesh(cachedGeo('hopcell', () => new PlaneGeometry(0.96, 0.96)), lambert(cols[i % 6]));
    m.rotation.x = -Math.PI / 2; m.position.set(x * 1.05, 0.02, -z * 1.05 + 3.0); m.receiveShadow = true; g.add(m);
  });
  return g;
}
export function numberTiles(textures) {
  const g = group();
  textures.forEach((t, i) => { const m = new Mesh(cachedGeo('numtile', () => new PlaneGeometry(0.7, 0.7)), basic('#ffffff', { map: t, transparent: true })); m.rotation.x = -Math.PI / 2; m.position.set(0, 0.03, 3.0 - i * 1.05); g.add(m); });
  return g;
}
export function fenceRun(len, color = '#ffffff', h = 1.0) {
  const g = group(box(len, 0.1, 0.1, color, { y: h * 0.85, r: 0.03, outline: 0.012 }), box(len, 0.1, 0.1, color, { y: h * 0.4, r: 0.03, outline: 0.012 }));
  const n = Math.floor(len / 0.5);
  for (let i = 0; i <= n; i++) g.add(box(0.14, h, 0.1, color, { x: -len / 2 + (i * len) / n, y: h / 2, r: 0.04, outline: 0.01 }));
  return g;
}
export function flowerBed(w, d, colors = ['#ff8fc0', '#ffd23f', '#b79cff', '#ff9a3c', '#7fcbff']) {
  const g = group(box(w, 0.4, 0.2, PAL.woodL, { y: 0.2, z: -d / 2 + 0.1, r: 0.04 }), box(w, 0.4, 0.2, PAL.woodL, { y: 0.2, z: d / 2 - 0.1, r: 0.04 }), box(0.2, 0.4, d - 0.4, PAL.woodL, { x: -w / 2 + 0.1, y: 0.2, r: 0.04 }), box(0.2, 0.4, d - 0.4, PAL.woodL, { x: w / 2 - 0.1, y: 0.2, r: 0.04 }));
  const soil = new Mesh(cachedGeo('soil', () => new PlaneGeometry(1, 1)), lambert('#8a5a3c'));
  soil.scale.set(w - 0.4, d - 0.4, 1); soil.rotation.x = -Math.PI / 2; soil.position.y = 0.3; g.add(soil);
  const rng = createRng('bed' + w + d);
  const n = Math.floor(w * d * 1.6);
  for (let i = 0; i < n; i++) {
    const x = (rng.next() - 0.5) * (w - 0.8), z = (rng.next() - 0.5) * (d - 0.8), c = colors[i % colors.length];
    g.add(cyl(0.015, 0.015, 0.4, '#3fa64a', { x, y: 0.5, z, seg: 4, outline: 0 }), ball(0.13, c, { x, y: 0.72, z, seg: 8, outline: 0.012 }), ball(0.05, '#ffd23f', { x, y: 0.78, z: z + 0.07, seg: 5, outline: 0 }));
  }
  return g;
}
export function vegPatch(w, d) {
  const g = group(box(w, 0.4, 0.2, PAL.woodL, { y: 0.2, z: -d / 2 + 0.1, r: 0.04 }), box(w, 0.4, 0.2, PAL.woodL, { y: 0.2, z: d / 2 - 0.1, r: 0.04 }), box(0.2, 0.4, d - 0.4, PAL.woodL, { x: -w / 2 + 0.1, y: 0.2, r: 0.04 }), box(0.2, 0.4, d - 0.4, PAL.woodL, { x: w / 2 - 0.1, y: 0.2, r: 0.04 }));
  const soil = new Mesh(cachedGeo('soil', () => new PlaneGeometry(1, 1)), lambert('#8a5a3c'));
  soil.scale.set(w - 0.4, d - 0.4, 1); soil.rotation.x = -Math.PI / 2; soil.position.y = 0.3; g.add(soil);
  const n = Math.floor((w - 0.8) / 0.55);
  for (let i = 0; i <= n; i++) for (let r = -1; r <= 1; r += 2) {
    const x = -((n * 0.55) / 2) + i * 0.55, z = r * (d / 4);
    if ((i + (r > 0 ? 1 : 0)) % 3 === 0) g.add(cone(0.1, 0.34, PAL.orange, { x, y: 0.45, z, rx: Math.PI, seg: 6, outline: 0.01 }), cone(0.14, 0.34, '#5cc46a', { x, y: 0.7, z, seg: 6, outline: 0.01 }));
    else if ((i + (r > 0 ? 1 : 0)) % 3 === 1) g.add(ball(0.22, '#a8e07a', { x, y: 0.5, z, sy: 0.85, seg: 8, outline: 0.012 }), ball(0.14, '#c9f0a0', { x, y: 0.55, z, seg: 6, outline: 0 }));
    else g.add(ball(0.2, '#ff5a5a', { x, y: 0.5, z, seg: 8, outline: 0.012 }), cone(0.09, 0.1, '#3fa64a', { x, y: 0.72, z, seg: 5, outline: 0 }));
  }
  return g;
}
// Scatter many copies of one small shape with a single draw call.
export function scatter(geometry, material, items, { castShadow = false } = {}) {
  const im = new InstancedMesh(geometry, material, items.length);
  const d = new Object3D(); const col = new Color();
  items.forEach((it, i) => {
    d.position.set(it.x, it.y || 0, it.z); d.rotation.set(0, it.ry || 0, 0); d.scale.set(it.sx || it.s || 1, it.sy || it.s || 1, it.sz || it.s || 1); d.updateMatrix();
    im.setMatrixAt(i, d.matrix);
    if (it.c) im.setColorAt(i, col.set(it.c));
  });
  im.castShadow = castShadow;
  im.frustumCulled = true;
  im.computeBoundingSphere && im.computeBoundingSphere();
  return im;
}
export { DoubleSide, CylinderGeometry, SphereGeometry, ConeGeometry, capsule, part, decal, basic, canvasTexture, makeCanvas, roundRect, grain };
