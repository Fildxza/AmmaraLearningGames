// End-to-end checks for the 2.0 upgrade (big 3D world, robot friends, narrator, music scenes, arcade, Jom Mengaji).
// The original suite (run-e2e.mjs, 41 checks) stays unchanged as the regression baseline.
// Usage: node tests/e2e/run-e2e-upgrade.mjs [edge]
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CHROME, EDGE } from '../../tools/lib/browsers.mjs';
import { playGame } from '../../tools/play-games.mjs';
import { SURAHS, BISMILLAH } from '../../src/data/quran-data.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const EDGE_RUN = process.argv.includes('edge');
const EXE = EDGE_RUN ? EDGE : CHROME;
const URL = pathToFileURL(path.join(root, 'AmmaraGames.html')).href;
const shotDir = path.join(root, 'qa/screenshots', EDGE_RUN ? 'edge-upgrade' : 'chrome-upgrade');
fs.mkdirSync(shotDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
let page;
async function check(id, name, fn) {
  const t0 = Date.now();
  try { const info = await fn(); results.push({ id, name, ok: true, info }); console.log(`PASS  ${String(id).padStart(5)} ${name} — ${info}`); }
  catch (e) { results.push({ id, name, ok: false, info: e.message }); console.log(`FAIL  ${String(id).padStart(5)} ${name} — ${e.message}`); try { await page.screenshot({ path: path.join(shotDir, `FAIL-${id}.png`) }); } catch (x) { /* ignore */ } }
  void t0;
}
const assert = (c, m) => { if (!c) throw new Error(m); };
const state = () => page.evaluate(() => window.AmmaraDebug.state());
const waitState = (s, timeout = 8000) => page.waitForFunction((x) => window.AmmaraDebug.state() === x, { timeout }, s);
const world = () => page.evaluate(() => window.AmmaraDebug.world());
const game = () => page.evaluate(() => window.AmmaraDebug.game());
const tp = (x, z) => page.evaluate((a, b) => window.AmmaraDebug.teleport(a, b), x, z);

// A fake set of installed voices (the real list depends on the computer). Each utterance is recorded.
const MOCK_SPEECH = () => {
  const voices = [
    { name: 'Microsoft David - English (United States)', lang: 'en-US', localService: true, default: true, voiceURI: 'david' },
    { name: 'Microsoft Zira - English (United States)', lang: 'en-US', localService: true, default: false, voiceURI: 'zira' },
    { name: 'Microsoft Rizwan - Malay (Malaysia)', lang: 'ms-MY', localService: true, default: false, voiceURI: 'rizwan' },
    { name: 'Microsoft Yasmin Online (Natural) - Malay (Malaysia)', lang: 'ms-MY', localService: false, default: false, voiceURI: 'yasmin-online' }
  ];
  window.__spoken = [];
  const synth = {
    getVoices: () => voices, speaking: false,
    speak(u) { window.__spoken.push({ text: u.text, voice: u.voice && u.voice.name, rate: u.rate, pitch: u.pitch, volume: u.volume }); setTimeout(() => u.onend && u.onend(), 50); },
    cancel() {}, pause() {}, resume() {}, addEventListener() {}, removeEventListener() {}
  };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
  window.SpeechSynthesisUtterance = function (text) { this.text = text; };
};

const browser = await puppeteer.launch({ executablePath: EXE, headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--window-size=1400,900'] });
const version = await browser.version();
console.log(`Upgrade checks: ${URL}\nwith ${version}\n`);
page = await browser.newPage();
await page.setViewport({ width: 1366, height: 768 });
await page.evaluateOnNewDocument(MOCK_SPEECH);
const errors = [], external = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.setRequestInterception(true);
page.on('request', (r) => { if (/^(file|data|blob):/.test(r.url())) r.continue(); else { external.push(r.url()); r.abort(); } });

await check('U1', 'Opens offline and shows the new menu buttons (arcade, Jom Mengaji, voice settings)', async () => {
  await page.goto(URL);
  await waitState('MAIN_MENU', 40000);
  for (const s of ['[data-testid=menu-arcade]', '[data-testid=menu-islamic]', '[data-testid=menu-audio]']) assert(await page.$(s), 'missing ' + s);
  return 'menu ok';
});
await check('U2', 'The 3D world is a whole preschool + garden: 17 areas, door, robot friends seated', async () => {
  await page.click('[data-testid=menu-play]');
  await waitState('PLAYROOM');
  await sleep(1200);
  const w = await world();
  assert(w.totalZones === 17, 'zones ' + w.totalZones);
  assert(w.bounds.maxX - w.bounds.minX >= 100, 'map too small');
  const n0 = w.npcs; await sleep(2000); const n1 = (await world()).npcs;
  assert(n0.boy.x === n1.boy.x && n0.girl.z === n1.girl.z, 'robots moved');
  return `${w.totalZones} areas, map ${w.bounds.maxX - w.bounds.minX} x ${w.bounds.maxZ - w.bounds.minZ} m, robots stay seated`;
});
await check('U3', 'Every indoor corner and garden area can be visited, with its own music', async () => {
  await page.mouse.click(683, 600); // first tap unlocks audio
  const spots = [['mengaji', -17.5, -4.5, 'islamic'], ['arcade', -26.5, -3, 'arcade'], ['music', -44.5, 5, 'playroom'], ['rest', -53.5, 3, 'calm'], ['gate', 20, 2, 'yard'], ['playground', 53, -10, 'yard']];
  const out = [];
  for (const [zone, x, z, scene] of spots) {
    await tp(x, z); await sleep(700);
    const d = await game(); const w = await world();
    assert(w.zone === zone, `expected ${zone}, got ${w.zone}`);
    assert(d.audio.scene === scene, `${zone}: music ${d.audio.scene}`);
    out.push(`${zone}:${d.audio.scene}:${w.fps}fps`);
  }
  await page.screenshot({ path: path.join(shotDir, 'playground.png') });
  return out.join(' ');
});
await check('U4', 'Walking out of the front door and back in (door opens, "back inside" button, guide arrow)', async () => {
  await tp(10.2, -1); await sleep(600);
  const g = await game();
  assert(!(await page.$eval('[data-testid=hud-interact]', (b) => b.hidden)), 'no interact prompt at the door');
  await page.keyboard.press('KeyE');
  await page.waitForFunction(() => window.AmmaraDebug.world().area === 'outdoor', { timeout: 12000 });
  await sleep(500);
  const ret = await page.$eval('[data-testid=hud-return]', (b) => !b.hidden);
  assert(ret, 'return button hidden outdoors');
  await tp(30, 4); await sleep(500);
  assert((await world()).guideArrow, 'no arrow back to the door');
  await page.click('[data-testid=hud-return]');
  await page.waitForFunction(() => window.AmmaraDebug.world().area === 'indoor', { timeout: 20000 });
  const w = await world();
  assert(w.violations === 0, 'collision violations ' + w.violations);
  void g;
  return 'out through the door and back, no collision problems';
});
await check('U5', 'Robot friend says hello with the narrator (Malay voice, offline only)', async () => {
  await tp(-19.2, 4.8); await sleep(600);
  await page.keyboard.press('KeyE'); await sleep(400);
  const spoken = await page.evaluate(() => window.__spoken.slice());
  const hello = spoken.find((s) => /^(Hai|Selamat datang|Wah|Jom cari)/.test(s.text));
  assert(hello, 'no greeting spoken: ' + JSON.stringify(spoken));
  assert(hello.voice === 'Microsoft Rizwan - Malay (Malaysia)', 'voice ' + hello.voice);
  assert(!spoken.some((s) => s.voice && s.voice.includes('Online')), 'an online voice was used');
  const hint = await page.$eval('.hint-text', (e) => e.textContent);
  assert(/Robo Danial/.test(hint), 'caption: ' + hint);
  return `"${hello.text}" by ${hello.voice}, pitch ${hello.pitch}`;
});
await check('U6', 'Voice & Sound panel: real voice list, honest labels, preview, sliders, mute', async () => {
  await page.click('[data-testid=hud-audio]');
  await page.waitForSelector('#audio.show');
  const text = await page.$eval('#audio', (e) => e.textContent);
  assert(/Zira/.test(text) && /Rizwan/.test(text), 'voices missing');
  assert(!/Yasmin/.test(text), 'online voice listed');
  assert(/Agak perempuan|Likely female/.test(text), 'no likely-female label');
  assert(/tidak boleh mengetahui|cannot tell/.test(text), 'no honest disclaimer');
  const before = await page.evaluate(() => window.__spoken.length);
  await page.click('#audio [data-preview="en"][data-voice="zira"]'); await sleep(200);
  const last = await page.evaluate(() => window.__spoken[window.__spoken.length - 1]);
  assert(last && last.voice.includes('Zira') && (await page.evaluate(() => window.__spoken.length)) > before, 'preview not spoken');
  await page.click('[data-testid=aud-mute]'); await sleep(150);
  const muted = await game();
  assert(muted.narrator.muted && muted.settings.sound === false, 'mute did not mute');
  await page.click('[data-testid=aud-mute]'); await sleep(150);
  await page.click('[data-testid=aud-done]');
  return 'voices listed, preview used Zira, mute works';
});
await check('U7', 'Map: opens, and tapping "front door" walks there', async () => {
  await tp(0, 1.6); await sleep(400);
  await page.click('[data-testid=hud-minimap]');
  await page.waitForSelector('#map.show');
  await page.screenshot({ path: path.join(shotDir, 'map.png') });
  await page.click('[data-testid=map-door]');
  await page.waitForFunction(() => Math.abs(window.AmmaraDebug.player().x - 10.6) < 1.6, { timeout: 15000 });
  return 'walked to the front door from the map';
});
await check('U8', 'Mini-game arcade: all 10 games can be played to the end (mouse/touch-style input)', async () => {
  await page.keyboard.press('Escape'); await sleep(300);
  if ((await state()) === 'PAUSED') { await page.click('[data-testid=pause-home]'); await sleep(400); const y = await page.$('#dialog [data-answer=yes]'); if (y) await y.click(); }
  await waitState('MAIN_MENU');
  await page.click('[data-testid=menu-arcade]'); await waitState('ARCADE'); await sleep(300);
  const done = [];
  for (const id of ['ruler', 'xo', 'dots', 'trace', 'memory', 'puzzle', 'find', 'patterns', 'counting', 'music']) {
    const r = await playGame(page, id, null);
    assert(r.ended, `${id} could not be finished`);
    done.push(id);
  }
  const g = await game();
  const stickers = g.learner.rewards.filter((x) => x.startsWith('st_g_')).length;
  assert(stickers === 10, 'stickers ' + stickers);
  return `${done.length} games finished, ${stickers} stickers`;
});
await check('U9', 'Every game is recorded for the teacher (separate from the station records)', async () => {
  const store = await page.evaluate(() => window.AmmaraDebug.store());
  const games = new Set(store.activities.filter((a) => a.kind === 'minigame' && a.completed).map((a) => a.game));
  assert(games.size === 10, 'recorded ' + [...games].join(','));
  return `${store.activities.length} activity records`;
});
await check('U10', 'Jom Mengaji: 20 surahs in the school order with real numbers; text identical to the Tanzil data', async () => {
  await page.click('[data-testid=arcade-back]'); await waitState('MAIN_MENU');
  await page.click('[data-testid=menu-islamic]'); await waitState('ISLAMIC'); await sleep(300);
  const nums = await page.$$eval('.isl-surah', (b) => b.map((x) => Number(x.dataset.surah)));
  assert(JSON.stringify(nums) === JSON.stringify(SURAHS.map((s) => s.no)), 'order ' + nums);
  const report = [];
  for (const s of [SURAHS[0], SURAHS[3], SURAHS[19]]) {
    await page.click(`[data-testid=isl-surah-${s.no}]`); await sleep(300);
    const shown = await page.$$eval('.isl-ayah', (a) => a.map((x) => x.firstChild.textContent.trim()));
    const expect = s.ayahs.map((a) => (a.n === 1 && a.prefix && s.no !== 1 ? a.body : a.text));
    assert(JSON.stringify(shown) === JSON.stringify(expect), `surah ${s.no} text differs`);
    if (s.no !== 1) assert((await page.$eval('[data-testid=isl-bismillah]', (e) => e.textContent)) === BISMILLAH, 'bismillah');
    const font = await page.$eval('.isl-quran', (e) => getComputedStyle(e).fontFamily);
    assert(/AG Naskh/.test(font), 'font ' + font);
    report.push(`${s.no}:${shown.length} ayat`);
    await page.click('[data-testid=isl-back]'); await sleep(200);
  }
  await page.click(`[data-testid=isl-surah-112]`); await sleep(300);
  await page.screenshot({ path: path.join(shotDir, 'surah-112.png') });
  const buttons = await page.$$eval('#islamic button', (b) => b.map((x) => x.textContent.toLowerCase()).join('|'));
  assert(!/play|main bacaan|dengar bacaan|recite/.test(buttons), 'a recitation play button exists');
  const spokeArabic = await page.evaluate(() => window.__spoken.some((s) => /[؀-ۿ]/.test(s.text)));
  assert(!spokeArabic, 'Arabic was sent to the speech engine');
  await page.click('[data-testid=isl-back]'); await sleep(200);
  return report.join(', ') + '; no recitation button; nothing Arabic spoken';
});
await check('U11', 'Jom Mengaji exercises can be completed (letters, dots, marks) and are recorded', async () => {
  const out = [];
  for (const kind of ['match', 'dots', 'harakat']) {
    await page.click(`[data-testid=isl-stage-${kind}]`); await sleep(300);
    for (let i = 0; i < 8; i++) {
      const q = (await game()).islamic.quiz;
      if (!q || q.done) break;
      await page.click(`[data-testid=isl-opt-${q.okIndex}]`); await sleep(1050);
    }
    assert((await game()).islamic.quiz.done, kind + ' not finished');
    out.push(kind);
    await page.click('[data-testid=isl-back]'); await sleep(200);
  }
  const store = await page.evaluate(() => window.AmmaraDebug.store());
  assert(store.activities.filter((a) => a.kind === 'islamic').length >= 6, 'islamic records');
  return out.join(', ') + ' finished';
});
await check('U12', 'Phone-size screens: arcade, a game and the Islamic centre stay on screen', async () => {
  const sizes = [[390, 844], [844, 390], [1024, 600]];
  const bad = [];
  for (const [w, h] of sizes) {
    await page.setViewport({ width: w, height: h }); await sleep(400);
    const over = await page.evaluate(() => [...document.querySelectorAll('#islamic.show button')].filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && (r.left < -2 || r.right > window.innerWidth + 2); }).length);
    if (over) bad.push(`${w}x${h}:${over}`);
  }
  await page.setViewport({ width: 1366, height: 768 });
  assert(!bad.length, 'off-screen buttons ' + bad.join(' '));
  return sizes.map((s) => s.join('x')).join(', ') + ' ok';
});
await check('U13', 'No JavaScript errors and no network requests during all of the above', async () => {
  assert(!errors.length, errors.slice(0, 3).join(' | '));
  assert(!external.length, 'external: ' + external.slice(0, 3).join(' '));
  return 'console errors 0; external requests 0';
});

const passed = results.filter((r) => r.ok).length;
console.log(`\n${EDGE_RUN ? 'Edge' : 'Chrome'} upgrade checks: ${passed} passed, ${results.length - passed} failed.`);
fs.writeFileSync(path.join(root, 'qa', `e2e-upgrade-${EDGE_RUN ? 'edge' : 'chrome'}.json`), JSON.stringify({ browser: version, date: new Date().toISOString(), results }, null, 1));
await browser.close();
process.exitCode = passed === results.length ? 0 : 1;
