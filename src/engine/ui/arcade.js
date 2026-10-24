// The Mini-Game Arcade: the hub with ten game cards, and the shared frame every game is played in.
// The frame gives each game the same controls (Back, Home, Help, Restart, Sound), the level for the child's age,
// round progress, a gentle celebration, a sticker the first time, and a record for the teacher (never a penalty).
import { $, esc, show } from './dom.js';
import { G } from './glyphs.js';
import { t } from '../i18n.js';
import { choiceLabel } from '../core/labels.js';
import { GAMES, gameById } from '../minigames/index.js';
import { levelFor } from '../minigames/logic.js';

export function createArcade(host) {
  const hubEl = $('#arcade'), gameEl = $('#minigame');
  const L = (o) => (o ? o[host.lang()] || o.ms || '' : '');
  const seenHelp = new Set();
  let cur = null;
  let seed;                                   // tests may fix the random seed through debug hooks

  // ---------------------------------------------------------------- hub
  function renderHub() {
    const sum = host.activitySummary();
    const lv = levelFor(host.age());
    hubEl.innerHTML = `<header class="screen-head arc-head">
        <button class="pill-btn" data-act="back" data-testid="arcade-back">${G.back}<span>${esc(t('back'))}</span></button>
        <h2>${G.gamepad}<span>${esc(t('arcadeTitle'))}</span></h2>
        <span class="arc-level">${esc(t('gameLevel', { n: lv }))}</span>
        <button class="icon-btn" data-act="sound" data-testid="arcade-sound" aria-label="${esc(host.soundOn() ? t('soundOn') : t('soundOff'))}">${host.soundOn() ? G.soundOn : G.soundOff}</button>
        <button class="icon-btn" data-act="home" data-testid="arcade-home" aria-label="${esc(t('home'))}">${G.home}</button>
      </header>
      <p class="arc-intro">${esc(t('arcadeIntro'))}</p>
      <div class="arc-grid">${GAMES.map((g) => {
        const s = sum.games['minigame:' + g.id];
        const done = s && s.completed > 0;
        return `<button class="arc-card ${done ? 'done' : ''}" data-play="${g.id}" data-testid="game-${g.id}" style="--gc:${g.color}">
          <span class="arc-pic">${host.iconSvg(g.icon, 'arc-svg')}</span>
          <span class="arc-text"><b>${esc(L(g.title))}</b><small>${esc(L(g.blurb))}</small></span>
          ${done ? `<span class="arc-badge" aria-label="${esc(t('stationDone'))}">${G.star}</span>` : ''}
        </button>`;
      }).join('')}</div>`;
  }
  hubEl.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    host.audio.play('tap');
    if (b.dataset.play) host.play(b.dataset.play);
    else if (b.dataset.act === 'back') host.back();
    else if (b.dataset.act === 'home') host.home();
    else if (b.dataset.act === 'sound') { host.toggleSound(); renderHub(); }
  });

  // ---------------------------------------------------------------- one game
  function frame(def) {
    gameEl.innerHTML = `<div class="mg" style="--gc:${def.color}">
      <header class="mg-head">
        <button class="pill-btn" data-act="leave" data-testid="mg-back">${G.back}<span>${esc(cur.from === 'arcade' ? t('backToArcade') : t('exit'))}</span></button>
        <h2><span class="mg-icon">${host.iconSvg(def.icon, 'mg-svg')}</span><span>${esc(L(def.title))}</span></h2>
        <span class="mg-progress" aria-hidden="true"></span>
        <div class="mg-tools">
          <button class="icon-btn" data-act="help" data-testid="mg-help" aria-label="${esc(t('help'))}">${G.help}</button>
          <button class="icon-btn" data-act="restart" data-testid="mg-restart" aria-label="${esc(t('restart'))}">${G.redo}</button>
          <button class="icon-btn" data-act="sound" data-testid="mg-sound" aria-label="${esc(host.soundOn() ? t('soundOn') : t('soundOff'))}">${host.soundOn() ? G.soundOn : G.soundOff}</button>
          <button class="icon-btn" data-act="home" data-testid="mg-home" aria-label="${esc(t('home'))}">${G.home}</button>
        </div>
      </header>
      <p class="mg-status" role="status" data-testid="mg-status"></p>
      <div class="mg-stage"></div>
      <div class="mg-help" hidden></div>
      <div class="mg-end" hidden></div>
    </div>`;
  }
  const part = (sel) => gameEl.querySelector(sel);
  function makeCtx() {
    const timers = new Set();
    const ctx = {
      stage: part('.mg-stage'), lang: host.lang(), level: cur.level, mode: cur.mode, reduced: host.reduced(), seed,
      L, icon: (k, cls) => host.iconSvg(k, cls), fx: (n) => host.audio.play(n), note: (m, k) => host.audio.note(m, k), audioOk: () => host.audio.available && host.soundOn(),
      label: (k) => { try { const s = choiceLabel(k, host.lang(), host.config.answerChoices); return s && !s.includes(':') ? s : ''; } catch (e) { return ''; } },
      say: (text) => host.narrate(text, { kind: 'help' }),
      status(text, tone = '') { const p = part('.mg-status'); if (p) { p.textContent = text; p.className = 'mg-status ' + tone; } },
      round(i, n) { cur.rounds = Math.max(cur.rounds, i); const p = part('.mg-progress'); if (p) p.innerHTML = n ? Array.from({ length: n }, (_, k) => `<i class="${k < i ? 'on' : ''}">${k < i ? G.star : G.starOutline}</i>`).join('') : ''; },
      good() { cur.correct++; }, bad() { cur.mistakes++; },
      later(fn, ms) { const id = setTimeout(() => { timers.delete(id); if (cur && cur.ctx === ctx) fn(); }, ms); timers.add(id); return id; },
      clearTimers() { timers.forEach(clearTimeout); timers.clear(); },
      win: () => finish(ctx)
    };
    return ctx;
  }
  function mount() {
    if (cur.inst) { try { cur.inst.destroy(); } catch (e) { /* ignore */ } }
    if (cur.ctx) cur.ctx.clearTimers();
    part('.mg-stage').innerHTML = '';
    part('.mg-end').hidden = true;
    cur.ctx = makeCtx();
    cur.inst = cur.def.create(cur.ctx);
  }
  function showHelp(on) {
    const h = part('.mg-help');
    if (!h) return;
    if (!on) { h.hidden = true; h.innerHTML = ''; host.stopNarration(); return; }
    h.innerHTML = `<div class="mg-help-card" role="dialog" aria-modal="true" aria-labelledby="mg-help-title">
      <span class="mg-help-pic">${host.iconSvg(cur.def.icon, 'mg-svg')}</span>
      <h3 id="mg-help-title">${esc(t('howToPlay'))}</h3>
      <p>${esc(L(cur.def.how))}</p>
      <div class="mg-help-btns">
        <button class="pill-btn" data-act="hear" data-testid="mg-hear">${G.speaker}<span>${esc(t('replayHelp'))}</span></button>
        <button class="btn btn-play" data-act="go" data-testid="mg-go">${G.play}<span>${esc(t('play'))}</span></button>
      </div></div>`;
    h.hidden = false;
    host.narrate(L(cur.def.how), { kind: 'help' });
    setTimeout(() => { const b = h.querySelector('[data-act="go"]'); if (b) b.focus(); }, 30);
  }
  function finish(ctx) {
    if (!cur || cur.ctx !== ctx || cur.finished) return;
    cur.finished = true;
    const r = cur.def.sticker ? host.reward(cur.def.sticker) : null;
    host.record({ kind: 'minigame', game: cur.def.id, level: cur.level, startedAt: cur.startedAt, completed: true, rounds: cur.rounds, correct: cur.correct, mistakes: cur.mistakes, sticker: r && r.isNew ? cur.def.sticker : '' });
    cur.recorded = true;
    host.audio.play('win');
    host.narrate(t('gameDone'), { kind: 'praise' });
    const end = part('.mg-end');
    end.innerHTML = `<div class="mg-end-card" role="dialog" aria-modal="true" aria-labelledby="mg-end-title">
      <div class="mg-end-stars">${G.star}${G.star}${G.star}</div>
      <h3 id="mg-end-title">${esc(t('gameDone'))}</h3>
      ${r && r.isNew ? `<p class="mg-sticker"><span>${r.icon}</span>${esc(t('gameStickerNew', { name: r.name }))}</p>` : ''}
      <div class="mg-help-btns">
        <button class="btn btn-play" data-act="again" data-testid="mg-again">${G.redo}<span>${esc(t('playAgain'))}</span></button>
        <button class="btn btn-sky" data-act="leave" data-testid="mg-leave">${G.back}<span>${esc(cur.from === 'arcade' ? t('backToArcade') : t('exit'))}</span></button>
      </div></div>`;
    end.hidden = false;
    setTimeout(() => { const b = end.querySelector('[data-act="again"]'); if (b) b.focus(); }, 40);
  }
  function restart() {
    if (!cur) return;
    recordPartial();
    Object.assign(cur, { startedAt: Date.now(), correct: 0, mistakes: 0, rounds: 0, finished: false, recorded: false });
    mount();
  }
  // a game left before the end still counts as "played" for the teacher (completed: no)
  function recordPartial() {
    if (cur && !cur.recorded && !cur.finished && (cur.correct || cur.mistakes || cur.rounds)) {
      host.record({ kind: 'minigame', game: cur.def.id, level: cur.level, startedAt: cur.startedAt, completed: false, rounds: cur.rounds, correct: cur.correct, mistakes: cur.mistakes });
      cur.recorded = true;
    }
  }
  gameEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || !cur) return;
    const act = b.dataset.act;
    if (act === 'leave') { host.audio.play('tap'); host.leave(); }
    else if (act === 'home') { host.audio.play('tap'); host.home(); }
    else if (act === 'help') showHelp(true);
    else if (act === 'go') { host.audio.play('tap'); showHelp(false); }
    else if (act === 'hear') host.narrate(L(cur.def.how), { kind: 'help', force: true });
    else if (act === 'restart' || act === 'again') { host.audio.play('tap'); restart(); }
    else if (act === 'sound') { host.toggleSound(); b.innerHTML = host.soundOn() ? G.soundOn : G.soundOff; }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!gameEl.hidden && cur) { e.preventDefault(); if (!part('.mg-help').hidden) showHelp(false); else host.leave(); }
    else if (!hubEl.hidden) { e.preventDefault(); host.back(); }
  });

  return {
    showHub(on) { if (on) { renderHub(); show(hubEl, true); setTimeout(() => { const b = hubEl.querySelector('.arc-card'); if (b) b.focus(); }, 30); } else { show(hubEl, false); hubEl.innerHTML = ''; } },
    openGame(id, opts = {}) {
      const def = gameById[id];
      if (!def) return false;
      cur = { def, from: opts.from || 'arcade', level: levelFor(host.age()), mode: typeof opts.level === 'string' ? opts.level : opts.mode || null, startedAt: Date.now(), correct: 0, mistakes: 0, rounds: 0, finished: false, recorded: false };
      frame(def);
      show(gameEl, true);
      mount();
      if (!seenHelp.has(id)) { seenHelp.add(id); showHelp(true); }
      return true;
    },
    closeGame() {
      if (!cur) { show(gameEl, false); return; }
      recordPartial();
      host.stopNarration();
      if (cur.ctx) cur.ctx.clearTimers();
      try { if (cur.inst) cur.inst.destroy(); } catch (e) { /* ignore */ }
      cur = null;
      show(gameEl, false); gameEl.innerHTML = '';
    },
    games: GAMES,
    setSeed(s) { seed = s; },
    skipHelp() { GAMES.forEach((g) => seenHelp.add(g.id)); },
    debug() {
      return {
        hub: !hubEl.hidden, game: cur ? { id: cur.def.id, level: cur.level, mode: cur.mode, correct: cur.correct, mistakes: cur.mistakes, rounds: cur.rounds, finished: cur.finished, helpOpen: !part('.mg-help').hidden, endOpen: !part('.mg-end').hidden } : null,
        inst: cur && cur.inst && cur.inst.debug ? cur.inst.debug() : null
      };
    }
  };
}
