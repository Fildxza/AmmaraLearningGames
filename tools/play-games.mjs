// Plays every mini-game to the end with real mouse input and saves a screenshot of each.
// Usage: node tools/play-games.mjs [chrome|edge] [only-game-id]
// Also exported as playAll(page) for the end-to-end suite.
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CHROME, EDGE } from './lib/browsers.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dbg = (page) => page.evaluate(() => window.AmmaraDebug.game().arcade);
async function drag(page, a, b, steps = 14) {
  await page.mouse.move(a.x, a.y); await page.mouse.down();
  for (let i = 1; i <= steps; i++) await page.mouse.move(a.x + ((b.x - a.x) * i) / steps, a.y + ((b.y - a.y) * i) / steps);
  await page.mouse.up();
}
async function waitEnd(page, ms = 9000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { const d = await dbg(page); if (d.game && d.game.endOpen) return true; await sleep(150); }
  return false;
}

const PLAY = {
  async ruler(page) {
    for (let k = 0; k < 10; k++) {
      const d = (await dbg(page)).inst;
      if (!d || d.done) break;
      if (d.type === 'line') await drag(page, d.a, d.b, 20);
      else if (!d.xDraw) await page.mouse.click(d.at.x, d.at.y);
      else { const s = 30; await drag(page, { x: d.at.x - s, y: d.at.y - s }, { x: d.at.x + s, y: d.at.y + s }); await drag(page, { x: d.at.x + s, y: d.at.y - s }, { x: d.at.x - s, y: d.at.y + s }); }
      await sleep(250);
    }
  },
  async xo(page) {
    await page.click('[data-testid=xo-two]'); await sleep(150);
    for (const i of [0, 3, 1, 4, 2]) { await page.click(`[data-testid=xo-${i}]`); await sleep(120); }
  },
  async dots(page) {
    for (let p = 0; p < 2; p++) {
      const d = (await dbg(page)).inst;
      for (const dot of d.dots) { await page.mouse.click(dot.x, dot.y); await sleep(60); }
      await sleep(1700);
    }
  },
  async trace(page) {
    for (let r = 0; r < 3; r++) {
      const d = (await dbg(page)).inst;
      if (d.solved || d.round >= d.total) break;
      // walk the sample points row by row, as one long scribble that stays on the shape
      const pts = d.points.slice().sort((a, b) => (Math.round(a.y / 14) - Math.round(b.y / 14)) || (Math.round(a.y / 14) % 2 ? b.x - a.x : a.x - b.x));
      let i = 0;
      while (i < pts.length) {
        await page.mouse.move(pts[i].x, pts[i].y); await page.mouse.down();
        let j = i + 1;
        while (j < pts.length && Math.hypot(pts[j].x - pts[j - 1].x, pts[j].y - pts[j - 1].y) < 26) { await page.mouse.move(pts[j].x, pts[j].y); j++; }
        await page.mouse.up(); i = j;
        const now = (await dbg(page)).inst;
        if (now.solved || now.round > r) break;
      }
      await sleep(1500);
    }
  },
  async memory(page) {
    await sleep(2400);
    const d = (await dbg(page)).inst;
    const by = {};
    d.cards.forEach((c) => { (by[c.pair] = by[c.pair] || []).push(c.i); });
    for (const [a, b] of Object.values(by)) { await page.click(`[data-testid=mem-${a}]`); await sleep(120); await page.click(`[data-testid=mem-${b}]`); await sleep(350); }
  },
  async puzzle(page) {
    for (let k = 0; k < 10; k++) {
      const d = (await dbg(page)).inst;
      const p = d.pieces[0];
      if (!p) break;
      const h = d.holes.find((x) => x.k === p.k);
      await drag(page, p, h, 16); await sleep(300);
    }
  },
  async find(page) {
    for (let k = 0; k < 6; k++) {
      const d = (await dbg(page)).inst;
      if (d.round >= d.total) break;
      await page.mouse.click(d.targetAt.x, d.targetAt.y); await sleep(1300);
    }
  },
  async patterns(page) {
    for (let k = 0; k < 6; k++) {
      const d = (await dbg(page)).inst;
      if (d.round >= d.total) break;
      await page.click(`[data-testid=pat-${d.correctIndex}]`); await sleep(1300);
    }
  },
  async counting(page) {
    for (let k = 0; k < 6; k++) {
      const d = (await dbg(page)).inst;
      if (!d.kind || d.round >= d.total) break;
      if (d.kind === 'count') { await page.click(`[data-testid=ct-${d.options.indexOf(d.n)}]`); }
      else {
        for (let m = 0; m < 10; m++) {
          const s = (await dbg(page)).inst;
          if (s.kind !== 'sort' || !s.items.length) break;
          await drag(page, s.items[0], s.bins[s.items[0].bin], 14); await sleep(200);
        }
      }
      await sleep(1200);
    }
  },
  async music(page) {
    for (let k = 0; k < 80; k++) {
      const d = (await dbg(page)).inst;
      const g = (await dbg(page)).game;
      if (g.finished) break;
      if (d.listening || d.expected === undefined) { await sleep(300); continue; }
      await page.mouse.click(d.bars[d.expected].x, d.bars[d.expected].y); await sleep(140);
    }
  }
};

export async function playGame(page, id, shotDir) {
  await page.click(`[data-testid=game-${id}]`);
  await page.waitForFunction(() => window.AmmaraDebug.state() === 'MINIGAME');
  await sleep(300);
  const help = (await dbg(page)).game.helpOpen;
  if (shotDir) await page.screenshot({ path: path.join(shotDir, `game-${id}-help.png`) });
  if (help) { await page.click('[data-testid=mg-go]'); await sleep(250); }
  await sleep(400);
  if (shotDir) await page.screenshot({ path: path.join(shotDir, `game-${id}.png`) });
  await PLAY[id](page);
  const ended = await waitEnd(page);
  const d = await dbg(page);
  if (shotDir) await page.screenshot({ path: path.join(shotDir, `game-${id}-end.png`) });
  await page.click(ended ? '[data-testid=mg-leave]' : '[data-testid=mg-back]');
  await page.waitForFunction(() => window.AmmaraDebug.state() === 'ARCADE');
  return { id, help, ended, level: d.game.level, correct: d.game.correct, mistakes: d.game.mistakes, rounds: d.game.rounds };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const exe = process.argv.includes('edge') ? EDGE : CHROME;
  const only = process.argv.slice(2).find((a) => PLAY[a]);
  const shots = path.join(root, 'qa/screenshots/games');
  fs.mkdirSync(shots, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(pathToFileURL(path.join(root, 'AmmaraGames.html')).href);
  await page.waitForFunction(() => window.AmmaraDebug && window.AmmaraDebug.state() === 'MAIN_MENU', { timeout: 40000 });
  await page.click('[data-testid=menu-arcade]');
  await page.waitForFunction(() => window.AmmaraDebug.state() === 'ARCADE');
  await sleep(400);
  await page.screenshot({ path: path.join(shots, 'arcade-hub.png') });
  for (const id of Object.keys(PLAY)) {
    if (only && id !== only) continue;
    try { console.log(JSON.stringify(await playGame(page, id, shots))); }
    catch (e) { console.log(id, 'ERROR', e.message); await page.screenshot({ path: path.join(shots, `game-${id}-error.png`) }); try { await page.click('[data-testid=mg-back]'); } catch (x) { /* ignore */ } await sleep(400); }
  }
  const store = await page.evaluate(() => window.AmmaraDebug.store());
  console.log('activities recorded:', store.activities.length, 'stickers:', Object.values(store.learners)[0]?.rewards.filter((r) => r.startsWith('st_g_')).length);
  console.log('errors:', errors.length ? errors.join('\n') : 'none');
  await browser.close();
}
