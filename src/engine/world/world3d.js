// The 3D world: renderer, lights, camera, player controller with collision, the preschool building, the
// garden outside, the two robot companions, the learning stations, effects and picking.
// One instance for the whole visit.
import {
  WebGLRenderer, Scene, PerspectiveCamera, HemisphereLight, DirectionalLight, Color, Vector3, Matrix4, Vector2, Raycaster,
  PCFShadowMap, SRGBColorSpace, Mesh, PlaneGeometry, MeshBasicMaterial, MathUtils, NoToneMapping
} from 'three';
import { createCollisionWorld, moveCircle, penetration, findFreeSpot } from '../core/collision.js';
import { buildNavGrid, findPath } from '../core/navgrid.js';
import { WALK, SPAWN, YARD_SPAWN, STATION_SLOTS, BUILDING, DOOR, MAP, POIS, YARD_SOLIDS, poiById, zoneAt, isOutdoor, addStaticColliders } from './layout.js';
import { buildBuilding } from './building.js';
import { buildRoom } from './room.js';
import { buildYard } from './yard.js';
import { createNpcs } from './npcs.js';
import { createStations } from './stations.js';
import { createEffects } from './effects.js';
import { createCharacter, createMascot } from './character.js';
import { blobShadowTexture } from './paint.js';
import { setSignLanguage } from './signs.js';

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) {
    return false;
  }
}

const tick = () => new Promise((r) => requestAnimationFrame(() => r()));
const CULL_DISTANCE = 30;                 // areas farther than this (metres, from the player) are not drawn
const SHADOW_DISTANCE = 15;               // areas farther than this do not cast shadows
const SUN_OFFSET = new Vector3(-8, 16, 10);

// Tall things that can hide the child from the camera (checked with simple geometry, no ray casting).
const TALL = [
  ...YARD_SOLIDS.trees.map(([x, z, r]) => ({ x, z, r: r * 1.5, y0: 1.9, y1: 4.8 })),
  { x: 38.5, z: -2.0, r: 2.9, y0: 2.9, y1: 5.6 },                                   // gazebo roof
  { x: (YARD_SOLIDS.slide.x0 + YARD_SOLIDS.slide.x1) / 2, z: YARD_SOLIDS.slide.z0 + 1.2, r: 1.0, y0: 2.0, y1: 3.8 }
];

export async function createWorld3D({ canvas, config, quality = 'auto', appearance, iconSvg = () => '', lang = 'ms', onStep = () => {} }) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  } catch (e) {
    throw Object.assign(new Error('WEBGL_INIT_FAILED: ' + e.message), { code: 'WEBGL' });
  }
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NoToneMapping;
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;

  const scene = new Scene();
  const cam = config.cameraSettings;
  const camera = new PerspectiveCamera(cam.fieldOfView, 16 / 9, 0.1, 240);
  camera.position.set(0, 9, 14);

  // lights: soft sky fill + warm sun with gentle shadows. The sun follows the child, so shadows stay sharp everywhere.
  const hemi = new HemisphereLight('#fff6fd', '#e9cdb0', 1.45);
  scene.add(hemi);
  const sun = new DirectionalLight('#fff0da', 1.65);
  sun.position.copy(SUN_OFFSET);
  sun.target.position.set(0, 0, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -15; sc.right = 15; sc.top = 13; sc.bottom = -13; sc.near = 2; sc.far = 50;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  const fill = new DirectionalLight('#f3e8ff', 0.45);
  fill.position.set(9, 6, 14);
  scene.add(fill);
  const lightRot = new Matrix4().lookAt(SUN_OFFSET, new Vector3(), new Vector3(0, 1, 0));
  const lightRotInv = lightRot.clone().transpose();
  const sp = new Vector3();

  onStep(0);
  await tick();
  const collision = createCollisionWorld(WALK);
  addStaticColliders(collision);
  const doorBoxes = collision.boxes.filter((b) => b.tag === 'door');
  const building = buildBuilding(scene, collision, { iconSvg });
  await tick();
  const room = buildRoom(scene, collision, building, { iconSvg, updaters: building.updaters });
  await tick();
  const yard = buildYard(scene, { iconSvg });
  const npcs = createNpcs(scene);
  onStep(1);
  await tick();
  const stations = createStations(scene, collision);
  const effects = createEffects(scene);
  onStep(2);
  await tick();

  // player
  const r = config.movementSettings.playerRadius;
  const ch = createCharacter(appearance);
  scene.add(ch.root);
  const blob = new Mesh(new PlaneGeometry(1.5, 1.5), new MeshBasicMaterial({ map: blobShadowTexture(), transparent: true, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.03;
  blob.renderOrder = 1;
  scene.add(blob);
  const mascot = createMascot(config.mascotStyle);
  scene.add(mascot.root);
  onStep(3);

  const groundMeshes = [...building.groundMeshes, ...yard.groundMeshes];
  const zoneEntries = [...building.zones, ...yard.zones];
  setSignLanguage(lang);

  const player = { x: SPAWN.x, z: SPAWN.z, vx: 0, vz: 0, yaw: Math.PI, speed: 0 };
  const state = {
    mode: 'menu', input: { x: 0, z: 0 }, walk: null, camPreset: cam.defaultDistance, reduced: false, quality,
    camPos: new Vector3(0, 9, 15), camLook: new Vector3(0, 1, 0), violations: 0, maxPenetration: 0,
    occlTimer: 0, occluded: false, frameTimes: [], lowFpsTime: 0, dpr: 1, shadows: true, fps: 60, lastDowngrade: 0,
    outdoor: 0, doorPassable: false, cullTimer: 0, guideTarget: null, snapCamera: true, visibleZones: 0, zoneId: 'hall', walkFails: 0
  };
  const tmpV = new Vector3();
  const targetPos = new Vector3();
  const targetLook = new Vector3();
  const mascotTarget = new Vector3();
  const ray = new Raycaster();
  const ndc = new Vector2();

  // walking grid used by tap-to-walk: the front door counts as open
  let nav = null;
  function rebuildNav() { nav = buildNavGrid(collision, r + 0.05, { cell: 0.4, ignoreTags: ['door'] }); }
  rebuildNav();

  function applyQuality(q) {
    state.quality = q;
    const dpr = window.devicePixelRatio || 1;
    state.dpr = q === 'low' ? Math.min(dpr, 1) : q === 'high' ? Math.min(dpr, 2) : Math.min(dpr, 1.5);
    renderer.setPixelRatio(state.dpr);
    state.shadows = q !== 'low';
    renderer.shadowMap.enabled = state.shadows;
    sun.castShadow = state.shadows;
    const size = q === 'high' ? 2048 : 1024;
    if (sun.shadow.mapSize.x !== size) { sun.shadow.mapSize.set(size, size); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
    blob.visible = true;
    resize();
  }
  function resize() {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    // keep the room in view on tall/narrow screens
    camera.fov = camera.aspect < 1 ? Math.min(70, cam.fieldOfView / Math.max(0.55, camera.aspect) * 0.8) : cam.fieldOfView;
    camera.updateProjectionMatrix();
  }
  applyQuality(quality === 'auto' ? 'medium' : quality);

  function setPlayerPos(x, z) {
    const p = findFreeSpot(collision, { x, z }, r);
    player.x = p.x; player.z = p.z; player.vx = 0; player.vz = 0;
    state.snapCamera = true;
    cullZones(true);
  }

  // ---- per frame -------------------------------------------------------------
  function update(dt, t) {
    const reduced = state.reduced;
    const ms = config.movementSettings;
    let dx = 0, dz = 0;
    if (state.mode === 'play') {
      if (state.input.x || state.input.z) { dx = state.input.x; dz = state.input.z; state.walk = null; }
      else if (state.walk) {
        const w = state.walk;
        const wp = w.path[Math.min(w.idx, w.path.length - 1)];
        const ex = wp.x - player.x, ez = wp.z - player.z;
        const d = Math.hypot(ex, ez);
        const last = w.idx >= w.path.length - 1;
        w.time += dt;
        if (d < (last ? 0.3 : 0.5)) { if (last) finishWalk(true); else w.idx++; }
        else {
          dx = ex / d; dz = ez / d;
          if (w.time - w.lastCheck > 0.45) {
            if (Math.hypot(player.x - w.lastX, player.z - w.lastZ) < 0.12) { finishWalk(false); dx = dz = 0; }
            w.lastCheck = w.time; w.lastX = player.x; w.lastZ = player.z;
          }
        }
      }
    }
    const len = Math.hypot(dx, dz);
    if (len > 1) { dx /= len; dz /= len; }
    const k = 1 - Math.exp(-ms.acceleration * dt);
    player.vx += (dx * ms.walkSpeed - player.vx) * k;
    player.vz += (dz * ms.walkSpeed - player.vz) * k;
    if (state.mode !== 'play') { player.vx *= 0.8; player.vz *= 0.8; }
    const sp2 = Math.hypot(player.vx, player.vz);
    if (sp2 > 0.001) {
      const p = { x: player.x, z: player.z };
      moveCircle(collision, p, r, player.vx * dt, player.vz * dt);
      const pen = penetration(collision, p, r);
      state.maxPenetration = Math.max(state.maxPenetration, pen);
      if (pen > 0.01) { state.violations++; const f = findFreeSpot(collision, p, r); p.x = f.x; p.z = f.z; }
      const actual = Math.hypot(p.x - player.x, p.z - player.z) / Math.max(dt, 1e-4);
      player.x = p.x; player.z = p.z;
      player.speed = Math.min(actual, sp2);
      if (sp2 > 0.25) {
        const targetYaw = Math.atan2(player.vx, player.vz);
        let diff = targetYaw - player.yaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        player.yaw += diff * Math.min(1, ms.turnSpeed * dt);
      }
    } else player.speed = 0;

    // the front door opens as the child comes near and closes again when they have gone
    updateDoor(dt);

    // character pose
    const root = ch.root;
    root.position.set(player.x, 0, player.z);
    if (state.mode === 'menu' || state.mode === 'wardrobe' || state.mode === 'complete') {
      const face = state.mode === 'wardrobe' ? Math.sin(t * 0.6) * 0.5 : 0;
      player.yaw += (face - player.yaw) * Math.min(1, dt * 4);
    }
    root.rotation.y = player.yaw;
    ch.update(dt, t, Math.min(1, player.speed / Math.max(1, ms.walkSpeed)), reduced);
    blob.position.set(player.x, 0.03, player.z);

    // mascot follows over the shoulder
    if (state.mode === 'menu') mascotTarget.set(player.x + 1.3, 2.4, player.z + 0.4);
    else if (state.mode === 'wardrobe') mascotTarget.set(player.x + 1.1, 2.0, player.z + 0.6);
    else mascotTarget.set(player.x + Math.cos(-player.yaw) * 0.9, 2.35, player.z + Math.sin(-player.yaw) * 0.9 + 0.2);
    mascot.update(dt, t, mascotTarget, reduced);

    // 0 = inside, 1 = in the garden (eases through the doorway)
    const want = MathUtils.smoothstep(player.x, BUILDING.maxX - 2.5, BUILDING.maxX + 2.5);
    state.outdoor += (want - state.outdoor) * Math.min(1, dt * 4);
    hemi.intensity = 1.45 + state.outdoor * 0.2;
    sun.intensity = 1.65 + state.outdoor * 0.15;

    updateCamera(dt, t);
    followShadow();
    cullZones(false, dt);
    building.update(t, reduced);
    room.update(t, reduced);
    yard.update(t, reduced);
    npcs.update(t, dt, reduced, player);
    stations.update(t, reduced);
    effects.update(dt, t, reduced);
    occlusion(dt);
    const zone = zoneAt(player.x, player.z);
    if (zone.id !== state.zoneId) { state.zoneId = zone.id; if (onZoneChange) onZoneChange(zone); }
    const area = state.outdoor > 0.5 ? 'outdoor' : 'indoor';
    if (document.body.dataset.area !== area) document.body.dataset.area = area;
  }
  let onZoneChange = null;

  function updateDoor(dt) {
    const dd = Math.hypot(player.x - DOOR.x, player.z - DOOR.z);
    const open = state.mode === 'play' && dd < (building.door.isOpen ? 4.4 : 3.2);
    building.door.set(open || dd < 2.4);
    const passable = building.door.update(dt);
    if (passable !== state.doorPassable) { state.doorPassable = passable; for (const b of doorBoxes) b.off = passable; }
  }

  function followShadow() {
    if (!state.shadows) return;
    const texel = (sc.right - sc.left) / sun.shadow.mapSize.x;
    sp.set(player.x, 0, player.z).applyMatrix4(lightRotInv);
    sp.x = Math.round(sp.x / texel) * texel;
    sp.y = Math.round(sp.y / texel) * texel;
    sp.applyMatrix4(lightRot);
    sun.target.position.copy(sp);
    sun.position.copy(sp).add(SUN_OFFSET);
  }

  // Draw only the areas near the child: far corners of the preschool and far parts of the garden are switched off.
  function cullZones(force, dt = 0) {
    state.cullTimer -= dt;
    if (!force && state.cullTimer > 0) return;
    state.cullTimer = 0.2;
    let n = 0;
    for (const z of zoneEntries) {
      const [x0, z0, x1, z1] = z.rect;
      const ddx = Math.max(x0 - player.x, 0, player.x - x1), ddz = Math.max(z0 - player.z, 0, player.z - z1);
      const dist = Math.hypot(ddx, ddz);
      const vis = dist < CULL_DISTANCE;
      if (z.group.visible !== vis) z.group.visible = vis;
      if (vis) n++;
      // only the areas the sun's shadow window covers cast shadows (the shadow pass is the most expensive part)
      const near = dist < SHADOW_DISTANCE;
      if (z.casters === undefined) { z.casters = []; z.group.traverse((o) => { if (o.isMesh && o.castShadow) z.casters.push(o); }); z.shadowOn = true; }
      if (z.shadowOn !== near) { z.shadowOn = near; for (const m of z.casters) m.castShadow = near; }
    }
    state.visibleZones = n;
  }

  function updateCamera(dt, t) {
    const preset = cam.distances[state.camPreset] || cam.distances.normal;
    const m = state.mode;
    if (m === 'quiz') return; // stay perfectly still behind the quiz
    const out = state.outdoor;
    if (m === 'menu') {
      const a = state.reduced ? 0 : Math.sin(t * 0.07) * 0.35;
      // the menu card sits on the left, so frame the child right of centre
      const shift = camera.aspect > 1.2 ? -3.4 : 0;
      targetPos.set(player.x + shift + Math.sin(a) * 3, 6.0, player.z + 11.0 + Math.cos(a) * 0.4);
      targetLook.set(player.x + shift, 1.6, player.z - 3.2);
    } else if (m === 'wardrobe') {
      // the wardrobe panel is on the right, so the child stands left of centre
      const shift = camera.aspect > 1.2 ? 1.55 : 0;
      targetPos.set(player.x + shift, 1.85, player.z + 4.6);
      targetLook.set(player.x + shift, 1.1, player.z);
    } else if (m === 'complete') {
      const shift = camera.aspect > 1.2 ? -2.0 : 0;
      targetPos.set(player.x + shift, 2.7, player.z + 6.4);
      targetLook.set(player.x + shift, 1.25, player.z);
    } else {
      // gently lean towards the station the child should visit next (only when it is near enough to matter)
      let bx = 0, bz = 0;
      if (state.activePos && Math.hypot(state.activePos.x - player.x, state.activePos.z - player.z) < 22) {
        bx = MathUtils.clamp((state.activePos.x - player.x) * 0.35, -3, 3);
        bz = MathUtils.clamp((state.activePos.z - player.z) * 0.62, -1.2, 5.5);
        if (m === 'play' && state.walk === null && Math.hypot(state.activePos.x - player.x, state.activePos.z - player.z) < 3.2) { bx = 0; bz = 0; }
      }
      targetPos.set(player.x + bx, preset.height + out * 1.2, player.z + preset.back + bz + out * 1.8);
      targetLook.set(player.x + bx, 0.9, player.z - 1.6 + bz);
      targetPos.x = MathUtils.clamp(targetPos.x, MAP.minX + 7, MAP.maxX - 7);
      targetLook.x = MathUtils.clamp(targetLook.x, MAP.minX + 4, MAP.maxX - 4);
    }
    targetPos.z = Math.min(targetPos.z, MAP.maxZ + 16);
    const k = state.snapCamera ? 1 : 1 - Math.exp(-cam.smoothing * dt * (m === 'menu' ? 0.5 : 1));
    state.snapCamera = false;
    state.camPos.lerp(targetPos, k);
    state.camLook.lerp(targetLook, k);
    camera.position.copy(state.camPos);
    camera.lookAt(state.camLook);
  }

  function occlusion(dt) {
    state.occlTimer -= dt;
    if (state.occlTimer > 0) return;
    state.occlTimer = 0.15;
    if (state.mode !== 'play') { if (state.occluded) { state.occluded = false; ch.setOccluded(false); } return; }
    let occ = false;
    // trees, the gazebo roof and the slide: is one of them between the camera and the child?
    const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
    const ddx = player.x - cx, ddz = player.z - cz, dd = ddx * ddx + ddz * ddz || 1;
    for (const o of TALL) {
      const u = Math.max(0, Math.min(1, ((o.x - cx) * ddx + (o.z - cz) * ddz) / dd));
      if (u > 0.96) continue;
      const hx = cx + ddx * u - o.x, hz = cz + ddz * u - o.z;
      const y = cy + (1.2 - cy) * u;
      if (hx * hx + hz * hz < o.r * o.r && y > o.y0 && y < o.y1) { occ = true; break; }
    }
    if (!occ) {
      tmpV.set(player.x, 1.2, player.z);
      const dir = tmpV.clone().sub(camera.position);
      const dist = dir.length();
      ray.set(camera.position, dir.normalize());
      ray.far = dist - 0.6;
      occ = ray.intersectObjects(stations.occluders(), true).length > 0;
    }
    if (occ !== state.occluded) { state.occluded = occ; ch.setOccluded(occ); }
  }

  function finishWalk(arrived) {
    const w = state.walk;
    state.walk = null;
    if (w && w.onDone) w.onDone(arrived);
  }

  // adaptive quality for slow laptops
  function frameStats(dt) {
    if (dt > 0.5) return; // tab was hidden or the page was paused: not a performance signal
    state.frameTimes.push(dt);
    if (state.frameTimes.length > 60) state.frameTimes.shift();
    const avg = state.frameTimes.reduce((a, b) => a + b, 0) / state.frameTimes.length;
    state.fps = 1 / Math.max(avg, 1e-3);
    if (quality !== 'auto') return;
    if (state.fps < 27 && state.frameTimes.length >= 20) state.lowFpsTime += dt; else state.lowFpsTime = 0;
    if (state.lowFpsTime > 4 && state.quality !== 'low') {
      applyQuality('low');
      state.frameTimes.length = 0;
      state.lowFpsTime = 0;
      state.lastDowngrade = performance.now();
    }
  }

  function sceneCounts() {
    let meshes = 0, outlines = 0, casters = 0, instanced = 0;
    scene.traverseVisible((o) => { if (o.isMesh) { meshes++; if (o.userData.isOutline) outlines++; if (o.castShadow) casters++; if (o.isInstancedMesh) instanced++; } });
    return { meshes, outlines, casters, instanced };
  }
  const poiGap = (p) => Math.hypot(p.x - player.x, p.z - player.z) - p.radius - r;
  // QA helper: which kinds of meshes make up the draw calls right now
  function breakdown() {
    const out = {};
    scene.traverseVisible((o) => {
      if (!o.isMesh) return;
      const m = o.material;
      const k = `${m.type}${m.vertexColors ? '+vc' : ''}${m.map ? '+map' : ''}${m.transparent ? '+tr' : ''}${o.isInstancedMesh ? ' inst' : ''}${o.userData.isOutline ? ' outline' : ''}`;
      const e = out[k] || (out[k] = { meshes: 0, tris: 0 });
      e.meshes++;
      const g = o.geometry;
      e.tris += (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1);
    });
    return out;
  }

  return {
    renderer, scene, camera, collision,
    get mode() { return state.mode; },
    setMode(m) {
      state.mode = m;
      if (m !== 'play') { state.input.x = 0; state.input.z = 0; if (state.walk) finishWalk(false); }
      ch.wave(m === 'menu');
    },
    setInput(x, z) { state.input.x = x; state.input.z = z; },
    /** Walk to a spot along a path that goes round furniture and through the front door. */
    walkTo(x, z, onDone) {
      if (state.walk) finishWalk(false);
      let path = nav ? findPath(nav, { x: player.x, z: player.z }, { x, z }) : null;
      if (!path || path.length < 2) path = [{ x: player.x, z: player.z }, { x, z }];
      state.walk = { x, z, path, idx: 1, onDone, time: 0, lastCheck: 0, lastX: player.x, lastZ: player.z };
    },
    get walking() { return !!state.walk; },
    cancelWalk() { if (state.walk) finishWalk(false); },
    resetPlayer(where = 'start') {
      const p = where === 'yard' ? YARD_SPAWN : SPAWN;
      setPlayerPos(p.x, p.z); player.yaw = where === 'yard' ? Math.PI / 2 : Math.PI;
    },
    /** Moves the child straight to a spot (used for "back to start", and by the automated tests). */
    teleport(x, z) { if (state.walk) finishWalk(false); setPlayerPos(x, z); },
    player() { return { x: player.x, z: player.z, speed: player.speed, yaw: player.yaw, zone: state.zoneId, area: state.outdoor > 0.5 ? 'outdoor' : 'indoor' }; },
    setAppearance(a) { state.appearance = a; ch.setAppearance(a); },
    celebrate(index) {
      ch.celebrate();
      const p = STATION_SLOTS[index] || { x: player.x, z: player.z };
      effects.burst(player.x, 2.0, player.z, state.reduced ? 40 : 120, state.reduced);
      void p;
    },
    party() { ch.celebrate(); effects.burst(player.x, 2.6, player.z, state.reduced ? 50 : 160, state.reduced); },
    async buildStations(defs, label, titleOf, iconSvgOf) { await stations.build(defs, label, titleOf, iconSvgOf); rebuildNav(); },
    applyTheme: room.applyTheme,
    setLanguage(l) { setSignLanguage(l); },
    setStationStates(states, activeIndex) {
      stations.setStates(states);
      room.highlightPath(activeIndex);
      const pos = stations.positions();
      effects.setSparkles(activeIndex >= 0 && pos[activeIndex] ? pos[activeIndex] : null);
      state.activeIndex = activeIndex;
      state.activePos = activeIndex >= 0 && pos[activeIndex] ? { x: pos[activeIndex].x, z: pos[activeIndex].z } : null;
    },
    stationPositions() { return stations.positions(); },
    /** Station the player is close enough to use, or -1. */
    nearStation(gap) {
      const pos = stations.positions();
      let best = -1, bestD = Infinity;
      pos.forEach((s, i) => {
        const d = Math.hypot(s.x - player.x, s.z - player.z) - s.radius - r;
        if (d <= gap && d < bestD) { best = i; bestD = d; }
      });
      return best;
    },
    /** The closest point of interest (arcade, games, door, robots...) within `gap` metres of its edge, or null. */
    nearPoi(gap) {
      let best = null, bd = Infinity;
      for (const p of POIS) { const d = poiGap(p); if (d <= gap && d < bd) { best = p; bd = d; } }
      return best;
    },
    poiDistance(id) { const p = poiById[id]; return p ? poiGap(p) : Infinity; },
    poiApproach(id) {
      const p = poiById[id];
      const dx = player.x - p.x, dz = player.z - p.z;
      const d = Math.hypot(dx, dz) || 1;
      return { x: p.x + (dx / d) * (p.radius + r + 0.5), z: p.z + (dz / d) * (p.radius + r + 0.5) };
    },
    /** The other side of the front door: where to walk to go outside or come back in. */
    doorTarget() { return state.outdoor > 0.5 ? { x: BUILDING.maxX - 3.5, z: DOOR.z } : { x: YARD_SPAWN.x, z: YARD_SPAWN.z }; },
    get doorOpen() { return state.doorPassable; },
    greetNpc(id) { npcs.greet(id); },
    onZoneChange(fn) { onZoneChange = fn; },
    zone() { return zoneAt(player.x, player.z); },
    get outdoor() { return state.outdoor > 0.5; },
    distanceToStation(i) { const s = stations.positions()[i]; return s ? Math.hypot(s.x - player.x, s.z - player.z) - s.radius - r : Infinity; },
    approachPoint(i) {
      const s = stations.positions()[i];
      const dx = player.x - s.x, dz = player.z - s.z;
      const d = Math.hypot(dx, dz) || 1;
      return { x: s.x + (dx / d) * (s.radius + r + 0.5), z: s.z + (dz / d) * (s.radius + r + 0.5) };
    },
    /** Shows the floor arrow towards `target` ({x,z}) or, if none is given, the station to visit next. */
    guide(show, target = null) {
      const i = state.activeIndex;
      const s = target || (i >= 0 ? stations.positions()[i] : null);
      effects.guide(player.x, player.z, s ? s.x : 0, s ? s.z : 0, show && !!s);
    },
    setCameraPreset(p) { if (cam.distances[p]) state.camPreset = p; },
    get cameraPreset() { return state.camPreset; },
    setReducedMotion(v) { state.reduced = !!v; },
    setQuality(q) { applyQuality(q === 'auto' ? 'medium' : q); },
    pick(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      ray.far = 260;
      const hit = ray.intersectObjects(stations.pickables(), true)[0];
      if (hit) { let o = hit.object; while (o && o.userData.stationIndex === undefined) o = o.parent; if (o) return { type: 'station', index: o.userData.stationIndex }; }
      const f = ray.intersectObjects(groundMeshes.filter((g) => g.parent && g.parent.visible !== false), false)[0];
      if (f) {
        // a tap on or near a point of interest (its coloured ring) selects that place
        let best = null, bd = Infinity;
        for (const p of POIS) { const d = Math.hypot(f.point.x - p.x, f.point.z - p.z) - p.radius; if (d < 1.0 && d < bd) { best = p; bd = d; } }
        if (best) return { type: 'poi', id: best.id, x: f.point.x, z: f.point.z };
        return { type: 'floor', x: f.point.x, z: f.point.z };
      }
      return null;
    },
    toScreen(x, y, z) {
      const v = new Vector3(x, y, z).project(camera);
      const rect = canvas.getBoundingClientRect();
      return { x: rect.left + ((v.x + 1) / 2) * rect.width, y: rect.top + ((1 - v.y) / 2) * rect.height, visible: v.z < 1 };
    },
    resize,
    breakdown,
    // `dt` is capped for the simulation; `rawDt` (real frame time) feeds the frame-rate monitor.
    update(dt, t, rawDt) { frameStats(rawDt === undefined ? dt : rawDt); update(dt, t); },
    render() { renderer.render(scene, camera); },
    debug() {
      return { violations: state.violations, maxPenetration: state.maxPenetration, fps: Math.round(state.fps), quality: state.quality, dpr: state.dpr,
        shadows: state.shadows, autoMode: quality === 'auto', lowFpsTime: +state.lowFpsTime.toFixed(2), samples: state.frameTimes.length, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, occluded: state.occluded,
        camera: { x: camera.position.x, y: camera.position.y, z: camera.position.z }, walking: !!state.walk, mode: state.mode,
        guideArrow: effects.arrowVisible, bounds: WALK, playerRadius: r, zone: state.zoneId, area: state.outdoor > 0.5 ? 'outdoor' : 'indoor', doorOpen: state.doorPassable,
        visibleZones: state.visibleZones, totalZones: zoneEntries.length,
        npcs: Object.fromEntries(Object.entries(npcs.list).map(([k, n]) => [k, { x: n.root.position.x, z: n.root.position.z }])),
        character: state.appearance ? { hair: state.appearance.hairStyle, outfit: state.appearance.outfitColor, accessories: Object.fromEntries(Object.entries(state.appearance.accessories || {}).map(([k, v]) => [k, v.model])), meshes: (() => { let n = 0; ch.root.traverse((o) => { if (o.isMesh) n++; }); return n; })() } : null, boxes: collision.boxes.length, circles: collision.circles.length, ...sceneCounts() };
    }
  };
}
void isOutdoor; void Color;
