// Installable web app: registers the offline service worker and manifest when the game is served over http(s)
// (GitHub Pages, a school server, localhost). When the file is opened by double-click (file://) nothing here runs.
let deferred = null;
const listeners = new Set();

export const isHttp = () => typeof location !== 'undefined' && /^https?:$/.test(location.protocol);
export const isStandalone = () => { try { return window.matchMedia('(display-mode: fullscreen)').matches || window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } };

export function initPwa() {
  if (!isHttp()) return;
  const link = document.createElement('link');
  link.rel = 'manifest'; link.href = 'manifest.webmanifest';
  document.head.appendChild(link);
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; listeners.forEach((f) => f()); });
  window.addEventListener('appinstalled', () => { deferred = null; listeners.forEach((f) => f()); });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { /* the game works without it */ });
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
