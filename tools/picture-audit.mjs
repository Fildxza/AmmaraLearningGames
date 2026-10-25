// Renders EVERY picture the game can show (questions, answers, worlds, stations, stickers, mini-games, 3D places)
// in Chrome, measures how much each one really draws, and flags blank / "?"-box / nearly empty pictures.
// Usage: node tools/picture-audit.mjs            -> qa/picture-audit.json + qa/screenshots/picture-audit-*.png
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CHROME } from './lib/browsers.mjs';
import { validated } from '../tests/unit/helpers.mjs';
import { iconSVG, SVG_DEFS } from '../src/engine/art/icons.js';
import { POIS, ZONES } from '../src/engine/world/layout.js';
import { LANDMARKS, DISTRICTS, cityPois } from '../src/engine/city/plan.js';
import { MEMORY_KEYS, COUNT_ITEMS, FIND_THEMES, SHAPE_SETS, SORT_SETS } from '../src/engine/minigames/logic.js';
import { GAMES } from '../src/engine/minigames/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { config } = validated();
const uses = new Map();
const add = (k, where) => { if (!k) return; if (!uses.has(k)) uses.set(k, new Set()); uses.get(k).add(where); };
for (const q of config.questions) { if (q.art) add(q.art, `question ${q.id} (picture)`); q.choices.forEach((c) => add(c, `question ${q.id} (answer)`)); }
for (const k of Object.keys(config.answerChoices)) add(k, 'answer list');
for (const [id, r] of Object.entries(config.rewards)) if (r.type === 'sticker') add(r.icon, `sticker ${id}`);
for (const w of config.worlds) { add(w.icon, `world ${w.id}`); (w.posters || []).forEach((p) => add(p, `world ${w.id} poster`)); }
for (const [id, s] of Object.entries(config.stations)) add(s.icon, `station ${id}`);
for (const g of GAMES) add(g.icon, `game ${g.id}`);
MEMORY_KEYS.forEach((k) => add(k, 'memory cards'));
COUNT_ITEMS.forEach((k) => add(`count:${k}:3`, 'counting game'));
Object.entries(FIND_THEMES).forEach(([t, ks]) => ks.forEach((k) => add(k, `find-it ${t}`)));
Object.values(SHAPE_SETS).flat().forEach((k) => add('shape:' + k, 'shape puzzle'));
Object.values(SORT_SETS).flat().forEach((s) => [...s.bins, ...s.items].forEach((k) => add(k, 'sorting game')));
POIS.forEach((p) => add(p.icon, `3D place ${p.id}`));
ZONES.forEach((z) => add(z.icon, `3D area ${z.id}`));
LANDMARKS.forEach((l) => add(l.icon, `town landmark ${l.id}`));
Object.entries(DISTRICTS).forEach(([id, d]) => add(d.icon, `town district ${id}`));
cityPois().forEach((p) => add(p.icon, `town place ${p.id}`));
add('star', 'town map: back to preschool');
const extra = process.env.AUDIT_EXTRA ? JSON.parse(fs.readFileSync(process.env.AUDIT_EXTRA, 'utf8')) : [];
extra.forEach(([k, w]) => add(k, w));

const keys = [...uses.keys()];
const svgs = keys.map((k) => iconSVG(k, { cls: '', standalone: true, fx: false }));
const qbox = iconSVG('__definitely_unknown__', { cls: '', standalone: true, fx: false });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 900 });
await page.goto('about:blank');
// draw each picture as a standalone image (exactly how 3D textures load them) and measure ink
const res = await page.evaluate(async (svgs, qbox) => {
  const load = (s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s); });
  const c = document.createElement('canvas'); c.width = c.height = 96; const x = c.getContext('2d', { willReadFrequently: true });
  const measure = async (s) => {
    const img = await load(s);
    if (!img) return { ok: false };
    x.clearRect(0, 0, 96, 96); x.drawImage(img, 0, 0, 96, 96);
    const d = x.getImageData(0, 0, 96, 96).data;
    let ink = 0; const colors = new Set();
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 40) { ink++; colors.add(((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4)); }
    return { ok: true, ink: ink / (96 * 96), colors: colors.size, hash: Array.from(d.filter((_, i) => i % 97 === 0)).join(',').length + ':' + ink };
  };
  const q = await measure(qbox);
  const out = [];
  for (const s of svgs) out.push(await measure(s));
  return { q, out };
}, svgs, qbox);
const report = keys.map((k, i) => {
  const r = res.out[i];
  const issue = !r.ok ? 'FAILS TO LOAD' : r.hash === res.q.hash ? 'QUESTION-MARK BOX (no drawing)' : r.ink < 0.04 ? 'ALMOST EMPTY' : r.colors < 3 ? 'ONE-COLOUR / BLANK' : null;
  return { key: k, ink: r.ok ? +r.ink.toFixed(3) : 0, colors: r.colors || 0, issue, usedIn: [...uses.get(k)].slice(0, 6) };
});
const bad = report.filter((r) => r.issue);
fs.writeFileSync(path.join(root, 'qa/picture-audit.json'), JSON.stringify({ date: new Date().toISOString(), total: report.length, problems: bad, all: report }, null, 1));
// contact sheets of every picture (inline, as the quiz shows them) for a human look
const per = 120, cols = 12;
fs.mkdirSync(path.join(root, 'qa/screenshots'), { recursive: true });
for (let s = 0; s * per < keys.length; s++) {
  const part = keys.slice(s * per, (s + 1) * per);
  const html = `<html><body style="margin:0;font:10px sans-serif;background:#fff"><svg width="0" height="0" style="position:absolute"><defs>${SVG_DEFS}</defs></svg><div style="display:grid;grid-template-columns:repeat(${cols},96px);gap:2px">${part.map((k) => {
    const bad1 = bad.find((b) => b.key === k);
    return `<div style="width:96px;height:118px;border:1px solid ${bad1 ? 'red' : '#ddd'};overflow:hidden"><div style="width:96px;height:96px">${iconSVG(k, { cls: '', fx: false }).replace('<svg ', '<svg width="96" height="96" ')}</div><div style="white-space:nowrap;overflow:hidden">${k.replace(/</g, '')}</div></div>`;
  }).join('')}</div></body></html>`;
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: path.join(root, `qa/screenshots/picture-audit-${s + 1}.png`), fullPage: true });
}
await browser.close();
console.log(`pictures checked: ${report.length}; problems: ${bad.length}`);
bad.forEach((b) => console.log(` - ${b.key}: ${b.issue} (ink ${b.ink}, ${b.colors} colours) used in ${b.usedIn.join('; ')}`));
