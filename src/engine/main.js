// Start-up: validate the teacher config, build the 3D room (or card mode), then run one render loop.
import { validateConfig } from './core/validate.js';
import { isIconKey, iconSVG, SVG_DEFS } from './art/icons.js';
import { createProgress } from './core/progress.js';
import { createAudio } from './audio.js';
import { createStorage, report, installGlobalHandlers, errorLog } from './system.js';
import { createNarrator } from './narrator.js';
import { createKidLock } from './kidlock.js';
import { initPwa } from './pwa.js';
import { createGame } from './game.js';
import { webglAvailable, createWorld3D } from './world/world3d.js';
import { t, setLang, getLang, addStrings } from './i18n.js';
import { initOverlays, loaderStep, toast } from './ui/overlays.js';
import { RAINBOW_DEF } from './ui/thumbs.js';
import { show } from './ui/dom.js';

const VERSION = '2.1.0';
const perf = { on: false, update: 0, render: 0, frame: 16 };

async function boot() {
  installGlobalHandlers();
  document.getElementById('ag-defs').innerHTML = `<defs>${SVG_DEFS}${RAINBOW_DEF}</defs>`;
  const validation = validateConfig(window.AMMARA_CONFIG, { isIconKey });
  const { config, errors } = validation;
  if (config.uiText) addStrings(config.uiText);
  errors.forEach((e) => report('CONFIG_' + e.code, e.message, null, 'warn'));
  document.title = config.gameTitle;

  const storage = createStorage('ammaragames.v1');
  const progress = createProgress({ config, load: storage.load, save: config.progressSettings.saveProgressOnThisComputer ? storage.save : null });
  setLang(progress.settings().lang && config.availableLanguages.includes(progress.settings().lang) ? progress.settings().lang : config.defaultLanguage);
  const steps = t('loadSteps');
  document.getElementById('loader-title').textContent = config.gameTitle;
  loaderStep(0, steps);
  // Fredoka for the interface and Noto Naskh Arabic for Hijaiyah letters / Quran text (both embedded in this file)
  try { await Promise.all([document.fonts.load('700 40px Fredoka'), document.fonts.load('500 40px "AG Naskh"', 'ابت'), document.fonts.load('700 40px "AG Naskh"', 'ابت')]); await document.fonts.ready; } catch (e) { /* system font is used */ }

  const audio = createAudio({}, (e) => { report('AUDIO_UNAVAILABLE', e.message, e, 'warn'); toast(t('audioWarn'), { tone: 'warn', ms: 5000 }); });
  // the narrator ducks the music while it speaks
  const speech = createNarrator({ initial: progress.settings().narrator, onSpeaking: (on) => audio.setVoiceDuck(on) });
  initOverlays(audio);
  const iconSvg = (key, cls = 'ag-icon', custom = null, standalone = false) => iconSVG(key, { cls, custom, standalone, fx: !standalone && !document.body.classList.contains('lite-fx') });

  // keeps small fingers from leaving the game by accident (full screen, ghost touches, refresh, Back button)
  let game = null;
  const kid = createKidLock({ enabled: progress.settings().kidLock !== false, onBack: () => game && game.back(), shouldWarn: () => !!game && game.isBusy() });
  initPwa();

  let world = null;
  const canvas = document.getElementById('scene');
  if (webglAvailable()) {
    try {
      const st = progress.settings();
      world = await createWorld3D({
        canvas, config, quality: st.quality || 'auto', lang: getLang(), iconSvg: (k) => iconSvg(k, '', null, true),
        appearance: { hairStyle: config.character.hairStyle, hairColor: config.character.hairColor, hijabColor: config.character.hijabColor, skinTone: config.character.skinTone,
          eyeColor: config.character.eyeColor, shoeColor: config.character.shoeColor, outfitColor: config.rewards[config.character.outfit] ? config.rewards[config.character.outfit].color : '#ff8fc0', accessories: {} },
        onStep: (i) => loaderStep(i, steps)
      });
    } catch (e) {
      report('WEBGL_FAILED', '3D could not start: ' + e.message, e);
      world = null;
    }
  } else {
    report('WEBGL_UNAVAILABLE', 'WebGL is not available in this browser.', null, 'warn');
  }
  if (!world) { canvas.style.display = 'none'; document.body.classList.add('no-webgl'); }

  game = createGame({ config, validation, world, progress, audio, speech, storageOk: storage.available, iconSvg, version: VERSION, kid });

  if (world) {
    let last = performance.now();
    const t0 = last;
    let frameErrors = 0;
    perf.on = true;
    const frame = (now) => {
      const rawDt = Math.max(0, (now - last) / 1000);
      const dt = Math.min(0.05, rawDt);
      last = now;
      try {
        const a = performance.now();
        game.update(dt);
        world.update(dt, (now - t0) / 1000, rawDt);
        const m = performance.now();
        world.render();
        const z = performance.now();
        perf.update = perf.update * 0.95 + (m - a) * 0.05;
        perf.render = perf.render * 0.95 + (z - m) * 0.05;
        perf.frame = perf.frame * 0.95 + dt * 1000 * 0.05;
      } catch (e) {
        if (frameErrors++ < 5) report('FRAME_ERROR', e.message, e);
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    let rt = 0;
    window.addEventListener('resize', () => { cancelAnimationFrame(rt); rt = requestAnimationFrame(() => world.resize()); });
    world.resize();
  }

  show(document.getElementById('loader'), false);
  game.start();
  if (!storage.available) toast(t('storageWarn'), { tone: 'warn', ms: 6500 });
  if (errors.length) toast(t('configWarn', { n: errors.length }), { tone: 'warn', ms: 6500 });

  // Read-only probes for automated tests and teachers' troubleshooting.
  window.AmmaraDebug = Object.freeze({
    version: VERSION,
    state: () => game.state,
    game: () => game.debug(),
    store: () => game.store(),
    player: () => (world ? world.player() : null),
    teleport: (x, z) => { if (world) world.teleport(x, z); },          // moves the child (QA only)
    stations: () => (world ? world.stationPositions() : []),
    world: () => (world ? world.debug() : null),
    breakdown: () => (world ? world.breakdown() : null),
    toScreen: (x, y, z) => (world ? world.toScreen(x, y, z) : null),
    errors: () => errorLog(),
    lock: () => kid.stats,
    perf: () => ({ updateMs: +perf.update.toFixed(2), renderMs: +perf.render.toFixed(2), frameMs: +perf.frame.toFixed(2) }),
    validation: () => ({ stats: validation.stats, errors: validation.errors.length, warnings: validation.warnings.length })
  });
}

boot().catch((e) => {
  report('BOOT_FAILED', e.message, e);
  const txt = document.getElementById('loader-text');
  if (txt) txt.textContent = 'Maaf, permainan tidak dapat dimulakan. / Sorry, the game could not start. ' + e.message;
});
