// Small system services: error log and local storage. (Read-aloud lives in narrator.js.)

// ---------- errors ---------------------------------------------------------------
const log = [];
const listeners = new Set();
export function report(code, message, detail, severity = 'error') {
  const entry = { time: new Date().toISOString(), code, message: String(message || ''), detail: detail ? String(detail.stack || detail.message || detail) : '', severity };
  log.push(entry);
  if (log.length > 200) log.shift();
  const fn = severity === 'warn' || severity === 'info' ? console.warn : console.error;
  fn.call(console, `[AmmaraGames] ${code}: ${entry.message}`, entry.detail || '');
  listeners.forEach((l) => { try { l(entry); } catch (e) { /* listener errors are ignored */ } });
  return entry;
}
export const errorLog = () => log.slice();
export function onReport(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function installGlobalHandlers() {
  window.addEventListener('error', (e) => report('UNCAUGHT', e.message, e.error));
  window.addEventListener('unhandledrejection', (e) => report('UNHANDLED_PROMISE', e.reason && e.reason.message ? e.reason.message : String(e.reason), e.reason));
}

// ---------- storage -----------------------------------------------------------------
export function createStorage(key) {
  let available = false;
  let memory = null;
  try {
    const probe = '__ammara_probe__';
    window.localStorage.setItem(probe, '1');
    available = window.localStorage.getItem(probe) === '1';
    window.localStorage.removeItem(probe);
  } catch (e) {
    available = false;
  }
  return {
    get available() { return available; },
    load() {
      if (!available) return memory;
      try {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        report('STORAGE_READ', 'Saved progress could not be read; starting fresh.', e, 'warn');
        return null;
      }
    },
    save(data) {
      if (!available) { memory = JSON.parse(JSON.stringify(data)); return false; }
      try {
        window.localStorage.setItem(key, JSON.stringify(data));
        return true;
      } catch (e) {
        report('STORAGE_WRITE', 'Progress could not be saved (storage full or blocked).', e, 'warn');
        memory = JSON.parse(JSON.stringify(data));
        return false;
      }
    }
  };
}
