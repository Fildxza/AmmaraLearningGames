// Opens the "Jom Mengaji" centre, visits each screen, completes one exercise and saves screenshots.
// Usage: node tools/islamic-tour.mjs
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CHROME } from './lib/browsers.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shots = path.join(root, 'qa/screenshots');
fs.mkdirSync(shots, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1366, height: 768 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
await page.goto(pathToFileURL(path.join(root, 'AmmaraGames.html')).href);
await page.waitForFunction(() => window.AmmaraDebug && window.AmmaraDebug.state() === 'MAIN_MENU', { timeout: 40000 });
await page.click('[data-testid=menu-islamic]');
await page.waitForFunction(() => window.AmmaraDebug.state() === 'ISLAMIC');
await sleep(500);
await page.screenshot({ path: path.join(shots, 'isl-home.png') });
await page.click('[data-testid=isl-stage-letters]'); await sleep(300);
await page.screenshot({ path: path.join(shots, 'isl-letters.png') });
await page.click('[data-testid=isl-letter-4]'); await sleep(300);
await page.screenshot({ path: path.join(shots, 'isl-letter.png') });
await page.click('[data-testid=isl-back]'); await sleep(200);
await page.click('[data-testid=isl-back]'); await sleep(200);
for (const no of [1, 112, 103]) { await page.click(`[data-testid=isl-surah-${no}]`); await sleep(400); await page.screenshot({ path: path.join(shots, `isl-surah-${no}.png`) }); await page.click('[data-testid=isl-back]'); await sleep(200); }
await page.click('[data-testid=isl-stage-harakat]'); await sleep(300);
await page.screenshot({ path: path.join(shots, 'isl-harakat.png') });
for (let i = 0; i < 6; i++) {
  const q = (await page.evaluate(() => window.AmmaraDebug.game().islamic)).quiz;
  if (!q || q.done) break;
  await page.click(`[data-testid=isl-opt-${q.okIndex}]`); await sleep(1100);
}
await sleep(300);
await page.screenshot({ path: path.join(shots, 'isl-done.png') });
const d = await page.evaluate(() => ({ isl: window.AmmaraDebug.game().islamic, nar: window.AmmaraDebug.game().narrator.history, acts: window.AmmaraDebug.store().activities.map((a) => a.kind + ':' + a.game) }));
console.log(JSON.stringify(d));
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
