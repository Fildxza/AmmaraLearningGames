// "Bandar Ceria": the town around the preschool, as plain data (no three.js) so the 3D builder, collisions,
// traffic, buses, the map and the unit tests all read the same plan.
//
//   4.2 km x 4.2 km (about 17.6 km²). A grid of streets every 120 m; each block is a district (towers, shops,
//   houses, flats, parks, forest) or a landmark (zoo, market, library, masjid, fire station, ...). The preschool
//   campus sits in the middle, the beach and the sea are in the south, forest and hills in the north.
//   A divided highway (Lebuhraya Ceria) crosses the whole town in the north, and an elevated train loop (Kereta Api
//   Ceria) with four stations runs above the streets, partly along the highway's middle.
//   Traffic keeps LEFT (as in Malaysia). x grows east, z grows south.
import { createRng } from '../core/rng.js';
import { LANDMARKS_2, landmarkPlan2 } from './landmarks2.js';
import { FACTS } from '../../data/facts.js';

export const CITY = { minX: -2100, maxX: 2100, minZ: -2100, maxZ: 2100 };
export const PITCH = 120;
export const ROAD_HALF = 7;              // asphalt: two lanes of 3.5 m
export const CURB = 10;                  // asphalt + 3 m pavement on each side
export const LANE = 3.5 / 2 + 0.2;       // lane centre from the road centre line
export const CHUNK = 240;                // the city is built and loaded in 240 m squares around the child
const range = (a, b, s) => { const o = []; for (let v = a; v <= b; v += s) o.push(v); return o; };
export const XS = range(-2040, 2040, PITCH);           // north-south streets
export const ZS = range(-1980, 1740, PITCH);           // east-west streets (z = 60 + 120k)
export const BEACH = { z0: ZS[ZS.length - 1] + CURB, z1: 1880 };
export const SEA_Z = 1880;
export const CAMPUS = { minX: -120, maxX: 120, minZ: -60, maxZ: 60 };     // the preschool grounds (no street through them)
export const CAMPUS_INNER = { minX: CAMPUS.minX + CURB, maxX: CAMPUS.maxX - CURB, minZ: CAMPUS.minZ + CURB, maxZ: CAMPUS.maxZ - CURB };
export const SCHOOL = { minX: -59, maxX: 64, minZ: -23, maxZ: 23 };       // the preschool building + garden (layout.js)

const T = (ms, en) => ({ ms, en });

// The highway: the east-west street at z = HIGHWAY.z is wider: a planted middle with a barrier, then two lanes each
// way (fast lane next to the middle, slow lane next to the kerb), a hard shoulder and a 3 m pavement.
export const HIGHWAY = { z: -660, half: 11, curb: 14, median: 1.5, fast: 3.25, slow: 6.75, name: T('Lebuhraya Ceria', 'Happy Highway') };
/** Half width of the asphalt of a street: axis 'x' = the street running along x at z = v, axis 'z' = along z at x = v. */
export const roadHalf = (axis, v) => (axis === 'x' && v === HIGHWAY.z ? HIGHWAY.half : ROAD_HALF);
/** Distance from a street's centre line to the edge of the lots beside it (asphalt + pavement). */
export const curbOf = (axis, v) => (axis === 'x' && v === HIGHWAY.z ? HIGHWAY.curb : CURB);

export const DISTRICTS = {
  campus: { name: T('Kampus Tadika', 'Preschool Campus'), color: '#ff8fc0', icon: 'star', music: 'yard' },
  tower: { name: T('Pusat Bandar', 'Town Centre'), color: '#7fcbff', icon: 'bus', music: 'town' },
  shops: { name: T('Jalan Kedai', 'Shopping Street'), color: '#ffb43c', icon: 'gift', music: 'town' },
  plaza: { name: T('Dataran Bandar', 'Town Square'), color: '#f2c14e', icon: 'star', music: 'town' },
  flats: { name: T('Pangsapuri', 'Flats'), color: '#b79cff', icon: 'door', music: 'town' },
  houses: { name: T('Taman Perumahan', 'Housing Area'), color: '#ff9a6a', icon: 'door', music: 'yard' },
  park: { name: T('Taman Hijau', 'Green Park'), color: '#5cc46a', icon: 'tree', music: 'yard' },
  forest: { name: T('Hutan Kecil', 'Little Forest'), color: '#3f9c63', icon: 'tree', music: 'yard' },
  beach: { name: T('Pantai Ceria', 'Sunny Beach'), color: '#ffd86b', icon: 'sun', music: 'yard' },
  edge: { name: T('Bukit Hijau', 'Green Hills'), color: '#7cc76c', icon: 'mountain', music: 'yard' },
  shophouse: { name: T('Deretan Kedai', 'Shophouse Street'), color: '#ff9a6a', icon: 'shopping_bag', music: 'town' },
  terrace: { name: T('Taman Perumahan Teres', 'Terrace Houses'), color: '#ffb38a', icon: 'door', music: 'yard' },
  kampung: { name: T('Kampung Ceria', 'Happy Village'), color: '#b07a52', icon: 'kampung_house', music: 'yard' },
  highway: { name: HIGHWAY.name, color: '#2f9e5a', icon: 'car', music: 'town' }
};

// Landmarks: the block with this north-west corner (x0, z0) becomes the named place.
export const LANDMARKS = [
  { id: 'lake', x0: 120, z0: 60, name: T('Taman Tasik', 'Lake Park'), color: '#4fb8e8', icon: 'water_drop' },
  { id: 'zoo', x0: -360, z0: 60, name: T('Zoo Ceria', 'Happy Zoo'), color: '#ff9a3c', icon: 'giraffe' },
  { id: 'market', x0: 240, z0: -60, name: T('Pasar Buah', 'Fruit Market'), color: '#ff6b6b', icon: 'apple' },
  { id: 'library', x0: -240, z0: -60, name: T('Perpustakaan', 'Library'), color: '#9b6bff', icon: 'book' },
  { id: 'masjid', x0: -240, z0: -180, name: T('Masjid', 'Mosque'), color: '#3aa98f', icon: 'moon' },
  { id: 'fire', x0: 120, z0: -180, name: T('Balai Bomba', 'Fire Station'), color: '#ff5a5a', icon: 'fire_truck' },
  { id: 'police', x0: 240, z0: -180, name: T('Balai Polis', 'Police Station'), color: '#4a90e2', icon: 'police_car' },
  { id: 'clinic', x0: -360, z0: -60, name: T('Klinik Sihat', 'Health Clinic'), color: '#6fdcb4', icon: 'ambulance' },
  { id: 'themepark', x0: 360, z0: 60, name: T('Taman Tema', 'Theme Park'), color: '#ff8fc0', icon: 'kite' },
  { id: 'stadium', x0: -120, z0: 180, name: T('Stadium Mini', 'Mini Stadium'), color: '#4cc46a', icon: 'ball' },
  { id: 'school', x0: 0, z0: 180, name: T('Sekolah Rendah', 'Primary School'), color: '#ffd23f', icon: 'school_bus' },
  { id: 'space', x0: 0, z0: -300, name: T('Muzium Angkasa', 'Space Museum'), color: '#4a5bb5', icon: 'rocket' },
  { id: 'art', x0: -120, z0: -300, name: T('Rumah Seni', 'Art House'), color: '#ff6fa8', icon: 'crayon:red' },
  { id: 'farm', x0: -600, z0: 180, name: T('Ladang Ceria', 'Happy Farm'), color: '#8fd45e', icon: 'cow' },
  { id: 'toyshop', x0: 120, z0: 180, name: T('Kedai Mainan', 'Toy Shop'), color: '#ff9ad5', icon: 'teddy' },
  { id: 'busdepot', x0: 360, z0: -60, name: T('Stesen Bas', 'Bus Station'), color: '#ffb43c', icon: 'bus' },
  { id: 'playpark', x0: -240, z0: 60, name: T('Taman Permainan Besar', 'Big Playground'), color: '#ff7eb6', icon: 'ball' },
  { id: 'musicpark', x0: 240, z0: 180, name: T('Pentas Muzik', 'Music Stage'), color: '#ff6fa8', icon: 'bubble:♪ ♫' },
  // train stations: `station` = the side of the block that faces the train line (n = north, s = south, e, w)
  { id: 'stn-tadika', x0: 0, z0: -180, name: T('Stesen Tadika', 'Preschool Station'), color: '#8a6cff', icon: 'train', station: 's', quiz: ['veh-1', 'veh-2', 'veh-4'] },
  { id: 'stn-lebuhraya', x0: 120, z0: -660, name: T('Stesen Lebuhraya', 'Highway Station'), color: '#8a6cff', icon: 'train', station: 'n', quiz: ['saf-1', 'veh-1'] },
  { id: 'stn-barat', x0: -480, z0: -420, name: T('Stesen Barat', 'West Station'), color: '#8a6cff', icon: 'train', station: 'w', quiz: ['veh-3', 'veh-4'] },
  { id: 'stn-timur', x0: 600, z0: -420, name: T('Stesen Timur', 'East Station'), color: '#8a6cff', icon: 'train', station: 'e', quiz: ['veh-2', 'saf-2'] }
];
LANDMARKS.push(...LANDMARKS_2);                       // shops, food court, funfair, museums, parks… (landmarks2.js)
export const landmarkById = Object.fromEntries(LANDMARKS.map((l) => [l.id, l]));
const landmarkAt = new Map(LANDMARKS.map((l) => [`${l.x0},${l.z0}`, l]));

// ---------------------------------------------------------------------------------------------------------------- blocks
export const BLOCK_COLS = XS.length - 1, BLOCK_ROWS = ZS.length - 1;
export function blockIndexAt(x, z) {
  const i = Math.floor((x - XS[0]) / PITCH), j = Math.floor((z - ZS[0]) / PITCH);
  return i >= 0 && j >= 0 && i < BLOCK_COLS && j < BLOCK_ROWS ? { i, j } : null;
}
export const isCampus = (x0, z0) => z0 === CAMPUS.minZ && (x0 === -120 || x0 === 0);

function blockType(i, j) {
  const x0 = XS[i], z0 = ZS[j];
  if (isCampus(x0, z0)) return { type: 'campus' };
  const lm = landmarkAt.get(`${x0},${z0}`);
  if (lm) return { type: 'landmark', landmark: lm };
  const rng = createRng(`type:${i}:${j}`);
  const cx = x0 + PITCH / 2, cz = z0 + PITCH / 2, d = Math.max(Math.abs(cx), Math.abs(cz));
  const r = rng.next();
  if (cz < -1680 || Math.abs(cx) > 1900) return { type: r < 0.75 ? 'forest' : 'park' };
  if (d < 720) return { type: r < 0.32 ? 'tower' : r < 0.6 ? 'shophouse' : r < 0.72 ? 'shops' : r < 0.84 ? 'plaza' : r < 0.92 ? 'flats' : 'park' };
  if (d < 1500) return { type: r < 0.38 ? 'terrace' : r < 0.55 ? 'shophouse' : r < 0.66 ? 'houses' : r < 0.76 ? 'flats' : r < 0.84 ? 'shops' : r < 0.93 ? 'park' : 'kampung' };
  return { type: r < 0.3 ? 'kampung' : r < 0.45 ? 'terrace' : r < 0.55 ? 'houses' : r < 0.82 ? 'forest' : 'park' };
}

const PASTEL = ['#ffd1dc', '#ffe8a8', '#c9f0ff', '#d6f5d6', '#e7dcff', '#ffd9b8', '#fff3c4', '#d0f0ea', '#ffe0f0', '#e0ecff'];
const SHOPHOUSE = ['#ffd1dc', '#ffe8a8', '#c9f0ff', '#d6f5d6', '#e7dcff', '#ffd9b8', '#fff3c4', '#ffe0f0', '#f6e1c8', '#d9f0ff'];
const CARS = ['#ff8fc0', '#7fcbff', '#b79cff', '#ffa86b', '#6fdcb4', '#ffffff', '#ffd23f', '#c9c9d6'];
export const SHOP_SIGNS = 40;                          // number of shop-sign pictures in the town sign atlas (build.js)
const ROOFS = ['#ff7e7e', '#ff9a3c', '#4a90e2', '#3aa98f', '#9b6bff', '#e86fa8', '#8a6a5a'];

/**
 * Everything inside one block. Coordinates are world metres. Buildings: { x, z, w, d, h, color, roof, kind }
 * (x, z = centre). Trees: { x, z, s }. The colliders exactly match what is drawn.
 */
export function blockPlan(i, j) {
  const x0 = XS[i], z0 = ZS[j], x1 = XS[i + 1], z1 = ZS[j + 1];
  const t = blockType(i, j);
  const rng = createRng(`block:${i}:${j}`);
  const L = { x0: x0 + curbOf('z', x0), z0: z0 + curbOf('x', z0), x1: x1 - curbOf('z', x1), z1: z1 - curbOf('x', z1) };   // the lot inside the pavements
  const W = L.x1 - L.x0, D = L.z1 - L.z0, cx = (L.x0 + L.x1) / 2, cz = (L.z0 + L.z1) / 2;
  const out = { i, j, x0, z0, x1, z1, lot: L, type: t.type, landmark: t.landmark || null, ground: 'grass', buildings: [], trees: [], props: [], parked: [], boxes: [], circles: [], pois: [], rides: [],
    street: [], streetCircles: [], coins: [] };
  const pick = (a) => a[rng.int(a.length)];
  const building = (b) => { out.buildings.push(b); out.boxes.push([b.x - b.w / 2, b.z - b.d / 2, b.x + b.w / 2, b.z + b.d / 2]); };
  const tree = (x, z, s = 1) => { out.trees.push({ x, z, s }); out.circles.push([x, z, 0.55 * s]); };
  const ringTrees = (inset, step) => {
    for (let x = L.x0 + inset; x <= L.x1 - inset; x += step) { tree(x, L.z0 + inset, 0.9 + rng.next() * 0.3); tree(x, L.z1 - inset, 0.9 + rng.next() * 0.3); }
    for (let z = L.z0 + inset + step; z <= L.z1 - inset - step; z += step) { tree(L.x0 + inset, z, 0.9 + rng.next() * 0.3); tree(L.x1 - inset, z, 0.9 + rng.next() * 0.3); }
  };
  switch (t.type) {
    case 'campus': out.ground = 'campus'; break;          // drawn by the campus builder in city/build.js
    case 'tower': {
      out.ground = 'paved';
      const skip = rng.next() < 0.35 ? rng.int(4) : -1;
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz], k) => {
        const qx = cx + sx * W / 4, qz = cz + sz * D / 4;
        if (k === skip) { out.props.push({ kind: 'fountain', x: qx, z: qz }); out.circles.push([qx, qz, 3.2]); return; }
        const w = 26 + rng.int(12), d = 26 + rng.int(12);
        building({ x: qx, z: qz, w, d, h: 18 + rng.int(40), color: pick(PASTEL), roof: 'flat', kind: 'tower', trim: pick(ROOFS) });
      });
      break;
    }
    case 'shops': {
      out.ground = 'paved';
      const n = 4, uw = (W - 8) / n;
      for (let k = 0; k < n; k++) {
        const ux = L.x0 + 4 + uw * (k + 0.5);
        building({ x: ux, z: L.z0 + 7, w: uw - 1.2, d: 13, h: 7 + rng.int(4), color: pick(PASTEL), roof: 'flat', kind: 'shop', face: 'n', awning: pick(ROOFS) });
        building({ x: ux, z: L.z1 - 7, w: uw - 1.2, d: 13, h: 7 + rng.int(4), color: pick(PASTEL), roof: 'flat', kind: 'shop', face: 's', awning: pick(ROOFS) });
      }
      // car park in the middle, with one car you may drive
      for (let k = 0; k < 6; k++) {
        const px = cx - 25 + k * 10, pz = cz + (k % 2 ? 9 : -9);
        if (k === 2) out.rides.push({ kind: 'car', x: px, z: pz, yaw: Math.PI / 2, color: pick(['#ff6b6b', '#4a90e2', '#ffd23f', '#5cc46a']) });
        else { out.parked.push({ x: px, z: pz, yaw: Math.PI / 2, color: pick(['#ff8fc0', '#7fcbff', '#b79cff', '#ffa86b', '#6fdcb4']) }); out.circles.push([px, pz, 1.6]); }
      }
      tree(cx - 38, cz, 1.1); tree(cx + 38, cz, 1.1);
      break;
    }
    case 'plaza': {
      out.ground = 'paved';
      out.props.push({ kind: 'fountain', x: cx, z: cz }); out.circles.push([cx, cz, 3.2]);
      ringTrees(8, 14);
      [[-14, 0], [14, 0], [0, -14], [0, 14]].forEach(([dx, dz]) => out.props.push({ kind: 'bench', x: cx + dx, z: cz + dz, yaw: Math.atan2(dx, dz) }));
      out.props.push({ kind: 'iceCreamCart', x: cx + 24, z: cz + 22 }); out.boxes.push([cx + 22.8, cz + 21.2, cx + 25.2, cz + 22.8]);
      out.factSpot = { x: cx - 22, z: cz + 24 };
      break;
    }
    case 'flats': {
      building({ x: cx, z: L.z0 + 20, w: W - 20, d: 18, h: 16 + rng.int(8), color: pick(PASTEL), roof: 'flat', kind: 'flats', trim: pick(ROOFS) });
      building({ x: cx, z: L.z1 - 20, w: W - 20, d: 18, h: 16 + rng.int(8), color: pick(PASTEL), roof: 'flat', kind: 'flats', trim: pick(ROOFS) });
      for (let k = 0; k < 5; k++) tree(L.x0 + 14 + k * 18, cz, 1);
      break;
    }
    case 'houses': {
      for (let gx = 0; gx < 3; gx++) for (let gz = 0; gz < 3; gz++) {
        if (gx === 1 && gz === 1) { tree(cx, cz, 1.3); out.props.push({ kind: 'swing', x: cx + 6, z: cz }); out.boxes.push([cx + 3.5, cz - 1, cx + 8.5, cz + 1]); continue; }
        const hx = L.x0 + W / 6 + gx * W / 3, hz = L.z0 + D / 6 + gz * D / 3;
        building({ x: hx, z: hz, w: 11 + rng.int(3), d: 9 + rng.int(3), h: 4.5 + rng.next() * 2.5, color: pick(PASTEL), roof: 'gable', roofColor: pick(ROOFS), kind: 'house', along: rng.next() < 0.5 });
        if (rng.next() < 0.7) tree(hx + 9, hz + 9, 0.8 + rng.next() * 0.4);
      }
      break;
    }
    case 'park': {
      ringTrees(6, 16);
      if (rng.next() < 0.5) { out.props.push({ kind: 'pond', x: cx, z: cz, r: 14 }); out.circles.push([cx, cz, 14]); }
      else { out.props.push({ kind: 'playset', x: cx, z: cz }); out.boxes.push([cx - 4, cz - 3, cx + 4, cz + 3]); }
      [[-24, -24], [24, 24], [-24, 24]].forEach(([dx, dz]) => out.props.push({ kind: 'bench', x: cx + dx, z: cz + dz, yaw: 0 }));
      if (rng.next() < 0.35) out.rides.push({ kind: 'unicorn', x: cx + 22, z: cz - 22, yaw: rng.next() * 6 });
      out.factSpot = { x: cx + 10, z: cz + 30 };
      break;
    }
    case 'shophouse': {
      // two rows of 2-3 storey shophouses facing the north and south streets: angle parking along the kerb, a covered
      // five-foot way, the shops; behind them a quiet back lane with trees
      out.ground = 'paved';
      const n = 6, uw = (W - 4) / n;
      for (const side of ['n', 's']) {
        const sg = side === 's' ? 1 : -1, edge = side === 's' ? L.z1 : L.z0;
        const zc = edge - sg * (6 + 2 + 7);
        for (let k = 0; k < n; k++) {
          building({ x: L.x0 + 2 + uw * (k + 0.5), z: zc, w: uw - 0.4, d: 14, h: 7 + rng.int(2) * 3, color: pick(SHOPHOUSE), roof: 'flat', kind: 'shophouse', face: side, signId: rng.int(SHOP_SIGNS), awning: pick(ROOFS) });
        }
        for (let k = 0; k < 8; k++) {
          if (rng.next() < 0.4) continue;
          const px = L.x0 + 8 + k * 12, pz = edge - sg * 3;
          out.parked.push({ x: px, z: pz, yaw: 0, color: pick(CARS) }); out.circles.push([px, pz, 1.6]);
        }
      }
      for (let x = L.x0 + 10; x <= L.x1 - 10; x += 16) tree(x, cz, 0.9 + rng.next() * 0.3);
      if (rng.next() < 0.5) out.rides.push({ kind: 'car', x: cx + 8, z: cz + 6, yaw: Math.PI / 2, color: pick(['#ff6b6b', '#4a90e2', '#ffd23f', '#5cc46a']) });
      else { out.props.push({ kind: 'recycleBins', x: cx + 8, z: cz + 6 }); out.boxes.push([cx + 5, cz + 5, cx + 11, cz + 7]); }
      out.factSpot = { x: cx - 8, z: cz + 6 };
      break;
    }
    case 'terrace': {
      // two rows of terrace houses with small front yards (some with a car), a back lane; sometimes a surau
      const n = 8, uw = (W - 4) / n;
      for (const side of ['n', 's']) {
        const sg = side === 's' ? 1 : -1, edge = side === 's' ? L.z1 : L.z0;
        const zc = edge - sg * (7 + 6);
        const col = pick(PASTEL), roof = pick(ROOFS);
        for (let k = 0; k < n; k++) {
          const hx = L.x0 + 2 + uw * (k + 0.5);
          building({ x: hx, z: zc, w: uw - 0.3, d: 12, h: 6.2, color: k % 2 ? col : PASTEL[(PASTEL.indexOf(col) + 3) % PASTEL.length], roof: 'gable', roofColor: roof, kind: 'terrace', face: side, along: true });
          if (rng.next() < 0.45) { const pz = edge - sg * 3.5; out.parked.push({ x: hx, z: pz, yaw: 0, color: pick(CARS) }); out.circles.push([hx, pz, 1.6]); }
        }
        out.props.push({ kind: 'fenceRow', x: cx, z: edge - sg * 0.6, w: W - 4 });
      }
      if (rng.next() < 0.18) { building({ x: cx, z: cz, w: 14, d: 10, h: 5, color: '#f4fbf8', roof: 'dome', roofColor: '#3aa98f', kind: 'civic', face: 's', surau: true }); for (const dx of [-24, 24]) tree(cx + dx, cz, 1); }
      else for (let x = L.x0 + 8; x <= L.x1 - 8; x += 14) tree(x, cz + (rng.next() - 0.5) * 6, 0.85 + rng.next() * 0.35);
      if (rng.next() < 0.3) out.rides.push({ kind: 'unicorn', x: cx + 6, z: cz + 8, yaw: rng.next() * 6 });
      break;
    }
    case 'kampung': {
      // wooden village houses on stilts among coconut palms and banana trees
      const spots = [[-28, -26], [12, -30], [-6, 6], [30, 2], [-30, 28], [22, 30]];
      for (const [dx, dz] of spots) {
        if (rng.next() < 0.25) continue;
        const hx = cx + dx + (rng.next() - 0.5) * 4, hz = cz + dz + (rng.next() - 0.5) * 4;
        building({ x: hx, z: hz, w: 13, d: 11, h: 6.5, color: pick(['#d9a066', '#c98a52', '#e0b07a']), roof: 'kampung', kind: 'kampung' });
      }
      for (let k = 0; k < 10; k++) {
        const x = L.x0 + 6 + rng.next() * (W - 12), z = L.z0 + 6 + rng.next() * (D - 12);
        if (out.buildings.some((b) => Math.abs(b.x - x) < b.w / 2 + 2 && Math.abs(b.z - z) < b.d / 2 + 2)) continue;
        out.trees.push({ x, z, s: 1.05, palm: true }); out.circles.push([x, z, 0.5]);
      }
      break;
    }
    case 'forest': {
      for (let k = 0; k < 42; k++) tree(L.x0 + 4 + rng.next() * (W - 8), L.z0 + 4 + rng.next() * (D - 8), 0.9 + rng.next() * 0.6);
      break;
    }
    case 'landmark': landmarkPlan(out, t.landmark, rng, { cx, cz, W, D, building, tree, ringTrees }); break;
    default: break;
  }
  if (t.type !== 'campus') streetLife(out, rng, Math.max(Math.abs(cx), Math.abs(cz)));
  return out;
}

/**
 * The pavement around a block: trees near the kerb, a fire hydrant, coins to collect; and a "Did you know?" board in
 * plazas, parks and shophouse lanes near the middle of town. Pavement things keep clear of lamps, traffic lights,
 * bus stops and corners.
 */
function streetLife(out, rng, d) {
  const L = out.lot;
  const sides = [
    { axis: 'x', v: out.z0, a: out.x0, b: out.x1, n: [0, -1] }, { axis: 'x', v: out.z1, a: out.x0, b: out.x1, n: [0, 1] },
    { axis: 'z', v: out.x0, a: out.z0, b: out.z1, n: [-1, 0] }, { axis: 'z', v: out.x1, a: out.z0, b: out.z1, n: [1, 0] }
  ];
  const lamps = pavementLamps(out.x0, out.z0, out.x1, out.z1);
  const stops = cityStopsCache();
  const light = hasTrafficLight(out.x0, out.z1) ? trafficLightSpot(out.x0, out.z1) : null;
  const busy = (x, z, r) => lamps.some(([lx, lz]) => Math.hypot(lx - x, lz - z) < r + 1.5) || stops.some((st) => Math.hypot(st.x - x, st.z - z) < r + 5) ||
    (light && Math.hypot(light.x - x, light.z - z) < r + 2) || out.streetCircles.some(([sx, sz, sr]) => Math.hypot(sx - x, sz - z) < r + sr + 1);
  const at = (sd, u, off) => (sd.axis === 'x' ? { x: u, z: sd.v + (sd === sides[0] ? 1 : -1) * off } : { x: sd.v + (sd === sides[2] ? 1 : -1) * off, z: u });
  const leafy = out.type !== 'forest' && d < 1500;
  for (const sd of sides) {
    const half = roadHalf(sd.axis, sd.v);
    if (leafy && sd !== sides[0]) for (let u = sd.a + 18; u <= sd.b - 18; u += 20) {      // (the camera looks from the south)
      const p = at(sd, u, half + 0.75);
      if (busy(p.x, p.z, 0.45)) continue;
      out.street.push({ kind: 'tree', x: p.x, z: p.z, s: 0.75 + rng.next() * 0.2 }); out.streetCircles.push([p.x, p.z, 0.42]);
    }
  }
  // three coins on each block, spread round its pavement
  if (leafy && d < 1000) {
    const sd = sides[1], p = at(sd, out.x0 + 14, curbOf('x', sd.v) - 0.8);
    if (!busy(p.x, p.z, 0.3)) { out.street.push({ kind: 'hydrant', x: p.x, z: p.z }); out.streetCircles.push([p.x, p.z, 0.25]); }
  }
  for (let k = 0, tries = 0; k < 3 && tries < 12; tries++) {
    const sd = sides[rng.int(4)], curb = curbOf(sd.axis, sd.v);
    const u = sd.a + 16 + rng.next() * (sd.b - sd.a - 32), p = at(sd, u, curb - 0.9);
    if (busy(p.x, p.z, 0.6) || out.coins.some((c) => Math.hypot(c.x - p.x, c.z - p.z) < 6)) continue;
    out.coins.push({ id: `${out.i}:${out.j}:${k}`, x: p.x, z: p.z }); k++;
  }
  if (out.factSpot && d < 1100) {
    const f = FACTS[(out.i * 31 + out.j * 17) % FACTS.length], s = out.factSpot;
    out.props.push({ kind: 'factboard', x: s.x, z: s.z - 1.7 }); out.circles.push([s.x, s.z - 1.7, 0.3]);
    out.pois.push({ id: `fact-${out.i}-${out.j}`, x: s.x, z: s.z, radius: 1.1, action: 'fact', fact: f.id, zone: 'city', icon: f.icon, label: T('Tahukah Kamu?', 'Did you know?'), cue: T('Tahukah Kamu?', 'Did you know?') });
  }
}
/**
 * Fills the open front part of a landmark square with flower beds, benches, small trees and garden lamps, wherever
 * they do not touch a building, a ride, another prop, a learning place or the central path from the street.
 */
function decorate(out, rng, cx, cz) {
  const L = out.lot;
  const free = (x0, z0, x1, z1) => {
    const m = 1.4;
    if (out.boxes.some(([a, b, c, d]) => a < x1 + m && c > x0 - m && b < z1 + m && d > z0 - m)) return false;
    if (out.circles.some(([x, z, r]) => x + r > x0 - m && x - r < x1 + m && z + r > z0 - m && z - r < z1 + m)) return false;
    if (out.props.some((q) => Math.abs(q.x - (x0 + x1) / 2) < 6 && Math.abs(q.z - (z0 + z1) / 2) < 6)) return false;
    if (out.pois.some((q) => q.x > x0 - 3.2 && q.x < x1 + 3.2 && q.z > z0 - 3.2 && q.z < z1 + 3.2)) return false;
    if (out.rides.some((q) => Math.abs(q.x - (x0 + x1) / 2) < 5 && Math.abs(q.z - (z0 + z1) / 2) < 5)) return false;
    return x1 < cx - 4.5 || x0 > cx + 4.5;                                     // keep the path from the street clear
  };
  for (let z = cz + 6; z <= L.z1 - 5; z += 11) {
    for (let x = L.x0 + 7; x <= L.x1 - 7; x += 12) {
      const kind = rng.int(4);
      if (kind === 0 && free(x - 5, z - 1.5, x + 5, z + 1.5)) { out.props.push({ kind: 'flowers', x, z, w: 10, d: 3 }); out.boxes.push([x - 5, z - 1.5, x + 5, z + 1.5]); }
      else if (kind === 1 && free(x - 1.2, z - 0.6, x + 1.2, z + 0.6)) { out.props.push({ kind: 'bench', x, z, yaw: Math.PI }); out.boxes.push([x - 1.1, z - 0.45, x + 1.1, z + 0.45]); }
      else if (kind === 2 && free(x - 0.8, z - 0.8, x + 0.8, z + 0.8)) { out.trees.push({ x, z, s: 0.8 }); out.circles.push([x, z, 0.45]); }
      else if (kind === 3 && free(x - 0.4, z - 0.4, x + 0.4, z + 0.4)) { out.props.push({ kind: 'gardenLamp', x, z }); out.circles.push([x, z, 0.2]); }
    }
  }
}
let stopsCache = null;
const cityStopsCache = () => stopsCache || (stopsCache = BUS_ROUTES.flatMap((r) => routePath(r).stops.map((st) => ({ x: st.wait.x, z: st.wait.z }))));

// What stands on each landmark block, where its learning activity is, and what can be ridden there.
const P = (lm, id, x, z, action, extra = {}) => Object.assign({ id: `${lm.id}-${id}`, x, z, radius: 1.4, action, zone: 'city', icon: lm.icon, label: lm.name }, extra);
function landmarkPlan(out, lm, rng, { cx, cz, W, D, building, tree, ringTrees }) {
  out.ground = 'paved';
  if (lm.station) { stationPlan(out, lm, rng, { building, tree }); return; }
  if (landmarkPlan2(out, lm, { cx, cz, building, tree, ringTrees, rng, P })) { decorate(out, rng, cx, cz); return; }
  const gate = { x: cx, z: out.lot.z1 - 4 };         // most landmarks face the street to the south
  switch (lm.id) {
    case 'lake':
      out.ground = 'grass';
      out.props.push({ kind: 'pond', x: cx, z: cz - 6, r: 26 }); out.circles.push([cx, cz - 6, 26]);
      for (let a = 0; a < 10; a++) { const ang = (a / 10) * Math.PI * 2; tree(cx + Math.cos(ang) * 40, cz - 6 + Math.sin(ang) * 40, 1.2); }
      out.props.push({ kind: 'stable', x: cx + 30, z: cz + 36 }); out.boxes.push([cx + 24, cz + 34, cx + 36, cz + 39]);
      out.rides.push({ kind: 'unicorn', x: cx + 26, z: cz + 30, yaw: 0 }, { kind: 'unicorn', x: cx + 33, z: cz + 30, yaw: 0.3 });
      out.pois.push(P(lm, 'nature', cx - 30, cz + 32, 'quiz', { stations: ['nat-1', 'nat-2', 'nat-3', 'nat-4'], cue: T('Soalan tentang alam!', 'Questions about nature!'), icon: 'tree' }));
      break;
    case 'zoo':
      out.ground = 'grass';
      out.props.push({ kind: 'zoo', x: cx, z: cz });
      // animal paddocks: each a low fence the child can look over (collider = fence box)
      [['elephant', -26, -26], ['giraffe', 26, -26], ['zebra', -26, 18], ['lion', 26, 18], ['panda', 0, -30]].forEach(([a, dx, dz]) => {
        out.props.push({ kind: 'animal', animal: a, x: cx + dx, z: cz + dz });
        out.boxes.push([cx + dx - 9, cz + dz - 8, cx + dx + 9, cz + dz + 8]);
      });
      out.pois.push(P(lm, 'cards', cx, cz + 8, 'game', { game: 'memory', cue: T('Main kad haiwan!', 'Play animal cards!'), icon: 'lion' }));
      out.pois.push(P(lm, 'quiz', cx, gate.z, 'quiz', { stations: ['ani-1', 'ani-2', 'ani-3', 'ani-4'], cue: T('Soalan haiwan!', 'Animal questions!'), icon: 'elephant' }));
      break;
    case 'market':
      [[-24, -20], [0, -20], [24, -20], [-24, 12], [0, 12], [24, 12]].forEach(([dx, dz], k) => {
        out.props.push({ kind: 'stall', x: cx + dx, z: cz + dz, color: ['#ff6b6b', '#ffd23f', '#5cc46a', '#ff9a3c', '#4a90e2', '#ff8fc0'][k] });
        out.boxes.push([cx + dx - 5, cz + dz - 3, cx + dx + 5, cz + dz + 3]);
      });
      out.pois.push(P(lm, 'find', cx - 12, gate.z - 6, 'game', { game: 'find', level: 'fruit', cue: T('Cari buah!', 'Find the fruit!'), icon: 'banana' }));
      out.pois.push(P(lm, 'quiz', cx + 12, gate.z - 6, 'quiz', { stations: ['fv-1', 'fv-2', 'fv-3', 'fv-4'], cue: T('Soalan buah & sayur!', 'Fruit & vegetable questions!'), icon: 'apple' }));
      out.pois.push(P(lm, 'shop-grocery', cx + 36, gate.z - 6, 'shop', { shop: 'grocery', cue: T('Beli buah!', 'Buy some fruit!'), icon: 'apple' }));
      break;
    case 'library':
      building({ x: cx, z: cz - 12, w: 60, d: 36, h: 12, color: '#efe2ff', roof: 'dome', roofColor: '#9b6bff', kind: 'civic', sign: lm.name });
      out.pois.push(P(lm, 'trace', cx - 12, cz + 22, 'game', { game: 'trace', cue: T('Surih huruf!', 'Trace letters!'), icon: 'letter:A' }));
      out.pois.push(P(lm, 'quiz', cx + 12, cz + 22, 'quiz', { stations: ['abc-1', 'abc-2', 'abc-3', 'abc-4'], cue: T('Soalan huruf!', 'Letter questions!'), icon: 'book' }));
      tree(cx - 34, cz + 30, 1.2); tree(cx + 34, cz + 30, 1.2);
      break;
    case 'masjid':
      building({ x: cx, z: cz - 10, w: 44, d: 40, h: 11, color: '#f4fbf8', roof: 'dome', roofColor: '#3aa98f', kind: 'civic', minaret: true, sign: lm.name });
      out.circles.push([cx + 30, cz - 26, 3]);
      out.pois.push(P(lm, 'mengaji', cx, cz + 24, 'islamic', { cue: T('Jom Mengaji!', "Let's learn!"), icon: 'moon' }));
      for (let k = 0; k < 6; k++) tree(cx - 40 + k * 16, cz + 38, 1);
      break;
    case 'fire':
      building({ x: cx, z: cz - 14, w: 64, d: 30, h: 10, color: '#ffe0e0', roof: 'flat', kind: 'civic', trim: '#ff5a5a', garage: true, sign: lm.name });
      out.props.push({ kind: 'vehicle', vehicle: 'fire', x: cx - 14, z: cz + 12 }, { kind: 'vehicle', vehicle: 'fire', x: cx + 14, z: cz + 12 });
      out.boxes.push([cx - 18.5, cz + 9, cx - 9.5, cz + 15], [cx + 9.5, cz + 9, cx + 18.5, cz + 15]);
      out.pois.push(P(lm, 'quiz', cx, cz + 28, 'quiz', { stations: ['veh-3', 'saf-2'], cue: T('Soalan penolong!', 'Helper questions!'), icon: 'fire_truck' }));
      break;
    case 'police':
      building({ x: cx, z: cz - 14, w: 56, d: 30, h: 11, color: '#e2edff', roof: 'flat', kind: 'civic', trim: '#4a90e2', sign: lm.name });
      out.props.push({ kind: 'vehicle', vehicle: 'police', x: cx + 16, z: cz + 14 });
      out.boxes.push([cx + 11.5, cz + 11, cx + 20.5, cz + 17]);
      out.props.push({ kind: 'trafficPark', x: cx - 18, z: cz + 16 });
      out.pois.push(P(lm, 'quiz', cx - 18, cz + 30, 'quiz', { stations: ['saf-1'], cue: T('Soalan keselamatan jalan!', 'Road safety questions!'), icon: 'traffic_red' }));
      break;
    case 'clinic':
      building({ x: cx, z: cz - 12, w: 52, d: 32, h: 10, color: '#effffa', roof: 'flat', kind: 'civic', trim: '#6fdcb4', cross: true, sign: lm.name });
      out.props.push({ kind: 'vehicle', vehicle: 'ambulance', x: cx + 20, z: cz + 16 });
      out.boxes.push([cx + 15.5, cz + 13, cx + 24.5, cz + 19]);
      out.pois.push(P(lm, 'quiz', cx - 12, cz + 28, 'quiz', { stations: ['hyg-1', 'hyg-2', 'hyg-3', 'bod-1'], cue: T('Soalan badan sihat!', 'Healthy body questions!'), icon: 'soap' }));
      break;
    case 'themepark':
      out.props.push({ kind: 'wheel', x: cx, z: cz - 14 }); out.boxes.push([cx - 9, cz - 18, cx + 9, cz - 10]);
      out.props.push({ kind: 'carousel', x: cx - 26, z: cz + 18 }); out.circles.push([cx - 26, cz + 18, 7]);
      out.props.push({ kind: 'balloons', x: cx + 28, z: cz + 20 });
      out.pois.push(P(lm, 'patterns', cx + 24, cz + 34, 'game', { game: 'patterns', cue: T('Main corak manik!', 'Play bead patterns!'), icon: 'ball:rainbow' }));
      out.pois.push(P(lm, 'xo', cx - 4, cz + 34, 'game', { game: 'xo', cue: T('Main X dan O!', 'Play X and O!'), icon: 'shape:square:butter' }));
      break;
    case 'stadium':
      out.ground = 'grass';
      out.props.push({ kind: 'pitch', x: cx, z: cz });
      out.boxes.push([cx - 46, cz - 46, cx + 46, cz - 44], [cx - 46, cz + 44, cx + 46, cz + 46]);   // stands at both ends
      out.pois.push(P(lm, 'count', cx, cz + 34, 'game', { game: 'counting', cue: T('Kira dan asingkan!', 'Count and sort!'), icon: 'ball' }));
      break;
    case 'school':
      building({ x: cx, z: cz - 18, w: 76, d: 24, h: 14, color: '#fff3c4', roof: 'gable', roofColor: '#ff7e7e', kind: 'school', along: true, sign: lm.name });
      out.props.push({ kind: 'flag', x: cx + 30, z: cz + 14 }); out.circles.push([cx + 30, cz + 14, 0.5]);
      out.props.push({ kind: 'vehicle', vehicle: 'schoolbus', x: cx - 24, z: cz + 20 }); out.boxes.push([cx - 29.5, cz + 17, cx - 18.5, cz + 23]);
      out.pois.push(P(lm, 'quiz', cx, cz + 30, 'quiz', { stations: ['num-1', 'num-2', 'shp-1', 'col-1'], cue: T('Kuiz sekolah!', 'School quiz!'), icon: 'pencil' }));
      out.schoolKids = true;
      break;
    case 'space':
      building({ x: cx, z: cz - 16, w: 40, d: 30, h: 13, color: '#e0e6ff', roof: 'dome', roofColor: '#4a5bb5', kind: 'civic', sign: lm.name });
      out.props.push({ kind: 'rocket', x: cx + 30, z: cz + 18 }); out.circles.push([cx + 30, cz + 18, 3]);
      out.props.push({ kind: 'telescope', x: cx - 28, z: cz + 18 }); out.circles.push([cx - 28, cz + 18, 1.6]);
      out.pois.push(P(lm, 'quiz', cx, cz + 26, 'quiz', { stations: ['spc-1', 'spc-2', 'spc-3', 'spc-4'], cue: T('Soalan angkasa!', 'Space questions!'), icon: 'rocket' }));
      break;
    case 'art':
      building({ x: cx, z: cz - 14, w: 40, d: 28, h: 9, color: '#ffe3ef', roof: 'gable', roofColor: '#ff6fa8', kind: 'civic', along: true, sign: lm.name });
      out.props.push({ kind: 'easels', x: cx, z: cz + 18 });
      out.pois.push(P(lm, 'dots', cx - 16, cz + 28, 'game', { game: 'dots', cue: T('Sambung titik!', 'Connect the dots!'), icon: 'dots:4' }));
      out.pois.push(P(lm, 'ruler', cx + 16, cz + 28, 'game', { game: 'ruler', cue: T('Lukis garisan lurus!', 'Draw straight lines!'), icon: 'len:pencil:l' }));
      break;
    case 'farm':
      out.ground = 'grass';
      out.props.push({ kind: 'barn', x: cx - 20, z: cz - 20 }); out.boxes.push([cx - 28, cz - 28, cx - 12, cz - 12]);
      out.props.push({ kind: 'veg', x: cx + 20, z: cz - 22 }); out.boxes.push([cx + 10, cz - 28, cx + 30, cz - 16]);
      [['cow', -16, 14], ['goat', 0, 18], ['duck', 18, 12]].forEach(([a, dx, dz]) => out.props.push({ kind: 'animal', animal: a, x: cx + dx, z: cz + dz }));
      out.rides.push({ kind: 'unicorn', x: cx + 28, z: cz + 24, yaw: 2 });
      out.pois.push(P(lm, 'sort', cx, cz + 34, 'game', { game: 'counting', level: 'sort', cue: T('Asingkan hasil ladang!', 'Sort the farm things!'), icon: 'carrot' }));
      break;
    case 'toyshop':
      building({ x: cx, z: cz - 16, w: 48, d: 26, h: 9, color: '#ffe3f4', roof: 'flat', kind: 'shop', face: 's', awning: '#ff8fc0', sign: lm.name });
      out.props.push({ kind: 'bigteddy', x: cx + 30, z: cz + 14 }); out.circles.push([cx + 30, cz + 14, 2.5]);
      out.pois.push(P(lm, 'puzzle', cx - 8, cz + 22, 'game', { game: 'puzzle', cue: T('Teka-teki bentuk!', 'Shape puzzle!'), icon: 'shape:star:yellow' }));
      out.pois.push(P(lm, 'find', cx + 10, cz + 30, 'game', { game: 'find', level: 'toys', cue: T('Cari mainan!', 'Find the toy!'), icon: 'teddy' }));
      out.pois.push(P(lm, 'shop-toys', cx - 24, cz + 30, 'shop', { shop: 'toys', cue: T('Masuk Kedai Mainan!', 'Visit the toy shop!'), icon: 'teddy' }));
      break;
    case 'busdepot':
      building({ x: cx, z: cz - 26, w: 70, d: 20, h: 8, color: '#fff0d6', roof: 'flat', kind: 'civic', trim: '#ffb43c', sign: lm.name });
      [[-20, 8], [0, 8], [20, 8]].forEach(([dx, dz]) => { out.props.push({ kind: 'vehicle', vehicle: 'bus', x: cx + dx, z: cz + dz, yaw: Math.PI / 2 }); out.boxes.push([cx + dx - 3, cz + dz - 6, cx + dx + 3, cz + dz + 6]); });
      out.pois.push(P(lm, 'quiz', cx, cz + 30, 'quiz', { stations: ['veh-1', 'veh-2', 'veh-4'], cue: T('Soalan kenderaan!', 'Vehicle questions!'), icon: 'bus' }));
      break;
    case 'playpark':
      out.ground = 'grass';
      out.props.push({ kind: 'bigplay', x: cx, z: cz }); out.boxes.push([cx - 14, cz - 10, cx + 14, cz + 10]);
      ringTrees(6, 18);
      out.rides.push({ kind: 'unicorn', x: cx - 30, z: cz + 30, yaw: 1 });
      out.pois.push(P(lm, 'memory', cx + 26, cz + 26, 'game', { game: 'memory', cue: T('Cari pasangan!', 'Find the pairs!'), icon: 'ball' }));
      break;
    case 'musicpark':
      out.ground = 'grass';
      out.props.push({ kind: 'stage', x: cx, z: cz - 20 }); out.boxes.push([cx - 18, cz - 30, cx + 18, cz - 12]);
      ringTrees(6, 20);
      out.pois.push(P(lm, 'music', cx, cz + 6, 'game', { game: 'music', cue: T('Main xilofon!', 'Play the xylophone!'), icon: 'bubble:♪ ♫' }));
      break;
    default: break;
  }
  // every landmark except the open ones gets a shady back row, side trees and two flower beds by its entrance
  if (lm.id === 'stadium' || lm.id === 'lake' || lm.id === 'playpark' || lm.id === 'musicpark' || lm.id === 'farm') return;
  const L = out.lot;
  for (let x = L.x0 + 5; x <= L.x1 - 5; x += 15) tree(x, L.z0 + 4, 0.95 + rng.next() * 0.3);
  for (let z = L.z0 + 19; z <= cz + 20; z += 15) { tree(L.x0 + 4, z, 0.95 + rng.next() * 0.3); tree(L.x1 - 4, z, 0.95 + rng.next() * 0.3); }
  for (const sx of [-1, 1]) {
    const fx = cx + sx * 34, fz = L.z1 - 6;
    out.props.push({ kind: 'flowers', x: fx, z: fz, w: 10, d: 3 }); out.boxes.push([fx - 5, fz - 1.5, fx + 5, fz + 1.5]);
  }
}

// ---------------------------------------------------------------------------------------------------------------- stations
const SIDE = { s: [0, 1], n: [0, -1], e: [1, 0], w: [-1, 0] };
/**
 * A train station: the station hall stands back from the street; above the pavement and part of the road its
 * platform reaches out to the elevated track (the train stops beside it). `a` = metres out from the lot edge towards
 * the track (negative = into the lot), `b` = metres along the street.
 */
function stationPlan(out, lm, rng, { building, tree }) {
  const L = out.lot, side = lm.station, [nx, nz] = SIDE[side], [tx, tz] = nz ? [1, 0] : [0, 1];
  const cx = (L.x0 + L.x1) / 2, cz = (L.z0 + L.z1) / 2, half = nx ? (L.x1 - L.x0) / 2 : (L.z1 - L.z0) / 2;
  const P = (a, b) => ({ x: cx + nx * (half + a) + tx * b, z: cz + nz * (half + a) + tz * b });
  const street = side === 's' ? out.z1 : side === 'n' ? out.z0 : side === 'e' ? out.x1 : out.x0;
  const curb = curbOf(nz ? 'x' : 'z', street);
  const hall = P(-16, 0);
  building({ x: hall.x, z: hall.z, w: nz ? 56 : 16, d: nz ? 16 : 56, h: 8, color: '#efeaff', roof: 'flat', kind: 'civic', trim: '#8a6cff', face: side });
  // platform legs at the lot edge, and the lift tower beside the platform
  for (const b of [-26, -12, 12, 26]) { const q = P(-1, b); out.circles.push([q.x, q.z, 0.4]); }
  const lift = P(-5, -37);
  out.props.push({ kind: 'lift', x: lift.x, z: lift.z }); out.boxes.push([lift.x - 1.6, lift.z - 1.6, lift.x + 1.6, lift.z + 1.6]);
  // garden behind the hall, benches and flowers in front
  for (const b of [-36, -18, 0, 18, 36]) { const q = P(-44, b); tree(q.x, q.z, 1 + rng.next() * 0.3); }
  for (const b of [-22, 22]) { const q = P(-6, b); out.props.push({ kind: 'bench', x: q.x, z: q.z, yaw: Math.atan2(nx, nz) }); }
  for (const b of [-30, 30]) {
    const q = P(-32, b);
    out.props.push({ kind: 'flowers', x: q.x, z: q.z, w: 10, d: 3, yaw: nz ? 0 : Math.PI / 2 });
    out.boxes.push(nz ? [q.x - 5, q.z - 1.5, q.x + 5, q.z + 1.5] : [q.x - 1.5, q.z - 5, q.x + 1.5, q.z + 5]);
  }
  // the camera always looks from the south: a station facing north keeps its ticket spot beside the lift, not behind
  // the hall (where the hall would hide the child)
  const train = side === 'n' ? P(-5, -44) : P(-4, -8), quiz = side === 'n' ? P(-5, 44) : P(-4, 14);
  out.pois.push(P0(lm, 'train', train.x, train.z, 'train', { station: lm.id, cue: T('Naik kereta api!', 'Take the train!'), icon: 'train' }));
  out.pois.push(P0(lm, 'quiz', quiz.x, quiz.z, 'quiz', { stations: lm.quiz, cue: T('Soalan kenderaan!', 'Vehicle questions!'), icon: 'traffic_red' }));
  const edge = P(0, 0), track = P(curb, 0);
  out.station = { side, n: [nx, nz], t: [tx, tz], edge: [edge.x, edge.z], track: [track.x, track.z], curb, platform: { a0: -8, a1: curb - 2.3, b0: -32, b1: 32 }, exit: [train.x, train.z] };
}
const P0 = (lm, id, x, z, action, extra = {}) => Object.assign({ id: `${lm.id}-${id}`, x, z, radius: 1.4, action, zone: 'city', icon: lm.icon, label: lm.name }, extra);

// ---------------------------------------------------------------------------------------------------------------- the train
// One loop of elevated track along street middles (part of it along the highway's middle), with round corners.
export const RAIL = { y: 9, R: 24, corners: [[-480, -660], [720, -660], [720, -60], [-480, -60]], color: '#8a6cff', name: T('Kereta Api Ceria', 'Happy Train') };
let railCache = null;
/** The loop as points every few metres: { x, z, s (metres along), nx, nz (unit normal, mitred) }, plus its stations. */
export function railPath() {
  if (railCache) return railCache;
  const C = RAIL.corners, R = RAIL.R, n = C.length, pts = [];
  const unit = (a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); return [dx / l, dz / l]; };
  const push = (x, z) => { const last = pts[pts.length - 1]; if (last && Math.hypot(last.x - x, last.z - z) < 0.01) return; pts.push({ x, z }); };
  for (let i = 0; i < n; i++) {
    const P = C[i], Q = C[(i + 1) % n], N = C[(i + 2) % n];
    const u = unit(P, Q), v = unit(Q, N);
    // straight from just after corner P to just before corner Q
    const a = [P[0] + u[0] * R, P[1] + u[1] * R], b = [Q[0] - u[0] * R, Q[1] - u[1] * R];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), steps = Math.max(1, Math.ceil(len / 10));
    for (let k = 0; k < steps; k++) push(a[0] + (b[0] - a[0]) * (k / steps), a[1] + (b[1] - a[1]) * (k / steps));
    // the round corner at Q: from Q - R*u to Q + R*v around the centre Q - R*u + R*v
    const cxr = Q[0] - R * u[0] + R * v[0], czr = Q[1] - R * u[1] + R * v[1];
    for (let k = 0; k < 10; k++) {
      const t = (k / 10) * (Math.PI / 2);
      push(cxr - R * v[0] * Math.cos(t) + R * u[0] * Math.sin(t), czr - R * v[1] * Math.cos(t) + R * u[1] * Math.sin(t));
    }
  }
  let s = 0;
  pts.forEach((p, k) => { if (k) s += Math.hypot(p.x - pts[k - 1].x, p.z - pts[k - 1].z); p.s = s; });
  const total = s + Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].z - pts[pts.length - 1].z);
  // mitred normals (left of travel) so the deck is one continuous ribbon
  pts.forEach((p, k) => {
    const a = pts[(k - 1 + pts.length) % pts.length], b = pts[(k + 1) % pts.length];
    const t1 = unit([a.x, a.z], [p.x, p.z]), t2 = unit([p.x, p.z], [b.x, b.z]);
    let tx = t1[0] + t2[0], tz = t1[1] + t2[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
    const m = 1 / Math.max(0.5, tx * t2[0] + tz * t2[1]);
    p.nx = -tz * m; p.nz = tx * m;
  });
  const rp = { pts, total, stations: [] };
  for (const lm of LANDMARKS.filter((l) => l.station)) {
    const bp = blockPlan(XS.indexOf(lm.x0), ZS.indexOf(lm.z0));
    const [x, z] = bp.station.track;
    let best = null;
    for (let k = 0; k < pts.length; k++) {
      const a = pts[k], b = pts[(k + 1) % pts.length], sb = k + 1 < pts.length ? b.s : total;
      const dx = b.x - a.x, dz = b.z - a.z, l2 = dx * dx + dz * dz || 1;
      const u = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / l2));
      const d = Math.hypot(a.x + dx * u - x, a.z + dz * u - z);
      if (!best || d < best.d) best = { d, s: a.s + (sb - a.s) * u };
    }
    const exit = bp.station.exit;
    rp.stations.push({ id: lm.id, name: lm.name, s: best.s, d: best.d, track: { x, z }, exit: { x: exit[0], z: exit[1] }, side: lm.station });
  }
  rp.stations.sort((a, b) => a.s - b.s);
  railCache = rp;
  return rp;
}
/** Point on the loop at arc length s (wraps): { x, z, yaw }. */
export function railAt(rp, s) {
  const P2 = rp.pts, n = P2.length;
  s = ((s % rp.total) + rp.total) % rp.total;
  let lo = 0, hi = n - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (P2[mid].s <= s) lo = mid; else hi = mid - 1; }
  const a = P2[lo], b = P2[(lo + 1) % n], sb = lo + 1 < n ? b.s : rp.total;
  const u = (s - a.s) / (sb - a.s || 1);
  return { x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u, yaw: Math.atan2(b.x - a.x, b.z - a.z) };
}
/** Pillars under the straight parts of the track, in the street middles, never in a crossing. { x, z, r, alongX } */
export function railPillars() {
  const C = RAIL.corners, R = RAIL.R, out = [];
  for (let i = 0; i < C.length; i++) {
    const P = C[i], Q = C[(i + 1) % C.length];
    const alongX = P[1] === Q[1], len = Math.hypot(Q[0] - P[0], Q[1] - P[1]), ux = (Q[0] - P[0]) / len, uz = (Q[1] - P[1]) / len;
    for (let d = R + 15; d <= len - R - 15 + 1e-6; d += 30) {
      const x = P[0] + ux * d, z = P[1] + uz * d;
      const crossing = alongX ? XS.some((X) => Math.abs(x - X) < 16) : ZS.some((Z) => Math.abs(z - Z) < 16 + roadHalf('x', Z) - ROAD_HALF);
      if (crossing) continue;
      out.push({ x, z, r: alongX && P[1] === HIGHWAY.z ? 0.7 : 0.5, alongX });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------- campus
// The preschool campus around the building + garden of layout.js: car park (west), unicorn stable (east), bus stop
// (south), paths from the garden gates to the pavement.
export const CAMPUS_PLAN = {
  stable: { x: 92, z: -18 },
  rides: [
    { kind: 'unicorn', x: 84, z: -10, yaw: Math.PI }, { kind: 'unicorn', x: 92, z: -10, yaw: Math.PI }, { kind: 'unicorn', x: 100, z: -10, yaw: Math.PI },
    { kind: 'car', x: -96, z: 32, yaw: 0, color: '#ff6b6b' }, { kind: 'car', x: -86, z: 32, yaw: 0, color: '#4a90e2' }, { kind: 'car', x: -76, z: 32, yaw: 0, color: '#ffd23f' }
  ],
  boxes: [[84, -25, 100, -22]],                          // the stable's back wall
  sign: { x: 40, z: 44 }
};
// The garden gates in the hedge (layout.js) and the strips that keep cars and unicorns out of the preschool
export const SCHOOL_GATES = [{ x0: 36, x1: 44, z: 21.75, side: 'south' }, { x0: 61.25, x1: 64, z0: -4, z1: 2, side: 'east' }];

// ---------------------------------------------------------------------------------------------------------------- streets
const SKIP_X0 = (x, za, zb) => x === 0 && za >= CAMPUS.minZ && zb <= CAMPUS.maxZ;     // no street through the campus
export function roadSegments() {
  const out = [];
  for (const x of XS) for (let k = 0; k < ZS.length - 1; k++) if (!SKIP_X0(x, ZS[k], ZS[k + 1])) out.push({ axis: 'z', x, a: ZS[k], b: ZS[k + 1] });
  for (const z of ZS) for (let k = 0; k < XS.length - 1; k++) out.push({ axis: 'x', z, a: XS[k], b: XS[k + 1] });
  return out;
}
const nodeKey = (x, z) => `${x},${z}`;
/** Street crossings next to (x, z), with the one in between: used by traffic. */
export function neighbours(x, z) {
  const out = [];
  const xi = XS.indexOf(x), zi = ZS.indexOf(z);
  if (xi < 0 || zi < 0) return out;
  if (xi > 0) out.push({ x: XS[xi - 1], z });
  if (xi < XS.length - 1) out.push({ x: XS[xi + 1], z });
  if (zi > 0 && !SKIP_X0(x, ZS[zi - 1], z)) out.push({ x, z: ZS[zi - 1] });
  if (zi < ZS.length - 1 && !SKIP_X0(x, z, ZS[zi + 1])) out.push({ x, z: ZS[zi + 1] });
  return out;
}
export const nearestNode = (x, z) => ({ x: XS.reduce((a, b) => (Math.abs(b - x) < Math.abs(a - x) ? b : a)), z: ZS.reduce((a, b) => (Math.abs(b - z) < Math.abs(a - z) ? b : a)) });
/** The lane point at distance s along the street from p to q (keep left). */
export function lanePoint(p, q, s) {
  const dx = q.x - p.x, dz = q.z - p.z, len = Math.hypot(dx, dz) || 1, ux = dx / len, uz = dz / len;
  const off = p.z === q.z && p.z === HIGHWAY.z ? HIGHWAY.slow : LANE;          // town cars use the highway's slow lane
  return { x: p.x + ux * s + uz * off, z: p.z + uz * s - ux * off, yaw: Math.atan2(ux, uz), len };
}
/** Is (x, z) on a street (asphalt)? */
export function onRoad(x, z) {
  const nx = nearestNode(x, z);
  const nearX = Math.abs(x - nx.x) <= ROAD_HALF && !(SKIP_X0(nx.x, -60, 60) && z > CAMPUS.minZ + ROAD_HALF && z < CAMPUS.maxZ - ROAD_HALF);
  return nearX || Math.abs(z - nx.z) <= roadHalf('x', nx.z);
}

// ---------------------------------------------------------------------------------------------------------------- buses
// Routes follow street crossings; buses keep left and stop at the stops (on the left pavement).
export const BUS_ROUTES = [
  { id: 'A', name: T('Laluan Bandar', 'Town Loop'), color: '#ffb43c', nodes: [[-360, 60], [480, 60], [480, -180], [-360, -180]] },
  { id: 'B', name: T('Laluan Pantai', 'Beach Line'), color: '#4fb8e8', nodes: [[480, 60], [480, 1740], [600, 1740], [600, 60]] },
  { id: 'C', name: T('Laluan Ladang', 'Farm Line'), color: '#5cc46a', nodes: [[-360, 60], [-360, 300], [-720, 300], [-720, 60]] }
];
export const BUS_STOPS = [
  { id: 'tadika', route: 'A', x: 40, z: 60, name: T('Hentian Tadika', 'Preschool Stop') },
  { id: 'pasar', route: 'A', x: 300, z: 60, name: T('Hentian Pasar', 'Market Stop') },
  { id: 'depoh', route: 'A', x: 480, z: 0, name: T('Stesen Bas', 'Bus Station') },
  { id: 'bomba', route: 'A', x: 180, z: -180, name: T('Hentian Bomba', 'Fire Station Stop') },
  { id: 'masjid', route: 'A', x: -180, z: -180, name: T('Hentian Masjid', 'Mosque Stop') },
  { id: 'klinik', route: 'A', x: -360, z: -30, name: T('Hentian Klinik', 'Clinic Stop') },
  { id: 'tema', route: 'B', x: 480, z: 140, name: T('Hentian Taman Tema', 'Theme Park Stop') },
  { id: 'pantai', route: 'B', x: 540, z: 1740, name: T('Hentian Pantai', 'Beach Stop') },
  { id: 'selatan', route: 'B', x: 600, z: 960, name: T('Hentian Selatan', 'South Stop') },
  { id: 'zoo', route: 'C', x: -360, z: 120, name: T('Hentian Zoo', 'Zoo Stop') },
  { id: 'ladang', route: 'C', x: -660, z: 300, name: T('Hentian Ladang', 'Farm Stop') },
  { id: 'pesta', route: 'B', x: 480, z: 240, name: T('Hentian Pesta Ria', 'Funfair Stop') },
  { id: 'jogging', route: 'C', x: -420, z: 60, name: T('Hentian Taman Jogging', 'Jogging Park Stop') }
];
/** A route as a closed path of lane points with the arc length (s) of each stop. */
export function routePath(route) {
  const pts = route.nodes.map(([x, z]) => ({ x, z }));
  const path = [];
  let s = 0;
  for (let k = 0; k < pts.length; k++) {
    const p = pts[k], q = pts[(k + 1) % pts.length];
    const a = lanePoint(p, q, 0), b = lanePoint(p, q, Math.hypot(q.x - p.x, q.z - p.z));
    if (path.length) s += Math.hypot(a.x - path[path.length - 1].x, a.z - path[path.length - 1].z);
    path.push({ x: a.x, z: a.z, s, seg: k });
    s += Math.hypot(b.x - a.x, b.z - a.z);
    path.push({ x: b.x, z: b.z, s, seg: k });
  }
  const total = s + Math.hypot(path[0].x - path[path.length - 1].x, path[0].z - path[path.length - 1].z);
  const stops = BUS_STOPS.filter((st) => st.route === route.id).map((st) => {
    // the stop is on the segment that runs past it; its arc length is the projection onto that segment
    let best = null;
    for (let k = 0; k < path.length; k += 2) {
      const a = path[k], b = path[k + 1];
      const dx = b.x - a.x, dz = b.z - a.z, l2 = dx * dx + dz * dz;
      const u = Math.max(0, Math.min(1, ((st.x - a.x) * dx + (st.z - a.z) * dz) / l2));
      const px = a.x + dx * u, pz = a.z + dz * u, d = Math.hypot(st.x - px, st.z - pz);
      if (!best || d < best.d) {
        const len = Math.sqrt(l2), ux = dx / len, uz = dz / len;
        best = { d, s: a.s + u * len, wait: { x: px + uz * (CURB - LANE - 1.5), z: pz - ux * (CURB - LANE - 1.5) } };
      }
    }
    return Object.assign({}, st, { s: best.s, wait: best.wait });
  });
  return { route, path, total, stops };
}
/** Position on a route path at arc length s (wraps). */
export function routeAt(rp, s) {
  s = ((s % rp.total) + rp.total) % rp.total;
  const P2 = rp.path;
  for (let k = 0; k < P2.length; k++) {
    const a = P2[k], b = P2[(k + 1) % P2.length];
    const sb = k + 1 < P2.length ? b.s : rp.total;
    if (s <= sb) {
      const len = sb - a.s || 1, u = (s - a.s) / len;
      return { x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u, yaw: Math.atan2(b.x - a.x, b.z - a.z) };
    }
  }
  return { x: P2[0].x, z: P2[0].z, yaw: 0 };
}

// ---------------------------------------------------------------------------------------------------------------- places
/** Every learning place of the town (landmark activities and bus stops), computed once. */
let allPois = null;
export function cityPois() {
  if (allPois) return allPois;
  allPois = [];
  for (let i = 0; i < BLOCK_COLS; i++) for (let j = 0; j < BLOCK_ROWS; j++) allPois.push(...blockPlan(i, j).pois);
  for (const r of BUS_ROUTES) for (const st of routePath(r).stops) {
    allPois.push({ id: 'bus-' + st.id, x: st.wait.x, z: st.wait.z, radius: 1.2, action: 'bus', stop: st.id, route: r.id, zone: 'city', icon: 'bus', label: st.name, cue: T('Naik bas!', 'Take the bus!') });
  }
  return allPois;
}

/** The district at (x, z): a landmark, a block type, the campus, the beach or the hills. */
/** Crossings with traffic lights: the busy middle of the town, and every crossing of the highway. */
export const hasTrafficLight = (x, z) => Math.max(Math.abs(x), Math.abs(z)) < 700 || z === HIGHWAY.z;
/**
 * Traffic light colours at the crossing (x, z) at time t (seconds): an 18 s cycle, east-west traffic first, each
 * crossing shifted a little so the town does not blink in step. Returns { ew, ns } as 'green' | 'yellow' | 'red'.
 */
export const LIGHT_CYCLE = 18;
export function lightPhase(x, z, t) {
  const off = ((((x * 7 + z * 13) / 10) % LIGHT_CYCLE) + LIGHT_CYCLE) % LIGHT_CYCLE;
  const u = (((t + off) % LIGHT_CYCLE) + LIGHT_CYCLE) % LIGHT_CYCLE;
  return { ew: u < 7 ? 'green' : u < 9 ? 'yellow' : 'red', ns: u < 9 ? 'red' : u < 16 ? 'green' : 'yellow' };
}
/** Where the traffic light of the crossing (x, z) stands (north-east corner pavement). */
export const trafficLightSpot = (x, z) => ({ x: x + ROAD_HALF + 1.2, z: z - roadHalf('x', z) - 1.2 });
/** Street lamps on the pavement ring of a block (corners and middles), leaving room at bus stops and traffic lights. */
export function pavementLamps(rx0, rz0, rx1, rz1) {
  const o0 = [rx0 + roadHalf('z', rx0), rz0 + roadHalf('x', rz0), rx1 - roadHalf('z', rx1), rz1 - roadHalf('x', rz1)];
  const stops = cityStopsCache();                       // (straight from the routes: cityPois() builds blocks, which ask for lamps)
  const light = (x, z) => { const t = trafficLightSpot(rx0, rz1); return hasTrafficLight(rx0, rz1) && Math.hypot(t.x - x, t.z - z) < 1; };
  return [[o0[0] + 1.2, o0[1] + 1.2], [o0[2] - 1.2, o0[1] + 1.2], [o0[0] + 1.2, o0[3] - 1.2], [o0[2] - 1.2, o0[3] - 1.2], [(rx0 + rx1) / 2, o0[1] + 1.2], [(rx0 + rx1) / 2, o0[3] - 1.2]]
    .filter(([x, z]) => !stops.some((st) => Math.hypot(st.x - x, st.z - z) < 6) && !light(x, z));
}
export function districtAt(x, z) {
  if (x >= CAMPUS.minX && x < CAMPUS.maxX && z >= CAMPUS.minZ && z < CAMPUS.maxZ) return Object.assign({ id: 'city-campus' }, DISTRICTS.campus);
  if (z >= BEACH.z0 - CURB) return Object.assign({ id: 'city-beach' }, DISTRICTS.beach);
  if (Math.abs(z - HIGHWAY.z) <= HIGHWAY.half && x >= XS[0] - ROAD_HALF && x <= XS[XS.length - 1] + ROAD_HALF) return Object.assign({ id: 'city-highway' }, DISTRICTS.highway);
  const b = blockIndexAt(x, z);
  if (!b) return Object.assign({ id: 'city-edge' }, DISTRICTS.edge);
  const t = blockType(b.i, b.j);
  if (t.landmark) return { id: 'city-' + t.landmark.id, name: t.landmark.name, color: t.landmark.color, icon: t.landmark.icon, music: t.landmark.id === 'masjid' ? 'islamic' : t.landmark.id === 'themepark' ? 'arcade' : 'town' };
  return Object.assign({ id: 'city-' + t.type }, DISTRICTS[t.type]);
}
export const blockTypeAt = (i, j) => blockType(i, j).type;
export const chunkOf = (x, z) => ({ cx: Math.floor((x - CITY.minX) / CHUNK), cz: Math.floor((z - CITY.minZ) / CHUNK) });
export const CHUNKS = Math.ceil((CITY.maxX - CITY.minX) / CHUNK);
void nodeKey;
