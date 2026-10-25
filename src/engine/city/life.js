// Everything that moves in the town: traffic cars (keep left, turn at crossings, stop for children), school children
// walking on the pavements (they stop and wave when the child comes close), buses on three routes, fast cars on the
// highway, and two trains going round the elevated loop.
import { InstancedMesh, Object3D, Color, Matrix4, Quaternion, Vector3, SphereGeometry, CapsuleGeometry, ConeGeometry, BoxGeometry, Group, Mesh } from 'three';
import { toon, toonVertexMaterial, outlineMaterial } from '../world/paint.js';
import { createRng } from '../core/rng.js';
import { XS, ZS, CITY, BEACH, neighbours, nearestNode, lanePoint, BUS_ROUTES, routePath, routeAt, blockIndexAt, blockTypeAt, curbOf, HIGHWAY, RAIL, railPath, railAt } from './plan.js';
import { trafficCarGeometries, PERSON_PARTS, KID_LOOKS, bus as busModel, spinWheels, trainCarGeometry, TRAIN_CAR } from './models.js';

const rnd = createRng('town-life');
const smooth = (t) => t * t * (3 - 2 * t);
const angleTo = (a, b) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };

// ------------------------------------------------------------------------------------------------ traffic
export function createTraffic(scene, N = 26) {
  const { body, details } = trafficCarGeometries();
  const vc = toonVertexMaterial();
  const bodyMesh = new InstancedMesh(body, vc, N), detMesh = new InstancedMesh(details, vc, N), outline = new InstancedMesh(body, outlineMaterial(0.04), N);
  [bodyMesh, detMesh, outline].forEach((m) => { m.frustumCulled = false; scene.add(m); });
  bodyMesh.castShadow = true;
  const colors = ['#ff6b6b', '#4a90e2', '#ffd23f', '#5cc46a', '#ff8fc0', '#9b6bff', '#ff9a3c', '#3fc8d8', '#ffffff'];
  const cc = new Color();
  const cars = Array.from({ length: N }, (_, k) => { bodyMesh.setColorAt(k, cc.set(colors[k % colors.length])); return { active: false, x: 0, z: 0, yaw: 0, speed: 0 }; });
  const d = new Object3D();
  const hide = (k) => { d.position.set(0, -50, 0); d.scale.setScalar(0.001); d.updateMatrix(); bodyMesh.setMatrixAt(k, d.matrix); detMesh.setMatrixAt(k, d.matrix); outline.setMatrixAt(k, d.matrix); };
  cars.forEach((_, k) => hide(k));

  function spawn(c, px, pz) {
    for (let tries = 0; tries < 12; tries++) {
      const n = nearestNode(px + (rnd.next() - 0.5) * 420, pz + (rnd.next() - 0.5) * 420);
      if (Math.hypot(n.x - px, n.z - pz) < 70) continue;
      const nb = neighbours(n.x, n.z);
      if (!nb.length) continue;
      const to = nb[rnd.int(nb.length)];
      if (to.z > BEACH.z0 - 20 && n.z > BEACH.z0 - 20) continue;
      Object.assign(c, { active: true, from: n, to, s: rnd.next() * 100, speed: 6, blend: null });
      c.len = Math.hypot(to.x - n.x, to.z - n.z);
      return true;
    }
    return false;
  }
  function nextSegment(c) {
    const nb = neighbours(c.to.x, c.to.z).filter((q) => !(q.x === c.from.x && q.z === c.from.z));
    const choice = nb.length ? nb[rnd.int(nb.length)] : c.from;
    const end = lanePoint(c.from, c.to, c.len);
    c.s -= c.len; c.from = c.to; c.to = choice; c.len = Math.hypot(c.to.x - c.from.x, c.to.z - c.from.z);
    c.blend = { x: end.x, z: end.z };
  }
  return {
    cars,
    /** obstacles: [{x, z, r}] the cars must not drive into (the child, the child's car, buses) */
    update(dt, px, pz, obstacles) {
      cars.forEach((c, k) => {
        if (!c.active || Math.hypot(c.x - px, c.z - pz) > 300) { if (!spawn(c, px, pz)) { hide(k); return; } }
        const lp = lanePoint(c.from, c.to, Math.min(c.s, c.len));
        const fx = Math.sin(lp.yaw), fz = Math.cos(lp.yaw);
        // stop for anything in front (children first!) and for the car ahead
        let blocked = false;
        for (const o of obstacles) {
          const dx = o.x - c.x, dz = o.z - c.z, along = dx * fx + dz * fz, side = Math.abs(dx * fz - dz * fx);
          if (along > 0 && along < 9 + o.r && side < 1.9 + o.r) { blocked = true; break; }
        }
        if (!blocked) for (const o2 of cars) {
          if (o2 === c || !o2.active) continue;
          const dx = o2.x - c.x, dz = o2.z - c.z, along = dx * fx + dz * fz, side = Math.abs(dx * fz - dz * fx);
          if (along > 0 && along < 7 && side < 1.6) { blocked = true; break; }
        }
        const target = blocked ? 0 : (c.len - c.s < 14 ? 5 : 8.5);
        c.speed += (target - c.speed) * Math.min(1, dt * (blocked ? 6 : 1.5));
        c.s += c.speed * dt;
        if (c.s >= c.len) nextSegment(c);
        const p = lanePoint(c.from, c.to, c.s);
        let x = p.x, z = p.z;
        if (c.blend && c.s < 9) { const t = smooth(Math.max(0, c.s) / 9); x = c.blend.x + (p.x - c.blend.x) * t; z = c.blend.z + (p.z - c.blend.z) * t; } else c.blend = null;
        c.yaw += angleTo(c.yaw, p.yaw) * Math.min(1, dt * 6);
        c.x = x; c.z = z;
        d.position.set(x, 0, z); d.rotation.set(0, c.yaw, 0); d.scale.setScalar(1); d.updateMatrix();
        bodyMesh.setMatrixAt(k, d.matrix); detMesh.setMatrixAt(k, d.matrix); outline.setMatrixAt(k, d.matrix);
      });
      bodyMesh.instanceMatrix.needsUpdate = detMesh.instanceMatrix.needsUpdate = outline.instanceMatrix.needsUpdate = true;
      if (bodyMesh.instanceColor) bodyMesh.instanceColor.needsUpdate = false;
    },
    get active() { return cars.filter((c) => c.active).length; },
    near(x, z, r) { return cars.filter((c) => c.active && Math.hypot(c.x - x, c.z - z) < r); }
  };
}

// ------------------------------------------------------------------------------------------------ children on the pavements
export function createPeople(scene, N = 46) {
  const geos = {
    ball: (s) => new SphereGeometry(s[0], 12, 9),
    capsule: (s) => new CapsuleGeometry(s[0], s[1], 4, 8),
    cone: (s) => new ConeGeometry(s[0], s[1], 10),
    box: (s) => new BoxGeometry(s[0], s[1], s[2])
  };
  const parts = PERSON_PARTS.map((pt) => {
    const g = geos[pt.kind](pt.size);
    if (pt.swing) g.translate(0, -(pt.size[1] / 2 + pt.size[0]) + 0.05, 0);            // limbs swing from the top
    const mesh = new InstancedMesh(g, toon('#ffffff'), N);
    mesh.frustumCulled = false; mesh.castShadow = pt.name === 'torso' || pt.name === 'lower';
    scene.add(mesh);
    let ol = null;
    if (['head', 'torso', 'lower', 'hair'].includes(pt.name)) { ol = new InstancedMesh(g, outlineMaterial(0.02), N); ol.frustumCulled = false; scene.add(ol); }
    const pivot = pt.swing ? [pt.pos[0], pt.pos[1] + pt.size[1] / 2 + pt.size[0] - 0.05, pt.pos[2]] : pt.pos;
    return { pt, mesh, ol, pivot };
  });
  const cc = new Color();
  const kids = Array.from({ length: N }, (_, k) => {
    const r = createRng('kid' + k);
    const look = { skin: KID_LOOKS.skin[r.int(5)], hair: r.next() < 0.3 ? (r.next() < 0.6 ? '#ffffff' : '#2f4a86') : KID_LOOKS.hair[r.int(4)], shirt: KID_LOOKS.shirt[r.int(5)], lower: KID_LOOKS.lower[r.int(5)], bag: KID_LOOKS.bag[r.int(6)] };
    parts.forEach((p) => p.mesh.setColorAt(k, cc.set(look[p.pt.color])));
    return { active: false, x: 0, z: 0, yaw: 0, speed: 1.2, phase: r.next() * 6, pause: 0, wave: 0, look };
  });
  const M = new Matrix4(), L = new Matrix4(), Q = new Quaternion(), E = new Vector3(), S = new Vector3(1, 1, 1), up = new Vector3(0, 1, 0), xa = new Vector3(1, 0, 0);
  const hideAll = (k) => { M.makeScale(0.001, 0.001, 0.001).setPosition(0, -50, 0); parts.forEach((p) => { p.mesh.setMatrixAt(k, M); if (p.ol) p.ol.setMatrixAt(k, M); }); };
  kids.forEach((_, k) => hideAll(k));
  function spawn(kd, px, pz) {
    for (let tries = 0; tries < 10; tries++) {
      const b = blockIndexAt(px + (rnd.next() - 0.5) * 260, pz + (rnd.next() - 0.5) * 260);
      if (!b) continue;
      const t = blockTypeAt(b.i, b.j);
      if (t === 'forest') continue;
      const x0 = XS[b.i] + curbOf('z', XS[b.i]) - 1.5, z0 = ZS[b.j] + curbOf('x', ZS[b.j]) - 1.5, x1 = XS[b.i + 1] - curbOf('z', XS[b.i + 1]) + 1.5, z1 = ZS[b.j + 1] - curbOf('x', ZS[b.j + 1]) + 1.5;
      const per = 2 * (x1 - x0) + 2 * (z1 - z0);
      const u = rnd.next() * per;
      Object.assign(kd, { active: true, ring: { x0, z0, x1, z1, per }, u, dir: rnd.next() < 0.5 ? 1 : -1, speed: 1.0 + rnd.next() * 0.7, pause: 0 });
      const p = ringPoint(kd.ring, u);
      if (Math.hypot(p.x - px, p.z - pz) < 25) continue;
      kd.x = p.x; kd.z = p.z;
      return true;
    }
    return false;
  }
  function ringPoint(r, u) {
    const w = r.x1 - r.x0, h = r.z1 - r.z0;
    u = ((u % r.per) + r.per) % r.per;
    if (u < w) return { x: r.x0 + u, z: r.z0 };
    if (u < w + h) return { x: r.x1, z: r.z0 + (u - w) };
    if (u < 2 * w + h) return { x: r.x1 - (u - w - h), z: r.z1 };
    return { x: r.x0, z: r.z1 - (u - 2 * w - h) };
  }
  return {
    kids,
    update(dt, t, px, pz, reduced, playerVisible = true) {
      kids.forEach((kd, k) => {
        if (!kd.active || Math.hypot(kd.x - px, kd.z - pz) > 170) { if (!spawn(kd, px, pz)) { hideAll(k); return; } }
        const dp = Math.hypot(px - kd.x, pz - kd.z);
        let moving = false;
        if (playerVisible && dp < 3.2) { kd.wave = Math.min(1, kd.wave + dt * 3); kd.yaw += angleTo(kd.yaw, Math.atan2(px - kd.x, pz - kd.z)) * Math.min(1, dt * 6); }
        else {
          kd.wave = Math.max(0, kd.wave - dt * 3);
          if (kd.pause > 0) kd.pause -= dt;
          else {
            const old = ringPoint(kd.ring, kd.u);
            kd.u += kd.dir * kd.speed * dt;
            const p = ringPoint(kd.ring, kd.u);
            kd.x = p.x; kd.z = p.z; moving = true;
            kd.yaw += angleTo(kd.yaw, Math.atan2(p.x - old.x, p.z - old.z)) * Math.min(1, dt * 8);
            if (rnd.next() < dt * 0.05) kd.pause = 1.5 + rnd.next() * 2.5;
          }
        }
        const swing = moving && !reduced ? Math.sin(t * 8 + kd.phase) * 0.6 : 0;
        const bob = moving && !reduced ? Math.abs(Math.sin(t * 8 + kd.phase)) * 0.04 : 0;
        Q.setFromAxisAngle(up, kd.yaw); E.set(kd.x, bob, kd.z);
        M.compose(E, Q, S);
        parts.forEach((p) => {
          const pt = p.pt;
          let rot = 0;
          if (pt.swing) rot = pt.arm ? swing * pt.swing * 0.8 : swing * pt.swing;
          if (pt.name === 'armR' && kd.wave > 0) rot = -2.6 * kd.wave + Math.sin(t * 10) * 0.3 * kd.wave;
          L.makeRotationAxis(xa, rot);
          if (pt.scale) L.scale(new Vector3(pt.scale[0], pt.scale[1], pt.scale[2]));
          L.setPosition(p.pivot[0], p.pivot[1], p.pivot[2]);
          const W = new Matrix4().multiplyMatrices(M, L);
          p.mesh.setMatrixAt(k, W); if (p.ol) p.ol.setMatrixAt(k, W);
        });
      });
      parts.forEach((p) => { p.mesh.instanceMatrix.needsUpdate = true; if (p.ol) p.ol.instanceMatrix.needsUpdate = true; });
    },
    get active() { return kids.filter((k) => k.active).length; },
    /** a child walking close to (x, z) */
    near(x, z, r) { let best = null, bd = r; kids.forEach((kd, i) => { if (!kd.active) return; const dd = Math.hypot(kd.x - x, kd.z - z); if (dd < bd) { bd = dd; best = i; } }); return best; }
  };
}

// ------------------------------------------------------------------------------------------------ buses
export function createBuses(scene) {
  const routes = Object.fromEntries(BUS_ROUTES.map((r) => [r.id, routePath(r)]));
  const make = (rid, s, color) => {
    const m = busModel(color);
    m.traverse((o) => { if (o.isMesh && !o.userData.isOutline) o.castShadow = true; });
    scene.add(m);
    return { rid, rp: routes[rid], s, speed: 0, dwell: 0, model: m, yaw: 0, x: 0, z: 0, lastStop: null, player: false };
  };
  const buses = [make('A', 0, '#ffb43c'), make('A', routes.A.total / 2, '#ff8fc0'), make('B', 300, '#4fb8e8'), make('C', 200, '#5cc46a')];
  let mine = null;                         // the bus called by the child
  function place(b, dt) {
    const p = routeAt(b.rp, b.s);
    const ahead = routeAt(b.rp, b.s + 4);
    const yaw = Math.atan2(ahead.x - p.x, ahead.z - p.z);
    b.yaw += angleTo(b.yaw, yaw) * Math.min(1, dt * 5);
    b.x = p.x; b.z = p.z;
    b.model.position.set(p.x, 0, p.z); b.model.rotation.y = b.yaw;
    spinWheels(b.model, b.s);
  }
  function step(b, dt, obstacles) {
    if (b.dwell > 0) { b.dwell -= dt; b.speed = 0; place(b, dt); return; }
    // the next stop on this route
    const stops = b.rp.stops;
    let next = null, dist = Infinity;
    for (const st of stops) { let ds = st.s - b.s; if (ds < 0) ds += b.rp.total; if (ds < dist && st !== b.lastStop) { dist = ds; next = st; } }
    let target = 10;
    if (next && dist < 30) target = Math.max(1.5, dist * 0.35);
    // children and the child's car in front stop the bus too
    const fx = Math.sin(b.yaw), fz = Math.cos(b.yaw);
    for (const o of obstacles) { const dx = o.x - b.x, dz = o.z - b.z, along = dx * fx + dz * fz, side = Math.abs(dx * fz - dz * fx); if (along > 0 && along < 11 + o.r && side < 2.2 + o.r) { target = 0; break; } }
    b.speed += (target - b.speed) * Math.min(1, dt * 1.6);
    b.s = (b.s + b.speed * dt) % b.rp.total;
    if (next && dist < 0.6) { b.dwell = b.player ? 5 : 3; b.lastStop = next; b.atStop = next; } else if (dist > 2) b.atStop = null;
    place(b, dt);
  }
  return {
    buses, routes,
    get mine() { return mine; },
    /** Calls a bus to the stop (it appears down the road and drives in). */
    call(stopId) {
      for (const rp of Object.values(routes)) {
        const st = rp.stops.find((x) => x.id === stopId);
        if (!st) continue;
        if (!mine) { mine = make(rp.route.id, 0, '#ffd23f'); mine.player = true; }
        mine.rid = rp.route.id; mine.rp = rp; mine.s = (st.s - 70 + rp.total) % rp.total; mine.dwell = 0; mine.lastStop = null; mine.atStop = null; mine.speed = 8; mine.wanted = st;
        mine.model.visible = true;
        place(mine, 1);
        return st;
      }
      return null;
    },
    dismiss() { if (mine) { mine.model.visible = false; mine.wanted = null; } },
    update(dt, obstacles, px, pz) {
      for (const b of buses) { if (Math.hypot(b.x - px, b.z - pz) > 600 && b.dwell <= 0) { b.s = (b.s + 10 * dt) % b.rp.total; const p = routeAt(b.rp, b.s); b.x = p.x; b.z = p.z; b.model.visible = false; continue; } b.model.visible = true; step(b, dt, obstacles); }
      if (mine && mine.model.visible) step(mine, dt, mine.riding ? [] : obstacles);
    }
  };
}
void CITY;

// ------------------------------------------------------------------------------------------------ highway traffic
// Fast cars on the highway's two lanes each way (keep left: the fast lane is next to the middle). Only the stretch
// near the child is simulated; cars that leave it come back in at the other end, far away in the haze.
export function createHighway(scene, N = 24) {
  const { body, details } = trafficCarGeometries();
  const vc = toonVertexMaterial();
  const bodyMesh = new InstancedMesh(body, vc, N), detMesh = new InstancedMesh(details, vc, N), outline = new InstancedMesh(body, outlineMaterial(0.04), N);
  [bodyMesh, detMesh, outline].forEach((m) => { m.frustumCulled = false; scene.add(m); });
  bodyMesh.castShadow = true;
  const colors = ['#ffffff', '#4a90e2', '#ff6b6b', '#3d3d4a', '#ffd23f', '#5cc46a', '#c9c9d6', '#9b6bff'];
  const cc = new Color(), d = new Object3D();
  const cars = Array.from({ length: N }, (_, k) => {
    bodyMesh.setColorAt(k, cc.set(colors[k % colors.length]));
    const lane = k % 3 === 0 ? 'slow' : 'fast';
    return { active: false, dir: k % 2 ? 1 : -1, lane, want: lane === 'fast' ? 15 + (k % 4) : 11 + (k % 3), x: 0, z: 0, speed: 0 };
  });
  const flush = () => { bodyMesh.instanceMatrix.needsUpdate = detMesh.instanceMatrix.needsUpdate = outline.instanceMatrix.needsUpdate = true; };
  const hide = (k) => { d.position.set(0, -50, 0); d.scale.setScalar(0.001); d.rotation.set(0, 0, 0); d.updateMatrix(); bodyMesh.setMatrixAt(k, d.matrix); detMesh.setMatrixAt(k, d.matrix); outline.setMatrixAt(k, d.matrix); };
  cars.forEach((_, k) => hide(k));
  let shown = false;
  return {
    cars,
    /** obstacles: the child / the child's ride; others: town cars (they cross the highway at the junctions) */
    update(dt, px, pz, obstacles, others = []) {
      if (Math.abs(pz - HIGHWAY.z) > 650) {
        if (shown) { cars.forEach((c, k) => { c.active = false; hide(k); }); shown = false; flush(); }
        return;
      }
      shown = true;
      const lo = Math.max(-2560, px - 540), hi = Math.min(2560, px + 540), W = hi - lo;
      cars.forEach((c, k) => {
        if (!c.active) {
          c.active = true; c.speed = c.want;
          for (let t = 0; t < 8; t++) { c.x = lo + rnd.next() * W; if (Math.abs(c.x - px) > 70) break; }
        }
        if (c.x > hi || c.x < lo) c.x = lo + ((((c.x - lo) % W) + W) % W);
        c.z = HIGHWAY.z - c.dir * HIGHWAY[c.lane];
        let target = c.want;
        for (const o of obstacles) { const along = (o.x - c.x) * c.dir; if (along > 0 && along < 14 + o.r && Math.abs(o.z - c.z) < 1.6 + o.r) { target = 0; break; } }
        for (const o of cars) {
          if (o === c || !o.active || o.dir !== c.dir || o.lane !== c.lane) continue;
          const along = (o.x - c.x) * c.dir;
          if (along > 0 && along < 18) target = Math.min(target, along < 9 ? 0 : o.speed);
        }
        for (const o of others) { const along = (o.x - c.x) * c.dir; if (along > 0 && along < 10 && Math.abs(o.z - c.z) < 1.6) { target = 0; break; } }
        c.speed += (target - c.speed) * Math.min(1, dt * (target < c.speed ? 4 : 0.8));
        c.x += c.dir * c.speed * dt;
        d.position.set(c.x, 0, c.z); d.rotation.set(0, c.dir > 0 ? Math.PI / 2 : -Math.PI / 2, 0); d.scale.setScalar(1); d.updateMatrix();
        bodyMesh.setMatrixAt(k, d.matrix); detMesh.setMatrixAt(k, d.matrix); outline.setMatrixAt(k, d.matrix);
      });
      flush();
    },
    get active() { return cars.filter((c) => c.active).length; },
    near(x, z, r) { return cars.filter((c) => c.active && Math.hypot(c.x - x, c.z - z) < r); }
  };
}

// ------------------------------------------------------------------------------------------------ the trains
// Two three-car trains go round the elevated loop and stop at every station. A child waiting at a station is never
// kept long: if both trains are far away, the one out of sight is brought round to just before the station.
export function createTrains(scene) {
  const rp = railPath();
  const vc = toonVertexMaterial(), ol = outlineMaterial(0.04);
  const DWELL = 7, TOP = 16, BRAKE = 1.2;
  const make = (s, main, stripe) => {
    const cars = [1, 0, -1].map((nose) => {
      const geo = trainCarGeometry(main, stripe, nose);
      const g = new Group(); const m = new Mesh(geo, vc); m.castShadow = true; const o = new Mesh(geo, ol); o.userData.isOutline = true;
      g.add(m, o); scene.add(g); return g;
    });
    return { s, speed: 0, dwell: 0, cars, lastStop: null, atStop: null, riding: false, x: 0, z: 0, yaw: 0 };
  };
  const trains = [make(0, '#ffffff', '#ff8fc0'), make(rp.total / 2, '#ffffff', '#4fb8e8')];
  const gapAlong = (a, b) => (((b - a) % rp.total) + rp.total) % rp.total;          // metres from a forwards to b
  function place(t) {
    t.cars.forEach((g, k) => { const p = railAt(rp, t.s + (1 - k) * TRAIN_CAR.spacing); g.position.set(p.x, RAIL.y, p.z); g.rotation.y = p.yaw; });
    const m = railAt(rp, t.s); t.x = m.x; t.z = m.z; t.yaw = m.yaw;
  }
  function nextStop(t) {
    let best = null, bd = Infinity;
    for (const st of rp.stations) { if (st === t.lastStop) continue; const d = gapAlong(t.s, st.s); if (d < bd) { bd = d; best = st; } }
    return { st: best, d: bd };
  }
  function step(t, dt) {
    if (t.dwell > 0) { t.dwell -= dt; t.speed = 0; return; }
    const { st, d } = nextStop(t);
    let target = Math.min(TOP, Math.sqrt(2 * BRAKE * Math.max(0, d)) + 0.6);
    for (const o of trains) { if (o === t) continue; const g = gapAlong(t.s, o.s); if (g < 120) target = Math.min(target, Math.max(0, (g - 70) * 0.35)); }
    t.speed = target < t.speed ? Math.max(target, t.speed - 3 * dt) : Math.min(target, t.speed + 1.1 * dt);
    if (st && d <= Math.max(0.3, t.speed * dt)) { t.s = st.s; t.speed = 0; t.dwell = DWELL; t.lastStop = st; t.atStop = st; return; }
    t.s = (t.s + t.speed * dt) % rp.total;
    if (t.atStop && gapAlong(t.atStop.s, t.s) > 2) t.atStop = null;
  }
  function eta(t, st) {
    if (t.dwell > 0 && t.atStop === st) return 0;
    const d = gapAlong(t.s, st.s);
    const between = rp.stations.filter((q) => q !== st && gapAlong(t.s, q.s) > 0.5 && gapAlong(t.s, q.s) < d).length;
    return d / 13 + between * DWELL + Math.max(0, t.dwell);
  }
  trains.forEach(place);
  return {
    trains, rp,
    update(dt) { for (const t of trains) { step(t, dt); place(t); } },
    /** A child is waiting at station `id` (standing at px, pz): make sure a train comes soon. */
    call(id, px, pz) {
      const st = rp.stations.find((q) => q.id === id);
      if (!st) return null;
      if (Math.min(...trains.map((t) => eta(t, st))) <= 35) return st;
      const far = trains.filter((t) => !t.riding && Math.hypot(t.x - px, t.z - pz) > 380).sort((a, b) => eta(b, st) - eta(a, st))[0];
      if (!far) return st;
      const other = trains.find((t) => t !== far);
      for (let back = 260; back < rp.total * 0.45; back += 20) {
        const s = (st.s - back + rp.total) % rp.total, q = railAt(rp, s);
        const clear = !other || Math.min(gapAlong(s, other.s), gapAlong(other.s, s)) > 150;
        if (Math.hypot(q.x - px, q.z - pz) > 380 && clear) { far.s = s; far.speed = 12; far.dwell = 0; far.lastStop = null; far.atStop = null; place(far); break; }
      }
      return st;
    },
    /** The train standing at station `id`, if any. */
    waitingAt(id) { return trains.find((t) => t.dwell > 0 && t.atStop && t.atStop.id === id) || null; }
  };
}
