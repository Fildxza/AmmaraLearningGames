// Tiny DOM helpers. All dynamic text goes through esc() before reaching innerHTML.
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
export function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
export function show(el, on = true) {
  if (!el) return;
  if (on) { el.hidden = false; el.classList.add('show'); }
  else { el.classList.remove('show'); el.hidden = true; }
}
// One delegated click handler per root: elements carry data-action="name" (and optional data-arg).
export function delegate(root, handlers) {
  root.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || !root.contains(el) || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
    const fn = handlers[el.dataset.action];
    if (fn) { e.preventDefault(); fn(el.dataset.arg, el, e); }
  });
}
export function fmtTime(ts, lang) {
  if (!ts) return '';
  try { return new Date(ts).toLocaleString(lang === 'ms' ? 'ms-MY' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return new Date(ts).toISOString(); }
}
