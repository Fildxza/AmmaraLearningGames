// Measures frame rate and draw calls in the playroom. Usage: node tools/perf.mjs [headful] [edge]
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { CHROME, EDGE } from './lib/browsers.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const headless = !process.argv.includes('headful');
const exe = process.argv.includes('edge') ? EDGE : CHROME;
const url = process.env.GAME_URL || pathToFileURL(path.join(root, 'AmmaraGames.html')).href;
const b = await puppeteer.launch({ executablePath: exe, headless, args: ['--window-size=1366,860'], defaultViewport: { width: 1366, height: 768 } });
const p = await b.newPage();
const q = ['low', 'high'].find((x) => process.argv.includes(x));
if (q) await p.evaluateOnNewDocument((qq) => { localStorage.setItem('ammaragames.v1', JSON.stringify({ version: 1, settings: { quality: qq }, learners: {}, sessions: {}, runs: {}, currentSessionId: null, flags: {}, seq: { learner: 0, session: 0, run: 0 } })); }, q);
const hide = process.argv.filter((x) => x.startsWith('hide=')).map((x) => x.slice(5)).join(',');
if (hide) await p.evaluateOnNewDocument((sel) => { document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = sel + '{visibility:hidden!important}'; document.head.appendChild(st); }); }, hide);
await p.goto(url);
await p.waitForFunction(() => window.AmmaraDebug && window.AmmaraDebug.state() === 'MAIN_MENU', { timeout: 30000 });
await p.click('[data-testid=menu-play]');
await new Promise((r) => setTimeout(r, 6000));
const d = await p.evaluate(() => Object.assign(window.AmmaraDebug.world(), window.AmmaraDebug.perf()));
console.log(`${exe.includes('msedge') ? 'Edge' : 'Chrome'} ${headless ? 'headless' : 'headful'}`, JSON.stringify({ fps: d.fps, calls: d.calls, tris: d.triangles, meshes: d.meshes, casters: d.casters, quality: d.quality, dpr: d.dpr, updateMs: d.updateMs, renderMs: d.renderMs, frameMs: d.frameMs }));
await b.close();
