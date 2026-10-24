// The four learning stations of the current world: rug, landmark, sign,
// "go here" beacon and "done" medal. Rebuilt only when the world changes.
import { Group, Mesh, MeshBasicMaterial, MeshLambertMaterial, PlaneGeometry, CircleGeometry, Box3 } from 'three';
import { star3d, cone, torus, cyl, group, cachedGeo, disposeObject, mergeStatic } from './kit.js';
import { rugTexture, makeCanvas, canvasTexture, roundRect, svgToImage, tint, grain } from './paint.js';
import { buildLandmark } from './landmarks.js';
import { addCircle, clearTagged } from '../core/collision.js';
import { STATION_SLOTS } from './layout.js';
import { FONT } from '../art/svg.js';

function drawSign(ctx, W, H, n, label, title, color, img, done) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#fffaf1';
  roundRect(ctx, 6, 6, W - 12, H - 12, 56); ctx.fill();
  ctx.lineWidth = 10; ctx.strokeStyle = color; ctx.stroke();
  // number bubble
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(110, H / 2, 74, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  ctx.font = `700 104px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff'; ctx.fillText(String(n), 110, H / 2 + 6);
  if (img) ctx.drawImage(img, 196, H / 2 - 74, 148, 148);
  ctx.textAlign = 'left';
  ctx.fillStyle = tint(color, -0.2);
  ctx.font = `600 44px ${FONT}`;
  ctx.fillText(label, 368, H / 2 - 50);
  let size = 72;
  ctx.font = `700 ${size}px ${FONT}`;
  while (ctx.measureText(title).width > W - 400 && size > 34) { size -= 3; ctx.font = `700 ${size}px ${FONT}`; }
  ctx.fillStyle = '#5b3f33';
  ctx.fillText(title, 366, H / 2 + 26);
  if (done) {
    ctx.fillStyle = '#4cc46a';
    ctx.beginPath(); ctx.arc(W - 60, 60, 44, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(W - 82, 60); ctx.lineTo(W - 64, 78); ctx.lineTo(W - 36, 42); ctx.stroke();
  }
  grain(ctx, W, H, 'stationsign', 0.035);
}

export function createStations(scene, collision) {
  const root = new Group();
  root.name = 'stations';
  scene.add(root);
  let items = [];
  let buildGen = 0;

  function clear() {
    for (const it of items) {
      disposeObject(it.group);
      it.signTex.dispose(); it.signMat.dispose();
      it.padMat.map && it.padMat.map.dispose(); it.padMat.dispose();
      it.ringMat.dispose();
    }
    root.clear();
    items = [];
    clearTagged(collision, 'station');
  }

  /**
   * @param stations  array of 4 station configs (with id, title, color, icon, landmark…)
   * @param labels    { station: 'Stesen' } in the current language
   * @param titleOf   (station) => title text in the current language
   * @param iconSvg   (key) => standalone SVG string
   */
  async function build(stations, label, titleOf, iconSvg) {
    clear();
    const gen = ++buildGen;
    stations.forEach((st, i) => {
      const slot = STATION_SLOTS[i];
      const g = new Group();
      g.position.set(slot.x, 0, slot.z);
      const lm = buildLandmark(st.landmark, st);
      lm.obj.traverse((o) => { o.userData.stationIndex = i; });
      g.add(lm.obj);
      // measure height for the beacon and sign
      lm.obj.updateMatrixWorld(true);
      const top = Math.min(4.2, Math.max(1.6, new Box3().setFromObject(lm.obj).max.y));
      mergeStatic(lm.obj, { stationIndex: i });
      // rug pad
      const padMat = new MeshLambertMaterial({ map: rugTexture(st.color, 'pad' + st.id), transparent: true });
      const pad = new Mesh(cachedGeo('padGeo', () => new CircleGeometry(2.3, 48)), padMat);
      pad.rotation.x = -Math.PI / 2; pad.position.y = 0.018; pad.receiveShadow = true;
      pad.userData.stationIndex = i;
      g.add(pad);
      // glowing ring when active
      const ringMat = new MeshBasicMaterial({ color: '#ffd23f', transparent: true, opacity: 0.85 });
      const ring = new Mesh(cachedGeo('ringGeo', () => torus(2.45, 0.09, '#ffd23f', { outline: 0 }).geometry), ringMat);
      ring.rotation.x = Math.PI / 2; ring.position.y = 0.05; ring.visible = false;
      g.add(ring);
      // sign
      const W = 1024, H = 300;
      const canvas = makeCanvas(W, H);
      const ctx = canvas.getContext('2d');
      const title = titleOf(st);
      drawSign(ctx, W, H, i + 1, `${label} ${i + 1}`, title, st.color, null, false);
      const signTex = canvasTexture(canvas);
      const signMat = new MeshBasicMaterial({ map: signTex, transparent: true });
      const sign = new Mesh(cachedGeo('signGeo', () => new PlaneGeometry(2.9, 0.85)), signMat);
      const back = i < 2;
      sign.position.set(0, top + 0.55, back ? -0.75 : -1.1);
      sign.rotation.x = -0.18;
      sign.renderOrder = 2;
      const post = cyl(0.05, 0.05, sign.position.y, '#c48a5a', { y: sign.position.y / 2, z: sign.position.z - 0.05, outline: 0.01 });
      g.add(post, sign);
      // beacon: a bobbing star and an arrow pointing down
      const beacon = group(star3d(0.42, 0.18, '#ffd23f', { outline: 0.025, matOpts: { emissive: '#ffcf3f', emissiveIntensity: 0.45 } }), cone(0.22, 0.42, '#ffd23f', { y: -0.62, rx: Math.PI, outline: 0.02, matOpts: { emissive: '#ffcf3f', emissiveIntensity: 0.35 } }));
      beacon.position.set(0, top + 1.95, 0.35);
      beacon.visible = false;
      g.add(beacon);
      root.add(g);
      addCircle(collision, slot.x, slot.z, lm.radius, 'station');
      const item = { index: i, station: st, group: g, landmark: lm, pad, padMat, ring, ringMat, sign, signMat, signTex, ctx, canvas, beacon, top, state: 'locked', label: `${label} ${i + 1}`, title, img: null, radius: lm.radius };
      items.push(item);
      // paint the station picture into the sign when it is ready
      svgToImage(iconSvg(st.icon)).then((img) => {
        if (gen !== buildGen) return;
        item.img = img;
        drawSign(ctx, W, H, i + 1, item.label, item.title, st.color, img, item.state === 'done');
        signTex.needsUpdate = true;
      }).catch(() => {});
    });
  }

  function setStates(states) {
    items.forEach((it, i) => {
      const s = states[i] || 'locked';
      const wasDone = it.state === 'done';
      it.state = s;
      it.beacon.visible = s === 'active';
      it.ring.visible = s === 'active' || s === 'open';
      it.ringMat.color.set(s === 'active' ? '#ffd23f' : '#ffe9a8');
      if ((s === 'done') !== wasDone) {
        drawSign(it.ctx, it.canvas.width, it.canvas.height, i + 1, it.label, it.title, it.station.color, it.img, s === 'done');
        it.signTex.needsUpdate = true;
      }
      it.padMat.color.set(s === 'done' ? '#e9fff2' : '#ffffff');
    });
  }

  return {
    root,
    build,
    setStates,
    get items() { return items; },
    positions() { return items.map((it) => ({ x: it.group.position.x, z: it.group.position.z, radius: it.radius })); },
    pickables() { return items.flatMap((it) => [it.landmark.obj, it.pad, it.sign]); },
    occluders() { return items.map((it) => it.landmark.obj); },
    update(t, reducedMotion) {
      for (const it of items) {
        if (it.landmark.update && !reducedMotion) it.landmark.update(t);
        if (it.beacon.visible) {
          it.beacon.position.y = it.top + 1.95 + (reducedMotion ? 0 : Math.sin(t * 2.6) * 0.18);
          it.beacon.children[0].rotation.y = reducedMotion ? 0 : t * 1.4;
        }
        if (it.ring.visible) it.ringMat.opacity = reducedMotion ? 0.8 : 0.55 + Math.sin(t * 3) * 0.3;
      }
    },
    dispose: clear
  };
}
