// The preschool building: floors, walls, low dividers with doorways, the front door, and one Group per corner
// (so far-away corners can be switched off). The dollhouse side facing the camera is open, edged with foam blocks.
import { Group, Mesh, PlaneGeometry, InstancedMesh, Object3D, Color, DoubleSide } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { box, ball, cyl, cone, torus, star3d, heart3d, group, at, cachedGeo, live, mergeStatic } from './kit.js';
import { toon, lambert, basic, floorTexture, wallTexture, wainscotTexture, islamicTileTexture, checkerTexture, feltTexture, tint } from './paint.js';
import { BUILDING, DOOR, WALL_T, ZONES, dividerBoxes, zoneById, cx, COLS } from './layout.js';
import { createSign } from './signs.js';
import { PAL, rugRect } from './props.js';
import { buildZoneContent } from './zones.js';

const WALL_H = BUILDING.wallH;
const FRONT_Z = 11.0;                                          // the floor continues a little past the open front

// Look of each indoor corner: floor, wall colours, wainscot.
export const ZONE_STYLE = {
  hall:     { floor: 'wood', wall: ['#ffe3ef', '#ff7eb6'], wain: '#c9b6ff' },
  mengaji:  { floor: ['felt', '#cdeee4'], wall: 'islamic', wain: '#3aa98f' },
  reading:  { floor: 'wood', wall: ['#fff0d9', '#ff9a3c'], wain: '#ffc79c' },
  arcade:   { floor: ['checker', '#4a3f7a', '#6b5aa8'], wall: ['#5a4b9b', '#ffd23f'], wain: '#3a2f66' },
  art:      { floor: 'wood', wall: ['#ffe3e0', '#ff6b6b'], wain: '#ffb3b0' },
  numbers:  { floor: ['felt', '#fff0c4'], wall: ['#fff6cf', '#f5b400'], wain: '#ffd65a' },
  shapes:   { floor: ['felt', '#d9f0ff'], wall: ['#e2f3ff', '#3aa7f0'], wain: '#9fd8ff' },
  animals:  { floor: ['felt', '#dff5c8'], wall: ['#e3f6d5', '#ff8a4c'], wain: '#b5e8a4' },
  music:    { floor: ['felt', '#ffe0ee'], wall: ['#ffe6f1', '#ff6fa8'], wain: '#ffbcd8' },
  wardrobe: { floor: ['felt', '#ece4ff'], wall: ['#efe8ff', '#9b6bff'], wain: '#cdbdff' },
  rest:     { floor: 'wood', wall: ['#e0f7ef', '#6fdcb4'], wain: '#9be6c8' }
};

// Where the low sign of each front-row corner stands (clear of that corner's furniture).
const FRONT_SIGN_X = { reading: -17.6, art: -27.0, shapes: -35.4, music: -44.6, rest: -53.5 };

function scaledPlane(w, h, tileW, tileH) {
  const g = new PlaneGeometry(w, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (w / tileW), uv.getY(i) * (h / tileH));
  return g;
}

export function buildBuilding(scene, collision, { iconSvg }) {
  const root = new Group();
  root.name = 'building';
  scene.add(root);
  const groups = {};
  const grp = (id) => {
    if (!groups[id]) { const g = new Group(); g.name = 'zone-' + id; g.userData.zone = id; root.add(g); groups[id] = g; }
    return groups[id];
  };
  ZONES.filter((z) => z.area === 'indoor').forEach((z) => grp(z.id));

  // ---------- materials -------------------------------------------------------------------------------------------------
  const woodTex = floorTexture();
  woodTex.repeat.set(1, 1);
  const woodMat = lambert('#ffffff', woodTex);
  const hallWall = lambert('#ffffff');               // themed by the current world
  const hallWain = lambert('#ffffff');
  const facade = lambert('#ffe1c4');
  const trimCol = '#ffffff', topCol = '#f3e2d2';
  const matFor = (z) => {
    const st = ZONE_STYLE[z.id];
    const floor = Array.isArray(st.floor)
      ? (st.floor[0] === 'felt' ? lambert(st.floor[1], feltTexture()) : lambert('#ffffff', checkerTexture(st.floor[1], st.floor[2], 2)))
      : woodMat;
    let wall, wain;
    if (z.id === 'hall') { wall = hallWall; wain = hallWain; }
    else {
      const wt = st.wall === 'islamic' ? islamicTileTexture('#e9f7f2', '#3aa98f', 'mengaji') : wallTexture(st.wall[0], st.wall[1], 'wall-' + z.id);
      wt.repeat.set(1, 1);
      wall = lambert('#ffffff', wt);
      const wnt = wainscotTexture(st.wain, 'wain-' + z.id); wnt.repeat.set(1, 1);
      wain = lambert('#ffffff', wnt);
    }
    return { floor, wall, wain, floorTile: Array.isArray(st.floor) && st.floor[0] === 'checker' ? 4 : 7 };
  };

  // ---------- floors and back walls (one per corner) ---------------------------------------------------------------------
  const groundMeshes = [];
  for (const z of ZONES.filter((q) => q.area === 'indoor')) {
    const g = grp(z.id);
    const [x0, z0, x1, z1] = z.rect;
    const m = matFor(z);
    const fz1 = z1 >= BUILDING.maxZ - 0.01 ? FRONT_Z : z1;
    const fw = x1 - x0, fd = fz1 - z0;
    const floor = new Mesh(scaledPlane(fw, fd, m.floorTile, m.floorTile), m.floor);
    floor.rotation.x = -Math.PI / 2; floor.position.set((x0 + x1) / 2, 0, (z0 + fz1) / 2);
    floor.receiveShadow = true; floor.userData.keep = true; floor.name = 'floor-' + z.id;
    g.add(floor); groundMeshes.push(floor);
    if (z0 <= BUILDING.minZ + 0.01) {                                           // back wall behind the back row and the hall
      const wall = new Mesh(scaledPlane(fw, WALL_H, 8.8, WALL_H), m.wall);
      wall.position.set((x0 + x1) / 2, WALL_H / 2, BUILDING.minZ); wall.receiveShadow = true; g.add(wall);
      const wain = new Mesh(scaledPlane(fw, 1.6, 8, 1.6), m.wain);
      wain.position.set((x0 + x1) / 2, 0.8, BUILDING.minZ + 0.02); wain.receiveShadow = true; g.add(wain);
      g.add(box(fw + 0.02, 0.14, 0.16, trimCol, { x: (x0 + x1) / 2, y: 1.62, z: BUILDING.minZ + 0.08, r: 0.05, shadow: false, outline: 0.012 }));
    }
    if (x0 <= BUILDING.minX + 0.01 && z0 <= BUILDING.minZ + 0.01) {              // outer west wall (one plane for the full depth)
      const wall = new Mesh(scaledPlane(BUILDING.maxZ + 4 - BUILDING.minZ, WALL_H, 8.8, WALL_H), m.wall);
      wall.rotation.y = Math.PI / 2; wall.position.set(BUILDING.minX, WALL_H / 2, (BUILDING.minZ + BUILDING.maxZ + 4) / 2); g.add(wall);
    }
  }
  // west wall: one long plane for the whole depth, using the colour of the nearest corner at each row
  // (the two corner walls above already cover back row + front row of column 5)
  const hallG = grp('hall');

  // ---------- east wall with the front door --------------------------------------------------------------------------------
  const wallEndZ = BUILDING.maxZ + 4;
  const dz0 = DOOR.z - DOOR.width / 2, dz1 = DOOR.z + DOOR.width / 2;
  const eastSeg = (za, zb, mat, face = 1, h = WALL_H, y0 = 0) => {
    const w = zb - za;
    const m = new Mesh(scaledPlane(w, h, 8.8, WALL_H), mat);
    m.rotation.y = face * (-Math.PI / 2);
    m.position.set(BUILDING.maxX - (face > 0 ? 0.2 : -0.2), y0 + h / 2, (za + zb) / 2);
    m.receiveShadow = true; return m;
  };
  hallG.add(eastSeg(BUILDING.minZ, dz0, hallWall), eastSeg(dz1, wallEndZ, hallWall), eastSeg(dz0, dz1, hallWall, 1, WALL_H - 3.5, 3.5));
  hallG.add(eastSeg(BUILDING.minZ, dz0, facade, -1), eastSeg(dz1, wallEndZ, facade, -1), eastSeg(dz0, dz1, facade, -1, WALL_H - 3.5, 3.5));
  const hallWainE = (za, zb) => { const m = new Mesh(scaledPlane(zb - za, 1.6, 8, 1.6), hallWain); m.rotation.y = -Math.PI / 2; m.position.set(BUILDING.maxX - 0.22, 0.8, (za + zb) / 2); return m; };
  hallG.add(hallWainE(BUILDING.minZ, dz0), hallWainE(dz1, wallEndZ));
  // facade decoration: coloured band, round windows and flower boxes (seen from the yard)
  const band = (za, zb) => box(0.12, 0.5, zb - za, '#ff8fc0', { x: BUILDING.maxX + 0.28, y: 2.8, z: (za + zb) / 2, r: 0.04, shadow: false, outline: 0.012 });
  hallG.add(band(BUILDING.minZ, dz0), band(dz1, BUILDING.maxZ + 3.6));
  for (const zz of [-7.2, -4.4, 3.2, 6.2]) {
    hallG.add(cyl(0.9, 0.9, 0.16, '#ffffff', { x: BUILDING.maxX + 0.3, y: 3.7, z: zz, rz: Math.PI / 2, outline: 0.02, shadow: false }));
    hallG.add(cyl(0.72, 0.72, 0.1, '#bfe7ff', { x: BUILDING.maxX + 0.4, y: 3.7, z: zz, rz: Math.PI / 2, outline: 0, shadow: false }));
    hallG.add(box(0.55, 0.35, 1.6, '#ff9a6a', { x: BUILDING.maxX + 0.5, y: 2.25, z: zz, r: 0.06, outline: 0.012 }));
    for (let k = -1; k <= 1; k++) hallG.add(ball(0.2, ['#ff8fc0', '#ffd23f', '#b79cff'][k + 1], { x: BUILDING.maxX + 0.5, y: 2.6, z: zz + k * 0.5, seg: 8, outline: 0.012 }));
  }
  // wall tops (thick, dollhouse look)
  const capLen = BUILDING.maxX - BUILDING.minX + 2;
  hallG.add(box(capLen, 0.4, 0.7, topCol, { x: (BUILDING.minX + BUILDING.maxX) / 2, y: WALL_H + 0.15, z: BUILDING.minZ - 0.2, r: 0.12, shadow: false, outline: 0.02 }));
  hallG.add(box(0.7, 0.4, wallEndZ - BUILDING.minZ + 0.6, topCol, { x: BUILDING.minX - 0.2, y: WALL_H + 0.15, z: (BUILDING.minZ + wallEndZ) / 2, r: 0.12, shadow: false, outline: 0.02 }));
  hallG.add(box(0.7, 0.4, dz0 - BUILDING.minZ, topCol, { x: BUILDING.maxX + 0.2, y: WALL_H + 0.15, z: (BUILDING.minZ + dz0) / 2 - 0.1, r: 0.12, shadow: false, outline: 0.02 }));
  hallG.add(box(0.7, 0.4, wallEndZ - dz1, topCol, { x: BUILDING.maxX + 0.2, y: WALL_H + 0.15, z: (dz1 + wallEndZ) / 2, r: 0.12, shadow: false, outline: 0.02 }));
  hallG.add(box(0.7, WALL_H + 0.35, 0.3, topCol, { x: BUILDING.minX - 0.2, y: (WALL_H + 0.35) / 2, z: wallEndZ + 0.1, r: 0.1, shadow: false, outline: 0.02 }));
  hallG.add(box(0.7, WALL_H + 0.35, 0.3, topCol, { x: BUILDING.maxX + 0.2, y: (WALL_H + 0.35) / 2, z: wallEndZ + 0.1, r: 0.1, shadow: false, outline: 0.02 }));

  // ---------- foam-block fence along the open front ------------------------------------------------------------------------
  const foamCols = ['#ff8fc0', '#ffd65a', '#7fcbff', '#6fdcb4', '#b79cff', '#ffa86b'];
  const foamGeo = cachedGeo('foam', () => new RoundedBoxGeometry(1.6, 0.6, 0.6, 2, 0.12));
  const foamSpots = [];
  for (let x = BUILDING.minX + 0.9; x <= BUILDING.maxX - 0.2; x += 1.71) foamSpots.push(x);
  const foam = new InstancedMesh(foamGeo, toon('#ffffff'), foamSpots.length);
  const tmp = new Object3D(), cc = new Color();
  foamSpots.forEach((x, i) => { tmp.position.set(x, 0.3, BUILDING.maxZ + 0.75); tmp.rotation.set(0, 0, 0); tmp.updateMatrix(); foam.setMatrixAt(i, tmp.matrix); foam.setColorAt(i, cc.set(foamCols[i % foamCols.length])); });
  foam.castShadow = true; foam.receiveShadow = true; foam.userData.keep = true;
  root.add(foam);
  // side foam along the east wall inside the hall is part of the hall builder

  // ---------- low dividers between the corners -------------------------------------------------------------------------------
  const zoneOfX = (x) => ZONES.find((q) => q.area === 'indoor' && q.rect[0] <= x && x < q.rect[2]) || ZONES[1];
  const divCols = { c1: '#3aa98f', c2: '#9b6bff', c3: '#f5b400', c4: '#ff8a4c', c5: '#b79cff' };
  const posts = [];
  for (const d of dividerBoxes()) {
    const w = d.x1 - d.x0, dd = d.z1 - d.z0;
    const colId = d.axis === 'z' ? (COLS.find((c) => c.x0 === d.x)?.id || 'c1') : d.col;
    const color = d.axis === 'z' ? (d.x === -13 ? '#ffb3d4' : divCols[colId]) : divCols[colId];
    const owner = d.axis === 'z' ? zoneOfX(d.x - 0.5) : zoneOfX((d.x0 + d.x1) / 2);
    const g = grp(d.x === -13 ? 'reading' : owner.id);
    g.add(box(w, 1.25, dd, color, { x: (d.x0 + d.x1) / 2, y: 0.625, z: (d.z0 + d.z1) / 2, r: 0.1, outline: 0.02 }));
    g.add(box(w + 0.1, 0.12, dd + 0.1, '#ffffff', { x: (d.x0 + d.x1) / 2, y: 1.28, z: (d.z0 + d.z1) / 2, r: 0.05, outline: 0.012 }));
    // a little face of small dots along the top of long ones
    if (d.axis === 'x' || dd > 1.2) {
      const n = Math.floor((d.axis === 'x' ? w : dd) / 0.9);
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        const px = d.axis === 'x' ? d.x0 + w * t : d.x1 + 0.0;
        const pz = d.axis === 'x' ? d.z1 + 0.0 : d.z0 + dd * t;
        g.add(ball(0.09, ['#ffd65a', '#ffffff', '#ff8fc0'][i % 3], { x: d.axis === 'x' ? px : d.x1 + 0.0, y: 0.7, z: d.axis === 'x' ? d.z1 : pz, seg: 6, outline: 0 }));
      }
    }
    if (d.axis === 'z' && Math.abs(d.z1 - d.z0) > 0) posts.push({ x: d.x, z: d.z0 < d.z1 && (d.z0 === BUILDING.minZ || d.z0 === -1) ? d.z1 : d.z0, owner: g });
  }
  // gate posts with a star at both sides of every doorway
  for (const p of posts) {
    p.owner.add(cyl(0.22, 0.26, 1.7, '#ffffff', { x: p.x, y: 0.85, z: p.z, seg: 10, outline: 0.02 }), star3d(0.3, 0.1, PAL.yellow, { x: p.x, y: 2.0, z: p.z, outline: 0.015 }));
  }

  // ---------- zone signs and contents ---------------------------------------------------------------------------------------------
  const signs = [];
  const updaters = [];
  const ctx = { iconSvg, root, collision, signs, grp, updaters };
  for (const z of ZONES.filter((q) => q.area === 'indoor' && q.id !== 'hall')) {
    const g = grp(z.id);
    const [x0, z0, x1] = z.rect;
    const back = z0 <= BUILDING.minZ + 0.01;
    const sg = back
      ? createSign({ label: z.name, color: z.color, w: 4.8, h: 1.05, px: 640, iconKey: z.icon, iconSvg })
      : createSign({ label: z.name, color: z.color, w: 3.8, h: 0.84, px: 640, iconKey: z.icon, iconSvg });
    signs.push(sg);
    if (back) {
      sg.mesh.position.set((x0 + x1) / 2, 5.15, BUILDING.minZ + 0.17);                                                   // on the back wall, in front of its white plate
      g.add(box(5.0, 1.25, 0.14, '#ffffff', { x: (x0 + x1) / 2, y: 5.15, z: BUILDING.minZ + 0.06, r: 0.3, shadow: false, outline: 0.015 }));
    } else {
      // front row: a LOW sign on two short legs at the open front, so it never hides the child from the camera
      const sx = FRONT_SIGN_X[z.id] !== undefined ? FRONT_SIGN_X[z.id] : (x0 + x1) / 2, sz = BUILDING.maxZ - 0.12;
      sg.mesh.position.set(sx, 1.2, sz + 0.075);
      g.add(box(4.0, 0.98, 0.12, '#ffffff', { x: sx, y: 1.2, z: sz, r: 0.28, shadow: false, outline: 0.015 }),
        cyl(0.06, 0.06, 0.8, PAL.woodD, { x: sx - 1.5, y: 0.4, z: sz, seg: 8, outline: 0.01 }), cyl(0.06, 0.06, 0.8, PAL.woodD, { x: sx + 1.5, y: 0.4, z: sz, seg: 8, outline: 0.01 }));
    }
    g.add(sg.mesh);
    buildZoneContent(z.id, g, ctx);
  }

  // ---------- the front door -------------------------------------------------------------------------------------------------------
  const door = buildDoor(hallG, iconSvg, signs);

  // switch off distant corners, and merge what never moves
  const zoneList = [];
  for (const [id, g] of Object.entries(groups)) {
    if (id !== 'hall') mergeStatic(g);
    zoneList.push({ id, group: g, rect: zoneById[id].rect });
  }
  return { root, zones: zoneList, door, signs, groundMeshes, updaters, hall: { group: hallG, wallMat: hallWall, wainMat: hallWain, floorMat: woodMat }, tileUVScale: 8.8, ctx, update(t, reduced) { for (const u of updaters) u(t, reduced); } };
}

function buildDoor(parent, iconSvg, signs) {
  const D = DOOR;
  const half = D.width / 2;
  const frameCol = '#ffb43c';
  const H = 3.5;
  // jambs and lintel on both faces
  const frame = group();
  for (const side of [-1, 1]) {
    frame.add(box(0.7, H + 0.1, 0.3, frameCol, { x: 0, y: H / 2, z: D.z + side * (half + 0.15), r: 0.08, outline: 0.02 }));
  }
  frame.add(box(0.7, 0.35, D.width + 0.6, frameCol, { x: 0, y: H + 0.12, z: D.z, r: 0.08, outline: 0.02 }));
  frame.add(star3d(0.34, 0.12, '#ffffff', { x: 0.1, y: H + 0.62, z: D.z, ry: Math.PI / 2, outline: 0.02 }));
  frame.position.x = D.x;
  parent.add(frame);
  // two leaves hinged at the jambs; they swing outwards into the garden
  const mkLeaf = (hingeZ, dirSign) => {
    const pivot = new Group();
    pivot.position.set(D.x, 0, hingeZ);
    const w = half - 0.05;
    const lf = group(box(0.12, H - 0.1, w, '#3aa98f', { y: (H - 0.1) / 2, z: dirSign * w / 2, r: 0.05, outline: 0.02 }));
    lf.add(box(0.14, 0.3, w - 0.3, '#ffffff', { y: 1.1, z: dirSign * w / 2, r: 0.04, outline: 0.012 }), box(0.14, 0.3, w - 0.3, '#ffffff', { y: 2.5, z: dirSign * w / 2, r: 0.04, outline: 0.012 }));
    lf.add(cyl(0.34, 0.34, 0.16, '#bfe7ff', { y: 2.9, z: dirSign * w / 2, rz: Math.PI / 2, outline: 0.02 }));
    lf.add(ball(0.09, '#ffd23f', { x: 0.14, y: 1.7, z: dirSign * (w - 0.18), seg: 8, outline: 0.012 }), ball(0.09, '#ffd23f', { x: -0.14, y: 1.7, z: dirSign * (w - 0.18), seg: 8, outline: 0.012 }));
    pivot.add(lf);
    live(pivot);
    parent.add(pivot);
    return pivot;
  };
  const leafN = mkLeaf(D.z - half, 1), leafS = mkLeaf(D.z + half, -1);
  // welcome mats, flower pots, signs
  parent.add(at(rugRect(2.2, 1.6, '#ff9a3c', '#fff3dc'), D.x - 1.6, 0, D.z), at(rugRect(2.2, 1.6, '#3aa98f', '#fff3dc'), D.x + 1.6, 0, D.z));
  for (const sz of [-1, 1]) {
    parent.add(at(group(cyl(0.34, 0.26, 0.55, '#ff9a6a', { y: 0.28 }), ball(0.42, '#4cbf5b', { y: 0.85, seg: 10 }), ball(0.12, '#ff8fc0', { x: 0.2, y: 1.1, seg: 6 }), ball(0.12, '#ffd23f', { x: -0.2, y: 1.05, z: 0.1, seg: 6 })), D.x + 1.0, 0, D.z + sz * (half + 0.9)));
    parent.add(at(group(cyl(0.34, 0.26, 0.55, '#ff9a6a', { y: 0.28 }), ball(0.42, '#4cbf5b', { y: 0.85, seg: 10 }), ball(0.12, '#ff8fc0', { x: 0.2, y: 1.1, seg: 6 })), D.x - 1.0, 0, D.z + sz * (half + 0.9)));
  }
  const inSign = createSign({ label: { ms: 'Keluar ke Taman ➜', en: 'Out to the Garden ➜' }, color: '#ffa43c', w: 3.6, h: 0.9, px: 512, iconKey: 'sun', iconSvg });
  inSign.mesh.rotation.y = -Math.PI / 2; inSign.mesh.position.set(D.x - 0.3, 4.9, D.z);
  const outSign = createSign({ label: { ms: 'Selamat Datang! Masuk ke Tadika', en: 'Welcome! Come into the Preschool' }, color: '#3aa98f', w: 4.4, h: 0.95, px: 640, iconKey: 'star', iconSvg });
  outSign.mesh.rotation.y = Math.PI / 2; outSign.mesh.position.set(D.x + 0.45, 5.05, D.z);
  signs.push(inSign, outSign);
  parent.add(inSign.mesh, outSign.mesh);
  parent.add(box(0.14, 1.1, 4.7, '#ffffff', { x: D.x + 0.36, y: 5.05, z: D.z, r: 0.3, shadow: false, outline: 0.015 }));
  let angle = 0, target = 0;
  const OPEN = 1.75;
  return {
    get angle() { return angle; },
    get isOpen() { return target > 0; },
    set(open) { target = open ? OPEN : 0; },
    /** returns true when the doorway can be walked through (leaves swung out of the way) */
    update(dt) {
      const k = 1 - Math.exp(-5 * dt);
      angle += (target - angle) * k;
      leafN.rotation.y = angle;
      leafS.rotation.y = -angle;
      return angle > OPEN * 0.55;
    }
  };
}
void live; void heart3d; void cone; void torus; void DoubleSide; void basic; void tint; void cx;
