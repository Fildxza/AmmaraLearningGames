// Drawing mini-games: ruler and straight lines, connect the dots, tracing letters and numbers.
import { checkLine, snapToLine, checkX, DOT_PICTURES, dotsInOrder, traceCoverage, TRACE_SETS, TRACE_NEEDS } from './logic.js';
import { el, svgPoint, svgToClient, wiggle } from './g-kit.js';
import { HIJAIYAH_BY_CHAR } from '../../data/hijaiyah.js';
import { ARABIC_FONT } from '../world/signs.js';
import { FONT } from '../art/svg.js';

const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };

// ------------------------------------------------------------------------------------------------ ruler, lines and X marks
const W = 600, H = 380;
const LINE_SETS = [
  [{ a: { x: 80, y: 80 }, b: { x: 520, y: 80 } }, { a: { x: 100, y: 150 }, b: { x: 100, y: 330 } }, { a: { x: 190, y: 320 }, b: { x: 520, y: 170 } }, { a: { x: 520, y: 330 }, b: { x: 260, y: 330 } }],
  [{ a: { x: 80, y: 330 }, b: { x: 520, y: 330 } }, { a: { x: 500, y: 60 }, b: { x: 500, y: 280 } }, { a: { x: 120, y: 90 }, b: { x: 440, y: 260 } }, { a: { x: 110, y: 250 }, b: { x: 110, y: 100 } }],
  [{ a: { x: 100, y: 100 }, b: { x: 500, y: 100 } }, { a: { x: 140, y: 300 }, b: { x: 460, y: 160 } }, { a: { x: 300, y: 130 }, b: { x: 300, y: 340 } }, { a: { x: 70, y: 220 }, b: { x: 530, y: 220 } }]
];
const X_SPOTS = [{ x: 150, y: 200 }, { x: 440, y: 120 }, { x: 300, y: 290 }, { x: 470, y: 290 }, { x: 130, y: 110 }];
const LINE_CFG = { 1: { lines: 3, xs: 2, tol: 34, end: 40, guide: true, ruler: 'on', xDraw: false }, 2: { lines: 3, xs: 3, tol: 26, end: 32, guide: true, ruler: 'toggle-on', xDraw: false }, 3: { lines: 4, xs: 2, tol: 20, end: 28, guide: false, ruler: 'toggle-off', xDraw: true } };

export const ruler = {
  id: 'ruler', icon: 'len:pencil:l', color: '#ffb43c', sticker: 'st_g_ruler',
  title: { ms: 'Pembaris Pintar', en: 'Clever Ruler' },
  blurb: { ms: 'Lukis garisan lurus dan tanda X.', en: 'Draw straight lines and X marks.' },
  how: {
    ms: 'Tekan titik hijau, kemudian seret jari atau tetikus ke titik merah untuk melukis garisan lurus. Selepas itu, lukis tanda X dalam bulatan kuning.',
    en: 'Press the green dot, then drag your finger or mouse to the red dot to draw a straight line. After that, make an X in the yellow circle.'
  },
  create(ctx) {
    const cfg = LINE_CFG[ctx.level];
    const set = LINE_SETS[Math.floor((ctx.seed === undefined ? Math.random() : (ctx.seed % 1000) / 1000) * LINE_SETS.length)];
    const steps = [...set.slice(0, cfg.lines).map((l) => ({ type: 'line', ...l })), ...X_SPOTS.slice(0, cfg.xs).map((at) => ({ type: 'x', at }))];
    let idx = 0, rulerOn = cfg.ruler !== 'toggle-off', drawing = null, xs = [];
    const root = el('<div class="rl-wrap"><svg class="rl-board" viewBox="0 0 600 380" role="img" aria-label="Papan lukisan"></svg><div class="rl-tools"></div></div>');
    ctx.stage.appendChild(root);
    const svg = root.querySelector('svg'), tools = root.querySelector('.rl-tools');
    svg.style.touchAction = 'none';
    const layers = { done: sv('g'), guide: sv('g'), live: sv('g') };
    svg.appendChild(sv('rect', { x: 0, y: 0, width: W, height: H, rx: 24, fill: '#fffdf6', stroke: '#e9dcc7', 'stroke-width': 4 }));
    // faint squared-paper grid
    for (let x = 40; x < W; x += 40) svg.appendChild(sv('path', { d: `M${x} 8 V${H - 8}`, stroke: '#f1e7d6', 'stroke-width': 1.5 }));
    for (let y = 40; y < H; y += 40) svg.appendChild(sv('path', { d: `M8 ${y} H${W - 8}`, stroke: '#f1e7d6', 'stroke-width': 1.5 }));
    Object.values(layers).forEach((g) => svg.appendChild(g));
    const dot = (p, color, label) => { const g = sv('g'); g.appendChild(sv('circle', { cx: p.x, cy: p.y, r: 15, fill: color, stroke: '#5b3f33', 'stroke-width': 3 })); const t = sv('text', { x: p.x, y: p.y + 5, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: '#fff', 'font-family': FONT }); t.textContent = label; g.appendChild(t); return g; };
    function drawStep() {
      layers.guide.innerHTML = ''; layers.live.innerHTML = '';
      const s = steps[idx];
      if (!s) return;
      ctx.round(idx, steps.length);
      if (s.type === 'line') {
        if (cfg.guide) layers.guide.appendChild(sv('path', { d: `M${s.a.x} ${s.a.y} L${s.b.x} ${s.b.y}`, stroke: '#d7c7ee', 'stroke-width': 10, 'stroke-dasharray': '2 16', 'stroke-linecap': 'round', fill: 'none' }));
        layers.guide.appendChild(dot(s.a, '#3fbf6a', ctx.L({ ms: 'M', en: 'S' })));
        layers.guide.appendChild(dot(s.b, '#ff5a5a', ctx.L({ ms: 'T', en: 'E' })));
        ctx.status(ctx.L({ ms: 'Seret dari titik hijau ke titik merah.', en: 'Drag from the green dot to the red dot.' }));
      } else {
        const c = sv('circle', { cx: s.at.x, cy: s.at.y, r: 44, fill: '#fff3b0', stroke: '#f5b400', 'stroke-width': 5, 'stroke-dasharray': '10 8' });
        c.setAttribute('class', 'rl-target');
        layers.guide.appendChild(c);
        ctx.status(cfg.xDraw ? ctx.L({ ms: 'Lukis tanda X dengan dua garisan bersilang.', en: 'Draw an X with two crossing lines.' }) : ctx.L({ ms: 'Ketik bulatan kuning untuk meletakkan X.', en: 'Tap the yellow circle to place an X.' }));
      }
      renderTools();
    }
    function renderTools() {
      const s = steps[idx];
      tools.innerHTML = s && s.type === 'line' && cfg.ruler.startsWith('toggle')
        ? `<button class="pill-btn small" data-ruler aria-pressed="${rulerOn}" data-testid="rl-ruler">${ctx.L({ ms: 'Pembaris', en: 'Ruler' })}: ${rulerOn ? ctx.L({ ms: 'ON', en: 'ON' }) : ctx.L({ ms: 'OFF', en: 'OFF' })}</button>` : '';
    }
    tools.addEventListener('click', (e) => { if (e.target.closest('[data-ruler]')) { rulerOn = !rulerOn; renderTools(); } });
    const drawX = (p, s = 22) => { const g = sv('g'); for (const d of [`M${p.x - s} ${p.y - s} L${p.x + s} ${p.y + s}`, `M${p.x + s} ${p.y - s} L${p.x - s} ${p.y + s}`]) g.appendChild(sv('path', { d, stroke: '#ff4f95', 'stroke-width': 11, 'stroke-linecap': 'round', fill: 'none' })); layers.done.appendChild(g); };
    function advance() { idx++; if (idx >= steps.length) { layers.guide.innerHTML = ''; layers.live.innerHTML = ''; ctx.round(steps.length, steps.length); ctx.status(ctx.L({ ms: 'Cantiknya lukisan!', en: 'What a neat drawing!' }), 'good'); ctx.later(() => ctx.win(), 900); } else drawStep(); }
    function fail(msg) { ctx.bad(); ctx.fx('place'); layers.live.innerHTML = ''; ctx.status(msg, 'try'); drawing = null; }
    svg.addEventListener('pointerdown', (e) => {
      const s = steps[idx]; if (!s) return;
      const p = svgPoint(svg, e);
      if (s.type === 'line') {
        if (Math.hypot(p.x - s.a.x, p.y - s.a.y) > 46) { ctx.status(ctx.L({ ms: 'Mula dari titik hijau ya.', en: 'Start from the green dot.' }), 'try'); return; }
        drawing = { pts: [p], s };
        svg.setPointerCapture(e.pointerId);
        if (rulerOn) {
          const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y, len = Math.hypot(dx, dy), ang = (Math.atan2(dy, dx) * 180) / Math.PI;
          const r = sv('g', { transform: `translate(${s.a.x} ${s.a.y}) rotate(${ang})` });
          r.appendChild(sv('rect', { x: -16, y: 8, width: len + 32, height: 30, rx: 5, fill: '#ffd23f', opacity: 0.85, stroke: '#b88a00', 'stroke-width': 2 }));
          for (let k = 0; k <= len; k += 20) r.appendChild(sv('path', { d: `M${k} 8 V${k % 100 === 0 ? 24 : 17}`, stroke: '#7a5a00', 'stroke-width': 2 }));
          layers.live.appendChild(r);
        }
        const pl = sv('path', { d: `M${p.x} ${p.y}`, stroke: '#4a90e2', 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }); pl.setAttribute('class', 'rl-stroke');
        layers.live.appendChild(pl);
      } else if (cfg.xDraw) {
        drawing = { pts: [p], s, x: true };
        svg.setPointerCapture(e.pointerId);
        const pl = sv('path', { d: `M${p.x} ${p.y}`, stroke: '#ff4f95', 'stroke-width': 9, 'stroke-linecap': 'round', fill: 'none' }); pl.setAttribute('class', 'rl-stroke');
        layers.live.appendChild(pl);
      } else if (Math.hypot(p.x - s.at.x, p.y - s.at.y) <= 56) { drawX(s.at); ctx.fx('pop'); ctx.good(); advance(); }
      else ctx.status(ctx.L({ ms: 'Ketik di dalam bulatan kuning.', en: 'Tap inside the yellow circle.' }), 'try');
    });
    svg.addEventListener('pointermove', (e) => {
      if (!drawing) return;
      let p = svgPoint(svg, e);
      if (!drawing.x && rulerOn) p = snapToLine(p, drawing.s.a, drawing.s.b);
      drawing.pts.push(p);
      const path = layers.live.querySelector('.rl-stroke');
      if (path) path.setAttribute('d', 'M' + drawing.pts.map((q) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' L'));
    });
    const up = () => {
      if (!drawing) return;
      const d = drawing; drawing = null;
      if (d.x) {
        xs.push(d.pts);
        if (xs.length < 2) { ctx.status(ctx.L({ ms: 'Satu lagi garisan untuk bersilang!', en: 'One more line to cross it!' })); return; }
        const ok = checkX(xs[0], xs[1], d.s.at, { r: 54 }); xs = [];
        if (ok) { layers.live.innerHTML = ''; drawX(d.s.at); ctx.fx('pop'); ctx.good(); advance(); } else fail(ctx.L({ ms: 'Cuba lukis dua garisan yang bersilang dalam bulatan.', en: 'Try two lines that cross inside the circle.' }));
        return;
      }
      const s = d.s;
      let ok;
      if (rulerOn) ok = snapToLine(d.pts[d.pts.length - 1], s.a, s.b).t >= 0.93;
      else ok = checkLine(d.pts, s.a, s.b, { tol: cfg.tol, endTol: cfg.end }).ok;
      if (ok) {
        layers.live.innerHTML = '';
        layers.done.appendChild(sv('path', { d: `M${s.a.x} ${s.a.y} L${s.b.x} ${s.b.y}`, stroke: '#4a90e2', 'stroke-width': 9, 'stroke-linecap': 'round', fill: 'none' }));
        ctx.fx('pop'); ctx.good(); ctx.status(ctx.L({ ms: 'Lurus! Hebat!', en: 'Straight! Well done!' }), 'good'); advance();
      } else fail(rulerOn ? ctx.L({ ms: 'Seret sampai ke titik merah.', en: 'Keep dragging to the red dot.' }) : ctx.L({ ms: 'Hampir lurus! Cuba lagi, atau hidupkan pembaris.', en: 'Nearly straight! Try again, or turn the ruler on.' }));
    };
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    drawStep();
    return {
      destroy() { root.remove(); },
      restart() { idx = 0; xs = []; layers.done.innerHTML = ''; drawStep(); },
      debug() {
        const s = steps[idx];
        if (!s) return { step: idx, total: steps.length, done: true };
        return { step: idx, total: steps.length, type: s.type, rulerOn, a: s.a ? svgToClient(svg, s.a) : null, b: s.b ? svgToClient(svg, s.b) : null, at: s.at ? svgToClient(svg, s.at) : null, xDraw: cfg.xDraw };
      }
    };
  }
};

// ------------------------------------------------------------------------------------------------ connect the dots
export const dots = {
  id: 'dots', icon: 'dots:4', color: '#ff6f9f', sticker: 'st_g_dots',
  title: { ms: 'Sambung Titik', en: 'Connect the Dots' },
  blurb: { ms: 'Sambung titik ikut nombor dan lihat gambarnya.', en: 'Join the dots in number order to see the picture.' },
  how: {
    ms: 'Ketik titik bernombor 1, kemudian 2, kemudian 3 dan seterusnya. Atau seret jari dari satu titik ke titik seterusnya. Gambar akan muncul di hujung!',
    en: 'Tap dot 1, then 2, then 3 and so on. Or drag your finger from one dot to the next. A picture appears at the end!'
  },
  create(ctx) {
    const pool = DOT_PICTURES[ctx.level];
    const picks = pool.slice().sort(() => Math.random() - 0.5).slice(0, 2);
    let pi = 0, next = 1, pic, pts, line, done = false, pressing = false;
    const root = el('<div class="dt-wrap"><svg class="dt-board" viewBox="0 0 100 100" role="img"></svg></div>');
    ctx.stage.appendChild(root);
    const svg = root.querySelector('svg');
    svg.style.touchAction = 'none';
    const g = { fill: sv('g'), lines: sv('g'), dots: sv('g') };
    svg.appendChild(sv('rect', { x: 0, y: 0, width: 100, height: 100, rx: 8, fill: '#fffdf6', stroke: '#e9dcc7', 'stroke-width': 1 }));
    Object.values(g).forEach((x) => svg.appendChild(x));
    function load() {
      pic = picks[pi]; pts = dotsInOrder(pic); next = 1; done = false;
      g.fill.innerHTML = ''; g.lines.innerHTML = ''; g.dots.innerHTML = '';
      pts.forEach((p) => {
        const c = sv('g', { 'data-n': p.n, class: 'dt-dot' });
        c.appendChild(sv('circle', { cx: p.x, cy: p.y, r: 4.6, fill: '#fff', stroke: '#5b3f33', 'stroke-width': 0.9 }));
        const t = sv('text', { x: p.x, y: p.y + 1.9, 'text-anchor': 'middle', 'font-size': 5.4, 'font-weight': 700, fill: '#5b3f33', 'font-family': FONT }); t.textContent = p.n; c.appendChild(t);
        g.dots.appendChild(c);
      });
      mark();
      ctx.round(pi, picks.length);
      ctx.status(ctx.L({ ms: 'Mula dengan titik nombor 1.', en: 'Start with dot number 1.' }));
    }
    function mark() { g.dots.querySelectorAll('.dt-dot').forEach((d) => d.classList.toggle('next', Number(d.dataset.n) === next)); }
    function connect(n) {
      if (done || n !== next) return false;
      if (n > 1) { const a = pts[n - 2], b = pts[n - 1]; g.lines.appendChild(sv('path', { d: `M${a.x} ${a.y} L${b.x} ${b.y}`, stroke: '#4a90e2', 'stroke-width': 1.6, 'stroke-linecap': 'round' })); }
      const dEl = g.dots.querySelector(`[data-n="${n}"] circle`); dEl.setAttribute('fill', '#ffe27a');
      ctx.fx('pop'); next++;
      if (next > pts.length) finishPicture(); else mark();
      return true;
    }
    function finishPicture() {
      done = true;
      const a = pts[pts.length - 1], b = pts[0];
      g.lines.appendChild(sv('path', { d: `M${a.x} ${a.y} L${b.x} ${b.y}`, stroke: '#4a90e2', 'stroke-width': 1.6, 'stroke-linecap': 'round' }));
      g.fill.appendChild(sv('path', { d: 'M' + pts.map((p) => `${p.x} ${p.y}`).join(' L') + ' Z', fill: pic.color, opacity: 0.85, class: 'dt-reveal' }));
      ctx.good(); ctx.fx('match');
      ctx.status(ctx.L({ ms: `Wah, ${pic.name.ms.toLowerCase()}!`, en: `Wow, a ${pic.name.en.toLowerCase()}!` }), 'good');
      pi++; ctx.round(pi, picks.length);
      if (pi >= picks.length) ctx.later(() => ctx.win(), 1300); else ctx.later(load, 1500);
    }
    function hit(e) {
      const n = document.elementsFromPoint(e.clientX, e.clientY).map((x) => x.closest && x.closest('.dt-dot')).find(Boolean);
      if (n) return Number(n.getAttribute('data-n'));
      // generous finger target: the nearest dot within a few units
      const p = svgPoint(svg, e);
      let best = null, bd = 7.5;
      for (const q of pts) { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; best = q.n; } }
      return best;
    }
    svg.addEventListener('pointerdown', (e) => {
      const n = hit(e); if (n === null) return;
      pressing = true;
      if (!connect(n)) { ctx.bad(); wiggle(g.dots.querySelector(`[data-n="${n}"]`)); ctx.status(ctx.L({ ms: `Cari titik nombor ${next} dahulu.`, en: `Find dot number ${next} first.` }), 'try'); }
    });
    svg.addEventListener('pointermove', (e) => { if (pressing && e.buttons) { const n = hit(e); if (n === next) connect(n); } });
    const rel = () => { pressing = false; };
    svg.addEventListener('pointerup', rel); svg.addEventListener('pointercancel', rel);
    load();
    return {
      destroy() { root.remove(); }, restart() { pi = 0; load(); },
      debug: () => ({ picture: pic.id, next, total: pts.length, done, picturesDone: pi, dots: pts.map((p) => Object.assign({ n: p.n }, svgToClient(svg, p))) })
    };
  }
};

// ------------------------------------------------------------------------------------------------ tracing letters and numbers
const CAN = 440;
export const trace = {
  id: 'trace', icon: 'letter:A', color: '#3d8bfd', sticker: 'st_g_trace',
  title: { ms: 'Surih Huruf & Nombor', en: 'Trace Letters & Numbers' },
  blurb: { ms: 'Surih huruf, nombor dan huruf hijaiyah.', en: 'Trace letters, numbers and Hijaiyah letters.' },
  how: {
    ms: 'Pilih huruf, nombor atau huruf hijaiyah. Dengan jari atau tetikus, lukis di atas bentuk yang kelabu sehingga ia berwarna. Susunan goresan tidak diperiksa; yang penting ialah mengikut bentuknya.',
    en: 'Pick letters, numbers or Hijaiyah letters. With a finger or the mouse, draw over the grey shape until it fills with colour. The order of the strokes is not checked; what matters is following the shape.'
  },
  create(ctx) {
    const sets = TRACE_SETS[ctx.level];
    const brush = ctx.level === 1 ? 26 : ctx.level === 2 ? 22 : 19, need = TRACE_NEEDS[ctx.level];
    let cat = ctx.mode === 'num' ? 'num' : ctx.mode === 'ar' ? 'ar' : 'abc';
    let queue = [], round = 0, glyph = '', targets = [], strokePts = [], drawing = false, solved = false, cov = { coverage: 0, outside: 0 };
    const TOTAL = 3;
    const root = el(`<div class="tr-wrap"><div class="tr-tabs" role="tablist"></div><div class="tr-board"><canvas class="tr-bg" width="${CAN}" height="${CAN}"></canvas><canvas class="tr-ink" width="${CAN}" height="${CAN}" data-testid="tr-canvas"></canvas></div>
      <div class="tr-meter" aria-hidden="true"><i></i></div><div class="tr-tools"><button class="pill-btn small" data-clear data-testid="tr-clear">${ctx.L({ ms: 'Padam', en: 'Erase' })}</button></div></div>`);
    ctx.stage.appendChild(root);
    const bg = root.querySelector('.tr-bg'), ink = root.querySelector('.tr-ink'), tabs = root.querySelector('.tr-tabs'), meter = root.querySelector('.tr-meter i');
    const bctx = bg.getContext('2d'), ictx = ink.getContext('2d');
    ink.style.touchAction = 'none';
    const isAr = (g) => /[؀-ۿ]/.test(g);
    function font(g, size) { return isAr(g) ? `700 ${size}px ${ARABIC_FONT}` : `700 ${size}px ${FONT}`; }
    function layout(g) {
      const c = document.createElement('canvas'); c.width = c.height = CAN; const x = c.getContext('2d');
      let size = isAr(g) ? 300 : 330;
      x.font = font(g, size); x.textBaseline = 'alphabetic';
      let m = x.measureText(g);
      const w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight, h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
      const k = Math.min(1, (CAN * 0.78) / Math.max(w, 1), (CAN * 0.78) / Math.max(h, 1));
      size *= k; x.font = font(g, size); m = x.measureText(g);
      const w2 = m.actualBoundingBoxLeft + m.actualBoundingBoxRight, h2 = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
      return { size, x: CAN / 2 - w2 / 2 + m.actualBoundingBoxLeft, y: CAN / 2 + h2 / 2 - m.actualBoundingBoxDescent };
    }
    function loadGlyph() {
      glyph = queue[round];
      const L = layout(glyph);
      bctx.clearRect(0, 0, CAN, CAN); ictx.clearRect(0, 0, CAN, CAN);
      bctx.font = font(glyph, L.size); bctx.textBaseline = 'alphabetic';
      bctx.fillStyle = '#e9e1f7'; bctx.fillText(glyph, L.x, L.y);
      bctx.setLineDash([8, 8]); bctx.lineWidth = 3; bctx.strokeStyle = '#8f7bc9'; bctx.strokeText(glyph, L.x, L.y); bctx.setLineDash([]);
      // sample points inside the glyph
      const m = document.createElement('canvas'); m.width = m.height = CAN; const mc = m.getContext('2d');
      mc.font = font(glyph, L.size); mc.textBaseline = 'alphabetic'; mc.fillStyle = '#000'; mc.fillText(glyph, L.x, L.y);
      const data = mc.getImageData(0, 0, CAN, CAN).data;
      targets = [];
      for (let y = 4; y < CAN; y += 6) for (let x = 4; x < CAN; x += 6) if (data[(y * CAN + x) * 4 + 3] > 140) targets.push({ x, y });
      strokePts = []; solved = false; cov = { coverage: 0, outside: 0 }; meter.style.width = '0%';
      ctx.round(round, TOTAL);
      ctx.status(ctx.L({ ms: `Surih huruf ${isAr(glyph) ? '' : ''}${glyph}`, en: `Trace ${glyph}` }).trim() + (isAr(glyph) && HIJAIYAH_BY_CHAR[glyph] ? '  (' + HIJAIYAH_BY_CHAR[glyph].name + ')' : ''));
      renderTabs();
    }
    function renderTabs() {
      const names = { abc: 'ABC', num: '123', ar: 'ا ب ت' };
      tabs.innerHTML = Object.keys(sets).map((k) => `<button class="pill-btn small" role="tab" data-cat="${k}" aria-selected="${k === cat}" aria-pressed="${k === cat}" data-testid="tr-tab-${k}">${names[k]}</button>`).join('');
    }
    function newRound() {
      const pool = sets[cat].slice().sort(() => Math.random() - 0.5);
      queue = pool.slice(0, TOTAL); round = 0; loadGlyph();
    }
    const pos = (e) => { const r = ink.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * CAN, y: ((e.clientY - r.top) / r.height) * CAN }; };
    function dab(p) { ictx.fillStyle = '#ff6fa8'; ictx.beginPath(); ictx.arc(p.x, p.y, brush * 0.75, 0, 7); ictx.fill(); }
    function evaluate() {
      cov = traceCoverage(targets, strokePts, brush);
      meter.style.width = Math.round(Math.min(1, cov.coverage / need) * 100) + '%';
      return cov.coverage >= need && cov.outside <= 0.55;
    }
    function success() {
      solved = true; ctx.good(); ctx.fx('match');
      const L = layout(glyph);
      bctx.font = font(glyph, L.size); bctx.fillStyle = '#4cc46a'; bctx.fillText(glyph, L.x, L.y);
      ictx.clearRect(0, 0, CAN, CAN);
      const nm = isAr(glyph) && HIJAIYAH_BY_CHAR[glyph] ? ` (${HIJAIYAH_BY_CHAR[glyph].name})` : '';
      ctx.status(ctx.L({ ms: `Cantik! ${glyph}${nm}`, en: `Lovely! ${glyph}${nm}` }), 'good');
      round++; ctx.round(round, TOTAL);
      if (round >= TOTAL) ctx.later(() => ctx.win(), 1100); else ctx.later(loadGlyph, 1300);
    }
    ink.addEventListener('pointerdown', (e) => { if (solved) return; drawing = true; ink.setPointerCapture(e.pointerId); const p = pos(e); strokePts.push(p); dab(p); });
    ink.addEventListener('pointermove', (e) => {
      if (!drawing || solved) return;
      const p = pos(e), q = strokePts[strokePts.length - 1];
      const n = Math.max(1, Math.ceil(Math.hypot(p.x - q.x, p.y - q.y) / (brush * 0.5)));
      for (let i = 1; i <= n; i++) { const s = { x: q.x + ((p.x - q.x) * i) / n, y: q.y + ((p.y - q.y) * i) / n }; strokePts.push(s); dab(s); }
    });
    const up = () => {
      if (!drawing) return; drawing = false;
      if (evaluate()) success();
      else if (cov.outside > 0.55 && strokePts.length > 30) { ctx.bad(); ctx.status(ctx.L({ ms: 'Cuba ikut bentuk kelabu. Tekan Padam untuk mula semula.', en: 'Try to follow the grey shape. Press Erase to start again.' }), 'try'); }
    };
    ink.addEventListener('pointerup', up); ink.addEventListener('pointercancel', up);
    root.addEventListener('click', (e) => {
      const t = e.target.closest('[data-cat]'), c = e.target.closest('[data-clear]');
      if (t) { cat = t.dataset.cat; newRound(); }
      else if (c && !solved) { ictx.clearRect(0, 0, CAN, CAN); strokePts = []; meter.style.width = '0%'; ctx.status(ctx.L({ ms: `Surih huruf ${glyph}`, en: `Trace ${glyph}` })); }
    });
    const ready = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    ready.then(() => { if (!root.isConnected) return; newRound(); });
    newRound();
    return {
      destroy() { root.remove(); }, restart: newRound,
      debug() {
        const r = ink.getBoundingClientRect();
        // up to 420 sample points in screen coordinates, ordered by a nearest-neighbour walk, so a test can trace with real mouse events
        const pts = targets.map((p) => ({ x: r.left + (p.x / CAN) * r.width, y: r.top + (p.y / CAN) * r.height }));
        return { glyph, category: cat, coverage: cov.coverage, outside: cov.outside, need, round, total: TOTAL, solved, targetCount: targets.length, points: pts.filter((_, i) => i % Math.max(1, Math.floor(pts.length / 420)) === 0) };
      }
    };
  }
};
