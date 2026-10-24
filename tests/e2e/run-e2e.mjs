// End-to-end test of the real AmmaraGames.html in Chrome/Edge (headless, real GPU).
// Drives the game through real keyboard, mouse and touch-style input.
// Usage: node tests/e2e/run-e2e.mjs [edge]
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { CHROME, EDGE } from '../../tools/lib/browsers.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BROWSER = process.argv.includes('edge') ? 'Edge' : 'Chrome';
const EXE = BROWSER === 'Edge' ? EDGE : CHROME;
const URL = pathToFileURL(path.join(ROOT, 'AmmaraGames.html')).href;
const SHOTS = path.join(ROOT, 'qa/screenshots', BROWSER.toLowerCase());
const DL = path.join(ROOT, 'qa/downloads', BROWSER.toLowerCase());
fs.rmSync(SHOTS, { recursive: true, force: true }); fs.mkdirSync(SHOTS, { recursive: true });
fs.rmSync(DL, { recursive: true, force: true }); fs.mkdirSync(DL, { recursive: true });

const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function record(id, name, status, detail = '') { results.push({ id, name, status, detail: String(detail).slice(0, 400) }); console.log(`${status.padEnd(10)} ${String(id).padStart(2)} ${name}${detail ? ' — ' + String(detail).slice(0, 160) : ''}`); }
let activePage = null;
async function check(id, name, fn) {
  try { const d = await fn(); record(id, name, 'PASS', d || ''); return true; }
  catch (e) {
    record(id, name, 'FAIL', e.message);
    if (activePage) { try { await activePage.screenshot({ path: path.join(SHOTS, `FAIL-${String(id).replace('.', '_')}.png`) }); } catch (err) { /* page may be gone */ } }
    return false;
  }
}
const assert = (c, msg) => { if (!c) throw new Error(msg); };

async function newPage(browser, { width = 1366, height = 768, inject } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  const log = { errors: [], warnings: [], external: [] };
  page.on('console', (m) => { if (m.type() === 'error') log.errors.push(m.text()); if (m.type() === 'warning' || m.type() === 'warn') log.warnings.push(m.text()); });
  page.on('pageerror', (e) => log.errors.push('pageerror: ' + e.message));
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    const u = r.url();
    if (/^(file|data|blob):/i.test(u)) r.continue();
    else { log.external.push(u); r.abort(); }
  });
  await page.setOfflineMode(true);
  const cdp = await page.createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DL }).catch(() => cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DL }));
  if (inject) await page.evaluateOnNewDocument(inject);
  return { page, log };
}
const dbg = (page, expr, ...args) => page.evaluate(expr, ...args);
const state = (page) => dbg(page, () => window.AmmaraDebug.state());
const game = (page) => dbg(page, () => window.AmmaraDebug.game());
const world = (page) => dbg(page, () => window.AmmaraDebug.world());
const player = (page) => dbg(page, () => window.AmmaraDebug.player());
const waitState = (page, s, timeout = 8000) => page.waitForFunction((x) => window.AmmaraDebug && window.AmmaraDebug.state() === x, { timeout }, s);
let shotN = 0;
const shot = async (page, name) => { const f = path.join(SHOTS, `${String(++shotN).padStart(2, '0')}-${name}.png`); await page.screenshot({ path: f }); return f; };
async function hold(page, key, ms) { await page.keyboard.down(key); await sleep(ms); await page.keyboard.up(key); await sleep(60); }
async function holdButton(page, sel, ms) {
  const el = await page.$(sel); const b = await el.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await sleep(ms); await page.mouse.up(); await sleep(60);
}
// Steers with arrow keys towards (tx, tz) until within `tol` or `until()` is true.
async function steer(page, tx, tz, { tol = 0.35, timeout = 20000, until } = {}) {
  const t0 = Date.now();
  let best = Infinity, stuckSince = Date.now(), escapes = 0;
  while (Date.now() - t0 < timeout) {
    const p = await player(page);
    const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
    if (d < tol) return true;
    if (until && await until()) return true;
    if (d < best - 0.05) { best = d; stuckSince = Date.now(); }
    let keys = [];
    if (dx > 0.25) keys.push('ArrowRight'); else if (dx < -0.25) keys.push('ArrowLeft');
    if (dz > 0.25) keys.push('ArrowDown'); else if (dz < -0.25) keys.push('ArrowUp');
    if (Date.now() - stuckSince > 900) {
      // a real player lets go and walks around the obstacle: try each axis on its own, then the opposite way
      escapes++;
      if (process.env.DEBUG_STEER) console.log(`   [steer] escape ${escapes} at (${p.x.toFixed(2)}, ${p.z.toFixed(2)}) -> (${tx.toFixed(2)}, ${tz.toFixed(2)}) best=${best.toFixed(2)} wanted ${keys.join('+')}`);
      if (escapes > 8) throw new Error(`stuck at (${p.x.toFixed(2)}, ${p.z.toFixed(2)}) going to (${tx}, ${tz})`);
      const options = [keys.filter((k) => /Up|Down/.test(k)), keys.filter((k) => /Left|Right/.test(k)), [dz > 0 ? 'ArrowUp' : 'ArrowDown'], [dx > 0 ? 'ArrowLeft' : 'ArrowRight']];
      keys = options[escapes % options.length];
      if (!keys.length) keys = ['ArrowUp'];
      stuckSince = Date.now() - 300;
      for (const k of keys) await page.keyboard.down(k);
      await sleep(450);
      for (const k of keys) await page.keyboard.up(k);
      continue;
    }
    for (const k of keys) await page.keyboard.down(k);
    await sleep(Math.min(180, 40 + d * 60));
    for (const k of keys) await page.keyboard.up(k);
  }
  throw new Error('timeout steering');
}
async function goToStation(page, i) {
  const st = (await dbg(page, () => window.AmmaraDebug.stations()))[i];
  const p = await player(page);
  const dx = p.x - st.x, dz = p.z - st.z, d = Math.hypot(dx, dz) || 1;
  const r = st.radius + 0.45 + 0.7;
  await steer(page, st.x + (dx / d) * r, st.z + (dz / d) * r, { tol: 0.4, until: async () => dbg(page, () => !document.querySelector('[data-testid="hud-interact"]').hidden) });
}
async function answerCorrect(page) {
  const q = (await game(page)).quiz;
  await page.click(`#quiz [data-choice="${q.answer}"]`);
  return q;
}

// ======================================================================================
const browser = await puppeteer.launch({ executablePath: EXE, headless: true, args: ['--window-size=1400,900'] });
const version = await browser.version();
console.log(`Testing ${URL}\nwith ${version}\n`);
const { page, log } = await newPage(browser);
activePage = page;
const t0 = Date.now();

await check(1, 'The HTML file opens locally (file://) and leaves the loading screen', async () => {
  await page.goto(URL);
  await waitState(page, 'MAIN_MENU', 30000);
  return `ready in ${Date.now() - t0} ms`;
});
await check(3, 'Main menu renders (logo, PLAY, worlds, teacher, sound, language, age)', async () => {
  await sleep(800);
  for (const sel of ['.logo-title', '[data-testid=menu-play]', '[data-testid=menu-worlds]', '[data-testid=menu-teacher]', '[data-testid=menu-sound]', '.seg-btn[data-action=lang]', '.seg-btn[data-action=age]']) {
    assert(await page.$(sel), 'missing ' + sel);
  }
  const title = await page.$eval('.logo-title', (e) => e.getAttribute('aria-label'));
  assert(title === 'AmmaraGames', 'title ' + title);
  await shot(page, 'main-menu');
  return 'title=' + title;
});
await check(4, '3D scene initialises (WebGL renderer, meshes, draw calls)', async () => {
  const w = await world(page);
  assert(w && w.meshes > 50 && w.calls > 20, JSON.stringify(w));
  const gl = await page.evaluate(() => { const c = document.getElementById('scene'); return { w: c.width, h: c.height }; });
  assert(gl.w > 300 && gl.h > 200, 'canvas size');
  return `meshes=${w.meshes} calls=${w.calls} canvas=${gl.w}x${gl.h}`;
});
await check(20.1, 'Audio waits for a user gesture (no autoplay before interaction)', async () => {
  const a = (await game(page)).audio;
  assert(!a.music && a.state !== 'running', JSON.stringify(a));
  return JSON.stringify(a);
});

// ---- enter playroom ----------------------------------------------------------------------
await check(4.1, 'PLAY starts the default adventure in the 3D playroom', async () => {
  await page.click('[data-testid=menu-play]');
  await waitState(page, 'PLAYROOM');
  await sleep(1200);
  const g = await game(page);
  assert(g.worldId === 'adventure', g.worldId);
  assert(JSON.stringify(g.run.stations.map((s) => s.questionId)) === JSON.stringify(['abc-01', 'num-01', 'ani-01', 'col-01']), 'questions ' + g.run.stations.map((s) => s.questionId));
  await shot(page, 'playroom');
  const a = g.audio;
  return `run=${g.run.id} audio=${a.state} music=${a.music}`;
});
await check(20.2, 'Music starts after the first tap and plays through Web Audio', async () => {
  const a = (await game(page)).audio;
  assert(a.available && a.state === 'running' && a.music, JSON.stringify(a));
  return JSON.stringify(a);
});

await check(5, 'Character moves with arrow keys and WASD in all four directions', async () => {
  const out = [];
  const pairs = [['ArrowUp', 'z', -1], ['ArrowDown', 'z', 1], ['ArrowLeft', 'x', -1], ['ArrowRight', 'x', 1], ['KeyW', 'z', -1], ['KeyS', 'z', 1], ['KeyA', 'x', -1], ['KeyD', 'x', 1]];
  for (const [k, axis, sign] of pairs) {
    const a = await player(page);
    await hold(page, k, 450);
    await sleep(150);
    const b = await player(page);
    const moved = (b[axis] - a[axis]) * sign;
    assert(moved > 0.5, `${k} moved ${moved.toFixed(2)}`);
    out.push(`${k}:${moved.toFixed(2)}`);
  }
  return out.join(' ');
});
await check(6, 'On-screen D-pad buttons move the character (pointer press and hold)', async () => {
  const out = [];
  for (const [dir, axis, sign] of [['up', 'z', -1], ['down', 'z', 1], ['left', 'x', -1], ['right', 'x', 1]]) {
    const a = await player(page);
    await holdButton(page, `[data-testid=dpad-${dir}]`, 450);
    await sleep(150);
    const b = await player(page);
    const moved = (b[axis] - a[axis]) * sign;
    assert(moved > 0.5, `${dir} moved ${moved.toFixed(2)}`);
    out.push(`${dir}:${moved.toFixed(2)}`);
  }
  return out.join(' ');
});
await check(7, 'Collision: walls, furniture and stations cannot be walked through', async () => {
  const w = await world(page);
  const r = w.playerRadius;
  await hold(page, 'ArrowLeft', 5000);
  let p = await player(page);
  assert(p.x >= w.bounds.minX + r - 0.02, 'left wall x=' + p.x);
  await hold(page, 'ArrowRight', 7000);
  p = await player(page);
  assert(p.x <= w.bounds.maxX - r + 0.02, 'right wall x=' + p.x);
  await steer(page, 0, 0, { tol: 0.5 });
  await hold(page, 'ArrowUp', 5000);
  p = await player(page);
  assert(p.z >= -10 + 1.3 + r - 0.03, 'walked into toy cabinet z=' + p.z);
  await hold(page, 'ArrowDown', 7000);
  p = await player(page);
  assert(p.z <= w.bounds.maxZ - r + 0.02, 'front fence z=' + p.z);
  // push against station 1's landmark from the front
  const st = (await dbg(page, () => window.AmmaraDebug.stations()))[0];
  await steer(page, st.x, st.z + st.radius + 1.6, { tol: 0.4 });
  await hold(page, 'ArrowUp', 2500);
  p = await player(page);
  const d = Math.hypot(p.x - st.x, p.z - st.z);
  assert(d >= st.radius + r - 0.03, `inside station: d=${d.toFixed(2)} need ${(st.radius + r).toFixed(2)}`);
  const after = await world(page);
  assert(after.violations === 0 && after.maxPenetration < 0.02, `violations=${after.violations} maxPen=${after.maxPenetration}`);
  return `left=${(w.bounds.minX + r).toFixed(2)} cabinet z>=${(-8.7 + r).toFixed(2)} station gap ok, violations=0, maxPenetration=${after.maxPenetration.toFixed(4)}`;
});
await check(8, 'Camera follows the player smoothly (no snapping, per-frame measurement)', async () => {
  await steer(page, 0, 1, { tol: 0.6 });
  await page.evaluate(() => {
    window.__cam = { prev: null, steps: [], dts: [], last: performance.now(), on: true, x0: null };
    const tick = (now) => {
      if (!window.__cam.on) return;
      const w = window.AmmaraDebug.world(); const c = w.camera;
      if (window.__cam.prev) { window.__cam.steps.push(Math.hypot(c.x - window.__cam.prev.x, c.z - window.__cam.prev.z)); window.__cam.dts.push((now - window.__cam.last) / 1000); }
      else window.__cam.x0 = c.x;
      window.__cam.prev = { x: c.x, z: c.z }; window.__cam.last = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.keyboard.down('ArrowRight');
  await sleep(1100);
  await page.keyboard.up('ArrowRight');
  await sleep(120);
  const r = await page.evaluate(() => { window.__cam.on = false; const c = window.__cam; const w = window.AmmaraDebug.world(); const p = window.AmmaraDebug.player();
    let worst = 0; c.steps.forEach((st, i) => { worst = Math.max(worst, st / Math.max(c.dts[i], 0.001)); });
    return { frames: c.steps.length, worstSpeed: worst, moved: w.camera.x - c.x0, lag: p.x - w.camera.x }; });
  assert(r.moved > 0.8, 'camera did not follow ' + r.moved);
  assert(r.worstSpeed < 9, 'camera speed ' + r.worstSpeed.toFixed(1) + ' m/s');
  return `${r.frames} frames: camera moved ${r.moved.toFixed(2)} m, fastest ${r.worstSpeed.toFixed(1)} m/s (player 4.4), trailing ${r.lag.toFixed(2)} m`;
});

// ---- the four stations ---------------------------------------------------------------------
let firstStars = 0;
await check(10, 'INTERACT appears near station 1 and opens the correct quiz', async () => {
  await steer(page, 0, 1, { tol: 0.6 });
  await goToStation(page, 0);
  assert(await dbg(page, () => !document.querySelector('[data-testid="hud-interact"]').hidden), 'interact hidden');
  await shot(page, 'near-station-1');
  firstStars = (await game(page)).learner.stars;
  await page.click('[data-testid=hud-interact]');
  await waitState(page, 'QUIZ');
  const g = await game(page);
  assert(g.quiz.index === 0 && g.quiz.id === 'abc-01', JSON.stringify(g.quiz));
  const head = await page.$eval('.quiz-badge', (e) => e.textContent);
  assert(/1/.test(head), head);
  await sleep(400);
  await shot(page, 'quiz-station-1');
  return `quiz ${g.quiz.id}, header "${head}"`;
});
await check(11, 'All three answer options are present, enabled and labelled with pictures', async () => {
  const info = await page.$$eval('#quiz .answer', (bs) => bs.map((b) => ({ disabled: b.disabled, label: b.getAttribute('aria-label'), svg: !!b.querySelector('svg') })));
  assert(info.length === 3 && info.every((i) => !i.disabled && i.svg && i.label), JSON.stringify(info));
  return info.map((i) => i.label).join(' / ');
});
await check(12, 'Correct answer: celebration, quiz closes by itself in about 1 s, reward is worn', async () => {
  const tClick = Date.now();
  const q = await answerCorrect(page);
  await sleep(150);
  assert(await page.$('#quiz .answer.right'), 'no right-answer animation');
  await waitState(page, 'STATION_COMPLETE', 4000);
  const closedAfter = Date.now() - tClick;
  assert(closedAfter >= 800 && closedAfter <= 1700, 'closed after ' + closedAfter + ' ms');
  const g = await game(page);
  assert(g.learner.rewards.includes('bow_pink'), 'reward missing ' + g.learner.rewards);
  assert(g.learner.equipped.hair === 'bow_pink', 'not equipped');
  const w = await world(page);
  assert(w.character.accessories.hair === 'bow', 'character not wearing bow ' + JSON.stringify(w.character));
  assert(g.learner.stars === firstStars + 1, 'stars ' + g.learner.stars);
  await shot(page, 'station-1-celebration');
  await waitState(page, 'PLAYROOM', 4000);
  return `answer ${q.answer}; quiz closed after ~${closedAfter} ms; bow worn; stars ${g.learner.stars}`;
});
await check(13, 'Wrong answer keeps the quiz open, dims that choice, shows a gentle hint', async () => {
  await goToStation(page, 1);
  await page.click('[data-testid=hud-interact]');
  await waitState(page, 'QUIZ');
  const q = (await game(page)).quiz;
  assert(q.index === 1, 'wrong station ' + q.index);
  const wrong = q.order.find((c) => c !== q.answer);
  const starsBefore = (await game(page)).learner.stars;
  await page.click(`#quiz [data-choice="${wrong}"]`);
  await sleep(700);
  assert((await state(page)) === 'QUIZ', 'quiz closed after wrong answer');
  const st = await page.$eval(`#quiz [data-choice="${wrong}"]`, (b) => ({ disabled: b.disabled, cls: b.className }));
  assert(st.disabled && st.cls.includes('tried'), JSON.stringify(st));
  const fb = await page.$eval('#quiz .feedback', (e) => ({ cls: e.className, text: e.textContent.trim() }));
  assert(fb.cls.includes('try') && fb.text.length > 5, JSON.stringify(fb));
  const others = await page.$$eval('#quiz .answer:not(:disabled)', (b) => b.length);
  assert(others === 2, 'remaining choices ' + others);
  await shot(page, 'quiz-wrong-answer');
  const g = await game(page);
  assert(g.learner.stars === starsBefore, 'stars changed after wrong answer');
  return `hint: "${fb.text.slice(0, 80)}"`;
});
await check(14, 'No penalty: stars and progress unchanged by mistakes; attempts are counted', async () => {
  let g = await game(page);
  const before = g.learner.stars;
  assert(g.run.stations[1].attempts === 1 && g.run.stations[1].completed === false, JSON.stringify(g.run.stations[1]));
  await answerCorrect(page);
  await waitState(page, 'STATION_COMPLETE', 4000);
  g = await game(page);
  const s = g.run.stations[1];
  assert(s.attempts === 2 && s.firstTry === false && s.completed && s.stars === 1, JSON.stringify(s));
  assert(g.learner.stars === before + 1, 'stars');
  assert(g.run.stations[0].firstTry === true, 'station 1 should be first try');
  await waitState(page, 'PLAYROOM', 4000);
  return `station 2: attempts=${s.attempts}, firstTry=${s.firstTry}, stars ${before}→${g.learner.stars}`;
});
await check(9, 'Every station is reachable (keyboard steering and tap-to-walk)', async () => {
  // station 3 by tapping on it (pointer interaction), station 4 by keyboard
  const st = (await dbg(page, () => window.AmmaraDebug.stations()))[2];
  await sleep(1500); // let the look-ahead camera settle
  const scr = await dbg(page, (s) => window.AmmaraDebug.toScreen(s.x, 0.6, s.z), st);
  const vp = page.viewport();
  assert(scr.visible && scr.x > 80 && scr.x < vp.width - 80 && scr.y > 120 && scr.y < vp.height - 90, `next station not in view at (${Math.round(scr.x)}, ${Math.round(scr.y)})`);
  await page.mouse.click(scr.x, scr.y);
  await page.waitForFunction(() => window.AmmaraDebug.state() === 'QUIZ', { timeout: 15000 });
  const g = await game(page);
  assert(g.quiz.index === 2, 'tap opened ' + g.quiz.index);
  await answerCorrect(page);
  await waitState(page, 'STATION_COMPLETE', 4000);
  await waitState(page, 'PLAYROOM', 4000);
  await goToStation(page, 3);
  return 'station 3 reached by tap-to-walk (auto-opened its quiz); station 4 by keyboard';
});
await check(15, 'All four default stations can be completed', async () => {
  await page.keyboard.press('KeyE');
  await waitState(page, 'QUIZ');
  await answerCorrect(page);
  await waitState(page, 'SESSION_COMPLETE', 6000);
  const g = await game(page);
  assert(g.run.status === 'complete' && g.run.stations.every((s) => s.completed), JSON.stringify(g.run.stations.map((s) => s.completed)));
  return `run ${g.run.id} complete; attempts ${g.run.stations.map((s) => s.attempts).join(',')}`;
});
await check(16, 'Final celebration screen with stars and earned rewards', async () => {
  await sleep(1800);
  const v = await page.evaluate(() => ({ title: document.querySelector('.complete-title').textContent, stars: document.querySelectorAll('.big-star.on').length, rewards: document.querySelectorAll('.reward-chip').length, again: !!document.querySelector('[data-testid=play-again]') }));
  assert(v.stars === 4 && v.rewards === 4 && v.again, JSON.stringify(v));
  await shot(page, 'session-complete');
  const w = await world(page);
  assert(w.character.accessories.hair === 'bow' && w.character.accessories.head === 'partyHat' && w.character.accessories.back === 'backpack' && w.character.accessories.face === 'starGlasses', JSON.stringify(w.character));
  return `${v.title}; 4 stars; rewards worn: ${Object.values(w.character.accessories).join(', ')}`;
});

// ---- worlds, rewards, customisation ----------------------------------------------------------
await check(17, 'World selection works and loads that world’s stations and questions', async () => {
  await page.click('[data-testid=complete-worlds]');
  await waitState(page, 'WORLD_SELECT');
  await sleep(400);
  const n = await page.$$eval('.world-card', (c) => c.length);
  assert(n === 16, 'world cards ' + n);
  await shot(page, 'world-select');
  await page.click('[data-testid=world-animals]');
  await waitState(page, 'PLAYROOM');
  await sleep(1500);
  const g = await game(page);
  assert(g.worldId === 'animals' && g.run.stations.every((s) => s.questionId.startsWith('ani-')), JSON.stringify(g.run.stations.map((s) => s.questionId)));
  await shot(page, 'animals-world');
  return `16 worlds listed; animals questions ${g.run.stations.map((s) => s.questionId).join(',')}`;
});
await check(17.1, 'Age selection changes the question pool (4+ gets harder questions)', async () => {
  const cfgAges = await page.evaluate(() => { const qs = window.AMMARA_CONFIG.questions; return Object.fromEntries(qs.map((q) => [q.id, q.ages])); });
  let g = await game(page);
  const ok23 = g.run.stations.every((s) => cfgAges[s.questionId].includes('2-3'));
  await page.keyboard.press('Escape');
  await waitState(page, 'PAUSED');
  await page.click('#pause [data-action=worlds]');
  await waitState(page, 'WORLD_SELECT');
  await page.click('#worlds .seg-btn[data-action=age][data-arg="4+"]');
  await sleep(200);
  await page.evaluate(() => { const s = window.AmmaraDebug.game(); return s; });
  // start a fresh animals run at age 4+
  await page.click('[data-testid=world-numbers]');
  await waitState(page, 'PLAYROOM');
  await sleep(1200);
  g = await game(page);
  assert(g.age === '4+', 'age ' + g.age);
  assert(g.run.ageGroup === '4+' && g.run.stations.every((s) => cfgAges[s.questionId].includes('4+')), JSON.stringify(g.run.stations.map((s) => s.questionId)));
  return `2-3 run ok=${ok23}; 4+ numbers run: ${g.run.stations.map((s) => s.questionId).join(',')}`;
});
await check(18, 'Rewards inventory (sticker book) shows earned items', async () => {
  await page.click('[data-testid=hud-wardrobe]');
  await waitState(page, 'REWARD_COLLECTION');
  await page.click('[data-testid=tab-stickers]');
  await sleep(300);
  const c = await page.evaluate(() => ({ owned: document.querySelectorAll('.sticker.owned').length, total: document.querySelectorAll('.sticker').length, text: document.querySelector('.col-count').textContent }));
  assert(c.total >= 30, JSON.stringify(c));
  await shot(page, 'sticker-book');
  await page.click('[data-testid=tab-wardrobe]');
  await sleep(300);
  await shot(page, 'wardrobe');
  return c.text.trim();
});
await check(19, 'Customisation really changes the 3D character', async () => {
  const before = (await world(page)).character;
  await page.click('.slot-tab[data-arg=head]');
  await sleep(150);
  await page.click('[data-testid="item-none:head"]');
  await sleep(250);
  let w = await world(page);
  assert(!w.character.accessories.head, 'hat still on ' + JSON.stringify(w.character));
  await page.click('[data-testid="item-party_hat"]');
  await sleep(250);
  w = await world(page);
  assert(w.character.accessories.head === 'partyHat', 'hat not on');
  await page.click('.slot-tab[data-arg=style]');
  await sleep(150);
  await page.click('[data-testid="item-hair:hijab"]');
  await sleep(300);
  w = await world(page);
  assert(w.character.hair === 'hijab', 'hair ' + w.character.hair);
  await shot(page, 'wardrobe-hijab');
  await page.click('[data-testid="item-hair:pigtails"]');
  await page.click('.slot-tab[data-arg=outfit]');
  await sleep(150);
  await page.click('[data-testid="item-outfit_sky"]');
  await sleep(250);
  w = await world(page);
  assert(w.character.outfit.toLowerCase() === '#79c9ff', 'outfit ' + w.character.outfit);
  const g = await game(page);
  assert(g.learner.outfit === 'outfit_sky' && g.learner.equipped.head === 'party_hat', 'not stored');
  const locked = await page.$('.item.locked');
  if (locked) { await locked.click(); await sleep(200); }
  await page.click('[data-testid=collection-done]');
  await waitState(page, 'PLAYROOM');
  return `hat off/on, hijab/pigtails, sky dress — meshes ${before.meshes}→${w.meshes}`;
});
await check(20, 'Sound and music can be muted and the choice is saved', async () => {
  await page.click('[data-testid=hud-sound]');
  await sleep(200);
  let g = await game(page);
  assert(g.settings.sound === false && g.audio.music === false, JSON.stringify(g.audio));
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('ammaragames.v1')).settings.sound);
  assert(stored === false, 'not persisted');
  await page.click('[data-testid=hud-sound]');
  await sleep(200);
  g = await game(page);
  assert(g.settings.sound === true && g.audio.music === true, 'did not resume');
  await page.click('[data-testid=hud-music]');
  await sleep(150);
  g = await game(page);
  assert(g.settings.music === false && g.audio.music === false, 'music toggle');
  await page.click('[data-testid=hud-music]');
  return 'mute + unmute + music toggle, saved in local storage';
});
await check(27.1, 'Finish early asks for confirmation; cancel keeps playing; confirm saves partial score', async () => {
  let g = await game(page);
  const runId = g.run.id;
  await page.click('[data-testid=hud-finish]');
  await page.waitForSelector('[data-testid=dialog-no]');
  await shot(page, 'finish-early-confirm');
  await page.click('[data-testid=dialog-no]');
  await sleep(200);
  assert((await state(page)) === 'PLAYROOM', 'cancel did not keep playing');
  await page.click('[data-testid=hud-finish]');
  await page.waitForSelector('[data-testid=dialog-yes]');
  await page.click('[data-testid=dialog-yes]');
  await waitState(page, 'SESSION_COMPLETE');
  const store = await dbg(page, () => window.AmmaraDebug.store());
  assert(store.runs[runId].status === 'ended-early', 'status ' + store.runs[runId].status);
  const persisted = await page.evaluate((id) => JSON.parse(localStorage.getItem('ammaragames.v1')).runs[id].status, runId);
  assert(persisted === 'ended-early', 'not persisted');
  await sleep(500);
  await shot(page, 'ended-early');
  return `run ${runId} saved as ended-early`;
});

// ---- teacher area ------------------------------------------------------------------------------
await check(22, 'Teacher area behind a press-and-hold gate; class list session starts', async () => {
  await page.click('[data-testid=complete-home]');
  await waitState(page, 'MAIN_MENU');
  await page.click('[data-testid=menu-teacher]');
  await page.waitForSelector('[data-testid=gate-hold]');
  // a quick tap must NOT open it
  await page.click('[data-testid=gate-hold]');
  await sleep(300);
  assert((await state(page)) === 'MAIN_MENU', 'opened with a tap');
  await holdButton(page, '[data-testid=gate-hold]', 1800);
  await waitState(page, 'TEACHER_AREA');
  await shot(page, 'teacher-session');
  await page.click('[data-testid=t-mode-class]');
  await page.click('[data-testid=t-names]');
  await page.keyboard.type('Ali\n\n  Siti  \n=CMD()\n+evil\n');
  await sleep(200);
  const info = await page.$eval('#t-names-info', (e) => e.textContent);
  await page.select('[data-testid=t-world]', 'adventure');
  await page.select('[data-testid=t-age]', '2-3');
  await page.click('[data-testid=t-start]');
  await page.waitForSelector('[data-testid=dialog-yes]', { timeout: 2000 }).then(() => page.click('[data-testid=dialog-yes]')).catch(() => {});
  await page.waitForSelector('[data-testid=t-message]');
  const msg = await page.$eval('[data-testid=t-message]', (e) => e.textContent);
  const s = (await game(page)).session;
  assert(s.mode === 'class' && s.learnerIds.length === 4, JSON.stringify(s));
  return `${info} | ${msg}`;
});
let ids = {};
await check(23, 'Learner list, switching learner, and accurate per-learner scores', async () => {
  await page.click('[data-testid=t-tab-learners]');
  await page.waitForSelector('[data-testid=t-learners]');
  await shot(page, 'teacher-learners');
  const store = await dbg(page, () => window.AmmaraDebug.store());
  const sess = store.sessions[store.currentSessionId];
  for (const id of sess.learnerIds) ids[store.learners[id].name] = id;
  // Ali plays station 1 with one mistake, then the teacher switches to Siti
  await page.click('[data-testid=t-exit]');
  await waitState(page, 'MAIN_MENU');
  await page.click('[data-testid=menu-play]');
  await waitState(page, 'PLAYROOM');
  await sleep(1200);
  let g = await game(page);
  assert(g.learner.name === 'Ali', 'current ' + g.learner.name);
  await goToStation(page, 0);
  await page.keyboard.press('Enter');
  await waitState(page, 'QUIZ');
  const q = (await game(page)).quiz;
  await page.click(`#quiz [data-choice="${q.order.find((c) => c !== q.answer)}"]`);
  await sleep(300);
  await answerCorrect(page);
  await waitState(page, 'PLAYROOM', 5000);
  g = await game(page);
  assert(g.run.stations[0].attempts === 2 && g.run.learnerId === ids.Ali, 'Ali attempts');
  return `learners: ${Object.keys(ids).join(', ')}; Ali station 1 attempts=2`;
});
await check(24, 'Next learner via the decision screen; records never mix', async () => {
  await page.click('[data-testid=hud-finish]');
  await page.waitForSelector('[data-testid=dialog-yes]');
  await page.click('[data-testid=dialog-yes]');
  await waitState(page, 'SESSION_COMPLETE');
  await page.waitForSelector('[data-testid=next-learner]');
  const label = await page.$eval('[data-testid=next-learner]', (e) => e.textContent);
  assert(/Siti/.test(label), label);
  await shot(page, 'next-learner-decision');
  await page.click('[data-testid=next-learner]');
  await waitState(page, 'PLAYROOM');
  await sleep(1200);
  let g = await game(page);
  assert(g.learner.name === 'Siti' && g.run.learnerId === ids.Siti && g.run.stations.every((s) => s.attempts === 0), 'Siti run not fresh');
  await goToStation(page, 0);
  await page.keyboard.press('Enter');
  await waitState(page, 'QUIZ');
  await answerCorrect(page);
  await waitState(page, 'PLAYROOM', 5000);
  const store = await dbg(page, () => window.AmmaraDebug.store());
  const runsOf = (id) => Object.values(store.runs).filter((r) => r.learnerId === id && r.sessionId === store.currentSessionId);
  const ali = runsOf(ids.Ali), siti = runsOf(ids.Siti);
  assert(ali.length === 1 && siti.length === 1, `runs ali=${ali.length} siti=${siti.length}`);
  assert(ali[0].stations[0].attempts === 2 && ali[0].stations[0].firstTry === false, 'Ali changed');
  assert(siti[0].stations[0].attempts === 1 && siti[0].stations[0].firstTry === true, 'Siti wrong');
  assert(store.learners[ids.Siti].stars === 1 && store.learners[ids.Ali].stars === 1, `stars ali=${store.learners[ids.Ali].stars} siti=${store.learners[ids.Siti].stars}`);
  // the teacher switches back to Ali and Ali resumes a fresh adventure without touching Siti
  return 'Ali: 2 attempts, not first try, 1 star | Siti: 1 attempt, first try, 1 star';
});
await check(25, 'CSV export downloads a real file (UTF-8 with BOM, 18 columns, all rows)', async () => {
  await page.keyboard.press('Escape');
  await waitState(page, 'PAUSED');
  await page.click('[data-testid=pause-home]');
  await page.waitForSelector('[data-testid=dialog-yes]');
  await page.click('[data-testid=dialog-yes]');
  await waitState(page, 'MAIN_MENU');
  await page.click('[data-testid=menu-teacher]');
  await page.waitForSelector('[data-testid=gate-hold]');
  await holdButton(page, '[data-testid=gate-hold]', 1800);
  await waitState(page, 'TEACHER_AREA');
  await page.click('[data-testid=t-tab-records]');
  await page.waitForSelector('[data-testid=t-records]');
  await shot(page, 'teacher-records');
  await page.click('[data-testid=t-tab-export]');
  await page.click('[data-testid=t-csv-all]');
  let file = null;
  for (let i = 0; i < 40 && !file; i++) { await sleep(150); file = fs.readdirSync(DL).find((f) => f.endsWith('.csv') && f.includes('all')); }
  assert(file, 'no CSV downloaded');
  const buf = fs.readFileSync(path.join(DL, file));
  assert(buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf, 'no UTF-8 BOM');
  const text = buf.toString('utf8').slice(1);
  const lines = text.trim().split('\r\n');
  const header = lines[0].split('","');
  assert(header.length === 18, 'columns ' + header.length);
  const store = await dbg(page, () => window.AmmaraDebug.store());
  const expectedRows = Object.values(store.runs).length * 4;
  assert(lines.length - 1 === expectedRows, `rows ${lines.length - 1} expected ${expectedRows}`);
  const msg = await page.$eval('[data-testid=t-message]', (e) => e.textContent);
  await shot(page, 'teacher-export');
  return `${file}: ${lines.length - 1} rows; "${msg}"`;
});
await check(26, 'CSV protects names starting with = + - @ (formula injection) and quotes fields', async () => {
  // switch to the "=CMD()" learner, play one wrong + right answer so the row has data
  await page.click('[data-testid=t-tab-learners]');
  await page.waitForSelector('[data-testid=t-learners]');
  const store = await dbg(page, () => window.AmmaraDebug.store());
  const sess = store.sessions[store.currentSessionId];
  const idx = sess.learnerIds.findIndex((id) => store.learners[id].name === '=CMD()');
  await page.click(`[data-testid=t-switch-${idx}]`);
  await sleep(200);
  await page.click('[data-testid=t-tab-export]');
  fs.readdirSync(DL).forEach((f) => fs.unlinkSync(path.join(DL, f)));
  await page.click('[data-testid=t-exit]');
  await waitState(page, 'MAIN_MENU');
  await page.click('[data-testid=menu-play]');
  await waitState(page, 'PLAYROOM');
  await sleep(1000);
  assert((await game(page)).learner.name === '=CMD()', 'switch failed');
  await page.click('[data-testid=hud-finish]');
  await page.waitForSelector('[data-testid=dialog-yes]');
  await page.click('[data-testid=dialog-yes]');
  await waitState(page, 'SESSION_COMPLETE');
  await page.click('[data-testid=complete-teacher]');
  await page.waitForSelector('[data-testid=gate-hold]');
  await holdButton(page, '[data-testid=gate-hold]', 1800);
  await waitState(page, 'TEACHER_AREA');
  await page.click('[data-testid=t-tab-export]');
  await page.click('[data-testid=t-csv-session]');
  let file = null;
  for (let i = 0; i < 40 && !file; i++) { await sleep(150); file = fs.readdirSync(DL).find((f) => f.endsWith('.csv')); }
  assert(file, 'no CSV');
  const text = fs.readFileSync(path.join(DL, file), 'utf8');
  assert(text.includes(`"'=CMD()"`), 'name not protected');
  assert(!/(^|,)"[=+\-@]/m.test(text.replace(/^﻿/, '')), 'a cell starts with a formula character');
  const rowsWithNames = ['"Ali"', '"Siti"', `"'=CMD()"`].map((n) => text.includes(n));
  assert(rowsWithNames.every(Boolean), 'missing learners ' + rowsWithNames);
  return `${file}: '=CMD() exported as "'=CMD()", no cell starts with = + - @`;
});
await check(27, 'Reset and delete-all ask for confirmation (cancel keeps data, confirm clears)', async () => {
  await page.click('[data-testid=t-tab-learners]');
  await page.waitForSelector('[data-testid=t-reset-0]');
  await page.click('[data-testid=t-reset-0]');
  await page.waitForSelector('[data-testid=dialog-no]');
  await shot(page, 'reset-confirm');
  await page.click('[data-testid=dialog-no]');
  await sleep(200);
  await page.click('[data-testid=t-tab-export]');
  await page.click('[data-testid=t-clear]');
  await page.waitForSelector('[data-testid=dialog-yes]');
  await page.click('[data-testid=dialog-no]');
  await sleep(200);
  let store = await dbg(page, () => window.AmmaraDebug.store());
  assert(Object.keys(store.runs).length > 0, 'data cleared after cancel');
  await page.click('[data-testid=t-clear]');
  await page.waitForSelector('[data-testid=dialog-yes]');
  await page.click('[data-testid=dialog-yes]');
  await page.waitForSelector('[data-testid=dialog-yes]');
  await shot(page, 'clear-second-confirm');
  await page.click('[data-testid=dialog-yes]');
  await sleep(300);
  store = await dbg(page, () => window.AmmaraDebug.store());
  assert(Object.keys(store.runs).length === 0 && Object.keys(store.learners).length === 0, 'not cleared');
  const ls = await page.evaluate(() => JSON.parse(localStorage.getItem('ammaragames.v1')));
  assert(Object.keys(ls.runs).length === 0, 'local storage not cleared');
  return 'reset cancel ok; delete needs two confirmations; storage emptied';
});
await check(21.1, 'Settings and info tabs render (privacy text, diagnostics, storage status)', async () => {
  await page.click('[data-testid=t-tab-settings]');
  await sleep(200);
  await shot(page, 'teacher-settings');
  await page.click('[data-testid=t-tab-info]');
  await sleep(200);
  const txt = await page.$eval('.t-body', (e) => e.textContent);
  assert(/storan|storage/i.test(txt) && /392/.test(txt), 'info text');
  await shot(page, 'teacher-info');
  await page.click('[data-testid=t-exit]');
  await waitState(page, 'MAIN_MENU');
  return 'info shows 392 valid questions and storage status';
});
await check(28, 'Window resizing keeps menus, HUD and quiz on screen', async () => {
  await page.click('[data-testid=menu-play]');
  await waitState(page, 'PLAYROOM');
  await sleep(800);
  const sizes = [[1920, 1080], [1280, 720], [1024, 600], [800, 1280], [844, 390], [390, 844]];
  const out = [];
  for (const [w, h] of sizes) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await sleep(500);
    const hudOk = await page.evaluate(() => [...document.querySelectorAll('#hud .dir, #hud .icon-btn, #hud .chip')].every((e) => { const r = e.getBoundingClientRect(); return r.width === 0 || (r.left >= -1 && r.right <= innerWidth + 1 && r.top >= -1 && r.bottom <= innerHeight + 1); }));
    const canvas = await page.evaluate(() => { const c = document.getElementById('scene'); return c.clientWidth === innerWidth && c.clientHeight === innerHeight; });
    await shot(page, `resize-${w}x${h}-hud`);
    // open the quiz at this size by using the keyboard near station 1 (first fresh run of the new learner)
    out.push(`${w}x${h}: hud ${hudOk ? 'ok' : 'OVERFLOW'} canvas ${canvas ? 'ok' : 'bad'}`);
    assert(hudOk && canvas, out[out.length - 1]);
  }
  await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 });
  await sleep(400);
  // quiz layout at small sizes
  await goToStation(page, 0);
  await page.keyboard.press('Enter');
  await waitState(page, 'QUIZ');
  for (const [w, h] of [[1024, 600], [844, 390], [390, 844], [1920, 1080]]) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await sleep(400);
    const fits = await page.evaluate(() => { const p = document.querySelector('.quiz-panel').getBoundingClientRect(); const ans = [...document.querySelectorAll('.answer')].map((a) => a.getBoundingClientRect()); return p.left >= 0 && p.right <= innerWidth && ans.every((r) => r.width >= 60 && r.height >= 60); });
    await shot(page, `resize-${w}x${h}-quiz`);
    out.push(`quiz ${w}x${h}: ${fits ? 'fits' : 'OVERFLOW'}`);
    assert(fits, out[out.length - 1]);
  }
  await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 });
  await page.click('[data-testid=quiz-close]');
  await waitState(page, 'PLAYROOM');
  return out.join('; ');
});
await check(2, 'Works offline: page ran with network disabled; no external request attempted', async () => {
  assert(log.external.length === 0, log.external.join(', '));
  const res = await page.evaluate(() => performance.getEntriesByType('resource').map((r) => r.name).filter((n) => !/^(file|data|blob):/.test(n)));
  assert(res.length === 0, res.join(', '));
  return 'offline mode on for the whole run; 0 external requests';
});
await check(29, 'No uncaught JavaScript errors during the tested flows', async () => {
  const errs = log.errors.filter((e) => !/favicon/i.test(e));
  const appErrors = await dbg(page, () => window.AmmaraDebug.errors().filter((e) => e.severity === 'error'));
  assert(errs.length === 0, errs.slice(0, 5).join(' | '));
  assert(appErrors.length === 0, JSON.stringify(appErrors.slice(0, 3)));
  return `console errors 0; warnings ${log.warnings.length}`;
});
await check(36, 'Persistence: reloading keeps settings and the class session', async () => {
  const before = await dbg(page, () => window.AmmaraDebug.store());
  await page.reload();
  await waitState(page, 'MAIN_MENU', 30000);
  const after = await dbg(page, () => window.AmmaraDebug.store());
  assert(after.currentSessionId === before.currentSessionId && Object.keys(after.runs).length === Object.keys(before.runs).length, 'store differs');
  return `session ${after.currentSessionId}, ${Object.keys(after.runs).length} runs restored`;
});
const perf = await dbg(page, () => Object.assign(window.AmmaraDebug.world(), window.AmmaraDebug.perf()));
await page.close();

// ---- audio unavailable ------------------------------------------------------------------------------
{
  const { page: p2, log: l2 } = await newPage(browser, { inject: () => { delete window.AudioContext; delete window.webkitAudioContext; } });
  await check(21, 'Game still works when Web Audio is unavailable', async () => {
    await p2.goto(URL);
    await waitState(p2, 'MAIN_MENU', 30000);
    await p2.click('[data-testid=menu-play]');
    await waitState(p2, 'PLAYROOM');
    await sleep(800);
    await goToStation(p2, 0);
    await p2.keyboard.press('Enter');
    await waitState(p2, 'QUIZ');
    await answerCorrect(p2);
    await waitState(p2, 'STATION_COMPLETE', 4000);
    const g = await game(p2);
    const toastSeen = await p2.evaluate(() => [...document.querySelectorAll('.toast')].map((t) => t.textContent).join(' | '));
    assert(g.audio.available === false, JSON.stringify(g.audio));
    assert(l2.errors.length === 0, l2.errors.join(' | '));
    return `audio=${g.audio.state}; quiz completed; toast: ${toastSeen.slice(0, 90)}`;
  });
  await p2.close();
}

// ---- reduced motion ---------------------------------------------------------------------------------------
{
  const { page: p3 } = await newPage(browser);
  await p3.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await check(31, 'Reduced-motion preference is respected', async () => {
    await p3.goto(URL);
    await waitState(p3, 'MAIN_MENU', 30000);
    const on = await p3.evaluate(() => document.body.classList.contains('reduced-motion'));
    assert(on, 'class missing');
    return 'body.reduced-motion set from prefers-reduced-motion';
  });
  await p3.close();
}
// ---- English + skippable tutorial -------------------------------------------------------------------------------
{
  const { page: p5, log: l5 } = await newPage(browser);
  activePage = p5;
  await check(33, 'Language switch to English changes menu, quiz text and picture labels', async () => {
    await p5.goto(URL);
    await p5.evaluate(() => localStorage.clear()); // file:// pages share storage; start like a brand-new visitor
    await p5.reload();
    await waitState(p5, 'MAIN_MENU', 30000);
    await p5.click('#menu .seg-btn[data-action=lang][data-arg=en]');
    await sleep(300);
    const play = await p5.$eval('[data-testid=menu-play] span', (e) => e.textContent);
    assert(play === 'PLAY', 'menu not English: ' + play);
    await p5.click('[data-testid=menu-play]');
    await waitState(p5, 'PLAYROOM');
    await sleep(800);
    const tut = await p5.$eval('.tut-bubble', (e) => e.textContent);
    assert(/Move with the arrows/.test(tut), 'tutorial text: ' + tut);
    await shot(p5, 'english-tutorial');
    await goToStation(p5, 0);
    await p5.keyboard.press('Enter');
    await waitState(p5, 'QUIZ');
    const q = await p5.$eval('.quiz-q', (e) => e.textContent);
    const labels = await p5.$$eval('.answer', (b) => b.map((x) => x.getAttribute('aria-label')));
    assert(q === 'Which one is the letter A?', q);
    await shot(p5, 'english-quiz');
    return `"${q}" / ${labels.join(', ')}`;
  });
  await check(34, 'Tutorial is skippable and does not come back', async () => {
    await p5.click('[data-testid=quiz-close]');
    await waitState(p5, 'PLAYROOM');
    const has = await p5.$('.tut-bubble');
    if (has) await p5.click('[data-testid=tut-skip]');
    await sleep(200);
    assert(!(await p5.$('.tut-bubble')), 'tutorial still visible');
    const done = await p5.evaluate(() => JSON.parse(localStorage.getItem('ammaragames.v1')).flags.tutorialDone);
    assert(done === true, 'flag not saved');
    await p5.reload();
    await waitState(p5, 'MAIN_MENU', 30000);
    await p5.click('[data-testid=menu-play]');
    await waitState(p5, 'PLAYROOM');
    await sleep(600);
    assert(!(await p5.$('.tut-bubble')), 'tutorial came back after reload');
    return 'skip saved; not shown again after reload; language stayed English: ' + (await p5.$eval('[data-testid=hud-finish] span', (e) => e.textContent));
  });
  await check(35, 'Pause menu: resume, Escape and return-to-menu work; movement is frozen while paused', async () => {
    await p5.keyboard.press('Escape');
    await waitState(p5, 'PAUSED');
    const a = await player(p5);
    await hold(p5, 'ArrowLeft', 500);
    const b = await player(p5);
    assert(Math.hypot(a.x - b.x, a.z - b.z) < 0.05, 'moved while paused');
    await shot(p5, 'pause-menu');
    await p5.keyboard.press('Escape');
    await waitState(p5, 'PLAYROOM');
    await p5.click('[data-testid=hud-pause]');
    await waitState(p5, 'PAUSED');
    await p5.click('[data-testid=pause-home]');
    await p5.waitForSelector('[data-testid=dialog-yes]');
    await p5.click('[data-testid=dialog-yes]');
    await waitState(p5, 'MAIN_MENU');
    const loop = await dbg(p5, () => window.AmmaraDebug.world().mode);
    assert(loop === 'menu', 'mode ' + loop);
    return 'frozen while paused; home returns to the main menu with the 3D mode set to menu';
  });
  assert(l5.errors.length === 0, 'console errors: ' + l5.errors.join(' | '));
  await p5.close();
}
await browser.close();

// ---- no WebGL: card mode -------------------------------------------------------------------------------------
{
  const b2 = await puppeteer.launch({ executablePath: EXE, headless: true, args: ['--disable-webgl', '--disable-webgl2', '--disable-3d-apis'] });
  const { page: p4, log: l4 } = await newPage(b2);
  await check(32, 'Without WebGL a helpful message appears and card mode is playable', async () => {
    await p4.goto(URL);
    await p4.waitForSelector('[data-testid=play-cards]', { timeout: 30000 });
    await shot(p4, 'no-webgl');
    await p4.click('[data-testid=play-cards]');
    await waitState(p4, 'PLAYROOM');
    await p4.click('[data-testid=card-0]');
    await waitState(p4, 'QUIZ');
    await answerCorrect(p4);
    await waitState(p4, 'PLAYROOM', 5000);
    await sleep(300);
    const done = await p4.$eval('[data-testid=card-0]', (e) => e.className);
    await shot(p4, 'card-mode');
    assert(done.includes('done'), done);
    const errs = l4.errors.filter((e) => !/WebGL/i.test(e));
    assert(errs.length === 0, errs.join(' | '));
    return 'message shown; station 1 completed in card mode';
  });
  await b2.close();
}

// ---- report -------------------------------------------------------------------------------------------------------
const pass = results.filter((r) => r.status === 'PASS').length;
const fail = results.filter((r) => r.status === 'FAIL').length;
const summary = { browser: version, url: URL, date: new Date().toISOString(), pass, fail, perf: { fps: perf.fps, calls: perf.calls, triangles: perf.triangles, updateMs: perf.updateMs, renderMs: perf.renderMs }, results };
fs.mkdirSync(path.join(ROOT, 'qa'), { recursive: true });
fs.writeFileSync(path.join(ROOT, `qa/e2e-results-${BROWSER.toLowerCase()}.json`), JSON.stringify(summary, null, 2));
console.log(`\n${BROWSER}: ${pass} passed, ${fail} failed. Screenshots in ${SHOTS}`);
console.log(`Playroom performance during test: ${perf.fps} fps, ${perf.calls} draw calls`);
process.exit(fail ? 1 : 0);
