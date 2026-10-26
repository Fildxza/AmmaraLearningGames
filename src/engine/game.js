// Game controller: one state machine that connects the 3D room, the quiz,
// rewards, learners, sound and every screen.
import { t, tAll, setLang, getLang } from './i18n.js';
import { tr, choiceLabel } from './core/labels.js';
import { parseNameList } from './core/progress.js';
import { report, errorLog } from './system.js';
import { $, show } from './ui/dom.js';
import { G } from './ui/glyphs.js';
import { confirmDialog, toast, adultGate, dialogOpen } from './ui/overlays.js';
import { createQuiz } from './ui/quiz.js';
import { createMenu, createWorlds, createHud, createPause, createComplete, createCollection, createCards, createNoGL } from './ui/views.js';
import { createTeacher } from './ui/teacher.js';
import { accessoryThumb, outfitThumb, noneThumb, hairThumb } from './ui/thumbs.js';
import { HAIR_STYLES, SLOTS } from './core/catalog.js';
import { createMinimap } from './ui/minimap.js';
import { createAudioPanel } from './ui/audio-panel.js';
import { createArcade } from './ui/arcade.js';
import { createIslamic } from './ui/islamic.js';
import { normaliseNarrator } from './narrator.js';
import { resumeUsable } from './kidlock.js';
import { canInstall, promptInstall, isHttp } from './pwa.js';
import { DOOR, zoneById } from './world/layout.js';
import { landmarkById } from './city/plan.js';
import { createTownUI } from './ui/town.js';
import { COIN_RULES } from '../data/shops.js';
import { factById } from '../data/facts.js';
import { BOOKS } from '../data/books.js';

export const S = {
  MAIN_MENU: 'MAIN_MENU', WORLD_SELECT: 'WORLD_SELECT', PLAYROOM: 'PLAYROOM', QUIZ: 'QUIZ', STATION_COMPLETE: 'STATION_COMPLETE',
  REWARD_COLLECTION: 'REWARD_COLLECTION', SESSION_COMPLETE: 'SESSION_COMPLETE', TEACHER_AREA: 'TEACHER_AREA', PAUSED: 'PAUSED', ARCADE: 'ARCADE', MINIGAME: 'MINIGAME', ISLAMIC: 'ISLAMIC', BOOT: 'BOOT'
};
const ALLOWED = {
  BOOT: ['MAIN_MENU'],
  MAIN_MENU: ['PLAYROOM', 'WORLD_SELECT', 'TEACHER_AREA', 'REWARD_COLLECTION', 'ARCADE', 'ISLAMIC'],
  WORLD_SELECT: ['PLAYROOM', 'MAIN_MENU', 'SESSION_COMPLETE'],
  PLAYROOM: ['QUIZ', 'PAUSED', 'REWARD_COLLECTION', 'SESSION_COMPLETE', 'MAIN_MENU', 'WORLD_SELECT', 'ARCADE', 'ISLAMIC', 'MINIGAME'],
  ARCADE: ['MINIGAME', 'PLAYROOM', 'MAIN_MENU'],
  MINIGAME: ['ARCADE', 'PLAYROOM', 'MAIN_MENU', 'ISLAMIC'],
  ISLAMIC: ['PLAYROOM', 'MAIN_MENU', 'MINIGAME'],
  QUIZ: ['STATION_COMPLETE', 'PLAYROOM'],
  STATION_COMPLETE: ['PLAYROOM', 'SESSION_COMPLETE'],
  PAUSED: ['PLAYROOM', 'MAIN_MENU', 'WORLD_SELECT', 'REWARD_COLLECTION', 'SESSION_COMPLETE'],
  REWARD_COLLECTION: ['MAIN_MENU', 'PLAYROOM', 'SESSION_COMPLETE'],
  SESSION_COMPLETE: ['PLAYROOM', 'WORLD_SELECT', 'MAIN_MENU', 'REWARD_COLLECTION', 'TEACHER_AREA'],
  TEACHER_AREA: ['MAIN_MENU', 'PLAYROOM', 'SESSION_COMPLETE']
};

export function createGame(deps) {
  const { config, validation, world, progress, audio, speech, storageOk, iconSvg, version, kid } = deps;
  const cfgA = config.accessibilitySettings, cfgAu = config.audioSettings;
  const stored = progress.settings();
  const set = Object.assign({
    lang: config.defaultLanguage, age: config.defaultAgeGroup, sound: cfgAu.enabled, music: cfgAu.musicEnabled, musicStyle: cfgAu.defaultMusic,
    musicVolume: cfgAu.musicVolume, effectsVolume: cfgAu.effectsVolume, readAloud: cfgAu.readQuestionsAloud, autoClose: cfgA.quizAutoCloseMs,
    camera: config.cameraSettings.defaultDistance, quality: 'auto', motion: cfgA.reducedMotion, lastWorld: null, narrator: null, kidLock: true
  }, stored);
  kid.setEnabled(set.kidLock !== false);
  set.narrator = normaliseNarrator(set.narrator);
  speech.configure(set.narrator);
  if (!config.availableLanguages.includes(set.lang)) set.lang = config.defaultLanguage;
  if (!config.ageGroups.some((a) => a.id === set.age)) set.age = config.defaultAgeGroup;
  setLang(set.lang);

  let state = S.BOOT;
  let returnTo = null;
  const cur = { run: null, worldId: null, quiz: null, themeKey: null, tutorial: null, movedFrom: null, lastNear: -2, hintTimer: 0, nearDone: -1,
    poi: null, say: null, free: null, hubFrom: null, mgReturn: null, greetN: 0, zoneSpoken: {} };
  const keys = { up: false, down: false, left: false, right: false };
  const pad = { up: false, down: false, left: false, right: false };
  const timers = new Map();
  const after = (tag, ms, fn) => { clearT(tag); timers.set(tag, setTimeout(() => { timers.delete(tag); safe(fn); }, ms)); };
  const clearT = (tag) => { if (timers.has(tag)) { clearTimeout(timers.get(tag)); timers.delete(tag); } };
  const has3D = !!world;

  function safe(fn) {
    try { const r = fn(); if (r && r.catch) r.catch((e) => { report('ACTION_FAILED', e.message, e); toast(t('somethingWrong'), { tone: 'error' }); }); return r; }
    catch (e) { report('ACTION_FAILED', e.message, e); toast(t('somethingWrong'), { tone: 'error' }); return null; }
  }
  const mascotSvg = () => iconSvg('mascot:' + config.mascotStyle, 'mascot-svg');
  const reduced = () => set.motion === 'on' || (set.motion === 'auto' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const worldName = (w) => tr(w.name, set.lang).replace('{character}', config.character.name);
  const learner = () => progress.currentLearner();
  const sessionMode = () => (progress.session() ? progress.session().mode : 'single');

  // ---------------------------------------------------------------- state machine
  function go(next) {
    if (next === state) return true;
    if (!(ALLOWED[state] || []).includes(next)) {
      report('BAD_TRANSITION', `Blocked state change ${state} -> ${next}`, null, 'warn');
      return false;
    }
    exit(state, next);
    const prev = state;
    state = next;
    enter(next, prev);
    document.body.dataset.state = next;
    syncScene();
    saveResume(true);
    return true;
  }
  // background music follows where the child is: the zone in the 3D world, or the screen they are on
  const SCREEN_SCENE = { MAIN_MENU: 'playroom', WORLD_SELECT: 'playroom', TEACHER_AREA: 'playroom', REWARD_COLLECTION: 'reward', SESSION_COMPLETE: 'reward', ARCADE: 'arcade', MINIGAME: 'arcade', ISLAMIC: 'islamic' };
  function syncScene() {
    const inWorld = state === S.PLAYROOM || state === S.QUIZ || state === S.PAUSED || state === S.STATION_COMPLETE;
    audio.setScene(inWorld ? (has3D ? world.zone().music : 'playroom') : (SCREEN_SCENE[state] || 'playroom'));
  }
  function exit(s, next) {
    if (s === S.QUIZ) { quiz.close(); clearT('quiz'); speech.stop(); }
    if (s === S.PAUSED) pause.close();
    if (s === S.REWARD_COLLECTION) collection.show(false);
    if (s === S.TEACHER_AREA) teacher.close();
    if (s === S.SESSION_COMPLETE) complete.show(false);
    if (s === S.ARCADE) arcade.showHub(false);
    if (s === S.MINIGAME) arcade.closeGame();
    if (s === S.ISLAMIC) islamic.close();
    speech.stop();                                   // speech never carries over to the next screen
    if (s === S.WORLD_SELECT) worlds.show(false);
    if (s === S.MAIN_MENU) menu.show(false);
    if (s === S.STATION_COMPLETE) clearT('celebrate');
    if (s === S.PLAYROOM && next !== S.QUIZ && next !== S.PAUSED && next !== S.STATION_COMPLETE) { hud.show(false); cards.show(false); hud.tutorial(null); if (minimap.isOpen) minimap.close(); }
  }
  function enter(s, prev) {
    const playing = s === S.PLAYROOM || s === S.QUIZ || s === S.PAUSED || s === S.STATION_COMPLETE;
    if (!playing) { hud.show(false); cards.show(false); }
    if (has3D) {
      const mode = { MAIN_MENU: 'menu', WORLD_SELECT: 'menu', PLAYROOM: 'play', QUIZ: 'quiz', PAUSED: 'quiz', STATION_COMPLETE: 'celebrate', REWARD_COLLECTION: 'wardrobe', SESSION_COMPLETE: 'complete', TEACHER_AREA: 'menu', ARCADE: 'quiz', MINIGAME: 'quiz', ISLAMIC: 'quiz' }[s];
      world.setMode(mode);
      document.body.classList.toggle('in-room', playing);
    }
    switch (s) {
      case S.MAIN_MENU: renderMenu(); menu.show(true); break;
      case S.WORLD_SELECT: renderWorlds(); worlds.show(true); break;
      case S.PLAYROOM:
        if (has3D) { hud.show(true); refreshHud(); } else { renderCards(); cards.show(true); }
        if (prev !== S.QUIZ && prev !== S.PAUSED && prev !== S.STATION_COMPLETE && prev !== S.ARCADE && prev !== S.MINIGAME && prev !== S.ISLAMIC) startTutorial();
        break;
      case S.ARCADE: arcade.showHub(true); break;
      case S.ISLAMIC: islamic.open(cur.islamicStart); cur.islamicStart = null; break;
      case S.REWARD_COLLECTION: renderCollection(); collection.show(true); break;
      case S.SESSION_COMPLETE: complete.show(true); break;
      case S.TEACHER_AREA: { const tb = $('#toasts'); if (tb) tb.innerHTML = ''; teacher.open(); break; }
      default: break;
    }
  }

  // ---------------------------------------------------------------- appearance
  function appearanceFor(l) {
    const rw = config.rewards;
    const outfit = l && rw[l.outfit] ? rw[l.outfit].color : (rw[config.character.outfit] ? rw[config.character.outfit].color : '#ff8fc0');
    const acc = {};
    if (l) for (const slot of SLOTS) { const id = l.equipped[slot]; if (id && rw[id]) acc[slot] = { model: rw[id].model, color: rw[id].color }; }
    return {
      hairStyle: l ? l.hair.style : config.character.hairStyle, hairColor: l ? l.hair.color : config.character.hairColor,
      hijabColor: config.character.hijabColor, skinTone: config.character.skinTone, eyeColor: config.character.eyeColor,
      shoeColor: config.character.shoeColor, outfitColor: outfit, accessories: acc
    };
  }
  function refreshAppearance() { if (has3D) world.setAppearance(appearanceFor(learner())); }

  // ---------------------------------------------------------------- worlds & runs
  function ensureSession() {
    return progress.ensureSession({ worldId: set.lastWorld || 'adventure', ageGroup: set.age, lang: set.lang, defaultName: tr(config.classroomSettings.defaultLearnerName, set.lang) });
  }
  async function enterWorld(worldId, { fresh = false } = {}) {
    const w = config.worldById[worldId] || config.worlds[0];
    if (!w) return;
    ensureSession();
    const l = learner();
    let run = fresh ? null : progress.activeRun(l.id, w.id);
    const isNew = !run;
    if (!run) run = progress.startRun(l.id, w.id, set.age, set.lang);
    cur.run = run;
    const changedWorld = cur.worldId !== w.id;
    cur.worldId = w.id;
    const sess = progress.session();
    if (sess) { sess.worldId = w.id; progress.save(); }
    saveSetting('lastWorld', w.id);
    if (has3D) {
      await applyTheme(w);
      if (isNew || changedWorld) world.resetPlayer();
      refreshAppearance();
    }
    refreshStations();
    if (state !== S.PLAYROOM) go(S.PLAYROOM); else refreshHud();
    cur.lastNear = -2;
  }
  async function applyTheme(w) {
    const key = w.id + '|' + set.lang;
    if (cur.themeKey === key) return;
    cur.themeKey = key;
    const defs = w.stations.map((sid) => config.stations[sid]);
    const iconStandalone = (k) => iconSvg(k, '', null, true);
    await Promise.all([
      world.applyTheme(w, worldName(w), iconStandalone),
      world.buildStations(defs, t('station'), (st) => tr(st.title, set.lang), iconStandalone)
    ]);
  }
  function stationStates(run) {
    if (!run) return ['locked', 'locked', 'locked', 'locked'];
    const next = progress.nextStationIndex(run);
    const seq = config.progressSettings.sequentialStations;
    return run.stations.map((s, i) => (s.completed ? 'done' : seq ? (i === next ? 'active' : 'locked') : 'open'));
  }
  function activeIndex(run) {
    if (!run) return -1;
    if (config.progressSettings.sequentialStations) return progress.nextStationIndex(run);
    return progress.nextStationIndex(run);
  }
  function refreshStations() {
    const states = stationStates(cur.run);
    if (has3D) world.setStationStates(states, run() && run().status === 'active' ? activeIndex(run()) : -1);
    hud.setDots(states);
    if (!has3D && state === S.PLAYROOM) renderCards();
  }
  const run = () => cur.run;

  // ---------------------------------------------------------------- HUD
  function refreshHud() {
    const l = learner();
    hud.setLearner(l ? l.name : '', l ? l.stars : 0);
    hud.setCoins(l ? progress.coins(l.id) : 0);
    hud.setSound(set.sound);
    hud.setMusic(set.music, audio.available);
    hud.setCamera(t({ near: 'camNear', normal: 'camNormal', far: 'camFar' }[set.camera]));
    hud.setDots(stationStates(cur.run));
  }

  // ---------------------------------------------------------------- tutorial
  function startTutorial() {
    if (!has3D || progress.flag('tutorialDone') || !cfgA.showTutorial) { cur.tutorial = null; hud.tutorial(null); return; }
    setTutorial('move');
  }
  function setTutorial(step) {
    cur.tutorial = step;
    const p = has3D ? world.player() : { x: 0, z: 0 };
    cur.movedFrom = { x: p.x, z: p.z };
    if (!step) { hud.tutorial(null); progress.setFlag('tutorialDone', true); return; }
    hud.tutorial(step, t(step === 'move' ? 'tutMove' : step === 'follow' ? 'tutFollow' : 'tutPress'), () => setTutorial(null));
  }

  // ---------------------------------------------------------------- per frame
  let mapAt = 0, clock = 0;
  function update(dt) {
    if (!has3D) return;
    clock += dt;
    if (state === S.PLAYROOM) {
      const frozen = audioPanel.isOpen || minimap.isOpen || townUI.isOpen;
      const x = frozen ? 0 : (keys.right || pad.right ? 1 : 0) - (keys.left || pad.left ? 1 : 0);
      const z = frozen ? 0 : (keys.down || pad.down ? 1 : 0) - (keys.up || pad.up ? 1 : 0);
      world.setInput(x, z);
      const r = run();
      const act = r && r.status === 'active' ? activeIndex(r) : -1;
      const gap = config.movementSettings.interactDistance;
      const near = world.nearStation(gap);
      const canPlay = near >= 0 && r && progress.canPlayStation(r, near);
      // a place to use (arcade, door, a game, a robot friend...) when no station is close
      const ride = world.ride;
      const auto = !!ride && (ride.kind === 'bus' || ride.kind === 'train' || ride.kind === 'coaster');      // these drive themselves
      const poi = !canPlay && near < 0 && !auto ? world.nearPoi(gap + 0.5) : null;
      cur.poi = poi;
      // in the town: a unicorn or car to get on, a school child to greet, or getting off again
      const mount = !ride && !canPlay && !poi ? world.nearRide(gap + 0.8) : null;
      const kid = !ride && !canPlay && !poi && !mount ? world.nearKid(2.4) : null;
      let label = poi ? tr(poi.cue, set.lang) : null, can = canPlay || !!poi;
      if (ride) { can = !!poi || !auto || !!ride.atStop; label = poi ? tr(poi.cue, set.lang) : t(auto ? 'getOffHere' : 'getOff'); }
      else if (mount) { can = true; label = t(mount.kind === 'car' ? 'driveCar' : 'rideUnicorn'); }
      else if (kid !== null) { can = true; label = t('sayHi'); }
      hud.setInteract(can, label);
      const say = cur.say && cur.say.until > performance.now() ? cur.say : null;
      if (say) hud.setHint(say.text, 'info');
      else if (ride && ride.kind === 'bus') hud.setHint(ride.atStop ? t('busAtStop', { name: tr(ride.atStop.name, set.lang) }) : t('onBus'), 'info');
      else if (ride && ride.kind === 'train') hud.setHint(ride.atStop ? t('trainAtStop', { name: tr(ride.atStop.name, set.lang) }) : t('onTrain'), 'info');
      else if (world.waitingBus) hud.setHint(t('busComing'), 'info');
      else if (world.waitingTrain) hud.setHint(t('trainComing'), 'info');
      else if (world.waitingCoaster) hud.setHint(t('coasterWait'), 'info');
      else if (poi) hud.setHint(tr(poi.label, set.lang), 'info');
      else if (near >= 0 && !canPlay && r) {
        if (r.stations[near].completed) hud.setHint(t('stationDone'), 'done');
        else hud.setHint(t('stationLocked', { n: act + 1 }), 'locked');
      } else if (canPlay) hud.setHint('', 'info');
      else if (world.outdoor) hud.setHint('', 'info');
      else if (act >= 0 && world.distanceToStation(act) > 2.5) hud.setHint(t('followHint'), 'info');
      else hud.setHint(act < 0 ? t('allDoneHint') : '', 'info');
      // the yellow arrow leads to the next station indoors, and back to the front door when outside
      if (ride) world.guide(false);
      else if (world.outdoor) world.guide(true, { x: DOOR.x + 1.2, z: DOOR.z });
      else world.guide(act >= 0 && !canPlay && !poi);
      hud.setReturn(world.outdoor);
      if (clock - mapAt > 0.15) { mapAt = clock; minimap.update(world.player(), world.stationPositions(), clock); }
      saveResume(false);
      // tutorial progress
      if (cur.tutorial === 'move') { const p = world.player(); if (Math.hypot(p.x - cur.movedFrom.x, p.z - cur.movedFrom.z) > 1.6) setTutorial('follow'); }
      else if (cur.tutorial === 'follow' && canPlay) setTutorial('press');
    } else {
      world.setInput(0, 0);
      world.guide(false);
    }
  }

  // ---------------------------------------------------------------- quiz
  function interact() {
    if (state !== S.PLAYROOM || !has3D) return;
    const gap = config.movementSettings.interactDistance;
    const ride = world.ride;
    if (ride) {
      // on a unicorn or in a car a nearby game still opens; otherwise the button gets the child off
      const auto = ride.kind === 'bus' || ride.kind === 'train' || ride.kind === 'coaster';
      const poi = !auto ? world.nearPoi(gap + 0.5) : null;
      if (poi) { doPoi(poi); return; }
      if (!auto || ride.atStop) { audio.play('tap'); world.dismount(); }
      return;
    }
    const near = world.nearStation(gap);
    if (near >= 0) { openQuiz(near); return; }
    const poi = world.nearPoi(gap + 0.5);
    if (poi) { doPoi(poi); return; }
    if (world.nearRide(gap + 0.8)) { audio.play('tap'); world.mount(); return; }
    const kid = world.nearKid(2.4);
    if (kid !== null) greetKid(kid);
  }

  // ---------------------------------------------------------------- places in the world (arcade, door, games, robot friends)
  function doPoi(p) {
    audio.play('tap');
    switch (p.action) {
      case 'door': { const tg = world.doorTarget(); world.walkTo(tg.x, tg.z); break; }
      case 'arcade': openArcade(S.PLAYROOM); break;
      case 'islamic': openIslamic(S.PLAYROOM); break;
      case 'wardrobe': colTab = 'wardrobe'; openCollection(); break;
      case 'npc': greetNpc(p); break;
      case 'game': startGame(p.game, { from: S.PLAYROOM, level: p.level }); break;
      case 'quiz': startFreeQuiz(p); break;
      case 'bus': callBus(p); break;
      case 'train': callTrain(p); break;
      case 'shop': ensureSession(); townUI.openShop(p.shop); break;
      case 'fact': readFact(p); break;
      case 'coaster': if (world.rideCoaster()) say(t('coasterWait'), 4000); break;
      case 'cinema': { ensureSession(); const stories = BOOKS.filter((b) => b.kind === 'story'); const b = stories[Math.floor(Math.random() * stories.length)]; toast(t('cinemaShow', { name: tr(b.title, set.lang) }), { icon: G.star }); townUI.openReader(b.id); break; }
      case 'clock': townUI.openClock(); break;
      default: break;
    }
  }
  // a bus stop: the bus comes down the road, stops, and the child gets on by themselves
  function callBus(p) {
    if (world.waitingBus || world.ride) return;
    if (world.callBus(p.stop)) say(t('busComing'), 6000);
  }
  // a train station: a train comes along the line above, stops, and the child gets on by themselves
  function callTrain(p) {
    if (world.waitingTrain || world.ride) return;
    if (world.callTrain(p.station)) say(t('trainComing'), 6000);
  }
  // ---- the town: coins, fact boards
  function addCoins(n) {
    ensureSession();
    const l = learner();
    if (!l || !(n > 0)) return;
    hud.setCoins(progress.addCoins(l.id, n), true);
  }
  function readFact(p) {
    const f = factById[p.fact];
    if (!f) return;
    ensureSession();
    const l = learner();
    const first = !!l && progress.markFact(l.id, f.id);
    if (first) { addCoins(COIN_RULES.fact); audio.play('coin'); }
    townUI.openFact(f, first);
  }
  function say(text, ms = 5000) {
    cur.say = { text, until: performance.now() + ms };
    speech.speak(text, set.lang, { kind: 'ui', queue: false });
  }
  function greetKid(k) {
    const lines = t(world.kidIsAdult(k) ? 'adultHi' : 'kidHi');
    const line = lines[(k + cur.greetN++) % lines.length];
    cur.say = { text: line, until: performance.now() + 4500 };
    speech.speak(line, set.lang, { kind: 'greeting' });
  }
  function greetNpc(p) {
    const lines = t(p.npc === 'boy' ? 'greetBoy' : 'greetGirl');
    const line = lines[cur.greetN++ % lines.length];
    world.greetNpc(p.npc);
    cur.say = { text: `${tr(p.label, set.lang)}: ${line}`, until: performance.now() + 5500 };
    speech.speak(line, set.lang, { kind: 'greeting' });
  }
  async function walkToPlace(g) {
    audio.play('tap');
    if (state !== S.PLAYROOM) return;
    // the town map: a quick trip to a landmark or a bus stop, or straight back to the preschool garden
    if (g.kind === 'home') { world.resetPlayer('yard'); say(t('backToSchool'), 3000); return; }
    if (g.kind === 'travel') { world.teleport(g.x, g.z); say(tr(g.name, set.lang), 3000); return; }
    world.walkTo(g.x, g.z, () => {
      if (g.kind === 'poi' && state === S.PLAYROOM) { const poi = world.nearPoi(config.movementSettings.interactDistance + 0.6); if (poi && poi.id === g.id) hud.setHint(tr(poi.label, set.lang), 'info'); }
    });
  }
  function goInside() {
    audio.play('tap');
    // far away in the town (or riding): back to the preschool garden in one hop, then walk in
    const p = world.player();
    if (world.ride || Math.hypot(p.x - DOOR.x, p.z - DOOR.z) > 60) { world.resetPlayer('yard'); say(t('backToSchool'), 3000); }
    const tg = world.doorTarget(); world.walkTo(tg.x, tg.z);
  }

  // ---------------------------------------------------------------- arcade, mini-games and Quran learning
  function openArcade(from) { cur.hubFrom = from || state; go(S.ARCADE); }
  function startGame(id, { from, level } = {}) {
    cur.mgReturn = from || (state === S.ARCADE ? S.ARCADE : state === S.PLAYROOM ? S.PLAYROOM : S.MAIN_MENU);
    ensureSession();
    if (!go(S.MINIGAME)) return;
    arcade.openGame(id, { level, from: cur.mgReturn === S.ARCADE ? 'arcade' : 'world' });
  }
  function leaveGame() { const to = cur.mgReturn || S.ARCADE; cur.mgReturn = null; go(ALLOWED.MINIGAME.includes(to) ? to : S.ARCADE); }
  function leaveHub() { const to = cur.hubFrom === S.PLAYROOM && has3D ? S.PLAYROOM : S.MAIN_MENU; cur.hubFrom = null; go(to); }
  function openIslamic(from, start) { cur.hubFrom = from || state; cur.islamicStart = start || null; ensureSession(); go(S.ISLAMIC); }

  // a short free question at the Nature Station (not part of the 4-station run, but recorded as an activity)
  function startFreeQuiz(p) {
    if (state !== S.PLAYROOM || cur.quiz || cur.free) return;
    const ids = (p.stations || ['nat-1', 'nat-2', 'nat-3', 'nat-4']).filter((sid) => config.stations[sid]);
    const pool = ids.flatMap((sid) => config.stations[sid].poolByAge[set.age] || []);
    if (!pool.length) return;
    const q = config.questionById[pool[Math.floor(Math.random() * pool.length)]];
    if (!q) return;
    const station = config.stations[q.station] || config.stations[ids[0]];
    const order = q.choices.slice().sort(() => Math.random() - 0.5);
    ensureSession();
    cur.free = { q, order, solved: false, attempts: 0, startedAt: Date.now(), station, town: p.zone === 'city' };
    if (!go(S.QUIZ)) { cur.free = null; return; }
    const prompt = tr(q.prompt, set.lang);
    quiz.open({
      badge: '★', stationNo: 0, stationTitle: tr(station.title, set.lang), topic: tr(station.topic, set.lang), color: station.color, prompt, art: q.art, stationIcon: station.icon, mascot: mascotSvg(),
      showLabels: cfgA.showAnswerLabels, canListen: speech.available(set.lang),
      choices: order.map((id) => ({ id, label: choiceLabel(id, set.lang, config.answerChoices), custom: config.answerChoices[id] && (config.answerChoices[id].emoji || config.answerChoices[id].image || config.answerChoices[id].icon) ? config.answerChoices[id] : null }))
    });
    audio.play('open');
    if (set.readAloud) speech.speak(prompt, set.lang);
  }
  function answerFree(id) {
    const f = cur.free;
    if (state !== S.QUIZ || !f || f.solved) return;
    f.attempts++;
    if (id === f.q.answer) {
      f.solved = true;
      quiz.markCorrect(id, t('praise')[f.attempts % t('praise').length], tr(f.q.explain, set.lang));
      audio.play('correct');
      progress.recordActivity({ kind: 'quiz', game: f.q.id, level: 0, ageGroup: set.age, startedAt: f.startedAt, completed: true, rounds: 1, correct: 1, mistakes: f.attempts - 1 });
      // town quiz boards pay coins (first try or not: every right answer counts)
      if (f.town) { addCoins(COIN_RULES.quiz); toast(t('quizCoins', { n: COIN_RULES.quiz }), { icon: G.star, tone: 'reward' }); }
      after('quiz', Math.max(900, set.autoClose), finishFree);
    } else {
      quiz.markWrong(id, t('tryAgain')[(f.attempts - 1) % t('tryAgain').length], tr(f.q.hint, set.lang));
      audio.play('wrong');
    }
  }
  function finishFree() {
    if (!cur.free) return;
    clearT('quiz');
    cur.free = null;
    if (state === S.QUIZ) go(S.PLAYROOM);
    toast(t('freeQuizDone'), { icon: G.star, tone: 'reward' });
  }
  function openQuiz(i) {
    const r = run();
    if (state !== S.PLAYROOM || !r || cur.quiz) return false;
    if (!progress.canPlayStation(r, i)) {
      if (r.stations[i] && r.stations[i].completed) toast(t('stationDone'));
      else toast(t('stationLocked', { n: activeIndex(r) + 1 }), { icon: G.star });
      return false;
    }
    const st = r.stations[i];
    const q = config.questionById[st.questionId];
    const station = config.stations[st.stationId];
    if (!q || !station) { report('QUESTION_MISSING', `Question ${st.questionId} is missing`); return false; }
    const order = st.choiceOrder.filter((c) => q.choices.includes(c));
    q.choices.forEach((c) => { if (!order.includes(c)) order.push(c); });
    progress.markOpened(r, i);
    cur.quiz = { index: i, q, order, solved: false, result: null };
    if (!go(S.QUIZ)) { cur.quiz = null; return false; }
    const prompt = tr(q.prompt, set.lang);
    quiz.open({
      stationNo: i + 1, stationTitle: tr(station.title, set.lang), topic: tr(station.topic, set.lang), color: station.color,
      prompt, art: q.art, stationIcon: station.icon, mascot: mascotSvg(), showLabels: cfgA.showAnswerLabels,
      canListen: speech.available(set.lang),
      choices: order.map((id) => ({ id, label: choiceLabel(id, set.lang, config.answerChoices), custom: config.answerChoices[id] && (config.answerChoices[id].emoji || config.answerChoices[id].image || config.answerChoices[id].icon) ? config.answerChoices[id] : null }))
    });
    audio.play('open');
    if (set.readAloud) speech.speak(prompt, set.lang);
    if (cur.tutorial === 'press' || cur.tutorial === 'follow') setTutorial(null);
    return true;
  }
  function answer(choiceId) {
    if (cur.free) { answerFree(choiceId); return; }
    const qz = cur.quiz;
    if (state !== S.QUIZ || !qz || qz.solved) return;
    const res = progress.recordAnswer(run().id, qz.index, choiceId);
    if (!res.ok) return;
    const praise = t('praise'), again = t('tryAgain');
    if (res.correct) {
      qz.solved = true;
      qz.result = res;
      const explain = tr(qz.q.explain, set.lang);
      quiz.markCorrect(choiceId, praise[(res.attempts + qz.index) % praise.length], explain);
      audio.play('correct');
      if (set.readAloud) speech.speak(explain || praise[0], set.lang);
      after('quiz', Math.max(600, set.autoClose), finishStation);
    } else {
      const hint = tr(qz.q.hint, set.lang);
      quiz.markWrong(choiceId, again[(res.attempts - 1) % again.length], hint);
      audio.play('wrong');
      if (set.readAloud && hint) speech.speak(hint, set.lang);
    }
  }
  function closeQuiz() {
    const qz = cur.quiz;
    if (state !== S.QUIZ) return;
    if (cur.free) { if (cur.free.solved) finishFree(); else { cur.free = null; go(S.PLAYROOM); } return; }
    if (qz && qz.solved) { finishStation(); return; }
    cur.quiz = null;
    go(S.PLAYROOM);
  }
  function finishStation() {
    const qz = cur.quiz;
    if (state !== S.QUIZ || !qz || !qz.solved) return;
    clearT('quiz');
    cur.quiz = null;
    const res = qz.result;
    go(S.STATION_COMPLETE);
    if (has3D) world.celebrate(qz.index);
    audio.play('reward');
    const l = learner();
    if (res.reward) {
      const name = tr(res.reward.name, set.lang);
      const icon = rewardIcon(res.reward.id);
      toast(res.reward.isNew ? t('gotReward', { reward: name }) : t('alreadyReward', { reward: name }), { icon, tone: 'reward', ms: 3200 });
      if (res.reward.type !== 'sticker') refreshAppearance();
    } else toast(t('starEarned'), { icon: G.star, tone: 'reward' });
    hud.setLearner(l.name, l.stars);
    hud.setCoins(progress.coins(l.id));
    refreshStations();
    after('celebrate', 1700, () => {
      if (res.done) { showComplete(false); return; }
      go(S.PLAYROOM);
      const n = activeIndex(run());
      if (n >= 0) { toast(t('nextStation', { n: n + 1 }), { icon: G.star }); audio.play('next'); }
    });
  }
  function rewardIcon(id) {
    const r = config.rewards[id];
    if (!r) return G.star;
    if (r.type === 'sticker') return iconSvg(r.icon, 'toast-svg');
    if (r.type === 'outfit') return outfitThumb(r.color);
    return accessoryThumb(r.model, r.color);
  }

  // ---------------------------------------------------------------- session complete
  function showComplete(endedEarly) {
    const r = run();
    const l = learner();
    if (endedEarly && r) progress.endRunEarly(r.id);
    const classMode = sessionMode() === 'class';
    if (classMode && l) progress.markFinished(l.id);
    const next = classMode ? progress.peekNextLearner() : null;
    const s = progress.session();
    const done = s ? s.finishedLearnerIds.length : 0;
    const stars = r ? r.stations.map((x) => x.completed) : [false, false, false, false];
    const rewards = r ? r.stations.filter((x) => x.rewardId).map((x) => ({ svg: rewardIcon(x.rewardId), name: tr(config.rewards[x.rewardId].name, set.lang) })) : [];
    complete.render({
      mascotSvg: mascotSvg(),
      title: t(endedEarly ? 'stoppedTitle' : 'wellDone', { name: l ? l.name : '' }),
      text: endedEarly ? t('stoppedText') : t('allStations'),
      stars, starsEarned: stars.filter(Boolean).length, rewards, classMode,
      nextName: next ? next.name : null, everyoneDone: classMode && !next,
      progressText: s ? t('classProgress', { done, total: s.learnerIds.length }) : ''
    });
    if (!go(S.SESSION_COMPLETE)) return;
    if (has3D) world.party();
    audio.play('fanfare');
  }
  async function nextLearner() {
    const l = progress.advanceLearner();
    if (!l) { showComplete(false); return; }
    toast(t('nextLearner', { name: l.name }), { icon: G.user });
    await enterWorld((progress.session() && progress.session().worldId) || cur.worldId || 'adventure', { fresh: true });
  }

  // ---------------------------------------------------------------- settings
  function saveSetting(key, value) { set[key] = value; progress.setSetting(key, value); }
  function applySetting(key, value) {
    saveSetting(key, value);
    switch (key) {
      case 'lang': setLang(value); if (has3D) world.setLanguage(value); relabelAll(); break;
      case 'narrator': set.narrator = normaliseNarrator(value); speech.configure(set.narrator); break;
      case 'kidLock': kid.setEnabled(value); if (!value) progress.setSetting('resume', null); else saveResume(true); break;
      case 'sound': case 'music': case 'musicStyle': case 'musicVolume': case 'effectsVolume': applyAudio(); break;
      case 'camera': if (has3D) world.setCameraPreset(value); refreshHud(); break;
      case 'quality': if (has3D) world.setQuality(value); break;
      case 'motion': applyMotion(); break;
      case 'tutorial': progress.setFlag('tutorialDone', false); break;
      default: break;
    }
  }
  function applyAudio() {
    audio.set({ enabled: set.sound, music: set.music, style: set.musicStyle, musicVolume: set.musicVolume, effectsVolume: set.effectsVolume });
    speech.setMuted(!set.sound);
    hud.setSound(set.sound);
    hud.setMusic(set.music, audio.available);
  }
  function applyMotion() {
    const r = reduced();
    document.body.classList.toggle('reduced-motion', r);
    if (has3D) world.setReducedMotion(r);
  }
  async function relabelAll() {
    document.documentElement.lang = set.lang;
    hud.relabel();
    refreshHud();
    if (has3D && cur.worldId) { cur.themeKey = null; await applyTheme(config.worldById[cur.worldId]); refreshStations(); }
    if (state === S.MAIN_MENU) renderMenu();
    if (state === S.WORLD_SELECT) renderWorlds();
    if (state === S.REWARD_COLLECTION) renderCollection();
    if (state === S.ARCADE) arcade.showHub(true);
    audioPanel.refresh();
  }
  function toggleSound() { applySetting('sound', !set.sound); if (set.sound) { audio.unlock(); audio.play('tap'); } if (state === S.MAIN_MENU) renderMenu(); if (pause.isOpen) pause.open({ soundOn: set.sound, musicOn: set.music }); }
  function toggleMusic() { applySetting('music', !set.music); if (pause.isOpen) pause.open({ soundOn: set.sound, musicOn: set.music }); }

  // ---------------------------------------------------------------- screens
  const langItems = () => config.availableLanguages.map((l) => ({ id: l, label: l === 'ms' ? 'BM' : l.toUpperCase() }));
  const ageItems = () => config.ageGroups.map((a) => ({ id: a.id, label: tr(a.label, set.lang).replace(/ tahun| years/i, ''), icon: '' }));
  function renderMenu() {
    const l = learner();
    const r = l && cur.worldId ? progress.activeRun(l.id, cur.worldId) : null;
    menu.render({ title: config.gameTitle, subtitle: tr(config.subtitle, set.lang), mascotSvg: mascotSvg(), lang: set.lang, langs: langItems(), age: set.age, ages: ageItems(),
      soundOn: set.sound, learnerName: l ? l.name : '', version, hasProgress: !!(r && r.stations.some((s) => s.completed)) });
  }
  function renderWorlds() {
    const l = learner();
    worlds.render({ age: set.age, ages: ageItems(), worlds: config.worlds.map((w) => {
      let done = 0;
      if (l) {
        for (let i = l.runIds.length - 1; i >= 0; i--) { const r = progress.run(l.runIds[i]); if (r && r.worldId === w.id) { done = r.stations.filter((s) => s.completed).length; break; } }
      }
      return { id: w.id, name: worldName(w), blurb: tr(w.blurb, set.lang), icon: iconSvg(w.icon, 'wc-svg'), color: w.color, featured: !!w.featured, done };
    }) });
  }
  let colTab = 'stickers', colSlot = 'head';
  function renderCollection() {
    ensureSession();
    const l = learner();
    const rw = config.rewards;
    const stickers = Object.keys(rw).filter((k) => rw[k].type === 'sticker').map((k) => ({ id: k, name: tr(rw[k].name, set.lang), owned: l.rewards.includes(k), svg: iconSvg(rw[k].icon, 'sticker-svg') }));
    const slotThumb = (slot) => {
      if (slot === 'outfit') return outfitThumb(rw[l.outfit] ? rw[l.outfit].color : '#ff8fc0');
      if (slot === 'style') return hairThumb(l.hair.style, l.hair.color, config.character.hijabColor);
      const id = l.equipped[slot];
      return id && rw[id] ? accessoryThumb(rw[id].model, rw[id].color) : noneThumb();
    };
    const slots = [...SLOTS, 'outfit', 'style'].map((s) => ({ id: s, label: t('slot_' + s), thumb: slotThumb(s) }));
    let items;
    if (colSlot === 'outfit') {
      items = Object.keys(rw).filter((k) => rw[k].type === 'outfit').map((k) => ({ id: k, name: tr(rw[k].name, set.lang), owned: !!rw[k].starter || l.rewards.includes(k), equipped: l.outfit === k, thumb: outfitThumb(rw[k].color) }));
    } else if (colSlot === 'style') {
      items = HAIR_STYLES.map((h) => ({ id: 'hair:' + h, name: t('hair_' + h), owned: true, equipped: l.hair.style === h, thumb: hairThumb(h, l.hair.color, config.character.hijabColor) }));
    } else {
      items = [{ id: 'none:' + colSlot, name: t('none'), owned: true, equipped: !l.equipped[colSlot], thumb: noneThumb() }]
        .concat(Object.keys(rw).filter((k) => rw[k].type === 'accessory' && rw[k].slot === colSlot).map((k) => ({ id: k, name: tr(rw[k].name, set.lang), owned: l.rewards.includes(k), equipped: l.equipped[colSlot] === k, thumb: accessoryThumb(rw[k].model, rw[k].color) })));
    }
    collection.render({ tab: colTab, stickers, stickerOwned: stickers.filter((s) => s.owned).length, stars: l.stars, slots, slot: colSlot, items });
  }
  function equip(id) {
    const l = learner();
    if (id.startsWith('none:')) progress.equip(l.id, id.slice(5), null);
    else if (id.startsWith('hair:')) progress.setHair(l.id, id.slice(5));
    else if (config.rewards[id] && config.rewards[id].type === 'outfit') progress.setOutfit(l.id, id);
    else if (config.rewards[id]) progress.equip(l.id, config.rewards[id].slot, l.equipped[config.rewards[id].slot] === id ? null : id);
    audio.play('tap');
    refreshAppearance();
    renderCollection();
  }
  function renderCards() {
    const w = config.worldById[cur.worldId];
    if (!w) return;
    const states = stationStates(run());
    cards.render({ worldName: worldName(w), soundOn: set.sound, stations: w.stations.map((sid, i) => ({ title: tr(config.stations[sid].title, set.lang), icon: iconSvg(config.stations[sid].icon, 'sc-svg'), color: config.stations[sid].color, state: states[i] })) });
  }

  // ---------------------------------------------------------------- navigation actions
  async function play() {
    audio.play('tap');
    ensureSession();
    const s = progress.session();
    await enterWorld((s && s.worldId) || set.lastWorld || 'adventure');
  }
  // the menu's "Explore the Town": straight out of the preschool garden gate, with the unicorn stable and the bus stop in view
  async function exploreTown() {
    await play();
    if (state !== S.PLAYROOM || !has3D) return;
    world.teleport(40, 36);
    say(t('townWelcome'), 9000);
  }
  async function confirmHome() {
    const ok = await confirmDialog({ title: t('confirmHomeTitle'), text: t('confirmHomeText'), yes: t('yes'), no: t('no'), icon: 'home' });
    if (ok) go(S.MAIN_MENU);
    else if (state === S.PAUSED) { /* stay */ }
  }
  async function confirmFinish() {
    if (!run() || run().status !== 'active') return;
    const ok = await confirmDialog({ title: t('confirmFinishTitle'), text: t('confirmFinishText'), yes: t('confirmFinishYes'), no: t('confirmFinishNo'), icon: 'flag' });
    if (ok && (state === S.PLAYROOM || state === S.PAUSED)) showComplete(true);
  }
  function openPause() { if (state !== S.PLAYROOM) return; if (go(S.PAUSED)) pause.open({ soundOn: set.sound, musicOn: set.music }); }
  function openCollection() { returnTo = state === S.PAUSED ? S.PLAYROOM : state; go(S.REWARD_COLLECTION); }
  function openWorlds() { returnTo = state === S.PAUSED ? S.PLAYROOM : state; go(S.WORLD_SELECT); }
  async function openTeacher() {
    returnTo = state;
    const ok = await adultGate(config.classroomSettings.adultGateHoldMs);
    if (ok) go(S.TEACHER_AREA);
  }
  function exitTeacher() {
    const target = returnTo === S.SESSION_COMPLETE && teacherDirty === false ? S.SESSION_COMPLETE : S.MAIN_MENU;
    teacherDirty = false;
    go(target);
  }
  let teacherDirty = false;

  function saveFile(name, text) {
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.style.display = 'none';
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
  }
  // mini-game, Quran-learning and free-question records: a separate file, so the 18-column station CSV never changes
  function downloadActivities(scope) {
    try {
      const nameOf = (x) => {
        if (x.kind === 'minigame') { const g = arcade.games.find((q) => q.id === x.game); return g ? tr(g.title, set.lang) : x.game; }
        if (x.kind === 'quiz') { const q = config.questionById[x.game]; return q ? tr(q.prompt, set.lang) : x.game; }
        return x.game;
      };
      const { csv, rowCount } = progress.exportActivitiesCSV(scope, set.lang, tAll(), nameOf);
      if (!rowCount) return t('csvNone');
      const d = new Date(); const z = (n) => String(n).padStart(2, '0');
      const file = `${t('csvActFile')}_${scope === 'all' ? 'all' : 'session'}_${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}_${z(d.getHours())}${z(d.getMinutes())}.csv`;
      saveFile(file, csv);
      return t('csvDone', { n: rowCount, file });
    } catch (e) { report('CSV_FAILED', e.message, e); return t('csvFailed', { msg: e.message }); }
  }
  function downloadCsv(scope) {
    try {
      const { csv, rowCount } = progress.exportCSV(scope, set.lang, tAll());
      if (!rowCount) return t('csvNone');
      const d = new Date();
      const z = (n) => String(n).padStart(2, '0');
      const file = `${t('csvFile')}_${scope === 'all' ? 'all' : 'session'}_${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}_${z(d.getHours())}${z(d.getMinutes())}.csv`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = file; a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
      return t('csvDone', { n: rowCount, file });
    } catch (e) {
      report('CSV_FAILED', e.message, e);
      return t('csvFailed', { msg: e.message });
    }
  }

  // ---------------------------------------------------------------- teacher api
  const teacherApi = {
    exit: exitTeacher,
    parseNames: (text) => Object.assign(parseNameList(text, config.classroomSettings.maxNameLength, config.classroomSettings.maxLearners), { max: config.classroomSettings.maxLearners }),
    async startSession({ mode, namesText, worldId, age, reuse, play: andPlay }) {
      let names;
      if (mode === 'class') {
        names = parseNameList(namesText, config.classroomSettings.maxNameLength, config.classroomSettings.maxLearners).names;
        if (!names.length) return { message: t('namesNone') };
      } else {
        const n = String(namesText || '').trim();
        names = [n || tr(config.classroomSettings.defaultLearnerName, set.lang)];
      }
      if (progress.session()) {
        const ok = await confirmDialog({ title: t('confirmReplaceTitle'), text: t('confirmReplaceText'), yes: t('yes'), no: t('no') });
        if (!ok) return null;
      }
      const w = config.worldById[worldId] ? worldId : (config.worlds[0] && config.worlds[0].id);
      if (age && config.ageGroups.some((a) => a.id === age)) applySetting('age', age);
      progress.startSession({ mode, names, worldId: w, ageGroup: set.age, lang: set.lang, reuseByName: reuse });
      cur.run = null; cur.worldId = null;
      teacherDirty = true;
      refreshAppearance();
      if (andPlay) { await enterWorldFromTeacher(w); return null; }
      return { message: t('sessionStarted', { n: names.length }) };
    },
    async endSession() {
      if (!progress.session()) return false;
      const ok = await confirmDialog({ title: t('confirmEndSessionTitle'), text: t('confirmEndSessionText'), yes: t('yes'), no: t('no'), icon: 'flag' });
      if (!ok) return false;
      progress.endSession();
      cur.run = null; cur.worldId = null; teacherDirty = true;
      return true;
    },
    switchLearner(id) { if (progress.switchLearner(id)) { cur.run = null; teacherDirty = true; refreshAppearance(); } },
    async resetLearner(id) {
      const l = progress.learner(id);
      if (!l) return false;
      const ok = await confirmDialog({ title: t('confirmResetTitle', { name: l.name }), text: t('confirmResetText', { name: l.name }), yes: t('yes'), no: t('no'), icon: 'refresh' });
      if (!ok) return false;
      progress.resetLearner(id);
      if (learner() && learner().id === id) cur.run = null;
      teacherDirty = true;
      return true;
    },
    async finishLearner() {
      const l = learner();
      if (!l) return false;
      const ok = await confirmDialog({ title: t('confirmFinishTitle'), text: t('confirmFinishText'), yes: t('confirmFinishYes'), no: t('confirmFinishNo'), icon: 'flag' });
      if (!ok) return false;
      for (const rid of l.runIds) { const r = progress.run(rid); if (r && r.status === 'active') progress.endRunEarly(rid); }
      progress.advanceLearner();
      cur.run = null; teacherDirty = true; refreshAppearance();
      return true;
    },
    downloadCsv, downloadActivities,
    leaveFullscreen() { kid.leaveFullscreen(); },
    async installApp() { return promptInstall(); },
    async clearAll() {
      const a = await confirmDialog({ title: t('confirmClearTitle'), text: t('confirmClearText'), yes: t('yes'), no: t('no'), tone: 'danger', icon: 'trash' });
      if (!a) return false;
      const b = await confirmDialog({ title: t('confirmClearTitle2'), text: t('confirmClearText2'), yes: t('clearAll'), no: t('cancel'), tone: 'danger', icon: 'trash' });
      if (!b) return false;
      progress.clearAll();
      cur.run = null; cur.worldId = null; teacherDirty = true;
      refreshAppearance();
      return true;
    },
    setSetting(key, value) { applySetting(key, value); },
    records(scope, filter) {
      const d = progress.data;
      const sid = d.currentSessionId;
      const runs = Object.values(d.runs).filter((r) => (scope === 'all' || r.sessionId === sid) && (filter === 'all' || r.learnerId === filter)).sort((a, b) => b.startedAt - a.startedAt);
      const learners = [...new Set(Object.values(d.runs).filter((r) => scope === 'all' || r.sessionId === sid).map((r) => r.learnerId))].map((id) => d.learners[id]).filter(Boolean);
      const rows = [];
      let stations = 0, completed = 0, attempts = 0, attempted = 0, firstTry = 0;
      for (const r of runs) {
        r.stations.forEach((s) => {
          stations++; attempts += s.attempts; if (s.attempts) attempted++; if (s.completed) completed++; if (s.firstTry) firstTry++;
          if (rows.length < 400) {
            const st = config.stations[s.stationId], q = config.questionById[s.questionId], w = config.worldById[r.worldId];
            rows.push({ learner: d.learners[r.learnerId] ? d.learners[r.learnerId].name : '?', world: w ? worldName(w) : r.worldId, station: st ? tr(st.title, set.lang) : s.stationId,
              question: q ? tr(q.prompt, set.lang) : s.questionId, attempts: s.attempts, firstTry: s.completed ? (s.firstTry ? t('yes') : t('no')) : '-',
              status: s.completed ? t('statusComplete') : r.status === 'ended-early' ? t('statusEndedEarly') : r.status === 'reset' ? t('statusReset') : s.attempts ? t('statusInProgress') : t('statusNotStarted'),
              stars: s.stars, reward: s.rewardId && config.rewards[s.rewardId] ? tr(config.rewards[s.rewardId].name, set.lang) : '' });
          }
        });
      }
      return { rows, learners, summary: { completion: stations ? Math.round((completed / stations) * 100) : 0, avgAttempts: attempted ? (attempts / attempted).toFixed(1) : '0', firstTryRate: completed ? Math.round((firstTry / completed) * 100) : 0 } };
    },
    vm() {
      const s = progress.session();
      const l = learner();
      const w = s && config.worldById[s.worldId];
      return {
        session: s ? { mode: s.mode, learners: s.learnerIds.length, worldName: w ? worldName(w) : '-', age: s.ageGroup, started: new Date(s.startedAt).toLocaleString() } : null,
        learnerLine: l ? `${t('playingAs')}: ${l.name}` : '',
        worlds: config.worlds.map((x) => ({ id: x.id, name: worldName(x) })), defaultWorld: (s && s.worldId) || set.lastWorld || 'adventure',
        ages: config.ageGroups.map((a) => ({ id: a.id, label: tr(a.label, set.lang) })), langs: config.availableLanguages.map((x) => ({ id: x, label: x === 'ms' ? 'Bahasa Melayu' : x === 'en' ? 'English' : x })),
        maxName: config.classroomSettings.maxNameLength,
        learners: s ? s.learnerIds.map((id) => {
          const ln = progress.learner(id); const sm = progress.summary(id);
          return { id, name: ln.name, current: s.learnerIds[s.currentIndex] === id, status: s.learnerIds[s.currentIndex] === id ? 'current' : s.finishedLearnerIds.includes(id) ? 'finished' : 'waiting', completion: sm.completion, completed: sm.completed, stations: sm.stations, stars: sm.stars, firstTry: sm.firstTry, attempts: sm.attempts };
        }) : [],
        settings: Object.assign({}, set), canInstall: canInstall(), isWeb: isHttp(), lock: kid.stats,
        voiceStatus: speech.voiceFor(set.lang) ? t('voiceFound', { name: speech.voiceFor(set.lang).name }) : t('voiceNone'),
        info: { storageOk, stats: validation.stats, errors: validation.errors, warnings: validation.warnings, log: errorLog(), version, renderer: has3D ? 'WebGL' : 'Card mode' }
      };
    }
  };
  async function enterWorldFromTeacher(worldId) {
    teacherDirty = false;
    await enterWorld(worldId, { fresh: true });
  }

  // ---------------------------------------------------------------- continue after an accidental reload
  // The place the child is in is written to local storage; when the page is opened again within 6 hours it carries on
  // there instead of showing the menu. Going Home on purpose clears it.
  let savedAt = 0;
  const pendingResume = progress.settings().resume || null;      // read before the menu clears it
  function saveResume(force) {
    if (!kid.enabled) return;
    const now = performance.now();
    if (!force && now - savedAt < 3500) return;
    savedAt = now;
    let snap = null;
    if ((state === S.PLAYROOM || state === S.QUIZ || state === S.PAUSED || state === S.STATION_COMPLETE) && cur.worldId && progress.session() && has3D) {
      const p = world.player();
      snap = { k: 'world', worldId: cur.worldId, x: +p.x.toFixed(2), z: +p.z.toFixed(2) };
    } else if (state === S.ARCADE || state === S.MINIGAME) snap = { k: 'arcade' };
    else if (state === S.ISLAMIC) snap = { k: 'islamic' };
    const old = progress.settings().resume;
    if (!snap && !old) return;
    progress.setSetting('resume', snap ? Object.assign(snap, { at: Date.now() }) : null);
  }
  async function tryResume() {
    const snap = pendingResume;
    if (!kid.active || !resumeUsable(snap, Date.now()) || !progress.session() || state !== S.MAIN_MENU) return false;
    if (snap.k === 'world') {
      if (!has3D || !config.worldById[snap.worldId]) return false;
      await enterWorld(snap.worldId);
      world.teleport(snap.x, snap.z);
    } else if (snap.k === 'arcade') openArcade(S.MAIN_MENU);
    else openIslamic(S.MAIN_MENU);
    toast(t('resumed'), { icon: G.star });
    return true;
  }
  window.addEventListener('pagehide', () => saveResume(true));
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveResume(true); });

  // ---------------------------------------------------------------- UI construction
  const menu = createMenu({
    play: () => safe(play), town: () => safe(exploreTown), worlds: () => { audio.play('tap'); openWorlds(); }, collection: () => { audio.play('tap'); openCollection(); },
    teacher: () => safe(openTeacher), sound: toggleSound, audio: () => { audio.play('tap'); audioPanel.open(); },
    arcade: () => { audio.play('tap'); openArcade(S.MAIN_MENU); }, islamic: () => { audio.play('tap'); openIslamic(S.MAIN_MENU); },
    age: (a) => { applySetting('age', a); audio.play('tap'); renderMenu(); toast(t('applyNext')); },
    lang: (l) => { applySetting('lang', l); audio.play('tap'); }
  });
  const worlds = createWorlds({
    back: () => go(returnTo && ALLOWED.WORLD_SELECT.includes(returnTo) ? returnTo : S.MAIN_MENU),
    pickWorld: (id) => { audio.play('tap'); safe(() => enterWorld(id)); },
    age: (a) => { applySetting('age', a); audio.play('tap'); renderWorlds(); }
  });
  const hud = createHud({
    sound: toggleSound, music: toggleMusic, pause: openPause, finish: () => safe(confirmFinish), interact,
    wardrobe: () => { colTab = 'wardrobe'; openCollection(); },
    map: () => { audio.play('tap'); minimap.open(); }, bag: () => { audio.play('tap'); ensureSession(); townUI.openBag(); }, audio: () => { audio.play('tap'); audioPanel.open(); }, goinside: () => goInside(),
    camera: () => { const order = ['near', 'normal', 'far']; applySetting('camera', order[(order.indexOf(set.camera) + 1) % 3]); audio.play('tap'); }
  }, (dir, on) => { pad[dir] = on; if (on) audio.unlock(); });
  const pause = createPause({
    resume: () => { pause.close(); go(S.PLAYROOM); }, home: () => safe(confirmHome), finish: () => safe(confirmFinish), audio: () => audioPanel.open(),
    worlds: openWorlds, collection: openCollection, sound: toggleSound, music: toggleMusic
  });
  const complete = createComplete({
    nextLearner: () => safe(nextLearner), again: () => safe(() => enterWorld(cur.worldId || 'adventure', { fresh: true })),
    worlds: () => { returnTo = S.SESSION_COMPLETE; go(S.WORLD_SELECT); }, collection: () => { returnTo = S.SESSION_COMPLETE; go(S.REWARD_COLLECTION); },
    home: () => go(S.MAIN_MENU), teacher: () => safe(openTeacher), csv: () => toast(downloadCsv('session'), { icon: G.download })
  });
  const collection = createCollection({
    tab: (x) => { colTab = x; renderCollection(); }, slot: (x) => { colSlot = x; renderCollection(); }, equip: (id) => safe(() => equip(id)),
    locked: () => toast(t('lockedItem'), { icon: G.lock }),
    done: () => go(returnTo && ALLOWED.REWARD_COLLECTION.includes(returnTo) ? returnTo : S.MAIN_MENU)
  });
  const cards = createCards({ home: () => safe(confirmHome), sound: () => { toggleSound(); renderCards(); }, station: (i) => openQuiz(Number(i)) });
  const nogl = createNoGL({ cards: () => { show($('#nogl'), false); state = S.MAIN_MENU; safe(play); }, teacher: () => safe(openTeacher) });
  const quiz = createQuiz({ iconSvg, onAnswer: (id) => safe(() => answer(id)), onClose: closeQuiz, onContinue: () => (cur.free ? finishFree() : finishStation()), onListen: () => { const qq = cur.free ? cur.free.q : cur.quiz ? cur.quiz.q : null; if (qq) speech.speak(tr(qq.prompt, set.lang), set.lang, { force: true }); } });
  const teacher = createTeacher(teacherApi);

  const minimap = createMinimap({ onGo: (g) => safe(() => walkToPlace(g)), iconFor: (k) => iconSvg(k, '', null, true) });
  const townUI = createTownUI({
    iconFor: (k) => iconSvg(k, '', null, true),
    speak: (text) => speech.speak(text, set.lang, { kind: 'ui', queue: false }),
    coins: () => { const l = learner(); return l ? progress.coins(l.id) : 0; },
    owns: (it) => { const l = learner(); return !!l && progress.owns(l.id, it); },
    count: (id) => { const l = learner(); return l ? progress.bagCount(l.id, id) : 0; },
    buy: (it) => {
      ensureSession();
      const l = learner();
      const r = progress.buy(l.id, it);
      if (r.ok) {
        audio.play('reward'); hud.setCoins(r.coins, true);
        progress.recordActivity({ kind: 'shop', game: it.id, level: 0, ageGroup: set.age, completed: true, rounds: 1, correct: it.price });
        if (it.kind === 'wear') refreshAppearance();
      } else audio.play('wrong');
      return r;
    },
    use: (it) => { const l = learner(); if (!l || !progress.useItem(l.id, it)) return null; audio.play('correct'); return tr(it.tip, set.lang); },
    bookDone: (b) => {
      const l = learner();
      progress.recordActivity({ kind: 'book', game: b.id, level: 0, ageGroup: set.age, completed: true, rounds: b.pages.length });
      if (l && progress.markBookRead(l.id, b.id)) { addCoins(COIN_RULES.book); audio.play('coin'); return true; }
      return false;
    },
    onClose: () => {}
  });
  const audioPanel = createAudioPanel({
    vm: audioVm,
    close: () => { audioPanel.close(); },
    action(kind, arg) {
      if (kind === 'mute') toggleSound();
      else if (kind === 'narrator') { applySetting('narrator', Object.assign({}, set.narrator, { enabled: !!arg })); }
      else if (kind === 'slider') {
        const k = arg.key, v = arg.value;
        if (k === 'musicVolume' || k === 'effectsVolume') applySetting(k, v);
        else applySetting('narrator', Object.assign({}, set.narrator, { volume: k === 'nVolume' ? v : set.narrator.volume, rate: k === 'nRate' ? v : set.narrator.rate, pitch: k === 'nPitch' ? v : set.narrator.pitch }));
      } else if (kind === 'voice') {
        applySetting('narrator', Object.assign({}, set.narrator, { voiceUri: Object.assign({}, set.narrator.voiceUri, { [arg.lang]: arg.uri }) }));
      } else if (kind === 'preview') {
        if (arg.uri) { const prev = set.narrator.voiceUri[arg.lang]; speech.configure({ voiceUri: { [arg.lang]: arg.uri } }); speech.preview(arg.lang); speech.configure({ voiceUri: { [arg.lang]: prev || null } }); } else speech.preview(arg.lang);
      }
    }
  });
  function audioVm() {
    return {
      lang: set.lang, sound: set.sound, musicVolume: set.musicVolume, effectsVolume: set.effectsVolume, narrator: set.narrator, supported: speech.supported,
      status: { ms: speech.status('ms'), en: speech.status('en') }, voices: { ms: speech.voices('ms'), en: speech.voices('en') }
    };
  }
  // what the mini-games and the Quran-learning screens may use from the game
  const host = {
    lang: () => set.lang, age: () => set.age, iconSvg, audio, reduced, soundOn: () => set.sound, toggleSound, config, narrate: (text, opts) => speech.speak(text, set.lang, opts), stopNarration: () => speech.stop(),
    narratorStatus: () => speech.status(set.lang),
    record: (a) => { ensureSession(); return progress.recordActivity(Object.assign({ ageGroup: set.age }, a)); },
    activitySummary: () => { const l = learner(); return l ? progress.activitySummary(l.id) : { total: 0, completed: 0, games: {} }; },
    reward(id) {
      ensureSession();
      const l = learner();
      const r = l ? progress.grantReward(l.id, id) : { ok: false };
      const def = config.rewards[id];
      return { ok: r.ok, isNew: r.isNew, name: def ? tr(def.name, set.lang) : '', icon: def ? iconSvg(def.icon, 'toast-svg') : '' };
    },
    toast, G
  };
  const arcade = createArcade(Object.assign({}, host, {
    back: () => leaveHub(), home: () => { go(S.MAIN_MENU); }, play: (id) => startGame(id, { from: S.ARCADE }), leave: () => leaveGame(),
    islamic: () => openIslamic(S.ARCADE)
  }));
  const islamic = createIslamic(Object.assign({}, host, { back: () => leaveHub(), home: () => { go(S.MAIN_MENU); }, trace: () => startGame('trace', { from: S.ISLAMIC, level: 'ar' }) }));

  // ---------------------------------------------------------------- input
  const KEYMAP = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
  window.addEventListener('keydown', (e) => {
    audio.unlock();
    if (dialogOpen() || audioPanel.isOpen || minimap.isOpen || townUI.isOpen || (e.target.closest && e.target.closest('input, textarea, select'))) return;
    const dir = KEYMAP[e.code];
    if (state === S.PLAYROOM && dir) { keys[dir] = true; e.preventDefault(); return; }
    if (state === S.PLAYROOM && (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space')) { if (!e.target.closest('button') || e.target.closest('.interact')) { e.preventDefault(); interact(); } return; }
    if (e.code === 'Escape') {
      if (state === S.PLAYROOM) { e.preventDefault(); openPause(); }
      else if (state === S.PAUSED) { e.preventDefault(); pause.close(); go(S.PLAYROOM); }
      else if (state === S.REWARD_COLLECTION) { e.preventDefault(); go(returnTo && ALLOWED.REWARD_COLLECTION.includes(returnTo) ? returnTo : S.MAIN_MENU); }
      else if (state === S.WORLD_SELECT) { e.preventDefault(); go(returnTo && ALLOWED.WORLD_SELECT.includes(returnTo) ? returnTo : S.MAIN_MENU); }
    }
    if (e.code === 'KeyM' && state !== S.TEACHER_AREA) toggleSound();
  });
  window.addEventListener('keyup', (e) => { const dir = KEYMAP[e.code]; if (dir) keys[dir] = false; });
  window.addEventListener('blur', () => { Object.keys(keys).forEach((k) => { keys[k] = false; pad[k] = false; }); });
  document.addEventListener('pointerdown', () => audio.unlock(), { capture: true });
  if (has3D) {
    const canvas = world.renderer.domElement;
    canvas.addEventListener('pointerdown', (e) => {
      if (state !== S.PLAYROOM || !config.movementSettings.tapToWalk) return;
      if (world.ride && (world.ride.kind === 'bus' || world.ride.kind === 'train' || world.ride.kind === 'coaster')) return;           // these drive themselves
      const hit = world.pick(e.clientX, e.clientY);
      if (!hit) return;
      if (hit.type === 'station') {
        const near = world.nearStation(config.movementSettings.interactDistance);
        if (near === hit.index) { openQuiz(hit.index); return; }
        const p = world.approachPoint(hit.index);
        world.walkTo(p.x, p.z, () => { if (state === S.PLAYROOM && world.nearStation(config.movementSettings.interactDistance + 0.4) === hit.index && progress.canPlayStation(run(), hit.index)) openQuiz(hit.index); });
      } else if (hit.type === 'poi') {
        const near = world.nearPoi(config.movementSettings.interactDistance + 0.5);
        if (near && near.id === hit.id) { doPoi(near); return; }
        const a = world.poiApproach(hit.id);
        world.walkTo(a.x, a.z, (arrived) => { if (arrived && state === S.PLAYROOM) { const n = world.nearPoi(config.movementSettings.interactDistance + 0.6); if (n && n.id === hit.id) doPoi(n); } });
      } else world.walkTo(hit.x, hit.z);
    });
    world.onCoin((n) => { if (state !== S.PLAYROOM) return; addCoins(n * COIN_RULES.pickup); audio.play('coin'); });
    world.onRide((ev, info, kind) => {
      if (state !== S.PLAYROOM) return;
      if (ev === 'board') say(t(kind === 'train' ? 'trainBoard' : kind === 'coaster' ? 'coasterBoard' : 'busBoard'), 6000);
      else if (ev === 'off') say(t(info === 'coaster' ? 'coasterDone' : 'rideOff'), 2500);
    });
    // walking into a new area: a banner with its name, the right music, and (once) its name spoken
    let townBannerAt = -99;
    world.onZoneChange((zone) => {
      if (state !== S.PLAYROOM) return;
      syncScene();
      // ordinary town streets change often when driving: their banner shows at most every 12 s (landmarks always)
      const plain = zone.id.startsWith('city-') && !landmarkById[zone.id.slice(5)];
      if (plain && clock - townBannerAt < 12) return;
      if (plain) townBannerAt = clock;
      hud.zoneBanner(iconSvg(zone.icon, '', null, true), tr(zone.name, set.lang), zone.color);
      if (!cur.zoneSpoken[zone.id]) { cur.zoneSpoken[zone.id] = true; speech.speak(tr(zone.name, set.lang), set.lang, { kind: 'ui', queue: false }); }
    });
  }
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', applyMotion);

  // ---------------------------------------------------------------- start
  applyMotion();
  applyAudio();
  if (has3D) { world.setCameraPreset(set.camera); world.setQuality(set.quality); }
  document.documentElement.lang = set.lang;

  return {
    start() {
      if (!has3D) {
        state = S.BOOT;
        nogl.render({ title: config.gameTitle, subtitle: tr(config.subtitle, set.lang), mascotSvg: mascotSvg() });
        show($('#nogl'), true);
        document.body.dataset.state = 'NO_WEBGL';
        state = S.MAIN_MENU;
        return;
      }
      refreshAppearance();
      go(S.MAIN_MENU);
      // dress the room behind the menu with the last (or first) world
      const w = config.worldById[set.lastWorld] || config.worldById.adventure || config.worlds[0];
      if (w) safe(async () => { await applyTheme(w); world.setStationStates(['locked', 'locked', 'locked', 'locked'], -1); await tryResume(); });
    },
    /** true while a lesson or game is on screen (the browser asks before leaving the page) */
    isBusy() { return state === S.PLAYROOM || state === S.QUIZ || state === S.PAUSED || state === S.STATION_COMPLETE || state === S.ARCADE || state === S.MINIGAME || state === S.ISLAMIC; },
    /** the Back button / gesture of the device: same as the Escape key */
    back() { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape' })); },
    saveNow() { saveResume(true); },
    update,
    get state() { return state; },
    debug() {
      const r = run();
      return {
        state, lang: set.lang, age: set.age, settings: Object.assign({}, set), worldId: cur.worldId, tutorial: cur.tutorial,
        run: r ? JSON.parse(JSON.stringify(r)) : null,
        quiz: cur.quiz ? { index: cur.quiz.index, id: cur.quiz.q.id, answer: cur.quiz.q.answer, order: cur.quiz.order.slice(), solved: cur.quiz.solved } : null,
        learner: learner() ? JSON.parse(JSON.stringify(learner())) : null,
        session: progress.session() ? JSON.parse(JSON.stringify(progress.session())) : null,
        audio: { state: audio.state, available: audio.available, music: audio.musicPlaying, scene: audio.scene, song: audio.song },
        narrator: { settings: speech.settings, muted: speech.muted, history: speech.history.slice(-8), statusMs: speech.status('ms'), statusEn: speech.status('en') },
        arcade: arcade.debug(), islamic: islamic.debug(), lock: kid.stats, resume: progress.settings().resume || null,
        stationStates: stationStates(r)
      };
    },
    store: () => JSON.parse(JSON.stringify(progress.data)),
    arcade: () => arcade, islamic: () => islamic, minimap: () => minimap, audioPanel: () => audioPanel,
    getLang
  };
}
