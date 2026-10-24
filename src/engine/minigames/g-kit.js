// Small helpers shared by the mini-game screens.

export const el = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };

/**
 * Drag-and-drop that also works with a tap (select a piece, then tap the place) and with the keyboard
 * (Enter on a piece selects it, Enter on a place puts it there). Mouse, touch and pen all use pointer events.
 */
export function dragDrop(root, { piece, target, onDrop }) {
  let sel = null, drag = null, suppress = false;
  const clearSel = () => { if (sel) sel.classList.remove('sel'); sel = null; };
  root.addEventListener('pointerdown', (e) => {
    const p = e.target.closest(piece);
    if (!p || p.disabled || p.classList.contains('placed')) return;
    drag = { p, x0: e.clientX, y0: e.clientY, moved: false, id: e.pointerId };
    try { p.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  });
  root.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.moved && Math.hypot(dx, dy) > 8) { drag.moved = true; drag.p.classList.add('dragging'); clearSel(); }
    if (drag.moved) drag.p.style.transform = `translate(${dx}px, ${dy}px)`;
  });
  const end = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    d.p.classList.remove('dragging'); d.p.style.transform = '';
    if (d.moved) {
      suppress = true; setTimeout(() => { suppress = false; }, 0);
      const hit = document.elementsFromPoint(e.clientX, e.clientY).find((n) => n.matches && n.matches(target));
      onDrop(d.p, hit || null, 'drag');
    }
  };
  root.addEventListener('pointerup', end);
  root.addEventListener('pointercancel', end);
  root.addEventListener('click', (e) => {
    if (suppress) return;
    const p = e.target.closest(piece), t = e.target.closest(target);
    if (p && !p.disabled && !p.classList.contains('placed')) { if (sel === p) clearSel(); else { clearSel(); sel = p; p.classList.add('sel'); } return; }
    if (t && sel) { const s = sel; clearSel(); onDrop(s, t, 'tap'); }
  });
  return { clear: clearSel, get selected() { return sel; } };
}

/** Converts a pointer event to coordinates inside an <svg> (viewBox units). */
export function svgPoint(svg, e) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX; pt.y = e.clientY;
  const q = pt.matrixTransform(svg.getScreenCTM().inverse());
  return { x: q.x, y: q.y };
}
/** Converts viewBox units to client (screen) coordinates. */
export function svgToClient(svg, p) {
  const m = svg.getScreenCTM();
  return { x: m.a * p.x + m.e, y: m.d * p.y + m.f };
}
export const wiggle = (node) => { if (!node) return; node.classList.remove('wiggle'); void node.offsetWidth; node.classList.add('wiggle'); };
