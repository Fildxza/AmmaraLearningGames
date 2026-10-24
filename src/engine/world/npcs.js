// Two friendly little robot companions. They stay seated for ever: chair and cushion are part of the model,
// they never walk, and they only breathe, blink, tilt their heads and wave.
import { Group, Mesh, PlaneGeometry, MeshBasicMaterial, MathUtils } from 'three';
import { box, ball, cyl, cone, torus, capsule, heart3d, star3d, group, at, cachedGeo, live, mergeStatic } from './kit.js';
import { NPC_SEATS } from './layout.js';
import { chairKid, cushion, PAL } from './props.js';
import { tint } from './paint.js';

function robot(style) {
  const boy = style === 'boy';
  const body = boy ? '#7fcbff' : '#ff9fc8';
  const accent = boy ? '#ffd23f' : '#fff3a8';
  const dark = '#2d3a63';
  const g = new Group();
  const torso = new Group();                       // breathes
  torso.position.y = 0.0;
  g.add(torso);
  // seated body
  const trunk = group(box(0.95, 0.85, 0.7, body, { y: 1.0, r: 0.22, outline: 0.025 }), box(0.7, 0.16, 0.05, tint(body, 0.15), { y: 1.28, z: 0.36, r: 0.05, outline: 0 }));
  if (boy) { trunk.add(star3d(0.17, 0.05, accent, { y: 1.0, z: 0.38, outline: 0.01 })); trunk.add(box(0.98, 0.14, 0.72, '#4a90e2', { y: 0.62, r: 0.06, outline: 0.015 })); }
  else { trunk.add(heart3d(0.14, 0.05, '#ff5a8a', { y: 1.0, z: 0.38, outline: 0.01 })); trunk.add(cone(0.78, 0.55, '#ffc3dc', { y: 0.62, seg: 14, outline: 0.02 })); }
  torso.add(trunk);
  // legs stretched forward (sitting)
  const legs = new Group();
  for (const sx of [-1, 1]) {
    legs.add(box(0.28, 0.26, 0.85, tint(body, -0.08), { x: sx * 0.26, y: 0.55, z: 0.5, r: 0.1, outline: 0.02 }));
    legs.add(box(0.34, 0.2, 0.34, boy ? '#4a90e2' : '#ff5a8a', { x: sx * 0.26, y: 0.5, z: 0.96, r: 0.08, outline: 0.02 }));
  }
  torso.add(legs);
  // head: a big rounded box with a dark face screen
  const head = new Group();
  head.position.set(0, 1.95, 0.02);
  head.add(box(1.25, 0.98, 0.95, body, { r: 0.3, outline: 0.03 }));
  head.add(box(1.02, 0.74, 0.1, dark, { z: 0.46, r: 0.2, outline: 0.012 }));
  head.add(box(0.2, 0.18, 0.2, tint(body, -0.12), { x: -0.67, r: 0.06, outline: 0.015 }), box(0.2, 0.18, 0.2, tint(body, -0.12), { x: 0.67, r: 0.06, outline: 0.015 }));  // ears (speakers)
  const eyeMat = new MeshBasicMaterial({ color: '#9ff5ff' });
  const eyeGeo = cachedGeo('roboeye', () => new PlaneGeometry(0.2, 0.3));
  const eyes = [-1, 1].map((sx) => { const e = new Mesh(eyeGeo, eyeMat); e.position.set(sx * 0.27, 0.07, 0.52); return live(e); });
  const cheek = new MeshBasicMaterial({ color: '#ff8fb0', transparent: true, opacity: 0.8 });
  const cheeks = [-1, 1].map((sx) => { const e = new Mesh(cachedGeo('robocheek', () => new PlaneGeometry(0.16, 0.09)), cheek); e.position.set(sx * 0.4, -0.13, 0.52); return e; });
  const mouth = new Mesh(cachedGeo('robomouth', () => torus(0.11, 0.025, '#fff', { arc: Math.PI, outline: 0 }).geometry), new MeshBasicMaterial({ color: '#9ff5ff' }));
  mouth.position.set(0, -0.12, 0.52); mouth.rotation.z = Math.PI; live(mouth);
  head.add(...eyes, ...cheeks, mouth);
  // antenna and hair accessory
  head.add(cyl(0.025, 0.025, 0.32, '#5b6a99', { y: 0.62, seg: 6, outline: 0 }));
  const tip = ball(0.1, boy ? '#ffd23f' : '#ff8fc0', { y: 0.82, seg: 10, outline: 0.012, matOpts: { emissive: boy ? '#ffd23f' : '#ff8fc0', emissiveIntensity: 0.4 } });
  head.add(live(tip));
  if (boy) head.add(cyl(0.45, 0.5, 0.14, '#4a90e2', { y: 0.52, z: 0.02, seg: 14, outline: 0.02 }), box(0.7, 0.06, 0.4, '#4a90e2', { y: 0.5, z: 0.5, r: 0.02, outline: 0.012 }));
  else head.add(cone(0.16, 0.26, '#ff5a8a', { x: -0.36, y: 0.58, rz: Math.PI / 2 - 0.2, seg: 6, outline: 0.012 }), cone(0.16, 0.26, '#ff5a8a', { x: -0.62, y: 0.58, rz: -Math.PI / 2 + 0.2, seg: 6, outline: 0.012 }), ball(0.08, '#ffffff', { x: -0.49, y: 0.58, seg: 6, outline: 0 }));
  torso.add(head);
  // arms
  const mkArm = (sx) => {
    const a = new Group();
    a.position.set(sx * 0.62, 1.35, 0.0);
    a.add(capsule(0.1, 0.38, tint(body, -0.05), { y: -0.28, outline: 0.015 }), ball(0.13, accent, { y: -0.58, seg: 10, outline: 0.015 }));
    a.rotation.z = -sx * 0.25; a.rotation.x = -0.35;
    torso.add(a);
    return a;
  };
  const armL = mkArm(-1), armR = mkArm(1);
  // the seat: a chair for the boy, a round cushion for the girl
  const seat = boy ? chairKid('#4a90e2', true) : cushion(0.75, '#ff7eb6', 0.38);
  if (boy) { seat.position.set(0, 0, -0.1); seat.scale.set(1.15, 1, 1.15); trunk.position.y += 0.02; } else { seat.position.y = 0.02; }
  g.add(seat);
  mergeStatic(seat);
  // the parts that move together become one mesh each (the eyes, mouth and antenna light are marked live)
  for (const part of [trunk, legs, head, armL, armR]) mergeStatic(part);
  g.userData = { torso, head, eyes, armL, armR, tip, mouth, cheeks };
  return g;
}

export function createNpcs(scene) {
  const root = new Group();
  root.name = 'npcs';
  scene.add(root);
  const list = {};
  for (const [id, seat] of Object.entries(NPC_SEATS)) {
    const r = robot(id);
    r.position.set(seat.x, id === 'girl' ? 0.28 : 0.0, seat.z);
    r.rotation.y = seat.ry;
    r.traverse((o) => { if (o.isMesh && !o.userData.isOutline) o.castShadow = true; });
    root.add(r);
    list[id] = { id, root: r, seat, blink: 1.5 + Math.random() * 2, blinkHold: 0, greetT: 0, phase: id === 'girl' ? 1.7 : 0 };
  }
  return {
    root, list,
    greet(id) { if (list[id]) list[id].greetT = 2.2; },
    update(t, dt, reduced, player) {
      for (const n of Object.values(list)) {
        const u = n.root.userData;
        const ph = n.phase;
        const breathe = reduced ? 0 : Math.sin(t * 1.8 + ph) * 0.012;
        u.torso.scale.set(1 - breathe * 0.4, 1 + breathe, 1 - breathe * 0.4);
        // look at the child when close
        let lookY = 0, lookX = 0;
        if (player) {
          const dx = player.x - n.root.position.x, dz = player.z - n.root.position.z, d = Math.hypot(dx, dz);
          if (d < 9) { lookY = MathUtils.clamp(Math.atan2(dx, dz) - n.root.rotation.y, -0.7, 0.7); lookX = d < 5 ? -0.05 : 0; }
        }
        const tilt = reduced ? 0 : Math.sin(t * 0.9 + ph) * 0.05;
        u.head.rotation.y += (lookY - u.head.rotation.y) * Math.min(1, dt * 4);
        u.head.rotation.x += (lookX - u.head.rotation.x) * Math.min(1, dt * 4);
        u.head.rotation.z = tilt;
        // blink
        n.blink -= dt;
        if (n.blink <= 0 && n.blinkHold <= 0) { n.blinkHold = 0.12; n.blink = 2.2 + Math.random() * 2.8; }
        if (n.blinkHold > 0) n.blinkHold -= dt;
        const sy = n.blinkHold > 0 ? 0.1 : 1;
        for (const e of u.eyes) e.scale.y += (sy - e.scale.y) * 0.6;
        u.tip.position.y = 0.82 + (reduced ? 0 : Math.sin(t * 2.4 + ph) * 0.03);
        // small hand movements, a wave when greeted
        if (n.greetT > 0) {
          n.greetT = Math.max(0, n.greetT - dt);
          u.armR.rotation.z = -2.3; u.armR.rotation.x = Math.sin(t * 9) * 0.4;
          u.mouth.scale.set(1.35, 1.35, 1);
          n.root.position.y = (id0(n) ? 0.28 : 0) + Math.abs(Math.sin(t * 6)) * 0.06;
        } else {
          u.armR.rotation.z += (-0.25 - u.armR.rotation.z) * Math.min(1, dt * 5);
          u.armR.rotation.x = -0.35 + (reduced ? 0 : Math.sin(t * 1.4 + ph) * 0.08);
          u.mouth.scale.set(1, 1, 1);
          n.root.position.y = id0(n) ? 0.28 : 0;
        }
        u.armL.rotation.x = -0.35 + (reduced ? 0 : Math.sin(t * 1.1 + ph + 1) * 0.06);
      }
    }
  };
}
const id0 = (n) => n.id === 'girl';
void PAL;
