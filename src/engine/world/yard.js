// The garden and playground outside the front door: grass, stone paths, trees, flower beds, a fountain, a gazebo
// (the Nature Station), a playground, a sandpit and a hopscotch. Colliders live in layout.js; this file draws them.
import { Group, Mesh, PlaneGeometry, InstancedMesh, Object3D, Color, SphereGeometry, CylinderGeometry, MeshBasicMaterial, DoubleSide } from 'three';
import { box, ball, cyl, cone, torus, star3d, heart3d, group, at, cachedGeo, live, mergeStatic } from './kit.js';
import { toon, lambert, basic, grassTexture, stonePathTexture, sandTexture, checkerTexture, tint, makeCanvas, canvasTexture, roundRect } from './paint.js';
import { YARD, MAP, DOOR, BUILDING, ZONES, YARD_SOLIDS, POIS, zoneAt, zoneById, poiById } from './layout.js';
import { createRng } from '../core/rng.js';
import { createSign, boardTexture } from './signs.js';
import { poiMarker } from './zones.js';
import { PAL, rugRound, rugRect, treeRound, treeCone, bush, benchWood, slideKid, swingSet, seesawKid, climberDome, sandboxBox, lampPost, fountain, gazebo, hopscotch, flowerBed, vegPatch, blackboardStand, flat } from './props.js';
import { FONT } from '../art/svg.js';

function tiledPlane(w, d, tile) {
  const g = new PlaneGeometry(w, d);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (w / tile), uv.getY(i) * (d / tile));
  return g;
}
function repeatClone(tex) { const t = tex.clone(); t.repeat.set(1, 1); t.needsUpdate = true; return t; }

// Stone paths (x0, z0, x1, z1). They only decorate; the whole yard is walkable.
export const PATHS = [
  [13.2, -2.6, 24.5, 0.6],          // from the front door to the fountain
  [24.5, -2.6, 50.5, 0.6],          // main road to the park and the playground
  [44.5, -6.0, 47.3, -2.6],         // up to the playground
  [22.0, -16.0, 25.0, -2.6],        // to the flower garden
  [25.0, -16.0, 36.0, -13.2],       // between the flower beds
  [22.5, 0.6, 25.5, 11.9],          // to the lawn and the sandpit
  [25.5, 8.4, 41.0, 11.0],          // along the sandpit
  [50.2, 3.4, 53.8, 5.8]            // in front of the chalkboard
];
const PLAZA = { x: YARD_SOLIDS.fountain.x, z: YARD_SOLIDS.fountain.z, r: 3.7 };
const PLAY = { x0: 46.8, z0: -20.4, x1: 61.4, z1: -4.6 };
const HOP = { x: 24.0, z: 15.2 };

export function buildYard(scene, { iconSvg }) {
  const root = new Group();
  root.name = 'yard';
  scene.add(root);
  const updaters = [];
  const groups = {};
  const grp = (id) => { if (!groups[id]) { const g = new Group(); g.name = 'yard-' + id; root.add(g); groups[id] = g; } return groups[id]; };
  const outdoor = ZONES.filter((z) => z.area === 'outdoor');
  outdoor.forEach((z) => grp(z.id));
  const common = grp('common');
  const put = (obj, x, z, y = 0, ry = 0) => { obj.position.set(x, y, z); obj.rotation.y = ry; (groups[zoneAt(x, z).id] || common).add(obj); return obj; };
  const groundMeshes = [];

  // ---------- grass over the whole map (below the building floors) and paths -------------------------------------------------
  const grass = repeatClone(grassTexture());
  const ground = new Mesh(tiledPlane(260, 160, 8), lambert('#ffffff', grass));
  ground.rotation.x = -Math.PI / 2; ground.position.set((MAP.minX + YARD.maxX) / 2, -0.02, -4); ground.receiveShadow = true; ground.userData.keep = true; ground.name = 'ground-grass';
  common.add(ground); groundMeshes.push(ground);
  const stone = repeatClone(stonePathTexture());
  const stoneMat = lambert('#ffffff', stone);
  for (const [x0, z0, x1, z1] of PATHS) {
    const m = new Mesh(tiledPlane(x1 - x0, z1 - z0, 2.4), stoneMat);
    m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, 0.012, (z0 + z1) / 2); m.receiveShadow = true; common.add(m);
  }
  // a round plaza around the fountain and a round stone ring for the garden sorting game
  const roundStone = (r, x, z) => {
    const g = new CylinderGeometry(r, r, 0.02, 40);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (r * 2 / 2.4), uv.getY(i) * (r * 2 / 2.4));
    const m = new Mesh(g, stoneMat);
    m.position.set(x, 0.016, z); m.receiveShadow = true;
    return m;
  };
  common.add(roundStone(PLAZA.r, PLAZA.x, PLAZA.z));
  const sortSpot = poiById['y-garden'];
  common.add(roundStone(sortSpot.radius + 0.4, sortSpot.x, sortSpot.z));

  // ---------- hedges around the yard (instanced bushes) -----------------------------------------------------------------------------
  const rng = createRng('ammara-yard');
  const hedgeItems = [];
  const HC = ['#4fb862', '#5cc46a', '#47a85a', '#62cc72'];
  const addHedge = (x0, z0, x1, z1, y, s) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.round(len / 1.5);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      hedgeItems.push({ x: x0 + (x1 - x0) * t + (rng.next() - 0.5) * 0.3, z: z0 + (z1 - z0) * t + (rng.next() - 0.5) * 0.3, y, s: s * (0.9 + rng.next() * 0.3), c: HC[i % HC.length] });
    }
  };
  addHedge(YARD.minX + 0.9, MAP.minZ - 0.45, YARD.maxX + 0.5, MAP.minZ - 0.45, 0.45, 1.05);
  addHedge(YARD.maxX + 0.0, MAP.minZ, YARD.maxX + 0.0, MAP.maxZ, 0.45, 1.05);
  addHedge(YARD.minX + 0.9, MAP.maxZ + 0.45, YARD.maxX + 0.5, MAP.maxZ + 0.45, 0.3, 0.8);
  const hedge = new InstancedMesh(cachedGeo('hedgeball', () => new SphereGeometry(1, 12, 8)), toon('#ffffff'), hedgeItems.length);
  const tmp = new Object3D(), col = new Color();
  hedgeItems.forEach((h, i) => { tmp.position.set(h.x, h.y, h.z); tmp.scale.set(h.s, h.s * 0.85, h.s); tmp.rotation.set(0, rng.next() * 6, 0); tmp.updateMatrix(); hedge.setMatrixAt(i, tmp.matrix); hedge.setColorAt(i, col.set(h.c)); });
  hedge.castShadow = true; hedge.receiveShadow = true; hedge.userData.keep = true;
  common.add(hedge);
  // hedge flowers
  const hedgeFl = new InstancedMesh(cachedGeo('hedgeflower', () => new SphereGeometry(0.13, 6, 5)), toon('#ffffff'), hedgeItems.length * 3);
  let hfi = 0;
  hedgeItems.forEach((h) => {
    for (let k = 0; k < 3; k++) {
      const a = rng.next() * Math.PI * 2;
      tmp.position.set(h.x + Math.cos(a) * h.s * 0.7, h.y + 0.5 + rng.next() * h.s * 0.5, h.z + Math.sin(a) * h.s * 0.7); tmp.scale.setScalar(1); tmp.rotation.set(0, 0, 0); tmp.updateMatrix();
      hedgeFl.setMatrixAt(hfi, tmp.matrix); hedgeFl.setColorAt(hfi, col.set(['#ff8fc0', '#ffd23f', '#ffffff', '#b79cff', '#ff9a6a'][hfi % 5])); hfi++;
    }
  });
  hedgeFl.userData.keep = true;
  common.add(hedgeFl);
  // lamp posts stand inside the hedge line, so nobody can walk into them
  for (const x of [20, 34, 48, 58]) { common.add(at(lampPost(), x, 0, MAP.minZ - 0.4)); }
  for (const z of [-14, -2, 10, 18]) common.add(at(lampPost(), YARD.maxX + 0.2, 0, z));

  // ---------- trees, each standing in a little tree bed that fills the collider ----------------------------------------------------
  YARD_SOLIDS.trees.forEach(([x, z, r], i) => {
    const kind = i % 4;
    const bed = group(new Mesh(cachedGeo('treebed', () => new CylinderGeometry(1, 1, 0.03, 28)), lambert('#b98c5c')), torus(1, 0.06, '#d9d2c4', { y: 0.05, rx: Math.PI / 2, outline: 0.012 }));
    bed.children[0].scale.set(r, 1, r); bed.children[0].position.y = 0.025; bed.children[0].receiveShadow = true;
    bed.children[1].scale.set(r, r, 1);
    const tree = kind === 2 ? treeCone(4.2 * (r / 1.15), ['#4cad6a', '#3f9c63'][i % 2]) : treeRound(3.2 * (r / 1.15), ['#5cc46a', '#68cf6e', '#ffb3d4', '#4fb862'][kind === 3 ? 2 : i % 2], undefined, kind === 1 ? '#ff5a5a' : null);
    bed.add(tree);
    put(bed, x, z, 0, rng.next() * 6);
  });

  // ---------- fountain plaza, school sign, benches -----------------------------------------------------------------------------------
  const fo = fountain(YARD_SOLIDS.fountain.r - 0.1);
  put(fo, YARD_SOLIDS.fountain.x, YARD_SOLIDS.fountain.z);
  const drops = fo.userData.drops;
  updaters.push((t, reduced) => {
    drops.forEach((d, i) => {
      const k = reduced ? i / drops.length : ((t * 0.8 + i / drops.length) % 1);
      const a = (i / drops.length) * Math.PI * 2;
      const rad = 0.2 + k * 0.9;
      d.position.set(Math.cos(a) * rad, 2.0 + Math.sin(k * Math.PI) * 0.55 - k * 1.3, Math.sin(a) * rad);
    });
  });

  const ss = YARD_SOLIDS.schoolSign;
  const ssx = (ss.x0 + ss.x1) / 2, ssz = (ss.z0 + ss.z1) / 2;
  const sch = group(cyl(0.08, 0.08, 2.4, PAL.woodD, { x: -1.0, y: 1.2, seg: 8, outline: 0.01 }), cyl(0.08, 0.08, 2.4, PAL.woodD, { x: 1.0, y: 1.2, seg: 8, outline: 0.01 }),
    box(2.5, 1.15, 0.14, '#ffffff', { y: 2.05, r: 0.2, outline: 0.015 }), star3d(0.22, 0.08, PAL.yellow, { x: 0, y: 2.85, outline: 0.012 }));
  const schoolSign = createSign({ label: 'Tadika AmmaraGames', color: '#ff7eb6', w: 2.3, h: 0.95, px: 512 });
  schoolSign.mesh.position.set(0, 2.05, 0.09);
  sch.add(schoolSign.mesh);
  put(sch, ssx, ssz + 0.0);

  const benchDefs = YARD_SOLIDS.benches;
  const benchPose = [{ ry: -Math.PI / 2, len: 2.7 }, { ry: 0, len: 1.9 }, { ry: 0, len: 2.8 }];
  benchDefs.forEach((b, i) => {
    const bw = benchPose[i].len;
    const bench = benchWood(bw, ['#e0b988', '#f2a7c4', '#9fd8ff'][i % 3]);
    put(bench, (b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2, 0, benchPose[i].ry);
  });

  // ---------- garden: flower beds, vegetable patch, butterflies -------------------------------------------------------------------------
  YARD_SOLIDS.gardenBeds.forEach((b, i) => {
    const w = b.x1 - b.x0, d = b.z1 - b.z0;
    const piece = i === 3 ? vegPatch(w, d) : flowerBed(w, d, [['#ff8fc0', '#ffd23f', '#b79cff'], ['#ff9a3c', '#ffffff', '#7fcbff'], ['#ff6b6b', '#ffd23f', '#ffffff']][i % 3]);
    put(piece, (b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2);
  });
  // three sorting baskets on the stone ring
  [['#ff6b6b', -0.95, -0.2], ['#ffd23f', 0.95, -0.2], ['#4a90e2', 0, 0.95]].forEach(([c, dx, dz]) => {
    const bk = group(cyl(0.38, 0.38, 0.05, c, { y: 0.04, seg: 16, outline: 0.01 }), torus(0.38, 0.05, tint(c, -0.15), { y: 0.09, rx: Math.PI / 2, outline: 0.01 }));
    put(bk, sortSpot.x + dx, sortSpot.z + dz);
  });
  // a hunting mat for the "find it" game
  const find = poiById['y-find'];
  put(rugRect(2.6, 2.2, '#ffa43c', '#fff3dc'), find.x, find.z);
  put(group(ball(0.16, '#ff5a5a', { y: 0.16, seg: 8, outline: 0.012 }), ball(0.16, '#4a90e2', { x: 0.5, y: 0.16, z: 0.3, seg: 8, outline: 0.012 }), cone(0.16, 0.3, '#ffd23f', { x: -0.5, y: 0.16, z: -0.3, seg: 6, outline: 0.012 })), find.x, find.z + 0.1, 0.02);
  const butterflies = [];
  const bColors = ['#ff8fc0', '#ffd23f', '#7fcbff', '#b79cff', '#ff9a3c'];
  for (let i = 0; i < 5; i++) {
    const b = new Group();
    const wingGeo = cachedGeo('wing', () => { const g = new PlaneGeometry(0.34, 0.28); g.translate(0.17, 0, 0); return g; });
    const wm = new MeshBasicMaterial({ color: bColors[i], side: DoubleSide });
    const wl = new Mesh(wingGeo, wm), wr = new Mesh(wingGeo, wm);
    wr.rotation.y = Math.PI;
    b.add(wl, wr, cyl(0.025, 0.025, 0.24, '#5b3f33', { rx: Math.PI / 2, seg: 5, outline: 0 }));
    live(b);
    b.userData.keep = true;
    const home = [[26, -14], [34, -17], [22, -7], [18, 0], [30, -10]][i];
    butterflies.push({ obj: b, home, ph: i * 1.7, wl, wr });
    (groups.garden || common).add(b);
  }
  updaters.push((t, reduced) => {
    butterflies.forEach((b) => {
      const k = t * 0.5 + b.ph;
      if (reduced) { b.obj.position.set(b.home[0], 1.1, b.home[1]); b.wl.rotation.z = 0.4; b.wr.rotation.z = -0.4; return; }
      b.obj.position.set(b.home[0] + Math.sin(k * 1.3) * 3.4, 1.2 + Math.sin(k * 2.1) * 0.35, b.home[1] + Math.cos(k * 0.9) * 2.4);
      b.obj.rotation.y = Math.atan2(Math.cos(k * 1.3), -Math.sin(k * 0.9)) + Math.PI / 2;
      const f = Math.sin(t * 16 + b.ph) * 0.9;
      b.wl.rotation.z = f; b.wr.rotation.z = -f;
    });
  });

  // ---------- picnic park: gazebo (Nature Station) ----------------------------------------------------------------------------------------
  const gz = poiById['y-gazebo'];
  const gaz = gazebo();
  put(gaz, gz.x, gz.z);
  const natureSign = createSign({ label: gz.label, color: '#5cc46a', w: 3.0, h: 0.8, px: 512, iconKey: 'tree', iconSvg });
  natureSign.mesh.position.set(gz.x, 2.55, gz.z + 1.88);
  (groups['yard-rest'] || common).add(natureSign.mesh);
  put(group(cyl(0.7, 0.7, 0.08, '#ffffff', { y: 0.55, seg: 16 }), cyl(0.1, 0.14, 0.5, PAL.woodD, { y: 0.28, seg: 10 }), ball(0.2, '#ff8fc0', { y: 0.82, seg: 10 }), ball(0.12, '#ffd23f', { x: 0.28, y: 0.7, z: 0.1, seg: 8 })), gz.x, gz.z + 0.0, 0.1);
  put(rugRound(1.7, '#7fcbff'), 33.5, 3.3);
  put(rugRect(2.6, 2.2, '#b79cff', '#fff3dc'), 34.4, -7.2);

  // ---------- playground ---------------------------------------------------------------------------------------------------------------------------
  const pw = PLAY.x1 - PLAY.x0, pd = PLAY.z1 - PLAY.z0;
  const surfaceBase = new Mesh(new PlaneGeometry(pw + 0.8, pd + 0.8), lambert('#f6b77a'));
  surfaceBase.rotation.x = -Math.PI / 2; surfaceBase.position.set((PLAY.x0 + PLAY.x1) / 2, 0.016, (PLAY.z0 + PLAY.z1) / 2); surfaceBase.receiveShadow = true;
  const surfaceTex = repeatClone(checkerTexture('#ffd9e6', '#cfeaff', 2));
  const surface = new Mesh(tiledPlane(pw, pd, 3), lambert('#ffffff', surfaceTex));
  surface.rotation.x = -Math.PI / 2; surface.position.set((PLAY.x0 + PLAY.x1) / 2, 0.022, (PLAY.z0 + PLAY.z1) / 2); surface.receiveShadow = true;
  (groups.playground || common).add(surfaceBase, surface);
  const S = YARD_SOLIDS;
  put(slideKid(), (S.slide.x0 + S.slide.x1) / 2, S.slide.z0 + 1.2);
  const seesaw = seesawKid();
  put(seesaw, (S.seesaw.x0 + S.seesaw.x1) / 2, (S.seesaw.z0 + S.seesaw.z1) / 2);
  const swing = swingSet();
  put(swing, (S.swing.x0 + S.swing.x1) / 2, (S.swing.z0 + S.swing.z1) / 2);
  put(climberDome(), S.climber.x, S.climber.z);
  updaters.push((t, reduced) => {
    seesaw.userData.plank.rotation.z = reduced ? 0 : Math.sin(t * 1.2) * 0.17;
    swing.userData.seats.forEach((s, i) => { s.rotation.x = reduced ? 0 : Math.sin(t * 1.6 + i * 1.1) * 0.35; });
  });
  const pg = poiById['y-playground'];
  put(rugRound(2.3, '#ff8fc0'), pg.x, pg.z);
  [[-0.8, -0.6, '#ffd23f'], [0.2, -0.8, '#7fcbff'], [0.9, 0.0, '#5cc46a'], [-0.7, 0.5, '#b79cff'], [0.1, 0.55, '#ff9a3c']].forEach(([dx, dz, c]) => {
    put(box(0.62, 0.05, 0.82, c, { y: 0.0, r: 0.05, outline: 0.012 }), pg.x + dx, pg.z + dz, 0.07, dx * 0.9);
  });
  const cb = S.chalkboard;
  const chalk = boardTexture(['1  2  3', '4  5  6'], { w: 512, h: 332, bg: '#3f6b55', size: 100 });
  put(blackboardStand(chalk, 2.6, 1.7), (cb.x0 + cb.x1) / 2, (cb.z0 + cb.z1) / 2);

  // ---------- sandpit ---------------------------------------------------------------------------------------------------------------------------------
  const sb = S.sandbox;
  put(sandboxBox(sb.x1 - sb.x0, sb.z1 - sb.z0), (sb.x0 + sb.x1) / 2, (sb.z0 + sb.z1) / 2);

  // ---------- hopscotch with numbers ----------------------------------------------------------------------------------------------------------------
  const hop = hopscotch();
  put(hop, HOP.x, HOP.z);
  const cells = [[0, 0], [0, 1], [-0.5, 2], [0.5, 2], [0, 3], [0, 4], [-0.5, 5], [0.5, 5], [0, 6]];
  const digitGeo = cachedGeo('hopdigit', () => new PlaneGeometry(0.62, 0.62));
  cells.forEach(([cx, cz], i) => {
    const c = makeCanvas(128, 128), ctx = c.getContext('2d');
    ctx.font = `700 96px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = 14; ctx.strokeStyle = '#5b3f33'; ctx.strokeText(String(i + 1), 64, 70); ctx.fillStyle = '#ffffff'; ctx.fillText(String(i + 1), 64, 70);
    const m = new Mesh(digitGeo, new MeshBasicMaterial({ map: canvasTexture(c), transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(HOP.x + cx * 1.05, 0.035, HOP.z - cz * 1.05 + 3.0); m.renderOrder = 2;
    (groups.lawn || common).add(m);
  });
  put(rugRect(2.6, 2.4, '#ff6f9f', '#fff3dc'), 19.4, 9.4);

  // ---------- floor signs naming each part of the yard -------------------------------------------------------------------------------------------------
  const floorSign = (zoneId, x, z) => {
    const zn = zoneById[zoneId];
    const sg = createSign({ label: zn.name, color: zn.color, w: 4.0, h: 1.0, px: 512, iconKey: zn.icon, iconSvg });
    sg.mesh.rotation.x = -Math.PI / 2; sg.mesh.position.set(x, 0.05, z);
    (groups[zoneId] || common).add(sg.mesh);
    return sg;
  };
  const ySigns = [floorSign('gate', 19.4, 2.1), floorSign('garden', 28.0, -9.4), floorSign('playground', 54.5, -3.4), floorSign('sandpit', 47.0, 17.2), floorSign('lawn', 19.4, 13.4), floorSign('yard-rest', 34.5, 6.6)];

  // ---------- flower patches on the grass (instanced) -------------------------------------------------------------------------------------------------
  const free = (x, z) => {
    if (x < YARD.minX + 1.0 || x > YARD.maxX - 1.4 || z < MAP.minZ + 1.4 || z > MAP.maxZ - 1.4) return false;
    for (const [x0, z0, x1, z1] of PATHS) if (x > x0 - 0.5 && x < x1 + 0.5 && z > z0 - 0.5 && z < z1 + 0.5) return false;
    if (Math.hypot(x - PLAZA.x, z - PLAZA.z) < PLAZA.r + 0.6) return false;
    for (const [tx, tz, tr] of S.trees) if (Math.hypot(x - tx, z - tz) < tr + 0.5) return false;
    for (const b of [S.slide, S.swing, S.seesaw, S.sandbox, S.schoolSign, S.chalkboard, ...S.benches, ...S.gardenBeds]) if (x > b.x0 - 0.7 && x < b.x1 + 0.7 && z > b.z0 - 0.7 && z < b.z1 + 0.7) return false;
    if (x > PLAY.x0 - 0.8 && x < PLAY.x1 + 0.8 && z > PLAY.z0 - 0.8 && z < PLAY.z1 + 0.8) return false;
    if (Math.hypot(x - S.climber.x, z - S.climber.z) < S.climber.r + 0.6) return false;
    if (Math.hypot(x - 38.5, z + 2.0) < 3.2) return false;
    if (Math.abs(x - HOP.x) < 2.4 && z > HOP.z - 4.2 && z < HOP.z + 4.2) return false;
    for (const p of POIS) if (p.x >= YARD.minX && Math.hypot(x - p.x, z - p.z) < p.radius + 1.2) return false;
    for (const [bx, bz, bw, bd] of [[33.5, 3.3, 3.4, 3.4], [34.4, -7.2, 3.0, 2.6], [19.4, 9.4, 3.0, 2.8], [20.0, -14.0, 3.0, 2.6]]) if (Math.abs(x - bx) < bw / 2 + 0.3 && Math.abs(z - bz) < bd / 2 + 0.3) return false;
    for (const [fx, fz] of [[19.4, 2.1], [28.0, -9.4], [54.5, -3.4], [47.0, 17.2], [19.4, 13.4], [34.5, 6.6]]) if (Math.abs(x - fx) < 2.4 && Math.abs(z - fz) < 0.8) return false;
    return true;
  };
  const flowerSpots = [];
  let guard = 0;
  while (flowerSpots.length < 520 && guard++ < 4000) {
    const cxp = YARD.minX + 1 + rng.next() * (YARD.maxX - YARD.minX - 3), czp = MAP.minZ + 2 + rng.next() * (MAP.maxZ - MAP.minZ - 4);
    if (!free(cxp, czp)) continue;
    const palette = [['#ff8fc0', '#ffd23f'], ['#ffffff', '#ffd23f'], ['#b79cff', '#ffffff'], ['#ff9a3c', '#ffd23f'], ['#7fcbff', '#ffffff']][Math.floor(rng.next() * 5)];
    const n = 5 + Math.floor(rng.next() * 6);
    for (let k = 0; k < n; k++) {
      const a = rng.next() * Math.PI * 2, rr = rng.next() * 1.0;
      const x = cxp + Math.cos(a) * rr, z = czp + Math.sin(a) * rr;
      if (free(x, z)) flowerSpots.push({ x, z, c: palette[k % 2], s: 0.8 + rng.next() * 0.5 });
    }
  }
  const stems = new InstancedMesh(cachedGeo('flstem', () => new CylinderGeometry(0.014, 0.014, 0.34, 4)), toon('#3fa64a'), flowerSpots.length);
  const heads = new InstancedMesh(cachedGeo('flhead', () => new SphereGeometry(0.1, 7, 5)), toon('#ffffff'), flowerSpots.length);
  flowerSpots.forEach((f, i) => {
    tmp.position.set(f.x, 0.17 * f.s, f.z); tmp.scale.set(1, f.s, 1); tmp.rotation.set(0, 0, 0); tmp.updateMatrix(); stems.setMatrixAt(i, tmp.matrix);
    tmp.position.set(f.x, 0.36 * f.s, f.z); tmp.scale.setScalar(f.s); tmp.updateMatrix(); heads.setMatrixAt(i, tmp.matrix); heads.setColorAt(i, col.set(f.c));
  });
  stems.userData.keep = true; heads.userData.keep = true;
  common.add(stems, heads);

  // ---------- far hills and clouds -----------------------------------------------------------------------------------------------------------------------------
  const hills = [[18, -48, 30, 9, '#8fd27a'], [58, -52, 36, 12, '#7cc76c'], [96, -34, 28, 10, '#9be082'], [92, 4, 22, 8, '#86cd74'], [90, 38, 26, 9, '#8fd27a'], [-24, -56, 34, 11, '#86cd74'], [-70, -40, 30, 9, '#9be082']];
  for (const [x, z, r, h, c] of hills) {
    const m = new Mesh(cachedGeo('hill', () => new SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2)), toon(c));
    m.scale.set(r, h, r * 0.8); m.position.set(x, -0.1, z); m.receiveShadow = false; common.add(m);
  }
  const clouds = [];
  const cloudMat = new MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.92, depthWrite: false });
  for (let i = 0; i < 6; i++) {
    const cl = new Group();
    [[0, 0, 1.6], [1.5, -0.2, 1.2], [-1.5, -0.15, 1.1], [0.6, 0.55, 1.1]].forEach(([x, y, r]) => { const b = new Mesh(cachedGeo('cloudb', () => new SphereGeometry(1, 12, 8)), cloudMat); b.scale.set(r, r * 0.62, r * 0.8); b.position.set(x, y, 0); cl.add(b); });
    cl.position.set(10 + i * 14, 13 + (i % 3) * 1.6, -30 - (i % 2) * 8);
    cl.userData.keep = true; cl.traverse((o) => { o.userData.keep = true; });
    common.add(cl); clouds.push(cl);
  }
  updaters.push((t, reduced) => { if (!reduced) clouds.forEach((c, i) => { c.position.x = 4 + ((i * 14 + t * 0.35) % 90); }); });

  // ---------- markers for the yard's points of interest ------------------------------------------------------------------------------------------------------
  for (const p of POIS) {
    if (p.x < YARD.minX || p.id === 'door') continue;
    put(poiMarker(p, zoneById[p.zone].color, iconSvg, updaters), p.x, p.z);
  }

  // ---------- merge what never moves, one group per area --------------------------------------------------------------------------------------------------------
  const zoneList = [];
  for (const [id, g] of Object.entries(groups)) {
    mergeStatic(g);
    if (id !== 'common') zoneList.push({ id, group: g, rect: zoneById[id].rect });
  }
  return { root, zones: zoneList, common, signs: [schoolSign, natureSign, ...ySigns], groundMeshes, updaters, update(t, reduced) { for (const u of updaters) u(t, reduced); } };
}
void BUILDING; void DOOR; void basic; void heart3d; void flat; void roundRect; void bush;
