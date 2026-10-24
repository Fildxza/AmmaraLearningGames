// Quick look: open AmmaraGames.html, report console errors, take a screenshot.
// Usage: node tools/smoke.mjs [width] [height] [actions...]
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CHROME } from './lib/browsers.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [w = 1366, h = 768, ...steps] = process.argv.slice(2);
const url = 'file:///' + path.join(root, 'AmmaraGames.html').replace(/\\/g, '/');
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
await page.setViewport({ width: +w, height: +h, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
page.on('requestfailed', (r) => logs.push(`[requestfailed] ${r.url().slice(0, 100)}`));
page.on('request', (r) => { if (!/^(file|data|blob):/.test(r.url())) logs.push(`[NETWORK] ${r.url().slice(0, 100)}`); });
await page.goto(url);
await page.waitForFunction(() => window.AmmaraDebug && window.AmmaraDebug.state() !== 'BOOT', { timeout: 30000 }).catch(() => logs.push('[timeout] never left BOOT'));
await new Promise((r) => setTimeout(r, 1500));
const shots = path.join(root, 'qa/screenshots');
fs.mkdirSync(shots, { recursive: true });
let n = 0;
const snap = async (name) => { await page.screenshot({ path: path.join(shots, `smoke-${String(n++).padStart(2, '0')}-${name}.png`) }); };
await snap('start');
for (const s of steps) {
  if (s.startsWith('click:')) { await page.click(s.slice(6)).catch((e) => logs.push('[click failed] ' + s + ' ' + e.message)); }
  else if (s.startsWith('key:')) { const [k, ms] = s.slice(4).split('@'); await page.keyboard.down(k); await new Promise((r) => setTimeout(r, +(ms || 100))); await page.keyboard.up(k); }
  else if (s.startsWith('wait:')) { await new Promise((r) => setTimeout(r, +s.slice(5))); }
  else if (s.startsWith('eval:')) { logs.push('[eval] ' + JSON.stringify(await page.evaluate(s.slice(5))).slice(0, 2000)); }
  else if (s.startsWith('snap:')) { await snap(s.slice(5)); }
}
logs.push('[state] ' + await page.evaluate(() => window.AmmaraDebug ? window.AmmaraDebug.state() : 'no debug'));
logs.push('[world] ' + JSON.stringify(await page.evaluate(() => window.AmmaraDebug && window.AmmaraDebug.world())));
console.log(logs.join('\n'));
await browser.close();
