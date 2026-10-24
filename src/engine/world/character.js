// The learner's character: a chibi child with configurable hair, skin, outfit and
// earned accessories that are really attached to the model.
import { Group, Mesh, SphereGeometry, CylinderGeometry, TorusGeometry, MeshBasicMaterial, GreaterDepth, Color, MathUtils } from 'three';
import { box, ball, cyl, cone, torus, capsule, star3d, heart3d, group, at, cachedGeo, part, live, mergeStatic } from './kit.js';
import { toon, makeCanvas, canvasTexture } from './paint.js';

const SKIN_SHADE = (hex) => new Color(hex).multiplyScalar(0.92).getStyle();

function rainbowTexture() {
  const c = makeCanvas(64, 256), ctx = c.getContext('2d');
  ['#ff6b6b', '#ff9a3c', '#ffd23f', '#5cc46a', '#4a90e2', '#9b6bff'].forEach((col, i) => { ctx.fillStyle = col; ctx.fillRect(0, i * 43, 64, 43); });
  return canvasTexture(c);
}
let rainbowTex = null;

// ---------- accessory models -------------------------------------------------
const ACC = {
  bow: (c) => group(cone(0.09, 0.18, c, { x: -0.1, rz: Math.PI / 2, sy: 1, outline: 0.012 }), cone(0.09, 0.18, c, { x: 0.1, rz: -Math.PI / 2, outline: 0.012 }), ball(0.05, c, { outline: 0.01 })),
  partyHat: (c) => {
    const g = group(cone(0.2, 0.46, c, { y: 0.23, outline: 0.015 }), ball(0.07, '#ffd23f', { y: 0.48, outline: 0.012 }));
    [0.08, 0.2, 0.32].forEach((y, i) => g.add(torus(0.17 - i * 0.05, 0.018, '#ffffff', { y, rx: Math.PI / 2, outline: 0 })));
    g.rotation.z = -0.18;
    return g;
  },
  crown: (c) => {
    const g = group(cyl(0.26, 0.24, 0.14, c, { y: 0.07, open: true, outline: 0.012 }));
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; g.add(cone(0.06, 0.15, c, { x: Math.sin(a) * 0.25, y: 0.2, z: Math.cos(a) * 0.25, outline: 0.01 })); g.add(ball(0.03, i % 2 ? '#ff6b9f' : '#7fcbff', { x: Math.sin(a) * 0.27, y: 0.08, z: Math.cos(a) * 0.27, outline: 0 })); }
    return g;
  },
  flowerCrown: (c) => {
    const g = group(torus(0.38, 0.035, '#5cc46a', { rx: Math.PI / 2, outline: 0 }));
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2, x = Math.sin(a) * 0.38, z = Math.cos(a) * 0.38;
      g.add(ball(0.07, i % 2 ? c : '#ffd23f', { x, y: 0.03, z, outline: 0.008 }));
    }
    return g;
  },
  cap: (c) => {
    const dome = part(cachedGeo('capdome', () => new SphereGeometry(0.53, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2)), c, { sy: 0.62, outline: 0.012 });
    return group(dome, cyl(0.28, 0.3, 0.04, c, { z: 0.42, y: 0.02, sx: 1.2, outline: 0.012 }), ball(0.05, '#ffffff', { y: 0.33, outline: 0.008 }));
  },
  bunnyEars: (c) => group(torus(0.5, 0.03, '#ff8fc0', { arc: Math.PI, rz: 0, outline: 0 }),
    capsule(0.07, 0.38, c, { x: -0.17, y: 0.38, rz: 0.15, sz: 0.6, outline: 0.012 }), capsule(0.07, 0.38, c, { x: 0.17, y: 0.38, rz: -0.15, sz: 0.6, outline: 0.012 }),
    capsule(0.035, 0.28, '#ffc3cf', { x: -0.17, y: 0.38, z: 0.03, rz: 0.15, sz: 0.4, outline: 0 }), capsule(0.035, 0.28, '#ffc3cf', { x: 0.17, y: 0.38, z: 0.03, rz: -0.15, sz: 0.4, outline: 0 })),
  catEars: (c) => group(cone(0.12, 0.22, c, { x: -0.27, y: 0.14, rz: 0.35, outline: 0.012 }), cone(0.12, 0.22, c, { x: 0.27, y: 0.14, rz: -0.35, outline: 0.012 }),
    cone(0.06, 0.12, '#ffc3cf', { x: -0.26, y: 0.12, z: 0.05, rz: 0.35, outline: 0 }), cone(0.06, 0.12, '#ffc3cf', { x: 0.26, y: 0.12, z: 0.05, rz: -0.35, outline: 0 })),
  chefHat: (c) => group(cyl(0.27, 0.27, 0.18, c, { y: 0.09, outline: 0.012 }), ball(0.2, c, { y: 0.28, x: -0.12, outline: 0.012 }), ball(0.22, c, { y: 0.32, x: 0.1, outline: 0.012 }), ball(0.2, c, { y: 0.34, z: -0.1, outline: 0.012 })),
  antenna: (c) => group(cyl(0.015, 0.015, 0.36, '#5b3f33', { x: -0.16, y: 0.16, rz: 0.25, outline: 0 }), cyl(0.015, 0.015, 0.36, '#5b3f33', { x: 0.16, y: 0.16, rz: -0.25, outline: 0 }),
    star3d(0.08, 0.04, '#ffd23f', { x: -0.21, y: 0.36, outline: 0.008, matOpts: { emissive: '#ffd23f', emissiveIntensity: 0.4 } }), ball(0.06, c, { x: 0.21, y: 0.36, outline: 0.008 })),
  starGlasses: (c) => group(star3d(0.12, 0.04, c, { x: -0.17, outline: 0.012 }), star3d(0.12, 0.04, c, { x: 0.17, outline: 0.012 }), cyl(0.015, 0.015, 0.12, c, { rz: Math.PI / 2, outline: 0 })),
  roundGlasses: (c) => group(torus(0.1, 0.018, c, { x: -0.17, outline: 0 }), torus(0.1, 0.018, c, { x: 0.17, outline: 0 }), cyl(0.012, 0.012, 0.12, c, { rz: Math.PI / 2, outline: 0 })),
  flowerClip: (c) => { const g = group(ball(0.04, '#ffd23f', { z: 0.03, outline: 0 })); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; g.add(ball(0.05, c, { x: Math.cos(a) * 0.06, y: Math.sin(a) * 0.06, outline: 0.008 })); } return g; },
  starClip: (c) => star3d(0.09, 0.04, c, { outline: 0.01 }),
  backpack: (c) => group(box(0.5, 0.52, 0.24, c, { r: 0.08 }), box(0.46, 0.2, 0.06, '#ffd65a', { y: 0.12, z: 0.13, r: 0.04, outline: 0.01 }), box(0.3, 0.18, 0.06, '#ffffff', { y: -0.12, z: 0.13, r: 0.04, outline: 0.01 })),
  cape: (c) => {
    const geo = cachedGeo('capeGeo', () => new CylinderGeometry(0.36, 0.52, 0.8, 18, 1, true, Math.PI * 0.62, Math.PI * 0.76));
    const mat = c === 'rainbow' ? toon('#ffffff', { map: (rainbowTex = rainbowTex || rainbowTexture()), side: 2 }) : toon(c, { side: 2 });
    const m = new Mesh(geo, mat);
    m.castShadow = true;
    m.position.y = -0.38;
    return group(m, ball(0.05, '#ffd23f', { y: 0.02, z: 0.28, outline: 0.008 }));
  },
  wings: (c) => {
    const mk = (side) => {
      const w = group(ball(0.28, c, { x: side * 0.26, y: 0.12, sx: 1.1, sy: 0.75, sz: 0.12, outline: 0.01, matOpts: { transparent: true, opacity: 0.85 } }),
        ball(0.2, '#ffc3dc', { x: side * 0.22, y: -0.18, sx: 1, sy: 0.75, sz: 0.12, outline: 0.01, matOpts: { transparent: true, opacity: 0.85 } }));
      w.userData.side = side;
      return w;
    };
    const g = group(mk(-1), mk(1));
    g.userData.flap = true;
    return g;
  },
  balloon: (c) => {
    const g = group(heart3d(0.2, 0.14, c, { y: 1.05, outline: 0.012 }), cyl(0.006, 0.006, 1.0, '#5b3f33', { y: 0.5, outline: 0 }));
    g.userData.bob = true;
    return g;
  },
  wand: (c) => group(cyl(0.02, 0.02, 0.5, '#ffffff', { y: 0.2, outline: 0.006 }), star3d(0.1, 0.05, c, { y: 0.5, outline: 0.01, matOpts: { emissive: c, emissiveIntensity: 0.35 } }))
};
export const ACCESSORY_MODELS = Object.keys(ACC);

/**
 * @param appearance { hairStyle, hairColor, hijabColor, skinTone, eyeColor, outfitColor, shoeColor, accessories: { slot: { model, color } } }
 */
export function createCharacter(appearance) {
  const root = new Group();
  root.name = 'player';
  const body = new Group();
  root.add(body);
  const parts = {};
  const silhouetteMat = new MeshBasicMaterial({ color: 0x9d7bff, transparent: true, opacity: 0.45, depthFunc: GreaterDepth, depthWrite: false });
  const silhouette = new Group();
  silhouette.visible = false;
  root.add(silhouette);
  let built = null;
  let blinkT = 2, blinkHold = 0, phase = 0, celebrateT = 0, waveT = 0, t0 = 0;

  function build(a) {
    if (built) { body.remove(built); built = null; }
    silhouette.clear();
    const g = new Group();
    const skin = a.skinTone, hair = a.hairColor;
    const outfitMat = a.outfitColor === 'rainbow' ? toon('#ffffff', { map: (rainbowTex = rainbowTex || rainbowTexture()) }) : null;
    // legs (pivot at hips)
    const legL = at(group(capsule(0.1, 0.2, skin, { y: -0.18, outline: 0.015 }), ball(0.13, a.shoeColor, { y: -0.36, z: 0.04, sy: 0.6, sz: 1.3, outline: 0.015 })), -0.12, 0.42, 0);
    const legR = at(group(capsule(0.1, 0.2, skin, { y: -0.18, outline: 0.015 }), ball(0.13, a.shoeColor, { y: -0.36, z: 0.04, sy: 0.6, sz: 1.3, outline: 0.015 })), 0.12, 0.42, 0);
    // dress
    const dress = cyl(0.25, 0.44, 0.66, a.outfitColor === 'rainbow' ? '#ffffff' : a.outfitColor, { y: 0.74, outline: 0.022, material: outfitMat || undefined });
    const collar = torus(0.2, 0.05, '#ffffff', { y: 1.06, rx: Math.PI / 2, outline: 0.01 });
    const pocket = ball(0.08, '#ffffff', { y: 0.62, z: 0.38, sz: 0.3, outline: 0.008 });
    // arms (pivot at shoulders)
    const armL = at(group(capsule(0.075, 0.3, a.outfitColor === 'rainbow' ? '#ff9a3c' : a.outfitColor, { y: -0.2, outline: 0.012 }), ball(0.095, skin, { y: -0.42, outline: 0.012 })), -0.3, 1.0, 0);
    const armR = at(group(capsule(0.075, 0.3, a.outfitColor === 'rainbow' ? '#4a90e2' : a.outfitColor, { y: -0.2, outline: 0.012 }), ball(0.095, skin, { y: -0.42, outline: 0.012 })), 0.3, 1.0, 0);
    armL.rotation.z = 0.12; armR.rotation.z = -0.12;
    // head
    const head = new Group();
    head.position.y = 1.52;
    head.add(ball(0.5, skin, { outline: 0.026, seg: 32 }));
    head.add(ball(0.12, skin, { x: -0.49, y: -0.02, sz: 0.7, outline: 0.012 }));
    head.add(ball(0.12, skin, { x: 0.49, y: -0.02, sz: 0.7, outline: 0.012 }));
    const eyeL = group(ball(0.075, a.eyeColor, { sz: 0.55, outline: 0 }), ball(0.025, '#ffffff', { x: 0.025, y: 0.03, z: 0.04, outline: 0 }));
    const eyeR = group(ball(0.075, a.eyeColor, { sz: 0.55, outline: 0 }), ball(0.025, '#ffffff', { x: 0.025, y: 0.03, z: 0.04, outline: 0 }));
    at(eyeL, -0.17, 0.0, 0.46); at(eyeR, 0.17, 0.0, 0.46);
    head.add(eyeL, eyeR);
    head.add(ball(0.08, '#ff9fb6', { x: -0.29, y: -0.12, z: 0.4, sz: 0.3, outline: 0, matOpts: { transparent: true, opacity: 0.75 } }));
    head.add(ball(0.08, '#ff9fb6', { x: 0.29, y: -0.12, z: 0.4, sz: 0.3, outline: 0, matOpts: { transparent: true, opacity: 0.75 } }));
    const mouth = part(cachedGeo('mouth', () => new TorusGeometry(0.055, 0.016, 8, 16, Math.PI)), '#b04a5a', { y: -0.13, z: 0.475, rz: Math.PI, outline: 0 });
    head.add(mouth);
    // hair styles
    const capTop = (r, len) => part(cachedGeo(`hairtop${r}${len}`, () => new SphereGeometry(r, 32, 16, 0, Math.PI * 2, 0, len)), hair, { outline: 0.02 });
    const capBack = (r, len) => part(cachedGeo(`hairback${r}${len}`, () => new SphereGeometry(r, 32, 16, Math.PI, Math.PI, 0, len)), hair, { outline: 0.02 });
    const anchors = { head: new Group(), hair: new Group(), face: new Group() };
    if (a.hairStyle === 'hijab') {
      const hc = a.hijabColor;
      head.add(part(cachedGeo('hijabHood', () => new SphereGeometry(0.56, 32, 18, Math.PI / 2 + 0.72, Math.PI * 2 - 1.44, 0, 2.15)), hc, { outline: 0.02, y: 0.01 }));
      head.add(part(cachedGeo('hijabBrow', () => new SphereGeometry(0.565, 24, 10, Math.PI / 2 - 0.8, 1.6, 0, 0.82)), hc, { outline: 0.0, y: 0.012 }));
      g.add(cyl(0.42, 0.62, 0.38, hc, { y: 1.08, outline: 0.02 }));
      anchors.head.position.set(0, 0.5, 0); anchors.hair.position.set(0.36, 0.3, 0.3); anchors.hair.rotation.set(0, 0.6, -0.4);
    } else {
      head.add(capTop(0.535, a.hairStyle === 'short' ? 1.1 : 1.08));
      head.add(capBack(0.535, a.hairStyle === 'short' ? 2.0 : 2.35));
      // fringe
      [-0.22, 0, 0.22].forEach((x, i) => head.add(ball(0.17, hair, { x, y: 0.3 - Math.abs(x) * 0.25, z: 0.36 - Math.abs(x) * 0.18, sy: 0.6, sz: 0.55, rz: (i - 1) * 0.3, outline: 0.012 })));
      if (a.hairStyle === 'pigtails') {
        [-1, 1].forEach((s) => {
          const tail = group(ball(0.19, hair, { y: -0.12, sy: 1.25, outline: 0.016 }), ball(0.14, hair, { y: -0.36, x: s * 0.03, outline: 0.014 }), torus(0.08, 0.035, '#ff7eb6', { y: 0.05, rx: Math.PI / 2, outline: 0 }));
          tail.rotation.z = s * 0.45;
          head.add(at(tail, s * 0.52, 0.02, -0.12));
        });
      } else if (a.hairStyle === 'bun') {
        head.add(ball(0.22, hair, { y: 0.5, z: -0.18, outline: 0.016 }));
        head.add(torus(0.16, 0.035, '#ff7eb6', { y: 0.38, z: -0.14, rx: 1.2, outline: 0 }));
      } else {
        head.add(ball(0.18, hair, { x: -0.44, y: -0.05, z: 0.05, sy: 1.3, sx: 0.6, outline: 0.012 }));
        head.add(ball(0.18, hair, { x: 0.44, y: -0.05, z: 0.05, sy: 1.3, sx: 0.6, outline: 0.012 }));
      }
      anchors.head.position.set(0, 0.47, 0);
      anchors.hair.position.set(0.32, 0.36, 0.28); anchors.hair.rotation.set(0, 0.5, -0.5);
    }
    anchors.face.position.set(0, 0.01, 0.53);
    head.add(anchors.head, anchors.hair, anchors.face);
    const back = at(new Group(), 0, 0.82, -0.36);
    const shoulders = at(new Group(), 0, 1.02, -0.22);
    const hand = at(new Group(), 0, -0.42, 0.05);
    armR.add(hand);
    g.add(legL, legR, dress, collar, pocket, armL, armR, head, back, shoulders);
    // accessories
    const accs = a.accessories || {};
    const live = [];
    const put = (slot, anchor, transform) => {
      const spec = accs[slot];
      if (!spec || !ACC[spec.model]) return;
      const m = ACC[spec.model](spec.color);
      if (transform) transform(m);
      anchor.add(m);
      live.push(m);
    };
    put('head', anchors.head, (m) => { if (accs.head.model === 'flowerCrown') m.position.y = -0.08; if (accs.head.model === 'cap') m.position.y = -0.2; if (accs.head.model === 'bunnyEars' || accs.head.model === 'catEars' || accs.head.model === 'antenna') m.position.y = -0.06; });
    put('hair', anchors.hair);
    put('face', anchors.face);
    put('back', accs.back && accs.back.model === 'cape' ? shoulders : back, (m) => { if (accs.back.model === 'wings') m.position.set(0, 0.1, -0.02); });
    put('hand', hand, (m) => { if (accs.hand.model === 'balloon') { m.position.set(0.0, 0, 0); } });
    parts.legL = legL; parts.legR = legR; parts.armL = armL; parts.armR = armR; parts.head = head; parts.eyes = [eyeL, eyeR]; parts.mouth = mouth; parts.live = live;
    // merge rigid pieces (per limb / head) to cut draw calls; blinking eyes and accessories stay separate
    eyeL.userData.keep = true; eyeR.userData.keep = true;
    [anchors.head, anchors.hair, anchors.face, back, shoulders, hand].forEach((a2) => { a2.userData.keep = true; });
    [legL, legR, armL, armR, head].forEach((limb) => mergeStatic(limb));
    g.traverse((o) => { if (o.isMesh && !o.userData.isOutline && !o.userData.noShadow) o.castShadow = true; });
    // x-ray silhouette (shown only when furniture hides the player)
    silhouette.add(at(new Mesh(cachedGeo('silBody', () => new CylinderGeometry(0.3, 0.45, 1.0, 16)), silhouetteMat), 0, 0.55, 0));
    silhouette.add(at(new Mesh(cachedGeo('silHead', () => new SphereGeometry(0.56, 20, 14)), silhouetteMat), 0, 1.52, 0));
    silhouette.children.forEach((m) => { m.renderOrder = 10; });
    body.add(g);
    built = g;
  }

  build(appearance);

  return {
    root,
    setAppearance(a) { build(a); },
    setOccluded(v) { silhouette.visible = v; },
    celebrate() { celebrateT = 1.5; },
    wave(on) { waveT = on ? 1 : 0; },
    get celebrating() { return celebrateT > 0; },
    /**
     * @param speed 0..1 how fast the character is walking
     */
    update(dt, t, speed, reducedMotion) {
      t0 = t;
      phase += dt * (6 + speed * 6) * (speed > 0.05 ? 1 : 0);
      const walk = Math.min(1, speed);
      const swing = Math.sin(phase) * 0.75 * walk;
      parts.legL.rotation.x = swing;
      parts.legR.rotation.x = -swing;
      parts.armL.rotation.x = -swing * 0.8;
      parts.armR.rotation.x = swing * 0.8;
      body.position.y = Math.abs(Math.sin(phase)) * 0.07 * walk;
      body.rotation.x = 0.06 * walk;
      const breathe = reducedMotion ? 0 : Math.sin(t * 2.2) * 0.012;
      body.scale.set(1 - breathe * 0.5, 1 + breathe, 1 - breathe * 0.5);
      parts.head.rotation.z = reducedMotion ? 0 : Math.sin(t * 0.9) * 0.04 * (1 - walk);
      // blink
      blinkT -= dt;
      if (blinkT <= 0 && blinkHold <= 0) { blinkHold = 0.13; blinkT = 2.4 + ((t * 7.3) % 2.6); }
      if (blinkHold > 0) blinkHold -= dt;
      const ey = blinkHold > 0 ? 0.12 : 1;
      parts.eyes.forEach((e) => { e.scale.y = MathUtils.lerp(e.scale.y, ey, 0.6); });
      // wave hello
      if (waveT > 0 && celebrateT <= 0) {
        parts.armR.rotation.z = -2.5;
        parts.armR.rotation.x = Math.sin(t * 7) * 0.35;
      } else if (celebrateT <= 0) {
        parts.armR.rotation.z = -0.12;
      }
      // celebration: two happy hops with a spin
      if (celebrateT > 0) {
        celebrateT = Math.max(0, celebrateT - dt);
        const k = 1.5 - celebrateT;
        const hop = Math.abs(Math.sin((k / 1.5) * Math.PI * 2));
        body.position.y = hop * (reducedMotion ? 0.15 : 0.45);
        body.rotation.y = reducedMotion ? 0 : Math.min(1, k / 0.75) * Math.PI * 2;
        parts.armL.rotation.z = 2.4; parts.armR.rotation.z = -2.4;
        parts.armL.rotation.x = 0; parts.armR.rotation.x = 0;
        if (celebrateT === 0) { body.rotation.y = 0; parts.armL.rotation.z = 0.12; parts.armR.rotation.z = -0.12; }
      }
      // accessory life: wings flap, balloon bobs
      for (const m of parts.live) {
        if (m.userData.flap) m.children.forEach((w) => { w.rotation.y = w.userData.side * (0.25 + Math.sin(t * (reducedMotion ? 2 : 5)) * 0.25); });
        if (m.userData.bob) { m.position.y = Math.sin(t * 1.8) * 0.05; m.rotation.z = Math.sin(t * 1.2) * 0.08; }
      }
      void t0;
    }
  };
}

// ---------- mascot -------------------------------------------------------------
export function createMascot(style) {
  const g = new Group();
  const inner = new Group();
  g.add(inner);
  if (style === 'cloud') {
    [[0, 0, 0, 0.32], [-0.3, -0.06, 0, 0.24], [0.3, -0.06, 0, 0.24], [0.12, 0.2, 0, 0.22]].forEach(([x, y, z, r]) => inner.add(ball(r, '#ffffff', { x, y, z, outline: 0.02 })));
  } else {
    inner.add(star3d(0.36, 0.2, '#ffd84f', { outline: 0.022, matOpts: { emissive: '#ffcf3f', emissiveIntensity: 0.25 } }));
  }
  const fz = style === 'cloud' ? 0.3 : 0.16;
  inner.add(ball(0.045, '#2e1f1a', { x: -0.09, y: 0.02, z: fz, sz: 0.5, outline: 0 }));
  inner.add(ball(0.045, '#2e1f1a', { x: 0.09, y: 0.02, z: fz, sz: 0.5, outline: 0 }));
  inner.add(ball(0.045, '#ff9fb6', { x: -0.16, y: -0.06, z: fz - 0.01, sz: 0.3, outline: 0 }));
  inner.add(ball(0.045, '#ff9fb6', { x: 0.16, y: -0.06, z: fz - 0.01, sz: 0.3, outline: 0 }));
  inner.add(part(cachedGeo('mouth', () => new TorusGeometry(0.055, 0.016, 8, 16, Math.PI)), '#b04a5a', { y: -0.06, z: fz + 0.01, rz: Math.PI, s: 0.7, outline: 0 }));
  inner.traverse((o) => { if (o.isMesh && !o.userData.isOutline) o.castShadow = true; });
  return {
    root: g,
    update(dt, t, target, reducedMotion) {
      if (target) g.position.lerp(target, 1 - Math.exp(-dt * 3));
      inner.position.y = reducedMotion ? 0 : Math.sin(t * 2.1) * 0.1;
      inner.rotation.z = reducedMotion ? 0 : Math.sin(t * 1.3) * 0.12;
    }
  };
}
