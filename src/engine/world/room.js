// The main hall: windows, title sign, posters, bunting, cabinet, table, toys and the "go here" path.
// The floor and walls come from building.js; `applyTheme` repaints colours and posters when the world changes.
import {
  Group, Mesh, PlaneGeometry, InstancedMesh, Object3D, Color, ShapeGeometry, Shape, DoubleSide, CylinderGeometry, MeshBasicMaterial, MeshLambertMaterial
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { box, ball, cyl, cone, torus, star3d, heart3d, decal, group, at, cachedGeo, part, live, mergeStatic } from './kit.js';
import { toon, lambert, basic, wallTexture, wainscotTexture, skyTexture, starRugTexture, makeCanvas, canvasTexture, roundRect, grain, svgToImage, tint } from './paint.js';
import { ROOM, WALK, STATION_SLOTS, SPAWN, TABLE, BEANBAG, CHEST, BEACHBALL, BUILDING, DOOR, poiById, zoneById } from './layout.js';
import { createSign } from './signs.js';
import { poiMarker } from './zones.js';
import { FONT } from '../art/svg.js';
import { PAL } from './props.js';
export { ROOM, WALK, STATION_SLOTS, SPAWN };

function curtainGeometry() {
  return cachedGeo('curtain', () => {
    const g = new PlaneGeometry(1.0, 3.4, 16, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      p.setZ(i, Math.sin(x * 15) * 0.07);
      p.setX(i, x * (1 - (1.7 - y) * 0.04));
    }
    g.computeVertexNormals();
    return g;
  });
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

/**
 * @param building result of buildBuilding (gives the hall group and the themed wall materials)
 */
export function buildRoom(scene, collision, building, { iconSvg, updaters }) {
  const root = building.hall.group;
  const wallMat = building.hall.wallMat, wainMat = building.hall.wainMat;
  const themed = {};
  const hallLeft = -ROOM.maxX + 0.4, hallRight = ROOM.maxX - 0.4;

  // ---- windows with curtains (back wall) ---------------------------------------------------------------------------------
  const sky = skyTexture();
  const curtainMat = toon('#ffb3d4', { side: DoubleSide });
  for (const x of [-7, 7]) {
    const win = new Group();
    win.add(box(3.0, 3.0, 0.2, '#ffffff', { y: 0, r: 0.12, outline: 0.02, shadow: false }));
    const glass = new Mesh(new PlaneGeometry(2.55, 2.55), basic('#ffffff', { map: sky }));
    glass.position.z = 0.11;
    win.add(glass);
    win.add(box(0.12, 2.6, 0.12, '#ffffff', { z: 0.14, r: 0.04, shadow: false, outline: 0.01 }));
    win.add(box(2.6, 0.12, 0.12, '#ffffff', { z: 0.14, r: 0.04, shadow: false, outline: 0.01 }));
    win.add(box(3.4, 0.22, 0.5, '#ffffff', { y: -1.6, z: 0.18, r: 0.06, outline: 0.015 }));
    win.add(cyl(0.05, 0.05, 4.2, '#c48a5a', { y: 1.75, z: 0.35, rz: Math.PI / 2, shadow: false, outline: 0.01 }));
    win.add(ball(0.12, '#ffd65a', { x: -2.15, y: 1.75, z: 0.35, outline: 0.01 }));
    win.add(ball(0.12, '#ffd65a', { x: 2.15, y: 1.75, z: 0.35, outline: 0.01 }));
    for (const s of [-1, 1]) {
      const cur = new Mesh(curtainGeometry(), curtainMat);
      cur.position.set(s * 1.75, 0.05, 0.4);
      cur.castShadow = false;
      win.add(cur);
      win.add(torus(0.16, 0.05, '#ffd65a', { x: s * 1.75, y: -0.6, z: 0.5, outline: 0.008 }));
    }
    win.add(group(cyl(0.18, 0.14, 0.28, '#ff9a6a', { y: -1.35, x: 1.1, z: 0.25 }), ball(0.22, '#5cc46a', { y: -1.05, x: 1.1, z: 0.25 })));
    win.position.set(x, 3.3, ROOM.backZ + 0.02);
    root.add(win);
  }

  // ---- title sign on the back wall (shows the name of the current world) -------------------------------------------------------
  const titleSign = createSign({ label: 'AmmaraGames', color: '#ff7eb6', w: 6.1, h: 1.19, px: 1024 });
  titleSign.mesh.position.set(0, 4.85, ROOM.backZ + 0.28);
  root.add(box(6.4, 1.3, 0.2, '#ffffff', { y: 4.85, z: ROOM.backZ + 0.15, r: 0.3, outline: 0.02, shadow: false }), titleSign.mesh);
  root.add(at(star3d(0.38, 0.16, '#ffd65a', { outline: 0.02 }), -3.6, 4.85, ROOM.backZ + 0.25));
  root.add(at(heart3d(0.3, 0.14, '#ff7eb6', { outline: 0.02 }), 3.6, 4.85, ROOM.backZ + 0.25));
  themed.titleSign = titleSign;

  // ---- themed posters ------------------------------------------------------------------------------------------------------------
  const posterSpots = [
    { pos: [-4.15, 3.05, ROOM.backZ + 0.08], ry: 0, round: true },
    { pos: [4.15, 3.05, ROOM.backZ + 0.08], ry: 0, round: true },
    { pos: [ROOM.maxX - 0.52, 3.2, -6.2], ry: -Math.PI / 2, round: false }
  ];
  themed.posters = posterSpots.map((sp) => {
    const frame = sp.round ? cyl(0.95, 0.95, 0.12, '#ffffff', { rx: Math.PI / 2, outline: 0.02, shadow: false }) : box(2.1, 2.1, 0.12, '#ffffff', { r: 0.12, outline: 0.02, shadow: false });
    const pic = decal(null, sp.round ? 1.45 : 1.75, sp.round ? 1.45 : 1.75, { z: 0.08 });
    pic.material = new MeshBasicMaterial({ transparent: true });
    const g = group(frame, pic);
    g.position.set(...sp.pos);
    g.rotation.y = sp.ry;
    root.add(g);
    return pic;
  });

  // ---- bunting (back wall and the east wall, not across the wing) ----------------------------------------------------------------
  const flagShape = new Shape(); flagShape.moveTo(-0.28, 0); flagShape.lineTo(0.28, 0); flagShape.lineTo(0, -0.62); flagShape.closePath();
  const flagGeo = new ShapeGeometry(flagShape);
  const flagMat = toon('#ffffff', { side: DoubleSide });
  const strings = [
    { a: [-12.6, 5.75, ROOM.backZ + 0.3], b: [12.6, 5.75, ROOM.backZ + 0.3], sag: 0.9, n: 34 },
    { a: [ROOM.maxX - 0.3, 5.75, -9.5], b: [ROOM.maxX - 0.3, 5.75, -3.8], sag: 0.45, n: 10, brk: true },
    { a: [ROOM.maxX - 0.3, 5.75, 1.8], b: [ROOM.maxX - 0.3, 5.75, 11], sag: 0.6, n: 14, brk: true }
  ];
  const flagCount = strings.reduce((s, x) => s + x.n, 0);
  const flags = new InstancedMesh(flagGeo, flagMat, flagCount);
  const flagData = [];
  strings.forEach((sdef) => {
    for (let i = 0; i < sdef.n; i++) {
      const t = (i + 0.5) / sdef.n;
      const x = sdef.a[0] + (sdef.b[0] - sdef.a[0]) * t;
      const z = sdef.a[2] + (sdef.b[2] - sdef.a[2]) * t;
      const y = sdef.a[1] - Math.sin(t * Math.PI) * sdef.sag;
      const ry = sdef.a[0] === sdef.b[0] ? -Math.PI / 2 : 0;
      flagData.push({ x, y, z, ry, phase: i * 0.55 });
    }
    const len = Math.hypot(sdef.b[0] - sdef.a[0], sdef.b[2] - sdef.a[2]);
    const segs = 10;
    for (let k = 0; k < segs; k++) {
      const t0 = k / segs, t1 = (k + 1) / segs;
      const y0 = sdef.a[1] - Math.sin(t0 * Math.PI) * sdef.sag, y1 = sdef.a[1] - Math.sin(t1 * Math.PI) * sdef.sag;
      const xm = sdef.a[0] + (sdef.b[0] - sdef.a[0]) * (t0 + t1) / 2, zm = sdef.a[2] + (sdef.b[2] - sdef.a[2]) * (t0 + t1) / 2;
      const seg = new Mesh(cachedGeo('bstr', () => new CylinderGeometry(0.018, 0.018, 1, 5)), basic('#8a6a5a'));
      const dl = len / segs;
      seg.scale.y = Math.hypot(dl, y1 - y0);
      seg.position.set(xm, (y0 + y1) / 2, zm);
      const ang = Math.atan2(y1 - y0, dl);
      if (sdef.a[0] === sdef.b[0]) seg.rotation.x = Math.PI / 2 - ang; else seg.rotation.z = -(Math.PI / 2 - ang);
      root.add(seg);
    }
  });
  flags.castShadow = false; flags.userData.keep = true;
  root.add(flags);
  const tmp = new Object3D();
  const bcol = new Color();
  function setFlags(t) {
    flagData.forEach((f, i) => {
      tmp.position.set(f.x, f.y, f.z);
      tmp.rotation.set(Math.sin(t * 1.6 + f.phase) * 0.12, f.ry, 0);
      tmp.updateMatrix();
      flags.setMatrixAt(i, tmp.matrix);
    });
    flags.instanceMatrix.needsUpdate = true;
  }
  setFlags(0);

  // ---- furniture -----------------------------------------------------------------------------------------------------------------------
  const cab = group(box(6.2, 1.7, 1.15, '#fff1d6', { y: 0.85, r: 0.1 }));
  [-2.05, 0, 2.05].forEach((x) => cab.add(box(1.8, 1.2, 0.2, '#f2d9b8', { x, y: 0.85, z: 0.5, r: 0.06, outline: 0.01 })));
  cab.add(at(group(box(0.5, 0.5, 0.5, '#ff8fc0', { r: 0.06 }), box(0.45, 0.45, 0.45, '#7fcbff', { x: 0.5, r: 0.06 }), box(0.45, 0.45, 0.45, '#ffd65a', { x: 0.25, y: 0.45, r: 0.06, ry: 0.4 })), -2.4, 1.95, 0));
  cab.add(ball(0.32, '#ff6b6b', { x: -0.7, y: 2.02 }));
  cab.add(at(group(ball(0.36, '#c48a5a'), ball(0.14, '#c48a5a', { x: -0.27, y: 0.27 }), ball(0.14, '#c48a5a', { x: 0.27, y: 0.27 }), ball(0.13, '#e7c39a', { y: -0.06, z: 0.3 }), ball(0.03, '#2e1f1a', { x: -0.11, y: 0.08, z: 0.32, outline: 0 }), ball(0.03, '#2e1f1a', { x: 0.11, y: 0.08, z: 0.32, outline: 0 })), 0.55, 2.05, 0.05));
  cab.add(at(group(cyl(0.3, 0.32, 0.1, '#c48a5a'), torus(0.25, 0.09, '#ff6b6b', { y: 0.12, rx: Math.PI / 2 }), torus(0.2, 0.09, '#ffd65a', { y: 0.28, rx: Math.PI / 2 }), torus(0.15, 0.08, '#5cc46a', { y: 0.42, rx: Math.PI / 2 }), ball(0.11, '#4a90e2', { y: 0.58 })), 1.9, 1.75, 0));
  cab.add(ball(0.22, '#4cc46a', { x: -2.05, y: 0.75, z: 0.35, outline: 0.012 }));
  cab.add(box(0.4, 0.5, 0.3, '#b79cff', { x: 0.1, y: 0.6, z: 0.3, r: 0.04, outline: 0.012 }));
  cab.add(box(0.3, 0.55, 0.3, '#ff9a6a', { x: -0.3, y: 0.62, z: 0.3, r: 0.04, outline: 0.012 }));
  cab.add(cyl(0.2, 0.2, 0.4, '#ffd65a', { x: 2.05, y: 0.55, z: 0.3, outline: 0.012 }));
  cab.position.set(0, 0, ROOM.backZ + 0.65);
  root.add(cab);

  // round table and chairs, north-east corner
  const table = group(cyl(0.95, 0.95, 0.12, '#ffd65a', { y: 0.8 }), cyl(0.12, 0.2, 0.75, '#c48a5a', { y: 0.38 }), cyl(0.45, 0.5, 0.06, '#c48a5a', { y: 0.03 }),
    cyl(0.14, 0.11, 0.28, '#7fcbff', { y: 1.0, x: 0.2 }), ball(0.11, '#ff8fc0', { y: 1.22, x: 0.2 }), ball(0.08, '#ffd23f', { y: 1.26, x: 0.33, z: 0.05 }),
    box(0.5, 0.06, 0.36, '#ffffff', { x: -0.3, y: 0.89, z: 0.2, ry: 0.4, r: 0.02 }));
  table.position.set(TABLE.x, 0, TABLE.z);
  root.add(table);
  for (const dz of [-1.55, 1.55]) {
    const ch = group(box(0.7, 0.12, 0.7, '#ff8fc0', { y: 0.46, r: 0.05 }), box(0.7, 0.7, 0.12, '#ff8fc0', { y: 0.85, z: dz > 0 ? 0.3 : -0.3, r: 0.05 }));
    [[-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28]].forEach(([x, z]) => ch.add(cyl(0.05, 0.05, 0.42, '#c48a5a', { x, y: 0.2, z, outline: 0.008 })));
    ch.position.set(TABLE.x, 0, TABLE.z + dz);
    root.add(ch);
  }
  root.add(at(group(ball(1.0, '#ff8fc0', { sy: 0.55 }), ball(0.55, '#ff8fc0', { y: 0.35, z: -0.4, sy: 0.6 })), BEANBAG.x, 0.5, BEANBAG.z));
  const chest = group(box(1.8, 0.9, 1.1, '#7fcbff', { y: 0.45, r: 0.12 }), box(1.85, 0.2, 1.15, '#4a90e2', { y: 0.95, r: 0.08 }), box(0.3, 0.3, 0.06, '#ffd65a', { y: 0.65, z: 0.57, r: 0.04 }),
    star3d(0.25, 0.08, '#ffd65a', { y: 0.45, z: 0.58, x: -0.5 }), heart3d(0.2, 0.08, '#ff8fc0', { y: 0.45, z: 0.58, x: 0.55 }));
  chest.position.set(CHEST.x, 0, CHEST.z);
  root.add(chest);
  const beach = ball(0.6, '#ffffff', { seg: 28 });
  beach.add(part(cachedGeo('bbstripe', () => new CylinderGeometry(0.605, 0.605, 0.4, 28, 1, true)), '#ff6b6b', { outline: 0 }));
  beach.add(part(cachedGeo('bbstripe2', () => new CylinderGeometry(0.605, 0.605, 0.4, 28, 1, true)), '#4a90e2', { rz: Math.PI / 2, outline: 0 }));
  beach.position.set(BEACHBALL.x, 0.6, BEACHBALL.z);
  root.add(live(beach));
  for (const x of [12.0, -12.0]) {
    const plant = group(cyl(0.45, 0.35, 0.8, '#ff9a6a', { y: 0.4 }), torus(0.44, 0.06, '#ffb38a', { y: 0.8, rx: Math.PI / 2, outline: 0.01 }));
    [[0, 1.4, 0, 0.5], [-0.35, 1.25, 0.1, 0.38], [0.35, 1.3, -0.1, 0.4], [0.05, 1.8, 0.05, 0.36]].forEach(([px, py, pz, r]) => plant.add(ball(r, '#4cbf5b', { x: px, y: py, z: pz })));
    plant.position.set(x, 0, ROOM.backZ + 0.8);
    root.add(plant);
  }
  // foam blocks along the east side of the hall, leaving the doorway free
  const foamCols = ['#ff8fc0', '#ffd65a', '#7fcbff', '#6fdcb4', '#b79cff', '#ffa86b'];
  const foamGeo = cachedGeo('foam', () => new RoundedBoxGeometry(1.6, 0.6, 0.6, 2, 0.12));
  const foamSpots = [];
  for (let z = -6.5; z <= 7.6; z += 1.71) { if (z > -4.0 && z < 1.9) continue; foamSpots.push([ROOM.maxX - 0.35, 0.3, z, Math.PI / 2]); }
  const foam = new InstancedMesh(foamGeo, toon('#ffffff'), foamSpots.length);
  foamSpots.forEach(([x, y, z, ry], i) => { tmp.position.set(x, y, z); tmp.rotation.set(0, ry, 0); tmp.scale.set(1, 1, 1); tmp.updateMatrix(); foam.setMatrixAt(i, tmp.matrix); foam.setColorAt(i, bcol.set(foamCols[i % foamCols.length])); });
  foam.castShadow = true; foam.receiveShadow = true; foam.userData.keep = true;
  root.add(foam);

  // star rug in the middle
  const starRug = new Mesh(new PlaneGeometry(5.6, 5.6), new MeshLambertMaterial({ transparent: true, depthWrite: false }));
  starRug.rotation.x = -Math.PI / 2; starRug.position.set(SPAWN.x, 0.012, SPAWN.z - 0.2); starRug.receiveShadow = true;
  root.add(starRug);
  themed.starRug = starRug;

  // X and O floor mat
  const xo = new Mesh(new PlaneGeometry(2.7, 2.7), new MeshBasicMaterial({ map: xoMatTexture(), transparent: true }));
  xo.rotation.x = -Math.PI / 2; xo.position.set(-1.2, 0.02, 7.2);
  root.add(xo);
  xo.userData.keep = true;

  // dotted path between stations
  const pathPts = [];
  const seq = [SPAWN, ...STATION_SLOTS];
  const segOf = [];
  for (let s = 0; s < seq.length - 1; s++) {
    const a = seq[s], b = seq[s + 1];
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    const n = Math.floor(len / 0.75);
    for (let k = 2; k < n - 2; k++) { const t = k / n; pathPts.push([a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t]); segOf.push(s); }
  }
  const dots = new InstancedMesh(cachedGeo('dot', () => new CylinderGeometry(0.16, 0.16, 0.02, 14)), toon('#ffffff'), pathPts.length);
  pathPts.forEach(([x, z], i) => { tmp.position.set(x, 0.015, z); tmp.rotation.set(0, 0, 0); tmp.scale.set(1, 1, 1); tmp.updateMatrix(); dots.setMatrixAt(i, tmp.matrix); dots.setColorAt(i, bcol.set('#fff3dc')); });
  dots.receiveShadow = true; dots.userData.keep = true;
  root.add(dots);
  function highlightPath(activeIndex) {
    for (let i = 0; i < segOf.length; i++) dots.setColorAt(i, bcol.set(segOf[i] === activeIndex ? '#ffd23f' : '#fff3dc'));
    dots.instanceColor.needsUpdate = true;
  }

  // markers for the hall's points of interest (X and O mat, front door)
  for (const id of ['g-xo', 'door']) root.add(poiMarker(poiById[id], zoneById[poiById[id].zone].color, iconSvg, updaters));

  [titleSign.mesh, starRug, ...themed.posters].forEach((m) => { m.userData.keep = true; });
  mergeStatic(root);

  // ---- theme ----------------------------------------------------------------------------------------------------------------------------
  let posterGen = 0;
  async function applyTheme(world, title, svgOf) {
    const gen = ++posterGen;
    const wt = wallTexture(world.wall, world.color, 'wall-' + world.id); wt.repeat.set(1, 1);
    wallMat.map = wt; wallMat.needsUpdate = true;
    const wn = wainscotTexture(world.wainscot, 'wain-' + world.id); wn.repeat.set(1, 1);
    wainMat.map = wn; wainMat.needsUpdate = true;
    curtainMat.color.set(tint(world.color, 0.25));
    for (let i = 0; i < flagCount; i++) flags.setColorAt(i, bcol.set(world.bunting[i % world.bunting.length]));
    flags.instanceColor.needsUpdate = true;
    titleSign.setLabel(title, world.color);
    const oldRug = starRug.material.map;
    starRug.material.map = starRugTexture(world.rug, 'rug-' + world.id);
    starRug.material.needsUpdate = true;
    if (oldRug) oldRug.dispose();
    for (let i = 0; i < themed.posters.length; i++) {
      const key = world.posters[i % Math.max(1, world.posters.length)];
      if (!key) continue;
      try {
        const img = await svgToImage(svgOf(key));
        if (gen !== posterGen) return;
        const S = 256, c = makeCanvas(S, S), ctx = c.getContext('2d');
        ctx.fillStyle = tint(world.wall, 0.04); ctx.fillRect(0, 0, S, S);
        ctx.drawImage(img, 18, 18, S - 36, S - 36);
        const pic = themed.posters[i];
        if (pic.material.map) pic.material.map.dispose();
        pic.material.map = canvasTexture(c);
        pic.material.needsUpdate = true;
      } catch (e) { /* a missing poster is only decoration */ }
    }
  }

  return {
    root,
    highlightPath,
    applyTheme,
    titleSign,
    update(t, reducedMotion) {
      if (!reducedMotion) setFlags(t);
      sky.offset.x = (t * 0.004) % 1;
      beach.rotation.y = Math.sin(t * 0.3) * 0.2;
    }
  };
}
void DOOR; void BUILDING; void lambert; void PAL; void cone; void grain; void roundRect; void FONT; void WALK;
