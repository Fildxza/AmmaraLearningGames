// Nature, space, hygiene, safety, actions and feelings (original drawings for AmmaraGames).
import { c, e, rr, p, pw, ln, cN, eN, pN, rN, rot, hl, eyes, eye1, blush, smile, kawaii, blob, star, heartPath, text, kidHead, kidBody, P, K } from './svg.js';

const drop = (x, y, s = 1, f = '#5bb8f5') => p(`M${x} ${y - 9 * s} q${7 * s} ${9 * s} ${7 * s} ${13 * s} q0 ${6 * s} ${-7 * s} ${6 * s} q${-7 * s} 0 ${-7 * s} ${-6 * s} q0 ${-4 * s} ${7 * s} ${-13 * s} z`, f, `stroke-width="${2.2}"`);
const bubble = (x, y, r) => c(x, y, r, '#eaf8ff', 'stroke-width="2"') + cN(x - r * 0.35, y - r * 0.35, r * 0.28, '#fff');
const sunSmall = () => c(76, 24, 10, '#ffd84f') + ln('M76 8 v-2 M92 24 h2 M64 12 l-2 -2 M88 12 l2 -2', 2.4, '#ffb43c');
const cloudShape = (f = '#ffffff') => blob([[28, 56, 16], [44, 44, 20], [64, 46, 18], [76, 58, 13], [50, 62, 16]], f);

export const nature = {
  sun: () => {
    let rays = '';
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; rays += pw(`M${(50 + Math.cos(a - 0.14) * 30).toFixed(1)} ${(50 + Math.sin(a - 0.14) * 30).toFixed(1)} L${(50 + Math.cos(a) * 46).toFixed(1)} ${(50 + Math.sin(a) * 46).toFixed(1)} L${(50 + Math.cos(a + 0.14) * 30).toFixed(1)} ${(50 + Math.sin(a + 0.14) * 30).toFixed(1)} Z`, '#ffb43c', 2.4); }
    return rays + c(50, 50, 28, '#ffd84f') + kawaii(50, 48, 1.1) + hl(38, 36, 6, 3);
  },
  moon: () => p('M62 12 q-30 6 -32 38 q2 32 34 38 q-40 10 -50 -36 q4 -42 48 -40 z', '#ffe27a') + eye1(30, 46, 2.8) + eN(34, 56, 3.4, 2, P.blush, 0.75) + smile(28, 56, 2.6, 1.5, 1.8) + cN(78, 26, 3, '#ffd23f') + cN(84, 70, 2.2, '#ffd23f'),
  moon_full: () => c(50, 50, 36, '#fff1a8') + c(36, 38, 6, '#f2dc7e', 'stroke-width="1.8"') + c(62, 60, 8, '#f2dc7e', 'stroke-width="1.8"') + c(60, 32, 4, '#f2dc7e', 'stroke-width="1.8"') + c(38, 66, 3.5, '#f2dc7e', 'stroke-width="1.8"') + hl(34, 26, 8, 3),
  star: () => p(star(50, 52, 42, 19), '#ffd84f') + kawaii(50, 54, 0.9) + hl(40, 34, 4, 2),
  cloud: () => cloudShape() + kawaii(52, 54, 0.9),
  rain: () => blob([[28, 40, 14], [44, 30, 18], [62, 32, 16], [74, 42, 12], [50, 46, 14]], '#b9c7e6') + drop(30, 72) + drop(50, 82) + drop(70, 72) + drop(40, 92, 0.6) + drop(62, 94, 0.6),
  rainbow: () => {
    const cols = ['#ff5a5a', '#ff9a3c', '#ffd23f', '#4cc46a', '#3d8bfd', '#9b6bff'];
    let out = '';
    cols.forEach((col, i) => { const r = 40 - i * 5; out += `<path d="M${50 - r} 74 A${r} ${r} 0 0 1 ${50 + r} 74" fill="none" stroke="${col}" stroke-width="5.4"/>`; });
    return `<path d="M8 74 A42 42 0 0 1 92 74" fill="none" stroke="${K}" stroke-width="2.4"/>` + out +
      blob([[14, 76, 9], [24, 72, 10], [32, 78, 8]], '#ffffff') + blob([[68, 78, 8], [76, 72, 10], [86, 76, 9]], '#ffffff');
  },
  tree: () => rr(42, 56, 16, 36, 4, '#b07a52') + ln('M50 70 l-8 -8 M50 76 l8 -6', 2.4, '#8a5a3c') + blob([[30, 46, 18], [50, 30, 22], [70, 46, 18], [50, 54, 18]], '#5cc46a') + cN(40, 34, 4, '#8fe08a', 0.8) + cN(64, 40, 3, '#8fe08a', 0.8) + c(36, 52, 4, '#ff5a5a') + c(64, 54, 4, '#ff5a5a') + c(54, 36, 4, '#ff5a5a'),
  flower: () => {
    let petals = '';
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; petals += c(50 + Math.cos(a) * 16, 38 + Math.sin(a) * 16, 11, '#ff8fc0'); }
    return ln('M50 54 q-2 20 0 38', 4, '#3fa64a') + e(38, 76, 10, 5, P.leaf, rot(-30, 38, 76)) + e(62, 70, 10, 5, P.leaf, rot(30, 62, 70)) + petals + c(50, 38, 11, '#ffd84f') + kawaii(50, 37, 0.5);
  },
  leaf: () => p('M16 84 q-4 -50 38 -68 q30 -10 34 -8 q2 30 -14 54 q-20 28 -58 22 z', '#5cc46a') + ln('M18 82 q30 -30 62 -66 M38 60 q-2 -14 4 -24 M52 46 q10 2 20 -2 M46 70 q10 2 18 -6', 2.4, '#3f8f4a') + hl(40, 40, 3, 10, 40),
  seed: () => ln('M8 80 q42 -10 84 0', 3, '#8a5a3c') + e(50, 52, 16, 24, '#c48a5a', rot(20, 50, 52)) + ln('M44 36 q-6 16 2 32', 2, '#9a6340') + hl(44, 44, 3, 8, 20) + e(26, 72, 6, 9, '#c48a5a', rot(-30, 26, 72)) + e(76, 70, 6, 9, '#c48a5a', rot(30, 76, 70)),
  sprout: () => p('M14 86 q36 -22 72 0 z', '#a8763e') + ln('M50 72 v-30', 4, '#3fa64a') + p('M50 44 q-6 -22 -30 -20 q4 22 30 20 z', '#7fd36b') + p('M50 50 q6 -24 30 -24 q-2 24 -30 24 z', '#6bc45a') + ln('M50 44 q-12 -10 -24 -16 M50 50 q12 -10 24 -20', 1.6, '#3f8f4a'),
  mountain: () => p('M6 84 l30 -54 l16 26 l14 -22 l28 50 z', '#8fa7c9') + p('M36 30 l-9 16 q5 4 9 0 q4 4 8 0 z', '#ffffff') + p('M66 34 l-7 11 q4 3 7 0 q3 3 6 0 z', '#ffffff') + cN(80, 20, 7, '#ffd84f', 0.9),
  snow: () => { let arms = ''; for (let i = 0; i < 6; i++) { const a = i * 60; arms += `<g transform="rotate(${a} 50 50)">${ln('M50 50 V12 M50 24 l-8 -8 M50 24 l8 -8 M50 36 l-7 -6 M50 36 l7 -6', 4, '#7fcbff')}</g>`; } return arms + c(50, 50, 7, '#dff4ff'); },
  rock: () => p('M12 76 q-2 -20 14 -30 q10 -18 30 -16 q24 2 32 22 q10 16 0 26 q-36 8 -76 -2 z', '#b5aebf') + ln('M44 44 l6 10 l-4 8 M66 52 l-6 8', 2, '#8d879c') + hl(32, 48, 8, 3, -20),
  water_drop: () => p('M50 8 q26 30 26 50 q0 26 -26 26 q-26 0 -26 -26 q0 -20 26 -50 z', '#7fcbff') + kawaii(50, 56, 0.85) + hl(38, 46, 3.5, 9, 25),
  lightning: () => blob([[28, 36, 14], [44, 26, 18], [62, 28, 16], [74, 38, 12], [50, 40, 14]], '#9aa3c4') + p('M52 46 l-14 22 h12 l-8 26 l24 -32 h-12 l8 -16 z', '#ffd23f'),
  scene_day: () => rr(6, 6, 88, 88, 14, '#bfe7ff') + sunSmall() + rN(6, 72, 88, 22, 10, '#8fdc7a') + p('M30 74 v-22 l16 -14 l16 14 v22 z', '#ffffff') + p('M26 54 l20 -18 l20 18', 'none', 'stroke-width="4"') + rr(41, 60, 10, 14, 2, '#ff9a6a') + rr(6, 6, 88, 88, 14, 'none'),
  scene_night: () => rr(6, 6, 88, 88, 14, '#3c4a8c') + p('M70 14 q-14 4 -14 18 q0 14 16 16 q-22 6 -26 -16 q2 -20 24 -18 z', '#ffe27a') + p(star(24, 22, 6, 2.6), '#ffe27a', 'stroke-width="1.6"') + p(star(36, 40, 4, 1.8), '#ffe27a', 'stroke-width="1.4"') + p(star(86, 52, 4, 1.8), '#ffe27a', 'stroke-width="1.4"') + rN(6, 72, 88, 22, 10, '#2f6b4a') + p('M30 74 v-22 l16 -14 l16 14 v22 z', '#d7dde6') + rr(41, 60, 10, 14, 2, '#ffe27a') + rr(6, 6, 88, 88, 14, 'none'),
};

export const space = {
  earth: () => c(50, 50, 38, '#5bb8f5') + pN('M30 26 q14 -6 18 6 q-2 10 -12 12 q-4 12 -14 8 q-6 -14 8 -26 z', '#5cc46a') + pN('M58 54 q14 -6 20 6 q-2 14 -14 18 q-10 -2 -10 -12 q-6 -6 4 -12 z', '#5cc46a') + pN('M60 22 q8 -2 10 4 q-4 4 -10 -4 z', '#5cc46a') + c(50, 50, 38, 'none') + hl(34, 30, 8, 4),
  mars: () => c(50, 50, 36, '#e8643c') + pN('M26 40 q10 -6 16 2 q-6 8 -16 -2 z', '#c44a2a') + c(62, 34, 6, '#d4532f', 'stroke-width="1.8"') + c(58, 64, 9, '#d4532f', 'stroke-width="1.8"') + c(34, 64, 4, '#d4532f', 'stroke-width="1.8"') + hl(36, 30, 7, 3),
  saturn: () => `<path d="M10 58 A42 13 -12 0 1 90 42" fill="none" stroke="${K}" stroke-width="10"/><path d="M10 58 A42 13 -12 0 1 90 42" fill="none" stroke="#e8c98a" stroke-width="5"/>` +
    c(50, 50, 26, '#ffd98a') + pN('M26 44 q24 6 48 -4 v6 q-24 10 -48 4 z', '#e8b86a') + c(50, 50, 26, 'none') +
    `<path d="M90 42 A42 13 -12 0 1 10 58" fill="none" stroke="${K}" stroke-width="10"/><path d="M90 42 A42 13 -12 0 1 10 58" fill="none" stroke="#e8c98a" stroke-width="5"/>` + hl(40, 36, 5, 2.5),
  jupiter: () => c(50, 50, 40, '#f2d2a4') + `<clipPath id="ag-cp-jup"><circle cx="50" cy="50" r="40"/></clipPath><g clip-path="url(#ag-cp-jup)">` +
    rN(0, 24, 100, 8, 0, '#d9a06e') + rN(0, 40, 100, 6, 0, '#c9845a') + rN(0, 58, 100, 9, 0, '#d9a06e') + rN(0, 74, 100, 6, 0, '#c9845a') + '</g>' +
    e(64, 62, 9, 5.5, '#e0643c', 'stroke-width="2"') + c(50, 50, 40, 'none') + hl(32, 30, 7, 3),
  astronaut: () =>
    rr(28, 54, 44, 36, 12, '#ffffff') + rr(18, 58, 12, 26, 6, '#ffffff') + rr(70, 58, 12, 26, 6, '#ffffff') + rr(40, 64, 20, 12, 3, '#7fcbff') + cN(46, 70, 2, '#ff5a5a') + cN(54, 70, 2, '#4cc46a') +
    c(50, 34, 26, '#ffffff') + e(50, 36, 18, 15, '#5a6fa8') + c(50, 37, 12, P.skin, 'stroke-width="0"') + eyes(50, 37, 4.5, 2.2) + blush(50, 41, 7, 2.4, 1.4) + smile(50, 41, 2.4, 1.4, 1.6) +
    eN(42, 28, 6, 3, '#fff', 0.5, rot(-30, 42, 28)) + ln('M50 8 v-4', 3) + cN(50, 4, 2.6, '#ff5a5a'),
  telescope: () => ln('M50 56 l-18 36 M50 56 l18 36 M50 56 v36', 3.4, '#8a5a3c') + p('M14 52 l60 -30 l8 14 l-60 30 z', '#7fcbff') + p('M74 22 l10 -6 l8 16 l-10 4 z', '#4a90e2') + rr(42, 46, 14, 10, 3, '#ffd23f') + p(star(86, 60, 5, 2.2), '#ffd23f', 'stroke-width="1.4"'),
  comet: () => p('M66 34 q-30 -6 -58 -26 q14 26 46 42 z', '#bfe7ff') + p('M64 42 q-26 2 -54 -6 q20 18 48 18 z', '#dff4ff') + c(68, 44, 16, '#ffe27a') + hl(64, 38, 4, 2),
  spacesuit: () =>
    rr(28, 46, 44, 44, 12, '#ffffff') + rr(16, 50, 14, 32, 7, '#ffffff') + rr(70, 50, 14, 32, 7, '#ffffff') + rr(40, 56, 20, 14, 3, '#7fcbff') + cN(46, 63, 2, '#ff5a5a') + cN(54, 63, 2, '#4cc46a') +
    c(50, 26, 20, '#ffffff') + e(50, 28, 14, 11, '#3d4a7a') + eN(44, 24, 5, 2.5, '#fff', 0.55, rot(-30, 44, 24)) + rr(30, 88, 16, 6, 3, '#d7dde6') + rr(54, 88, 16, 6, 3, '#d7dde6')
};

export const hygiene = {
  soap: () => bubble(22, 24, 8) + bubble(36, 14, 5) + bubble(76, 20, 6) + rr(14, 40, 72, 44, 16, '#ff9fc8') + rr(20, 44, 60, 10, 5, '#ffc3dc', 'stroke-width="0"') + kawaii(50, 62, 1) + rr(14, 40, 72, 44, 16, 'none'),
  toothbrush: () => `<g transform="rotate(-40 50 50)">` + rr(8, 44, 64, 12, 6, '#5fd6a8') + rr(68, 46, 24, 8, 3, '#d7dde6') + rr(70, 30, 22, 16, 3, '#ffffff') + ln('M74 32 v12 M79 32 v12 M84 32 v12 M89 32 v12', 1.6, '#7fcbff') +
    blob([[74, 26, 4], [80, 24, 4.5], [86, 26, 4]], '#ffffff', 1.4) + ln('M74 25 q6 -4 12 0', 2.4, '#7fcbff') + hl(30, 47, 10, 1.6, 0) + '</g>',
  toothpaste: () => p('M14 40 h52 l16 -4 v28 l-16 -4 h-52 z', '#ffffff') + rN(14, 46, 52, 8, 0, '#4a90e2') + p('M14 40 h52 l16 -4 v28 l-16 -4 h-52 z', 'none') + rr(82, 40, 8, 20, 2, '#ff5a5a') + p('M20 28 q8 -12 18 -6 q8 4 16 -2', 'none', `stroke="#7fcbff" stroke-width="5"`),
  towel: () => ln('M10 20 h80', 5, '#b07a52') + p('M20 20 h60 v64 q-30 6 -60 0 z', '#ff9fc8') + rN(20, 60, 60, 6, 0, '#ffffff', 0.9) + rN(20, 70, 60, 4, 0, '#ffffff', 0.9) + p('M20 20 h60 v64 q-30 6 -60 0 z', 'none') + ln('M24 84 v6 M32 85 v6 M40 86 v6 M48 86 v6 M56 86 v6 M64 85 v6 M72 85 v6', 2) + hl(34, 36, 3, 10, 0),
  comb: () => rr(10, 30, 80, 18, 8, '#c9b6ff') + ln('M18 48 v26 M26 48 v26 M34 48 v26 M42 48 v26 M50 48 v26 M58 48 v26 M66 48 v26 M74 48 v26 M82 48 v26', 4, '#a77bf0') + rr(10, 30, 80, 18, 8, 'none') + hl(30, 36, 10, 2, 0),
  shampoo: () => ln('M50 18 h18', 4) + rr(44, 14, 12, 14, 3, '#4a90e2') + p('M34 34 q0 -6 8 -6 h16 q8 0 8 6 v52 q0 6 -6 6 h-20 q-6 0 -6 -6 z', '#7fcbff') + rr(38, 52, 24, 20, 4, '#ffffff') + `<path d="${heartPath(50, 61, 0.2)}" fill="#ff7eb6"/>` + bubble(20, 40, 7) + bubble(80, 34, 6) + bubble(76, 54, 4),
  tissue: () => p('M38 30 q4 -22 12 -18 q8 -6 14 4 q-6 10 -10 14', '#ffffff') + rr(14, 34, 72, 48, 8, '#7fcbff') + rr(30, 34, 40, 10, 4, '#ffffff') + p('M28 66 q10 -8 20 0 t20 0', 'none', `stroke="#ffffff" stroke-width="3"`),
  nail_clipper: () => p('M12 50 q0 -10 10 -10 h56 l12 6 l-12 4 h-56 q-10 0 -10 0 z', '#d7dde6') + p('M12 56 q0 10 10 10 h56 l12 -6 l-12 -4 h-56 z', '#c9d1dc') + p('M26 46 q20 -24 50 -14 l-2 6 q-26 -6 -44 12 z', '#e6ebf2') + c(70, 52, 4, '#8d879c'),
  tap: () => rr(16, 18, 40, 14, 6, '#d7dde6') + rr(30, 8, 12, 12, 3, '#ff7eb6') + p('M50 18 h14 q10 0 10 10 v8 h-12 v-6 h-12 z', '#d7dde6') + p('M64 40 q-2 14 0 26 q2 14 0 26', 'none', `stroke="#7fcbff" stroke-width="8"`) + drop(80, 74, 0.7) + drop(50, 82, 0.6),
  shower: () => ln('M20 92 v-70 q0 -10 10 -10 h20 q10 0 10 10 v6', 4, '#b9b4c7') + p('M44 30 h32 q-2 -10 -16 -10 q-14 0 -16 10 z', '#d7dde6') + drop(48, 50, 0.6) + drop(60, 56, 0.6) + drop(72, 50, 0.6) + drop(54, 72, 0.6) + drop(66, 76, 0.6) + drop(78, 70, 0.6),
  bathtub: () => bubble(26, 38, 9) + bubble(42, 30, 11) + bubble(60, 32, 9) + bubble(74, 40, 8) + rr(8, 44, 84, 10, 5, '#ffffff') + p('M12 54 h76 q0 26 -22 28 h-32 q-22 -2 -22 -28 z', '#7fcbff') + ln('M24 82 l-4 8 M76 82 l4 8', 3.4) + ln('M84 44 v-18 q0 -6 -6 -6', 3, '#d7dde6'),
  clean_clothes: () => p('M26 24 l14 -8 q10 8 20 0 l14 8 l12 16 l-12 8 l-4 -6 v44 h-40 v-44 l-4 6 l-12 -8 z', '#7fcbff') + p('M40 16 q10 8 20 0', 'none') + p(star(80, 66, 9, 4), '#ffe27a', 'stroke-width="2"') + p(star(20, 70, 6, 2.6), '#ffe27a', 'stroke-width="1.8"') + hl(40, 40, 3, 10, 0),
  dirty_clothes: () => p('M26 24 l14 -8 q10 8 20 0 l14 8 l12 16 l-12 8 l-4 -6 v44 h-40 v-44 l-4 6 l-12 -8 z', '#7fcbff') + pN('M36 46 q8 -6 12 2 q-2 8 -12 -2 z', '#8a5a3c', 0.85) + pN('M52 64 q10 -4 12 4 q-6 8 -12 -4 z', '#8a5a3c', 0.85) + pN('M38 72 q4 -2 6 2 q-4 4 -6 -2 z', '#8a5a3c', 0.85) + pN('M60 34 q4 -2 6 2 q-3 4 -6 -2 z', '#8a5a3c', 0.85)
};

export const safety = {
  helmet: () => p('M12 64 q0 -40 40 -42 q36 0 38 38 l-8 6 z', '#4a90e2') + p('M30 30 q8 -6 14 -2 l-6 16 z M50 26 q8 0 12 4 l-8 14 z', '#bfe7ff') + rr(10, 60, 82, 10, 5, '#ffd23f') + ln('M26 70 q8 18 24 18 q16 0 22 -18', 3) + hl(30, 40, 4, 8, 30),
  seatbelt: () => rr(14, 10, 72, 80, 14, '#8d879c') + p('M30 10 l40 80', 'none', 'stroke-width="18"') + ln('M30 10 l40 80', 13, '#4a4350') + rr(36, 40, 28, 20, 5, '#d7dde6', rot(25, 50, 50)) + rr(44, 46, 12, 8, 2, '#ff5a5a', rot(25, 50, 50)),
  traffic_red: () => rr(32, 6, 36, 82, 10, '#4a4350') + c(50, 24, 11, '#ff4040') + cN(50, 24, 15, '#ff4040', 0.25) + c(50, 50, 11, '#6b5f3a') + c(50, 76, 11, '#2f5a3a') + hl(46, 20, 3, 2) + ln('M50 88 v8', 4),
  traffic_green: () => rr(32, 6, 36, 82, 10, '#4a4350') + c(50, 24, 11, '#6b3434') + c(50, 50, 11, '#6b5f3a') + c(50, 76, 11, '#3fe06a') + cN(50, 76, 15, '#3fe06a', 0.25) + hl(46, 72, 3, 2) + ln('M50 88 v8', 4),
  zebra_crossing: () => p('M30 8 h40 l26 84 h-92 z', '#6b6475') + p('M31 18 h38 l2 7 h-42 z M28 32 h44 l3 9 h-50 z M24 50 h52 l4 11 h-60 z M19 70 h62 l4 13 h-70 z', '#ffffff', 'stroke-width="0"') + p('M30 8 h40 l26 84 h-92 z', 'none'),
  adult: () => kidHead(50, 20, 0.95, '#3d2a20') + p('M34 36 q16 -6 32 0 l6 34 h-44 z', '#7fcbff') + ln('M36 40 l-12 22 M64 40 l12 22', 6, P.skin) + ln('M42 70 v22 M58 70 v22', 7, '#4a5bb5'),
  child: () => kidHead(50, 40, 0.85, '#6b3b26') + kidBody(50, 52, 0.95, '#ff8fc0') + ln('M41 56 l-8 12 M59 56 l8 12', 5, P.skin) + ln('M45 74 v14 M55 74 v14', 5, '#4a5bb5'),
  stove: () => ln('M30 22 q-6 -8 0 -14 M50 22 q-6 -8 0 -14 M70 22 q-6 -8 0 -14', 3, '#c9c4d6') + rr(8, 34, 10, 6, 3, P.black) + rr(82, 34, 10, 6, 3, P.black) + p('M16 30 h68 v30 q0 10 -10 10 h-48 q-10 0 -10 -10 z', '#d7dde6') + rr(12, 26, 76, 8, 4, '#b9b4c7') + rr(10, 74, 80, 10, 4, '#4a4350') + p('M30 74 q4 -8 8 0 q4 -8 8 0 q4 -8 8 0 q4 -8 8 0 q4 -8 8 0', '#ff7a3c', 'stroke-width="2"') + rN(16, 46, 68, 6, 0, '#ff5a5a', 0.6),
  knife: () => p('M20 80 l12 -12 l6 6 l-12 12 q-6 2 -6 -6 z', '#8a5a3c') + p('M34 66 l40 -50 q8 -4 6 6 l-34 54 z', '#e6ebf2') + ln('M40 64 l30 -36', 1.6, '#ffffff'),
  medicine: () => rr(26, 28, 40, 58, 8, '#ffb38a') + rr(30, 16, 32, 14, 4, '#ffffff') + rr(32, 44, 28, 26, 4, '#ffffff') + rr(42, 48, 8, 18, 1, '#ff5a5a') + rr(37, 53, 18, 8, 1, '#ff5a5a') + rr(70, 64, 20, 10, 5, '#7fcbff') + c(78, 84, 6, '#ffd23f'),
  socket: () => rr(14, 14, 72, 72, 10, '#ffffff') + rr(54, 22, 24, 14, 3, '#d7dde6') + rr(44, 40, 8, 14, 2, P.black) + rr(28, 62, 14, 7, 2, P.black) + rr(54, 62, 14, 7, 2, P.black) + p('M80 80 l8 -18 h-6 l6 -16', 'none', `stroke="#ffd23f" stroke-width="3"`),
  life_jacket: () => p('M30 14 h12 q8 10 16 0 h12 l10 16 v52 q0 8 -8 8 h-44 q-8 0 -8 -8 v-52 z', '#ff8a2e') + ln('M50 26 v60', 3) + rr(22, 50, 56, 7, 3, '#4a4350') + rr(22, 66, 56, 7, 3, '#4a4350') + rr(44, 50, 12, 7, 2, '#d7dde6') + rr(44, 66, 12, 7, 2, '#d7dde6')
};

const arm = (d) => ln(d, 6, P.skin) ;
export const actions = {
  act_wash_hands: () => rr(18, 6, 34, 10, 4, '#d7dde6') + p('M44 16 h10 q8 0 8 8 v4 h-8 v-4 h-10 z', '#d7dde6') + ln('M58 30 v14', 6, '#7fcbff') +
    p('M24 70 q-4 -18 10 -24 l20 -2 q6 0 6 6 q0 4 -6 4 h-6 l16 2 q6 0 6 6 q0 6 -6 6 l-28 6 q-12 0 -18 -4 z', P.skin) + p('M80 70 q4 -18 -10 -24 l-12 2 q-6 0 -6 6 q0 4 6 4 h4 l-12 4 q-6 2 -4 8 l18 6 q12 0 16 -6 z', P.skin) +
    bubble(30, 40, 6) + bubble(76, 34, 7) + bubble(50, 84, 6) + bubble(20, 84, 4),
  act_sleep: () => rr(8, 50, 84, 30, 8, '#ff9fc8') + e(30, 46, 18, 10, '#ffffff') + kidHead(32, 40, 0.85, P.hair, 'closed') + p('M44 50 h48 v24 h-48 q-6 -12 0 -24 z', '#c9b6ff') + text(74, 22, 'z', 14, '#7fcbff', 2.4) + text(86, 10, 'z', 10, '#7fcbff', 2),
  act_run: () => kidHead(54, 22, 0.9) + p('M46 34 l14 2 l-4 22 h-14 z', '#ff8fc0') + ln('M44 56 l-10 14 l-10 -4 M56 56 l10 14 l10 0', 6, '#4a5bb5') + arm('M48 38 l-12 10 M58 38 l12 -6') + ln('M10 30 h14 M6 42 h16 M12 54 h12', 3, '#c9c4d6'),
  act_eat: () => p('M14 52 h72 q-4 32 -36 32 q-32 0 -36 -32 z', '#ffb38a') + blob([[34, 48, 10], [50, 44, 12], [66, 48, 10]], '#ffffff', 2) + ln('M72 14 q4 22 -6 34', 5, '#d7dde6') + e(73, 13, 6, 8, '#e6ebf2') + cN(46, 42, 2, '#4cc46a') + cN(56, 44, 2, '#ff5a5a'),
  act_brush_teeth: () => kidHead(44, 48, 1.6) + p('M44 66 l40 -32', 'none', 'stroke-width="9"') + ln('M44 66 l40 -32', 5, '#5fd6a8') + rr(36, 58, 16, 9, 3, '#ffffff', rot(-38, 44, 62)) + bubble(26, 76, 4) + bubble(62, 78, 5),
  act_bath: () => kidHead(44, 40, 1) + bubble(26, 52, 9) + bubble(62, 50, 10) + bubble(78, 46, 6) + rr(8, 52, 84, 10, 5, '#ffffff') + p('M12 62 h76 q0 22 -22 24 h-32 q-22 -2 -22 -24 z', '#7fcbff') + ln('M24 86 l-4 6 M76 86 l4 6', 3.4),
  act_wash_hair: () => kidHead(50, 56, 1.4, P.hair, 'closed') + blob([[30, 30, 10], [44, 22, 12], [60, 22, 12], [72, 32, 10], [52, 32, 10]], '#eaf8ff', 2) + bubble(18, 52, 6) + bubble(84, 54, 6) + bubble(80, 18, 5),
  act_share: () => p('M6 70 q6 -16 22 -18 l16 -2 q6 0 6 6 q0 6 -6 6 h-8', P.skin) + p('M94 70 q-6 -16 -22 -18 l-16 -2 q-6 0 -6 6 q0 6 6 6 h8', P.skin) + c(50, 40, 16, '#ffffff') + p('M50 24 q-12 16 0 32 q-16 -6 -16 -16 q0 -10 16 -16 z', '#ff5a5a') + p('M50 24 q12 16 0 32 q16 -6 16 -16 q0 -10 -16 -16 z', '#3d8bfd') + c(50, 40, 16, 'none') + `<path d="${heartPath(50, 82, 0.22)}" fill="#ff7eb6" stroke="${K}" stroke-width="2"/>`,
  act_tidy: () => rr(14, 50, 72, 40, 6, '#e8a36a') + rr(14, 50, 72, 10, 4, '#c9814a') + c(34, 40, 9, '#ff5a5a') + rr(52, 24, 16, 16, 3, '#7fcbff', rot(15, 60, 32)) + ln('M76 12 q10 14 2 28 m-6 -6 l6 6 l6 -6', 3, '#4cc46a') + p(star(30, 18, 6, 2.6), '#ffe27a', 'stroke-width="1.6"'),
  act_shout: () => kidHead(46, 52, 1.6, P.hair, 'shout') + ln('M76 30 l12 -8 M80 44 h14 M76 58 l12 8', 3.4, '#ff5a5a') + text(84, 82, '!', 18, '#ff5a5a', 3),
  act_throw_toy: () => kidHead(34, 56, 1) + kidBody(34, 70, 0.9, '#7fcbff') + arm('M42 74 l14 -14') + c(70, 30, 10, '#ff5a5a') + ln('M58 46 l-6 6 M54 38 l-8 4 M62 52 l-4 8', 3, '#c9c4d6') + rr(78, 50, 12, 12, 3, '#ffd23f', rot(20, 84, 56)),
  act_hug: () => kidHead(36, 42, 1.1, P.hair, 'closed') + kidHead(64, 42, 1.1, '#3d2a20', 'closed') + p('M20 62 q30 -10 60 0 l4 30 h-68 z', '#ff8fc0') + ln('M26 66 q24 16 48 0', 6, P.skin) + `<path d="${heartPath(50, 16, 0.3)}" fill="#ff7eb6" stroke="${K}" stroke-width="2"/>`,
  act_breathe: () => kidHead(40, 52, 1.5, P.hair, 'closed') + ln('M70 46 q8 -6 14 0 q6 6 0 12 q-6 4 -10 -2', 3, '#7fcbff') + ln('M68 64 q10 2 18 -4', 3, '#7fcbff') + cN(86, 30, 3, '#bfe7ff') + cN(90, 72, 2.4, '#bfe7ff'),
  act_tell_adult: () => kidHead(66, 22, 0.9, '#3d2a20') + p('M52 36 q14 -6 28 0 l4 32 h-36 z', '#7fcbff') + ln('M58 68 v24 M74 68 v24', 6, '#4a5bb5') +
    kidHead(26, 54, 0.75) + kidBody(26, 64, 0.8, '#ff8fc0') + ln('M22 82 v10 M30 82 v10', 4, '#4a5bb5') + rr(28, 18, 26, 18, 8, '#ffffff') + p('M34 36 l-4 8 l10 -8 z', '#ffffff') + text(41, 27, '!', 12, '#ff5a5a', 2),
  act_wave: () => kidHead(36, 50, 1.4) + p('M70 66 q-6 -14 -4 -24 l-4 -14 q0 -4 4 -4 l4 12 l-2 -18 q0 -4 4 -4 q4 0 4 4 l2 16 l2 -18 q0 -4 4 -4 q4 0 4 4 l-2 20 l6 -8 q2 -4 6 -2 q2 2 0 6 l-10 18 q-2 10 -6 16 z', P.skin) + ln('M62 18 q-6 6 -6 14 M92 14 q4 6 4 14', 2.6, '#c9c4d6'),
  act_thanks: () => rr(10, 12, 80, 52, 22, '#ffffff') + p('M30 62 l-8 18 l20 -16 z', '#ffffff') + `<path d="${heartPath(50, 38, 0.55)}" fill="#ff6f9f" stroke="${K}" stroke-width="2.6"/>` + p(star(78, 24, 6, 2.6), '#ffe27a', 'stroke-width="1.6"') + p(star(20, 30, 4, 1.8), '#ffe27a', 'stroke-width="1.4"'),
  act_sorry: () => rr(10, 12, 80, 52, 22, '#ffffff') + p('M30 62 l-8 18 l20 -16 z', '#ffffff') + `<path d="${heartPath(50, 38, 0.55)}" fill="#ffb3cc" stroke="${K}" stroke-width="2.6"/>` + rr(38, 30, 24, 10, 4, '#f6cfb0', rot(-30, 50, 35)) + cN(46, 36, 1.2, '#c98a6a') + cN(52, 34, 1.2, '#c98a6a'),
  act_bye: () => rr(54, 10, 36, 80, 4, '#c48a5a') + c(60, 52, 3, '#ffd23f') + p('M34 74 q-6 -14 -4 -24 l-4 -14 q0 -4 4 -4 l4 12 l-2 -18 q0 -4 4 -4 q4 0 4 4 l2 16 l2 -18 q0 -4 4 -4 q4 0 4 4 l-2 20 l6 -8 q2 -4 6 -2 q2 2 0 6 l-10 18 q-2 10 -6 16 z', P.skin) + ln('M22 26 q-6 6 -6 14 M50 22 q4 4 4 12', 2.6, '#c9c4d6'),
  act_turns: () => kidHead(20, 46, 0.7) + kidBody(20, 56, 0.75, '#ff8fc0') + kidHead(50, 46, 0.7, '#3d2a20') + kidBody(50, 56, 0.75, '#7fcbff') + kidHead(80, 46, 0.7, '#8a5a3c') + kidBody(80, 56, 0.75, '#6fdcb4') + text(20, 86, '1', 14, '#ffd23f', 2.4) + text(50, 86, '2', 14, '#ffd23f', 2.4) + text(80, 86, '3', 14, '#ffd23f', 2.4) + ln('M30 18 h40 m-8 -6 l8 6 l-8 6', 3, '#4cc46a'),
  act_stop: () => c(50, 50, 40, '#ff5a5a') + p('M38 76 q-6 -14 -4 -24 l-4 -14 q0 -4 4 -4 l4 12 l-2 -18 q0 -4 4 -4 q4 0 4 4 l2 16 l2 -18 q0 -4 4 -4 q4 0 4 4 l-2 20 l6 -8 q2 -4 6 -2 q2 2 0 6 l-10 18 q-2 10 -6 16 z', '#ffffff'),
  act_go: () => c(50, 50, 40, '#3fd06a') + c(50, 24, 7, '#ffffff', 'stroke-width="2"') + ln('M50 32 l-2 22 M48 54 l-10 18 M48 54 l12 16 M48 38 l-12 8 M50 38 l12 6', 6, '#ffffff'),
  act_snatch: () => p('M6 66 q4 -14 18 -16 l10 -2 q6 0 6 6 q0 6 -6 6', P.skin) + p('M94 66 q-4 -14 -18 -16 l-10 -2 q-6 0 -6 6 q0 6 6 6', P.skin) + c(50, 44, 16, '#c48a5a') + c(38, 30, 6, '#c48a5a') + c(62, 30, 6, '#c48a5a') + eyes(50, 42, 5, 2.2) + ln('M30 20 l-6 -6 M70 20 l6 -6 M50 16 v-8', 2.6, '#ff9a3c')
};

// Feeling faces: a round child face whose features change with the feeling.
function faceBase() { return c(50, 54, 36, P.skin) + p('M14 50 q2 -36 36 -38 q34 2 36 38 q-8 -16 -36 -18 q-28 2 -36 18 z', '#5a3424'); }
export const faces = {
  face_happy: () => faceBase() + ln('M33 54 q5 -6 10 0 M57 54 q5 -6 10 0', 3) + blush(50, 64, 22, 5.5, 3.4) + p('M36 66 q14 18 28 0 z', '#c0485c') + p('M42 72 q8 6 16 0 q-8 -4 -16 0 z', '#ff8fa3', 'stroke-width="0"'),
  face_sad: () => faceBase() + ln('M30 46 l10 -4 M70 46 l-10 -4', 2.6) + eyes(50, 56, 12, 3.6) + blush(50, 66, 22, 5, 3) + ln('M40 76 q10 -10 20 0', 3) + p('M34 62 q4 8 0 12 q-4 -4 0 -12 z', '#7fcbff', 'stroke-width="1.8"'),
  face_angry: () => faceBase() + ln('M30 42 l14 6 M70 42 l-14 6', 3.4) + eyes(50, 54, 12, 3.4) + eN(50, 64, 30, 6, '#ff6b6b', 0.35) + ln('M38 74 q12 -8 24 0', 3.2),
  face_scared: () => faceBase() + ln('M30 40 q6 -6 12 -2 M70 40 q-6 -6 -12 -2', 2.6) + c(38, 52, 7, '#ffffff', 'stroke-width="2.4"') + c(62, 52, 7, '#ffffff', 'stroke-width="2.4"') + cN(38, 53, 3.4, P.black) + cN(62, 53, 3.4, P.black) + ln('M38 72 q4 -4 8 0 q4 4 8 0 q4 -4 8 0', 2.6) + drop2(76, 40),
  face_surprised: () => faceBase() + ln('M30 38 q8 -8 14 -2 M70 38 q-8 -8 -14 -2', 2.6) + eyes(50, 52, 12, 4.2) + blush(50, 62, 22, 5, 3) + e(50, 72, 6, 8, '#c0485c'),
  face_sleepy: () => faceBase() + ln('M32 56 q6 4 12 0 M56 56 q6 4 12 0', 3) + blush(50, 64, 22, 5, 3) + e(50, 72, 4, 3, '#c0485c') + text(80, 30, 'z', 14, '#7fcbff', 2.4) + text(90, 16, 'z', 10, '#7fcbff', 2),
  face_calm: () => faceBase() + ln('M33 56 q5 3 10 0 M57 56 q5 3 10 0', 3) + blush(50, 64, 22, 5.5, 3.4) + ln('M42 70 q8 6 16 0', 3) + cN(18, 24, 3, '#c9b6ff') + cN(84, 28, 2.4, '#c9b6ff')
};
function drop2(x, y) { return p(`M${x} ${y - 7} q5 7 5 10 q0 4 -5 4 q-5 0 -5 -4 q0 -3 5 -10 z`, '#bfe7ff', 'stroke-width="1.8"'); }
