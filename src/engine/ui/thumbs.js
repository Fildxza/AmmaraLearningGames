// Small pictures for the wardrobe: accessories, dresses and hairstyles.
import { c, e, rr, p, ln, cN, eN, star, heartPath, hl, kawaii, eyes, blush, smile, P, RAINBOW } from '../art/svg.js';

const wrap = (inner) => `<svg class="thumb" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><g filter="url(#ag-wobble)">${inner}</g></svg>`;
const col = (color) => (color === 'rainbow' ? 'url(#ag-rainbow)' : color);

const ACC = {
  bow: (k) => p('M50 50 L18 30 Q10 50 18 70 Z', k) + p('M50 50 L82 30 Q90 50 82 70 Z', k) + c(50, 50, 9, k),
  partyHat: (k) => p('M50 12 L76 84 H24 Z', k) + ln('M40 40 L60 46 M34 58 L66 66 M28 76 L72 84', 3, '#fff') + c(50, 12, 8, '#ffd23f'),
  crown: (k) => p('M18 74 L22 34 L36 52 L50 26 L64 52 L78 34 L82 74 Z', k) + cN(36, 64, 4, '#ff6b9f') + cN(50, 62, 4, '#7fcbff') + cN(64, 64, 4, '#ff6b9f'),
  flowerCrown: (k) => ln('M14 60 Q50 40 86 60', 5, '#5cc46a') + [20, 35, 50, 65, 80].map((x, i) => c(x, 60 - Math.sin((x - 14) / 72 * Math.PI) * 14, 9, i % 2 ? '#ffd23f' : k)).join(''),
  cap: (k) => p('M18 64 Q18 26 50 26 Q82 26 82 64 Z', k) + p('M50 64 H92 Q90 74 76 74 H50 Z', k) + c(50, 26, 4, '#fff'),
  bunnyEars: (k) => e(36, 40, 10, 30, k) + eN(36, 42, 5, 22, '#ffc3cf') + e(64, 40, 10, 30, k) + eN(64, 42, 5, 22, '#ffc3cf') + ln('M14 80 Q50 62 86 80', 5, '#ff8fc0'),
  catEars: (k) => p('M20 76 L32 26 L50 64 Z', k) + p('M80 76 L68 26 L50 64 Z', k) + p('M28 66 L33 40 L42 60 Z', '#ffc3cf') + p('M72 66 L67 40 L58 60 Z', '#ffc3cf'),
  chefHat: (k) => rr(28, 56, 44, 24, 4, k) + c(36, 44, 14, k) + c(52, 36, 16, k) + c(66, 46, 13, k),
  antenna: (k) => ln('M40 80 L30 30 M60 80 L70 30', 3) + p(star(30, 26, 12, 5), '#ffd23f') + c(70, 26, 9, k) + ln('M24 84 Q50 74 76 84', 5, k),
  starGlasses: (k) => p(star(30, 52, 22, 10), k) + p(star(70, 52, 22, 10), k) + ln('M44 52 H56', 4),
  roundGlasses: (k) => c(30, 52, 16, '#eaf6ff') + c(70, 52, 16, '#eaf6ff') + `<circle cx="30" cy="52" r="16" fill="none" stroke="${k}" stroke-width="6"/><circle cx="70" cy="52" r="16" fill="none" stroke="${k}" stroke-width="6"/>` + ln('M46 52 H54', 4),
  flowerClip: (k) => [0, 1, 2, 3, 4].map((i) => c(50 + Math.cos(i * 1.257) * 18, 50 + Math.sin(i * 1.257) * 18, 13, k)).join('') + c(50, 50, 10, '#ffd23f'),
  starClip: (k) => p(star(50, 52, 36, 16), k) + hl(42, 38, 4, 2),
  backpack: (k) => p('M36 26 Q36 14 50 14 Q64 14 64 26', 'none') + rr(22, 24, 56, 64, 14, k) + rr(30, 54, 40, 24, 8, '#ffd65a') + c(50, 40, 4, '#fff'),
  cape: (k) => p('M30 18 Q50 26 70 18 L84 84 Q50 92 16 84 Z', col(k)) + c(50, 20, 6, '#ffd23f'),
  wings: (k) => e(30, 40, 20, 26, k, 'opacity=".9"') + e(70, 40, 20, 26, k, 'opacity=".9"') + e(34, 72, 14, 16, '#ffc3dc') + e(66, 72, 14, 16, '#ffc3dc') + rr(46, 30, 8, 50, 4, '#7d5c4b'),
  balloon: (k) => `<path d="${heartPath(50, 36, 0.9)}" fill="${k}" stroke="#5b3f33" stroke-width="3"/>` + ln('M50 62 Q44 76 52 92', 2.4) + hl(38, 26, 5, 3),
  wand: (k) => ln('M30 88 L60 38', 6, '#ffffff') + ln('M30 88 L60 38', 2.4) + p(star(64, 32, 22, 10), k) + cN(84, 18, 3, '#ffd23f') + cN(40, 20, 2.4, '#ffd23f')
};

export function accessoryThumb(model, color) { return wrap((ACC[model] || ACC.starClip)(color)); }
export function outfitThumb(color) {
  return wrap(p('M36 14 Q50 22 64 14 L70 30 L62 34 L80 86 Q50 94 20 86 L38 34 L30 30 Z', col(color)) + ln('M40 16 Q50 26 60 16', 3, '#fff') + c(50, 60, 4, '#ffffff'));
}
export function noneThumb() { return wrap(c(50, 50, 30, '#fff6e6', 'stroke-dasharray="6 6"') + ln('M30 70 L70 30', 4, '#c9c4d6')); }
export function hairThumb(style, hairColor, hijabColor) {
  const face = c(50, 56, 26, P.skin) + eyes(50, 58, 9, 3) + blush(50, 64, 15, 3.6, 2.2) + smile(50, 64, 3.6, 2);
  if (style === 'hijab') return wrap(p('M18 60 Q16 16 50 14 Q84 16 82 60 Q84 86 70 92 H30 Q16 86 18 60 Z', hijabColor) + c(50, 56, 24, P.skin) + eyes(50, 58, 9, 3) + blush(50, 64, 15, 3.6, 2.2) + smile(50, 64, 3.6, 2) + p('M27 46 Q50 26 73 46 Q50 36 27 46 Z', hijabColor));
  let hair = p('M22 56 Q20 24 50 22 Q80 24 78 56 Q66 40 50 40 Q34 40 22 56 Z', hairColor);
  if (style === 'pigtails') hair += e(18, 62, 9, 14, hairColor) + e(82, 62, 9, 14, hairColor) + cN(22, 50, 4, '#ff7eb6') + cN(78, 50, 4, '#ff7eb6');
  if (style === 'bun') hair = c(50, 18, 12, hairColor) + hair;
  if (style === 'short') hair += e(26, 58, 6, 12, hairColor) + e(74, 58, 6, 12, hairColor);
  return wrap(face + hair);
}
export const RAINBOW_DEF = `<linearGradient id="ag-rainbow" x1="0" y1="0" x2="0" y2="1">${RAINBOW.map((cc, i) => `<stop offset="${(i / 5).toFixed(2)}" stop-color="${cc}"/>`).join('')}</linearGradient>`;
void kawaii;
