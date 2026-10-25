// Screenshots of the town "Bandar Ceria": campus, streets, landmarks, beach (and frame statistics for each spot).
// Usage: node tools/city-tour.mjs [width] [height] [only-substring]
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CHROME } from './lib/browsers.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [w = 1366, h = 768, only = ''] = process.argv.slice(2);
const SPOTS = [
  ['campus-gate', 40, 30], ['stable', 92, -4], ['parking', -86, 40], ['busstop', 40, 50], ['street', 120, 75], ['downtown', 420, -420],
  ['zoo', -300, 150], ['market', 300, 40], ['masjid', -180, -84], ['lake', 180, 160], ['fire', 180, -80], ['themepark', 420, 150],
  ['school', 60, 260], ['space', 60, -200], ['farm', -540, 270], ['library', -180, 40], ['beach', 540, 1790], ['houses', 1000, 900], ['forest', 200, -1850],
  ['hw-road', 300, -652], ['hw-station', 132, -641], ['stn-tadika', 52, -74], ['stn-barat', -466, -368], ['rail-street', 260, -48], ['hw-far', -1500, -645]
];
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
await page.setViewport({ width: +w, height: +h, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto('file:///' + path.join(root, 'AmmaraGames.html').replace(/\\/g, '/'));
await page.waitForFunction(() => window.AmmaraDebug && window.AmmaraDebug.state() !== 'BOOT', { timeout: 60000 });
await new Promise((r) => setTimeout(r, 600));
await page.click('[data-testid=menu-play]');
await new Promise((r) => setTimeout(r, 2000));
if (process.env.HUD !== '1') await page.addStyleTag({ content: '#ui{display:none !important}' });
fs.mkdirSync(path.join(root, 'qa/screenshots'), { recursive: true });
for (const [name, x, z] of SPOTS) {
  if (only && !name.includes(only)) continue;
  await page.evaluate((a, b) => window.AmmaraDebug.teleport(a, b), x, z);
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(root, `qa/screenshots/city-${name}.png`) });
  const st = await page.evaluate(() => { const d = window.AmmaraDebug.world(); return { zone: d.zone, calls: d.calls, tris: d.triangles, fps: d.fps, chunks: d.city.chunks, traffic: d.traffic, people: d.people, p: d.player }; });
  console.log(name.padEnd(12), JSON.stringify(st));
}
console.log(logs.join('\n') || 'no console errors');
console.log('errors:', JSON.stringify(await page.evaluate(() => window.AmmaraDebug.errors())).slice(0, 1500));
await browser.close();
