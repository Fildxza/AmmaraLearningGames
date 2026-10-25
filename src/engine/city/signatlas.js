// All the little shop signs of the shophouse streets painted into one texture ("atlas"), so a whole street of signs
// is a single draw call. The names are in Bahasa Melayu, as on real Malaysian shop fronts.
import { BufferGeometry, Float32BufferAttribute, MeshBasicMaterial } from 'three';
import { makeCanvas, canvasTexture, roundRect, tint, svgToImage } from '../world/paint.js';
import { FONT } from '../art/svg.js';

export const SHOP_SIGN_LIST = [
  ['Kedai Roti', 'bread', '#e8a64a'], ['Kedai Buah', 'banana', '#ffb400'], ['Kedai Kasut', 'sneaker', '#ff6b6b'], ['Kedai Basikal', 'bicycle', '#4a90e2'],
  ['Farmasi', 'medicine', '#3fa64a'], ['Kedai Cermin Mata', 'eye', '#9b6bff'], ['Kedai Gunting Rambut', 'comb', '#ff7eb6'], ['Kedai Kek', 'cake', '#ff8fc0'],
  ['Kedai Kopi', 'cup', '#8a5a3c'], ['Restoran Nasi', 'rice_plate', '#ff9a3c'], ['Kedai Mainan', 'teddy', '#ff9ad5'], ['Kedai Buku', 'book', '#9b6bff'],
  ['Kedai Bunga', 'flower', '#ff6fa8'], ['Kedai Haiwan', 'cat', '#ffb43c'], ['Kedai Jahit', 'shirt', '#4a5bb5'], ['Kedai Kain', 'dress', '#e86fa8'],
  ['Dobi', 'clean_clothes', '#4fb8e8'], ['Klinik Gigi', 'tooth', '#3fc8d8'], ['Kedai Runcit', 'shopping_bag', '#4cc46a'], ['Kedai Aiskrim', 'ice_cream', '#ff8fc0'],
  ['Kedai Ikan', 'fish', '#4a90e2'], ['Kedai Sayur', 'carrot', '#3fa64a'], ['Kedai Payung', 'umbrella', '#9b6bff'], ['Kedai Topi', 'hat', '#ff9a3c'],
  ['Kedai Beg', 'bag', '#b07a52'], ['Kedai Jam', 'clock', '#8f86e8'], ['Kedai Lukisan', 'paint_palette', '#ff6b6b'], ['Kedai Muzik', 'bubble:♪ ♫', '#ff6fa8'],
  ['Kedai Sukan', 'basketball', '#ff9a3c'], ['Kedai Lampu', 'lamp', '#f2b632'], ['Kedai Stoking', 'sock', '#7fcbff'], ['Kedai Gula-gula', 'lollipop', '#ff7eb6'],
  ['Kedai Biskut', 'cookie', '#c98a52'], ['Kedai Susu', 'milk_box', '#4fb8e8'], ['Kedai Teh', 'cup', '#3fa64a'], ['Kedai Piza', 'pizza', '#ff6b6b'],
  ['Kedai Mi', 'noodles', '#ff9a3c'], ['Kedai Sate', 'satay', '#b8682e'], ['Kedai Batik', 'shirt', '#e86fa8'], ['Kedai Layang-layang', 'kite', '#4a90e2']
];
const COLS = 4, CW = 256, CH = 96;
const ROWS = Math.ceil(SHOP_SIGN_LIST.length / COLS);

/** Paints the atlas once. Returns { material, uv(k) } where uv gives [u0, v0, u1, v1] of sign k. */
export function createSignAtlas(iconSvg) {
  const canvas = makeCanvas(COLS * CW, ROWS * CH);
  const ctx = canvas.getContext('2d');
  const tex = canvasTexture(canvas);
  const icons = new Array(SHOP_SIGN_LIST.length).fill(null);
  function paint(k) {
    const [name, , color] = SHOP_SIGN_LIST[k];
    const x = (k % COLS) * CW, y = Math.floor(k / COLS) * CH;
    ctx.clearRect(x, y, CW, CH);
    ctx.fillStyle = color; roundRect(ctx, x + 3, y + 3, CW - 6, CH - 6, 18); ctx.fill();
    ctx.fillStyle = '#fffaf1'; roundRect(ctx, x + 10, y + 10, CW - 20, CH - 20, 12); ctx.fill();
    if (icons[k]) ctx.drawImage(icons[k], x + 14, y + 14, CH - 28, CH - 28);
    let size = 30;
    ctx.font = `700 ${size}px ${FONT}`;
    const room = CW - CH - 12;
    while (ctx.measureText(name).width > room && size > 14) { size -= 2; ctx.font = `700 ${size}px ${FONT}`; }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.18; ctx.strokeStyle = '#ffffff'; ctx.strokeText(name, x + CH - 8 + room / 2, y + CH / 2 + 2);
    ctx.fillStyle = tint(color, -0.25); ctx.fillText(name, x + CH - 8 + room / 2, y + CH / 2 + 2);
    tex.needsUpdate = true;
  }
  SHOP_SIGN_LIST.forEach((_, k) => paint(k));
  if (iconSvg) SHOP_SIGN_LIST.forEach(([, key], k) => svgToImage(iconSvg(key)).then((img) => { icons[k] = img; paint(k); }).catch(() => {}));
  const material = new MeshBasicMaterial({ map: tex });
  return {
    material,
    uv(k) {
      const c = k % COLS, r = Math.floor(k / COLS);
      return [c / COLS, 1 - (r + 1) / ROWS, (c + 1) / COLS, 1 - r / ROWS];
    }
  };
}

/** Collects textured sign quads for one chunk; geometry() makes one mesh of them. */
export class SignGeo {
  constructor() { this.p = []; this.uv = []; this.n = []; }
  get empty() { return this.p.length === 0; }
  /** A sign facing +z (south) centred at (x, y, z), w x h metres, showing atlas cell uv. */
  south(x, y, z, w, h, uv) {
    const [u0, v0, u1, v1] = uv, a = [x - w / 2, y - h / 2, z], b = [x + w / 2, y - h / 2, z], c = [x + w / 2, y + h / 2, z], d = [x - w / 2, y + h / 2, z];
    for (const [q, t] of [[a, [u0, v0]], [b, [u1, v0]], [c, [u1, v1]], [a, [u0, v0]], [c, [u1, v1]], [d, [u0, v1]]]) { this.p.push(...q); this.uv.push(...t); this.n.push(0, 0, 1); }
  }
  geometry() {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new Float32BufferAttribute(this.uv, 2));
    g.computeBoundingSphere();
    return g;
  }
}
