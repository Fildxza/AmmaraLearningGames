// Town pictures: money, shops, food stalls, clothes, funfair, museum, sea life, recycling, Malaysia, sky.
// Original drawings for AmmaraGames, same style as the other libraries (100 x 100 box, soft outline, pastel fill).
import { c, e, rr, p, ln, cN, eN, pN, rN, rot, hl, kawaii, blob, star, polygon, text, P, K } from './svg.js';

// the Malaysian flag (Jalur Gemilang): 14 red and white stripes, a blue canton down to the bottom of the 8th
// stripe, a yellow crescent and a yellow 14-pointed star
function jalurGemilang(x, y, w, h) {
  const s = h / 14;
  let out = rN(x, y, w, h, 0, '#ffffff');
  for (let k = 0; k < 14; k += 2) out += rN(x, y + k * s, w, s, 0, '#e8202a');
  const cw = w * 0.5, ch = s * 8;
  out += rN(x, y, cw, ch, 0, '#1b2a8f');
  const cx = x + cw * 0.38, cy = y + ch / 2, R = ch * 0.36;
  out += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#ffd200"/><circle cx="${cx + R * 0.28}" cy="${cy}" r="${R * 0.82}" fill="#1b2a8f"/>`;
  out += pN(star(x + cw * 0.72, cy, R * 0.72, R * 0.34, 14), '#ffd200');
  return out + `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="none" stroke="${K}" stroke-width="3"/>`;
}
const bin = (col, lid, mark) =>
  rr(26, 34, 48, 54, 6, col) + rr(20, 24, 60, 12, 5, lid) + rr(42, 16, 16, 8, 3, lid) + mark + hl(36, 50, 3, 9, 0);

export const town = {
  coin: () =>
    c(50, 50, 36, '#ffd23f') + c(50, 50, 27, '#ffe680', 'stroke-width="2.4"') +
    pN(star(50, 50, 14, 6.5), '#f2b632') + hl(36, 34, 7, 11, 35),

  piggy_bank: () =>
    e(48, 56, 34, 26, P.pinkL) + c(78, 52, 13, P.pinkL) + e(84, 54, 5, 6, P.pink) + cN(82, 53, 1.3, K) + cN(86, 53, 1.3, K) +
    p('M30 34 l-4 -12 l12 6 z', P.pinkL) + p('M54 32 l2 -10 l8 10 z', P.pinkL) +
    rr(36, 78, 9, 12, 3, P.pinkL) + rr(56, 78, 9, 12, 3, P.pinkL) + rr(40, 28, 18, 5, 2.5, K) +
    c(66, 47, 3, K, 'stroke-width="0"') + ln('M14 52 q-6 2 -4 8', 2.6) + c(46, 20, 9, '#ffd23f') + hl(36, 46, 6, 9, 20),

  shopping_bag: () =>
    p('M38 34 q0 -18 12 -18 q12 0 12 18', 'none', 'stroke-width="4"') + rr(20, 32, 60, 56, 8, P.sky) + rr(20, 32, 60, 12, 6, P.blue) +
    c(38, 40, 3, '#fff') + c(62, 40, 3, '#fff') + pN(star(50, 66, 11, 5), '#ffd23f') + hl(30, 58, 4, 10, 0),

  shirt: () =>
    p('M34 18 l-24 14 l10 18 l10 -6 v40 h40 v-40 l10 6 l10 -18 l-24 -14 q-8 10 -16 0 z', P.sky) +
    p('M40 18 q10 10 20 0', 'none') + pN(star(50, 56, 9, 4), '#ffd23f') + hl(38, 46, 3, 9, 0),

  dress: () =>
    p('M40 14 h20 l4 18 l20 54 h-68 l20 -54 z', P.pink) + p('M36 32 h28', 'none') + rr(36, 28, 28, 8, 4, P.pinkL) +
    cN(36, 60, 3, '#fff') + cN(56, 70, 3, '#fff') + cN(64, 56, 3, '#fff') + cN(44, 76, 3, '#fff') + hl(46, 48, 3, 10, 10),

  shorts: () => p('M22 24 h56 l6 58 h-26 l-8 -32 l-8 32 h-26 z', P.blue) + rr(22, 22, 56, 10, 4, P.navy) + hl(32, 50, 3, 10, 0),

  sneaker: () =>
    p('M12 72 q0 -22 10 -30 l16 -8 q10 12 24 14 q22 4 28 16 q2 8 -4 10 h-70 q-4 0 -4 -2 z', P.red) +
    rr(10, 72, 82, 10, 5, '#ffffff') + ln('M32 46 l8 6 M38 40 l8 6 M44 36 l8 6', 2.4, '#ffffff') + hl(26, 56, 3, 8, 30),

  bread: () =>
    p('M14 52 q-4 -30 36 -30 q40 0 36 30 q-2 8 -8 8 v20 q0 6 -6 6 h-44 q-6 0 -6 -6 v-20 q-6 0 -8 -8 z', '#e8b06b') +
    p('M22 48 q-2 -16 28 -18 q30 2 28 18', 'none', 'stroke="#c98a3a" stroke-width="2.4"') + hl(32, 36, 5, 9, -40),

  donut: () =>
    c(50, 54, 34, '#e8b06b') + p('M18 50 q4 -28 32 -28 q28 0 32 28 q-6 8 -10 2 q-8 8 -14 0 q-8 8 -14 0 q-8 8 -14 0 q-6 6 -12 -2 z', P.pink) +
    c(50, 52, 10, '#fff8ee') + cN(34, 40, 2, '#ffd23f') + cN(62, 36, 2, '#7fcbff') + cN(70, 48, 2, '#5cc46a') + cN(40, 30, 2, '#ff6b6b'),

  cookie: () =>
    c(50, 50, 36, '#e8b06b') + c(36, 40, 5, '#6b4430', 'stroke-width="0"') + c(60, 34, 4, '#6b4430', 'stroke-width="0"') +
    c(64, 58, 5, '#6b4430', 'stroke-width="0"') + c(42, 64, 4, '#6b4430', 'stroke-width="0"') + c(52, 50, 3, '#6b4430', 'stroke-width="0"') + hl(32, 30, 5, 9, 30),

  lollipop: () =>
    rr(47, 50, 6, 42, 3, '#ffffff') + c(50, 34, 26, P.pink) +
    p('M50 34 m-18 0 a18 18 0 0 1 18 -18 a12 12 0 0 1 12 12 a8 8 0 0 1 -8 8 a4 4 0 0 1 -4 -4', 'none', 'stroke="#ffffff" stroke-width="5"') + hl(38, 24, 4, 7, 30),

  cotton_candy: () =>
    p('M44 92 l-8 -38 h28 l-8 38 z', '#7fcbff') + blob([[50, 30, 18], [34, 40, 14], [66, 40, 14], [42, 22, 12], [60, 24, 12], [50, 46, 14]], P.pinkL) + hl(40, 26, 4, 7, 30),

  popcorn: () =>
    p('M24 40 h52 l-8 50 h-36 z', '#ffffff') + p('M32 40 l4 50 M50 40 v50 M68 40 l-4 50', 'none', 'stroke="#ff5a5a" stroke-width="6"') +
    blob([[30, 34, 9], [44, 28, 10], [58, 28, 10], [70, 34, 9], [50, 18, 9], [38, 18, 7], [62, 18, 7]], '#fff3c4'),

  ice_cream: () =>
    p('M32 50 l18 42 l18 -42 z', '#e8b06b') + ln('M38 58 l20 10 M42 68 l14 7 M60 58 l-20 10', 1.8, '#c98a3a') +
    blob([[50, 38, 18], [36, 46, 10], [64, 46, 10]], P.pinkL) + c(50, 18, 5, P.red) + hl(42, 32, 4, 7, 30),

  juice: () =>
    p('M28 28 h44 l-6 62 h-32 z', '#ffb43c') + rN(30, 28, 40, 12, 0, '#fff', 0.5) + p('M28 28 h44 l-6 62 h-32 z', 'none') +
    ln('M58 28 l10 -18 h10', 4, '#ff5a8a') + c(36, 26, 8, '#ffa23a') + cN(36, 26, 4, '#ffd23f') + hl(36, 52, 3, 12, 0),

  rice_plate: () =>
    e(50, 64, 42, 20, '#ffffff') + blob([[42, 52, 12], [54, 50, 13], [46, 60, 10]], '#fffaf0') +
    e(70, 58, 9, 7, '#fff3c4') + c(70, 58, 4, '#ffb43c', 'stroke-width="2"') + p('M24 60 q4 -8 10 -2 q-4 8 -10 2 z', '#5cc46a') +
    rr(60, 64, 16, 6, 3, '#e8b06b') + cN(32, 66, 2.4, '#ff5a5a') + cN(36, 70, 2.4, '#ff5a5a') + hl(34, 50, 4, 7, 30),

  satay: () =>
    [26, 50, 74].map((x, k) => ln(`M${x - 14} ${90} L${x + 8} ${14}`, 2.6, '#c98a3a') +
      rr(x - 9, 30 + k * 2, 14, 12, 4, '#b8682e', rot(18, x, 36)) + rr(x - 12, 46 + k * 2, 14, 12, 4, '#c8783a', rot(18, x, 52))).join('') +
    e(50, 88, 30, 6, '#ffd36b'),

  noodles: () =>
    e(50, 50, 38, 10, '#ffe0a0') + p('M12 50 q0 38 38 38 q38 0 38 -38 z', '#ff8a5a') +
    ln('M26 48 q8 -10 14 0 q6 10 14 0 q6 -10 14 0', 3, '#e8a63a') + ln('M66 12 l-20 36 M76 14 l-22 34', 3, '#8a5a3c') + c(36, 44, 4, '#5cc46a', 'stroke-width="2"'),

  milk_box: () =>
    p('M30 30 l10 -14 h20 l10 14 v58 h-40 z', '#ffffff') + p('M30 30 h40', 'none') + rN(31, 52, 38, 20, 0, '#7fcbff', 0.9) +
    e(50, 62, 8, 6, '#ffffff', 'stroke-width="2"') + rr(44, 6, 8, 12, 2, '#ff8fc0'),

  roller_coaster: () =>
    p('M6 80 q14 -60 30 -40 q12 18 22 -14 q12 -30 36 20', 'none', 'stroke-width="6"') +
    p('M6 80 q14 -60 30 -40 q12 18 22 -14 q12 -30 36 20', 'none', 'stroke="#ff8fc0" stroke-width="3"') +
    ln('M18 84 v-24 M36 84 v-38 M58 84 v-50 M80 84 v-30', 2.4, '#8d879c') +
    rr(48, 22, 16, 10, 3, '#ffd23f', rot(-55, 56, 27)) + rr(60, 10, 14, 10, 3, '#7fcbff', rot(-30, 67, 15)),

  ferris_wheel: () =>
    c(50, 42, 30, 'none', 'stroke-width="4"') + ln('M50 42 l0 -30 M50 42 l26 15 M50 42 l-26 15 M50 42 l26 -15 M50 42 l-26 -15 M50 42 v30', 2.4) +
    ['#ff6b6b', '#ffd23f', '#5cc46a', '#7fcbff', '#b79cff', '#ff8fc0'].map((col, k) => { const a = (k / 6) * Math.PI * 2; return rr(50 + Math.cos(a) * 30 - 6, 42 + Math.sin(a) * 30 - 4, 12, 9, 3, col); }).join('') +
    p('M50 42 l-20 48 M50 42 l20 48', 'none', 'stroke-width="4"') + ln('M20 90 h60', 4),

  dinosaur: () =>
    p('M14 78 q4 -26 26 -30 q8 -30 22 -34 q12 -2 14 8 q-2 6 -10 6 q-6 4 -6 18 q20 6 26 30 q2 6 -6 6 h-8 l-2 -8 h-30 l-2 8 h-10 l-2 -8 q-10 4 -12 4 z', '#6fcf6a') +
    cN(66, 18, 2.4, K) + pN('M40 50 l6 -8 l6 8 z M52 46 l6 -8 l6 8 z', '#ffd23f') + hl(44, 62, 4, 8, 20),

  trex: () =>
    p('M20 86 l6 -22 q-10 -6 -16 -18 l12 2 q6 -16 22 -18 l2 -12 q10 -12 30 -6 q12 6 6 16 q-4 6 -16 6 l-2 8 q10 12 6 26 l6 18 h-12 l-4 -12 h-16 l-4 12 z', '#ff9a3c') +
    cN(64, 18, 2.4, K) + ln('M70 28 l4 4 M64 28 l4 4 M58 28 l4 4', 2, '#fff') + ln('M48 50 q8 0 10 6', 2.4) + hl(40, 64, 4, 8, 20),

  whale: () =>
    p('M10 54 q0 -26 40 -26 q34 0 38 26 q-2 22 -40 22 q-26 0 -36 -10 l-6 10 l-4 -18 l6 -4 z', '#4a90e2') +
    p('M14 62 q20 14 72 0 q-10 14 -38 14 q-26 0 -34 -14 z', '#bfe7ff') + kawaii(64, 46, 0.7) +
    ln('M50 26 q-4 -12 -10 -14 M50 26 q4 -12 10 -14 M50 26 v-14', 2.6, '#7fcbff'),

  octopus: () =>
    p('M24 54 q-2 -40 26 -40 q28 0 26 40', P.purple) + kawaii(50, 38, 0.9) +
    [18, 32, 46, 60, 74].map((x, k) => p(`M${x + 4} 52 q${k % 2 ? 6 : -6} 14 ${k % 2 ? -2 : 2} 30 q6 2 8 -4 q-4 -12 2 -26 z`, P.purple)).join(''),

  starfish: () => pN(star(50, 52, 40, 17, 5), '#ffa34d') + p(star(50, 52, 40, 17, 5), 'none') + kawaii(50, 50, 0.8) +
    cN(50, 22, 2, '#fff', 0.7) + cN(78, 44, 2, '#fff', 0.7) + cN(22, 44, 2, '#fff', 0.7),

  crab: () =>
    e(50, 60, 28, 18, P.red) + ln('M24 66 l-14 10 M26 72 l-12 12 M76 66 l14 10 M74 72 l12 12', 3) +
    c(22, 34, 10, P.red) + c(78, 34, 10, P.red) + p('M18 30 l8 4 M74 30 l8 4', 'none') + ln('M28 46 l-4 -6 M72 46 l4 -6', 3) +
    ln('M42 44 v-10 M58 44 v-10', 2.4) + cN(42, 32, 3.2, K) + cN(58, 32, 3.2, K) + ln('M44 64 q6 4 12 0', 2.2),

  shark: () =>
    p('M8 56 q20 -20 54 -18 l8 -18 l6 20 q14 4 20 16 q-20 14 -54 12 q-18 0 -26 -6 l-8 10 l-2 -16 z', '#9bb3c9') +
    p('M14 62 q34 14 78 -6 q-14 16 -46 16 q-20 0 -32 -10 z', '#e8f2fb') + kawaii(72, 50, 0.6),

  caterpillar: () =>
    [18, 32, 46, 60].map((x, k) => c(x, 62 - (k % 2) * 6, 11, k % 2 ? '#8fd45e' : '#6fcf6a')).join('') +
    c(76, 50, 14, '#6fcf6a') + kawaii(76, 48, 0.7) + ln('M70 37 l-4 -10 M82 37 l4 -10', 2.4) + cN(66, 27, 3, K) + cN(86, 27, 3, K) +
    ln('M10 84 h80', 2.4, '#5cc46a'),

  cocoon: () =>
    ln('M50 8 v14', 3) + ln('M20 12 h60', 4, '#8a5a3c') + p('M50 20 q20 10 18 38 q-2 26 -18 34 q-16 -8 -18 -34 q-2 -28 18 -38 z', '#b8d48a') +
    ln('M38 40 q12 6 24 0 M36 56 q14 6 28 0 M40 72 q10 4 20 0', 2.2, '#8aa86a'),

  recycle: () => {
    const arr = (a) => `<g transform="rotate(${a} 50 52)">` + p('M50 14 l20 32 h-10 l-10 -16 l-16 26 l-10 -6 z', '#4cc46a') + '</g>';
    return arr(0) + arr(120) + arr(240);
  },

  bin_paper: () => bin('#3d8bfd', '#2f6fd0', rr(38, 52, 24, 18, 2, '#ffffff') + ln('M42 58 h16 M42 64 h12', 2)),
  bin_plastic: () => bin('#ff9a3c', '#e07f22', p('M44 48 h12 l4 10 v22 h-20 v-22 z', '#bfe7ff')),
  bin_glass: () => bin('#a8693f', '#86512e', p('M46 44 h8 v8 q8 4 8 14 v16 h-24 v-16 q0 -10 8 -14 z', '#8fd3a0')),

  flag_my: () => ln('M14 10 v84', 4, '#8a5a3c') + jalurGemilang(18, 14, 70, 44),

  hibiscus: () => {
    let out = '';
    for (let k = 0; k < 5; k++) { const a = (k / 5) * 360; out += `<g transform="rotate(${a} 50 50)">` + p('M50 50 q-18 -10 -12 -32 q12 -10 24 0 q6 22 -12 32 z', '#e8202a') + '</g>'; }
    return out + c(50, 50, 7, '#ff6b6b') + ln('M50 50 l16 -16', 3, '#ffd23f') + cN(66, 34, 3, '#ffd23f') + cN(62, 30, 2, '#ffd23f');
  },

  letter_mail: () =>
    rr(12, 26, 76, 50, 6, '#ffffff') + p('M14 30 l36 26 l36 -26', 'none') + ln('M14 72 l26 -20 M86 72 l-26 -20', 2.4) +
    rr(66, 32, 14, 16, 2, P.pink) + pN(star(73, 40, 4.5, 2), '#ffffff'),

  mailbox: () =>
    rr(44, 56, 12, 34, 3, '#8d879c') + p('M24 58 v-26 q0 -16 26 -16 q26 0 26 16 v26 z', '#e8202a') + rr(34, 36, 32, 6, 3, K) +
    text(50, 50, 'POS', 11, '#ffffff', 0, '', 700),

  hospital: () =>
    rr(14, 30, 72, 60, 6, '#ffffff') + rr(14, 22, 72, 12, 4, '#7fcbff') +
    rr(42, 40, 16, 40, 2, '#ff5a5a') + rr(30, 52, 40, 16, 2, '#ff5a5a') + rr(22, 74, 12, 16, 2, '#bfe7ff') + rr(66, 74, 12, 16, 2, '#bfe7ff'),

  ticket: () =>
    p('M10 30 h80 v12 q-8 0 -8 8 q0 8 8 8 v12 h-80 v-12 q8 0 8 -8 q0 -8 -8 -8 z', '#ffd23f') + ln('M64 32 v36', 2.4, K, 'stroke-dasharray="3 4"') +
    pN(star(38, 50, 11, 5), '#ff6b6b'),

  film: () =>
    rr(14, 20, 72, 60, 6, '#3d3436') + [26, 42, 58, 74].map((x) => rN(x - 4, 24, 8, 6, 1.5, '#fff') + rN(x - 4, 70, 8, 6, 1.5, '#fff')).join('') +
    rr(22, 34, 56, 32, 3, '#7fcbff') + pN(star(50, 50, 9, 4), '#ffd23f'),

  lighthouse: () =>
    p('M38 88 l6 -60 h12 l6 60 z', '#ffffff') + p('M40 70 h20 l1 8 h-22 z M42 50 h16 l1 8 h-18 z', '#ff5a5a') +
    rr(40, 16, 20, 12, 3, '#ffd23f') + p('M36 16 l14 -10 l14 10 z', '#ff5a5a') + pN('M60 22 l30 -10 v20 z', '#fff3a0', 0.8) + ln('M30 88 h40', 4),

  windmill: () =>
    p('M42 90 l4 -46 h8 l4 46 z', '#ffffff') + c(50, 40, 5, '#ffd23f') +
    ['M50 40 L50 6', 'M50 40 L80 56', 'M50 40 L20 56'].map((d) => ln(d, 4, '#ffffff') + ln(d, 1.4, '#c9c4d6')).join('') + ln('M30 90 h40', 4),

  hot_air_balloon: () =>
    p('M50 8 q32 0 32 30 q0 22 -24 36 h-16 q-24 -14 -24 -36 q0 -30 32 -30 z', P.red) +
    p('M50 8 q-12 14 -10 66 M50 8 q12 14 10 66', 'none', 'stroke-width="2.4"') + pN('M30 22 q-6 16 6 38', '#ffd23f', 0.9) +
    ln('M42 74 l2 10 M58 74 l-2 10', 2.2) + rr(42, 82, 16, 12, 3, '#b07a52') + hl(36, 26, 5, 10, 20),

  mosque: () =>
    rr(22, 52, 56, 38, 4, '#ffffff') + p('M28 52 q0 -30 22 -30 q22 0 22 30 z', '#3aa98f') + ln('M50 22 v-10', 3, '#ffd23f') +
    p('M46 10 q4 -6 8 0 q-4 -2 -8 0 z', '#ffd23f') + rr(10, 34, 10, 56, 3, '#ffffff') + p('M10 34 l5 -12 l5 12 z', '#3aa98f') +
    rr(80, 34, 10, 56, 3, '#ffffff') + p('M80 34 l5 -12 l5 12 z', '#3aa98f') + p('M42 90 v-16 q8 -10 16 0 v16 z', '#ffd23f'),

  bumper_car: () =>
    rr(12, 46, 76, 30, 14, P.sky) + rr(30, 34, 40, 20, 8, '#bfe7ff') + ln('M50 34 v-26', 2.4) + c(50, 8, 3, '#ffd23f') +
    rr(8, 70, 84, 10, 5, '#3d3436') + kawaii(50, 58, 0.6),

  jogging: () =>
    c(56, 18, 10, P.skin) + p('M46 30 l12 2 l6 24 l14 16 l-6 6 l-16 -14 l-8 16 l-14 12 l-6 -6 l12 -14 l4 -20 l-12 8 l-10 -4 z', P.sky) +
    ln('M46 30 l-14 10 M60 34 l14 6', 3.4),

  swimming: () =>
    rr(6, 58, 88, 34, 8, '#7fcbff') + ln('M10 70 q8 -6 16 0 q8 6 16 0 q8 -6 16 0 q8 6 16 0 q8 -6 16 0', 2.4, '#ffffff') +
    c(46, 50, 10, P.skin) + ln('M30 56 q-8 -16 4 -24 M62 56 q8 -16 -4 -24', 3.6) + e(46, 44, 10, 4, '#ff5a5a'),

  basketball: () =>
    c(50, 50, 36, '#ff9a3c') + ln('M14 50 h72 M50 14 v72', 2.4) + ln('M24 24 q16 26 0 52 M76 24 q-16 26 0 52', 2.4) + hl(36, 34, 5, 9, 30),

  badminton: () =>
    p('M50 52 l-14 -34 h28 z', '#ffffff') + ln('M40 24 l10 28 M60 24 l-10 28 M50 18 v34', 1.8, '#c9c4d6') + c(50, 60, 10, '#ffd23f'),

  paint_palette: () =>
    p('M50 12 q38 0 38 34 q0 20 -18 20 q-12 0 -10 12 q2 12 -12 12 q-36 0 -36 -38 q0 -40 38 -40 z', '#e8c39a') +
    c(32, 34, 6, '#ff5a5a') + c(50, 26, 6, '#ffd23f') + c(68, 32, 6, '#4cc46a') + c(30, 56, 6, '#3d8bfd') + c(66, 50, 4, '#ffffff'),

  bird_cage: () =>
    p('M20 86 v-40 q0 -30 30 -30 q30 0 30 30 v40 z', 'none') + ln('M32 86 v-56 M44 86 v-68 M56 86 v-68 M68 86 v-56', 2) + ln('M16 86 h68', 4) +
    e(50, 62, 10, 8, '#ffd23f') + c(56, 54, 6, '#ffd23f') + p('M62 54 l6 2 l-6 2 z', '#ff9a3c') + cN(57, 52, 1.6, K),

  tooth: () =>
    p('M30 20 q20 -8 40 0 q14 8 8 30 q-4 14 -6 30 q-2 10 -8 6 q-4 -14 -8 -16 h-6 q-4 2 -8 16 q-6 4 -8 -6 q-2 -16 -6 -30 q-6 -22 8 -30 z', '#ffffff') +
    kawaii(50, 40, 0.8) + hl(38, 28, 4, 7, 30),

  pet_food: () =>
    e(50, 66, 38, 14, P.red) + p('M12 66 q0 22 38 22 q38 0 38 -22', P.red) + e(50, 64, 30, 8, '#b07a52') +
    [[38, 60], [50, 58], [62, 60], [44, 66], [56, 66]].map(([x, y]) => e(x, y, 5, 3, '#8a5a3c', 'stroke-width="1.6"')).join('') +
    p('M44 30 q6 -10 12 0 q8 -2 6 8 q-2 8 -12 10 q-10 -2 -12 -10 q-2 -10 6 -8 z', '#ffffff'),

  ant: () =>
    c(26, 58, 11, '#6b4430') + c(48, 56, 9, '#6b4430') + e(72, 56, 15, 12, '#6b4430') + ln('M42 62 l-8 18 M48 64 v20 M54 62 l8 18 M40 52 l-10 -10 M56 52 l10 -10', 2.6) +
    ln('M20 50 q-6 -14 -14 -14 M28 48 q0 -16 -6 -22', 2.2) + cN(22, 56, 2.4, '#fff') + cN(30, 56, 2.4, '#fff') + cN(23, 56, 1.2, K) + cN(31, 56, 1.2, K),

  grasshopper: () =>
    e(52, 56, 30, 12, '#6fcf6a') + c(24, 50, 11, '#6fcf6a') + p('M54 52 l26 -24 l6 6 l-14 40 z', '#3fa64a') +
    ln('M40 66 l-8 16 M52 66 l-4 18', 2.6) + ln('M18 42 q-4 -18 -12 -22 M24 40 q2 -18 -2 -26', 2) + kawaii(24, 50, 0.5),

  mousedeer: () =>
    e(52, 52, 26, 14, '#c98a52') + c(78, 38, 10, '#c98a52') + p('M82 32 l2 -12 l4 12 z M74 30 l-2 -10 l6 8 z', '#c98a52') +
    ln('M34 62 v26 M44 64 v24 M62 64 v24 M70 62 v26', 3.2, '#8a5a3c') + cN(84, 36, 2, K) + cN(88, 41, 1.6, K) + p('M28 50 l-6 -4 l2 8 z', '#fff3e6') + hl(46, 46, 4, 8, 20),

  crocodile: () =>
    p('M6 60 q10 -14 30 -14 h30 q14 0 26 8 l-24 4 l24 4 q-12 8 -26 8 h-40 q-20 0 -20 -10 z', '#5cc46a') +
    ln('M26 46 l4 -6 l4 6 l4 -6 l4 6 l4 -6 l4 6', 2.4, '#3fa64a') + c(70, 46, 5, '#ffffff') + cN(71, 46, 2.2, K) +
    ln('M68 62 l3 -3 l3 3 l3 -3 l3 3', 1.8, '#ffffff') + ln('M28 70 l-4 12 M48 70 l-2 12', 3.4, '#3fa64a'),

  orangutan: () =>
    c(50, 60, 26, '#d2691e') + c(50, 36, 20, '#d2691e') + e(50, 42, 14, 11, '#f2b07a') + eN(50, 34, 12, 6, '#f2b07a') +
    c(44, 34, 2.6, K, 'stroke-width="0"') + c(56, 34, 2.6, K, 'stroke-width="0"') + ln('M44 46 q6 4 12 0', 2.2) +
    ln('M26 56 q-14 10 -12 28 M74 56 q14 10 12 28', 7, '#d2691e') + ln('M26 56 q-14 10 -12 28 M74 56 q14 10 12 28', 2.4, '#8a4a20'),

  hornbill: () =>
    e(46, 58, 22, 18, '#3d3436') + c(46, 36, 12, '#3d3436') + p('M56 30 q22 2 34 16 q-20 2 -34 -4 z', '#ffd23f') +
    p('M54 26 q14 -8 24 2 q-12 2 -24 4 z', '#ff6b4a') + c(48, 34, 3, '#fff', 'stroke-width="1.6"') + cN(48, 34, 1.4, K) +
    p('M30 66 l-16 22 l14 -4 z', '#ffffff') + e(46, 62, 12, 8, '#ffffff', 'stroke-width="2"'),

  mouse: () =>
    e(50, 62, 26, 18, '#c9c4d6') + c(30, 36, 12, '#c9c4d6') + c(70, 36, 12, '#c9c4d6') + cN(30, 36, 6, P.pinkL) + cN(70, 36, 6, P.pinkL) +
    c(50, 50, 18, '#c9c4d6') + kawaii(50, 50, 0.7) + cN(50, 58, 2.4, P.pink) + ln('M74 70 q16 6 14 20', 2.4, '#c9c4d6'),

  kampung_house: () =>
    p('M10 46 l40 -32 l40 32 z', '#b07a52') + rr(18, 46, 64, 28, 2, '#e8c39a') + ln('M24 74 v16 M42 74 v16 M58 74 v16 M76 74 v16', 3.4, '#8a5a3c') +
    rr(30, 52, 12, 12, 2, '#7fcbff') + rr(58, 52, 12, 12, 2, '#7fcbff') + p('M44 74 l-8 16 M56 74 l8 16', 'none') + ln('M40 82 h20 M38 86 h24', 2)
};
void eN; void polygon; void blob;
