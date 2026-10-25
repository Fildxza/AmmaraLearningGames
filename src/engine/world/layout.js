// The floor plan of the whole AmmaraGames world, as plain data (no three.js), so the same numbers
// drive the 3D builders, collision, navigation, the mini-map and the unit tests.
//
//   x grows to the east (right on screen), z grows towards the camera (south, bottom of screen).
//
//   [ west wing: 5 columns x 2 rows of activity corners ] [ main hall ] [door] [ garden / playground ]
//   x: -58 ................................. -13 ........ 13 ..... 13 .................. 62
import { addBox, addCircle } from '../core/collision.js';

export const ROOM = { minX: -13, maxX: 13, backZ: -10, frontZ: 16, wallH: 6.2 };        // the main hall (kept for the themed room)
export const BUILDING = { minX: -58, maxX: 13, minZ: -10, maxZ: 8.1, wallH: 6.2 };
export const YARD = { minX: 13, maxX: 62, minZ: -22, maxZ: 22 };
export const MAP = { minX: -58, maxX: 62, minZ: -22, maxZ: 22 };
// Walkable rectangle. Everything that is not walkable inside it is blocked by the boxes below.
export const WALK = { minX: -58, maxX: 62, minZ: -22, maxZ: 22 };
export const WALL_T = 0.4;
export const DOOR = { x: 13, z: -1.0, width: 2.8 };
export const STATION_SLOTS = [{ x: -7.2, z: -4.4 }, { x: 7.2, z: -4.4 }, { x: 7.4, z: 3.7 }, { x: -7.4, z: 3.7 }];
export const SPAWN = { x: 0, z: 1.6 };
export const YARD_SPAWN = { x: 16.5, z: -1.0 };

// Layout of the west wing (columns C1..C5, back row and front row).
export const COLS = [{ id: 'c1', x0: -22, x1: -13 }, { id: 'c2', x0: -31, x1: -22 }, { id: 'c3', x0: -40, x1: -31 }, { id: 'c4', x0: -49, x1: -40 }, { id: 'c5', x0: -58, x1: -49 }];
export const ROW_SPLIT = -1.0;                // the horizontal divider
export const OPENING = 3.8;                   // width of every doorway between corners (about 4 child-widths)
export const cx = (c) => (c.x0 + c.x1) / 2;
export const BACK_CZ = (BUILDING.minZ + ROW_SPLIT) / 2;     // -5.5
export const FRONT_CZ = (ROW_SPLIT + BUILDING.maxZ) / 2;    // 3.55

// ---------- zones ---------------------------------------------------------------------------------------------------
// music: which background-music profile plays here. area: where the camera/lighting rules apply.
const T = (ms, en) => ({ ms, en });
export const ZONES = [
  { id: 'hall', rect: [-13, -10, 13, 8.1], area: 'indoor', music: 'playroom', color: '#ff7eb6', name: T('Dewan Utama', 'Main Hall'), icon: 'star' },
  { id: 'mengaji', rect: [-22, -10, -13, -1], area: 'indoor', music: 'islamic', color: '#3aa98f', name: T('Jom Mengaji', "Let's Learn the Quran"), icon: 'moon' },
  { id: 'reading', rect: [-22, -1, -13, 8.1], area: 'indoor', music: 'playroom', color: '#ff9a3c', name: T('Sudut ABC & Bacaan', 'ABC & Reading Corner'), icon: 'book' },
  { id: 'arcade', rect: [-31, -10, -22, -1], area: 'indoor', music: 'arcade', color: '#9b6bff', name: T('Arked Permainan', 'Mini-Game Arcade'), icon: 'ball:rainbow' },
  { id: 'art', rect: [-31, -1, -22, 8.1], area: 'indoor', music: 'playroom', color: '#ff6b6b', name: T('Sudut Lukisan', 'Art & Drawing'), icon: 'crayon:red' },
  { id: 'numbers', rect: [-40, -10, -31, -1], area: 'indoor', music: 'playroom', color: '#f5b400', name: T('Sudut Nombor', 'Numbers Corner'), icon: 'num:3' },
  { id: 'shapes', rect: [-40, -1, -31, 8.1], area: 'indoor', music: 'playroom', color: '#3aa7f0', name: T('Sudut Warna & Bentuk', 'Colours & Shapes'), icon: 'shape:triangle:mint' },
  { id: 'animals', rect: [-49, -10, -40, -1], area: 'indoor', music: 'playroom', color: '#ff8a4c', name: T('Sudut Haiwan', 'Animal Corner'), icon: 'cow' },
  { id: 'music', rect: [-49, -1, -40, 8.1], area: 'indoor', music: 'playroom', color: '#ff6fa8', name: T('Sudut Muzik', 'Music Corner'), icon: 'bubble:♪ ♫' },
  { id: 'wardrobe', rect: [-58, -10, -49, -1], area: 'indoor', music: 'playroom', color: '#b79cff', name: T('Almari & Hadiah', 'Wardrobe & Rewards'), icon: 'hat' },
  { id: 'rest', rect: [-58, -1, -49, 8.1], area: 'indoor', music: 'calm', color: '#6fdcb4', name: T('Sudut Rehat', 'Cosy Rest Corner'), icon: 'pillow' },
  // outdoors
  { id: 'gate', rect: [13, -8, 30, 8], area: 'outdoor', music: 'yard', color: '#ffb43c', name: T('Pintu Depan', 'Front Gate'), icon: 'door' },
  { id: 'garden', rect: [13, -22, 44, -8], area: 'outdoor', music: 'yard', color: '#5cc46a', name: T('Kebun Bunga', 'Flower Garden'), icon: 'flower' },
  { id: 'playground', rect: [44, -22, 62, 6], area: 'outdoor', music: 'yard', color: '#ff8fc0', name: T('Taman Permainan', 'Playground'), icon: 'ball' },
  { id: 'sandpit', rect: [30, 8, 62, 22], area: 'outdoor', music: 'yard', color: '#e8b06b', name: T('Kotak Pasir & Lompat Kijang', 'Sandpit & Hopscotch'), icon: 'sprout' },
  { id: 'lawn', rect: [13, 8, 30, 22], area: 'outdoor', music: 'yard', color: '#8fd45e', name: T('Padang Hijau', 'Green Lawn'), icon: 'tree' },
  { id: 'yard-rest', rect: [30, -8, 44, 8], area: 'outdoor', music: 'yard', color: '#7fcbff', name: T('Taman Santai', 'Picnic Park'), icon: 'sun' }
];
export const zoneById = Object.fromEntries(ZONES.map((z) => [z.id, z]));
export function zoneAt(x, z) {
  // rects overlap only on shared edges; the first match wins. Later rects are checked first so the yard order is stable.
  for (const zone of ZONES) { const [x0, z0, x1, z1] = zone.rect; if (x >= x0 && x < x1 && z >= z0 && z < z1) return zone; }
  if (x >= YARD.minX) return zoneById['gate'];
  return zoneById['hall'];
}
export const isOutdoor = (x) => x > BUILDING.maxX + 0.2;

// ---------- the points of interest the child can use (besides the 4 learning stations) --------------------------------
// radius = footprint radius of the object (distance is measured from its edge).
// action: door | arcade | islamic | wardrobe | game | npc | quiz
export const POIS = [
  { id: 'door', x: DOOR.x, z: DOOR.z, radius: 0.6, action: 'door', zone: 'gate', icon: 'door', label: T('Pintu Depan', 'Front Door'), cue: T('Keluar ke taman!', 'Go out to the garden!') },
  { id: 'arcade', x: -26.5, z: -5.2, radius: 0.95, action: 'arcade', zone: 'arcade', icon: 'ball:rainbow', label: T('Arked Permainan', 'Mini-Game Arcade'), cue: T('Jom main permainan!', "Let's play games!") },
  { id: 'islamic', x: -17.5, z: -8.1, radius: 0.9, action: 'islamic', zone: 'mengaji', icon: 'book', label: T('Jom Mengaji', "Let's Learn the Quran"), cue: T('Jom belajar huruf hijaiyah!', 'Hijaiyah letters and surahs') },
  { id: 'wardrobe', x: -53.5, z: -6.6, radius: 0.9, action: 'wardrobe', zone: 'wardrobe', icon: 'hat', label: T('Almari & Hadiah', 'Wardrobe & Rewards'), cue: T('Pakai hadiah kamu!', 'Wear your rewards!') },
  { id: 'npc-boy', x: -19.2, z: 3.0, radius: 0.7, action: 'npc', npc: 'boy', zone: 'reading', icon: 'face_happy', label: T('Robo Danial', 'Robo Danial'), cue: T('Cakap hai!', 'Say hi!') },
  { id: 'npc-girl', x: -15.8, z: 3.0, radius: 0.7, action: 'npc', npc: 'girl', zone: 'reading', icon: 'face_happy', label: T('Robo Aisyah', 'Robo Aisyah'), cue: T('Cakap hai!', 'Say hi!') },
  { id: 'g-trace', x: -14.3, z: 6.3, radius: 0.9, action: 'game', game: 'trace', zone: 'reading', icon: 'letter:A', label: T('Papan Tulis ABC', 'ABC Blackboard'), cue: T('Surih huruf!', 'Trace letters!') },
  { id: 'g-ruler', x: -26.5, z: 3.2, radius: 1.8, action: 'game', game: 'ruler', zone: 'art', icon: 'len:pencil:l', label: T('Meja Pembaris', 'Ruler Desk'), cue: T('Lukis garisan lurus!', 'Draw straight lines!') },
  { id: 'g-dots', x: -23.4, z: 6.0, radius: 0.8, action: 'game', game: 'dots', zone: 'art', icon: 'dots:4', label: T('Papan Sambung Titik', 'Dot Easel'), cue: T('Sambung titik-titik!', 'Connect the dots!') },
  { id: 'g-counting', x: -35.5, z: -4.1, radius: 1.1, action: 'game', game: 'counting', zone: 'numbers', icon: 'count:apple:3', label: T('Kedai Kira', 'Counting Shop'), cue: T('Kira dan asingkan!', 'Count and sort!') },
  { id: 'g-puzzle', x: -33.6, z: 5.6, radius: 1.0, action: 'game', game: 'puzzle', zone: 'shapes', icon: 'shape:star:yellow', label: T('Teka-teki Bentuk', 'Shape Puzzle'), cue: T('Padankan bentuk!', 'Fit the shapes!') },
  { id: 'g-patterns', x: -37.2, z: 2.2, radius: 0.9, action: 'game', game: 'patterns', zone: 'shapes', icon: 'ball:rainbow', label: T('Corak Manik', 'Pattern Beads'), cue: T('Sambung corak!', 'Finish the pattern!') },
  { id: 'g-memory', x: -44.5, z: -4.5, radius: 1.1, action: 'game', game: 'memory', zone: 'animals', icon: 'cow', label: T('Kad Haiwan', 'Animal Cards'), cue: T('Cari pasangan!', 'Find the pairs!') },
  { id: 'g-music', x: -44.5, z: 3.3, radius: 1.8, action: 'game', game: 'music', zone: 'music', icon: 'bubble:♪ ♫', label: T('Xilofon', 'Xylophone'), cue: T('Main muzik!', 'Make music!') },
  { id: 'g-find', x: -53.8, z: 6.0, radius: 1.1, action: 'game', game: 'find', zone: 'rest', icon: 'toy_box', label: T('Bakul Harta Karun', 'Treasure Basket'), cue: T('Cari barang itu!', 'Find the thing!') },
  { id: 'g-xo', x: -1.2, z: 7.2, radius: 1.3, action: 'game', game: 'xo', zone: 'hall', icon: 'shape:square:butter', label: T('Tikar X dan O', 'X and O Mat'), cue: T('Main X dan O!', 'Play X and O!') },
  // ---- outdoors
  { id: 'y-hopscotch', x: 24.0, z: 14.5, radius: 1.2, action: 'game', game: 'counting', zone: 'lawn', icon: 'num:5', label: T('Lompat Kijang', 'Hopscotch'), cue: T('Kira sambil melompat!', 'Count while hopping!') },
  { id: 'y-sandpit', x: 38.0, z: 15.0, radius: 2.2, action: 'game', game: 'puzzle', zone: 'sandpit', icon: 'shape:circle:sky', label: T('Kotak Pasir', 'Sandpit'), cue: T('Acuan bentuk!', 'Shape moulds!') },
  { id: 'y-garden', x: 28.0, z: -15.0, radius: 1.6, action: 'game', game: 'counting', level: 'sort', zone: 'garden', icon: 'flower', label: T('Kebun Bunga', 'Flower Garden'), cue: T('Asingkan bunga!', 'Sort the flowers!') },
  { id: 'y-gazebo', x: 38.5, z: -2.0, radius: 1.9, action: 'quiz', quiz: 'nature', zone: 'yard-rest', icon: 'tree', label: T('Stesen Alam', 'Nature Station'), cue: T('Soalan tentang alam!', 'Questions about nature!') },
  { id: 'y-playground', x: 53.0, z: -12.0, radius: 2.0, action: 'game', game: 'memory', zone: 'playground', icon: 'ball', label: T('Kad Taman', 'Playground Cards'), cue: T('Cari pasangan!', 'Find the pairs!') },
  { id: 'y-board', x: 52.0, z: 4.5, radius: 1.2, action: 'game', game: 'trace', zone: 'playground', icon: 'num:1', label: T('Papan Kapur', 'Chalkboard'), cue: T('Surih nombor!', 'Trace numbers!') },
  { id: 'y-find', x: 20.0, z: -14.0, radius: 1.2, action: 'game', game: 'find', zone: 'garden', icon: 'bird', label: T('Cari di Kebun', 'Garden Hunt'), cue: T('Cari barang itu!', 'Find the thing!') }
];
export const poiById = Object.fromEntries(POIS.map((p) => [p.id, p]));

// ---------- NPC seats (both robots stay seated for ever) -----------------------------------------------------------
export const NPC_SEATS = {
  boy: { x: -19.2, z: 3.0, ry: 0.35, name: 'Robo Danial' },
  girl: { x: -15.8, z: 3.0, ry: -0.35, name: 'Robo Aisyah' }
};

// ---------- the main-hall furniture (positions shared with the builders) ------------------------------------------------
export const TABLE = { x: 10.3, z: -6.8 };
export const BEANBAG = { x: -11.0, z: 6.9 };
export const CHEST = { x: 10.8, z: 7.0 };
export const BEACHBALL = { x: 8.7, z: 7.45 };

// ---------- the yard's solid things (the builders draw them at these places) ----------------------------------------------
export const YARD_SOLIDS = {
  trees: [[16.5, -17.5, 1.1], [39.5, -19.5, 1.2], [40.5, -12.0, 1.1], [17.5, 11.0, 1.2], [26.0, 19.0, 1.2], [47.0, 12.0, 1.2], [55.0, 11.5, 1.3], [31.5, -5.5, 1.1], [41.5, 5.0, 1.2], [20.0, 3.8, 0.9], [57.0, -3.0, 1.0], [18.0, 18.5, 1.0]],
  fountain: { x: 24.5, z: -1.0, r: 1.7 },
  gazebo: [[36.7, -3.7], [40.3, -3.7], [36.7, -0.3], [40.3, -0.3]],
  slide: { x0: 49.0, z0: -17.4, x1: 52.4, z1: -13.4 },
  swing: { x0: 55.2, z0: -9.6, x1: 59.8, z1: -8.2 },
  seesaw: { x0: 47.6, z0: -8.2, x1: 51.6, z1: -6.8 },
  climber: { x: 56.5, z: -17.0, r: 1.6 },
  sandbox: { x0: 33.2, z0: 12.2, x1: 42.8, z1: 18.6 },
  benches: [{ x0: 26.0, z0: 3.2, x1: 27.6, z1: 6.0 }, { x0: 14.6, z0: -6.8, x1: 16.6, z1: -5.8 }, { x0: 43.0, z0: 5.6, x1: 46.0, z1: 6.8 }],
  gardenBeds: [{ x0: 22.0, z0: -18.6, x1: 25.6, z1: -16.2 }, { x0: 27.0, z0: -18.6, x1: 30.6, z1: -16.2 }, { x0: 32.0, z0: -18.6, x1: 35.6, z1: -16.2 }, { x0: 24.0, z0: -13.0, x1: 33.0, z1: -11.6 }],
  schoolSign: { x0: 15.4, z0: 4.8, x1: 17.6, z1: 5.6 },
  chalkboard: { x0: 50.6, z0: 2.4, x1: 53.4, z1: 3.2 }
};

// Gates in the garden hedge (to the town). The strips here are 'novehicle' barriers: open for children only.
export const GATES = [{ x0: 36, z0: 21.2, x1: 44, z1: 23.2, side: 'south' }, { x0: 61.2, z0: -4, x1: 64.2, z1: 2, side: 'east' }];
/** Barriers that only unicorns and cars bump into: the doorway and the garden gates (children walk through). */
export function addVehicleBarriers(w) {
  addBox(w, BUILDING.maxX - 0.5, DOOR.z - DOOR.width / 2, BUILDING.maxX + 0.5, DOOR.z + DOOR.width / 2, 'novehicle');
  for (const g of GATES) addBox(w, g.x0, g.z0, g.x1, g.z1, 'novehicle');
  addBox(w, BUILDING.minX - 1, BUILDING.maxZ, BUILDING.maxX + WALL_T / 2, BUILDING.maxZ + 0.6, 'novehicle');
}
// Hedges close the yard on three sides and trim the far edge of the front gate.
function hedge(w, x0, z0, x1, z1) { addBox(w, x0, z0, x1, z1, 'static'); }

// The low walls that separate the corners of the west wing. Each one leaves a doorway so the child can pass.
// Both the colliders and the 3D drawings read this list.
export function dividerBoxes() {
  const out = [];
  const dT = 0.25;
  for (const x of [-13, ...COLS.slice(0, 4).map((c) => c.x0)]) {                       // x = -13, -22, -31, -40, -49
    const wide = x === -13 ? 5.0 : OPENING;                                              // the hall is wide open to the first corners
    for (const [z0, z1, c, row] of [[BUILDING.minZ, ROW_SPLIT, BACK_CZ, 'back'], [ROW_SPLIT, BUILDING.maxZ, FRONT_CZ, 'front']]) {
      out.push({ x0: x - dT, z0, x1: x + dT, z1: c - wide / 2, axis: 'z', x, row, col: x });
      out.push({ x0: x - dT, z0: c + wide / 2, x1: x + dT, z1, axis: 'z', x, row, col: x });
    }
  }
  for (const c of COLS) {                                                                // the horizontal divider (not in the hall)
    const m = cx(c);
    out.push({ x0: c.x0, z0: ROW_SPLIT - dT, x1: m - OPENING / 2, z1: ROW_SPLIT + dT, axis: 'x', col: c.id });
    out.push({ x0: m + OPENING / 2, z0: ROW_SPLIT - dT, x1: c.x1, z1: ROW_SPLIT + dT, axis: 'x', col: c.id });
  }
  return out;
}

/** Registers every static collider of the world. */
export function addStaticColliders(w) {
  const T2 = WALL_T / 2;
  // ----- outside the building (north and south of it) and its walls
  addBox(w, BUILDING.minX - 1, MAP.minZ - 1, BUILDING.maxX + T2, BUILDING.minZ, 'static');        // north of the back wall (and the wall)
  addBox(w, BUILDING.minX - 1, BUILDING.maxZ, BUILDING.maxX + T2, MAP.maxZ + 1, 'static');        // south of the open front (foam fence)
  addBox(w, BUILDING.maxX - T2, BUILDING.minZ, BUILDING.maxX + T2, DOOR.z - DOOR.width / 2, 'static'); // east wall, north of the door
  addBox(w, BUILDING.maxX - T2, DOOR.z + DOOR.width / 2, BUILDING.maxX + T2, BUILDING.maxZ, 'static'); // east wall, south of the door
  // ----- the west wall (the edge of the old map used to stand in for it; the town is outside now)
  addBox(w, BUILDING.minX - 1, BUILDING.minZ, BUILDING.minX, BUILDING.maxZ, 'static');
  // ----- the door leaves (removed by the door while it is open)
  addBox(w, BUILDING.maxX - T2, DOOR.z - DOOR.width / 2, BUILDING.maxX + T2, DOOR.z + DOOR.width / 2, 'door');


  // ----- dividers of the west wing (low walls with doorways)
  for (const d of dividerBoxes()) addBox(w, d.x0, d.z0, d.x1, d.z1, 'static');

  // ----- main hall
  addBox(w, -3.15, ROOM.backZ, 3.15, ROOM.backZ + 1.3, 'static');                         // toy cabinet
  addBox(w, TABLE.x - 1.08, TABLE.z - 2.05, TABLE.x + 1.08, TABLE.z + 2.05, 'static');    // round table with two chairs
  addBox(w, -12.0, 5.85, -9.95, WALK_FRONT, 'static');                                      // bean bag
  addBox(w, 9.85, 6.4, BUILDING.maxX - 0.2, WALK_FRONT, 'static');                          // toy chest
  addBox(w, 8.05, 6.8, 9.35, WALK_FRONT, 'static');                                         // beach ball
  addBox(w, 11.3, ROOM.backZ, 12.75, ROOM.backZ + 1.4, 'static');                           // plant (north-east corner), flush with the walls
  addBox(w, -12.5, ROOM.backZ, -11.3, ROOM.backZ + 1.4, 'static');                          // plant (north-west corner), flush with the wall

  // ----- 1 Jom Mengaji (x -22..-13, z -10..-1)
  addBox(w, -18.3, -9.9, -16.7, -7.4, 'static');                   // rehal + big Mushaf on its stand
  addBox(w, -21.75, -9.9, -20.8, -8.2, 'static');                  // low shelf of books
  addBox(w, -15.2, -9.9, -13.5, -7.9, 'static');                   // alif-ba-ta blocks
  addCircle(w, -14.0, -2.2, 0.55, 'static');                       // lantern stand
  // ----- 2 ABC & reading corner (x -22..-13, z -1..8.1)
  addCircle(w, -19.2, 3.0, 0.7, 'static');                         // robot boy's chair
  addCircle(w, -15.8, 3.0, 0.7, 'static');                         // robot girl's cushion
  addBox(w, -15.4, 6.2, -13.2, 7.5, 'static');                     // ABC blackboard
  addBox(w, -21.8, 5.2, -20.6, 7.6, 'static');                     // book trolley
  // ----- 3 Arcade (x -31..-22, z -10..-1)
  for (const x of [-29.6, -27.8, -25.2, -23.4]) addBox(w, x - 0.65, -9.9, x + 0.65, -8.6, 'static');   // 4 arcade cabinets
  addCircle(w, -26.5, -5.2, 0.95, 'static');                       // arcade hub console
  addBox(w, -30.9, -3.2, -29.6, -1.6, 'static');                   // prize shelf
  // ----- 4 Art (x -31..-22, z -1..8.1)
  addBox(w, -28.3, 2.4, -24.7, 4.0, 'static');                     // big drawing desk
  addCircle(w, -23.4, 6.0, 0.8, 'static');                         // easel
  addBox(w, -30.9, 5.8, -29.6, 7.8, 'static');                     // paint shelf
  // ----- 5 Numbers (x -40..-31, z -10..-1)
  addBox(w, -36.8, -9.9, -34.2, -7.3, 'static');                   // abacus
  addCircle(w, -35.5, -4.1, 0.95, 'static');                       // counting-shop table
  addBox(w, -39.9, -9.9, -38.6, -8.4, 'static');                   // number-block shelf
  // ----- 6 Colours & shapes (x -40..-31, z -1..8.1)
  addBox(w, -39.4, 5.4, -37.0, 8.1, 'static');                     // shape tower
  addCircle(w, -33.6, 5.6, 0.95, 'static');                        // shape sorter
  addCircle(w, -37.2, 2.2, 0.9, 'static');                         // stacking rings
  // ----- 7 Animals (x -49..-40, z -10..-1)
  addBox(w, -48.4, -9.9, -45.2, -6.8, 'static');                   // barn
  addBox(w, -43.7, -9.9, -41.7, -7.6, 'static');                   // big plush tree
  addCircle(w, -44.5, -4.5, 1.0, 'static');                        // animal-card table
  // ----- 8 Music (x -49..-40, z -1..8.1)
  addBox(w, -46.2, 2.6, -42.8, 4.0, 'static');                     // xylophone
  addBox(w, -48.4, 5.8, -46.8, 8.1, 'static');                     // big drum
  addBox(w, -42.4, 6.1, -40.8, 8.1, 'static');                     // small drum
  // ----- 9 Wardrobe (x -58..-49, z -10..-1)
  addBox(w, -55.4, -9.9, -51.6, -8.6, 'static');                   // wardrobe cabinet
  addBox(w, -57.9, -9.0, -56.9, -6.4, 'static');                   // hat rack shelf
  addCircle(w, -53.5, -6.6, 0.9, 'static');                        // standing mirror
  // ----- 10 Rest corner (x -58..-49, z -1..8.1)
  addBox(w, -57.9, 0.4, -56.2, 4.0, 'static');                     // sofa
  addCircle(w, -53.8, 6.0, 1.1, 'static');                         // toy basket
  addCircle(w, -50.2, 0.5, 0.55, 'static');                        // floor lamp

  // ----- yard
  const Y = YARD_SOLIDS;
  for (const [x, z, r] of Y.trees) addCircle(w, x, z, r, 'static');
  addCircle(w, Y.fountain.x, Y.fountain.z, Y.fountain.r, 'static');
  for (const [x, z] of Y.gazebo) addCircle(w, x, z, 0.28, 'static');
  for (const b of [Y.slide, Y.swing, Y.seesaw, Y.sandbox, Y.schoolSign, Y.chalkboard, ...Y.benches, ...Y.gardenBeds]) addBox(w, b.x0, b.z0, b.x1, b.z1, 'static');
  addCircle(w, Y.climber.x, Y.climber.z, Y.climber.r, 'static');
  // hedges / fences around the yard
  // hedges around the garden, with two gates out to the town (south: to the bus stop; east: to the unicorn stable)
  const [S, E] = GATES;
  hedge(w, YARD.maxX - 0.5, MAP.minZ - 1, YARD.maxX + 2, E.z0);                   // east, north of the gate
  hedge(w, YARD.maxX - 0.5, E.z1, YARD.maxX + 2, MAP.maxZ + 1);                   // east, south of the gate
  hedge(w, BUILDING.maxX + T2, MAP.minZ - 1, YARD.maxX + 2, MAP.minZ + 0.5);     // north
  hedge(w, BUILDING.maxX + T2, MAP.maxZ - 0.5, S.x0, MAP.maxZ + 1);              // south, west of the gate
  hedge(w, S.x1, MAP.maxZ - 0.5, YARD.maxX + 2, MAP.maxZ + 1);                   // south, east of the gate
}
// The foam fence along the front of the building is at z = 8.1 (see BUILDING.maxZ).
const WALK_FRONT = BUILDING.maxZ;

export function defaultWorld() {
  return { bounds: Object.assign({}, WALK), boxes: [], circles: [] };
}
