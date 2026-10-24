// The 3D centrepiece of each learning station. Every builder returns
// { obj, radius, update?(t) } with the object standing on the floor at the origin.
import { InstancedMesh, Object3D, Color, SphereGeometry } from 'three';
import { box, ball, cyl, cone, torus, capsule, star3d, heart3d, prism, decal, group, at, cachedGeo, live } from './kit.js';
import { toon, makeCanvas, canvasTexture, roundRect, drawStar, tint } from './paint.js';
import { FONT } from '../art/svg.js';

const PAL = { pink: '#ff8fc0', lav: '#b79cff', sky: '#7fcbff', mint: '#6fdcb4', butter: '#ffd65a', peach: '#ffa86b', red: '#ff6b6b', cream: '#fff6e6', wood: '#c48a5a', woodD: '#9a6340', white: '#ffffff', grey: '#c9c4d6', green: '#5cc46a', blue: '#4a90e2', orange: '#ff9a3c', purple: '#9b6bff', yellow: '#ffd23f', dark: '#4a4350' };
const RAINBOW = ['#ff6b6b', '#ff9a3c', '#ffd23f', '#5cc46a', '#4a90e2', '#9b6bff'];

// ---- textures for block faces -----------------------------------------------
const faceCache = new Map();
export function faceTexture(kind, value, color) {
  const key = `${kind}|${value}|${color}`;
  if (faceCache.has(key)) return faceCache.get(key);
  const S = 256, c = makeCanvas(S, S), ctx = c.getContext('2d');
  ctx.fillStyle = '#fffaf1';
  roundRect(ctx, 14, 14, S - 28, S - 28, 40); ctx.fill();
  ctx.lineWidth = 8; ctx.strokeStyle = tint(color, -0.12); ctx.stroke();
  ctx.fillStyle = color; ctx.strokeStyle = '#5b3f33'; ctx.lineWidth = 12; ctx.lineJoin = 'round';
  if (kind === 'text') {
    ctx.font = `700 ${String(value).length > 1 ? 120 : 170}px ${FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeText(value, S / 2, S / 2 + 10); ctx.fillText(value, S / 2, S / 2 + 10);
  } else {
    ctx.beginPath();
    if (value === 'circle') ctx.arc(S / 2, S / 2, 70, 0, Math.PI * 2);
    else if (value === 'square') ctx.rect(S / 2 - 64, S / 2 - 64, 128, 128);
    else if (value === 'triangle') { ctx.moveTo(S / 2, 52); ctx.lineTo(S - 54, S - 62); ctx.lineTo(54, S - 62); ctx.closePath(); }
    else if (value === 'star') drawStar(ctx, S / 2, S / 2 + 8, 86, 38);
    else if (value === 'heart') { ctx.moveTo(S / 2, 200); ctx.bezierCurveTo(30, 120, 70, 30, S / 2, 90); ctx.bezierCurveTo(186, 30, 226, 120, S / 2, 200); }
    ctx.stroke(); ctx.fill();
  }
  const t = canvasTexture(c);
  faceCache.set(key, t);
  return t;
}
function letterBlock(size, color, kind, value, faceColor) {
  const g = group(box(size, size, size, color, { r: size * 0.1 }));
  const tex = faceTexture(kind, value, faceColor || tint(color, -0.25));
  const s = size * 0.86;
  g.add(decal(tex, s, s, { z: size / 2 + 0.006 }));
  g.add(decal(tex, s, s, { x: size / 2 + 0.006, ry: Math.PI / 2 }));
  g.add(decal(tex, s, s, { x: -size / 2 - 0.006, ry: -Math.PI / 2 }));
  g.add(decal(tex, s, s, { y: size / 2 + 0.006, rx: -Math.PI / 2 }));
  return g;
}

// ---- instanced sphere heaps (ball pit, fruit, beads) -------------------------
function heap(count, radius, colors, place) {
  const geo = cachedGeo(`heap${radius}`, () => new SphereGeometry(radius, 14, 10));
  const im = new InstancedMesh(geo, toon('#ffffff'), count);
  const d = new Object3D();
  const col = new Color();
  for (let i = 0; i < count; i++) {
    place(i, d.position);
    d.updateMatrix();
    im.setMatrixAt(i, d.matrix);
    im.setColorAt(i, col.set(colors[i % colors.length]));
  }
  im.castShadow = true;
  return im;
}

const B = {};

B.blocks = (st) => {
  const kind = st.blocks === 'shapes' ? 'shape' : 'text';
  const vals = st.blocks === '123' ? ['1', '2', '3'] : st.blocks === 'shapes' ? ['circle', 'triangle', 'square'] : ['A', 'B', 'C'];
  const cols = [PAL.pink, PAL.sky, PAL.butter];
  const fcols = ['#e0457f', '#2f7fd6', '#e0a000'];
  const g = group(
    at(letterBlock(1.1, cols[0], kind, vals[0], fcols[0]), -0.62, 0.55, 0.1, 0.15),
    at(letterBlock(1.1, cols[1], kind, vals[1], fcols[1]), 0.6, 0.55, -0.05, -0.2),
    at(letterBlock(1.05, cols[2], kind, vals[2], fcols[2]), 0.0, 1.62, 0.02, 0.35),
    at(letterBlock(0.55, PAL.mint, 'shape', 'star', '#2fae7a'), 1.05, 0.275, 0.85, 0.6),
    at(letterBlock(0.5, PAL.lav, 'shape', 'heart', '#7f5ad6'), -1.0, 0.25, 0.9, -0.4)
  );
  return { obj: g, radius: 1.35 };
};

B.appleTree = () => {
  const g = group(cyl(0.22, 0.32, 1.9, PAL.woodD, { y: 0.95 }));
  const leaves = [[0, 2.5, 0, 1.0], [-0.65, 2.2, 0.2, 0.75], [0.7, 2.25, 0.1, 0.72], [0.1, 3.05, -0.1, 0.72], [0, 2.3, -0.55, 0.7]];
  leaves.forEach(([x, y, z, r]) => g.add(ball(r, PAL.green, { x, y, z, outline: 0.03 })));
  const apples = [[-0.5, 2.6, 0.75], [0.45, 2.1, 0.8], [0.9, 2.6, 0.45], [-0.95, 2.0, 0.55], [0.2, 3.3, 0.5], [-0.3, 1.95, 0.9]];
  apples.forEach(([x, y, z]) => g.add(ball(0.17, '#ff4f4f', { x, y, z, outline: 0.018 })));
  const basket = group(cyl(0.42, 0.32, 0.36, '#d9a06e', { y: 0.18 }), ball(0.16, '#ff4f4f', { x: -0.1, y: 0.4, z: 0.05 }), ball(0.16, '#ff4f4f', { x: 0.14, y: 0.42, z: -0.05 }), torus(0.3, 0.035, PAL.woodD, { y: 0.5, rx: Math.PI / 2 }));
  g.add(at(basket, 0.9, 0, 0.8));
  return { obj: g, radius: 1.15 };
};

function roofedBuilding(w, h, d, wall, roof, door) {
  const g = group(box(w, h, d, wall, { y: h / 2, r: 0.06 }));
  g.add(at(prism(w + 0.4, 1.0, d + 0.3, roof), 0, h + 0.5, 0));
  g.add(box(0.8, 1.15, 0.08, door, { x: 0, y: 0.58, z: d / 2 + 0.03, r: 0.04 }));
  return g;
}
B.barn = () => {
  const g = roofedBuilding(2.1, 1.5, 1.6, '#ff6b6b', '#c84a4a', PAL.cream);
  g.add(box(0.7, 0.07, 0.04, PAL.white, { x: 0, y: 0.58, z: 0.86, rz: 0.95, r: 0.02, outline: 0 }));
  g.add(box(0.7, 0.07, 0.04, PAL.white, { x: 0, y: 0.58, z: 0.86, rz: -0.95, r: 0.02, outline: 0 }));
  g.add(box(0.5, 0.4, 0.06, PAL.cream, { x: 0, y: 1.95, z: 0.72, r: 0.03 }));
  // cow peeking out
  const cow = group(ball(0.36, PAL.white), ball(0.2, '#ffb7c5', { y: -0.12, z: 0.26, sx: 1.2, sy: 0.8 }), ball(0.05, '#2e1f1a', { x: -0.13, y: 0.08, z: 0.31, outline: 0 }), ball(0.05, '#2e1f1a', { x: 0.13, y: 0.08, z: 0.31, outline: 0 }),
    ball(0.1, '#2e1f1a', { x: 0.2, y: 0.2, z: 0.18, outline: 0, sy: 0.6 }), cone(0.06, 0.18, '#ffe7a8', { x: -0.2, y: 0.36, rz: 0.4 }), cone(0.06, 0.18, '#ffe7a8', { x: 0.2, y: 0.36, rz: -0.4 }),
    ball(0.12, PAL.white, { x: -0.38, y: 0.12, sx: 1.4, sy: 0.6 }), ball(0.12, PAL.white, { x: 0.38, y: 0.12, sx: 1.4, sy: 0.6 }));
  g.add(at(cow, 1.25, 0.55, 0.9, -0.4));
  const hay = cyl(0.32, 0.32, 0.5, '#ffd36b', { rz: Math.PI / 2 });
  g.add(at(hay, -1.3, 0.32, 0.7));
  return { obj: g, radius: 1.45 };
};

B.playHouse = () => {
  const g = group(box(1.7, 1.4, 1.5, '#fff1d6', { y: 0.7 }));
  g.add(cone(1.35, 1.0, '#ff7eb6', { y: 1.9, seg: 4, ry: Math.PI / 4 }));
  g.add(box(0.6, 0.95, 0.06, '#7fcbff', { y: 0.48, z: 0.77, r: 0.05 }));
  g.add(cyl(0.22, 0.22, 0.06, '#cfeeff', { x: 0.55, y: 1.0, z: 0.76, rx: Math.PI / 2 }));
  g.add(cyl(0.22, 0.22, 0.06, '#cfeeff', { x: -0.55, y: 1.0, z: 0.76, rx: Math.PI / 2 }));
  g.add(ball(0.24, '#ff4f4f', { x: -0.85, y: 0.24, z: 1.0 }));
  g.add(ball(0.24, '#3d8bfd', { x: -0.3, y: 0.24, z: 1.15 }));
  g.add(ball(0.24, '#ffd23f', { x: 0.35, y: 0.24, z: 1.12 }));
  g.add(cyl(0.18, 0.16, 0.3, '#4cc46a', { x: 0.95, y: 0.15, z: 0.95 }));
  g.add(cyl(0.18, 0.16, 0.3, '#9b6bff', { x: 1.15, y: 0.15, z: 0.45 }));
  return { obj: g, radius: 1.3 };
};

B.books = () => {
  const g = group(
    box(1.7, 0.36, 1.2, '#b79cff', { y: 0.18, ry: 0.1 }), box(1.62, 0.3, 1.12, '#fff6e6', { y: 0.18, x: 0.06, ry: 0.1, outline: 0 }),
    box(1.5, 0.34, 1.05, '#7fcbff', { y: 0.53, ry: -0.15 }), box(1.42, 0.28, 0.97, '#fff6e6', { y: 0.53, x: 0.06, ry: -0.15, outline: 0 }),
    box(1.3, 0.3, 0.95, '#ff8fc0', { y: 0.85, ry: 0.25 })
  );
  const open = group(box(0.75, 0.06, 0.9, '#fffaf1', { x: -0.38, rz: 0.18 }), box(0.75, 0.06, 0.9, '#fffaf1', { x: 0.38, rz: -0.18 }), box(0.08, 0.5, 0.05, '#ff6b6b', { x: 0.2, y: -0.2, z: 0.4, outline: 0 }));
  g.add(at(open, 0, 1.12, 0, 0.25));
  g.add(at(letterBlock(0.5, PAL.butter, 'text', 'K', '#e0a000'), 1.15, 0.25, 0.75, 0.3));
  return { obj: g, radius: 1.2 };
};

function boardTexture(kind) {
  const W = 512, H = 384, c = makeCanvas(W, H), ctx = c.getContext('2d');
  ctx.fillStyle = kind === 'paint' ? '#fffaf1' : '#3f6b55'; ctx.fillRect(0, 0, W, H);
  ctx.lineJoin = 'round';
  if (kind === 'paint') {
    [['#ff5a5a', 120, 130], ['#ffd23f', 250, 110], ['#3d8bfd', 380, 140], ['#4cc46a', 180, 260], ['#9b6bff', 330, 270]].forEach(([col, x, y]) => {
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 56, 0, Math.PI * 2); ctx.fill();
    });
  } else {
    ctx.font = `700 150px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff'; ctx.fillText('Aa', W * 0.3, H * 0.52);
    ctx.fillStyle = '#ffe27a'; ctx.fillText('Bb', W * 0.72, H * 0.52);
  }
  return canvasTexture(c);
}
const boardTex = {};
B.easel = (st) => {
  const kind = st.board === 'paint' ? 'paint' : 'letters';
  boardTex[kind] = boardTex[kind] || boardTexture(kind);
  const g = group(
    cyl(0.06, 0.06, 2.6, PAL.wood, { x: -0.7, y: 1.25, z: 0.15, rz: 0.12 }), cyl(0.06, 0.06, 2.6, PAL.wood, { x: 0.7, y: 1.25, z: 0.15, rz: -0.12 }),
    cyl(0.06, 0.06, 2.4, PAL.wood, { y: 1.15, z: -0.55, rx: -0.38 }),
    box(1.9, 1.45, 0.12, PAL.wood, { y: 1.65, z: 0.3, rx: -0.12 }), box(1.8, 0.1, 0.3, PAL.wood, { y: 0.9, z: 0.42 })
  );
  g.add(decal(boardTex[kind], 1.66, 1.25, { y: 1.65, z: 0.375, rx: -0.12 }));
  const palette = group(cyl(0.45, 0.45, 0.05, '#f2d2a4', { sz: 0.75 }), ball(0.08, '#ff5a5a', { x: -0.2, y: 0.04, outline: 0 }), ball(0.08, '#3d8bfd', { x: 0, y: 0.04, z: 0.18, outline: 0 }), ball(0.08, '#ffd23f', { x: 0.2, y: 0.04, outline: 0 }));
  g.add(at(palette, 0.9, 0.04, 0.9, 0.5));
  return { obj: g, radius: 1.1 };
};

B.train = () => {
  const g = group();
  const engine = group(box(1.1, 0.8, 0.9, '#ff6b6b', { y: 0.65 }), box(0.7, 0.75, 0.86, '#ff6b6b', { x: -0.25, y: 1.35 }), box(0.5, 0.4, 0.88, '#cfeeff', { x: -0.25, y: 1.4, outline: 0.015 }),
    cyl(0.38, 0.38, 0.8, '#4a90e2', { x: 0.45, y: 1.2, rz: Math.PI / 2 }), cyl(0.12, 0.18, 0.5, '#4a4350', { x: 0.65, y: 1.75 }), box(0.85, 0.12, 0.95, '#c84a4a', { x: -0.25, y: 1.78 }));
  [-0.3, 0.35].forEach((x) => [-0.46, 0.46].forEach((z) => engine.add(cyl(0.22, 0.22, 0.1, '#4a4350', { x, y: 0.25, z, rx: Math.PI / 2 }))));
  g.add(at(engine, 0.85, 0, 0));
  const wagon = group(box(0.95, 0.5, 0.85, '#ffd65a', { y: 0.55 }), at(letterBlock(0.45, PAL.pink, 'text', 'A', '#e0457f'), -0.22, 1.02, 0, 0.2), at(letterBlock(0.45, PAL.mint, 'text', 'B', '#2fae7a'), 0.25, 1.02, 0, -0.2));
  [-0.3, 0.3].forEach((x) => [-0.44, 0.44].forEach((z) => wagon.add(cyl(0.18, 0.18, 0.1, '#4a4350', { x, y: 0.22, z, rx: Math.PI / 2 }))));
  g.add(at(wagon, -0.45, 0, 0));
  g.add(box(2.8, 0.04, 1.2, '#b07a52', { y: 0.02, outline: 0 }));
  g.rotation.y = 0.35;
  return { obj: g, radius: 1.4 };
};

B.abacus = () => {
  const g = group(box(0.16, 2.0, 0.4, PAL.wood, { x: -1.0, y: 1.0 }), box(0.16, 2.0, 0.4, PAL.wood, { x: 1.0, y: 1.0 }), box(2.4, 0.18, 0.7, PAL.wood, { y: 0.09 }));
  [0.6, 1.0, 1.4, 1.8].forEach((y, row) => {
    g.add(cyl(0.03, 0.03, 2.0, PAL.grey, { y, rz: Math.PI / 2, outline: 0 }));
    for (let i = 0; i < 5; i++) g.add(ball(0.14, RAINBOW[(row + i) % RAINBOW.length], { x: -0.62 + i * 0.3 - (row % 2) * 0.12, y, sx: 0.9, outline: 0.015 }));
  });
  return { obj: g, radius: 1.25 };
};

B.rings = () => {
  const g = group(cyl(0.8, 0.85, 0.22, PAL.wood, { y: 0.11 }), cyl(0.09, 0.09, 1.9, PAL.wood, { y: 1.05 }));
  const sizes = [0.62, 0.55, 0.48, 0.41, 0.34, 0.28];
  sizes.forEach((r, i) => g.add(torus(r, 0.13, RAINBOW[i], { y: 0.36 + i * 0.25, rx: Math.PI / 2, outline: 0.02 })));
  g.add(ball(0.24, PAL.red, { y: 2.05 }));
  return { obj: g, radius: 1.0 };
};

B.ballPit = () => {
  const g = group(cyl(1.25, 1.3, 0.55, '#7fcbff', { y: 0.27, open: false }), torus(1.25, 0.16, '#ff8fc0', { y: 0.56, rx: Math.PI / 2 }));
  const cols = ['#ff5a5a', '#3d8bfd', '#ffd23f', '#4cc46a', '#ff9a3c', '#9b6bff', '#ff8ccf'];
  let s = 7;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  g.add(heap(70, 0.17, cols, (i, p) => { const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 1.05; p.set(Math.cos(a) * r, 0.62 + rnd() * 0.18 + (i > 50 ? 0.12 : 0), Math.sin(a) * r); }));
  return { obj: g, radius: 1.45 };
};

B.crayons = () => {
  const g = group(box(1.6, 0.9, 0.9, '#ffd65a', { y: 0.45 }), box(1.62, 0.25, 0.92, '#4cc46a', { y: 0.65, outline: 0 }));
  ['#ff5a5a', '#3d8bfd', '#4cc46a', '#9b6bff', '#ff9a3c'].forEach((c, i) => {
    const x = -0.6 + i * 0.3, h = 1.1 + (i % 2) * 0.25;
    g.add(cyl(0.12, 0.12, h, c, { x, y: 0.5 + h / 2 - 0.3, z: 0 }));
    g.add(cone(0.12, 0.28, tint(c, 0.1), { x, y: 0.5 + h - 0.16, z: 0 }));
  });
  const lying = group(cyl(0.12, 0.12, 1.0, '#ff8ccf', { rz: Math.PI / 2 }), cone(0.12, 0.28, '#ff8ccf', { x: 0.64, rz: -Math.PI / 2 }));
  g.add(at(lying, 0.2, 0.12, 0.9, 0.4));
  return { obj: g, radius: 1.15 };
};

B.shapeTower = () => {
  const g = group(box(1.2, 1.0, 1.2, '#7fcbff', { y: 0.5, r: 0.1 }), cyl(0.55, 0.55, 0.8, '#ff8fc0', { y: 1.4 }), cone(0.55, 0.9, '#ffd65a', { y: 2.25 }), ball(0.25, '#6fdcb4', { y: 2.85 }));
  g.add(at(star3d(0.35, 0.18, '#ffd23f'), 0.95, 0.38, 0.75, 0.4));
  g.add(at(prism(0.6, 0.5, 0.3, '#9b6bff'), -0.95, 0.27, 0.7, -0.3));
  return { obj: g, radius: 1.15 };
};

B.shapeSorter = () => {
  const g = group(box(1.5, 1.2, 1.5, '#ffa86b', { y: 0.6, r: 0.12 }));
  ['circle', 'triangle', 'star', 'heart'].forEach((s, i) => {
    const tex = faceTexture('shape', s, '#5b3f33');
    const d = decal(tex, 0.6, 0.6);
    if (i === 0) d.position.set(-0.36, 1.21, 0.36), d.rotation.x = -Math.PI / 2;
    if (i === 1) d.position.set(0.36, 1.21, -0.36), d.rotation.x = -Math.PI / 2;
    if (i === 2) d.position.set(0, 0.62, 0.756);
    if (i === 3) d.position.set(0.756, 0.62, 0), d.rotation.y = Math.PI / 2;
    g.add(d);
  });
  g.add(at(heart3d(0.3, 0.16, '#ff7eb6'), 1.1, 0.32, 0.7, 0.6));
  g.add(at(star3d(0.3, 0.16, '#ffd23f'), -1.0, 0.3, 0.8, -0.3));
  g.add(cyl(0.22, 0.22, 0.3, '#6fdcb4', { x: 0.2, y: 0.15, z: 1.15 }));
  return { obj: g, radius: 1.2 };
};

B.bigTree = () => {
  const g = group(cyl(0.3, 0.45, 2.4, PAL.woodD, { y: 1.2 }), cyl(0.1, 0.12, 1.0, PAL.woodD, { x: 0.5, y: 2.1, rz: -0.9 }));
  [[0, 3.0, 0, 1.2], [-0.9, 2.6, 0.1, 0.85], [0.9, 2.7, -0.1, 0.9], [0.2, 3.6, 0.1, 0.8], [0, 2.7, -0.7, 0.85]].forEach(([x, y, z, r]) => g.add(ball(r, '#4cbf5b', { x, y, z, outline: 0.03 })));
  const owl = group(ball(0.3, '#b98757', { sy: 1.15 }), ball(0.1, PAL.white, { x: -0.11, y: 0.1, z: 0.24, outline: 0.01 }), ball(0.1, PAL.white, { x: 0.11, y: 0.1, z: 0.24, outline: 0.01 }),
    ball(0.05, '#2e1f1a', { x: -0.11, y: 0.1, z: 0.32, outline: 0 }), ball(0.05, '#2e1f1a', { x: 0.11, y: 0.1, z: 0.32, outline: 0 }), cone(0.05, 0.1, '#ffa34d', { y: -0.03, z: 0.3, rx: Math.PI }),
    cone(0.07, 0.16, '#a8794f', { x: -0.17, y: 0.33 }), cone(0.07, 0.16, '#a8794f', { x: 0.17, y: 0.33 }));
  g.add(at(owl, 0.9, 2.6, 0.55, -0.2));
  g.add(ball(0.18, '#ff8fc0', { x: -1.0, y: 0.18, z: 0.8 }));
  g.add(ball(0.12, '#ffd23f', { x: -0.92, y: 0.22, z: 0.8, outline: 0.012 }));
  return { obj: g, radius: 1.2 };
};

B.pond = () => {
  const g = group(cyl(1.35, 1.35, 0.12, '#5bb8f5', { y: 0.06, outline: 0, matOpts: {} }));
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.add(ball(0.2, '#b5aebf', { x: Math.cos(a) * 1.4, y: 0.08, z: Math.sin(a) * 1.4, sy: 0.6, outline: 0.015 })); }
  g.add(cyl(0.3, 0.3, 0.03, '#5cc46a', { x: -0.6, y: 0.13, z: 0.3, outline: 0.01 }));
  g.add(cyl(0.25, 0.25, 0.03, '#5cc46a', { x: 0.55, y: 0.13, z: -0.5, outline: 0.01 }));
  const duck = group(ball(0.3, '#ffd65a', { sx: 1.25, sy: 0.8 }), ball(0.2, '#ffd65a', { x: 0.25, y: 0.27 }), cone(0.08, 0.2, '#ff9a3c', { x: 0.47, y: 0.25, rz: -Math.PI / 2 }),
    ball(0.035, '#2e1f1a', { x: 0.36, y: 0.33, z: 0.12, outline: 0 }), ball(0.035, '#2e1f1a', { x: 0.36, y: 0.33, z: -0.12, outline: 0 }));
  g.add(live(at(duck, 0.1, 0.28, 0.25, -0.6)));
  [[-1.1, -0.7], [-0.85, -0.95], [1.05, 0.75]].forEach(([x, z]) => g.add(cyl(0.03, 0.04, 0.9, '#3fa64a', { x, y: 0.45, z, outline: 0 })));
  const fish = group(ball(0.14, '#ffb35c', { sx: 1.6 }), cone(0.1, 0.16, '#ff9a3c', { x: -0.25, rz: Math.PI / 2 }));
  g.add(live(at(fish, -0.4, 0.14, -0.3, 1)));
  return { obj: g, radius: 1.55, update: (t) => { duck.position.y = 0.28 + Math.sin(t * 2) * 0.04; duck.rotation.z = Math.sin(t * 1.6) * 0.06; fish.position.x = -0.4 + Math.sin(t) * 0.25; } };
};

function produce(kind) {
  const g = group();
  const crate = (x, z) => g.add(box(0.7, 0.32, 0.55, '#d9a06e', { x, y: 0.98, z, r: 0.03 }));
  if (kind === 'veg') {
    crate(-0.45, 0); crate(0.4, 0);
    for (let i = 0; i < 4; i++) g.add(cone(0.08, 0.45, '#ff8c2e', { x: -0.62 + i * 0.12, y: 1.22, z: 0.05, rz: Math.PI / 2 + 0.2, outline: 0.012 }));
    for (let i = 0; i < 3; i++) g.add(ball(0.16, '#a8e07a', { x: 0.22 + i * 0.18, y: 1.24, z: 0, outline: 0.012 }));
  } else if (kind === 'mixed') {
    crate(-0.45, 0); crate(0.4, 0);
    for (let i = 0; i < 4; i++) g.add(ball(0.12, '#ff4f4f', { x: -0.66 + i * 0.14, y: 1.22, z: 0.05, outline: 0.012 }));
    for (let i = 0; i < 3; i++) g.add(ball(0.15, '#4cad4a', { x: 0.24 + i * 0.17, y: 1.24, z: 0, outline: 0.012 }));
  } else {
    crate(-0.45, 0); crate(0.4, 0);
    for (let i = 0; i < 4; i++) g.add(ball(0.12, i % 2 ? '#ff4f4f' : '#ff9a3c', { x: -0.66 + i * 0.14, y: 1.22, z: 0.05, outline: 0.012 }));
    for (let i = 0; i < 3; i++) g.add(capsule(0.06, 0.3, '#ffd84f', { x: 0.25 + i * 0.13, y: 1.22, z: 0.02, rz: 1.2, outline: 0.012 }));
  }
  return g;
}
B.stall = (st) => {
  const g = group(box(2.0, 0.85, 1.0, PAL.wood, { y: 0.43 }), box(2.1, 0.08, 1.1, '#e8b06b', { y: 0.86 }));
  [-0.95, 0.95].forEach((x) => g.add(cyl(0.05, 0.05, 2.2, PAL.woodD, { x, y: 1.1, z: -0.45 })));
  const stripes = ['#ff8fc0', '#ffffff'];
  for (let i = 0; i < 6; i++) g.add(box(0.36, 0.06, 1.2, stripes[i % 2], { x: -0.9 + i * 0.36, y: 2.2, z: -0.05, rx: 0.35, r: 0.02, outline: 0.012 }));
  g.add(produce(st.produce || 'fruit'));
  return { obj: g, radius: 1.3 };
};

B.garden = (st) => {
  const g = group(box(2.1, 0.5, 1.2, '#b07a52', { y: 0.25 }), box(1.95, 0.08, 1.05, '#7a4a2c', { y: 0.5, outline: 0 }));
  if (st.produce === 'flowers') {
    const cols = ['#ff8fc0', '#ffd23f', '#b79cff', '#ff9a3c', '#7fcbff'];
    for (let i = 0; i < 5; i++) {
      const x = -0.75 + i * 0.38;
      g.add(cyl(0.025, 0.025, 0.7, '#3fa64a', { x, y: 0.85, outline: 0 }));
      for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; g.add(ball(0.09, cols[i], { x: x + Math.cos(a) * 0.11, y: 1.25 + Math.sin(a) * 0.11, z: 0.02, outline: 0.01 })); }
      g.add(ball(0.07, '#ffd23f', { x, y: 1.25, z: 0.07, outline: 0.01 }));
    }
    const sprout = group(cyl(0.02, 0.02, 0.3, '#3fa64a', { y: 0.15, outline: 0 }), ball(0.08, '#7fd36b', { x: -0.07, y: 0.32, sx: 1.6, sy: 0.6 }), ball(0.08, '#7fd36b', { x: 0.07, y: 0.3, sx: 1.6, sy: 0.6 }));
    g.add(at(sprout, 0.7, 0.52, 0.35));
  } else {
    for (let i = 0; i < 4; i++) {
      const x = -0.75 + i * 0.32;
      g.add(cone(0.09, 0.3, '#ff8c2e', { x, y: 0.62, rx: Math.PI, outline: 0.012 }));
      g.add(cone(0.08, 0.32, '#5cc46a', { x, y: 0.88, outline: 0.01 }));
    }
    g.add(ball(0.24, '#a8e07a', { x: 0.55, y: 0.72, outline: 0.02 }));
    g.add(ball(0.22, '#a8e07a', { x: 0.85, y: 0.7, z: 0.2, outline: 0.02 }));
  }
  const can = group(cyl(0.22, 0.24, 0.36, '#6fdcb4', { y: 0.18 }), cyl(0.04, 0.05, 0.5, '#6fdcb4', { x: 0.3, y: 0.32, rz: -0.9 }), torus(0.15, 0.03, '#6fdcb4', { y: 0.42, x: -0.05 }));
  g.add(at(can, -1.0, 0, 0.95, 0.4));
  return { obj: g, radius: 1.3 };
};

function wheelPair(g, x, zHalf, r = 0.25) { [-zHalf, zHalf].forEach((z) => g.add(cyl(r, r, 0.14, '#4a4350', { x, y: r, z, rx: Math.PI / 2 }))); }
B.vehicle = (st) => {
  const kind = st.vehicle || 'car';
  const g = group();
  if (kind === 'plane') {
    const plane = group(capsule(0.38, 1.8, '#ffffff', { rz: Math.PI / 2 }), box(0.7, 0.08, 2.6, '#7fcbff', { y: -0.05 }), box(0.4, 0.06, 1.0, '#7fcbff', { x: -1.1, y: 0.1 }),
      box(0.45, 0.55, 0.06, '#ff7eb6', { x: -1.15, y: 0.4 }), cyl(0.12, 0.12, 0.2, '#ffd23f', { x: 1.3, rz: Math.PI / 2 }), box(0.06, 0.9, 0.12, '#4a4350', { x: 1.42, outline: 0 }),
      box(0.4, 0.22, 0.6, '#cfeeff', { x: 0.55, y: 0.3, outline: 0.015 }));
    g.add(cyl(0.08, 0.1, 1.0, PAL.grey, { y: 0.5 }), cyl(0.6, 0.65, 0.12, '#b79cff', { y: 0.06 }));
    g.add(live(at(plane, 0, 1.2, 0, 0.6)));
    return { obj: g, radius: 1.35, update: (t) => { plane.position.y = 1.2 + Math.sin(t * 1.4) * 0.06; plane.children[5].rotation.x = t * 12; } };
  }
  const L = kind === 'bus' ? 2.6 : kind === 'fire' ? 2.4 : 1.9;
  const color = kind === 'bus' ? '#ffcf3f' : kind === 'fire' ? '#ff4f4f' : '#ff6b6b';
  g.add(box(L, 0.6, 1.1, color, { y: 0.62, r: 0.14 }));
  if (kind === 'car') {
    g.add(box(1.05, 0.55, 1.0, color, { x: -0.1, y: 1.15, r: 0.16 }));
    g.add(box(0.95, 0.38, 1.02, '#cfeeff', { x: -0.1, y: 1.17, r: 0.1, outline: 0.012 }));
    g.add(box(0.06, 0.4, 1.04, color, { x: -0.1, y: 1.17, outline: 0 }));
  } else if (kind === 'bus') {
    g.add(box(L, 0.7, 1.1, color, { y: 1.25, r: 0.12 }));
    for (let i = 0; i < 4; i++) g.add(box(0.42, 0.4, 1.12, '#cfeeff', { x: -0.9 + i * 0.55, y: 1.3, r: 0.06, outline: 0.012 }));
    g.add(box(L + 0.02, 0.12, 1.12, '#4a4350', { y: 0.82, r: 0.03, outline: 0 }));
  } else {
    g.add(box(0.8, 0.7, 1.05, color, { x: 0.75, y: 1.2, r: 0.12 }));
    g.add(box(0.5, 0.36, 1.07, '#cfeeff', { x: 0.82, y: 1.28, r: 0.06, outline: 0.012 }));
    const ladder = group(box(1.5, 0.06, 0.06, '#d7dde6', { z: -0.2 }), box(1.5, 0.06, 0.06, '#d7dde6', { z: 0.2 }));
    for (let i = 0; i < 6; i++) ladder.add(box(0.05, 0.05, 0.4, '#d7dde6', { x: -0.65 + i * 0.26, outline: 0 }));
    g.add(at(ladder, -0.35, 1.05, 0));
    g.add(box(0.3, 0.14, 0.3, '#3d8bfd', { x: 0.75, y: 1.62, r: 0.05 }));
  }
  wheelPair(g, L / 2 - 0.42, 0.55, kind === 'bus' ? 0.3 : 0.27);
  wheelPair(g, -L / 2 + 0.42, 0.55, kind === 'bus' ? 0.3 : 0.27);
  g.add(ball(0.08, '#ffe27a', { x: L / 2, y: 0.7, z: 0.35, outline: 0.01 }));
  g.add(ball(0.08, '#ffe27a', { x: L / 2, y: 0.7, z: -0.35, outline: 0.01 }));
  g.rotation.y = 0.5;
  return { obj: g, radius: L * 0.55 + 0.2 };
};

B.teddy = () => {
  const fur = '#c48a5a', light = '#e7c39a';
  const g = group(ball(0.75, fur, { y: 0.75, sy: 0.95 }), ball(0.4, light, { y: 0.72, z: 0.45, sy: 1.1 }), ball(0.58, fur, { y: 1.75 }),
    ball(0.2, fur, { x: -0.45, y: 2.2 }), ball(0.2, fur, { x: 0.45, y: 2.2 }), ball(0.1, light, { x: -0.45, y: 2.2, z: 0.12, outline: 0 }), ball(0.1, light, { x: 0.45, y: 2.2, z: 0.12, outline: 0 }),
    ball(0.22, light, { y: 1.62, z: 0.48, sy: 0.8 }), ball(0.07, '#3d2a20', { y: 1.7, z: 0.68, outline: 0 }), ball(0.06, '#2e1f1a', { x: -0.2, y: 1.88, z: 0.5, outline: 0 }), ball(0.06, '#2e1f1a', { x: 0.2, y: 1.88, z: 0.5, outline: 0 }),
    ball(0.26, fur, { x: -0.7, y: 1.0, z: 0.25 }), ball(0.26, fur, { x: 0.7, y: 1.0, z: 0.25 }), ball(0.3, fur, { x: -0.42, y: 0.25, z: 0.55, sy: 0.75 }), ball(0.3, fur, { x: 0.42, y: 0.25, z: 0.55, sy: 0.75 }));
  g.add(at(group(cone(0.16, 0.26, '#ff7eb6', { rz: Math.PI / 2, x: -0.14 }), cone(0.16, 0.26, '#ff7eb6', { rz: -Math.PI / 2, x: 0.14 }), ball(0.08, '#ff7eb6')), 0, 1.25, 0.5));
  return { obj: g, radius: 1.05 };
};

B.mirror = () => {
  const g = group(box(1.6, 0.8, 0.8, '#ff8fc0', { y: 0.4 }), box(0.6, 0.12, 0.05, '#ffffff', { y: 0.45, z: 0.41, outline: 0 }), cyl(0.06, 0.06, 0.6, PAL.wood, { y: 1.1 }));
  g.add(torus(0.62, 0.09, '#ffd23f', { y: 1.9, z: 0.0 }));
  g.add(cyl(0.6, 0.6, 0.05, '#bfe7ff', { y: 1.9, rx: Math.PI / 2, outline: 0, matOpts: { emissive: '#ffffff', emissiveIntensity: 0.15 } }));
  g.add(box(0.15, 0.5, 0.02, '#ffffff', { x: -0.2, y: 2.05, z: 0.03, rz: 0.5, outline: 0, matOpts: { transparent: true, opacity: 0.6 } }));
  g.add(at(heart3d(0.14, 0.06, '#ff7eb6'), 0, 2.62, 0));
  g.add(box(0.5, 0.06, 0.12, '#c9b6ff', { x: 0.45, y: 0.84, z: 0.15 }));
  return { obj: g, radius: 1.0 };
};

B.trampoline = () => {
  const g = group(cyl(1.0, 1.0, 0.08, '#4a90e2', { y: 0.55 }), torus(1.05, 0.1, '#ff8fc0', { y: 0.57, rx: Math.PI / 2 }));
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; g.add(cyl(0.05, 0.05, 0.55, PAL.grey, { x: Math.cos(a) * 0.95, y: 0.27, z: Math.sin(a) * 0.95, outline: 0.01 })); }
  const b = live(ball(0.28, '#ffd23f', { y: 1.2 }));
  g.add(b);
  return { obj: g, radius: 1.2, update: (t) => { b.position.y = 0.92 + Math.abs(Math.sin(t * 2.4)) * 0.8; } };
};

B.armchair = () => {
  const g = group(box(1.4, 0.45, 1.1, '#b79cff', { y: 0.35, r: 0.15 }), box(1.4, 1.0, 0.3, '#b79cff', { y: 0.9, z: -0.45, r: 0.15 }),
    box(0.28, 0.6, 1.1, '#a382f0', { x: -0.65, y: 0.65, r: 0.12 }), box(0.28, 0.6, 1.1, '#a382f0', { x: 0.65, y: 0.65, r: 0.12 }), box(0.7, 0.4, 0.15, '#ffd65a', { y: 0.85, z: -0.25, r: 0.08, rx: -0.2 }));
  const lamp = group(cyl(0.25, 0.3, 0.08, PAL.wood, { y: 0.04 }), cyl(0.04, 0.04, 1.8, PAL.wood, { y: 0.9 }), cyl(0.25, 0.42, 0.45, '#ffe27a', { y: 1.9, open: true, matOpts: { emissive: '#ffe27a', emissiveIntensity: 0.4 } }));
  g.add(at(lamp, 1.15, 0, -0.3));
  return { obj: g, radius: 1.2 };
};

B.kitchen = () => {
  const g = group(box(1.9, 1.0, 0.95, '#ffffff', { y: 0.5 }), box(2.0, 0.1, 1.05, '#ffa86b', { y: 1.05 }), box(0.7, 0.55, 0.05, '#bfe7ff', { x: -0.45, y: 0.5, z: 0.48, r: 0.04 }),
    cyl(0.04, 0.04, 0.45, '#c9c4d6', { x: -0.45, y: 0.8, z: 0.52, rz: Math.PI / 2, outline: 0 }));
  [-0.45, 0.4].forEach((x) => g.add(cyl(0.24, 0.24, 0.03, '#4a4350', { x, y: 1.12, z: 0.1, outline: 0 })));
  const pot = group(cyl(0.3, 0.26, 0.38, '#d7dde6', { y: 0.19 }), torus(0.3, 0.035, '#c9c4d6', { y: 0.38, rx: Math.PI / 2, outline: 0 }));
  g.add(at(pot, 0.4, 1.12, 0.1));
  const steam = [0, 1, 2].map((i) => live(ball(0.1, '#ffffff', { x: 0.4 + (i - 1) * 0.12, y: 1.7, z: 0.1, outline: 0, matOpts: { transparent: true, opacity: 0.7 } })));
  steam.forEach((s) => { s.material = s.material.clone(); s.userData.ownMaterial = true; });
  steam.forEach((s) => g.add(s));
  g.add(cyl(0.1, 0.08, 0.2, '#7fcbff', { x: -0.45, y: 1.2, z: 0.1 }));
  return { obj: g, radius: 1.15, update: (t) => steam.forEach((s, i) => { const k = (t * 0.6 + i / 3) % 1; s.position.y = 1.55 + k * 0.7; s.scale.setScalar(0.6 + k); s.material.opacity = 0.7 * (1 - k); }) };
};

B.toyBox = () => {
  const g = group(box(1.6, 0.9, 1.0, '#e8a36a', { y: 0.45 }), box(1.64, 0.12, 1.04, '#c9814a', { y: 0.95, outline: 0 }));
  const lid = box(1.6, 0.14, 1.0, '#e8a36a', {});
  g.add(at(group(at(lid, 0, 0, 0.5)), 0, 1.0, -0.5));
  lid.parent.rotation.x = -1.1;
  g.add(ball(0.3, '#ff5a5a', { x: -0.4, y: 1.15, z: 0.1 }));
  g.add(at(letterBlock(0.4, PAL.sky, 'text', 'A', '#2f7fd6'), 0.25, 1.1, 0.1, 0.4));
  g.add(ball(0.2, '#c48a5a', { x: 0.6, y: 1.1, z: -0.15 }));
  g.add(at(letterBlock(0.35, PAL.butter, 'shape', 'star', '#e0a000'), 1.05, 0.18, 0.75, 0.3));
  return { obj: g, radius: 1.15 };
};

B.weather = () => {
  const g = group(cyl(0.06, 0.08, 2.6, PAL.wood, { y: 1.3 }), cyl(0.5, 0.55, 0.12, PAL.wood, { y: 0.06 }), cyl(0.04, 0.04, 2.0, PAL.wood, { y: 2.55, rz: Math.PI / 2 }));
  const cloud = group(ball(0.35, '#ffffff'), ball(0.28, '#ffffff', { x: -0.35, y: -0.05 }), ball(0.28, '#ffffff', { x: 0.35, y: -0.05 }), ball(0.25, '#ffffff', { x: 0.1, y: 0.22 }));
  for (let i = 0; i < 3; i++) cloud.add(cone(0.06, 0.16, '#5bb8f5', { x: -0.3 + i * 0.3, y: -0.5 - (i % 2) * 0.12, rx: Math.PI, outline: 0.01 }));
  const sun = group(ball(0.3, '#ffd23f', { matOpts: { emissive: '#ffb400', emissiveIntensity: 0.25 } }));
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; sun.add(cone(0.06, 0.18, '#ffb43c', { x: Math.cos(a) * 0.42, y: Math.sin(a) * 0.42, rz: a - Math.PI / 2, outline: 0.01 })); }
  const pivotA = at(group(cyl(0.01, 0.01, 0.3, '#5b3f33', { y: -0.15, outline: 0 }), at(cloud, 0, -0.55, 0)), -0.85, 2.55, 0);
  const pivotB = at(group(cyl(0.01, 0.01, 0.3, '#5b3f33', { y: -0.15, outline: 0 }), at(sun, 0, -0.55, 0)), 0.85, 2.55, 0);
  g.add(live(pivotA), live(pivotB));
  g.add(at(group(box(0.14, 0.8, 0.02, '#ff5a5a', { outline: 0 }), box(0.14, 0.8, 0.02, '#ffd23f', { x: 0.14, outline: 0 }), box(0.14, 0.8, 0.02, '#4cc46a', { x: 0.28, outline: 0 }), box(0.14, 0.8, 0.02, '#3d8bfd', { x: 0.42, outline: 0 })), -0.2, 0.9, 0.6, 0.2));
  return { obj: g, radius: 1.2, update: (t) => { pivotA.rotation.z = Math.sin(t * 1.1) * 0.12; pivotB.rotation.z = Math.sin(t * 1.1 + 1) * 0.12; sun.rotation.z = t * 0.4; } };
};

B.mobile = () => {
  const g = group(cyl(0.06, 0.08, 2.8, PAL.wood, { x: -0.9, y: 1.4 }), cyl(0.5, 0.55, 0.12, PAL.wood, { x: -0.9, y: 0.06 }), cyl(0.04, 0.04, 1.6, PAL.wood, { x: -0.15, y: 2.75, rz: Math.PI / 2 }));
  const hang = group();
  const moon = torus(0.32, 0.12, '#ffe27a', { arc: Math.PI * 1.25, rz: 0.9 });
  const items = [at(group(moon), -0.45, -0.7, 0), at(star3d(0.25, 0.1, '#ffd23f'), 0.1, -0.5, 0), at(ball(0.24, '#ffb43c'), 0.6, -0.85, 0), at(star3d(0.16, 0.08, '#b79cff'), 0.35, -1.3, 0)];
  items.forEach((it) => { hang.add(cyl(0.01, 0.01, -it.position.y, '#5b3f33', { x: it.position.x, y: it.position.y / 2, outline: 0 })); hang.add(it); });
  g.add(live(at(hang, 0, 2.72, 0)));
  return { obj: g, radius: 1.15, update: (t) => { hang.rotation.y = Math.sin(t * 0.5) * 0.6; items.forEach((it, i) => { it.rotation.y = t * (0.6 + i * 0.2); }); } };
};

B.telescope = () => {
  const g = group(cyl(0.04, 0.04, 1.7, PAL.woodD, { x: -0.35, y: 0.8, rz: 0.22 }), cyl(0.04, 0.04, 1.7, PAL.woodD, { x: 0.35, y: 0.8, rz: -0.22 }), cyl(0.04, 0.04, 1.7, PAL.woodD, { y: 0.8, z: -0.35, rx: -0.22 }));
  const tube = group(cyl(0.2, 0.26, 1.8, '#7fcbff'), cyl(0.27, 0.27, 0.2, '#4a90e2', { y: 0.9 }), cyl(0.1, 0.12, 0.3, '#4a90e2', { y: -1.0 }));
  tube.rotation.z = -0.95;
  g.add(at(tube, 0.1, 1.75, 0));
  g.add(at(star3d(0.22, 0.08, '#ffd23f'), -0.9, 0.3, 0.6, 0.4));
  g.add(at(star3d(0.15, 0.08, '#ffd23f'), -0.6, 0.2, 0.95, -0.4));
  return { obj: g, radius: 1.05 };
};

B.orrery = () => {
  const g = group(cyl(0.45, 0.6, 0.6, '#8f86e8', { y: 0.3 }), cyl(0.06, 0.06, 1.0, '#c9c4d6', { y: 1.0 }), ball(0.42, '#ffd23f', { y: 1.65, matOpts: { emissive: '#ffb400', emissiveIntensity: 0.35 } }));
  const spin = group();
  const earth = group(ball(0.2, '#5bb8f5'), ball(0.08, '#5cc46a', { x: 0.08, y: 0.1, z: 0.12, outline: 0 }));
  const mars = ball(0.15, '#e8643c');
  const saturn = group(ball(0.2, '#ffd98a'), torus(0.32, 0.04, '#e8c98a', { rx: 1.3, outline: 0.012 }));
  [[earth, 0.95, 0], [mars, 1.25, 2.1], [saturn, 1.55, 4.2]].forEach(([p, r, a]) => {
    spin.add(cyl(0.015, 0.015, r, '#c9c4d6', { x: Math.cos(a) * r / 2, z: Math.sin(a) * r / 2, rz: Math.PI / 2, ry: -a, outline: 0 }));
    spin.add(at(p, Math.cos(a) * r, 0, Math.sin(a) * r));
  });
  g.add(live(at(spin, 0, 1.65, 0)));
  return { obj: g, radius: 1.3, update: (t) => { spin.rotation.y = t * 0.35; earth.rotation.y = t; } };
};

B.rocket = () => {
  const g = group(cyl(1.0, 1.1, 0.2, '#c9c4d6', { y: 0.1 }));
  const r = group(cyl(0.45, 0.5, 1.8, '#ffffff', { y: 1.2 }), cone(0.45, 0.8, '#ff6b6b', { y: 2.5 }), cyl(0.2, 0.2, 0.06, '#7fcbff', { y: 1.6, z: 0.46, rx: Math.PI / 2, outline: 0.015 }));
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; r.add(box(0.08, 0.6, 0.5, '#ff7eb6', { x: Math.cos(a) * 0.5, y: 0.6, z: Math.sin(a) * 0.5, ry: -a, r: 0.03 })); }
  g.add(live(r));
  const puffs = [0, 1, 2, 3].map((i) => live(ball(0.22, '#ffffff', { x: Math.cos(i * 1.6) * 0.55, y: 0.35, z: Math.sin(i * 1.6) * 0.55, outline: 0.015 })));
  puffs.forEach((p) => g.add(p));
  return { obj: g, radius: 1.15, update: (t) => { r.position.y = Math.sin(t * 1.5) * 0.04; puffs.forEach((p, i) => p.scale.setScalar(0.85 + Math.sin(t * 2 + i) * 0.15)); } };
};

B.sink = () => {
  const g = group(cyl(0.22, 0.3, 0.85, '#ffffff', { y: 0.43 }), cyl(0.65, 0.4, 0.3, '#ffffff', { y: 1.0 }), cyl(0.55, 0.55, 0.04, '#bfe7ff', { y: 1.13, outline: 0 }),
    box(1.6, 1.2, 0.12, '#bfe7ff', { y: 1.9, z: -0.6, r: 0.08 }), cyl(0.05, 0.05, 0.5, '#d7dde6', { y: 1.4, z: -0.45 }), cyl(0.05, 0.05, 0.4, '#d7dde6', { y: 1.62, z: -0.3, rx: Math.PI / 2 }));
  const soap = group(cyl(0.12, 0.14, 0.32, '#ff9fc8', { y: 0.16 }), cyl(0.03, 0.03, 0.14, '#ffffff', { y: 0.38 }));
  g.add(at(soap, 0.45, 1.15, 0.1));
  const bubbles = [0, 1, 2, 3].map((i) => live(ball(0.1 + i * 0.02, '#eaf8ff', { x: -0.4 + i * 0.25, y: 1.4, z: 0.3, outline: 0.01, matOpts: { transparent: true, opacity: 0.8 } })));
  bubbles.forEach((b) => g.add(b));
  return { obj: g, radius: 0.95, update: (t) => bubbles.forEach((b, i) => { const k = (t * 0.3 + i / 4) % 1; b.position.y = 1.25 + k * 1.3; b.position.x = -0.4 + i * 0.25 + Math.sin(t + i) * 0.1; b.visible = k < 0.92; }) };
};

B.toothbrush = () => {
  const g = group(cyl(0.45, 0.4, 0.9, '#7fcbff', { y: 0.45 }), torus(0.43, 0.05, '#ffffff', { y: 0.9, rx: Math.PI / 2, outline: 0 }));
  const brush = group(cyl(0.09, 0.09, 2.4, '#6fdcb4', { y: 1.2 }), box(0.32, 0.5, 0.22, '#ffffff', { y: 2.55, z: 0.12, r: 0.05 }));
  for (let i = 0; i < 4; i++) brush.add(box(0.26, 0.06, 0.2, '#7fcbff', { y: 2.38 + i * 0.12, z: 0.3, outline: 0 }));
  brush.add(ball(0.13, '#ffffff', { y: 2.6, z: 0.42, sx: 1.6, outline: 0.01 }));
  brush.rotation.z = 0.12;
  g.add(brush);
  const tube = group(capsule(0.16, 0.7, '#ffffff', { rz: Math.PI / 2 }), cyl(0.1, 0.1, 0.16, '#ff6b6b', { x: 0.55, rz: Math.PI / 2 }), box(0.5, 0.1, 0.34, '#4a90e2', { outline: 0 }));
  g.add(at(tube, 0.85, 0.17, 0.6, 0.4));
  return { obj: g, radius: 1.0 };
};

B.towelRack = () => {
  const g = group(cyl(0.05, 0.06, 2.0, PAL.wood, { x: -0.9, y: 1.0 }), cyl(0.05, 0.06, 2.0, PAL.wood, { x: 0.9, y: 1.0 }), cyl(0.04, 0.04, 1.9, PAL.wood, { y: 1.85, rz: Math.PI / 2 }),
    cyl(0.25, 0.3, 0.08, PAL.wood, { x: -0.9, y: 0.04 }), cyl(0.25, 0.3, 0.08, PAL.wood, { x: 0.9, y: 0.04 }));
  const towel = (x, col) => {
    const t = group(box(0.65, 1.0, 0.08, col, { y: -0.5, r: 0.04 }), box(0.66, 0.08, 0.09, '#ffffff', { y: -0.75, outline: 0 }), box(0.66, 0.05, 0.09, '#ffffff', { y: -0.88, outline: 0 }));
    return at(t, x, 1.88, 0.05);
  };
  const t1 = live(towel(-0.4, '#ff9fc8')), t2 = live(towel(0.4, '#7fcbff'));
  g.add(t1, t2);
  const bottle = group(cyl(0.16, 0.16, 0.5, '#7fcbff', { y: 0.25 }), cyl(0.05, 0.05, 0.2, '#4a90e2', { y: 0.6 }));
  g.add(at(bottle, 0.6, 0, 0.6));
  return { obj: g, radius: 1.1, update: (t) => { t1.rotation.x = Math.sin(t * 1.3) * 0.05; t2.rotation.x = Math.sin(t * 1.3 + 1) * 0.05; } };
};

B.bathtub = () => {
  const g = group(capsule(0.6, 1.0, '#ffffff', { y: 0.6, rz: Math.PI / 2, sz: 1.15 }), cyl(0.07, 0.05, 0.25, '#ffd23f', { x: -0.85, y: 0.12, z: 0.45 }), cyl(0.07, 0.05, 0.25, '#ffd23f', { x: 0.85, y: 0.12, z: 0.45 }),
    cyl(0.07, 0.05, 0.25, '#ffd23f', { x: -0.85, y: 0.12, z: -0.45 }), cyl(0.07, 0.05, 0.25, '#ffd23f', { x: 0.85, y: 0.12, z: -0.45 }));
  const foam = [[-0.5, 1.1, 0, 0.3], [0, 1.18, 0.1, 0.35], [0.45, 1.1, -0.1, 0.3], [-0.15, 1.15, -0.3, 0.25], [0.25, 1.12, 0.35, 0.22]];
  foam.forEach(([x, y, z, r]) => g.add(ball(r, '#f2fbff', { x, y, z, outline: 0.015 })));
  const duck = group(ball(0.16, '#ffd65a', { sx: 1.2 }), ball(0.1, '#ffd65a', { x: 0.12, y: 0.13 }), cone(0.04, 0.1, '#ff9a3c', { x: 0.24, y: 0.12, rz: -Math.PI / 2 }));
  g.add(live(at(duck, 0.3, 1.38, 0.2)));
  return { obj: g, radius: 1.2, update: (t) => { duck.position.y = 1.38 + Math.sin(t * 2) * 0.03; } };
};

B.trafficLight = () => {
  const g = group(cyl(0.08, 0.1, 2.0, '#4a4350', { y: 1.0 }), box(0.6, 1.4, 0.45, '#4a4350', { y: 2.4, r: 0.12 }));
  const lights = ['#ff4040', '#ffd23f', '#3fe06a'].map((c, i) => ball(0.17, c, { y: 2.85 - i * 0.45, z: 0.2, outline: 0.012, matOpts: { emissive: c, emissiveIntensity: 0.05 } }));
  // each light has its own material so it can glow independently
  lights.forEach((l) => { l.material = l.material.clone(); l.userData.ownMaterial = true; g.add(l); });
  for (let i = 0; i < 5; i++) g.add(box(0.28, 0.02, 1.4, '#ffffff', { x: -0.9 + i * 0.45, y: 0.012, z: 1.0, r: 0.01, outline: 0 }));
  g.add(box(2.4, 0.01, 1.6, '#6b6475', { y: 0.005, z: 1.0, outline: 0, r: 0 }));
  // cycle: green -> yellow -> red
  return { obj: g, radius: 0.8, update: (t) => { const on = [2, 1, 0][Math.floor(t / 2.4) % 3]; lights.forEach((l, i) => { l.material.emissiveIntensity = i === on ? 0.95 : 0.04; }); } };
};

B.giftBox = () => {
  const g = group(box(1.3, 1.0, 1.3, '#ff8fc0', { y: 0.5 }), box(1.4, 0.25, 1.4, '#ffb3d4', { y: 1.1 }), box(0.24, 1.27, 1.33, '#ffd23f', { y: 0.62, outline: 0.012 }), box(1.33, 1.27, 0.24, '#ffd23f', { y: 0.62, outline: 0.012 }),
    torus(0.22, 0.07, '#ffd23f', { x: -0.2, y: 1.35, rz: 0.5 }), torus(0.22, 0.07, '#ffd23f', { x: 0.2, y: 1.35, rz: -0.5 }));
  const balloons = [['#7fcbff', -0.9, 2.6], ['#ffd23f', -0.55, 3.0], ['#b79cff', 0.95, 2.7]].map(([c, x, y]) => {
    const b = group(ball(0.3, c, { sy: 1.15 }), cone(0.06, 0.1, c, { y: -0.36, outline: 0 }), cyl(0.008, 0.008, y - 1.0, '#5b3f33', { y: -0.4 - (y - 1.0) / 2, outline: 0 }));
    const out = live(at(b, x, y, -0.2));
    out.userData.baseY = y;
    return out;
  });
  balloons.forEach((b) => g.add(b));
  return { obj: g, radius: 1.1, update: (t) => balloons.forEach((b, i) => { b.position.y = b.userData.baseY + Math.sin(t * 1.4 + i) * 0.08; b.rotation.z = Math.sin(t + i) * 0.06; }) };
};

B.heartBench = () => {
  const g = group(box(2.0, 0.15, 0.7, PAL.wood, { y: 0.6 }), box(0.15, 0.6, 0.6, PAL.woodD, { x: -0.85, y: 0.3 }), box(0.15, 0.6, 0.6, PAL.woodD, { x: 0.85, y: 0.3 }));
  g.add(at(heart3d(0.75, 0.15, '#ff7eb6'), 0, 1.45, -0.3));
  g.add(box(0.55, 0.18, 0.5, '#7fcbff', { x: -0.5, y: 0.76, r: 0.08 }));
  g.add(box(0.55, 0.18, 0.5, '#ffd65a', { x: 0.5, y: 0.76, r: 0.08 }));
  return { obj: g, radius: 1.2 };
};

B.tent = () => {
  const g = group(cone(1.25, 2.4, '#b79cff', { y: 1.2, seg: 6 }));
  g.add(prism(0.9, 1.4, 0.05, '#5b4a7a', { y: 0.72, z: 1.0, rx: -0.45, outline: 0 }));
  g.add(cyl(0.03, 0.03, 0.7, PAL.wood, { y: 2.6 }));
  g.add(box(0.4, 0.25, 0.02, '#ffd23f', { x: 0.22, y: 2.8, outline: 0.01 }));
  g.add(box(0.6, 0.15, 0.6, '#ff8fc0', { x: -0.9, y: 0.08, z: 1.0, r: 0.07, ry: 0.4 }));
  g.add(box(0.6, 0.15, 0.6, '#6fdcb4', { x: 0.9, y: 0.08, z: 1.0, r: 0.07, ry: -0.3 }));
  for (let i = 0; i < 5; i++) g.add(cone(0.08, 0.16, RAINBOW[i], { x: -0.55 + i * 0.27, y: 1.6 - Math.abs(i - 2) * 0.06, z: 0.75 - Math.abs(i - 2) * 0.03, rx: Math.PI, outline: 0.008 }));
  return { obj: g, radius: 1.3 };
};

B.cards = () => {
  const g = group(box(2.0, 0.12, 1.3, '#ffd65a', { y: 0.7 }));
  [[-0.8, -0.4], [0.8, -0.4], [-0.8, 0.4], [0.8, 0.4]].forEach(([x, z]) => g.add(cyl(0.06, 0.06, 0.65, PAL.wood, { x, y: 0.33, z })));
  const faces = [['shape', 'star', '#ffd23f'], ['shape', 'heart', '#ff7eb6'], ['shape', 'star', '#ffd23f'], ['shape', 'circle', '#7fcbff']];
  for (let i = 0; i < 6; i++) {
    const x = -0.65 + (i % 3) * 0.65, z = i < 3 ? -0.3 : 0.3;
    const up = i < 4;
    g.add(box(0.5, 0.04, 0.42, up ? '#ffffff' : '#b79cff', { x, y: 0.79, z, r: 0.02, outline: 0.01 }));
    if (up) g.add(decal(faceTexture(faces[i][0], faces[i][1], faces[i][2]), 0.38, 0.38, { x, y: 0.815, z, rx: -Math.PI / 2 }));
  }
  return { obj: g, radius: 1.2 };
};

export const LANDMARK_BUILDERS = B;

export function buildLandmark(kind, station) {
  const make = B[kind] || B.toyBox;
  const out = make(station || {});
  out.obj.traverse((o) => { if (o.isMesh && !o.userData.isOutline) o.castShadow = true; });
  return out;
}
