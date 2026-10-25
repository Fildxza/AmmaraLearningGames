// AmmaraGames picture library: hand-drawn icons + procedural families.
// Pure string generation, so it runs in the browser and in Node tests.
import { c, e, rr, p, ln, cN, eN, pN, rN, hl, kawaii, star, polygon, heartPath, text, esc, shade, blob, COLORS, RAINBOW, P, K, FONT } from './svg.js';
import { animals } from './lib-animals.js';
import { food } from './lib-food.js';
import { vehicles, body, objects } from './lib-things.js';
import { nature, space, hygiene, safety, actions, faces } from './lib-world.js';
import { town } from './lib-town.js';

const HAND = Object.assign({}, animals, food, vehicles, body, objects, nature, space, hygiene, safety, actions, faces, town);
export const HAND_KEYS = Object.keys(HAND);

const SHAPES = ['circle', 'square', 'triangle', 'rectangle', 'star', 'heart', 'oval', 'crescent', 'hexagon'];
const SHAPE_DEFAULT = { circle: 'sky', square: 'butter', triangle: 'mint', rectangle: 'peach', star: 'yellow', heart: 'pink', oval: 'purple', crescent: 'butter', hexagon: 'butter' };
const LETTER_COLORS = ['#ff6f9f', '#ff9a3c', '#f5b400', '#3fbf6a', '#3d8bfd', '#9b6bff'];
export const SIZE_KINDS = ['s', 'm', 'l'];

// ---------- key parsing --------------------------------------------------
export function parseKey(key) {
  if (typeof key !== 'string' || !key) return null;
  if (HAND[key]) return { kind: 'hand', key };
  const i = key.indexOf(':');
  if (i < 0) return null;
  const head = key.slice(0, i);
  const rest = key.slice(i + 1);
  const parts = rest.split(':');
  switch (head) {
    case 'letter': return /^[A-Za-z]$/.test(rest) ? { kind: 'letter', ch: rest } : null;
    case 'num': return /^\d{1,2}$/.test(rest) && +rest <= 20 ? { kind: 'num', n: +rest } : null;
    case 'dots': return /^\d{1,2}$/.test(rest) && +rest >= 1 && +rest <= 10 ? { kind: 'dots', n: +rest } : null;
    case 'count': {
      const n = +parts[1];
      return parts.length === 2 && HAND[parts[0]] && Number.isInteger(n) && n >= 1 && n <= 10 ? { kind: 'count', item: parts[0], n } : null;
    }
    // colour words (used for labels) also get a picture: a paint splash, or the rainbow ball
    case 'color': return parts.length === 1 ? (COLORS[rest] ? { kind: 'paint', color: rest } : rest === 'rainbow' ? { kind: 'ball', color: 'rainbow' } : null) : null;
    case 'ball': case 'paint': case 'crayon':
      return parts.length === 1 && (COLORS[rest] || rest === 'rainbow') ? { kind: head, color: rest } : null;
    case 'shape': {
      if (!SHAPES.includes(parts[0]) || parts.length > 2) return null;
      const col = parts[1] || SHAPE_DEFAULT[parts[0]];
      return COLORS[col] ? { kind: 'shape', shape: parts[0], color: col, explicitColor: !!parts[1] } : null;
    }
    case 'size': case 'len':
      return parts.length === 2 && HAND[parts[0]] && SIZE_KINDS.includes(parts[1]) ? { kind: head, item: parts[0], size: parts[1] } : null;
    case 'shadow': return HAND[rest] ? { kind: 'shadow', item: rest } : null;
    case 'mix': {
      const [a, b] = rest.split('+');
      return COLORS[a] && COLORS[b] ? { kind: 'mix', a, b } : null;
    }
    case 'bubble': return rest.length > 0 && rest.length <= 14 ? { kind: 'bubble', text: rest } : null;
    case 'seq': {
      const items = rest.split('|');
      if (items.length < 2 || items.length > 7) return null;
      return items.every((k) => k === '?' || (parseKey(k) && parseKey(k).kind !== 'seq')) ? { kind: 'seq', items } : null;
    }
    case 'mascot': return rest === 'star' || rest === 'cloud' ? { kind: 'mascot', style: rest } : null;
    default: return null;
  }
}
export const isIconKey = (key) => !!parseKey(key);

// ---------- procedural drawings -------------------------------------------
function letter(ch) {
  const col = LETTER_COLORS[ch.toUpperCase().charCodeAt(0) % LETTER_COLORS.length];
  const upper = ch === ch.toUpperCase();
  return rr(9, 9, 82, 82, 20, '#fffaf1') + rr(15, 15, 70, 70, 14, 'none', `stroke="${shade(col, 0.18)}" stroke-width="3.4" stroke-dasharray="1 7"`) +
    rN(9, 70, 82, 21, 10, shade(col, 0.36), 0.55) + text(50, upper ? 54 : 50, ch, upper ? 60 : 64, col, upper ? 2.6 : 2.4, '', 600);
}
function numeral(n) {
  const col = LETTER_COLORS[(n + 2) % LETTER_COLORS.length];
  return c(50, 50, 40, '#fff4c9') + cN(50, 30, 26, '#fff', 0.35) + text(50, 53, String(n), n >= 10 ? 50 : 64, col, 6);
}
const COUNT_LAYOUT = {
  1: [[50, 50]], 2: [[28, 50], [72, 50]], 3: [[28, 32], [72, 32], [50, 72]], 4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[24, 24], [76, 24], [50, 50], [24, 76], [76, 76]], 6: [[20, 30], [50, 30], [80, 30], [20, 70], [50, 70], [80, 70]],
  7: [[16, 30], [39, 30], [62, 30], [85, 30], [27, 70], [50, 70], [73, 70]], 8: [[14, 30], [38, 30], [62, 30], [86, 30], [14, 70], [38, 70], [62, 70], [86, 70]],
  9: [[20, 18], [50, 18], [80, 18], [20, 50], [50, 50], [80, 50], [20, 82], [50, 82], [80, 82]],
  10: [[12, 30], [31, 30], [50, 30], [69, 30], [88, 30], [12, 70], [31, 70], [50, 70], [69, 70], [88, 70]]
};
const COUNT_SCALE = { 1: 0.62, 2: 0.44, 3: 0.4, 4: 0.4, 5: 0.36, 6: 0.31, 7: 0.25, 8: 0.24, 9: 0.28, 10: 0.2 };
const place = (x, y, s, inner) => `<g transform="translate(${(x - 50 * s).toFixed(2)} ${(y - 50 * s).toFixed(2)}) scale(${s})">${inner}</g>`;
function count(item, n) {
  const inner = HAND[item]();
  return COUNT_LAYOUT[n].map(([x, y]) => place(x, y, COUNT_SCALE[n], inner)).join('');
}
function ball(color) {
  if (color === 'rainbow') {
    let segs = '';
    RAINBOW.forEach((col, i) => {
      const a0 = (i / 6) * Math.PI * 2 - Math.PI / 2; const a1 = ((i + 1) / 6) * Math.PI * 2 - Math.PI / 2;
      segs += pN(`M50 50 L${50 + Math.cos(a0) * 34} ${50 + Math.sin(a0) * 34} A34 34 0 0 1 ${50 + Math.cos(a1) * 34} ${50 + Math.sin(a1) * 34} Z`, col);
    });
    return segs + c(50, 50, 34, 'none') + c(50, 50, 7, '#ffffff', 'stroke-width="2"') + hl(36, 32, 8, 4);
  }
  const col = COLORS[color];
  return c(50, 50, 34, col) + pN('M24 64 q26 14 52 0 q-6 14 -26 18 q-20 -4 -26 -18 z', shade(col, -0.12), 0.7) + c(50, 50, 34, 'none') + hl(36, 32, 9, 4.5) + cN(64, 30, 2.5, '#fff', 0.7);
}
function paint(color) {
  const col = color === 'rainbow' ? '#ff9a3c' : COLORS[color];
  return p('M50 14 q14 0 16 12 q12 -6 18 4 q6 12 -6 18 q14 6 8 18 q-6 10 -18 4 q2 16 -14 18 q-14 2 -16 -12 q-12 8 -20 -2 q-8 -10 4 -18 q-14 -6 -8 -18 q6 -10 18 -4 q0 -20 18 -20 z', col) +
    c(84, 76, 5, col) + c(16, 20, 4, col) + c(88, 18, 3, col) + hl(38, 32, 7, 3.5);
}
function crayon(color) {
  const col = COLORS[color] || '#ff9a3c';
  return `<g transform="rotate(-35 50 50)">` + p('M14 40 h58 v20 h-58 z', col) + p('M72 40 l18 10 l-18 10 z', shade(col, 0.15)) + p('M84 46.5 l6 3.5 l-6 3.5 z', col) +
    rN(24, 40, 30, 20, 0, '#ffffff', 0.85) + rr(24, 40, 30, 20, 0, 'none', 'stroke-width="2"') + ln('M30 50 h18', 2.4, col) + rr(8, 40, 8, 20, 3, shade(col, -0.15)) + '</g>';
}
function shape(kind, color) {
  const col = COLORS[color];
  let d;
  switch (kind) {
    case 'circle': return c(50, 50, 36, col) + hl(36, 34, 8, 4.5);
    case 'square': return rr(16, 16, 68, 68, 6, col) + hl(30, 28, 8, 3.5, -20);
    case 'rectangle': return rr(8, 26, 84, 48, 6, col) + hl(22, 36, 8, 3, -15);
    case 'triangle': d = 'M50 12 L90 84 H10 Z'; break;
    case 'star': d = star(50, 54, 44, 19); break;
    case 'heart': d = heartPath(50, 46, 1.25); break;
    case 'oval': return e(50, 50, 30, 42, col) + hl(40, 30, 6, 10, 20);
    case 'crescent': d = 'M62 10 q-34 8 -34 40 q0 32 34 40 q-46 8 -54 -40 q8 -48 54 -40 z'; break;
    case 'hexagon': d = polygon(50, 50, 40, 6, 0); break;
    default: return '';
  }
  return p(d, col) + hl(40, 40, 6, 3);
}
const SIZE_SCALE = { s: 0.42, m: 0.66, l: 0.94 };
function sized(item, size) { const s = SIZE_SCALE[size]; return `<g transform="translate(${50 - 50 * s} ${96 - 96 * s}) scale(${s})">${HAND[item]()}</g>`; }
const LEN_SCALE = { s: 0.4, m: 0.66, l: 0.98 };
function lengthed(item, size) { const s = LEN_SCALE[size]; return `<g transform="translate(${50 - 50 * s} 0) scale(${s} 1)">${HAND[item]()}</g>`; }
const DOTS = {
  1: [[50, 50]], 2: [[30, 30], [70, 70]], 3: [[28, 28], [50, 50], [72, 72]], 4: [[30, 30], [70, 30], [30, 70], [70, 70]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]], 6: [[30, 26], [70, 26], [30, 50], [70, 50], [30, 74], [70, 74]],
  7: [[30, 26], [70, 26], [30, 50], [50, 50], [70, 50], [30, 74], [70, 74]], 8: [[30, 24], [50, 24], [70, 24], [30, 50], [70, 50], [30, 76], [50, 76], [70, 76]],
  9: [[28, 28], [50, 28], [72, 28], [28, 50], [50, 50], [72, 50], [28, 72], [50, 72], [72, 72]],
  10: [[24, 32], [37, 32], [50, 32], [63, 32], [76, 32], [24, 68], [37, 68], [50, 68], [63, 68], [76, 68]]
};
function dots(n) { return rr(10, 10, 80, 80, 18, '#ffffff') + DOTS[n].map(([x, y]) => c(x, y, n > 6 ? 6 : 7.5, '#ff6f9f', 'stroke-width="2"')).join(''); }
function questionBox() { return rr(14, 14, 72, 72, 16, '#fff6e6', 'stroke-dasharray="7 6"') + text(50, 53, '?', 50, '#b79cff', 5); }
function drop(color) { const col = COLORS[color]; return p('M50 10 q28 32 28 52 q0 26 -28 26 q-28 0 -28 -26 q0 -20 28 -52 z', col) + hl(38, 50, 4, 10, 25); }
function plus(x, sym) { return text(x, 52, sym, 46, '#b79cff', 5); }
function bubble(t) {
  const size = t.length <= 5 ? 44 : t.length <= 8 ? 36 : 28;
  return p('M18 14 h184 q14 0 14 14 v52 q0 14 -14 14 h-150 l-26 14 l6 -14 h-14 q-14 0 -14 -14 v-52 q0 -14 14 -14 z', '#ffffff') + text(110, 54, t, size, '#ff7a2e', 2.6);
}
function mascot(style) {
  if (style === 'cloud') {
    return blob([[26, 56, 18], [44, 42, 22], [64, 44, 20], [78, 58, 15], [50, 64, 18]], '#ffffff') + kawaii(52, 56, 1.1) + cN(34, 30, 3, '#ffd23f');
  }
  return p(star(50, 54, 44, 22), '#ffd84f') + pN(star(50, 58, 30, 15), '#ffe999', 0.6) + kawaii(50, 56, 1.15) + hl(36, 34, 5, 2.5, -40) + cN(82, 22, 3, '#fff3b0');
}

// Returns { w, h, body } — body is SVG markup in a w x h box.
export function iconBody(key) {
  const k = parseKey(key);
  if (!k) return { w: 100, h: 100, body: questionBox() };
  switch (k.kind) {
    case 'hand': return { w: 100, h: 100, body: HAND[k.key]() };
    case 'letter': return { w: 100, h: 100, body: letter(k.ch) };
    case 'num': return { w: 100, h: 100, body: numeral(k.n) };
    case 'count': return { w: 100, h: 100, body: count(k.item, k.n) };
    case 'ball': return { w: 100, h: 100, body: ball(k.color) };
    case 'paint': return { w: 100, h: 100, body: paint(k.color) };
    case 'crayon': return { w: 100, h: 100, body: crayon(k.color) };
    case 'shape': return { w: 100, h: 100, body: shape(k.shape, k.color) };
    case 'size': return { w: 100, h: 100, body: sized(k.item, k.size) };
    case 'len': return { w: 100, h: 100, body: lengthed(k.item, k.size) };
    case 'dots': return { w: 100, h: 100, body: dots(k.n) };
    case 'shadow': return { w: 100, h: 100, body: `<g filter="url(#ag-sil)">${HAND[k.item]()}</g>` };
    case 'mascot': return { w: 100, h: 100, body: mascot(k.style) };
    case 'bubble': return { w: 220, h: 110, body: bubble(k.text) };
    case 'mix': return { w: 300, h: 100, body: drop(k.a) + plus(100, '+') + `<g transform="translate(100 0)">${drop(k.b)}</g>` + plus(200, '=') + `<g transform="translate(200 0)">${questionBox()}</g>` };
    case 'seq': {
      const w = k.items.length * 100;
      const body = k.items.map((it, i) => `<g transform="translate(${i * 100 + 8} 8) scale(.84)">${it === '?' ? questionBox() : iconBody(it).body}</g>`).join('');
      return { w, h: 100, body };
    }
    default: return { w: 100, h: 100, body: questionBox() };
  }
}

// Shared SVG filters. Injected once into the page; included inline for standalone images.
export const SVG_DEFS =
  '<filter id="ag-wobble" x="-4%" y="-4%" width="108%" height="108%"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="7" result="n"/>' +
  '<feDisplacementMap in="SourceGraphic" in2="n" scale="1.8" xChannelSelector="R" yChannelSelector="G"/></filter>' +
  '<filter id="ag-sil"><feFlood flood-color="#4b3f6b" result="f"/><feComposite in="f" in2="SourceAlpha" operator="in"/></filter>';

// Full <svg>. `custom` lets teacher-defined answer pictures use an emoji or image.
export function iconSVG(key, opts = {}) {
  const { cls = 'ag-icon', fx = true, standalone = false, title = '', custom = null } = opts;
  let w = 100, h = 100, bodyMarkup;
  if (custom && custom.emoji) bodyMarkup = `<text x="50" y="56" font-size="70" text-anchor="middle" dominant-baseline="central">${esc(custom.emoji)}</text>`;
  else if (custom && custom.image) bodyMarkup = `<image href="${esc(custom.image)}" x="4" y="4" width="92" height="92" preserveAspectRatio="xMidYMid meet"/>`;
  else ({ w, h, body: bodyMarkup } = iconBody(custom && custom.icon ? custom.icon : key));
  const defs = standalone ? `<defs>${SVG_DEFS}</defs>` : '';
  const t = title ? `<title>${esc(title)}</title>` : '';
  const xmlns = standalone ? ' xmlns="http://www.w3.org/2000/svg"' : '';
  const wrap = fx ? `<g filter="url(#ag-wobble)">${bodyMarkup}</g>` : bodyMarkup;
  return `<svg${xmlns} class="${cls}" viewBox="0 0 ${w} ${h}" role="img" aria-hidden="${title ? 'false' : 'true'}" focusable="false">${t}${defs}${wrap}</svg>`;
}

export function iconAspect(key) { const { w, h } = iconBody(key); return w / h; }
export { COLORS, FONT };
