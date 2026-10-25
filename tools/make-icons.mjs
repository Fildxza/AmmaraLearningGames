// Renders the app icons (public/icons/*.png) from the game's own star mascot.
// Usage: node tools/make-icons.mjs
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CHROME } from './lib/browsers.mjs';
import { iconSVG } from '../src/engine/art/icons.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public/icons');
fs.mkdirSync(out, { recursive: true });
const mascot = iconSVG('mascot:star', { cls: '', standalone: true, fx: false }).replace('<svg ', '<svg width="100%" height="100%" ');
// content = share of the icon the star fills; maskable icons keep it inside the central safe zone
const page = (content, rounded) => `<body style="margin:0"><div style="width:1024px;height:1024px;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(circle at 30% 20%,#fff3b0 0,#ffd9ec 45%,#ffb3d4 100%);${rounded ? 'border-radius:224px;' : ''}">
  <div style="width:${content}%;height:${content}%">${mascot}</div></div></body>`;
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const p = await browser.newPage();
await p.setViewport({ width: 1024, height: 1024 });
const jobs = [['icon-512.png', 512, 74, true], ['icon-192.png', 192, 74, true], ['maskable-512.png', 512, 56, false], ['apple-touch-icon.png', 180, 66, false]];
for (const [name, size, content, rounded] of jobs) {
  await p.setContent(page(content, rounded), { waitUntil: 'load' });
  const shot = await p.screenshot({ clip: { x: 0, y: 0, width: 1024, height: 1024 }, omitBackground: rounded });
  await p.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  await p.setContent(`<body style="margin:0;background:transparent"><img src="data:image/png;base64,${Buffer.from(shot).toString('base64')}" style="width:${size}px;height:${size}px;display:block"></body>`, { waitUntil: 'load' });
  fs.writeFileSync(path.join(out, name), await p.screenshot({ clip: { x: 0, y: 0, width: size, height: size }, omitBackground: true }));
  await p.setViewport({ width: 1024, height: 1024 });
  console.log('wrote', name);
}
await browser.close();
