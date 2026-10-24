// Confirm dialogs, toasts, the adult gate and the loading screen.
import { $, esc, show } from './dom.js';
import { G } from './glyphs.js';
import { t } from '../i18n.js';

let dialogResolve = null;
let lastFocus = null;

export function initOverlays(audio) {
  const dlg = $('#dialog');
  dlg.addEventListener('click', (e) => {
    const b = e.target.closest('[data-answer]');
    if (b) closeDialog(b.dataset.answer === 'yes');
  });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); closeDialog(false); }
    if (e.key === 'Tab') trapFocus(dlg, e);
  });
  void audio;
}

function trapFocus(root, e) {
  const f = Array.from(root.querySelectorAll('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter((x) => x.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

/** Shows a friendly yes/no dialog. Resolves true when confirmed. */
export function confirmDialog({ title, text, yes, no, tone = 'normal', icon = 'info' }) {
  const dlg = $('#dialog');
  if (dialogResolve) closeDialog(false);
  lastFocus = document.activeElement;
  dlg.innerHTML = `<div class="dialog-card ${tone === 'danger' ? 'danger' : ''}" role="alertdialog" aria-modal="true" aria-labelledby="dlg-title" aria-describedby="dlg-text">
      <div class="dialog-icon">${G[icon] || G.info}</div>
      <h2 id="dlg-title">${esc(title)}</h2>
      <p id="dlg-text">${esc(text || '')}</p>
      <div class="dialog-buttons">
        <button class="btn btn-ghost" data-answer="no" data-testid="dialog-no">${esc(no || t('cancel'))}</button>
        <button class="btn ${tone === 'danger' ? 'btn-red' : 'btn-pink'}" data-answer="yes" data-testid="dialog-yes">${esc(yes || t('confirm'))}</button>
      </div></div>`;
  show(dlg, true);
  document.body.classList.add('dialog-open');
  setTimeout(() => { const b = dlg.querySelector('[data-answer="no"]'); if (b) b.focus(); }, 30);
  return new Promise((resolve) => { dialogResolve = resolve; });
}
function closeDialog(answer) {
  const dlg = $('#dialog');
  show(dlg, false);
  dlg.innerHTML = '';
  document.body.classList.remove('dialog-open');
  const r = dialogResolve;
  dialogResolve = null;
  if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) { /* element may be gone */ }
  if (r) r(answer);
}
export const dialogOpen = () => !!dialogResolve;

// ---- toasts ------------------------------------------------------------------
export function toast(text, { icon = '', tone = 'info', ms = 2800 } = {}) {
  const box = $('#toasts');
  if (!box) return;
  while (box.children.length >= 3) box.firstChild.remove();
  const el = document.createElement('div');
  el.className = `toast toast-${tone}`;
  el.setAttribute('role', tone === 'error' ? 'alert' : 'status');
  el.innerHTML = `${icon ? `<span class="toast-icon">${icon}</span>` : ''}<span>${esc(text)}</span>`;
  box.appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));
  setTimeout(() => { el.classList.remove('in'); setTimeout(() => el.remove(), 400); }, ms);
}

// ---- adult gate: press and hold ----------------------------------------------
export function adultGate(holdMs) {
  return new Promise((resolve) => {
    const gate = $('#gate');
    if (holdMs <= 0) { resolve(true); return; }
    gate.innerHTML = `<div class="dialog-card gate-card" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <div class="dialog-icon">${G.teacher}</div>
      <h2 id="gate-title">${esc(t('adultTitle'))}</h2>
      <p>${esc(t('adultHold'))}</p>
      <button class="hold-btn" data-testid="gate-hold" aria-label="${esc(t('adultHoldBtn'))}"><span class="hold-ring"></span><span class="hold-label">${G.hand}<b>${esc(t('adultHoldBtn'))}</b></span></button>
      <button class="btn btn-ghost" data-testid="gate-cancel">${esc(t('cancel'))}</button></div>`;
    show(gate, true);
    const btn = gate.querySelector('.hold-btn');
    const ring = gate.querySelector('.hold-ring');
    let start = 0, raf = 0, done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      show(gate, false);
      gate.innerHTML = '';
      document.removeEventListener('keyup', keyUp);
      resolve(ok);
    };
    const frame = () => {
      const k = Math.min(1, (performance.now() - start) / holdMs);
      ring.style.setProperty('--p', (k * 360).toFixed(1) + 'deg');
      if (k >= 1) { finish(true); return; }
      raf = requestAnimationFrame(frame);
    };
    const begin = (e) => { if (e) e.preventDefault(); if (start) return; start = performance.now(); btn.classList.add('holding'); raf = requestAnimationFrame(frame); };
    const end = () => { start = 0; cancelAnimationFrame(raf); btn.classList.remove('holding'); ring.style.setProperty('--p', '0deg'); };
    btn.addEventListener('pointerdown', begin);
    btn.addEventListener('pointerup', end);
    btn.addEventListener('pointerleave', end);
    btn.addEventListener('pointercancel', end);
    btn.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) begin(e); if (e.key === 'Escape') finish(false); });
    const keyUp = (e) => { if (e.key === 'Enter' || e.key === ' ') end(); };
    document.addEventListener('keyup', keyUp);
    gate.querySelector('[data-testid="gate-cancel"]').addEventListener('click', () => finish(false));
    setTimeout(() => btn.focus(), 30);
  });
}

// ---- loader ----------------------------------------------------------------------
export function loaderStep(i, steps) {
  const bar = $('#loader-bar');
  const txt = $('#loader-text');
  if (bar) bar.style.width = Math.round(((i + 1) / steps.length) * 100) + '%';
  if (txt && steps[i]) txt.textContent = steps[i];
}
