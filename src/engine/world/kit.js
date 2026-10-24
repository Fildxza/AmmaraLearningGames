// Small modelling kit: rounded boxes, balls, cylinders, stars and hearts with
// toon shading and an optional soft outline. Geometries are cached and shared.
import {
  Group, Mesh, SphereGeometry, CylinderGeometry, ConeGeometry, TorusGeometry, CapsuleGeometry, PlaneGeometry, CircleGeometry,
  ExtrudeGeometry, Shape, Matrix4, Float32BufferAttribute
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { toon, outlineMaterial, basic, toonVertexMaterial, isPlainToon } from './paint.js';

const geos = new Map();
export function cachedGeo(key, make) {
  let g = geos.get(key);
  if (!g) { g = make(); geos.set(key, g); }
  return g;
}

/**
 * Wraps a geometry into a toon mesh. opts: position/rotation/scale, outline thickness, shadow, material.
 */
export function part(geometry, color, o = {}) {
  const mat = o.material || toon(color, o.matOpts || {});
  const m = new Mesh(geometry, mat);
  m.position.set(o.x || 0, o.y || 0, o.z || 0);
  m.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0);
  if (o.s !== undefined) m.scale.setScalar(o.s);
  if (o.sx || o.sy || o.sz) m.scale.set(o.sx || 1, o.sy || 1, o.sz || 1);
  if (!geometry.boundingSphere) geometry.computeBoundingSphere();
  const sc = o.s !== undefined ? o.s : Math.max(o.sx || 1, o.sy || 1, o.sz || 1);
  // tiny details never cast shadows (saves a draw call each in the shadow pass)
  m.castShadow = o.shadow !== false && o.castShadow !== false && geometry.boundingSphere.radius * sc > 0.16;
  m.receiveShadow = !!o.receive;
  const outline = o.outline === undefined ? 0.025 : o.outline;
  // an outline on something smaller than a thumbnail is invisible, so it is skipped (it would double the triangles)
  if (outline > 0 && geometry.boundingSphere.radius * sc > 0.075) {
    const ol = new Mesh(geometry, outlineMaterial(outline));
    ol.castShadow = false;
    ol.userData.isOutline = true;
    m.add(ol);
  }
  return m;
}

const r2 = (v) => Math.round(v * 1000) / 1000;
export const box = (w, h, d, color, o = {}) => {
  const r = Math.min(o.r !== undefined ? o.r : 0.08, w / 2.01, h / 2.01, d / 2.01);
  // small boxes need fewer corner segments (a big scene is mostly small boxes)
  const seg = Math.min(w, h, d) < 0.3 || r < 0.04 ? 1 : Math.max(w, h, d) < 1.6 ? 2 : 3;
  return part(cachedGeo(`rb${r2(w)}_${r2(h)}_${r2(d)}_${r2(r)}_${seg}`, () => new RoundedBoxGeometry(w, h, d, seg, r)), color, o);
};
const segFor = (r) => (r < 0.08 ? 6 : r < 0.18 ? 10 : r < 0.45 ? 14 : 20);
export const ball = (r, color, o = {}) => { const sg = o.seg || segFor(r); return part(cachedGeo(`sp${r2(r)}_${sg}`, () => new SphereGeometry(r, sg, Math.max(6, Math.round(sg * 0.66)))), color, o); };
export const cyl = (rt, rb, h, color, o = {}) => { const sg = o.seg || (Math.max(rt, rb) < 0.1 ? 8 : Math.max(rt, rb) < 0.35 ? 14 : 22); return part(cachedGeo(`cy${r2(rt)}_${r2(rb)}_${r2(h)}_${sg}_${o.open ? 1 : 0}`, () => new CylinderGeometry(rt, rb, h, sg, 1, !!o.open)), color, o); };
export const cone = (r, h, color, o = {}) => part(cachedGeo(`co${r2(r)}_${r2(h)}_${o.seg || 24}`, () => new ConeGeometry(r, h, o.seg || 24)), color, o);
export const torus = (R, t, color, o = {}) => part(cachedGeo(`to${r2(R)}_${r2(t)}_${r2(o.arc || 6.2832)}`, () => new TorusGeometry(R, t, t < 0.05 ? 6 : 10, R < 0.3 ? 18 : 28, o.arc || Math.PI * 2)), color, o);
export const capsule = (r, len, color, o = {}) => part(cachedGeo(`ca${r2(r)}_${r2(len)}`, () => new CapsuleGeometry(r, len, 6, 14)), color, o);

function starShape(R, r, n = 5) {
  const s = new Shape();
  for (let i = 0; i < n * 2; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / n;
    const rr = i % 2 === 0 ? R : r;
    if (i === 0) s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); else s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  s.closePath();
  return s;
}
function heartShape(sz) {
  const s = new Shape();
  s.moveTo(0, -sz * 0.9);
  s.bezierCurveTo(-sz * 1.3, -sz * 0.1, -sz * 1.05, sz * 1.05, 0, sz * 0.45);
  s.bezierCurveTo(sz * 1.05, sz * 1.05, sz * 1.3, -sz * 0.1, 0, -sz * 0.9);
  return s;
}
const extrude = (shape, depth, bevel) => {
  const g = new ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 12 });
  g.center();
  g.computeVertexNormals();
  return g;
};
export const star3d = (R, depth, color, o = {}) => part(cachedGeo(`st${r2(R)}_${r2(depth)}`, () => extrude(starShape(R, R * 0.48), depth, depth * 0.35)), color, o);
export const heart3d = (sz, depth, color, o = {}) => part(cachedGeo(`he${r2(sz)}_${r2(depth)}`, () => extrude(heartShape(sz), depth, depth * 0.4)), color, o);
export const prism = (w, h, d, color, o = {}) => {
  const g = cachedGeo(`pr${r2(w)}_${r2(h)}_${r2(d)}`, () => {
    const s = new Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
    return extrude(s, d, 0.03);
  });
  return part(g, color, o);
};

// Flat textured plane (labels, letters, posters). Unlit so colours stay true.
export function decal(texture, w, h, o = {}) {
  const m = new Mesh(cachedGeo(`pl${r2(w)}_${r2(h)}`, () => new PlaneGeometry(w, h)), basic(0xffffff, { map: texture, transparent: true, depthWrite: o.depthWrite !== undefined ? o.depthWrite : true }));
  m.position.set(o.x || 0, o.y || 0, o.z || 0);
  m.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0);
  m.renderOrder = o.renderOrder || 0;
  return m;
}
export function disc(r, material, o = {}) {
  const m = new Mesh(cachedGeo(`ci${r2(r)}`, () => new CircleGeometry(r, 48)), material);
  m.rotation.x = -Math.PI / 2;
  m.position.set(o.x || 0, o.y || 0.01, o.z || 0);
  m.receiveShadow = o.receive !== false;
  return m;
}
export const group = (...children) => { const g = new Group(); children.forEach((c) => c && g.add(c)); return g; };
export function at(obj, x, y, z, ry = 0) { obj.position.set(x, y, z); obj.rotation.y = ry; return obj; }

export function disposeObject(obj) {
  obj.traverse((o) => {
    if (o.userData && o.userData.ownGeometry && o.geometry) o.geometry.dispose();
    if (o.userData && o.userData.ownMaterial && o.material) {
      if (o.material.map) o.material.map.dispose();
      o.material.dispose();
    }
  });
}

// Marks an object (and its children) as animated so mergeStatic leaves it alone.
export function live(obj) { obj.userData.keep = true; return obj; }

/**
 * Merges every static mesh under `root` that shares a material into one mesh,
 * cutting draw calls. Animated (live), instanced, picked or specially sorted
 * objects are left untouched. Returns the number of meshes removed.
 */
export function mergeStatic(root, extra = {}) {
  root.updateMatrixWorld(true);
  const inv = new Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map();
  const victims = [];
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.renderOrder !== 0 || o.userData.ownMaterial) return;
    for (let p = o; p && p !== root.parent; p = p.parent) if (p.userData.keep) return;
    const mat = o.material;
    if (Array.isArray(mat)) return;
    const g = o.geometry;
    if (!g.attributes.position || !g.attributes.normal) return;
    const m = new Matrix4().multiplyMatrices(inv, o.matrixWorld);
    let geo = g.index ? g.toNonIndexed() : g.clone();
    for (const name of Object.keys(geo.attributes)) if (name !== 'position' && name !== 'normal' && name !== 'uv') geo.deleteAttribute(name);
    if (!geo.attributes.uv) geo.setAttribute('uv', new Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    geo.clearGroups();
    geo.applyMatrix4(m);
    // plain coloured toon parts all share one vertex-coloured material (one bucket per shadow setting)
    const plain = isPlainToon(mat);
    if (plain) {
      const n = geo.attributes.position.count, rgb = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { rgb[i * 3] = mat.color.r; rgb[i * 3 + 1] = mat.color.g; rgb[i * 3 + 2] = mat.color.b; }
      geo.setAttribute('color', new Float32BufferAttribute(rgb, 3));
    }
    const key = plain ? `vc|${o.castShadow ? 1 : 0}${o.receiveShadow ? 1 : 0}` : mat.uuid;
    if (!buckets.has(key)) buckets.set(key, { mat: plain ? toonVertexMaterial() : mat, geos: [], victims: [], cast: false, receive: false, outline: !!o.userData.isOutline });
    const b = buckets.get(key);
    b.geos.push(geo);
    b.victims.push(o);
    b.cast = b.cast || o.castShadow;
    b.receive = b.receive || o.receiveShadow;
    victims.push(o);
  });
  let removed = 0;
  for (const b of buckets.values()) {
    if (b.geos.length < 2) { b.geos.forEach((g) => g.dispose()); continue; }
    const merged = mergeGeometries(b.geos, false);
    b.geos.forEach((g) => g.dispose());
    if (!merged) continue;
    const mesh = new Mesh(merged, b.mat);
    mesh.castShadow = b.cast && !b.outline;
    mesh.receiveShadow = b.receive;
    mesh.userData.ownGeometry = true;
    mesh.userData.isOutline = b.outline;
    Object.assign(mesh.userData, extra);
    root.add(mesh);
    removed += b.geos.length - 1;
    for (const v of b.victims) v.userData.merged = true;
  }
  for (const v of victims) {
    if (!v.userData.merged) continue;
    for (const c of [...v.children]) if (!c.userData.merged) root.attach(c);
    v.parent && v.parent.remove(v);
  }
  // drop groups that are now empty
  const empties = [];
  root.traverse((o) => { if (o !== root && o.type === 'Group' && o.children.length === 0 && !o.userData.keep) empties.push(o); });
  empties.forEach((e) => e.parent && e.parent.remove(e));
  return removed;
}
