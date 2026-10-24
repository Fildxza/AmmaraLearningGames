// What is inside each corner of the west wing. Positions match the colliders in layout.js.
import { Mesh, PlaneGeometry, MeshBasicMaterial } from 'three';
import { box, ball, cyl, cone, torus, star3d, heart3d, group, at, cachedGeo, live } from './kit.js';
import { toon, lambert, basic, makeCanvas, canvasTexture, roundRect, tint, grain } from './paint.js';
import { buildLandmark } from './landmarks.js';
import { PAL, RAINBOW, rugRound, rugRect, cushion, beanbag, roundTable, lowTable, plantPot, lantern, shelfUnit, archFrame, arcadeCabinet, xylophone, drumKid, rehal, wardrobeCabinet, mirrorStand, hatRack, blackboardStand, easelKid, alphaBlock, sofa, lampPost, flat } from './props.js';
import { bookSpineTexture } from './paint.js';
import { createPoster, glyphTexture, boardTexture, iconTexture, ARABIC_FONT } from './signs.js';
import { POIS, ROW_SPLIT, BUILDING, zoneById } from './layout.js';
import { FONT } from '../art/svg.js';

// A glowing ring on the floor and a floating picture above a point of interest, so a child can see where to go.
export function poiMarker(poi, zoneColor, iconSvg, updaters) {
  const g = group();
  const ringMat = new MeshBasicMaterial({ color: zoneColor, transparent: true, opacity: 0.55, depthWrite: false });
  const ring = new Mesh(cachedGeo('poiring', () => torus(1, 0.07, '#fff', { outline: 0 }).geometry), ringMat);
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.05; ring.scale.setScalar(poi.radius + 0.9); ring.userData.keep = true;
  const disc = new Mesh(cachedGeo('poidisc', () => new PlaneGeometry(2, 2)), new MeshBasicMaterial({ color: zoneColor, transparent: true, opacity: 0.16, depthWrite: false }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.04; disc.scale.setScalar(poi.radius + 0.9); disc.userData.keep = true;
  const tex = iconTexture(iconSvg, poi.icon, { bg: '#fffaf1', size: 192, pad: 20 });
  const bubble = new Mesh(cachedGeo('poibubble', () => new PlaneGeometry(1.15, 1.15)), new MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  const rim = new Mesh(cachedGeo('poirim', () => new PlaneGeometry(1.32, 1.32)), new MeshBasicMaterial({ color: zoneColor, transparent: true, opacity: 0.95, depthWrite: false }));
  bubble.userData.keep = true; rim.userData.keep = true; bubble.renderOrder = 4; rim.renderOrder = 3;
  const hover = group(rim, bubble);
  bubble.position.z = 0.01;
  const baseY = poi.iconY || (poi.radius > 1.5 ? 3.0 : 2.7);
  hover.position.y = baseY;
  hover.userData.keep = true;
  g.add(ring, disc, hover);
  g.position.set(poi.x, 0, poi.z);
  g.userData.keep = true;
  g.traverse((o) => { o.userData.keep = true; });
  updaters.push((t, reduced) => {
    hover.position.y = baseY + (reduced ? 0 : Math.sin(t * 2.0 + poi.x) * 0.12);
    ring.rotation.z = reduced ? 0 : t * 0.25;
    ringMat.opacity = reduced ? 0.55 : 0.4 + Math.sin(t * 2.4 + poi.z) * 0.18;
  });
  return g;
}

const paintings = (g, iconSvg, keys, x0, step, y, z, size = 1.0) => keys.forEach((k, i) => {
  const p = createPoster({ iconKey: k, iconSvg, size }); p.position.set(x0 + i * step, y, z); g.add(p);
  g.add(box(size + 0.14, size + 0.14, 0.06, '#ffffff', { x: x0 + i * step, y, z: z - 0.02, r: 0.05, shadow: false, outline: 0.012 }));
});

function numberStripTexture() {
  const W = 1536, H = 192, c = makeCanvas(W, H), ctx = c.getContext('2d');
  const cols = ['#ff6f9f', '#ff9a3c', '#f5b400', '#3fbf6a', '#3d8bfd', '#9b6bff', '#ff6f9f', '#ff9a3c', '#f5b400', '#3fbf6a'];
  for (let i = 0; i < 10; i++) {
    const x = 10 + i * 150;
    ctx.fillStyle = '#fffaf1'; roundRect(ctx, x, 12, 136, 168, 28); ctx.fill();
    ctx.lineWidth = 8; ctx.strokeStyle = cols[i]; ctx.stroke();
    ctx.font = `700 ${i === 9 ? 100 : 120}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = cols[i];
    ctx.fillText(String(i + 1), x + 68, 100);
  }
  return canvasTexture(c);
}
function rulerTexture() {
  const W = 1024, H = 128, c = makeCanvas(W, H), ctx = c.getContext('2d');
  ctx.fillStyle = '#ffd23f'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#5b3f33'; ctx.strokeStyle = '#5b3f33'; ctx.lineWidth = 4;
  for (let i = 0; i <= 20; i++) { const x = 20 + i * 49; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, i % 5 === 0 ? 62 : 38); ctx.stroke(); if (i % 5 === 0) { ctx.font = `700 34px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(String(i / 5 * 5), x, 100); } }
  return canvasTexture(c);
}
function lessonPageTexture() {
  const W = 512, H = 288, c = makeCanvas(W, H), ctx = c.getContext('2d');
  ctx.fillStyle = '#fffdf6'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#3aa98f'; ctx.lineWidth = 6; ctx.strokeRect(10, 10, W - 20, H - 20);
  ctx.setLineDash([8, 10]); ctx.lineWidth = 3; ctx.strokeRect(24, 24, W - 48, H - 48); ctx.setLineDash([]);
  ctx.fillStyle = '#2e8872'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `600 150px ${ARABIC_FONT}`;
  ctx.direction = 'rtl';
  ctx.fillText('ا  ب  ت', W / 2, H * 0.52);
  return canvasTexture(c);
}
function xoMatTexture() {
  const S = 512, c = makeCanvas(S, S), ctx = c.getContext('2d');
  ctx.fillStyle = '#fff3c9'; roundRect(ctx, 8, 8, S - 16, S - 16, 60); ctx.fill();
  ctx.lineWidth = 12; ctx.strokeStyle = '#f5b400'; ctx.stroke();
  ctx.strokeStyle = '#5b3f33'; ctx.lineWidth = 12; ctx.lineCap = 'round';
  for (const k of [S / 3, (2 * S) / 3]) { ctx.beginPath(); ctx.moveTo(k, 50); ctx.lineTo(k, S - 50); ctx.moveTo(50, k); ctx.lineTo(S - 50, k); ctx.stroke(); }
  const cell = S / 3;
  const X = (i, j) => { const x = i * cell + cell / 2, y = j * cell + cell / 2, r = cell * 0.22; ctx.strokeStyle = '#ff5a8a'; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r); ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r); ctx.stroke(); };
  const O = (i, j) => { ctx.strokeStyle = '#3d8bfd'; ctx.lineWidth = 18; ctx.beginPath(); ctx.arc(i * cell + cell / 2, j * cell + cell / 2, cell * 0.24, 0, 7); ctx.stroke(); };
  X(0, 0); O(1, 1); X(2, 2); O(2, 0);
  grain(ctx, S, S, 'xo', 0.04);
  return canvasTexture(c);
}

// ---------------------------------------------------------------------------------------------------------------------------
const ZONES_CONTENT = {
  mengaji(g, c) {
    const T = '#3aa98f';
    g.add(at(rugRect(6.6, 4.8, T, '#e9f7f2'), -17.5, 0, -5.4));
    // niche with an arch on the back wall (decoration only)
    g.add(at(archFrame(3.4, 3.3, T), -17.5, 0, -9.62));
    const niche = new Mesh(cachedGeo('niche', () => new PlaneGeometry(3.4, 3.3)), lambert('#bfeadc')); niche.position.set(-17.5, 1.65, -9.88); g.add(niche);
    // the rehal (book stand) with a beginner lesson page
    g.add(at(rehal(lessonPageTexture()), -17.5, 0, -8.6));
    // hanging lanterns
    [[-20.4, 5.1, -6.2], [-14.6, 5.3, -6.2], [-17.5, 5.6, -3.4]].forEach(([x, y, z]) => g.add(at(lantern(PAL.gold), x, y, z)));
    // shelf of books at the west end
    g.add(at(shelfUnit(1.7, 2.2, 0.95, bookSpineTexture('mengaji', 4)), -21.27, 0, -9.0, Math.PI / 2));
    // alif-ba-ta blocks
    const mk = (ch, fg) => glyphTexture(ch, { arabic: true, fg, border: fg, bg: '#fffdf6' });
    g.add(at(alphaBlock(mk('ا', '#3aa98f'), 0.8), -14.85, 0, -9.0, 0.2), at(alphaBlock(mk('ب', '#e08a3c'), 0.8), -14.0, 0, -8.9, -0.15), at(alphaBlock(mk('ت', '#9b6bff'), 0.8), -14.4, 0.8, -9.0, 0.1));
    // floor cushions around the rug
    [[-20.0, -4.4, '#ffd65a'], [-15.0, -4.4, '#ffb3d4'], [-17.5, -2.7, '#7fcbff'], [-19.8, -6.4, '#6fdcb4']].forEach(([x, z, col]) => g.add(at(cushion(0.5, col), x, 0.05, z)));
    // letter tiles on the wall beside the niche
    ['ا', 'ب', 'ت', 'ث'].forEach((ch, i) => { const tx = new Mesh(cachedGeo('mtile', () => new PlaneGeometry(1.2, 1.2)), basic('#ffffff', { map: glyphTexture(ch, { arabic: true, fg: ['#3aa98f', '#e08a3c', '#9b6bff', '#3d8bfd'][i], border: ['#3aa98f', '#e08a3c', '#9b6bff', '#3d8bfd'][i], bg: '#fffdf6' }), transparent: true })); tx.position.set(i < 2 ? -21.0 + i * 1.35 : -14.2 + (i - 2) * 1.35 - 0.0, 3.5, -9.9); g.add(tx); });
    g.add(at(lampPost(PAL.gold), -14.0, 0, -2.2));
  },
  reading(g, c) {
    g.add(at(rugRound(3.4, '#ff9a3c'), -17.5, 0, 3.4));
    // pictures on the south face of the divider (the "bookshelf" wall)
    const spines = bookSpineTexture('reading', 3);
    for (const [x0, x1] of [[-22, -19.4], [-15.6, -13]]) {
      const m = new Mesh(cachedGeo(`spl${x1 - x0}`, () => new PlaneGeometry(x1 - x0, 1.05)), basic('#ffffff', { map: spines })); m.position.set((x0 + x1) / 2, 0.62, ROW_SPLIT + 0.26); g.add(m);
    }
    const bb = blackboardStand(boardTexture(['A B C', '1 2 3'], { size: 120 }), 2.3, 1.5);
    g.add(at(bb, -14.3, 0, 6.5, 0.15));
    // trolley of picture books
    g.add(at(shelfUnit(1.1, 1.5, 2.2, bookSpineTexture('trolley', 3)), -21.2, 0, 6.4, Math.PI / 2));
    g.add(cyl(0.12, 0.12, 0.1, PAL.dark, { x: -21.2, y: 0.08, z: 5.5, rz: Math.PI / 2 }), cyl(0.12, 0.12, 0.1, PAL.dark, { x: -21.2, y: 0.08, z: 7.3, rz: Math.PI / 2 }));
    // scattered picture books and cushions on the rug
    [[-17.5, 5.2, PAL.sky], [-18.4, 5.7, PAL.pink], [-16.6, 5.5, PAL.mint]].forEach(([x, z, col], i) => g.add(box(0.5, 0.06, 0.4, col, { x, y: 0.07, z, ry: i * 0.5, r: 0.02, outline: 0.01 })));
    g.add(at(cushion(0.4, '#ffd65a'), -18.0, 0.04, 1.2), at(cushion(0.4, '#b79cff'), -16.6, 0.04, 1.4));
    // hanging ABC bunting
    ['A', 'B', 'C', 'D', 'E'].forEach((ch, i) => { const t = new Mesh(cachedGeo('abcflag', () => new PlaneGeometry(0.8, 0.8)), basic('#ffffff', { map: glyphTexture(ch, { fg: RAINBOW[i], border: RAINBOW[i], bg: '#fffaf1' }), transparent: true })); t.position.set(-20.5 + i * 1.7, 4.2 - Math.abs(i - 2) * 0.12, -0.6); g.add(t); });
  },
  arcade(g, c) {
    const cols = ['#ff8fc0', '#7fcbff', '#ffd23f', '#6fdcb4'];
    const keys = ['ball:rainbow', 'shape:star:yellow', 'cow', 'num:3'];
    [-29.6, -27.8, -25.2, -23.4].forEach((x, i) => g.add(at(arcadeCabinet(cols[i], iconTexture(c.iconSvg, keys[i], { bg: '#2c2455', size: 256, pad: 40, round: false })), x, 0, -9.25)));
    // the big hub console
    const hub = group(cyl(0.95, 1.05, 0.9, '#6b5aa8', { y: 0.45, seg: 20 }), cyl(0.7, 0.85, 0.12, '#ffd23f', { y: 0.96, seg: 20 }), torus(0.98, 0.07, '#ff8fc0', { y: 0.92, rx: Math.PI / 2, outline: 0.012 }));
    const screen = new Mesh(cachedGeo('hubscr', () => new PlaneGeometry(1.5, 1.0)), basic('#ffffff', { map: iconTexture(c.iconSvg, 'ball:rainbow', { bg: '#2c2455', size: 256, pad: 30, round: false }) })); screen.position.set(0, 1.55, 0.18); screen.rotation.x = -0.22;
    hub.add(box(1.7, 1.15, 0.12, '#4a3f7a', { y: 1.55, z: 0.1, r: 0.08, rx: -0.22 }), screen);
    const star = live(star3d(0.34, 0.12, PAL.yellow, { y: 2.55, outline: 0.015, matOpts: { emissive: '#ffd23f', emissiveIntensity: 0.4 } }));
    hub.add(star);
    g.add(at(hub, -26.5, 0, -5.2));
    c.updaters.push((t, reduced) => { if (!reduced) { star.rotation.y = t * 1.4; star.position.y = 2.55 + Math.sin(t * 2) * 0.1; } });
    g.add(at(rugRound(2.7, '#9b6bff'), -26.5, 0, -5.2));
    // prize shelf
    const shelf = group(box(1.3, 1.9, 1.6, '#e9dcff', { y: 0.95, r: 0.08 }));
    [0.75, 1.35].forEach((y) => shelf.add(box(1.0, 0.07, 1.4, '#b79cff', { x: 0.1, y, outline: 0 })));
    [['#ff8fc0', 0.2], ['#ffd23f', -0.3], ['#7fcbff', 0.0]].forEach(([col, z], i) => shelf.add(ball(0.2, col, { x: 0.15, y: 0.98 + (i % 2) * 0.6, z, seg: 10 }), ball(0.09, col, { x: 0.15, y: 1.3 + (i % 2) * 0.6, z, seg: 8 })));
    g.add(at(shelf, -30.25, 0, -2.4));
    g.add(at(cushion(0.65, '#ff8fc0', 0.4), -23.6, 0.05, -2.6), at(cushion(0.65, '#7fcbff', 0.4), -25.0, 0.05, -2.2));
    // string of lights along the back wall
    const bulbs = [];
    for (let i = 0; i < 14; i++) bulbs.push(ball(0.11, RAINBOW[i % 6], { x: -30.4 + i * 0.64, y: 4.05 + Math.sin(i * 0.9) * 0.15, z: -9.8, seg: 6, outline: 0, matOpts: { emissive: RAINBOW[i % 6], emissiveIntensity: 0.5 } }));
    bulbs.forEach((b) => g.add(b));
  },
  art(g, c) {
    g.add(at(rugRect(5.6, 3.8, '#ff6b6b', '#fff3dc'), -26.5, 0, 3.2));
    const desk = group(lowTable(3.6, 1.6, 0.85, '#ffe3b0', PAL.woodD));
    const ruler = box(2.3, 0.03, 0.34, '#ffffff', { x: -0.2, y: 0.93, z: 0.4, r: 0.01, outline: 0.01 });
    const rl = new Mesh(cachedGeo('rulertop', () => new PlaneGeometry(2.3, 0.34)), basic('#ffffff', { map: rulerTexture() })); rl.rotation.x = -Math.PI / 2; rl.position.set(-0.2, 0.95, 0.4);
    desk.add(ruler, rl);
    desk.add(box(1.2, 0.02, 0.85, '#ffffff', { x: 0.2, y: 0.92, z: -0.25, r: 0.01, ry: 0.1, outline: 0.01 }), box(0.9, 0.02, 0.7, '#fff3c9', { x: -1.1, y: 0.92, z: -0.1, r: 0.01, ry: -0.2, outline: 0.01 }));
    desk.add(cyl(0.18, 0.15, 0.3, '#7fcbff', { x: 1.4, y: 1.05, z: -0.4, seg: 10 }));
    ['#ff5a5a', '#3d8bfd', '#4cc46a', '#ffd23f'].forEach((col, i) => desk.add(cyl(0.025, 0.025, 0.5, col, { x: 1.33 + i * 0.045, y: 1.35, z: -0.4, rz: (i - 1.5) * 0.12, seg: 5, outline: 0 })));
    desk.add(cone(0.1, 0.22, '#ffd23f', { x: 1.0, y: 0.97, z: 0.4, rz: Math.PI / 2, seg: 6, outline: 0.008 }));
    g.add(at(desk, -26.5, 0, 3.2));
    const dotTex = (() => { const S = 256, cv = makeCanvas(S, S), ctx = cv.getContext('2d'); ctx.fillStyle = '#fffdf6'; ctx.fillRect(0, 0, S, S); const pts = [[60, 190], [128, 50], [196, 190], [128, 120]]; ctx.fillStyle = '#ff6b6b'; pts.forEach(([x, y], i) => { ctx.beginPath(); ctx.arc(x, y, 14, 0, 7); ctx.fill(); ctx.fillStyle = '#5b3f33'; ctx.font = `700 26px ${FONT}`; ctx.fillText(String(i + 1), x + 16, y - 12); ctx.fillStyle = '#ff6b6b'; }); ctx.strokeStyle = '#3d8bfd'; ctx.lineWidth = 6; ctx.setLineDash([10, 12]); ctx.beginPath(); ctx.moveTo(60, 190); ctx.lineTo(128, 50); ctx.lineTo(196, 190); ctx.stroke(); return canvasTexture(cv); })();
    g.add(at(easelKid(dotTex), -23.4, 0, 6.0, -0.35));
    const paint = group(box(1.3, 1.5, 2.0, '#ffe0dc', { y: 0.75, r: 0.08 }), box(1.2, 0.07, 1.8, '#ff9a8f', { y: 0.78, outline: 0 }), box(1.2, 0.07, 1.8, '#ff9a8f', { y: 1.28, outline: 0 }));
    ['#ff5a5a', '#ffd23f', '#3d8bfd', '#4cc46a', '#9b6bff'].forEach((col, i) => paint.add(cyl(0.14, 0.12, 0.2, '#ffffff', { x: 0.1, y: 0.93, z: -0.7 + i * 0.35, seg: 8, outline: 0.008 }), ball(0.1, col, { x: 0.1, y: 1.05, z: -0.7 + i * 0.35, seg: 8, outline: 0 })));
    g.add(at(paint, -30.25, 0, 6.8));
    paintings(g, c.iconSvg, ['rainbow', 'sun', 'flower', 'butterfly'], -29.6, 2.3, 0.78, ROW_SPLIT + 0.3, 0.95);
    // paper chain bunting
    for (let i = 0; i < 9; i++) g.add(box(0.5, 0.35, 0.03, RAINBOW[i % 6], { x: -30.4 + i * 0.95, y: 3.9 - Math.abs(i - 4) * 0.06, z: 0.4, r: 0.02, outline: 0.008, shadow: false }));
  },
  numbers(g, c) {
    g.add(at(rugRound(3.2, '#f5b400'), -35.5, 0, -5.6));
    const ab = buildLandmark('abacus', {}); g.add(at(ab.obj, -35.5, 0, -8.6));
    const strip = new Mesh(cachedGeo('numstrip', () => new PlaneGeometry(8.2, 1.0)), basic('#ffffff', { map: numberStripTexture(), transparent: true })); strip.position.set(-35.5, 3.9, -9.9); g.add(strip);
    // counting shop table with apples
    const shop = group(roundTable(0.95, 0.85, '#ffd65a'));
    [[-0.35, 0.0], [0.3, 0.2], [0.0, -0.4], [0.35, -0.3], [-0.2, 0.4]].forEach(([x, z], i) => shop.add(ball(0.14, i % 2 ? '#ff5a5a' : '#6fdcb4', { x, y: 1.05, z, seg: 8, outline: 0.01 })));
    shop.add(box(0.5, 0.35, 0.05, '#ffffff', { x: 0, y: 1.3, z: 0.7, r: 0.03, rx: -0.3 }));
    g.add(at(shop, -35.5, 0, -4.1));
    // block shelf
    const sh = group(box(1.3, 1.6, 1.5, '#ffe9a8', { y: 0.8, r: 0.08 }), box(1.2, 0.06, 1.3, '#f5b400', { y: 0.8, outline: 0 }));
    ['1', '2', '3', '4'].forEach((n, i) => sh.add(at(alphaBlock(glyphTexture(n, { fg: RAINBOW[i], border: RAINBOW[i], bg: '#fffaf1' }), 0.5), 0.1, 0.83, -0.5 + i * 0.34, 0.1 * i)));
    ['5', '6', '7'].forEach((n, i) => sh.add(at(alphaBlock(glyphTexture(n, { fg: RAINBOW[i + 3], border: RAINBOW[i + 3], bg: '#fffaf1' }), 0.5), 0.1, 1.63 - 0.8, -0.4 + i * 0.4, 0)));
    g.add(at(sh, -39.25, 0, -9.2, Math.PI / 2));
    g.add(at(cushion(0.5, '#ffb3d4'), -32.4, 0.05, -2.6), at(cushion(0.5, '#7fcbff'), -33.4, 0.05, -2.3));
    // number mobile
    ['1', '2', '3'].forEach((n, i) => { const t = new Mesh(cachedGeo('nmob', () => new PlaneGeometry(0.8, 0.8)), basic('#ffffff', { map: glyphTexture(n, { fg: RAINBOW[i * 2], border: RAINBOW[i * 2], bg: '#fffaf1' }), transparent: true })); t.position.set(-33.8 + i * 1.6, 3.6 - i * 0.1, -2.2); g.add(t); });
  },
  shapes(g, c) {
    g.add(at(rugRound(3.2, '#3aa7f0'), -35.5, 0, 3.8));
    const tw = buildLandmark('shapeTower', {}); g.add(at(tw.obj, -38.2, 0, 6.7));
    const ss = buildLandmark('shapeSorter', {}); g.add(at(ss.obj, -33.6, 0, 5.6));
    const rg = buildLandmark('rings', {}); g.add(at(rg.obj, -37.2, 0, 2.2));
    // colour wheel board standing at the divider
    const wheel = (() => { const S = 256, cv = makeCanvas(S, S), ctx = cv.getContext('2d'); ctx.fillStyle = '#fffaf1'; ctx.fillRect(0, 0, S, S); RAINBOW.forEach((col, i) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(128, 128); ctx.arc(128, 128, 112, (i / 6) * 7 - 1.57, ((i + 1) / 6) * 7 - 1.57); ctx.fill(); }); ctx.fillStyle = '#fffaf1'; ctx.beginPath(); ctx.arc(128, 128, 28, 0, 7); ctx.fill(); return canvasTexture(cv); })();
    g.add(at(easelKid(wheel, PAL.sky), -33.4, 0, 1.4, -0.3));
    paintings(g, c.iconSvg, ['shape:triangle:pink', 'shape:circle:sky', 'shape:square:butter', 'shape:heart:pink'], -39.0, 2.0, 0.78, ROW_SPLIT + 0.3, 0.9);
  },
  animals(g, c) {
    g.add(at(rugRound(3.4, '#5cc46a'), -44.5, 0, -5.0));
    const barn = buildLandmark('barn', {}); g.add(at(barn.obj, -46.8, 0, -8.4));
    const tree = buildLandmark('bigTree', {}); tree.obj.scale.setScalar(0.8); g.add(at(tree.obj, -42.7, 0, -8.7));
    const tb = group(roundTable(1.0, 0.85, '#fff0c4'));
    const keys = ['cow', 'cat', 'duck', 'dog', 'rabbit', 'frog'];
    keys.forEach((k, i) => { const a = (i / 6) * Math.PI * 2; tb.add(box(0.46, 0.04, 0.46, '#ffffff', { x: Math.cos(a) * 0.55, y: 0.93, z: Math.sin(a) * 0.55, ry: -a + 0.3, r: 0.02, outline: 0.01 })); const p = new Mesh(cachedGeo('acardp', () => new PlaneGeometry(0.38, 0.38)), basic('#ffffff', { map: iconTexture(c.iconSvg, k, { size: 128, pad: 8 }), transparent: true })); p.rotation.x = -Math.PI / 2; p.rotation.z = a + 0.3; p.position.set(Math.cos(a) * 0.55, 0.96, Math.sin(a) * 0.55); tb.add(p); });
    g.add(at(tb, -44.5, 0, -4.5));
    paintings(g, c.iconSvg, ['cow', 'lion', 'duck', 'elephant', 'monkey'], -48.0, 1.65, 4.85, -9.9, 1.15);
    g.add(at(cushion(0.5, '#ffb3d4'), -41.0, 0.05, -2.4), at(cushion(0.5, '#ffd65a'), -47.5, 0.05, -2.4));
    c.updaters.push((t, reduced) => { barn.update && !reduced && barn.update(t); tree.update && !reduced && tree.update(t); });
  },
  music(g, c) {
    g.add(at(rugRect(6.2, 5.0, '#ff6fa8', '#fff3dc'), -44.5, 0, 4.2));
    g.add(at(xylophone(), -44.5, 0, 3.3));
    g.add(at(drumKid('#ff6b6b', 0.7), -47.6, 0, 7.0), at(drumKid('#3d8bfd', 0.6), -41.6, 0, 7.1));
    // tambourine and maracas on the rug, floating notes
    g.add(cyl(0.3, 0.3, 0.06, '#ffd23f', { x: -42.6, y: 0.08, z: 1.2, seg: 16 }), torus(0.3, 0.04, '#ff8fc0', { x: -42.6, y: 0.1, z: 1.2, rx: Math.PI / 2, outline: 0.008 }));
    g.add(ball(0.14, '#4cc46a', { x: -46.3, y: 0.15, z: 1.3 }), cyl(0.025, 0.025, 0.4, PAL.woodL, { x: -46.3, y: 0.3, z: 1.3, seg: 5, outline: 0 }));
    const notes = [0, 1, 2].map((i) => live(star3d(0.2, 0.07, ['#ff6fa8', '#3d8bfd', '#ffd23f'][i], { x: -46 + i * 1.5, y: 3.0 + i * 0.2, z: 1.8, outline: 0.012 })));
    notes.forEach((n) => g.add(n));
    c.updaters.push((t, reduced) => notes.forEach((n, i) => { n.position.y = 3.0 + i * 0.2 + (reduced ? 0 : Math.sin(t * 2 + i) * 0.2); n.rotation.y = reduced ? 0 : t + i; }));
  },
  wardrobe(g, c) {
    g.add(at(rugRound(2.9, '#9b6bff'), -53.5, 0, -5.3));
    g.add(at(wardrobeCabinet(), -53.5, 0, -9.25));
    g.add(at(hatRack(), -57.4, 0, -7.7));
    g.add(at(mirrorStand(), -53.5, 0, -6.6));
    paintings(g, c.iconSvg, ['star', 'shape:heart:pink', 'rainbow', 'hat'], -56.2, 1.55, 4.8, -9.9, 1.0);
    g.add(at(cushion(0.45, '#ffd65a'), -51.0, 0.05, -3.0), at(cushion(0.45, '#ff8fc0'), -56.0, 0.05, -3.0));
    g.add(at(stoolDress(), -51.0, 0, -6.2));
  },
  rest(g, c) {
    g.add(at(rugRect(5.2, 3.8, '#6fdcb4', '#f1fff9'), -53.2, 0, 3.2));
    g.add(at(sofa('#b79cff'), -57.0, 0, 2.2, Math.PI / 2));
    const tb = buildLandmark('toyBox', {}); g.add(at(tb.obj, -53.8, 0, 6.2));
    // floor lamp
    g.add(at(group(cyl(0.05, 0.05, 2.4, '#4a4350', { y: 1.2, seg: 6 }), cyl(0.5, 0.5, 0.1, '#4a4350', { y: 0.05, seg: 10 }), cone(0.5, 0.7, '#ffe27a', { y: 2.6, seg: 10, matOpts: { emissive: '#ffe27a', emissiveIntensity: 0.4 } })), -50.2, 0, 0.5));
    [[-52.4, 2.0, '#ffd65a'], [-51.2, 3.0, '#ff8fc0'], [-53.4, 4.4, '#7fcbff'], [-55.0, 5.0, '#ffa86b']].forEach(([x, z, col], i) => g.add(at(cushion(0.55, col), x, 0.05, z)));
    g.add(box(0.7, 0.08, 0.5, '#fff6e6', { x: -51.6, y: 0.1, z: 5.8, ry: 0.4, r: 0.02, outline: 0.01 }), box(0.5, 0.08, 0.4, '#ffd23f', { x: -51.3, y: 0.18, z: 5.9, ry: 0.1, r: 0.02, outline: 0.01 }));
  }
};
function stoolDress() { return group(cyl(0.3, 0.3, 0.12, '#ffd65a', { y: 0.42 }), cyl(0.05, 0.05, 0.4, PAL.woodD, { y: 0.2 }), ball(0.2, '#ff8fc0', { y: 0.65, seg: 10 }), cone(0.12, 0.2, '#ffd23f', { y: 0.88, seg: 6 })); }

export function buildZoneContent(id, g, ctx) {
  const f = ZONES_CONTENT[id];
  if (f) f(g, ctx);
  // markers for every point of interest in this corner
  const color = zoneById[id] ? zoneById[id].color : '#ffd23f';
  for (const p of POIS.filter((q) => q.zone === id)) g.add(poiMarker(p, color, ctx.iconSvg, ctx.updaters));
  void toon; void heart3d; void drumKid; void flat; void BUILDING; void beanbag; void roundTable;
}
export { ZONES_CONTENT };
