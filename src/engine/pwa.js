// Installable web app: registers the offline service worker and manifest when the game is served over http(s)
// (GitHub Pages, a school server, localhost). When the file is opened by double-click (file://) nothing here runs.
let deferred = null;
const listeners = new Set();

export const isHttp = () => typeof location !== 'undefined' && /^https?:$/.test(location.protocol);
export const isStandalone = () => { try { return window.matchMedia('(display-mode: fullscreen)').matches || window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } };

/**
 * canReload(): true when it is safe to reload (the child is at the menu). A new version of the game is installed by the
 * service worker in the background; without this the old version would be shown once more before the new one.
 */
export function initPwa({ canReload = () => true } = {}) {
  if (!isHttp()) return;
  const link = document.createElement('link');
  link.rel = 'manifest'; link.href = 'manifest.webmanifest';
  document.head.appendChild(link);
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; listeners.forEach((f) => f()); });
  window.addEventListener('appinstalled', () => { deferred = null; listeners.forEach((f) => f()); });
  if ('serviceWorker' in navigator) {
    const hadController = !!navigator.serviceWorker.controller;
    let updated = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || updated) return;                 // the very first install is not an update
      updated = true;
      const tryReload = () => { if (canReload()) location.reload(); else setTimeout(tryReload, 4000); };
      tryReload();
    });
    navigator.serviceWorker.register('sw.js').catch(() => { /* the game works without it */ });
  }
}
export const canInstall = () => !!deferred;
export const onInstallChange = (f) => listeners.add(f);
export async function promptInstall() {
  if (!deferred) return false;
  deferred.prompt();
  try { await deferred.userChoice; } catch (e) { /* ignore */ }
  deferred = null; listeners.forEach((f) => f());
  return true;
}
