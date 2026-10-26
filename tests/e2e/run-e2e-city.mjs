// End-to-end checks for the town "Bandar Ceria": size, streaming, unicorns, cars, the bus, school children,
// landmarks with their learning places and music, the town map with quick trips, the highway and the train,
// coins, shops, books, fact boards, the roller coaster, traffic lights, the clock tower and the cinema.
// Usage: node tests/e2e/run-e2e-city.mjs [edge]
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CHROME, EDGE } from '../../tools/lib/browsers.mjs';
import { STRINGS } from '../../src/engine/i18n.js';
import { landmarkById, BUS_ROUTES, routePath, HIGHWAY, railPath, LANDMARKS, cityPois, blockPlan, XS, ZS, districtAt } from '../../src/engine/city/plan.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const EDGE_RUN = process.argv.includes('edge');
const EXE = EDGE_RUN ? EDGE : CHROME;
const URL = pathToFileURL(path.join(root, 'AmmaraGames.html')).href;
const shotDir = path.join(root, 'qa/screenshots', EDGE_RUN ? 'edge-city' : 'chrome-city');
fs.mkdirSync(shotDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
let page;
async function check(id, name, fn) {
  try { const info = await fn(); results.push({ id, name, ok: true, info }); console.log(`PASS  ${String(id).padStart(4)} ${name} — ${info}`); }
  catch (e) { results.push({ id, name, ok: false, info: e.message }); console.log(`FAIL  ${String(id).padStart(4)} ${name} — ${e.message}`); try { await page.screenshot({ path: path.join(shotDir, `FAIL-${id}.png`) }); } catch (x) { /* ignore */ } }
}
const assert = (c, m) => { if (!c) throw new Error(m); };
const waitState = (s, timeout = 8000) => page.waitForFunction((x) => window.AmmaraDebug.state() === x, { timeout }, s);
const world = () => page.evaluate(() => window.AmmaraDebug.world());
const game = () => page.evaluate(() => window.AmmaraDebug.game());
const tp = (x, z) => page.evaluate((a, b) => window.AmmaraDebug.teleport(a, b), x, z);
const label = () => page.$eval('[data-testid=hud-interact]', (b) => (b.hidden ? null : b.textContent.trim()));
const hold = async (key, ms) => { await page.keyboard.down(key); await sleep(ms); await page.keyboard.up(key); };
let L = null;                      // interface text in the game's language

const MOCK_SPEECH = () => {
  window.__spoken = [];
  const synth = {
    getVoices: () => [{ name: 'Test Malay', lang: 'ms-MY', localService: true, default: true, voiceURI: 'ms' }, { name: 'Test English', lang: 'en-US', localService: true, default: false, voiceURI: 'en' }], speaking: false,
    speak(u) { window.__spoken.push({ text: u.text }); setTimeout(() => u.onend && u.onend(), 30); },
    cancel() {}, pause() {}, resume() {}, addEventListener() {}, removeEventListener() {}
  };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
  window.SpeechSynthesisUtterance = function (text) { this.text = text; };
};

const browser = await puppeteer.launch({ executablePath: EXE, headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--window-size=1400,900'] });
const version = await browser.version();
console.log(`Town checks: ${URL}\nwith ${version}\n`);
page = await browser.newPage();
await page.setViewport({ width: 1366, height: 768 });
await page.evaluateOnNewDocument(MOCK_SPEECH);
const errors = [], external = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.setRequestInterception(true);
page.on('request', (r) => { if (/^(file|data|blob):/.test(r.url())) r.continue(); else { external.push(r.url()); r.abort(); } });

await check('C1', 'The town is big (over 4 km x 4 km) and alive: traffic, school children and buses', async () => {
  await page.goto(URL);
  await waitState('MAIN_MENU', 40000);
  await page.click('[data-testid=menu-play]');
  await waitState('PLAYROOM');
  await sleep(1500);
  await page.mouse.click(683, 600);
  const g = await game();
  L = STRINGS[g.lang];
  const w = await world();
  const sx = w.bounds.maxX - w.bounds.minX, sz = w.bounds.maxZ - w.bounds.minZ;
  assert(sx >= 4000 && sz >= 4000, `town ${sx} x ${sz}`);
  assert(w.traffic >= 20, 'traffic ' + w.traffic);
  assert(w.people >= 40, 'children ' + w.people);
  assert(w.buses.length === 4, 'buses ' + w.buses.length);
  assert(w.city.chunks > 0, 'no town loaded');
  return `${sx} x ${sz} m (${(sx * sz / 1e6).toFixed(1)} km²), ${w.traffic} cars, ${w.people} children, ${w.buses.length} buses, ${w.city.chunks} squares loaded`;
});

await check('C2', 'Out of the garden gate into the town: campus area, then a street with town music', async () => {
  await tp(40, 30); await sleep(800);
  let w = await world(), g = await game();
  assert(w.zone === 'city-campus', 'zone ' + w.zone);
  assert(g.audio.scene === 'yard', 'music ' + g.audio.scene);
  await tp(420, -420); await sleep(900);
  w = await world(); g = await game();
  assert(w.zone === districtAt(420, -420).id, 'zone ' + w.zone);
  assert(g.audio.scene === 'town', 'music ' + g.audio.scene);
  return `${w.zone} with "${g.audio.scene}" music`;
});

await check('C3', 'Ride a unicorn from the stable: it is faster than walking, and getting off is safe', async () => {
  await tp(92, -7.6); await sleep(600);
  assert((await label()) === L.rideUnicorn, 'label ' + (await label()));
  await page.keyboard.press('KeyE'); await sleep(300);
  let w = await world();
  assert(w.ride === 'unicorn', 'not riding: ' + w.ride);
  const p0 = w.player;
  await hold('ArrowDown', 1800);
  w = await world();
  const moved = Math.hypot(w.player.x - p0.x, w.player.z - p0.z);
  assert(moved > 7, 'moved only ' + moved.toFixed(1));
  await page.screenshot({ path: path.join(shotDir, 'unicorn.png') });
  assert((await label()) === L.getOff, 'label while riding ' + (await label()));
  await page.keyboard.press('KeyE'); await sleep(300);
  w = await world();
  assert(w.ride === null, 'still riding');
  assert(w.violations === 0, 'violations ' + w.violations);
  return `rode ${moved.toFixed(1)} m in 1.8 s, got off`;
});

await check('C4', 'Drive a car out of the car park onto the road', async () => {
  await tp(-86, 35.6); await sleep(600);
  assert((await label()) === L.driveCar, 'label ' + (await label()));
  await page.keyboard.press('KeyE'); await sleep(300);
  let w = await world();
  assert(w.ride === 'car', 'not in the car: ' + w.ride);
  const p0 = w.player;
  await hold('ArrowDown', 2500);
  w = await world();
  const moved = Math.hypot(w.player.x - p0.x, w.player.z - p0.z);
  assert(moved > 12, 'drove only ' + moved.toFixed(1));
  await page.screenshot({ path: path.join(shotDir, 'car.png') });
  await page.keyboard.press('KeyE'); await sleep(300);
  w = await world();
  assert(w.ride === null && w.violations === 0, `ride ${w.ride}, violations ${w.violations}`);
  return `drove ${moved.toFixed(1)} m (to ${w.player.x.toFixed(0)}, ${w.player.z.toFixed(0)})`;
});

await check('C5', 'Call the bus at the preschool stop, ride it to the next stop and get off there', async () => {
  const rp = routePath(BUS_ROUTES.find((r) => r.id === 'A'));
  const stop = rp.stops.find((s) => s.id === 'tadika');
  await tp(stop.wait.x, stop.wait.z - 1.6); await sleep(600);
  const lb = await label();
  assert(lb === 'Naik bas!' || lb === 'Take the bus!', 'prompt at the stop: ' + lb);
  await page.keyboard.press('KeyE'); await sleep(300);
  let w = await world();
  assert(w.waitingBus === 'tadika', 'not waiting: ' + w.waitingBus);
  await page.waitForFunction(() => window.AmmaraDebug.world().ride === 'bus', { timeout: 30000 });
  await page.screenshot({ path: path.join(shotDir, 'bus.png') });
  await page.waitForFunction(() => { const b = window.AmmaraDebug.world().myBus; return b && b.atStop && b.atStop !== 'tadika' && b.dwell > 0; }, { timeout: 60000 });
  w = await world();
  const at = w.myBus.atStop;
  assert((await label()) === L.getOffHere, 'label ' + (await label()));
  await page.keyboard.press('KeyE'); await sleep(400);
  w = await world();
  assert(w.ride === null, 'still on the bus');
  const st = rp.stops.find((s) => s.id === at);
  const d = Math.hypot(w.player.x - st.wait.x, w.player.z - st.wait.z);
  assert(d < 3, `got off ${d.toFixed(1)} m from the stop`);
  return `rode from tadika to ${at}, got off at the stop`;
});

await check('C6', 'Say hello to a school child walking on the pavement', async () => {
  let w = await world();
  const k = w.kids[0];
  assert(k, 'no children');
  await tp(k.x + 1.4, k.z); await sleep(500);
  w = await world();
  const near = w.kids.some((q) => Math.hypot(q.x - w.player.x, q.z - w.player.z) < 2.4);
  assert(near, 'child walked away');
  assert((await label()) === L.sayHi, 'label ' + (await label()));
  const n0 = await page.evaluate(() => window.__spoken.length);
  await page.keyboard.press('KeyE'); await sleep(300);
  const said = await page.evaluate((n) => window.__spoken.slice(n).map((s) => s.text), n0);
  const hi = [...L.kidHi, ...L.adultHi];
  assert(said.some((s) => hi.includes(s)), 'nothing said: ' + JSON.stringify(said));
  return `they said "${said.find((s) => hi.includes(s))}"`;
});

await check('C7', 'Landmarks: own area, music and learning place (mosque, zoo quiz)', async () => {
  const ms = landmarkById.masjid;
  await tp(ms.x0 + 60, ms.z0 + 95); await sleep(800);
  let w = await world(), g = await game();
  assert(w.zone === 'city-masjid', 'zone ' + w.zone);
  assert(g.audio.scene === 'islamic', 'music ' + g.audio.scene);
  const zoo = landmarkById.zoo;
  await tp(zoo.x0 + 60, zoo.z0 + 103); await sleep(800);       // in front of the zoo quiz board
  w = await world();
  assert(w.zone === 'city-zoo', 'zone ' + w.zone);
  const lb = await label();
  assert(lb, 'no prompt at the zoo');
  await page.keyboard.press('KeyE');
  await waitState('QUIZ', 6000);
  await page.screenshot({ path: path.join(shotDir, 'zoo-quiz.png') });
  await page.click('[data-testid=quiz-close]');
  await waitState('PLAYROOM', 6000);
  return `mosque: islamic music; zoo: "${lb}" opened a question`;
});

await check('C8', 'Town map: opens on the town tab, lists every landmark, and a tap travels there', async () => {
  await tp(420, -420); await sleep(600);
  await page.click('[data-testid=hud-minimap]'); await sleep(400);
  assert(await page.$('[data-testid=map-town]'), 'town map not shown');
  const n = await page.$$eval('.town-go', (b) => b.length);
  assert(n === LANDMARKS.length + 1, 'buttons ' + n);
  await page.screenshot({ path: path.join(shotDir, 'town-map.png') });
  await page.click('[data-testid=town-go-themepark]'); await sleep(900);
  const w = await world();
  assert(w.zone === 'city-themepark', 'zone ' + w.zone);
  await page.click('[data-testid=hud-minimap]'); await sleep(300);
  await page.click('[data-testid=map-tab-school]'); await sleep(200);
  assert(await page.$('[data-testid=map-canvas]'), 'school tab missing');
  await page.click('[data-testid=map-close]'); await sleep(200);
  return `${n} places listed, trip to the theme park ok`;
});

await check('C9', 'The "back to preschool" button brings the child home from anywhere in the town', async () => {
  await tp(1500, 1500); await sleep(600);
  assert(!(await page.$eval('[data-testid=hud-return]', (b) => b.hidden)), 'no return button');
  await page.click('[data-testid=hud-return]');
  await page.waitForFunction(() => window.AmmaraDebug.world().area === 'indoor', { timeout: 25000 });
  const w = await world();
  return `home at ${w.player.x.toFixed(1)}, ${w.player.z.toFixed(1)} (indoor)`;
});

await check('C10', 'Streaming: far corners load and unload; frame cost stays bounded', async () => {
  const out = [];
  for (const [x, z] of [[-1900, -1900], [1900, -1900], [1900, 1800], [-1900, 1800], [0, 900], [40, 30]]) {
    await tp(x, z); await sleep(900);
    const w = await world();
    assert(w.city.chunks <= 25, `${w.city.chunks} squares loaded at ${x},${z}`);
    assert(w.calls < 700, `${w.calls} draw calls at ${x},${z}`);
    out.push(`${w.zone}:${w.city.chunks}sq/${w.calls}calls/${w.fps}fps`);
  }
  return out.join(' ');
});

await check('C12', 'The highway: four lanes with fast cars, its own area, lamps and signs', async () => {
  await tp(300, HIGHWAY.z + HIGHWAY.curb - 1.5); await sleep(1500);       // on the pavement beside it
  let w = await world();
  assert(w.highway >= 20, 'highway cars ' + w.highway);
  await tp(1500, HIGHWAY.z + 4.5); await sleep(900);                     // standing in the lanes: cars stop for the child
  w = await world();
  assert(w.zone === 'city-highway', 'zone ' + w.zone);
  const g = await game();
  assert(g.audio.scene === 'town', 'music ' + g.audio.scene);
  await tp(1500, HIGHWAY.z + HIGHWAY.curb - 1.5); await sleep(600);
  await page.screenshot({ path: path.join(shotDir, 'highway.png') });
  return `${w.highway} highway cars, area "${w.zone}"`;
});

await check('C13', 'Train: wait at Stesen Tadika, the train comes, ride the elevated line to the next station, get off there', async () => {
  const rp = railPath();
  const home = rp.stations.find((s) => s.id === 'stn-tadika');
  await tp(home.exit.x, home.exit.z); await sleep(700);
  const lb = await label();
  assert(lb === 'Naik kereta api!' || lb === 'Take the train!', 'prompt at the station: ' + lb);
  await page.keyboard.press('KeyE'); await sleep(300);
  let w = await world();
  assert(w.waitingTrain === 'stn-tadika', 'not waiting: ' + w.waitingTrain);
  const t0 = Date.now();
  await page.waitForFunction(() => window.AmmaraDebug.world().ride === 'train', { timeout: 70000 });
  const waited = (Date.now() - t0) / 1000;
  await sleep(1500);
  await page.screenshot({ path: path.join(shotDir, 'train-ride.png') });
  // the train leaves and stops at the next station along the line
  await page.waitForFunction(() => { const w2 = window.AmmaraDebug.world(); const t = w2.trains.find((q) => q.riding); return t && t.dwell > 0 && t.atStop && t.atStop !== 'stn-tadika'; }, { timeout: 150000 });
  w = await world();
  const tr = w.trains.find((q) => q.riding);
  assert((await label()) === L.getOffHere, 'label ' + (await label()));
  await page.screenshot({ path: path.join(shotDir, 'train-station.png') });
  await page.keyboard.press('KeyE'); await sleep(500);
  w = await world();
  assert(w.ride === null, 'still on the train');
  const st = rp.stations.find((s) => s.id === tr.atStop);
  const d = Math.hypot(w.player.x - st.exit.x, w.player.z - st.exit.z);
  assert(d < 3, `got off ${d.toFixed(1)} m from the station`);
  assert(w.violations === 0, 'violations ' + w.violations);
  return `waited ${waited.toFixed(0)} s, rode to ${tr.atStop}, got off at its ticket spot`;
});

await check('C14', 'The two trains keep going round and never run into each other', async () => {
  const total = railPath().total;
  let minGap = Infinity;
  for (let k = 0; k < 10; k++) {
    const w = await world();
    const [a, b] = w.trains;
    const g = Math.min(((b.s - a.s) % total + total) % total, ((a.s - b.s) % total + total) % total);
    minGap = Math.min(minGap, g);
    await sleep(400);
  }
  assert(minGap > 50, 'trains only ' + minGap.toFixed(0) + ' m apart');
  return `closest ${minGap.toFixed(0)} m apart`;
});

// ---- the busy town (2.2): coins, shops, books, fact boards, roller coaster, traffic lights, clock, cinema
const poiById = (id) => cityPois().find((q) => q.id === id);
const goPoi = async (id, dz = 1.6) => { const p = poiById(id); await tp(p.x, p.z + dz); await sleep(900); return p; };
const coinsNow = async () => +(await page.$eval('[data-testid=hud-coins]', (b) => b.textContent));
const closeTown = async () => { const b = await page.$('[data-testid=town-close]'); if (b) await b.click(); await sleep(300); };

await check('C15', 'Coins on the pavement: arriving on one picks it up and the counter goes up', async () => {
  // the first coins of the block just south of the preschool campus
  const plan = blockPlan(XS.indexOf(0), ZS.indexOf(60));
  const c = plan.coins[0];
  assert(c, 'no coin there');
  const before = await coinsNow();
  await tp(c.x, c.z); await sleep(300);
  await page.waitForFunction((n) => +document.querySelector('[data-testid=hud-coins]').textContent > n, { timeout: 4000 }, before);
  const after = await coinsNow();
  const w = await world();
  assert(w.city.coinsTaken >= 1, 'coin not taken');
  return `coins ${before} -> ${after}; ${w.city.coins} coins near the child`;
});

await check('C16', 'Bookshop: buy a picture book with coins, it opens, read it to the end (+1 coin), it is in My Bag', async () => {
  await goPoi('mall-shop-books');
  assert((await label()) === 'Masuk Kedai Buku!' || (await label()) === 'Visit the bookshop!', 'label ' + (await label()));
  await page.keyboard.press('KeyE'); await sleep(700);
  const c0 = await coinsNow();
  await page.click('[data-testid="buy-buy-bk-planet"]');
  await page.waitForSelector('[data-testid=reader-text]', { timeout: 5000 });
  const c1 = await coinsNow();
  assert(c1 === c0 - 2, `price: ${c0} -> ${c1}`);
  const n0 = await page.evaluate(() => window.__spoken.length);
  for (let k = 0; k < 8; k++) { const nx = await page.$('[data-testid=reader-next]'); if (!nx) break; await nx.click(); await sleep(200); }
  assert(await page.$('[data-testid=reader-reward]'), 'no coin for finishing');
  const read = await page.evaluate((n) => window.__spoken.slice(n).length, n0);
  assert(read >= 5, 'pages were not read aloud: ' + read);
  await page.screenshot({ path: path.join(shotDir, 'book-reader.png') });
  await page.click('[data-testid=reader-done]'); await sleep(300);
  const c2 = await coinsNow();
  assert(c2 === c1 + 1, `book coin: ${c1} -> ${c2}`);
  await page.click('[data-testid=hud-bag]'); await sleep(400);
  assert(await page.$('[data-testid="read-bk-planet"]'), 'book not in the bag');
  await closeTown();
  return `paid 2 coins, read ${read} pages aloud, +1 coin, book kept in My Bag`;
});

await check('C17', 'Boutique: clothes bought with coins are worn straight away', async () => {
  await goPoi('mall-shop-clothes');
  await page.keyboard.press('KeyE'); await sleep(600);
  const coins = await coinsNow();
  const affordable = ['w-capred', 'w-bowblue', 'w-glasspink'];
  assert(coins >= 3, 'not enough coins for the test: ' + coins);
  await page.click(`[data-testid="buy-${affordable[0]}"]`); await sleep(500);
  const st = await game();
  const ch = (await world()).character;
  assert(st.learner && st.learner.rewards.includes('cap_red'), 'not owned');
  assert(ch && ch.accessories.head === 'cap', 'not worn: ' + JSON.stringify(ch && ch.accessories));
  await page.screenshot({ path: path.join(shotDir, 'boutique.png') });
  await closeTown();
  return 'red cap bought and worn';
});

await check('C18', 'Sweet shop: not enough coins says so kindly; a lollipop can be bought and eaten (with a teeth tip)', async () => {
  await goPoi('mall-shop-candy');
  await page.keyboard.press('KeyE'); await sleep(600);
  const c0 = await coinsNow();
  assert(c0 >= 1 && c0 < 3, 'coins for the test: ' + c0);
  await page.click('[data-testid="buy-cake"]'); await sleep(300);
  const msg0 = await page.$eval('[data-testid=town-msg]', (e) => e.textContent);
  assert(/Syiling tidak cukup|Not enough coins/.test(msg0), 'no kind message: ' + msg0);
  await page.click('[data-testid="buy-lollipop"]'); await sleep(300);
  assert((await coinsNow()) === c0 - 1, 'lollipop price');
  await page.click('[data-testid=town-bag]'); await sleep(300);
  await page.click('[data-testid="useitem-lollipop"]'); await sleep(300);
  const tip = await page.$eval('[data-testid=town-msg]', (e) => e.textContent);
  assert(/gigi|teeth/i.test(tip), 'tip: ' + tip);
  await closeTown();
  return `"${tip}"`;
});

await check('C19', 'Fact board: reading it the first time gives a coin, the second time not', async () => {
  const f = cityPois().find((q) => q.action === 'fact' && q.id.startsWith('mall'));
  await tp(f.x, f.z + 1.2); await sleep(800);
  assert(/Tahukah Kamu|Did you know/.test(await label()), 'label ' + (await label()));
  const c0 = await coinsNow();
  await page.keyboard.press('KeyE'); await sleep(500);
  assert(await page.$('[data-testid=fact-text]'), 'no fact card');
  assert(await page.$('[data-testid=fact-reward]'), 'no coin the first time');
  await page.click('[data-testid=fact-ok]'); await sleep(300);
  const c1 = await coinsNow();
  await page.keyboard.press('KeyE'); await sleep(500);
  assert(!(await page.$('[data-testid=fact-reward]')), 'coin given twice');
  await page.click('[data-testid=fact-ok]'); await sleep(300);
  assert(c1 === c0 + 1 && (await coinsNow()) === c1, `coins ${c0} -> ${c1} -> ${await coinsNow()}`);
  return `coins ${c0} -> ${c1}, then no more`;
});

await check('C20', 'Roller coaster: get in at the station, ride one full lap up and down, get out by itself', async () => {
  await goPoi('funfair-coaster', 1.5);
  assert(/roller coaster/i.test(await label()), 'label ' + (await label()));
  await page.keyboard.press('KeyE');
  await page.waitForFunction(() => window.AmmaraDebug.world().ride === 'coaster', { timeout: 30000 });
  let top = 0;
  for (let k = 0; k < 40; k++) { const w = await world(); top = Math.max(top, w.rideY); if (w.ride !== 'coaster') break; if (k === 8) await page.screenshot({ path: path.join(shotDir, 'coaster.png') }); await sleep(1000); }
  await page.waitForFunction(() => window.AmmaraDebug.world().ride === null, { timeout: 60000 });
  const w = await world();
  assert(top > 8, 'the ride never went up: ' + top);
  assert(w.violations === 0, 'violations ' + w.violations);
  return `highest point ${top.toFixed(1)} m, back on the ground at ${w.player.x.toFixed(0)}, ${w.player.z.toFixed(0)}`;
});

await check('C21', 'Traffic lights change colour and town cars stop at red', async () => {
  await tp(60, 52); await sleep(600);                                   // the busy middle of town
  let w = await world();
  assert(w.city.lights > 0, 'no traffic lights loaded');
  let maxStopped = 0;
  for (let k = 0; k < 24; k++) { w = await world(); maxStopped = Math.max(maxStopped, w.redLights); if (maxStopped > 0 && k > 6) break; await sleep(500); }
  assert(maxStopped > 0, 'no car ever waited at a red light');
  return `${w.city.lights} traffic lights nearby, up to ${maxStopped} cars waiting at red`;
});

await check('C22', 'Clock tower shows the real time; the cinema shows a story', async () => {
  await goPoi('clocktower-clock', 1.5);
  await page.keyboard.press('KeyE'); await sleep(500);
  const digits = await page.$eval('[data-testid=clock-digits]', (e) => e.textContent);
  const now = new Date(); const h12 = ((now.getHours() + 11) % 12) + 1;
  assert(digits.startsWith(h12 + ':'), `clock ${digits} vs ${h12}`);
  await closeTown();
  await goPoi('cinema-show', 1.5);
  await page.keyboard.press('KeyE'); await sleep(600);
  assert(await page.$('[data-testid=reader-text]'), 'no story');
  await closeTown();
  return `clock ${digits}; cinema story opened`;
});

await check('C23', 'Busy streets: more cars, school children and grown-ups; the town map lists every place in groups', async () => {
  await tp(420, -420); await sleep(1200);
  const w = await world();
  assert(w.traffic >= 30 && w.people >= 60, `traffic ${w.traffic}, people ${w.people}`);
  await page.click('[data-testid=hud-minimap]'); await sleep(400);
  const groups = await page.$$eval('.town-group', (h) => h.length);
  const n = await page.$$eval('.town-go', (b) => b.length);
  assert(groups === 5 && n === LANDMARKS.length + 1, `groups ${groups}, places ${n}`);
  await page.click('[data-testid=map-close]'); await sleep(200);
  return `${w.traffic} cars, ${w.people} people; map: ${groups} groups, ${n} places`;
});

await check('C24', 'The menu shows the version and a NEW "Explore the Town" button that goes straight out of the preschool gate', async () => {
  await tp(11, -1); await sleep(300);
  await page.keyboard.press('Escape'); await sleep(500);
  const home = await page.$('[data-testid=pause-home]'); if (home) await home.click();
  await sleep(400);
  const yes = await page.$('#dialog [data-answer=yes]'); if (yes) await yes.click();
  await waitState('MAIN_MENU', 10000);
  const ver = await page.$eval('[data-testid=menu-version]', (e) => e.textContent);
  assert(/^v\d+\.\d+\.\d+$/.test(ver), 'version tag ' + ver);
  const tag = await page.$eval('[data-testid=menu-town] .new-tag', (e) => e.textContent);
  assert(tag === 'BAHARU' || tag === 'NEW', 'tag ' + tag);
  await page.screenshot({ path: path.join(shotDir, 'menu.png') });
  await page.click('[data-testid=menu-town]');
  await waitState('PLAYROOM', 15000);
  await sleep(1200);
  const w = await world();
  assert(w.zone === 'city-campus' && w.area === 'outdoor', `zone ${w.zone} area ${w.area}`);
  assert(Math.hypot(w.player.x - 40, w.player.z - 36) < 3, 'player at ' + JSON.stringify(w.player));
  return `${ver}, "${tag}" button, child at the garden gate (${w.player.x}, ${w.player.z})`;
});

await check('C11', 'No errors, no network requests, no collision violations', async () => {
  const w = await world();
  assert(errors.length === 0, errors.slice(0, 3).join(' | '));
  assert(external.length === 0, 'network: ' + external.slice(0, 2).join(' '));
  assert(w.violations === 0, 'violations ' + w.violations);
  return 'clean';
});

await browser.close();
const passed = results.filter((r) => r.ok).length;
console.log(`\n${EDGE_RUN ? 'Edge' : 'Chrome'} town checks: ${passed} passed, ${results.length - passed} failed.`);
fs.writeFileSync(path.join(root, 'qa', `e2e-city-${EDGE_RUN ? 'edge' : 'chrome'}.json`), JSON.stringify({ browser: version, date: new Date().toISOString(), results }, null, 1));
process.exitCode = passed === results.length ? 0 : 1;
