// Renders every picture used by the question bank into a contact sheet for visual review.
// Usage: node tools/icon-sheet.mjs [filter]
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import puppeteer from 'puppeteer-core';
import { CHROME } from './lib/browsers.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const filter = process.argv[2] || '';
const out = await build({ entryPoints: [path.join(root, 'src/engine/art/icons.js')], bundle: true, format: 'iife', globalName: 'Icons', write: false });
const js = out.outputFiles[0].text;
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'src/config/game-config.js'), 'utf8'), ctx);
const cfg = ctx.window.AMMARA_CONFIG;
const keys = new Set();
const sandbox = { window: {} }; vm.runInNewContext(js + ';window.Icons=Icons;', sandbox);
const Icons = sandbox.window.Icons;
Icons.HAND_KEYS.forEach((k) => keys.add(k));
for (const q of cfg.questions) { q.choices.forEach((k) => keys.add(k)); if (q.art) keys.add(q.art); }
Object.values(cfg.rewards).forEach((r) => r.icon && keys.add(r.icon));
cfg.worlds.forEach((w) => { keys.add(w.icon); w.posters.forEach((k) => keys.add(k)); });
Object.values(cfg.stations).forEach((s) => keys.add(s.icon));
keys.add('mascot:star'); keys.add('mascot:cloud');
const list = [...keys].filter((k) => k.includes(filter)).sort();
const font = fs.readFileSync(path.join(root, 'node_modules/@fontsource-variable/fredoka/files/fredoka-latin-wght-normal.woff2')).toString('base64');
const html = `<!doctype html><meta charset="utf-8"><style>@font-face{font-family:Fredoka;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:300 700}
body{margin:0;background:#fff8ee;font-family:Fredoka;display:grid;grid-template-columns:repeat(auto-fill,124px);gap:6px;padding:8px}
.cell{background:#fff;border-radius:14px;padding:4px;text-align:center;font-size:10px;color:#6b4a3a;box-shadow:0 1px 3px #0002}
.cell svg{width:100%;height:90px}.bad{background:#fdd}</style><svg width="0" height="0" style="position:absolute"><defs>${Icons.SVG_DEFS}</defs></svg>
${list.map((k) => `<div class="cell ${Icons.isIconKey(k) ? '' : 'bad'}">${Icons.iconSVG(k)}<div>${k}</div></div>`).join('')}`;
fs.mkdirSync(path.join(root, 'qa/screenshots'), { recursive: true });
const htmlPath = path.join(root, 'qa/icon-sheet.html');
fs.writeFileSync(htmlPath, html);
const bad = list.filter((k) => !Icons.isIconKey(k));
console.log('icons:', list.length, 'invalid:', bad.length, bad.join(' '));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1300, height: 900, deviceScaleFactor: 1 });
await page.goto('file:///' + htmlPath.replace(/\\/g, '/'));
await page.evaluate(() => document.fonts.ready);
const shots = Number(process.argv[3] || 0);
const h = await page.evaluate(() => document.body.scrollHeight);
const per = 1800;
for (let i = 0, y = 0; y < h; i++, y += per) {
  await page.screenshot({ path: path.join(root, `qa/screenshots/icon-sheet-${i}.png`), clip: { x: 0, y, width: 1300, height: Math.min(per, h - y) } });
}
console.log('sheet height', h, 'pages', Math.ceil(h / per), shots);
await browser.close();
