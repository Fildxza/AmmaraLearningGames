// The small map in the corner of the screen and the big "tap a place to walk there" map.
import { $, esc, show } from './dom.js';
import { MAP, BUILDING, DOOR, ZONES, POIS, SPAWN, YARD_SPAWN, zoneAt } from '../world/layout.js';
import { t, getLang } from '../i18n.js';
import { tr } from '../core/labels.js';
import { G } from './glyphs.js';

const FONT = 'Fredoka, system-ui, sans-serif';
const W = MAP.maxX - MAP.minX, H = MAP.maxZ - MAP.minZ;

function wrapLines(ctx, text, maxW) {
  const words = String(text).split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export function drawMap(canvas, { player, stations = [], labels = false, lang = getLang(), time = 0 }) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const k = Math.min(w / W, h / H);
  const ox = (w - W * k) / 2, oz = (h - H * k) / 2;
  const X = (x) => ox + (x - MAP.minX) * k, Z = (z) => oz + (z - MAP.minZ) * k;
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  // ground
  ctx.fillStyle = '#d4efc2'; ctx.fillRect(X(BUILDING.maxX), Z(MAP.minZ), (MAP.maxX - BUILDING.maxX) * k, H * k);
  ctx.fillStyle = '#fff1d8'; ctx.fillRect(X(BUILDING.minX), Z(BUILDING.minZ), (BUILDING.maxX - BUILDING.minX) * k, (BUILDING.maxZ - BUILDING.minZ) * k);
  // areas
  for (const z of ZONES) {
    const [x0, z0, x1, z1] = z.rect;
    ctx.globalAlpha = z.area === 'indoor' ? 0.42 : 0.3;
    ctx.fillStyle = z.color;
    ctx.fillRect(X(x0), Z(z0), (x1 - x0) * k, (z1 - z0) * k);
    ctx.globalAlpha = 1;
    ctx.lineWidth = Math.max(1, k * 0.25); ctx.strokeStyle = 'rgba(255,255,255,.95)';
    ctx.strokeRect(X(x0), Z(z0), (x1 - x0) * k, (z1 - z0) * k);
  }
  // building outline and the front door
  ctx.lineWidth = Math.max(2, k * 0.5); ctx.strokeStyle = '#8a5a3c';
  ctx.strokeRect(X(BUILDING.minX), Z(BUILDING.minZ), (BUILDING.maxX - BUILDING.minX) * k, (BUILDING.maxZ - BUILDING.minZ) * k);
  ctx.fillStyle = '#ffb43c'; ctx.fillRect(X(DOOR.x) - k * 0.6, Z(DOOR.z - DOOR.width / 2), k * 1.2, DOOR.width * k);
  // labels (big map only)
  if (labels) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const fs = Math.max(11, Math.round(k * 1.5));
    ctx.font = `600 ${fs}px ${FONT}`;
    for (const z of ZONES) {
      if (z.id === 'hall') continue;
      const [x0, z0, x1, z1] = z.rect;
      const maxW = (x1 - x0) * k - 8;
      const lines = wrapLines(ctx, tr(z.name, lang), maxW);
      const cx = X((x0 + x1) / 2), cy = Z((z0 + z1) / 2) - ((lines.length - 1) * fs * 1.05) / 2 - fs * 0.9;
      lines.forEach((ln, i) => {
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.strokeText(ln, cx, cy + i * fs * 1.05);
        ctx.fillStyle = '#5b3f33'; ctx.fillText(ln, cx, cy + i * fs * 1.05);
      });
    }
    ctx.font = `700 ${Math.round(fs * 1.15)}px ${FONT}`;
    const hall = ZONES[0];
    const hl = tr(hall.name, lang);
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.strokeText(hl, X(0), Z(-6.5)); ctx.fillStyle = '#5b3f33'; ctx.fillText(hl, X(0), Z(-6.5));
  }
  // points of interest
  for (const p of POIS) {
    const z = ZONES.find((q) => q.id === p.zone);
    const major = p.action === 'arcade' || p.action === 'islamic' || p.action === 'wardrobe' || p.action === 'door';
    const r = (major ? 1.45 : 0.95) * k * (labels ? 1.0 : 1.15);
    ctx.beginPath(); ctx.arc(X(p.x), Z(p.z), Math.max(2, r), 0, 7);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.lineWidth = Math.max(1.5, k * 0.35); ctx.strokeStyle = z ? z.color : '#999'; ctx.stroke();
    if (major) { ctx.beginPath(); ctx.arc(X(p.x), Z(p.z), Math.max(1, r * 0.45), 0, 7); ctx.fillStyle = z ? z.color : '#999'; ctx.fill(); }
  }
  // learning stations (stars)
  for (const s of stations) {
    const x = X(s.x), y = Z(s.z), R = Math.max(3.5, k * 1.5);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? R * 0.45 : R; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fillStyle = '#ffd23f'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = '#8a5a3c'; ctx.stroke();
  }
  // the child: a pink arrow that points where they are facing
  if (player) {
    const x = X(player.x), y = Z(player.z), R = Math.max(5, k * 1.9);
    const pulse = 1 + Math.sin(time * 4) * 0.12;
    ctx.beginPath(); ctx.arc(x, y, R * 1.5 * pulse, 0, 7); ctx.fillStyle = 'rgba(255,90,150,.25)'; ctx.fill();
    ctx.translate(x, y); ctx.rotate(Math.PI - player.yaw);       // the arrow points the way the child faces (yaw 0 = towards +z)
    ctx.beginPath(); ctx.moveTo(0, -R * 1.15); ctx.lineTo(R * 0.85, R * 0.85); ctx.lineTo(0, R * 0.4); ctx.lineTo(-R * 0.85, R * 0.85); ctx.closePath();
    ctx.fillStyle = '#ff4f95'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  }
  ctx.restore();
  return { k, ox, oz };
}

export function createMinimap({ onGo, onClose }) {
  const small = $('#hud .minimap canvas');
  const root = $('#map');
  let big = null, last = { player: null, stations: [] }, timer = null, geo = null;

  function render() {
    root.innerHTML = `<div class="dialog-card map-card" role="dialog" aria-modal="true" aria-labelledby="map-title">
      <div class="map-head"><h2 id="map-title">${esc(t('mapTitle'))}</h2><button class="icon-btn" data-act="close" data-testid="map-close" aria-label="${esc(t('close'))}">${G.close}</button></div>
      <p class="map-hint">${esc(t('mapTapHint'))}</p>
      <canvas class="map-big" width="1080" height="396" data-testid="map-canvas"></canvas>
      <div class="map-actions">
        <button class="btn btn-peach" data-act="start" data-testid="map-start">${G.star}<span>${esc(t('goStart'))}</span></button>
        <button class="btn btn-lav" data-act="door" data-testid="map-door">${G.home}<span>${esc(t('goDoor'))}</span></button>
      </div></div>`;
    big = $('.map-big', root);
    paintBig();
  }
  function paintBig() { if (big) geo = drawMap(big, { player: last.player, stations: last.stations, labels: true, time: performance.now() / 1000 }); }

  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (b) {
      if (b.dataset.act === 'close') api.close();
      else if (b.dataset.act === 'start') { api.close(); onGo({ x: SPAWN.x, z: SPAWN.z, kind: 'start' }); }
      else if (b.dataset.act === 'door') { api.close(); onGo({ x: DOOR.x + (last.player && last.player.x > DOOR.x ? 2.4 : -2.4), z: DOOR.z, kind: 'door' }); }
      return;
    }
    if (e.target === big && geo) {
      const r = big.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * big.width, pz = ((e.clientY - r.top) / r.height) * big.height;
      const x = MAP.minX + (px - geo.ox) / geo.k, z = MAP.minZ + (pz - geo.oz) / geo.k;
      if (x < MAP.minX || x > MAP.maxX || z < MAP.minZ || z > MAP.maxZ) return;
      let best = null, bd = 3.5;
      for (const p of POIS) { const d = Math.hypot(p.x - x, p.z - z); if (d < bd) { best = p; bd = d; } }
      api.close();
      if (best) onGo({ x: best.x, z: best.z + best.radius + 0.9, kind: 'poi', id: best.id });
      else {
        const zone = zoneAt(x, z);
        onGo({ x, z, kind: 'zone', id: zone.id });
      }
    }
  });
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); api.close(); } });

  const api = {
    update(player, stations, time) {
      last = { player, stations };
      if (small) drawMap(small, { player, stations, labels: false, time });
    },
    open() {
      render();
      show(root, true);
      timer = setInterval(paintBig, 200);
      setTimeout(() => { const b = $('[data-act="close"]', root); if (b) b.focus(); }, 30);
    },
    close() { show(root, false); root.innerHTML = ''; big = null; if (timer) { clearInterval(timer); timer = null; } if (onClose) onClose(); },
    get isOpen() { return !root.hidden; }
  };
  return api;
}
void YARD_SPAWN;
