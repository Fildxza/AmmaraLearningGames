// Child-facing screens. Each render function receives a plain view-model from the game.
import { $, $$, esc, show, delegate } from './dom.js';
import { G } from './glyphs.js';
import { t } from '../i18n.js';

const TITLE_COLORS = ['#ff6f9f', '#ff9a3c', '#f5b400', '#3fbf6a', '#3d8bfd', '#9b6bff'];

export function logoHTML(title, subtitle, mascotSvg) {
  const letters = Array.from(title).map((ch, i) =>
    `<span class="lt" style="--c:${TITLE_COLORS[i % TITLE_COLORS.length]};--i:${i}">${esc(ch)}</span>`).join('');
  return `<div class="logo">
    <div class="logo-mascot">${mascotSvg}</div>
    <h1 class="logo-title" style="--n:${Math.max(6, Array.from(title).length)}" aria-label="${esc(title)}">${letters}</h1>
    <p class="logo-sub"><span>${esc(subtitle)}</span></p>
  </div>`;
}

function segmented(name, items, current, action) {
  return `<div class="seg" role="group" aria-label="${esc(name)}">${items.map((it) =>
    `<button class="seg-btn ${it.id === current ? 'on' : ''}" data-action="${action}" data-arg="${esc(it.id)}" aria-pressed="${it.id === current}">${it.icon || ''}<span>${esc(it.label)}</span></button>`).join('')}</div>`;
}

// ---- main menu -------------------------------------------------------------------
export function createMenu(actions) {
  const root = $('#menu');
  delegate(root, actions);
  return {
    render(vm) {
      root.innerHTML = `<div class="menu-card">
          ${logoHTML(vm.title, vm.subtitle, vm.mascotSvg)}
          <p class="welcome">${esc(t('welcome'))}</p>
          <button class="btn btn-play" data-action="play" data-testid="menu-play">${G.play}<span>${esc(vm.hasProgress ? t('continuePlay') : t('play'))}</span></button>
          <div class="menu-row">
            <button class="btn btn-sky" data-action="worlds" data-testid="menu-worlds">${G.globe}<span>${esc(t('worlds'))}</span></button>
            <button class="btn btn-mint" data-action="collection" data-testid="menu-collection">${G.sticker}<span>${esc(t('collection'))}</span></button>
          </div>
          <div class="menu-row">
            <button class="btn btn-lav" data-action="arcade" data-testid="menu-arcade">${G.gamepad}<span>${esc(t('arcadeTitle'))}</span></button>
            <button class="btn btn-peach" data-action="islamic" data-testid="menu-islamic">${G.moon}<span>${esc(t('islamicTitle'))}</span></button>
          </div>
          <div class="menu-opts">
            <div class="opt"><span class="opt-label">${esc(t('age'))}</span>${segmented(t('age'), vm.ages, vm.age, 'age')}</div>
            <div class="opt"><span class="opt-label">${esc(t('language'))}</span>${segmented(t('language'), vm.langs, vm.lang, 'lang')}</div>
          </div>
        </div>
        <div class="menu-corner">
          <button class="pill-btn" data-action="sound" data-testid="menu-sound" aria-pressed="${vm.soundOn}" aria-label="${esc(vm.soundOn ? t('soundOn') : t('soundOff'))}">${vm.soundOn ? G.soundOn : G.soundOff}</button>
          <button class="pill-btn" data-action="audio" data-testid="menu-audio" aria-label="${esc(t('audioTitle'))}">${G.voice}</button>
          <button class="pill-btn wide" data-action="teacher" data-testid="menu-teacher">${G.teacher}<span>${esc(t('teacher'))}</span></button>
        </div>
        ${vm.learnerName ? `<div class="player-chip">${G.user}<span>${esc(t('playingAs'))}: <b>${esc(vm.learnerName)}</b></span></div>` : ''}`;
    },
    show: (on) => show(root, on)
  };
}

// ---- world select ----------------------------------------------------------------------
export function createWorlds(actions) {
  const root = $('#worlds');
  delegate(root, actions);
  return {
    render(vm) {
      const card = (w) => `<button class="world-card ${w.featured ? 'featured' : ''}" data-action="pickWorld" data-arg="${esc(w.id)}" data-testid="world-${esc(w.id)}" style="--wc:${w.color}">
          <span class="wc-icon">${w.icon}</span>
          <span class="wc-text"><span class="wc-name">${esc(w.name)}</span><span class="wc-blurb">${esc(w.blurb)}</span>
          <span class="wc-progress" aria-label="${esc(t('stationsDone', { n: w.done }))}">${[0, 1, 2, 3].map((i) => `<i class="${i < w.done ? 'on' : ''}">${i < w.done ? G.star : G.starOutline}</i>`).join('')}</span></span>
          ${w.featured ? `<span class="wc-ribbon">${esc(t('featured'))}</span>` : ''}
        </button>`;
      root.innerHTML = `<header class="screen-head">
          <button class="pill-btn" data-action="back" data-testid="worlds-back" aria-label="${esc(t('back'))}">${G.back}<span>${esc(t('back'))}</span></button>
          <h2>${esc(t('worlds'))}</h2>
          <div class="head-opt">${segmented(t('age'), vm.ages, vm.age, 'age')}</div>
        </header>
        <div class="world-grid">${vm.worlds.map(card).join('')}</div>`;
    },
    show: (on) => show(root, on)
  };
}

// ---- in-game HUD ----------------------------------------------------------------------
export function createHud(actions, onDir) {
  const root = $('#hud');
  delegate(root, actions);
  root.innerHTML = `
    <div class="hud-top">
      <div class="chip learner-chip" data-testid="hud-learner">${G.user}<span class="ln"></span><span class="sep"></span>${G.star}<b class="stars">0</b></div>
      <div class="station-dots" aria-label="${esc(t('station'))}"></div>
      <div class="hud-actions">
        <button class="icon-btn" data-action="sound" data-testid="hud-sound"></button>
        <button class="icon-btn" data-action="music" data-testid="hud-music"></button>
        <button class="icon-btn" data-action="audio" data-testid="hud-audio" aria-label="${esc(t('audioBtn'))}">${G.voice}</button>
        <button class="icon-btn map-open" data-action="map" data-testid="hud-map-btn" aria-label="${esc(t('map'))}">${G.map}</button>
        <button class="icon-btn" data-action="wardrobe" data-testid="hud-wardrobe">${G.hanger}</button>
        <button class="icon-btn" data-action="pause" data-testid="hud-pause" aria-label="${esc(t('pause'))}">${G.pause}</button>
        <button class="pill-btn finish-btn" data-action="finish" data-testid="hud-finish">${G.flag}<span>${esc(t('finishEarly'))}</span></button>
      </div>
    </div>
    <button class="minimap" data-action="map" data-testid="hud-minimap" aria-label="${esc(t('map'))}"><canvas width="240" height="88"></canvas></button>
    <button class="pill-btn return-btn" data-action="goinside" data-testid="hud-return" hidden>${G.home}<span>${esc(t('returnInside'))}</span></button>
    <div class="zone-banner" role="status" hidden><span class="zb-icon"></span><span class="zb-text"></span></div>
    <div class="hud-hint" role="status"><span class="hint-star">${G.star}</span><span class="hint-text"></span></div>
    <div class="dpad" aria-label="Arrows">
      <button class="dir up" data-dir="up" data-testid="dpad-up" aria-label="Up">${G.up}</button>
      <button class="dir left" data-dir="left" data-testid="dpad-left" aria-label="Left">${G.left}</button>
      <button class="dir right" data-dir="right" data-testid="dpad-right" aria-label="Right">${G.right}</button>
      <button class="dir down" data-dir="down" data-testid="dpad-down" aria-label="Down">${G.down}</button>
    </div>
    <div class="hud-right">
      <button class="pill-btn cam-btn" data-action="camera" data-testid="hud-camera">${G.eye}<span></span></button>
      <button class="interact" data-action="interact" data-testid="hud-interact" hidden>${G.hand}<span>${esc(t('interact'))}</span></button>
    </div>
    <div class="tutorial" hidden></div>`;
  // D-pad: hold to walk. Pointer capture keeps the press even if the finger slides.
  $$('.dir', root).forEach((b) => {
    const dir = b.dataset.dir;
    const up = (e) => { b.classList.remove('held'); onDir(dir, false); if (e && e.pointerId !== undefined && b.hasPointerCapture && b.hasPointerCapture(e.pointerId)) b.releasePointerCapture(e.pointerId); };
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (err) { /* old browsers */ } b.classList.add('held'); onDir(dir, true); });
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('lostpointercapture', () => { b.classList.remove('held'); onDir(dir, false); });
    b.addEventListener('contextmenu', (e) => e.preventDefault());
  });
  const el = {
    ln: $('.ln', root), stars: $('.stars', root), dots: $('.station-dots', root), hint: $('.hud-hint', root), hintText: $('.hint-text', root),
    interact: $('.interact', root), ret: $('.return-btn', root), zb: $('.zone-banner', root), zbIcon: $('.zb-icon', root), zbText: $('.zb-text', root), sound: $('[data-action="sound"]', root), music: $('[data-action="music"]', root), cam: $('.cam-btn span', root), tut: $('.tutorial', root)
  };
  let lastHint = null;
  return {
    show: (on) => show(root, on),
    relabel() {
      $('.finish-btn span', root).textContent = t('finishEarly');
      el.interact.querySelector('span').textContent = t('interact');
      $('[data-action="pause"]', root).setAttribute('aria-label', t('pause'));
      $('[data-action="audio"]', root).setAttribute('aria-label', t('audioBtn'));
      $('.map-open', root).setAttribute('aria-label', t('map'));
      $('.minimap', root).setAttribute('aria-label', t('map'));
      el.ret.querySelector('span').textContent = t('returnInside');
    },
    setLearner(name, stars) { el.ln.textContent = name; el.stars.textContent = String(stars); },
    setDots(states) {
      el.dots.innerHTML = states.map((s, i) => `<span class="sdot ${s}" title="${esc(t('quizStation', { n: i + 1 }))}">${s === 'done' ? G.check : `<b>${i + 1}</b>`}</span>`).join('');
    },
    setHint(text, kind = 'info') {
      const key = text + kind;
      if (key === lastHint) return;
      lastHint = key;
      el.hint.className = `hud-hint ${kind} ${text ? 'on' : ''}`;
      el.hintText.textContent = text || '';
    },
    setInteract(visible, label) {
      const span = el.interact.querySelector('span');
      const text = label || t('interact');
      if (span.textContent !== text) span.textContent = text;
      if (el.interact.hidden === !visible) return;
      el.interact.hidden = !visible; el.interact.classList.toggle('pulse', visible);
    },
    setReturn(visible) { if (el.ret.hidden === !visible) return; el.ret.hidden = !visible; },
    /** A short banner when the child walks into a new area. */
    zoneBanner(iconSvg, name, color) {
      el.zbIcon.innerHTML = iconSvg || '';
      el.zbText.textContent = name;
      el.zb.style.setProperty('--zc', color || '#ff8fc0');
      el.zb.hidden = false;
      el.zb.classList.remove('on'); void el.zb.offsetWidth; el.zb.classList.add('on');
      clearTimeout(el.zbT); el.zbT = setTimeout(() => { el.zb.classList.remove('on'); setTimeout(() => { if (!el.zb.classList.contains('on')) el.zb.hidden = true; }, 400); }, 2600);
    },
    setSound(on) { el.sound.innerHTML = on ? G.soundOn : G.soundOff; el.sound.setAttribute('aria-label', on ? t('soundOn') : t('soundOff')); el.sound.setAttribute('aria-pressed', String(on)); },
    setMusic(on, available) { el.music.innerHTML = on ? G.music : G.musicOff; el.music.setAttribute('aria-label', t('music')); el.music.setAttribute('aria-pressed', String(on)); el.music.disabled = !available; },
    setCamera(label) { el.cam.textContent = label; },
    tutorial(step, text, onSkip) {
      if (!step) { el.tut.hidden = true; el.tut.innerHTML = ''; root.dataset.tut = ''; return; }
      root.dataset.tut = step;
      el.tut.hidden = false;
      el.tut.innerHTML = `<div class="tut-bubble"><span class="tut-icon">${step === 'move' ? G.up : step === 'follow' ? G.star : G.hand}</span><span>${esc(text)}</span>
        <button class="pill-btn small" data-testid="tut-skip">${esc(t('skip'))}</button></div>`;
      el.tut.querySelector('button').onclick = onSkip;
    }
  };
}

// ---- pause ---------------------------------------------------------------------------
export function createPause(actions) {
  const root = $('#pause');
  delegate(root, actions);
  return {
    open(vm) {
      root.innerHTML = `<div class="dialog-card pause-card" role="dialog" aria-modal="true" aria-labelledby="pause-title">
        <h2 id="pause-title">${esc(t('paused'))}</h2>
        <button class="btn btn-play" data-action="resume" data-testid="pause-resume">${G.play}<span>${esc(t('resume'))}</span></button>
        <div class="pause-grid">
          <button class="btn btn-sky" data-action="worlds">${G.globe}<span>${esc(t('chooseWorld'))}</span></button>
          <button class="btn btn-mint" data-action="collection">${G.sticker}<span>${esc(t('collection'))}</span></button>
          <button class="btn btn-sky" data-action="audio" data-testid="pause-audio">${G.voice}<span>${esc(t('audioTitle'))}</span></button>
          <button class="btn btn-lav" data-action="home" data-testid="pause-home">${G.home}<span>${esc(t('backToMenu'))}</span></button>
          <button class="btn btn-peach" data-action="finish" data-testid="pause-finish">${G.flag}<span>${esc(t('finishEarly'))}</span></button>
        </div>
        <div class="pause-toggles">
          <button class="pill-btn" data-action="sound" aria-pressed="${vm.soundOn}">${vm.soundOn ? G.soundOn : G.soundOff}<span>${esc(vm.soundOn ? t('soundOn') : t('soundOff'))}</span></button>
          <button class="pill-btn" data-action="music" aria-pressed="${vm.musicOn}">${vm.musicOn ? G.music : G.musicOff}<span>${esc(t('music'))}</span></button>
        </div></div>`;
      show(root, true);
      setTimeout(() => { const b = root.querySelector('[data-action="resume"]'); if (b) b.focus(); }, 30);
    },
    close() { show(root, false); root.innerHTML = ''; },
    get isOpen() { return !root.hidden; }
  };
}

// ---- session complete ----------------------------------------------------------------------
export function createComplete(actions) {
  const root = $('#complete');
  delegate(root, actions);
  return {
    render(vm) {
      root.innerHTML = `<div class="complete-card">
        <div class="complete-mascot">${vm.mascotSvg}</div>
        <h2 class="complete-title">${esc(vm.title)}</h2>
        <p class="complete-text">${esc(vm.text)}</p>
        <div class="star-row" aria-label="${esc(String(vm.starsEarned))} ${esc(t('stars'))}">${vm.stars.map((on, i) => `<span class="big-star ${on ? 'on' : ''}" style="--i:${i}">${on ? G.star : G.starOutline}</span>`).join('')}</div>
        ${vm.rewards.length ? `<div class="reward-strip"><span class="rs-label">${esc(t('youEarned'))}</span>${vm.rewards.map((r) => `<span class="reward-chip" title="${esc(r.name)}">${r.svg}<span>${esc(r.name)}</span></span>`).join('')}</div>` : ''}
        ${vm.classMode ? `<p class="class-progress">${esc(vm.progressText)}</p>` : ''}
        <div class="complete-buttons">
          ${vm.nextName ? `<button class="btn btn-play" data-action="nextLearner" data-testid="next-learner">${G.next}<span>${esc(t('nextLearner', { name: vm.nextName }))}</span></button>` : ''}
          ${vm.everyoneDone ? `<p class="everyone">${G.heart}${esc(t('everyoneDone'))}</p><button class="btn btn-sky" data-action="csv" data-testid="complete-csv">${G.download}<span>${esc(t('downloadCsv'))}</span></button>` : ''}
          ${!vm.classMode || vm.everyoneDone ? `<button class="btn ${vm.nextName ? 'btn-sky' : 'btn-play'}" data-action="again" data-testid="play-again">${G.refresh}<span>${esc(t('playAgain'))}</span></button>` : ''}
          <div class="complete-row">
            <button class="btn btn-mint small" data-action="worlds" data-testid="complete-worlds">${G.globe}<span>${esc(t('chooseWorld'))}</span></button>
            <button class="btn btn-lav small" data-action="collection" data-testid="complete-collection">${G.sticker}<span>${esc(t('collection'))}</span></button>
            <button class="btn btn-ghost small" data-action="home" data-testid="complete-home">${G.home}<span>${esc(t('backToMenu'))}</span></button>
            ${vm.classMode ? `<button class="btn btn-ghost small" data-action="teacher" data-testid="complete-teacher">${G.teacher}<span>${esc(t('teacher'))}</span></button>` : ''}
          </div>
        </div></div>`;
    },
    show: (on) => show(root, on)
  };
}

// ---- collection: sticker book and wardrobe -----------------------------------------------------
export function createCollection(actions) {
  const root = $('#collection');
  delegate(root, actions);
  return {
    render(vm) {
      const stickers = `<p class="col-count">${esc(t('stickersCount', { n: vm.stickerOwned, total: vm.stickers.length }))} · ${G.star} ${esc(t('starsTotal', { n: vm.stars }))}</p>
        <div class="sticker-grid">${vm.stickers.map((s) => `<div class="sticker ${s.owned ? 'owned' : 'locked'}" title="${esc(s.owned ? s.name : t('lockedItem'))}">
          <span class="st-pic">${s.svg}${s.owned ? '' : `<span class="st-lock" aria-hidden="true">${G.lock}</span>`}</span><span class="st-name">${esc(s.name)}</span></div>`).join('')}</div>`;
      const slotTabs = vm.slots.map((s) => `<button class="slot-tab ${s.id === vm.slot ? 'on' : ''}" data-action="slot" data-arg="${s.id}" aria-pressed="${s.id === vm.slot}">${s.thumb}<span>${esc(s.label)}</span></button>`).join('');
      const items = vm.items.map((it) => `<button class="item ${it.owned ? '' : 'locked'} ${it.equipped ? 'equipped' : ''}" data-action="${it.owned ? 'equip' : 'locked'}" data-arg="${esc(it.id)}" data-testid="item-${esc(it.id)}" aria-pressed="${it.equipped}" aria-label="${esc(it.owned ? it.name : t('lockedItem'))}">
          <span class="item-pic">${it.thumb}</span><span class="item-name">${esc(it.name)}${it.owned ? '' : `<small>${esc(t('lockedItem'))}</small>`}</span>${it.equipped ? `<span class="item-check">${G.check}</span>` : ''}${it.owned ? '' : `<span class="item-lock">${G.lock}</span>`}</button>`).join('');
      root.innerHTML = `<div class="collection-panel">
        <header class="screen-head">
          <h2>${esc(t('myCollection'))}</h2>
          <button class="btn btn-mint small" data-action="done" data-testid="collection-done">${G.check}<span>${esc(t('done'))}</span></button>
        </header>
        <div class="tabs" role="tablist">
          <button class="tab ${vm.tab === 'stickers' ? 'on' : ''}" role="tab" aria-selected="${vm.tab === 'stickers'}" data-action="tab" data-arg="stickers" data-testid="tab-stickers">${G.sticker}<span>${esc(t('stickerBook'))}</span></button>
          <button class="tab ${vm.tab === 'wardrobe' ? 'on' : ''}" role="tab" aria-selected="${vm.tab === 'wardrobe'}" data-action="tab" data-arg="wardrobe" data-testid="tab-wardrobe">${G.hanger}<span>${esc(t('wardrobe'))}</span></button>
        </div>
        <div class="tab-body">${vm.tab === 'stickers' ? stickers : `<div class="slot-tabs">${slotTabs}</div><div class="item-grid">${items}</div>`}</div>
      </div>`;
    },
    show: (on) => show(root, on)
  };
}

// ---- card mode (no WebGL) ------------------------------------------------------------------
export function createCards(actions) {
  const root = $('#cards');
  delegate(root, actions);
  return {
    render(vm) {
      root.innerHTML = `<header class="screen-head">
          <button class="pill-btn" data-action="home">${G.home}<span>${esc(t('backToMenu'))}</span></button>
          <h2>${esc(vm.worldName)}</h2>
          <button class="icon-btn" data-action="sound">${vm.soundOn ? G.soundOn : G.soundOff}</button>
        </header>
        <p class="cards-hint">${esc(t('tapStation'))}</p>
        <div class="card-board">${vm.stations.map((s, i) => `<button class="station-card ${s.state}" data-action="station" data-arg="${i}" data-testid="card-${i}" style="--sc:${s.color}" ${s.state === 'done' || s.state === 'locked' ? 'aria-disabled="true"' : ''}>
            <span class="sc-num">${i + 1}</span><span class="sc-pic">${s.icon}</span><span class="sc-title">${esc(s.title)}</span>${s.state === 'done' ? `<span class="sc-done">${G.check}</span>` : ''}</button>`).join('')}</div>`;
    },
    show: (on) => show(root, on)
  };
}

export function createNoGL(actions) {
  const root = $('#nogl');
  delegate(root, actions);
  return {
    render(vm) {
      root.innerHTML = `<div class="dialog-card nogl-card">${logoHTML(vm.title, vm.subtitle, vm.mascotSvg)}
        <h2>${esc(t('webglTitle'))}</h2><p>${esc(t('webglText'))}</p>
        <button class="btn btn-play" data-action="cards" data-testid="play-cards">${G.play}<span>${esc(t('playCards'))}</span></button>
        <button class="pill-btn wide" data-action="teacher">${G.teacher}<span>${esc(t('teacher'))}</span></button></div>`;
    },
    show: (on) => show(root, on)
  };
}
