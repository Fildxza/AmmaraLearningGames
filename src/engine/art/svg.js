// Shared drawing helpers for the AmmaraGames picture library.
// Every picture is drawn in a 100 x 100 box with a soft brown outline,
// pastel fills, a white highlight and (often) a small kawaii face.

export const K = '#5b3f33';           // outline ink
export const FONT = "Fredoka, 'Baloo 2', 'Arial Rounded MT Bold', 'Segoe UI', system-ui, sans-serif";

export const P = {
  red: '#ff6b6b', redD: '#e04848', pink: '#ff8fc0', pinkL: '#ffc8de', blush: '#ff9fb6',
  orange: '#ffa34d', orangeD: '#f07f2a', yellow: '#ffd65a', yellowD: '#f2b632', cream: '#fff6e6',
  green: '#6fcf6a', greenD: '#3fa64a', leaf: '#5cc46a', mint: '#6fdcb4', sky: '#7fcbff', blue: '#4a90e2',
  navy: '#4a5bb5', purple: '#a77bf0', lav: '#c9b6ff', brown: '#b07a52', brownD: '#8a5a3c', tan: '#e7c39a',
  white: '#ffffff', grey: '#c9c4d6', greyD: '#8d879c', black: '#3d3436', skin: '#f6cfb0', skinD: '#e9b48f',
  hair: '#5a3424', water: '#8fd3ff', steel: '#d7dde6'
};

// Named colours used by ball:, paint:, crayon:, shape: patterns.
export const COLORS = {
  red: '#ff5a5a', blue: '#3d8bfd', yellow: '#ffd23f', green: '#4cc46a', orange: '#ff9a3c',
  purple: '#9b6bff', pink: '#ff8ccf', brown: '#a8693f', white: '#ffffff', black: '#3a3a3a',
  grey: '#a9a9b8', sky: '#6cc4ff', mint: '#5fd6a8', butter: '#ffe27a', peach: '#ffb38a'
};
export const RAINBOW = ['#ff5a5a', '#ff9a3c', '#ffd23f', '#4cc46a', '#3d8bfd', '#9b6bff'];

const SW = 3;
const st = (w = SW) => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

// The default outline attributes come first; extra attributes passed by a caller replace them (never repeat them,
// because a repeated attribute is invalid XML and makes the picture fail to load as a standalone SVG image).
const withExtra = (base, extra) => {
  if (!extra) return base;
  let out = base;
  for (const m of extra.matchAll(/([a-zA-Z:-]+)="/g)) out = out.replace(new RegExp(`\\s*${m[1]}="[^"]*"`), '');
  return `${out} ${extra}`;
};
export const c = (cx, cy, r, f, x = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}" ${withExtra(st(), x)}/>`;
export const e = (cx, cy, rx, ry, f, x = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${f}" ${withExtra(st(), x)}/>`;
export const rr = (x, y, w, h, r, f, xx = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${f}" ${withExtra(st(), xx)}/>`;
export const p = (d, f = 'none', x = '') => `<path d="${d}" fill="${f}" ${withExtra(st(), x)}/>`;
export const pw = (d, f, w, x = '') => `<path d="${d}" fill="${f}" ${withExtra(st(w), x)}/>`;
export const ln = (d, w = 3, col = K, x = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${x}/>`;
// no-outline helpers
export const cN = (cx, cy, r, f, o = 1) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}" opacity="${o}"/>`;
export const eN = (cx, cy, rx, ry, f, o = 1, x = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${f}" opacity="${o}" ${x}/>`;
export const pN = (d, f, o = 1) => `<path d="${d}" fill="${f}" opacity="${o}"/>`;
export const rN = (x, y, w, h, r, f, o = 1) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${f}" opacity="${o}"/>`;
export const g = (t, inner) => `<g transform="${t}">${inner}</g>`;
export const rot = (a, x, y) => `transform="rotate(${a} ${x} ${y})"`;

// White shine used on almost every object.
export const hl = (cx, cy, rx, ry, a = -30) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".6" transform="rotate(${a} ${cx} ${cy})"/>`;

// Kawaii face: two shiny eyes, rosy cheeks and a smile.
export function eyes(cx, cy, dx, r = 3.3) {
  return `<circle cx="${cx - dx}" cy="${cy}" r="${r}" fill="${P.black}"/><circle cx="${cx + dx}" cy="${cy}" r="${r}" fill="${P.black}"/>` +
    `<circle cx="${cx - dx + r * 0.35}" cy="${cy - r * 0.4}" r="${r * 0.36}" fill="#fff"/><circle cx="${cx + dx + r * 0.35}" cy="${cy - r * 0.4}" r="${r * 0.36}" fill="#fff"/>`;
}
export const eye1 = (cx, cy, r = 3.3) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${P.black}"/><circle cx="${cx + r * 0.35}" cy="${cy - r * 0.4}" r="${r * 0.36}" fill="#fff"/>`;
export const blush = (cx, cy, dx, rx = 4.6, ry = 2.8) => eN(cx - dx, cy, rx, ry, P.blush, 0.75) + eN(cx + dx, cy, rx, ry, P.blush, 0.75);
export const smile = (cx, cy, w = 4, d = 3.5, sw = 2.4) => ln(`M${cx - w} ${cy} Q${cx} ${cy + d * 2} ${cx + w} ${cy}`, sw);
export function kawaii(cx, cy, s = 1) {
  return eyes(cx, cy, 8 * s, 3.2 * s) + blush(cx, cy + 6 * s, 13 * s, 4.4 * s, 2.7 * s) + smile(cx, cy + 4.5 * s, 3.6 * s, 2.4 * s, 2.2 * Math.max(0.8, s));
}

// Outline of several overlapping circles drawn as one soft blob (clouds, manes, broccoli…).
export function blob(circles, fill, w = SW) {
  const strokeLayer = circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${K}" stroke-width="${w * 2}"/>`).join('');
  const fillLayer = circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join('');
  return strokeLayer + fillLayer;
}

export function star(cx, cy, R, r, n = 5, rotDeg = -90) {
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const rad = (rotDeg + (i * 180) / n) * Math.PI / 180;
    const rr2 = i % 2 === 0 ? R : r;
    d += (i === 0 ? 'M' : 'L') + (cx + Math.cos(rad) * rr2).toFixed(1) + ' ' + (cy + Math.sin(rad) * rr2).toFixed(1) + ' ';
  }
  return d + 'Z';
}
export function polygon(cx, cy, R, n, rotDeg = -90) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const rad = (rotDeg + (i * 360) / n) * Math.PI / 180;
    d += (i === 0 ? 'M' : 'L') + (cx + Math.cos(rad) * R).toFixed(1) + ' ' + (cy + Math.sin(rad) * R).toFixed(1) + ' ';
  }
  return d + 'Z';
}
export const heartPath = (cx, cy, s) =>
  `M${cx} ${cy + 28 * s} C${cx - 34 * s} ${cy + 6 * s} ${cx - 30 * s} ${cy - 24 * s} ${cx} ${cy - 10 * s} C${cx + 30 * s} ${cy - 24 * s} ${cx + 34 * s} ${cy + 6 * s} ${cx} ${cy + 28 * s} Z`;

export function text(x, y, str, size, fill, sw = 4, extra = '', weight = 700) {
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-weight="${weight}" font-size="${size}" text-anchor="middle" dominant-baseline="central" fill="${fill}" stroke="${K}" stroke-width="${sw}" stroke-linejoin="round" paint-order="stroke" ${extra}>${esc(str)}</text>`;
}
export function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  return '#' + ((1 << 24) + (f(n >> 16) << 16) + (f((n >> 8) & 255) << 8) + f(n & 255)).toString(16).slice(1);
}

// A simple child figure used in action pictures.
export function kidHead(cx, cy, s = 1, hair = P.hair, mood = 'smile') {
  const r = 15 * s;
  let out = c(cx, cy, r, P.skin);
  out += p(`M${cx - r} ${cy - 1 * s} Q${cx - r + 1} ${cy - r - 4 * s} ${cx} ${cy - r - 2 * s} Q${cx + r} ${cy - r - 4 * s} ${cx + r} ${cy - 1 * s} Q${cx + 6 * s} ${cy - 10 * s} ${cx - 2 * s} ${cy - 7 * s} Q${cx - 9 * s} ${cy - 9 * s} ${cx - r} ${cy - 1 * s} Z`, hair);
  if (mood === 'closed') out += ln(`M${cx - 8 * s} ${cy + 2 * s} q2.5 2.5 5 0 M${cx + 3 * s} ${cy + 2 * s} q2.5 2.5 5 0`, 2);
  else out += eyes(cx, cy + 2 * s, 5.5 * s, 2.3 * s);
  out += blush(cx, cy + 6.5 * s, 9 * s, 3 * s, 1.8 * s);
  if (mood === 'shout') out += e(cx, cy + 9 * s, 3.6 * s, 3.4 * s, '#c0485c');
  else out += smile(cx, cy + 7 * s, 3 * s, 1.8 * s, 2);
  return out;
}
export function kidBody(cx, top, s = 1, color = P.pink) {
  return p(`M${cx - 10 * s} ${top + 22 * s} L${cx - 7 * s} ${top} Q${cx} ${top - 3 * s} ${cx + 7 * s} ${top} L${cx + 10 * s} ${top + 22 * s} Z`, color);
}
