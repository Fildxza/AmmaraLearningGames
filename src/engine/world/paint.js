// Toon materials, soft outlines and canvas-painted textures with a
// pencil-and-watercolour feel. Materials and geometries are cached and shared.
import {
  MeshToonMaterial, MeshBasicMaterial, MeshLambertMaterial, DataTexture, RedFormat, NearestFilter, Color, BackSide, FrontSide,
  CanvasTexture, SRGBColorSpace, RepeatWrapping, LinearMipmapLinearFilter, LinearFilter
} from 'three';
import { createRng } from '../core/rng.js';

export const INK = 0x5b3f33;

let gradientMap = null;
function getGradient() {
  if (gradientMap) return gradientMap;
  const data = new Uint8Array([120, 175, 220, 255]);
  gradientMap = new DataTexture(data, data.length, 1, RedFormat);
  gradientMap.minFilter = NearestFilter;
  gradientMap.magFilter = NearestFilter;
  gradientMap.generateMipmaps = false;
  gradientMap.needsUpdate = true;
  return gradientMap;
}

const matCache = new Map();
export function toon(color, opts = {}) {
  const key = `${new Color(color).getHexString()}|${opts.emissive || ''}|${opts.transparent ? opts.opacity : ''}|${opts.map ? opts.map.uuid : ''}|${opts.side || ''}`;
  if (matCache.has(key)) return matCache.get(key);
  const m = new MeshToonMaterial({ color, gradientMap: getGradient() });
  if (opts.emissive) { m.emissive = new Color(opts.emissive); m.emissiveIntensity = opts.emissiveIntensity || 0.35; }
  if (opts.transparent) { m.transparent = true; m.opacity = opts.opacity; m.depthWrite = opts.opacity > 0.9; }
  if (opts.map) m.map = opts.map;
  if (opts.side) m.side = opts.side;
  matCache.set(key, m);
  return m;
}
// One shared toon material that takes its colour from the vertices. mergeStatic folds every plain toon part of an
// area into a few meshes that use it, which turns hundreds of draw calls into a handful.
let vcToon = null;
export function toonVertexMaterial() {
  if (!vcToon) vcToon = new MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: getGradient() });
  return vcToon;
}
export function isPlainToon(m) {
  return !!m.isMeshToonMaterial && !m.vertexColors && !m.map && !m.transparent && m.side === FrontSide && m.emissive.getHex() === 0;
}
export function lambert(color, map = null) {
  const key = `L|${new Color(color).getHexString()}|${map ? map.uuid : ''}`;
  if (matCache.has(key)) return matCache.get(key);
  const m = new MeshLambertMaterial({ color, map });
  matCache.set(key, m);
  return m;
}
export function basic(color, opts = {}) {
  const key = `B|${new Color(color).getHexString()}|${opts.opacity || 1}|${opts.map ? opts.map.uuid : ''}`;
  if (matCache.has(key)) return matCache.get(key);
  const m = new MeshBasicMaterial({ color, transparent: !!opts.transparent || (opts.opacity || 1) < 1, opacity: opts.opacity || 1, map: opts.map || null, depthWrite: opts.depthWrite !== undefined ? opts.depthWrite : true });
  matCache.set(key, m);
  return m;
}

// Inverted-hull outline: vertices are pushed out along their normals.
const outlineCache = new Map();
export function outlineMaterial(thickness = 0.03, color = INK) {
  const key = `${thickness}|${color}`;
  if (outlineCache.has(key)) return outlineCache.get(key);
  const m = new MeshBasicMaterial({ color, side: BackSide });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uOutline = { value: thickness };
    shader.vertexShader = 'uniform float uOutline;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normalize(normal) * uOutline;');
  };
  m.customProgramCacheKey = () => 'outline' + thickness;
  outlineCache.set(key, m);
  return m;
}

// ---------- canvas painting ------------------------------------------------
export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
export function canvasTexture(canvas, { repeat = null, srgb = true } = {}) {
  const t = new CanvasTexture(canvas);
  if (srgb) t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  t.minFilter = LinearMipmapLinearFilter;
  t.magFilter = LinearFilter;
  if (repeat) { t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  t.needsUpdate = true;
  return t;
}

function hexToRgb(hex) { const c = new Color(hex); return [Math.round(c.r * 255), Math.round(c.g * 255), Math.round(c.b * 255)]; }
export function tint(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

// Paper grain and soft watercolour blotches over the whole canvas.
export function wash(ctx, w, h, base, seed, strength = 1) {
  const rng = createRng(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 70 * strength; i++) {
    const x = rng.next() * w, y = rng.next() * h, r = (0.04 + rng.next() * 0.16) * Math.max(w, h);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const light = rng.next() < 0.5;
    g.addColorStop(0, light ? 'rgba(255,255,255,0.10)' : 'rgba(120,80,60,0.045)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  grain(ctx, w, h, seed + 'g', 0.05 * strength);
}
export function grain(ctx, w, h, seed, alpha = 0.05) {
  const rng = createRng(seed);
  const n = Math.floor((w * h) / 90);
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = rng.next() < 0.5 ? `rgba(90,60,40,${alpha * rng.next()})` : `rgba(255,255,255,${alpha * 1.4 * rng.next()})`;
    ctx.fillRect(rng.next() * w, rng.next() * h, 1 + rng.next() * 1.5, 1 + rng.next() * 1.5);
  }
}
// A wobbly hand-drawn pencil line.
export function pencilLine(ctx, x1, y1, x2, y2, rng, width = 2, color = 'rgba(91,63,51,0.55)') {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  const steps = Math.max(2, Math.floor(Math.hypot(x2 - x1, y2 - y1) / 24));
  ctx.moveTo(x1, y1);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    ctx.lineTo(x1 + (x2 - x1) * t + (rng.next() - 0.5) * 1.6, y1 + (y2 - y1) * t + (rng.next() - 0.5) * 1.6);
  }
  ctx.stroke();
}
export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ---------- specific textures ---------------------------------------------
export function floorTexture() {
  const S = 1024, c = makeCanvas(S, S), ctx = c.getContext('2d');
  const rng = createRng('floor');
  const tones = ['#e9c08f', '#e3b682', '#edc898', '#dfb07c', '#e6bd8a'];
  const plankH = S / 8;
  for (let row = 0; row < 8; row++) {
    let x = -rng.next() * 300;
    while (x < S) {
      const len = 260 + rng.next() * 340;
      const y = row * plankH;
      ctx.fillStyle = tones[Math.floor(rng.next() * tones.length)];
      ctx.fillRect(x, y, len, plankH);
      // wood grain
      for (let k = 0; k < 7; k++) {
        const gy = y + 8 + rng.next() * (plankH - 16);
        ctx.strokeStyle = `rgba(150,95,55,${0.08 + rng.next() * 0.1})`;
        ctx.lineWidth = 1 + rng.next() * 1.4;
        ctx.beginPath();
        ctx.moveTo(x + 6, gy);
        ctx.bezierCurveTo(x + len * 0.3, gy + (rng.next() - 0.5) * 10, x + len * 0.7, gy + (rng.next() - 0.5) * 10, x + len - 6, gy + (rng.next() - 0.5) * 6);
        ctx.stroke();
      }
      if (rng.next() < 0.3) { // little knot
        ctx.strokeStyle = 'rgba(140,90,50,0.25)'; ctx.lineWidth = 1.5;
        const kx = x + 40 + rng.next() * (len - 80), ky = y + plankH / 2;
        ctx.beginPath(); ctx.ellipse(kx, ky, 10, 5, 0, 0, Math.PI * 2); ctx.stroke();
      }
      pencilLine(ctx, x + len, y, x + len, y + plankH, rng, 2.2, 'rgba(110,70,45,0.55)');
      x += len;
    }
    pencilLine(ctx, 0, row * plankH, S, row * plankH, rng, 2.4, 'rgba(110,70,45,0.5)');
  }
  grain(ctx, S, S, 'floor-grain', 0.06);
  return canvasTexture(c, { repeat: [4, 4] });
}

export function wallTexture(base, accent, seed) {
  const W = 1024, H = 512, c = makeCanvas(W, H), ctx = c.getContext('2d');
  wash(ctx, W, H, base, seed, 1.1);
  const rng = createRng(seed + 'p');
  // hand-drawn polka stars and dots
  for (let i = 0; i < 46; i++) {
    const x = rng.next() * W, y = rng.next() * H;
    ctx.globalAlpha = 0.28 + rng.next() * 0.2;
    ctx.fillStyle = i % 3 === 0 ? '#ffffff' : accent;
    if (i % 2) { drawStar(ctx, x, y, 9 + rng.next() * 6, 4 + rng.next() * 2); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(x, y, 4 + rng.next() * 4, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  return canvasTexture(c, { repeat: [3, 1] });
}
export function wainscotTexture(base, seed) {
  const W = 512, H = 256, c = makeCanvas(W, H), ctx = c.getContext('2d');
  wash(ctx, W, H, base, seed, 0.8);
  const rng = createRng(seed + 'w');
  for (let x = 0; x <= W; x += 64) pencilLine(ctx, x, 0, x, H, rng, 2.2, 'rgba(91,63,51,0.35)');
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  for (let x = 6; x < W; x += 64) ctx.fillRect(x, 0, 10, H);
  return canvasTexture(c, { repeat: [10, 1] });
}
export function drawStar(ctx, x, y, R, r, n = 5) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    const rr = i % 2 === 0 ? R : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}

// Round rug with scalloped stitched rings.
export function rugTexture(color, seed, rings = 3) {
  const S = 512, c = makeCanvas(S, S), ctx = c.getContext('2d');
  const cols = [color, tint(color, 0.18), '#fffaf0', tint(color, -0.05)];
  for (let i = 0; i < rings + 1; i++) {
    const r = (S / 2 - 6) * (1 - i / (rings + 1.2));
    ctx.fillStyle = cols[i % cols.length];
    ctx.beginPath();
    const bumps = 22 + i * 2;
    for (let k = 0; k <= bumps * 4; k++) {
      const a = (k / (bumps * 4)) * Math.PI * 2;
      const rr = r * (1 + 0.025 * Math.sin(a * bumps));
      ctx.lineTo(S / 2 + Math.cos(a) * rr, S / 2 + Math.sin(a) * rr);
    }
    ctx.fill();
    ctx.setLineDash([6, 8]);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(S / 2, S / 2, r - 10, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
  grain(ctx, S, S, seed + 'g', 0.07);
  return canvasTexture(c);
}

export function starRugTexture(color, seed) {
  const S = 1024, c = makeCanvas(S, S), ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.clearRect(0, 0, S, S);
  ctx.fillStyle = tint(color, 0.12);
  drawStar(ctx, S / 2, S / 2 + 20, S * 0.48, S * 0.24); ctx.fill();
  ctx.strokeStyle = 'rgba(91,63,51,0.55)'; ctx.lineWidth = 8; ctx.stroke();
  ctx.fillStyle = '#fffaf0';
  drawStar(ctx, S / 2, S / 2 + 20, S * 0.36, S * 0.18); ctx.fill();
  ctx.setLineDash([14, 14]); ctx.strokeStyle = tint(color, -0.1); ctx.lineWidth = 6;
  drawStar(ctx, S / 2, S / 2 + 20, S * 0.42, S * 0.21); ctx.stroke(); ctx.setLineDash([]);
  grain(ctx, S, S, seed, 0.06);
  return canvasTexture(c);
}

export function skyTexture() {
  const W = 512, H = 512, c = makeCanvas(W, H), ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#9fd8ff'); g.addColorStop(1, '#e6f6ff');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const rng = createRng('sky');
  for (let i = 0; i < 6; i++) {
    const x = rng.next() * W, y = 60 + rng.next() * (H - 160);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x + k * 22 - 44, y + Math.sin(k) * 8, 22 + rng.next() * 12, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.fillStyle = '#ffe27a';
  ctx.beginPath(); ctx.arc(W * 0.78, 70, 34, 0, Math.PI * 2); ctx.fill();
  return canvasTexture(c, { repeat: [1, 1] });
}

// Soft dark disc used as a cheap contact shadow under props.
let blobTex = null;
export function blobShadowTexture() {
  if (blobTex) return blobTex;
  const S = 128, c = makeCanvas(S, S), ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(70,40,30,0.42)'); g.addColorStop(0.6, 'rgba(70,40,30,0.18)'); g.addColorStop(1, 'rgba(70,40,30,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  blobTex = canvasTexture(c);
  return blobTex;
}
let sparkTex = null;
export function sparkleTexture() {
  if (sparkTex) return sparkTex;
  const S = 64, c = makeCanvas(S, S), ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,240,1)'); g.addColorStop(0.25, 'rgba(255,240,160,0.8)'); g.addColorStop(1, 'rgba(255,220,120,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  drawStar(ctx, S / 2, S / 2, S * 0.42, S * 0.08, 4); ctx.fill();
  sparkTex = canvasTexture(c);
  return sparkTex;
}

// Draws an SVG string into a canvas (works offline; SVG data URLs do not taint the canvas).
export function svgToImage(svg) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('SVG image failed to load'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

// ---------- extra textures for the big world ---------------------------------------------------------------------
const texCache = new Map();
function cached(key, make) { if (!texCache.has(key)) texCache.set(key, make()); return texCache.get(key); }

// Soft felt carpet in any colour (grain only; the colour comes from the material).
export function feltTexture() {
  return cached('felt', () => {
    const S = 256, c = makeCanvas(S, S), ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, S, S);
    const rng = createRng('felt');
    for (let i = 0; i < 2600; i++) { ctx.fillStyle = `rgba(${rng.next() < 0.5 ? '120,90,70' : '255,255,255'},${0.05 + rng.next() * 0.07})`; ctx.fillRect(rng.next() * S, rng.next() * S, 1 + rng.next() * 3, 1 + rng.next() * 2); }
    return canvasTexture(c, { repeat: [6, 6] });
  });
}
export function checkerTexture(c1 = '#ffffff', c2 = '#d9ccff', n = 2) {
  return cached(`chk${c1}${c2}${n}`, () => {
    const S = 128 * n, c = makeCanvas(S, S), ctx = c.getContext('2d');
    const q = S / (2 * n);
    for (let y = 0; y < 2 * n; y++) for (let x = 0; x < 2 * n; x++) { ctx.fillStyle = (x + y) % 2 ? c2 : c1; ctx.fillRect(x * q, y * q, q, q); }
    grain(ctx, S, S, 'chk', 0.04);
    return canvasTexture(c, { repeat: [1, 1] });
  });
}
export function grassTexture() {
  return cached('grass', () => {
    const S = 512, c = makeCanvas(S, S), ctx = c.getContext('2d');
    const rng = createRng('grass');
    ctx.fillStyle = '#9edc72'; ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < 70; i++) { const x = rng.next() * S, y = rng.next() * S, r = 30 + rng.next() * 80; const g = ctx.createRadialGradient(x, y, 0, x, y, r); const light = rng.next() < 0.5; g.addColorStop(0, light ? 'rgba(200,255,150,0.28)' : 'rgba(90,170,90,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
    for (let i = 0; i < 1100; i++) { const x = rng.next() * S, y = rng.next() * S; ctx.strokeStyle = rng.next() < 0.5 ? 'rgba(70,150,70,0.45)' : 'rgba(210,255,170,0.5)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (rng.next() - 0.5) * 5, y - 5 - rng.next() * 7); ctx.stroke(); }
    for (let i = 0; i < 26; i++) { const x = rng.next() * S, y = rng.next() * S; ctx.fillStyle = ['#ffffff', '#ffe27a', '#ffb3d4'][i % 3]; ctx.beginPath(); ctx.arc(x, y, 2.4, 0, 7); ctx.fill(); }
    return canvasTexture(c, { repeat: [10, 8] });
  });
}
export function stonePathTexture() {
  return cached('stone', () => {
    const S = 512, c = makeCanvas(S, S), ctx = c.getContext('2d');
    const rng = createRng('stone');
    ctx.fillStyle = '#d9c8a8'; ctx.fillRect(0, 0, S, S);
    const tones = ['#f3e6c8', '#ecdcb8', '#f8eed5', '#e6d4ae'];
    for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
      const w = S / 5, ox = (y % 2) * w * 0.5;
      ctx.fillStyle = tones[Math.floor(rng.next() * 4)]; roundRect(ctx, x * w + ox + 5, y * w + 5, w - 10, w - 10, 22); ctx.fill();
      ctx.strokeStyle = 'rgba(140,110,70,0.45)'; ctx.lineWidth = 3; ctx.stroke();
    }
    grain(ctx, S, S, 'stone-g', 0.06);
    return canvasTexture(c, { repeat: [1, 1] });
  });
}
export function sandTexture() {
  return cached('sand', () => {
    const S = 256, c = makeCanvas(S, S), ctx = c.getContext('2d');
    ctx.fillStyle = '#f4d9a0'; ctx.fillRect(0, 0, S, S);
    const rng = createRng('sand');
    for (let i = 0; i < 2500; i++) { ctx.fillStyle = rng.next() < 0.5 ? 'rgba(190,150,90,0.35)' : 'rgba(255,245,210,0.55)'; ctx.fillRect(rng.next() * S, rng.next() * S, 2, 2); }
    for (let i = 0; i < 8; i++) { ctx.strokeStyle = 'rgba(190,150,90,0.3)'; ctx.lineWidth = 2; ctx.beginPath(); const y = 20 + i * 30; ctx.moveTo(0, y); ctx.bezierCurveTo(60, y - 8, 120, y + 8, S, y); ctx.stroke(); }
    return canvasTexture(c, { repeat: [3, 2] });
  });
}
// Eight-point star lattice (geometric tile pattern) for the Quran-learning corner walls.
export function islamicTileTexture(base = '#e6f6f1', line = '#3aa98f', seed = 'tile') {
  return cached(`islamic${base}${line}${seed}`, () => {
    const S = 512, c = makeCanvas(S, S), ctx = c.getContext('2d');
    ctx.fillStyle = base; ctx.fillRect(0, 0, S, S);
    const N = 4, q = S / N;
    ctx.strokeStyle = line; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    for (let gy = 0; gy < N; gy++) for (let gx = 0; gx < N; gx++) {
      const cx = gx * q + q / 2, cy = gy * q + q / 2, R = q * 0.46, r = q * 0.2;
      ctx.beginPath();
      for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8 - Math.PI / 2; const rr = i % 2 === 0 ? R : r; ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
      ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, q * 0.09, 0, 7); ctx.fillStyle = line; ctx.globalAlpha = 0.35; ctx.fill(); ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.moveTo(cx + q / 2, cy); ctx.lineTo(cx, cy + q / 2); ctx.moveTo(cx + q / 2, cy); ctx.lineTo(cx, cy - q / 2); ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1;
    }
    grain(ctx, S, S, seed, 0.04);
    return canvasTexture(c, { repeat: [2, 1] });
  });
}
// Spines of books on a shelf (a picture of the books, so the shelf stays cheap).
export function bookSpineTexture(seed = 'books', rows = 3, w = 512, h = 256) {
  return cached(`spines${seed}${rows}`, () => {
    const c = makeCanvas(w, h), ctx = c.getContext('2d');
    const rng = createRng(seed);
    ctx.fillStyle = '#c28a58'; ctx.fillRect(0, 0, w, h);
    const rowH = h / rows;
    const cols = ['#ff8fc0', '#7fcbff', '#ffd65a', '#6fdcb4', '#b79cff', '#ff9a6a', '#ff6b6b', '#4cc46a'];
    for (let r = 0; r < rows; r++) {
      ctx.fillStyle = '#8a5a3c'; ctx.fillRect(0, (r + 1) * rowH - 8, w, 8);
      let x = 6;
      while (x < w - 20) {
        const bw = 14 + rng.next() * 20, bh = rowH * (0.55 + rng.next() * 0.35);
        ctx.fillStyle = cols[Math.floor(rng.next() * cols.length)];
        roundRect(ctx, x, (r + 1) * rowH - 8 - bh, bw, bh, 4); ctx.fill();
        ctx.strokeStyle = 'rgba(91,63,51,0.55)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x + 3, (r + 1) * rowH - 8 - bh + 6, bw - 6, 3);
        x += bw + 2;
      }
    }
    return canvasTexture(c);
  });
}
