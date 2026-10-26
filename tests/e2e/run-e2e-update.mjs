// Checks that a new version of the game replaces the old one by itself while the game is at the menu (and never while a
// child is playing). The built dist/ folder is served over http, installed, then its service worker file is changed.
// Usage: node tests/e2e/run-e2e-update.mjs [edge]
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
import { CHROME, EDGE } from '../../tools/lib/browsers.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const EDGE_RUN = process.argv.includes('edge');
const src = path.join(root, 'dist'), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ammara-update-'));
fs.cpSync(src, tmp, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => { let f = path.join(tmp, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith(path.sep) || !fs.existsSync(f)) f = path.join(tmp, 'index.html'); r.writeHead(200, { 'content-type': mime[path.extname(f)] || 'text/plain', 'cache-control': 'no-store' }); fs.createReadStream(f).pipe(r); });
await new Promise((r) => srv.listen(0, r));
const URL = `http://127.0.0.1:${srv.address().port}/`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (id, name, ok, info) => { results.push({ id, name, ok, info }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${id} ${name} — ${info}`); };
const b = await puppeteer.launch({ executablePath: EDGE_RUN ? EDGE : CHROME, headless: true });
const version = await b.version();
const p = await b.newPage();
let navs = 0; p.on('framenavigated', (f) => { if (f === p.mainFrame()) navs++; });
await p.goto(URL); await p.waitForFunction(() => window.AmmaraDebug && window.AmmaraDebug.state() === 'MAIN_MENU', { timeout: 60000 });
await p.evaluate(() => navigator.serviceWorker.ready); await sleep(1500);
await p.reload(); await p.waitForFunction(() => window.AmmaraDebug && window.AmmaraDebug.state() === 'MAIN_MENU', { timeout: 60000 });
check('N1', 'The installed game is controlled by its service worker (offline copy)', await p.evaluate(() => !!navigator.serviceWorker.controller), 'controller present after the second visit');
// "deploy" a new version: a changed sw.js (new cache name)
const swp = path.join(tmp, 'sw.js'); fs.writeFileSync(swp, fs.readFileSync(swp, 'utf8').replace(/ammaragames-[^']+/, 'ammaragames-NEWBUILD'));
const before = navs;
await p.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r.update()));
await sleep(5000);
await p.waitForFunction(() => window.AmmaraDebug && window.AmmaraDebug.state() === 'MAIN_MENU', { timeout: 60000 });          // (the page may still be loading)
check('N2', 'A new version replaces the old one by itself while the game is at the menu', navs > before, 'reloaded without a tap; state ' + (await p.evaluate(() => window.AmmaraDebug.state())));
// while playing it must NOT reload
await p.click('[data-testid=menu-play]'); await p.waitForFunction(() => window.AmmaraDebug.state() === 'PLAYROOM');
fs.writeFileSync(swp, fs.readFileSync(swp, 'utf8').replace('ammaragames-NEWBUILD', 'ammaragames-NEWBUILD2'));
const n2 = navs;
await p.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r.update()));
await sleep(7000);
check('N3', 'It never reloads while a child is playing', navs === n2, 'state ' + (await p.evaluate(() => window.AmmaraDebug.state())));
await b.close(); srv.close(); fs.rmSync(tmp, { recursive: true, force: true });
const passed = results.filter((r) => r.ok).length;
console.log(`
${EDGE_RUN ? 'Edge' : 'Chrome'} update checks: ${passed} passed, ${results.length - passed} failed.`);
fs.writeFileSync(path.join(root, 'qa', `e2e-update-${EDGE_RUN ? 'edge' : 'chrome'}.json`), JSON.stringify({ browser: version, date: new Date().toISOString(), results }, null, 1));
process.exitCode = passed === results.length ? 0 : 1;
