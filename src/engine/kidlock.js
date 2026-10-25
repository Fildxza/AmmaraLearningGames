// "Kid Lock": keeps a small child from leaving the game by accident.
//
//  - full screen (no address bar to touch), re-entered on the next tap if it was left by accident;
//  - ghost-touch filter: touches on the very edge of the screen, palm-sized touches, 4+ fingers at once, and
//    double-fast taps are ignored (palms and sleeves on tablets);
//  - no pinch zoom, no long-press menu, no pull-to-refresh, no refresh / print / save / zoom shortcuts;
//  - the Back button/gesture does not leave the page (it acts like the game's own Back);
//  - a "leave this page?" warning while a lesson is running, and the screen stays awake;
//  - an adult can turn all of it off in Teacher > Settings.
//
// What a web page cannot do: block Alt+F4, Ctrl+W, the operating system's home/recent buttons. For that, use
// Android screen pinning / iPad Guided Access / Windows kiosk mode (see README "Deployment").
// Automated browsers (navigator.webdriver) skip the intrusive parts unless the address ends with #lockdebug.

export const GHOST = { edge: 8, palm: 70, maxFingers: 3, doubleTapMs: 140 };

/** Pure rule: should this touch be ignored? */
export function isGhostTouch({ x, y, width = 0, height = 0, fingers = 1 }, view, g = GHOST) {
  if (x < g.edge || y < g.edge || x > view.w - g.edge || y > view.h - g.edge) return 'edge';
  if (width > g.palm && height > g.palm) return 'palm';
  if (fingers > g.maxFingers) return 'fingers';
  return null;
}

/** Pure rule: may a saved "where was I" snapshot be used after a reload? */
export function resumeUsable(snap, now, maxAgeMs = 6 * 3600 * 1000) {
  return !!(snap && typeof snap === 'object' && ['world', 'arcade', 'islamic'].includes(snap.k) && typeof snap.at === 'number' && now - snap.at >= 0 && now - snap.at <= maxAgeMs);
}

export function createKidLock({ enabled = true, onBack = () => {}, shouldWarn = () => false } = {}) {
  let on = !!enabled;
  let released = false;                        // an adult chose to leave full screen: do not pull the child back in
  const stats = { ghost: 0, ghostReasons: {}, doubleTaps: 0, blockedKeys: 0, fullscreenRequests: 0 };
  const forced = typeof location !== 'undefined' && /lockdebug/.test(location.hash || '');
  const auto = typeof navigator !== 'undefined' && (!navigator.webdriver || forced);
  const standalone = () => { try { return window.matchMedia('(display-mode: fullscreen)').matches || window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } };
  const typing = (e) => e.target && e.target.closest && e.target.closest('input, textarea, select');

  // ---------------- ghost touches -----------------------------------------------------------------------------------
  const down = new Set();
  let ghostAt = { t: 0, x: 0, y: 0 };
  let lastClick = { t: 0, el: null };
  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    down.add(e.pointerId);
    if (!on) return;
    const why = isGhostTouch({ x: e.clientX, y: e.clientY, width: e.width, height: e.height, fingers: down.size }, { w: window.innerWidth, h: window.innerHeight });
    if (why) {
      stats.ghost++; stats.ghostReasons[why] = (stats.ghostReasons[why] || 0) + 1;
      ghostAt = { t: performance.now(), x: e.clientX, y: e.clientY };
      e.stopImmediatePropagation(); e.preventDefault();
    }
  }, true);
  const lift = (e) => { down.delete(e.pointerId); };
  window.addEventListener('pointerup', lift, true);
  window.addEventListener('pointercancel', lift, true);
  window.addEventListener('click', (e) => {
    if (!on) return;
    const now = performance.now();
    if (now - ghostAt.t < 700 && Math.hypot(e.clientX - ghostAt.x, e.clientY - ghostAt.y) < 40) { e.stopImmediatePropagation(); e.preventDefault(); return; }
    const el = e.target && e.target.closest ? e.target.closest('button, [data-action], a') : null;
    if (el && el === lastClick.el && now - lastClick.t < GHOST.doubleTapMs && e.isTrusted) { stats.doubleTaps++; e.stopImmediatePropagation(); e.preventDefault(); return; }
    lastClick = { t: now, el };
  }, true);

  // ---------------- zoom, menus, refresh and friends --------------------------------------------------------------------
  document.addEventListener('touchmove', (e) => { if (on && e.touches.length > 1 && !typing(e)) e.preventDefault(); }, { passive: false });
  for (const g of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(g, (e) => { if (on) e.preventDefault(); });
  document.addEventListener('contextmenu', (e) => { if (on && !typing(e)) e.preventDefault(); });
  window.addEventListener('wheel', (e) => { if (on && (e.ctrlKey || e.metaKey)) e.preventDefault(); }, { passive: false });
  window.addEventListener('keydown', (e) => {
    if (!on || typing(e)) return;
    const k = e.key ? e.key.toLowerCase() : '';
    const mod = e.ctrlKey || e.metaKey;
    const block = e.key === 'F5' || (mod && ['r', 'p', 's', 'u', '+', '-', '=', '0'].includes(k)) || (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight'));
    if (block) { e.preventDefault(); e.stopPropagation(); stats.blockedKeys++; }
  }, true);

  // ---------------- full screen, screen stays awake, Back button, leave warning ------------------------------------------------------
  async function fullscreen() {
    if (!auto || !on || released || standalone() || document.fullscreenElement || !document.documentElement.requestFullscreen) return;
    stats.fullscreenRequests++;
    try {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      if (navigator.keyboard && navigator.keyboard.lock) { try { await navigator.keyboard.lock(['Escape']); } catch (e) { /* not supported here */ } }
    } catch (e) { /* needs a user gesture; the next tap tries again */ }
  }
  let wake = null;
  async function keepAwake() {
    if (!auto || !on || wake || !navigator.wakeLock) return;
    try { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } catch (e) { wake = null; }
  }
  const gesture = () => { if (on) { fullscreen(); keepAwake(); } };
  window.addEventListener('pointerup', gesture, true);
  window.addEventListener('keyup', gesture, true);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) keepAwake(); });

  if (auto) {
    try { history.replaceState({ ag: 1 }, ''); history.pushState({ ag: 2 }, ''); } catch (e) { /* ignore */ }
    window.addEventListener('popstate', () => {
      if (!on) return;
      try { history.pushState({ ag: 2 }, ''); } catch (e) { /* ignore */ }
      onBack();
    });
    window.addEventListener('beforeunload', (e) => {
      if (!on || !shouldWarn()) return;
      e.preventDefault(); e.returnValue = '';
    });
  }

  return {
    get enabled() { return on; },
    get active() { return on && auto; },
    get stats() { return Object.assign({ fullscreen: !!document.fullscreenElement, standalone: standalone(), awake: !!wake, forced }, stats); },
    setEnabled(v) {
      on = !!v; released = false;
      if (!on && document.fullscreenElement) { try { document.exitFullscreen(); } catch (e) { /* ignore */ } }
    },
    /** For adults: leave full screen and do not pull the child back in until the page is reloaded. */
    leaveFullscreen() { released = true; try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { /* ignore */ } },
    get released() { return released; }
  };
}
