// Particle effects: confetti bursts, floating sparkles and the yellow guide arrow.
import { InstancedMesh, PlaneGeometry, MeshBasicMaterial, Object3D, Color, DoubleSide, Points, BufferGeometry, Float32BufferAttribute, PointsMaterial, AdditiveBlending, Mesh, Shape, ShapeGeometry, Vector3 } from 'three';
import { sparkleTexture } from './paint.js';

const CONFETTI_COLORS = ['#ff6b9f', '#ffd23f', '#6cc4ff', '#5fd6a8', '#b79cff', '#ffa86b'];

export function createEffects(scene) {
  // ---- confetti --------------------------------------------------------------
  const MAX = 220;
  const conf = new InstancedMesh(new PlaneGeometry(0.12, 0.2), new MeshBasicMaterial({ side: DoubleSide }), MAX);
  conf.frustumCulled = false;
  const parts = [];
  const tmp = new Object3D();
  const col = new Color();
  for (let i = 0; i < MAX; i++) {
    parts.push({ p: new Vector3(), v: new Vector3(), r: new Vector3(), w: new Vector3(), life: 0 });
    conf.setColorAt(i, col.set(CONFETTI_COLORS[i % CONFETTI_COLORS.length]));
    tmp.position.set(0, -50, 0); tmp.updateMatrix(); conf.setMatrixAt(i, tmp.matrix);
  }
  scene.add(conf);
  let next = 0;
  let activeConfetti = 0;

  function burst(x, y, z, count = 120, gentle = false) {
    for (let k = 0; k < count; k++) {
      const pt = parts[next];
      next = (next + 1) % MAX;
      pt.p.set(x + (Math.random() - 0.5) * 0.4, y, z + (Math.random() - 0.5) * 0.4);
      const a = Math.random() * Math.PI * 2, s = gentle ? 1.2 + Math.random() * 1.2 : 2 + Math.random() * 3;
      pt.v.set(Math.cos(a) * s, (gentle ? 2.5 : 4.5) + Math.random() * 3, Math.sin(a) * s);
      pt.r.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      pt.w.set((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9);
      pt.life = 2.2 + Math.random() * 0.8;
    }
    activeConfetti = 3.2;
  }

  // ---- sparkles around the active station ----------------------------------------
  const SP = 40;
  const spGeo = new BufferGeometry();
  const spPos = new Float32Array(SP * 3);
  const spSeed = new Float32Array(SP);
  for (let i = 0; i < SP; i++) spSeed[i] = Math.random();
  spGeo.setAttribute('position', new Float32BufferAttribute(spPos, 3));
  const spMat = new PointsMaterial({ size: 0.36, map: sparkleTexture(), transparent: true, depthWrite: false, blending: AdditiveBlending, color: '#fff2b0' });
  const sparkles = new Points(spGeo, spMat);
  sparkles.frustumCulled = false;
  sparkles.visible = false;
  scene.add(sparkles);
  let spCenter = null;

  // ---- floor guide arrow ------------------------------------------------------------
  const s = new Shape();
  s.moveTo(0, 1.05); s.lineTo(0.75, 0.15); s.lineTo(0.28, 0.15); s.lineTo(0.28, -0.7); s.lineTo(-0.28, -0.7); s.lineTo(-0.28, 0.15); s.lineTo(-0.75, 0.15); s.closePath();
  const arrowMat = new MeshBasicMaterial({ color: '#ffc21a', transparent: true, opacity: 0.95, depthWrite: false });
  const arrow = new Mesh(new ShapeGeometry(s), arrowMat);
  arrow.rotation.x = -Math.PI / 2;
  arrow.position.y = 0.04;
  arrow.renderOrder = 3;
  arrow.visible = false;
  scene.add(arrow);

  return {
    burst,
    setSparkles(center) { spCenter = center; sparkles.visible = !!center; },
    /** Points the arrow from the player towards a target; hides it when close. */
    guide(px, pz, tx, tz, show) {
      if (!show) { arrow.visible = false; return; }
      const dx = tx - px, dz = tz - pz;
      const d = Math.hypot(dx, dz);
      if (d < 3.6) { arrow.visible = false; return; }
      arrow.visible = true;
      const ux = dx / d, uz = dz / d;
      arrow.position.set(px + ux * 1.7, 0.04, pz + uz * 1.7);
      arrow.rotation.z = Math.atan2(-ux, -uz);
    },
    get arrowVisible() { return arrow.visible; },
    update(dt, t, reducedMotion) {
      if (activeConfetti > 0) {
        activeConfetti -= dt;
        for (let i = 0; i < MAX; i++) {
          const pt = parts[i];
          if (pt.life <= 0) continue;
          pt.life -= dt;
          pt.v.y -= 6.5 * dt;
          pt.v.multiplyScalar(1 - 1.2 * dt);
          pt.p.addScaledVector(pt.v, dt);
          if (pt.p.y < 0.03) { pt.p.y = 0.03; pt.v.set(0, 0, 0); }
          pt.r.addScaledVector(pt.w, dt * (pt.p.y > 0.04 ? 1 : 0));
          tmp.position.copy(pt.p);
          tmp.rotation.set(pt.r.x, pt.r.y, pt.r.z);
          tmp.scale.setScalar(pt.life < 0.5 ? Math.max(0.001, pt.life * 2) : 1);
          if (pt.life <= 0) tmp.position.set(0, -50, 0);
          tmp.updateMatrix();
          conf.setMatrixAt(i, tmp.matrix);
        }
        conf.instanceMatrix.needsUpdate = true;
      }
      if (sparkles.visible && spCenter) {
        for (let i = 0; i < SP; i++) {
          const k = (spSeed[i] + t * (reducedMotion ? 0.05 : 0.18)) % 1;
          const a = spSeed[i] * 40 + t * 0.3;
          const r = 1.2 + (spSeed[(i + 7) % SP]) * 1.3;
          spPos[i * 3] = spCenter.x + Math.cos(a) * r;
          spPos[i * 3 + 1] = 0.3 + k * 3.2;
          spPos[i * 3 + 2] = spCenter.z + Math.sin(a) * r;
        }
        spGeo.attributes.position.needsUpdate = true;
        spMat.opacity = 0.9;
      }
      if (arrow.visible) arrowMat.opacity = reducedMotion ? 0.95 : 0.78 + Math.sin(t * 4) * 0.2;
    }
  };
}
