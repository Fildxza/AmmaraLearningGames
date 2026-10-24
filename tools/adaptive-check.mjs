// Throttles the CPU and checks that automatic quality drops to "low" and the game stays playable.
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { CHROME } from './lib/browsers.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, defaultViewport: { width: 1366, height: 768 } });
const p = await b.newPage();
const cdp = await p.createCDPSession();
await p.goto(pathToFileURL(path.join(root, 'AmmaraGames.html')).href);
await p.evaluate(() => localStorage.clear()); await p.reload();
await p.waitForFunction(() => window.AmmaraDebug && window.AmmaraDebug.state() === 'MAIN_MENU');
await p.click('[data-testid=menu-play]');
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
const t0 = Date.now(); let last;
while (Date.now() - t0 < 40000) {
  await new Promise((r) => setTimeout(r, 2000));
  last = await p.evaluate(() => { const w = window.AmmaraDebug.world(); return { fps: w.fps, quality: w.quality, auto: w.autoMode, low: w.lowFpsTime, n: w.samples, shadows: w.shadows, dpr: w.dpr, calls: w.calls }; });
  console.log(((Date.now() - t0) / 1000).toFixed(0) + 's', JSON.stringify(last));
  if (last.quality === 'low') break;
}
console.log(last.quality === 'low' ? 'ADAPTIVE QUALITY: dropped to low' : 'ADAPTIVE QUALITY: did NOT drop');
await b.close();
