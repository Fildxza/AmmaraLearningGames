// Walks the camera through every corner of the preschool and the garden and saves a screenshot of each.
// Usage: node tools/tour.mjs [width] [height] [only-substring]
// Output: qa/screenshots/tour-<name>.png  (also prints console errors and frame stats)
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CHROME } from './lib/browsers.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [w = 1366, h = 768, only = ''] = process.argv.slice(2);
const url = 'file:///' + path.join(root, 'AmmaraGames.html').replace(/\\/g, '/');
const SPOTS = [
  ['hall', 0, 1.6], ['hall-table', 9, -3], ['door-in', 10.5, -1], ['door-out', 16.5, -1],
  ['mengaji', -17.5, -4.5], ['reading', -17.5, 4.5], ['arcade', -26.5, -4], ['art', -26.5, 3.5],
  ['numbers', -35.5, -3], ['shapes', -35.5, 3], ['animals', -44.5, -3], ['music', -44.5, 5],
  ['wardrobe', -53.5, -3], ['rest', -53.5, 3],
  ['fountain', 24.5, 2.5], ['garden', 28.0, -12.0], ['gazebo', 38.5, 1.5], ['playground', 53, -10], ['sandpit', 38, 10.4], ['lawn', 24, 9.5], ['board', 52, 5]
];
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--use-gl=angle'] });
const page = await browser.newPage();
await page.setViewport({ width: +w, height: +h, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(url);
await page.waitForFunction(() => window.AmmaraDebug && window.AmmaraDebug.state() !== 'BOOT', { timeout: 40000 }).catch(() => logs.push('[timeout] never left BOOT'));
await new Promise((r) => setTimeout(r, 800));
await page.click('[data-testid=menu-play]').catch((e) => logs.push('[click failed] ' + e.message));
await new Promise((r) => setTimeout(r, 2500));
// hide the HUD so the world is easy to inspect
if (process.env.HUD !== '1') await page.addStyleTag({ content: '#ui{display:none !important}' });
fs.mkdirSync(path.join(root, 'qa/screenshots'), { recursive: true });
for (const [name, x, z] of SPOTS) {
  if (only && !name.includes(only)) continue;
  await page.evaluate((a, b) => window.AmmaraDebug.teleport(a, b), x, z);
  await new Promise((r) => setTimeout(r, 900));
  await page.screenshot({ path: path.join(root, `qa/screenshots/tour-${name}.png`) });
  const st = await page.evaluate(() => { const d = window.AmmaraDebug.world(); return { z: d.zone, calls: d.calls, tris: d.triangles, vz: d.visibleZones + '/' + d.totalZones, fps: d.fps }; });
  console.log(name.padEnd(12), JSON.stringify(st));
}
console.log(logs.join('\n') || 'no console errors');
console.log('errors:', JSON.stringify(await page.evaluate(() => window.AmmaraDebug.errors())).slice(0, 1500));
await browser.close();
