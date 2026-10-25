// Takes the town screenshots used in README.md (docs/screenshots/town-*.png): riding a unicorn, the elevated
// train above the streets, the highway, and the town map.
// Usage: node tools/readme-town-shots.mjs
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CHROME } from './lib/browsers.mjs';
import { railPath, HIGHWAY } from '../src/engine/city/plan.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'docs/screenshots');
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1.5 });
await page.goto(pathToFileURL(path.join(root, 'AmmaraGames.html')).href);
await page.waitForFunction(() => window.AmmaraDebug && window.AmmaraDebug.state() === 'MAIN_MENU', { timeout: 40000 });
await sleep(1000);
await page.click('[data-testid=menu-play]');
await page.waitForFunction(() => window.AmmaraDebug.state() === 'PLAYROOM');
await sleep(800);
const skip = await page.$('[data-testid=tut-skip]'); if (skip) await skip.click();
const tp = (x, z) => page.evaluate((a, b) => window.AmmaraDebug.teleport(a, b), x, z);
const world = () => page.evaluate(() => window.AmmaraDebug.world());

// 1. a unicorn from the stable, trotting out towards the street
await tp(92, -7.6); await sleep(700);
await page.keyboard.press('KeyE'); await sleep(300);
await page.keyboard.down('ArrowDown'); await sleep(1600); await page.keyboard.up('ArrowDown');
await page.keyboard.down('ArrowRight'); await sleep(500); await page.keyboard.up('ArrowRight');
await sleep(1600);
await page.screenshot({ path: path.join(out, 'town-unicorn.png') });
await page.keyboard.press('KeyE'); await sleep(400);

// 2. the highway with its fast traffic and the train line along its middle
await tp(150, HIGHWAY.z + HIGHWAY.curb - 1.2); await sleep(3500);
await page.screenshot({ path: path.join(out, 'town-highway.png') });

// 3. the train: wait at Stesen Tadika, ride, and take the picture a few seconds after it leaves
const st = railPath().stations.find((s) => s.id === 'stn-tadika');
await tp(st.exit.x, st.exit.z); await sleep(700);
await page.keyboard.press('KeyE');
await page.waitForFunction(() => window.AmmaraDebug.world().ride === 'train', { timeout: 90000 });
await page.waitForFunction(() => { const t = window.AmmaraDebug.world().trains.find((q) => q.riding); return t && t.speed > 6; }, { timeout: 60000 });
await sleep(2500);
await page.screenshot({ path: path.join(out, 'town-train.png') });
await page.waitForFunction(() => { const t = window.AmmaraDebug.world().trains.find((q) => q.riding); return t && t.dwell > 0 && t.atStop !== 'stn-tadika'; }, { timeout: 150000 });
await page.keyboard.press('KeyE'); await sleep(600);

// 4. the town map
await page.click('[data-testid=hud-minimap]'); await sleep(700);
await page.screenshot({ path: path.join(out, 'town-map.png') });
const w = await world();
await browser.close();
console.log('town screenshots written to', out, '| errors:', w.violations);
