// A tiny geometry writer: boxes, gable roofs, domes, cylinders and flat quads straight into one vertex-coloured
// BufferGeometry, so a whole part of the town is one draw call (plus its outline).
import { BufferGeometry, Float32BufferAttribute, Color } from 'three';

const col = new Color();
export class Geo {
  constructor() { this.p = []; this.n = []; this.c = []; }
  get empty() { return this.p.length === 0; }
  /** Quad from 4 corners; the winding is fixed automatically so the face looks towards `nrm`. */
  quad(a, b, c, d, nrm, hex) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const flip = (uy * vz - uz * vy) * nrm[0] + (uz * vx - ux * vz) * nrm[1] + (ux * vy - uy * vx) * nrm[2] < 0;
    col.set(hex);
    const pts = flip ? [a, c, b, a, d, c] : [a, b, c, a, c, d];
    for (const q of pts) { this.p.push(q[0], q[1], q[2]); this.n.push(nrm[0], nrm[1], nrm[2]); this.c.push(col.r, col.g, col.b); }
    return this;
  }
  tri(a, b, c, nrm, hex) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const flip = (uy * vz - uz * vy) * nrm[0] + (uz * vx - ux * vz) * nrm[1] + (ux * vy - uy * vx) * nrm[2] < 0;
    col.set(hex);
    for (const q of flip ? [a, c, b] : [a, b, c]) { this.p.push(q[0], q[1], q[2]); this.n.push(nrm[0], nrm[1], nrm[2]); this.c.push(col.r, col.g, col.b); }
    return this;
  }
  /** Flat rectangle lying on the ground at height y. */
  flat(x0, z0, x1, z1, y, hex) { return this.quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [0, 1, 0], hex); }
  /** Axis-aligned box from (x0,y0,z0) to (x1,y1,z1); no bottom face. */
  box(x0, y0, z0, x1, y1, z1, hex, { top = true } = {}) {
    if (top) this.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0], hex);
    this.quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], [1, 0, 0], hex);
    this.quad([x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1], [-1, 0, 0], hex);
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], hex);
    this.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [0, 0, -1], hex);
    return this;
  }
  /** Box by centre and size. */
  cbox(x, y0, z, w, h, d, hex, o) { return this.box(x - w / 2, y0, z - d / 2, x + w / 2, y0 + h, z + d / 2, hex, o); }
  /** Pitched roof over the rectangle; the ridge runs along x (alongX) or z. */
  gable(x0, z0, x1, z1, y, h, hex, alongX, gableHex) {
    const o = 0.45;
    x0 -= o; z0 -= o; x1 += o; z1 += o;
    if (alongX) {
      const zm = (z0 + z1) / 2, s = Math.hypot(h, (z1 - z0) / 2);
      this.quad([x0, y, z0], [x1, y, z0], [x1, y + h, zm], [x0, y + h, zm], [0, (z1 - z0) / 2 / s, -h / s], hex);
      this.quad([x0, y, z1], [x0, y + h, zm], [x1, y + h, zm], [x1, y, z1], [0, (z1 - z0) / 2 / s, h / s], hex);
      this.tri([x0 + o, y, z0 + o], [x0 + o, y + h, zm], [x0 + o, y, z1 - o], [-1, 0, 0], gableHex || hex);
      this.tri([x1 - o, y, z0 + o], [x1 - o, y + h, zm], [x1 - o, y, z1 - o], [1, 0, 0], gableHex || hex);
    } else {
      const xm = (x0 + x1) / 2, s = Math.hypot(h, (x1 - x0) / 2);
      this.quad([x0, y, z0], [x0, y, z1], [xm, y + h, z1], [xm, y + h, z0], [-h / s, (x1 - x0) / 2 / s, 0], hex);
      this.quad([x1, y, z0], [xm, y + h, z0], [xm, y + h, z1], [x1, y, z1], [h / s, (x1 - x0) / 2 / s, 0], hex);
      this.tri([x0 + o, y, z0 + o], [xm, y + h, z0 + o], [x1 - o, y, z0 + o], [0, 0, -1], gableHex || hex);
      this.tri([x0 + o, y, z1 - o], [xm, y + h, z1 - o], [x1 - o, y, z1 - o], [0, 0, 1], gableHex || hex);
    }
    return this;
  }
  /** Upright cylinder (sides + top). */
  cyl(x, y0, z, r, h, hex, seg = 10, rTop = r) {
    for (let k = 0; k < seg; k++) {
      const a0 = (k / seg) * Math.PI * 2, a1 = ((k + 1) / seg) * Math.PI * 2, am = (a0 + a1) / 2;
      this.quad([x + Math.cos(a0) * r, y0, z + Math.sin(a0) * r], [x + Math.cos(a1) * r, y0, z + Math.sin(a1) * r], [x + Math.cos(a1) * rTop, y0 + h, z + Math.sin(a1) * rTop], [x + Math.cos(a0) * rTop, y0 + h, z + Math.sin(a0) * rTop], [Math.cos(am), 0, Math.sin(am)], hex);
      if (rTop > 0) this.tri([x, y0 + h, z], [x + Math.cos(a0) * rTop, y0 + h, z + Math.sin(a0) * rTop], [x + Math.cos(a1) * rTop, y0 + h, z + Math.sin(a1) * rTop], [0, 1, 0], hex);
    }
    return this;
  }
  /** Half sphere (dome) sitting at height y. */
  dome(x, y, z, r, hex, seg = 12, rings = 5, lower = false) {
    const sg = lower ? -1 : 1;
    for (let i = 0; i < rings; i++) {
      const b0 = sg * (i / rings) * (Math.PI / 2), b1 = sg * ((i + 1) / rings) * (Math.PI / 2);
      for (let k = 0; k < seg; k++) {
        const a0 = (k / seg) * Math.PI * 2, a1 = ((k + 1) / seg) * Math.PI * 2;
        const P = (a, b) => [x + Math.cos(a) * Math.cos(b) * r, y + Math.sin(b) * r, z + Math.sin(a) * Math.cos(b) * r];
        const am = (a0 + a1) / 2, bm = (b0 + b1) / 2;
        this.quad(P(a0, b0), P(a1, b0), P(a1, b1), P(a0, b1), [Math.cos(am) * Math.cos(bm), Math.sin(bm), Math.sin(am) * Math.cos(bm)], hex);
      }
    }
    return this;
  }
  /** Ball made of a few faces (lamp heads, bushes). */
  ball(x, y, z, r, hex) { this.dome(x, y, z, r, hex, 8, 3); this.dome(x, y, z, r, hex, 8, 3, true); return this; }
  geometry() {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new Float32BufferAttribute(this.c, 3));
    g.computeBoundingSphere();
    return g;
  }
}
