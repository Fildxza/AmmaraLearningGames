// The second wave of town landmarks: shopping, food, the funfair with its roller coaster, the jogging park, the grand
// mosque, hospital, museums, and more. Pure data like plan.js: buildings, props, colliders and learning places.
// Every landmark faces the street to the south (z1), where the camera looks from.
import { FACTS } from '../../data/facts.js';

const T = (ms, en) => ({ ms, en });
const factIcon = Object.fromEntries(FACTS.map((f) => [f.id, f.icon]));
const SHOP_CUE = {
  books: T('Masuk Kedai Buku!', 'Visit the bookshop!'), candy: T('Masuk Kedai Gula-gula!', 'Visit the sweet shop!'),
  clothes: T('Masuk Butik Ceria!', 'Visit the boutique!'), toys: T('Masuk Kedai Mainan!', 'Visit the toy shop!'),
  food: T('Jom makan!', "Let's eat!"), grocery: T('Jom membeli-belah!', "Let's go shopping!"),
  funfair: T('Beli snek!', 'Buy a snack!'), pets: T('Masuk Kedai Haiwan!', 'Visit the pet shop!')
};
const SHOP_ICON = { books: 'book', candy: 'lollipop', clothes: 'dress', toys: 'teddy', food: 'rice_plate', grocery: 'shopping_bag', funfair: 'popcorn', pets: 'cat' };

export const LANDMARKS_2 = [
  { id: 'mall', x0: 0, z0: 60, name: T('Kompleks Beli-belah Ceria', 'Happy Shopping Centre'), color: '#ff7eb6', icon: 'shopping_bag' },
  { id: 'foodcourt', x0: -120, z0: 60, name: T('Medan Selera', 'Food Court'), color: '#ff9a3c', icon: 'rice_plate' },
  { id: 'supermarket', x0: 120, z0: -60, name: T('Pasar Raya', 'Supermarket'), color: '#4cc46a', icon: 'shopping_bag' },
  { id: 'funfair', x0: 480, z0: 180, name: T('Pesta Ria', 'Funfair'), color: '#ff6fa8', icon: 'roller_coaster' },
  { id: 'jogging', x0: -480, z0: 60, name: T('Taman Jogging', 'Jogging Park'), color: '#3fa64a', icon: 'jogging' },
  { id: 'grandmosque', x0: -600, z0: -60, name: T('Masjid Bandar Ceria', 'Happy Town Grand Mosque'), color: '#3aa98f', icon: 'mosque' },
  { id: 'hospital', x0: -120, z0: -180, name: T('Hospital Ceria', 'Happy Hospital'), color: '#ff5a5a', icon: 'hospital' },
  { id: 'science', x0: 360, z0: -180, name: T('Pusat Sains', 'Science Centre'), color: '#4a90e2', icon: 'telescope' },
  { id: 'aquarium', x0: 480, z0: 60, name: T('Akuarium', 'Aquarium'), color: '#4fb8e8', icon: 'whale' },
  { id: 'dino', x0: -360, z0: 180, name: T('Muzium Dinosaur', 'Dinosaur Museum'), color: '#ff9a3c', icon: 'trex' },
  { id: 'butterfly', x0: -360, z0: -180, name: T('Taman Rama-rama', 'Butterfly Park'), color: '#b79cff', icon: 'butterfly' },
  { id: 'recycle', x0: 360, z0: 180, name: T('Pusat Kitar Semula', 'Recycling Centre'), color: '#4cc46a', icon: 'recycle' },
  { id: 'postoffice', x0: 240, z0: 60, name: T('Pejabat Pos', 'Post Office'), color: '#e8202a', icon: 'letter_mail' },
  { id: 'bank', x0: -240, z0: 180, name: T('Bank Tabung', 'Savings Bank'), color: '#ffb43c', icon: 'piggy_bank' },
  { id: 'cinema', x0: 120, z0: 300, name: T('Pawagam Ceria', 'Happy Cinema'), color: '#9b6bff', icon: 'film' },
  { id: 'clocktower', x0: -120, z0: 300, name: T('Dataran Menara Jam', 'Clock Tower Square'), color: '#8f86e8', icon: 'clock' },
  { id: 'waterpark', x0: 240, z0: 300, name: T('Taman Air', 'Water Park'), color: '#4fb8e8', icon: 'swimming' },
  { id: 'sports', x0: 0, z0: 300, name: T('Gelanggang Sukan', 'Sports Courts'), color: '#ff9a3c', icon: 'basketball' },
  { id: 'petshop', x0: 360, z0: 300, name: T('Kedai Haiwan', 'Pet Shop'), color: '#ffb43c', icon: 'cat' },
  { id: 'flowergarden', x0: -240, z0: 300, name: T('Taman Bunga Raya', 'Hibiscus Garden'), color: '#e8202a', icon: 'hibiscus' },
  { id: 'heritage', x0: -720, z0: 180, name: T('Kampung Warisan', 'Heritage Village'), color: '#b07a52', icon: 'kampung_house' },
  { id: 'airport', x0: 960, z0: -300, name: T('Lapangan Terbang Mini', 'Little Airport'), color: '#4a90e2', icon: 'airplane' },
  { id: 'kitepark', x0: -600, z0: -300, name: T('Taman Layang-layang', 'Kite Park'), color: '#ffd23f', icon: 'kite' },
  { id: 'windfarm', x0: -840, z0: 300, name: T('Ladang Kincir Angin', 'Wind Farm'), color: '#7fcbff', icon: 'windmill' },
  { id: 'harbour', x0: 840, z0: 1620, name: T('Jeti & Rumah Api', 'Jetty & Lighthouse'), color: '#4a90e2', icon: 'lighthouse' },
  { id: 'birdpark', x0: 600, z0: 180, name: T('Taman Burung', 'Bird Park'), color: '#5cc46a', icon: 'hornbill' }
];
export const LANDMARK_2_IDS = new Set(LANDMARKS_2.map((l) => l.id));

/**
 * Fills the block plan `out` for one of the landmarks above. ctx: { cx, cz, building, tree, ringTrees, rng, P }.
 * Returns true when it handled the landmark.
 */
export function landmarkPlan2(out, lm, { cx, cz, building, tree, ringTrees, rng, P }) {
  if (!LANDMARK_2_IDS.has(lm.id)) return false;
  const L = out.lot;
  const prop = (kind, x, z, extra = {}) => { out.props.push(Object.assign({ kind, x, z }, extra)); };
  const box = (x0, z0, x1, z1) => out.boxes.push([x0, z0, x1, z1]);
  const circ = (x, z, r) => out.circles.push([x, z, r]);
  const shop = (id, x, z) => out.pois.push(P(lm, 'shop-' + id, x, z, 'shop', { shop: id, icon: SHOP_ICON[id], cue: SHOP_CUE[id] }));
  const quiz = (id, x, z, stations, cue, icon) => out.pois.push(P(lm, id, x, z, 'quiz', { stations, cue, icon }));
  // a "Did you know?" board: the board stands just north of the spot where the child reads it
  const fact = (factId, x, z) => {
    prop('factboard', x, z - 1.7); circ(x, z - 1.7, 0.3);
    out.pois.push(P(lm, 'fact-' + factId, x, z, 'fact', { fact: factId, icon: factIcon[factId] || 'star', cue: T('Tahukah Kamu?', 'Did you know?'), radius: 1.1 }));
  };
  const front = L.z1;                                   // the street side
  switch (lm.id) {
    case 'mall': {
      building({ x: cx, z: cz - 12, w: 86, d: 32, h: 12, color: '#fff0f6', roof: 'flat', kind: 'mall', trim: '#ff7eb6', fronts: ['#9b6bff', '#ff8fc0', '#ff7eb6', '#ff9ad5'] });
      [['books', -32], ['candy', -11], ['clothes', 11], ['toys', 32]].forEach(([id, dx]) => shop(id, cx + dx, cz + 10));
      prop('fountain', cx, cz + 27); circ(cx, cz + 27, 3.2);
      for (const dx of [-36, -20, 20, 36]) tree(cx + dx, front - 5, 1.1);
      for (const dx of [-12, 12]) prop('bench', cx + dx, cz + 34, { yaw: Math.PI });
      prop('recycleBins', cx - 40, cz + 16); box(cx - 43, cz + 15, cx - 37, cz + 17);
      fact('f-save', cx + 26, cz + 26);
      break;
    }
    case 'foodcourt': {
      prop('pavilion', cx, cz - 6, { w: 54, d: 30 });
      for (const [dx, dz] of [[-24, -14], [24, -14], [-24, 2], [24, 2]]) circ(cx + dx, cz + dz - 6 + 6, 0.3);
      ['#ff6b6b', '#ffd23f', '#5cc46a', '#ff9a3c', '#4a90e2', '#ff8fc0'].forEach((col, k) => {
        const x = cx - 30 + k * 12; prop('foodStall', x, cz - 30, { color: col, icon: ['rice_plate', 'satay', 'noodles', 'juice', 'ice_cream', 'bread'][k] }); box(x - 4.5, cz - 33, x + 4.5, cz - 27);
      });
      for (const [dx, dz] of [[-14, -10], [0, -10], [14, -10], [-14, 2], [0, 2], [14, 2]]) { prop('picnicTable', cx + dx, cz + dz); box(cx + dx - 2, cz + dz - 1.6, cx + dx + 2, cz + dz + 1.6); }
      shop('food', cx - 10, cz + 18);
      fact('f-breakfast', cx + 14, cz + 18);
      prop('recycleBins', cx + 36, cz + 14); box(cx + 33, cz + 13, cx + 39, cz + 15);
      for (const dx of [-38, 38]) tree(cx + dx, front - 5, 1.1);
      break;
    }
    case 'supermarket': {
      building({ x: cx, z: cz - 16, w: 72, d: 30, h: 9, color: '#eaffea', roof: 'flat', kind: 'shop', face: 's', awning: '#4cc46a', sign: lm.name });
      shop('grocery', cx - 6, cz + 6);
      quiz('quiz', cx + 18, cz + 8, ['kt-money'], T('Soalan duit!', 'Money questions!'), 'coin');
      prop('trolleys', cx - 26, cz + 6); box(cx - 30, cz + 5, cx - 22, cz + 7);
      for (let k = 0; k < 4; k++) { const px = cx - 30 + k * 20; out.parked.push({ x: px, z: cz + 30, yaw: 0, color: ['#ff8fc0', '#7fcbff', '#ffd23f', '#6fdcb4'][k] }); circ(px, cz + 30, 1.6); }
      out.rides.push({ kind: 'car', x: cx + 40, z: cz + 30, yaw: 0, color: '#4cc46a' });
      fact('f-vitamins', cx - 30, cz + 20);
      break;
    }
    case 'funfair': {
      // the roller coaster fills the back half; its station is on the west side
      prop('coaster', cx, cz - 24); out.coaster = { x: cx, z: cz - 24 };
      for (const [x, z] of COASTER_SUPPORTS) circ(cx + x, cz - 24 + z, 0.35);
      box(cx - 44, cz - 12, cx - 32, cz - 8);                                        // station building
      out.pois.push(P(lm, 'coaster', cx - 38, cz - 3, 'coaster', { cue: T('Naik roller coaster!', 'Ride the roller coaster!'), icon: 'roller_coaster' }));
      prop('bumperCars', cx + 22, cz + 16); box(cx + 12, cz + 9, cx + 32, cz + 23);
      prop('dropTower', cx - 30, cz + 24); circ(cx - 30, cz + 24, 3);
      prop('carousel', cx - 6, cz + 30); circ(cx - 6, cz + 30, 7);
      prop('foodStall', cx + 6, cz + 4, { color: '#ff6fa8', icon: 'popcorn' }); box(cx + 1.5, cz + 1, cx + 10.5, cz + 7);
      shop('funfair', cx + 6, cz + 10);
      prop('balloons', cx + 38, cz + 36);
      fact('f-queue', cx + 30, cz + 38);
      break;
    }
    case 'jogging': {
      out.ground = 'grass'; out.track = { x: cx, z: cz, rx: 36, rz: 30 };
      prop('pond', cx, cz, { r: 12 }); circ(cx, cz, 12);
      for (const [dx, dz] of [[-24, -14], [24, -14], [-24, 14], [24, 14]]) tree(cx + dx, cz + dz, 1.1);
      prop('gym', cx + 40, cz - 36); box(cx + 35, cz - 38, cx + 45, cz - 34);
      ringTrees(5, 16);
      quiz('quiz', cx - 8, cz + 40, ['kt-sport'], T('Soalan badan aktif!', 'Active body questions!'), 'jogging');
      fact('f-run', cx + 12, cz + 40);
      fact('f-water', cx + 26, cz + 40);
      out.joggers = true;
      break;
    }
    case 'grandmosque': {
      building({ x: cx, z: cz - 12, w: 50, d: 40, h: 12, color: '#f4fbf8', roof: 'dome', roofColor: '#3aa98f', kind: 'civic', minarets: 4, sign: lm.name });
      prop('fountain', cx, cz + 22); circ(cx, cz + 22, 3.2);
      out.pois.push(P(lm, 'mengaji', cx - 14, cz + 26, 'islamic', { cue: T('Jom Mengaji!', "Let's learn!"), icon: 'moon' }));
      fact('f-thanks', cx + 16, cz + 30);
      for (let k = 0; k < 6; k++) tree(cx - 40 + k * 16, front - 4, 1);
      break;
    }
    case 'hospital': {
      building({ x: cx, z: cz - 14, w: 66, d: 30, h: 16, color: '#ffffff', roof: 'flat', kind: 'civic', trim: '#ff5a5a', cross: true, sign: lm.name });
      prop('vehicle', cx + 26, cz + 12, { vehicle: 'ambulance' }); box(cx + 21.5, cz + 9, cx + 30.5, cz + 15);
      quiz('quiz', cx - 22, cz + 14, ['kt-helpers'], T('Siapa membantu kita?', 'Who helps us?'), 'hospital');
      quiz('dentist', cx - 2, cz + 14, ['hyg-2'], T('Klinik Gigi: soalan gigi!', 'Dentist: teeth questions!'), 'tooth');
      fact('f-teeth', cx - 12, cz + 28);
      fact('f-doctor', cx + 10, cz + 28);
      break;
    }
    case 'science': {
      building({ x: cx, z: cz - 14, w: 54, d: 30, h: 11, color: '#e8f2ff', roof: 'dome', roofColor: '#4a90e2', kind: 'civic', sign: lm.name });
      prop('rocket', cx + 32, cz + 16); circ(cx + 32, cz + 16, 3);
      prop('telescope', cx - 32, cz + 16); circ(cx - 32, cz + 16, 1.6);
      quiz('quiz', cx - 8, cz + 18, ['spc-1', 'spc-2', 'spc-3'], T('Soalan sains angkasa!', 'Space science questions!'), 'saturn');
      fact('f-daynight', cx + 10, cz + 28);
      fact('f-moonlight', cx - 18, cz + 32);
      break;
    }
    case 'aquarium': {
      building({ x: cx, z: cz - 14, w: 58, d: 30, h: 10, color: '#d8f3ff', roof: 'flat', kind: 'aquarium', trim: '#4fb8e8', sign: lm.name });
      prop('whaleStatue', cx + 26, cz + 22); circ(cx + 26, cz + 22, 4);
      prop('pond', cx - 26, cz + 22, { r: 7 }); circ(cx - 26, cz + 22, 7);
      quiz('quiz', cx - 4, cz + 16, ['kt-sea'], T('Soalan hidupan laut!', 'Sea life questions!'), 'whale');
      fact('f-whale', cx + 8, cz + 34);
      fact('f-octopus', cx - 10, cz + 34);
      break;
    }
    case 'dino': {
      out.ground = 'grass';
      building({ x: cx - 20, z: cz - 30, w: 40, d: 22, h: 9, color: '#fff3dc', roof: 'gable', roofColor: '#ff9a3c', kind: 'civic', along: true, sign: lm.name });
      prop('dinoStatue', cx + 22, cz - 22, { dino: 'longneck' }); box(cx + 14, cz - 26, cx + 30, cz - 18);
      prop('dinoStatue', cx + 24, cz + 12, { dino: 'trex' }); box(cx + 20, cz + 8, cx + 28, cz + 16);
      prop('fossilPit', cx - 22, cz + 8); box(cx - 30, cz + 2, cx - 14, cz + 14);
      quiz('quiz', cx - 2, cz + 26, ['kt-dino'], T('Soalan dinosaur!', 'Dinosaur questions!'), 'trex');
      fact('f-dino', cx - 22, cz + 30);
      fact('f-dinobird', cx + 18, cz + 32);
      for (const dx of [-40, 40]) tree(cx + dx, front - 5, 1.2);
      break;
    }
    case 'butterfly': {
      out.ground = 'grass';
      prop('greenhouse', cx, cz - 14); box(cx - 18, cz - 26, cx + 18, cz - 2);
      for (const [dx, dz] of [[-30, 12], [30, 12], [-30, -24], [30, -24]]) { prop('flowers', cx + dx, cz + dz, { w: 10, d: 3 }); box(cx + dx - 5, cz + dz - 1.5, cx + dx + 5, cz + dz + 1.5); }
      prop('butterflies', cx, cz + 6);
      quiz('quiz', cx - 8, cz + 22, ['kt-insect'], T('Soalan serangga!', 'Insect questions!'), 'butterfly');
      fact('f-butterfly-feet', cx + 10, cz + 24);
      fact('f-bees', cx + 26, cz + 34);
      ringTrees(5, 18);
      break;
    }
    case 'recycle': {
      building({ x: cx - 16, z: cz - 22, w: 50, d: 24, h: 8, color: '#eaffea', roof: 'gable', roofColor: '#4cc46a', kind: 'civic', along: true, sign: lm.name });
      prop('bigBins', cx + 26, cz - 16); box(cx + 16, cz - 20, cx + 38, cz - 12);
      prop('garbageTruck', cx + 24, cz + 10); box(cx + 20.5, cz + 8.6, cx + 28.2, cz + 11.4);
      quiz('quiz', cx - 12, cz + 12, ['kt-recycle'], T('Soalan kitar semula!', 'Recycling questions!'), 'recycle');
      fact('f-paper', cx - 30, cz + 26);
      fact('f-plastic', cx - 12, cz + 30);
      fact('f-glass', cx + 6, cz + 30);
      break;
    }
    case 'postoffice': {
      building({ x: cx, z: cz - 16, w: 46, d: 26, h: 9, color: '#ffffff', roof: 'flat', kind: 'civic', trim: '#e8202a', sign: lm.name });
      for (const dx of [-16, 16]) { prop('postbox', cx + dx, cz + 4); circ(cx + dx, cz + 4, 0.5); }
      quiz('quiz', cx, cz + 12, ['kt-helpers'], T('Soalan pekerjaan!', 'Jobs questions!'), 'letter_mail');
      fact('f-post', cx - 20, cz + 24);
      out.parked.push({ x: cx + 30, z: cz + 26, yaw: 0, color: '#e8202a' }); circ(cx + 30, cz + 26, 1.6);
      break;
    }
    case 'bank': {
      building({ x: cx, z: cz - 16, w: 48, d: 26, h: 11, color: '#fff8e6', roof: 'gable', roofColor: '#ffb43c', kind: 'bank', along: true, sign: lm.name });
      prop('piggyStatue', cx + 26, cz + 16); box(cx + 22, cz + 13, cx + 30, cz + 19);
      quiz('quiz', cx - 8, cz + 14, ['kt-money'], T('Soalan duit!', 'Money questions!'), 'piggy_bank');
      fact('f-save', cx - 24, cz + 26);
      break;
    }
    case 'cinema': {
      building({ x: cx, z: cz - 16, w: 52, d: 30, h: 12, color: '#3d3456', roof: 'flat', kind: 'cinema', trim: '#9b6bff', sign: lm.name });
      out.pois.push(P(lm, 'show', cx, cz + 8, 'cinema', { cue: T('Tonton cerita!', 'Watch a story!'), icon: 'film' }));
      prop('foodStall', cx + 28, cz + 8, { color: '#9b6bff', icon: 'popcorn' }); box(cx + 23.5, cz + 5, cx + 32.5, cz + 11);
      fact('f-queue', cx - 22, cz + 20);
      break;
    }
    case 'clocktower': {
      prop('clockTower', cx, cz - 6); box(cx - 3, cz - 9, cx + 3, cz - 3);
      for (const [dx, dz] of [[-20, -20], [20, -20], [-20, 16], [20, 16]]) { prop('flowers', cx + dx, cz + dz, { w: 10, d: 3 }); box(cx + dx - 5, cz + dz - 1.5, cx + dx + 5, cz + dz + 1.5); }
      out.pois.push(P(lm, 'clock', cx, cz + 4, 'clock', { cue: T('Pukul berapa sekarang?', 'What time is it now?'), icon: 'clock' }));
      quiz('quiz', cx - 12, cz + 28, ['kt-time'], T('Soalan masa!', 'Time questions!'), 'clock');
      fact('f-day24', cx + 12, cz + 30);
      fact('f-week', cx + 30, cz + 32);
      ringTrees(5, 18);
      break;
    }
    case 'waterpark': {
      prop('pool', cx, cz - 12); box(cx - 26, cz - 26, cx + 26, cz + 2);
      prop('waterSlide', cx + 34, cz - 22); box(cx + 30, cz - 30, cx + 38, cz - 14);
      prop('splashPad', cx - 22, cz + 20);
      quiz('quiz', cx + 6, cz + 14, ['kt-sport'], T('Selamat di dalam air!', 'Safe in the water!'), 'swimming');
      fact('f-lifejacket', cx + 22, cz + 24);
      break;
    }
    case 'sports': {
      out.ground = 'grass';
      prop('court', cx - 18, cz - 16, { sport: 'basketball' }); circ(cx - 32, cz - 16, 0.4); circ(cx - 4, cz - 16, 0.4);         // the two hoops
      prop('court', cx + 24, cz - 16, { sport: 'badminton' }); box(cx + 23.85, cz - 22, cx + 24.15, cz - 10);                 // the net
      quiz('quiz', cx - 6, cz + 14, ['kt-sport'], T('Soalan sukan!', 'Sport questions!'), 'basketball');
      fact('f-run', cx + 14, cz + 20);
      ringTrees(5, 20);
      break;
    }
    case 'petshop': {
      building({ x: cx, z: cz - 20, w: 40, d: 22, h: 8, color: '#fff3dc', roof: 'flat', kind: 'shop', face: 's', awning: '#ffb43c', sign: lm.name });
      prop('petPen', cx + 18, cz + 14); box(cx + 8, cz + 6, cx + 28, cz + 7); box(cx + 8, cz + 21, cx + 28, cz + 22); box(cx + 8, cz + 6, cx + 9, cz + 22); box(cx + 27, cz + 6, cx + 28, cz + 22);
      shop('pets', cx - 10, cz - 2);
      fact('f-cow', cx - 26, cz + 20);
      break;
    }
    case 'flowergarden': {
      out.ground = 'grass';
      for (let k = 0; k < 8; k++) { const dx = -30 + (k % 4) * 20, dz = -26 + Math.floor(k / 4) * 22; prop('hibiscusBed', cx + dx, cz + dz); box(cx + dx - 5, cz + dz - 2, cx + dx + 5, cz + dz + 2); }
      prop('gazebo', cx, cz + 22); circ(cx, cz + 22, 4.5);
      quiz('quiz', cx - 20, cz + 30, ['kt-malaysia'], T('Soalan Malaysia!', 'Malaysia questions!'), 'flag_my');
      fact('f-hibiscus', cx + 16, cz + 34);
      break;
    }
    case 'heritage': {
      out.ground = 'grass';
      for (const [dx, dz] of [[-24, -24], [20, -26], [-26, 10]]) building({ x: cx + dx, z: cz + dz, w: 14, d: 12, h: 7, color: '#d9a066', roof: 'kampung', kind: 'kampung' });
      prop('paddy', cx + 22, cz + 6); box(cx + 12, cz - 2, cx + 32, cz + 14);
      prop('wauDisplay', cx - 4, cz + 26); circ(cx - 4, cz + 26, 0.4);
      for (const [dx, dz] of [[-40, 30], [36, 30], [0, -40]]) out.trees.push({ x: cx + dx, z: cz + dz, s: 1.1, palm: true }), circ(cx + dx, cz + dz, 0.5);
      quiz('quiz', cx - 22, cz + 36, ['kt-malaysia'], T('Soalan Malaysia!', 'Malaysia questions!'), 'flag_my');
      fact('f-flag', cx + 12, cz + 38);
      fact('f-merdeka', cx + 28, cz + 40);
      break;
    }
    case 'airport': {
      out.ground = 'grass'; out.runway = { x0: L.x0 + 4, x1: L.x1 - 4, z: cz - 8 };
      building({ x: cx - 30, z: cz + 22, w: 30, d: 16, h: 7, color: '#e8f2ff', roof: 'flat', kind: 'civic', trim: '#4a90e2', sign: lm.name });
      prop('controlTower', cx + 34, cz + 24); circ(cx + 34, cz + 24, 2.2);
      prop('planeTakeoff', cx, cz - 8);
      prop('windsock', cx + 40, cz - 30); circ(cx + 40, cz - 30, 0.3);
      quiz('quiz', cx - 4, cz + 38, ['veh-2'], T('Darat, air atau udara?', 'Land, water or air?'), 'airplane');
      fact('f-plane', cx + 14, cz + 40);
      break;
    }
    case 'kitepark': {
      out.ground = 'grass';
      prop('kites', cx, cz - 6);
      for (const [dx, dz] of [[-20, -10], [10, -18], [24, 6]]) circ(cx + dx, cz + dz, 0.4);
      ringTrees(5, 20);
      quiz('quiz', cx - 12, cz + 32, ['kt-malaysia'], T('Soalan Malaysia!', 'Malaysia questions!'), 'kite');
      fact('f-wau', cx + 10, cz + 34);
      break;
    }
    case 'windfarm': {
      out.ground = 'grass';
      for (const [dx, dz] of [[-26, -24], [8, -30], [30, 0], [-12, 8]]) { prop('windTurbine', cx + dx, cz + dz); circ(cx + dx, cz + dz, 1.2); }
      fact('f-wind', cx - 6, cz + 32);
      quiz('quiz', cx + 16, cz + 32, ['nat-2'], T('Soalan cuaca!', 'Weather questions!'), 'cloud');
      break;
    }
    case 'harbour': {
      out.ground = 'paved';
      prop('lighthouse', cx + 30, cz - 10); circ(cx + 30, cz - 10, 4);
      building({ x: cx - 22, z: cz - 20, w: 30, d: 18, h: 7, color: '#e8f2ff', roof: 'gable', roofColor: '#4a90e2', kind: 'civic', along: true, sign: lm.name });
      prop('anchor', cx - 2, cz + 6); circ(cx - 2, cz + 6, 1.2);
      quiz('quiz', cx - 20, cz + 20, ['kt-sea'], T('Soalan laut!', 'Sea questions!'), 'boat');
      fact('f-lifejacket', cx + 4, cz + 26);
      fact('f-turtle', cx + 22, cz + 30);
      out.jetty = { x: cx };                               // drawn from the beach out into the sea
      break;
    }
    case 'birdpark': {
      out.ground = 'grass';
      prop('aviary', cx, cz - 12); circ(cx, cz - 12, 16);
      prop('hornbillStatue', cx + 30, cz + 20); circ(cx + 30, cz + 20, 1.6);
      quiz('quiz', cx - 14, cz + 24, ['kt-malaysia'], T('Soalan burung Malaysia!', 'Malaysian bird questions!'), 'hornbill');
      fact('f-hornbill', cx + 6, cz + 30);
      fact('f-owl', cx - 30, cz + 34);
      ringTrees(5, 18);
      break;
    }
    default: break;
  }
  void rng;
  return true;
}

/** The roller coaster: a closed track (x, y, z relative to its centre) with a station on the west side. */
export function coasterTrack() {
  const pts = [];
  const N = 160;
  // smooth hills as bells around angles along the loop (wrapped), never near the station (a = PI, the west end)
  const bell = (a, c, w) => { let d = Math.abs(a - c) % (Math.PI * 2); if (d > Math.PI) d = Math.PI * 2 - d; return Math.exp(-((d / w) ** 2)); };
  const smooth = (e0, e1, v) => { const t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  for (let k = 0; k < N; k++) {
    const a = (k / N) * Math.PI * 2;
    const x = Math.cos(a) * 36, z = Math.sin(a) * 15 + Math.sin(a * 2) * 3;
    // the lift hill after the station, the big drop, then three gentle bumps back to the station
    const hills = 9 * bell(a, Math.PI + 1.25, 0.45) + 4 * bell(a, Math.PI + 2.4, 0.3) + 3.5 * bell(a, 0.9, 0.35) + 2.5 * bell(a, 1.8, 0.3);
    const away = smooth(0.42, 0.75, Math.abs(a - Math.PI));            // 0 at the station, 1 further round
    pts.push({ x, z, y: 1.6 + hills * away });
  }
  return pts;
}
const COASTER_SUPPORTS = coasterTrack().filter((_, k) => k % 10 === 5).map((p) => [p.x, p.z]);
