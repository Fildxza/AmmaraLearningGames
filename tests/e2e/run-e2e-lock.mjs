// Browser checks for Kid Lock, resume after reload, and the installable offline web app (served over http from dist/).
// Usage: node tests/e2e/run-e2e-lock.mjs [edge]
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CHROME, EDGE } from '../../tools/lib/browsers.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const EDGE_RUN = process.argv.includes('edge');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
let page;
const assert = (c, m) => { if (!c) throw new Error(m); };
async function check(id, name, fn) {
  try { const info = await fn(); results.push({ id, name, ok: true, info }); console.log(`PASS  ${id} ${name} — ${info}`); }
  catch (e) { results.push({ id, name, ok: false, info: e.message }); console.log(`FAIL  ${id} ${name} — ${e.message}`); }
}
const state = () => page.evaluate(() => window.AmmaraDebug.state());
const waitState = (s, t = 15000) => page.waitForFunction((x) => window.AmmaraDebug.state() === x, { timeout: t }, s);

// static server for dist/ (what GitHub Pages does), on a sub-path like /AmmaraLearningGames/
const dist = path.join(root, 'dist');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]).replace(/^\/AmmaraLearningGames/, '');
  if (p === '/' || p === '') p = '/index.html';
  const f = path.join(dist, p);
  if (!f.startsWith(dist) || !fs.existsSync(f)) { res.writeHead(404); res.end('no'); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/AmmaraLearningGames/`;

const browser = await puppeteer.launch({ executablePath: EDGE_RUN ? EDGE : CHROME, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const version = await browser.version();
console.log(`Kid Lock / web-app checks with ${version}\n${base}\n`);
page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720, hasTouch: true });
const errors = [], dialogs = [];
// the "leave this page?" warning is part of the lock: a person would press Cancel; the test presses Leave
page.on('dialog', (d) => { dialogs.push(d.type()); d.accept().catch(() => {}); });
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await check('L1', 'Served over http: manifest, icons and service worker are found and the worker takes control', async () => {
  await page.goto(base + '#lockdebug');
  await waitState('MAIN_MENU', 40000);
  await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, { timeout: 20000 }).catch(async () => { await page.reload(); await waitState('MAIN_MENU', 40000); await page.waitForFunction(() => navigator.serviceWorker.controller, { timeout: 20000 }); });
  const m = await page.$eval('link[rel=manifest]', (l) => l.href);
  const mj = await (await page.evaluate((u) => fetch(u).then((r) => r.json()), m));
  assert(mj.display === 'fullscreen' && mj.icons.length === 3, 'manifest');
  const keys = await page.evaluate(async () => (await caches.keys()).join());
  assert(/ammaragames-/.test(keys), 'cache missing: ' + keys);
  return `manifest ok, cache ${keys}`;
});
await check('L2', 'Offline: after one visit the game opens with the network switched off', async () => {
  await page.setOfflineMode(true);
  await page.reload();
  await waitState('MAIN_MENU', 40000);
  await page.setOfflineMode(false);
  return 'opened offline from the service-worker cache';
});
await check('L3', 'Ghost touches: edge and palm touches are ignored, a normal tap works', async () => {
  const before = (await page.evaluate(() => window.AmmaraDebug.lock())).ghost;
  await page.touchscreen.tap(2, 300);
  await page.touchscreen.tap(1278, 400);
  await page.touchscreen.tap(640, 2);
  await sleep(200);
  const mid = await page.evaluate(() => window.AmmaraDebug.lock());
  assert(mid.ghost === before + 3, 'edge taps counted ' + (mid.ghost - before));
  assert((await state()) === 'MAIN_MENU', 'state changed');
  await page.touchscreen.tap(1100, 650);
  const after = await page.evaluate(() => window.AmmaraDebug.lock());
  assert(after.ghost === mid.ghost, 'a normal tap was blocked');
  return `3 edge touches ignored (${JSON.stringify(after.ghostReasons)}), normal tap passed`;
});
await check('L4', 'Zoom, refresh, print and long-press menu are blocked', async () => {
  const r = await page.evaluate(() => {
    const out = {};
    const fire = (type, init) => { const e = new KeyboardEvent(type, Object.assign({ bubbles: true, cancelable: true }, init)); document.body.dispatchEvent(e); return e.defaultPrevented; };
    out.f5 = fire('keydown', { key: 'F5' });
    out.ctrlR = fire('keydown', { key: 'r', ctrlKey: true });
    out.ctrlP = fire('keydown', { key: 'p', ctrlKey: true });
    out.zoomIn = fire('keydown', { key: '+', ctrlKey: true });
    out.plainKey = fire('keydown', { key: 'a' });
    const cm = new MouseEvent('contextmenu', { bubbles: true, cancelable: true }); document.body.dispatchEvent(cm); out.menu = cm.defaultPrevented;
    const wh = new WheelEvent('wheel', { ctrlKey: true, bubbles: true, cancelable: true }); window.dispatchEvent(wh); out.wheel = wh.defaultPrevented;
    return out;
  });
  assert(r.f5 && r.ctrlR && r.ctrlP && r.zoomIn && r.menu && r.wheel, JSON.stringify(r));
  assert(!r.plainKey, 'normal keys must not be blocked');
  return 'F5, Ctrl+R, Ctrl+P, Ctrl+zoom, context menu, Ctrl+wheel blocked';
});
await check('L5', 'Full screen starts on the first tap (and the lock can be turned off by an adult)', async () => {
  await page.mouse.click(1100, 650); await sleep(500);
  const l = await page.evaluate(() => window.AmmaraDebug.lock());
  assert(l.fullscreenRequests >= 1, 'no full-screen request');
  const fs1 = await page.evaluate(() => !!document.fullscreenElement);
  return `full-screen requested ${l.fullscreenRequests}x, active=${fs1}`;
});
await check('L6', 'Reload in the middle of play carries on in the same place (no menu, same child, same spot)', async () => {
  await page.click('[data-testid=menu-play]');
  await waitState('PLAYROOM');
  await sleep(800);
  await page.evaluate(() => window.AmmaraDebug.teleport(-26.5, 3));
  await sleep(600);
  const before = await page.evaluate(() => ({ p: window.AmmaraDebug.player(), g: window.AmmaraDebug.game().learner.name, world: window.AmmaraDebug.game().worldId }));
  await page.evaluate(() => window.AmmaraDebug.game && 0); // let the 3.5 s autosave window pass naturally
  await sleep(4200);
  const warned = dialogs.length;
  await page.reload();
  assert(dialogs.length > warned && dialogs[dialogs.length - 1] === 'beforeunload', 'no leave-page warning while playing');
  await waitState('PLAYROOM', 40000);
  await sleep(800);
  const after = await page.evaluate(() => ({ p: window.AmmaraDebug.player(), g: window.AmmaraDebug.game().learner.name, world: window.AmmaraDebug.game().worldId }));
  assert(after.g === before.g && after.world === before.world, 'different learner/world');
  assert(Math.hypot(after.p.x - before.p.x, after.p.z - before.p.z) < 1.0, `moved from ${before.p.x},${before.p.z} to ${after.p.x},${after.p.z}`);
  return `back in ${after.p.zone} at ${after.p.x.toFixed(1)}, ${after.p.z.toFixed(1)} as ${after.g}`;
});
await check('L7', 'Reload inside the arcade returns to the arcade; going Home on purpose clears the resume', async () => {
  await page.evaluate(() => window.AmmaraDebug.game()); await page.keyboard.press('Escape'); await sleep(300);
  await page.click('[data-testid=pause-home]'); await sleep(300);
  const y = await page.$('#dialog [data-answer=yes]'); if (y) await y.click();
  await waitState('MAIN_MENU');
  await page.click('[data-testid=menu-arcade]'); await waitState('ARCADE'); await sleep(500);
  await page.reload(); await waitState('ARCADE', 40000);
  await page.click('[data-testid=arcade-back]'); await waitState('MAIN_MENU'); await sleep(300);
  await page.reload(); await waitState('MAIN_MENU', 40000); await sleep(1200);
  assert((await state()) === 'MAIN_MENU', 'menu expected after Home');
  return 'arcade resumed; menu stays menu after leaving on purpose';
});
await check('L8', 'Adult switch: turning Kid Lock off in Teacher > Settings stops the blocking and the resume', async () => {
  await page.click('[data-testid=menu-teacher]');
  await page.waitForSelector('[data-testid=gate-hold]');
  const box = await (await page.$('[data-testid=gate-hold]')).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await sleep(1900); await page.mouse.up();
  await waitState('TEACHER_AREA', 8000);
  await page.click('[data-testid=t-tab-settings]'); await sleep(300);
  assert(await page.$('[data-testid=t-exit-fullscreen]'), 'leave-fullscreen button missing');
  await page.click('[data-testid=set-kidLock]'); await sleep(300);
  const blocked = await page.evaluate(() => { const e = new KeyboardEvent('keydown', { key: 'F5', bubbles: true, cancelable: true }); document.body.dispatchEvent(e); return e.defaultPrevented; });
  assert(!blocked, 'F5 still blocked after switching the lock off');
  const resume = await page.evaluate(() => window.AmmaraDebug.store().settings.resume);
  assert(!resume, 'resume kept');
  return 'lock off: shortcuts free, resume cleared';
});
await check('L9', 'No JavaScript errors during the lock and web-app flows', async () => {
  const real = errors.filter((e) => !/Failed to load resource|favicon/.test(e));
  assert(!real.length, real.slice(0, 3).join(' | '));
  return 'console errors 0';
});

const passed = results.filter((r) => r.ok).length;
console.log(`\n${EDGE_RUN ? 'Edge' : 'Chrome'} lock/web-app checks: ${passed} passed, ${results.length - passed} failed.`);
fs.writeFileSync(path.join(root, 'qa', `e2e-lock-${EDGE_RUN ? 'edge' : 'chrome'}.json`), JSON.stringify({ browser: version, date: new Date().toISOString(), results }, null, 1));
await browser.close(); server.close();
process.exitCode = passed === results.length ? 0 : 1;
void pathToFileURL;
