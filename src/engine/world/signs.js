// Painted signs and picture boards for the 3D world. Every sign re-paints itself when the language changes.
import { Mesh, PlaneGeometry, MeshBasicMaterial } from 'three';
import { makeCanvas, canvasTexture, roundRect, grain, tint, svgToImage } from './paint.js';
import { FONT } from '../art/svg.js';

export const ARABIC_FONT = "'AG Naskh', 'Noto Naskh Arabic', 'Scheherazade New', 'Amiri', serif";

const geoCache = new Map();
const planeGeo = (w, h) => { const k = `${w}x${h}`; if (!geoCache.has(k)) geoCache.set(k, new PlaneGeometry(w, h)); return geoCache.get(k); };

function paintSign(ctx, W, H, text, color, iconImg, opts = {}) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = opts.paper || '#fffaf1';
  roundRect(ctx, 6, 6, W - 12, H - 12, Math.min(60, H * 0.3)); ctx.fill();
  ctx.lineWidth = Math.max(8, H * 0.05); ctx.strokeStyle = color; ctx.stroke();
  ctx.setLineDash([4, 14]); ctx.lineWidth = Math.max(4, H * 0.025); ctx.strokeStyle = tint(color, 0.18);
  roundRect(ctx, H * 0.12, H * 0.12, W - H * 0.24, H * 0.76, Math.min(46, H * 0.22)); ctx.stroke(); ctx.setLineDash([]);
  const pad = iconImg ? H * 0.92 : H * 0.3;
  if (iconImg) ctx.drawImage(iconImg, H * 0.12, H * 0.14, H * 0.72, H * 0.72);
  let size = Math.round(H * 0.5);
  ctx.font = `700 ${size}px ${FONT}`;
  while (ctx.measureText(text).width > W - pad - H * 0.3 && size > 24) { size -= 3; ctx.font = `700 ${size}px ${FONT}`; }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const cx = pad + (W - pad - H * 0.25) / 2;
  ctx.lineWidth = size * 0.16; ctx.strokeStyle = '#ffffff'; ctx.strokeText(text, cx, H / 2 + size * 0.04);
  const g = ctx.createLinearGradient(0, H * 0.25, 0, H * 0.75);
  g.addColorStop(0, tint(color, 0.04)); g.addColorStop(1, tint(color, -0.2));
  ctx.fillStyle = g; ctx.fillText(text, cx, H / 2 + size * 0.04);
  grain(ctx, W, H, 'sign' + text, 0.035);
}

const registry = new Set();
let currentLang = 'ms';

/**
 * A flat sign mesh (unlit, always crisp). `label` is { ms, en } or a plain string.
 * `iconKey` + `iconSvg(key)` draw a small picture at the left of the text.
 */
export function createSign({ label, color = '#ff7eb6', w = 4, h = 1, px = 512, iconKey = null, iconSvg = null, paper }) {
  const W = px, H = Math.round(px * (h / w));
  const canvas = makeCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const tex = canvasTexture(canvas);
  const mat = new MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
  const mesh = new Mesh(planeGeo(w, h), mat);
  mesh.renderOrder = 2;
  let img = null;
  const textOf = (lang) => (typeof label === 'string' ? label : (label[lang] || label.ms));
  const api = {
    mesh,
    repaint(lang = currentLang) { paintSign(ctx, W, H, textOf(lang), color, img, { paper }); tex.needsUpdate = true; },
    /** change the words and the colour (for example when the world theme changes) */
    setLabel(newLabel, newColor) { label = newLabel; if (newColor) color = newColor; api.repaint(); },
    dispose() { registry.delete(api); tex.dispose(); mat.dispose(); }
  };
  api.repaint();
  if (iconKey && iconSvg) svgToImage(iconSvg(iconKey)).then((i) => { img = i; api.repaint(); }).catch(() => {});
  registry.add(api);
  return api;
}

export function setSignLanguage(lang) { currentLang = lang; registry.forEach((s) => s.repaint(lang)); }

/** A picture board (poster) painted from an SVG picture. Returns the mesh; repaint once the picture loads. */
export function createPoster({ iconKey, iconSvg, size = 1.6, bg = '#fffaf1', frame = '#ffffff' }) {
  const S = 256;
  const canvas = makeCanvas(S, S);
  const ctx = canvas.getContext('2d');
  const tex = canvasTexture(canvas);
  const paint = (img) => { ctx.fillStyle = bg; ctx.fillRect(0, 0, S, S); if (img) ctx.drawImage(img, 16, 16, S - 32, S - 32); tex.needsUpdate = true; };
  paint(null);
  const mesh = new Mesh(planeGeo(size, size), new MeshBasicMaterial({ map: tex, transparent: true }));
  svgToImage(iconSvg(iconKey)).then(paint).catch(() => {});
  void frame;
  return mesh;
}

/** Big Arabic or Latin glyph painted on a square tile (for blocks and boards). */
export function glyphTexture(glyph, { bg = '#fffaf1', fg = '#3aa98f', border = '#2e8872', arabic = false, size = 256 } = {}) {
  const c = makeCanvas(size, size), ctx = c.getContext('2d');
  ctx.fillStyle = bg; roundRect(ctx, size * 0.05, size * 0.05, size * 0.9, size * 0.9, size * 0.16); ctx.fill();
  ctx.lineWidth = size * 0.04; ctx.strokeStyle = border; ctx.stroke();
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = arabic ? `600 ${size * 0.62}px ${ARABIC_FONT}` : `700 ${size * 0.6}px ${FONT}`;
  ctx.fillText(glyph, size / 2, size * (arabic ? 0.56 : 0.54));
  return canvasTexture(c);
}

/** A picture painted from lines of text on a rectangle (menu boards, chalkboards). */
export function boardTexture(lines, { w = 512, h = 384, bg = '#3f6b55', fg = '#ffffff', size = 90, chalk = true, font = FONT } = {}) {
  const c = makeCanvas(w, h), ctx = c.getContext('2d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  if (chalk) { ctx.globalAlpha = 0.07; for (let i = 0; i < 40; i++) { ctx.fillStyle = '#fff'; ctx.fillRect(Math.random() * w, Math.random() * h, 60 + Math.random() * 140, 4 + Math.random() * 6); } ctx.globalAlpha = 1; }
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const n = lines.length;
  lines.forEach((ln, i) => { ctx.font = `700 ${size}px ${font}`; ctx.fillText(ln, w / 2, (h * (i + 1)) / (n + 1)); });
  return canvasTexture(c);
}

/** A texture that shows one SVG picture on a coloured card; it repaints itself once the picture has loaded. */
export function iconTexture(iconSvg, key, { bg = '#ffffff', size = 256, pad = 22, round = true } = {}) {
  const c = makeCanvas(size, size), ctx = c.getContext('2d');
  const tex = canvasTexture(c);
  const paint = (img) => {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = bg;
    if (round) { roundRect(ctx, 6, 6, size - 12, size - 12, size * 0.2); ctx.fill(); } else ctx.fillRect(0, 0, size, size);
    if (img) ctx.drawImage(img, pad, pad, size - pad * 2, size - pad * 2);
    tex.needsUpdate = true;
  };
  paint(null);
  svgToImage(iconSvg(key)).then(paint).catch(() => {});
  return tex;
}
