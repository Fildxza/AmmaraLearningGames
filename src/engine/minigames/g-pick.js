// Picking and sorting mini-games: shape puzzle, find it, count and sort.
import { SHAPE_SETS, makeFindRound, makeCountRound, makeSortRound } from './logic.js';
import { el, dragDrop, wiggle } from './g-kit.js';

const centre = (node) => { const r = node.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
const shuffle = (a) => a.slice().sort(() => Math.random() - 0.5);

// ------------------------------------------------------------------------------------------------ shape puzzle (shape sorter)
export const puzzle = {
  id: 'puzzle', icon: 'shape:star:yellow', color: '#3aa7f0', sticker: 'st_g_puzzle',
  title: { ms: 'Teka-teki Bentuk', en: 'Shape Puzzle' },
  blurb: { ms: 'Masukkan setiap bentuk ke dalam lubangnya.', en: 'Put every shape into its hole.' },
  how: {
    ms: 'Seret bentuk berwarna ke lubang yang sama bentuknya. Atau ketik bentuk itu, kemudian ketik lubangnya.',
    en: 'Drag each coloured shape to the hole with the same shape. Or tap the shape, then tap its hole.'
  },
  create(ctx) {
    const kinds = SHAPE_SETS[ctx.level];
    let placed = 0;
    const root = el('<div class="pz-wrap"><div class="pz-holes" role="group"></div><div class="pz-tray" role="group"></div></div>');
    ctx.stage.appendChild(root);
    const holes = root.querySelector('.pz-holes'), tray = root.querySelector('.pz-tray');
    const word = (k) => ctx.label('shape:' + k) || k;
    function build() {
      placed = 0;
      holes.innerHTML = shuffle(kinds).map((k) => `<button class="pz-hole" data-k="${k}" data-testid="pz-hole-${k}" aria-label="${ctx.L({ ms: 'Lubang', en: 'Hole' })}: ${word(k)}">${ctx.icon('shape:' + k, 'pz-svg')}</button>`).join('');
      tray.innerHTML = shuffle(kinds).map((k) => `<button class="pz-piece" data-k="${k}" data-testid="pz-piece-${k}" aria-label="${word(k)}">${ctx.icon('shape:' + k, 'pz-svg')}</button>`).join('');
      ctx.round(0, kinds.length);
      ctx.status(ctx.L({ ms: 'Seret bentuk ke lubangnya.', en: 'Drag each shape into its hole.' }));
    }
    dragDrop(root, {
      piece: '.pz-piece', target: '.pz-hole',
      onDrop(piece, hole) {
        if (!hole || hole.classList.contains('filled')) return;
        if (hole.dataset.k === piece.dataset.k) {
          hole.classList.add('filled'); hole.innerHTML = ctx.icon('shape:' + piece.dataset.k, 'pz-svg');
          piece.classList.add('placed'); piece.disabled = true; placed++;
          ctx.fx('match'); ctx.good(); ctx.round(placed, kinds.length);
          ctx.status(ctx.L({ ms: `Betul! ${word(piece.dataset.k)}.`, en: `Yes! ${word(piece.dataset.k)}.` }), 'good');
          if (placed === kinds.length) ctx.later(() => ctx.win(), 900);
        } else { ctx.bad(); ctx.fx('place'); wiggle(piece); ctx.status(ctx.L({ ms: 'Bentuknya tidak sama. Cuba lubang lain!', en: 'Not the same shape. Try another hole!' }), 'try'); }
      }
    });
    build();
    return {
      destroy() { root.remove(); }, restart: build,
      debug: () => ({ placed, total: kinds.length, pieces: [...tray.children].filter((p) => !p.disabled).map((p) => Object.assign({ k: p.dataset.k }, centre(p))), holes: [...holes.children].map((h) => Object.assign({ k: h.dataset.k, filled: h.classList.contains('filled') }, centre(h))) })
    };
  }
};

// ------------------------------------------------------------------------------------------------ find it
export const find = {
  id: 'find', icon: 'toy_box', color: '#6fdcb4', sticker: 'st_g_find',
  title: { ms: 'Cari Barang', en: 'Find It' },
  blurb: { ms: 'Cari gambar yang diminta.', en: 'Find the picture you are asked for.' },
  how: {
    ms: 'Lihat gambar di atas. Cari gambar yang sama di dalam bakul dan ketik ia!',
    en: 'Look at the picture at the top. Find the same picture in the basket and tap it!'
  },
  create(ctx) {
    const total = ctx.level === 1 ? 3 : ctx.level === 2 ? 4 : 5;
    const themes = ctx.mode && ['toys', 'fruit', 'animals', 'nature'].includes(ctx.mode) ? [ctx.mode] : ['toys', 'fruit', 'animals', 'nature'];
    let round = 0, r = null;
    const root = el('<div class="fd-wrap"><div class="fd-ask" aria-live="polite"></div><div class="fd-scene"></div></div>');
    ctx.stage.appendChild(root);
    const ask = root.querySelector('.fd-ask'), scene = root.querySelector('.fd-scene');
    function next() {
      r = makeFindRound(ctx.level, themes[round % themes.length]);
      const n = r.items.length, cols = Math.ceil(Math.sqrt(n * 1.7)), rows = Math.ceil(n / cols);
      const cells = shuffle(Array.from({ length: cols * rows }, (_, i) => i)).slice(0, n);
      scene.style.setProperty('--sz', `${Math.min(26, 92 / cols)}%`);
      scene.innerHTML = r.items.map((k, i) => {
        const c = cells[i], cx = ((c % cols) + 0.5) / cols, cy = (Math.floor(c / cols) + 0.5) / rows;
        const jx = (Math.random() - 0.5) * 0.35 / cols, jy = (Math.random() - 0.5) * 0.35 / rows, rot = Math.round((Math.random() - 0.5) * 30);
        return `<button class="fd-item" data-i="${i}" data-testid="fd-${i}" style="left:${(cx + jx) * 100}%;top:${(cy + jy) * 100}%;--rot:${rot}deg" aria-label="${ctx.label(k) || k}">${ctx.icon(k, 'fd-svg')}</button>`;
      }).join('');
      const word = ctx.label(r.target);
      ask.innerHTML = `<span>${ctx.L({ ms: 'Cari', en: 'Find' })}:</span><span class="fd-pic">${ctx.icon(r.target, 'fd-svg')}</span><b>${word && word !== r.target ? word : ''}</b>`;
      ctx.round(round, total);
      ctx.status(ctx.L({ ms: 'Di mana ia?', en: 'Where is it?' }));
    }
    scene.addEventListener('click', (e) => {
      const b = e.target.closest('.fd-item');
      if (!b || b.disabled) return;
      if (Number(b.dataset.i) === r.targetIndex) {
        b.classList.add('found'); scene.querySelectorAll('.fd-item').forEach((x) => { x.disabled = true; });
        ctx.fx('match'); ctx.good(); round++; ctx.round(round, total);
        ctx.status(ctx.L({ ms: 'Jumpa! Pandainya!', en: 'Found it! Clever!' }), 'good');
        if (round >= total) ctx.later(() => ctx.win(), 900); else ctx.later(next, 1100);
      } else { ctx.bad(); wiggle(b); ctx.status(ctx.L({ ms: 'Bukan yang itu. Cari lagi!', en: 'Not that one. Keep looking!' }), 'try'); }
    });
    next();
    return {
      destroy() { root.remove(); }, restart() { round = 0; next(); },
      debug: () => ({ round, total, target: r.target, targetIndex: r.targetIndex, items: r.items.slice(), targetAt: centre(scene.children[r.targetIndex]) })
    };
  }
};

// ------------------------------------------------------------------------------------------------ count and sort
export const counting = {
  id: 'counting', icon: 'count:apple:3', color: '#f5b400', sticker: 'st_g_counting',
  title: { ms: 'Kira & Asingkan', en: 'Count & Sort' },
  blurb: { ms: 'Kira gambar dan asingkan ke dalam bakul.', en: 'Count pictures and sort them into baskets.' },
  how: {
    ms: 'Kira gambar satu demi satu, kemudian ketik nombor yang betul. Untuk mengasingkan, seret setiap gambar ke bakul yang sepadan (atau ketik gambar, kemudian bakul).',
    en: 'Count the pictures one by one, then tap the right number. To sort, drag each picture to the matching basket (or tap the picture, then the basket).'
  },
  create(ctx) {
    const plan = ctx.mode === 'sort' ? ['sort', 'sort', 'sort'] : ctx.mode === 'count' ? ['count', 'count', 'count', 'count'] : ['count', 'count', 'sort', 'count', 'sort'];
    let round = 0, cur = null, sorted = 0;
    const root = el('<div class="ct-wrap"></div>');
    ctx.stage.appendChild(root);
    let dd = null;
    function next() {
      ctx.round(round, plan.length);
      if (plan[round] === 'count') {
        cur = Object.assign({ kind: 'count' }, makeCountRound(ctx.level));
        root.innerHTML = `<div class="ct-items" aria-label="${cur.n}">${Array.from({ length: cur.n }, (_, i) => `<span class="ct-it" style="--d:${i * 40}ms">${ctx.icon(cur.item, 'ct-svg')}</span>`).join('')}</div>
          <div class="ct-opts" role="group">${cur.options.map((v, i) => `<button class="ct-num" data-v="${v}" data-testid="ct-${i}">${v}</button>`).join('')}</div>`;
        ctx.status(ctx.L({ ms: 'Berapa banyak? Kira dengan jari!', en: 'How many? Count with your finger!' }));
      } else {
        cur = Object.assign({ kind: 'sort' }, makeSortRound(ctx.level)); sorted = 0;
        root.innerHTML = `<div class="ct-bins">${cur.bins.map((k, b) => `<button class="ct-bin" data-b="${b}" data-testid="ct-bin-${b}" aria-label="${ctx.label(k) || k}"><span class="ct-bin-pic">${ctx.icon(k, 'ct-svg')}</span><span class="ct-bin-in"></span></button>`).join('')}</div>
          <div class="ct-tray">${cur.items.map((it) => `<button class="ct-piece" data-b="${it.bin}" data-id="${it.id}" data-testid="ct-item-${it.id}" aria-label="${ctx.label(it.key) || it.key}">${ctx.icon(it.key, 'ct-svg')}</button>`).join('')}</div>`;
        ctx.status(ctx.L({ ms: 'Masukkan setiap gambar ke dalam bakul yang betul.', en: 'Put each picture into the right basket.' }));
      }
    }
    function roundDone() {
      round++; ctx.round(round, plan.length);
      if (round >= plan.length) ctx.later(() => ctx.win(), 900); else ctx.later(next, 1000);
    }
    root.addEventListener('click', (e) => {
      const b = e.target.closest('.ct-num');
      if (!b || b.disabled || !cur || cur.kind !== 'count') return;
      if (Number(b.dataset.v) === cur.n) { b.classList.add('right'); root.querySelectorAll('.ct-num').forEach((x) => { x.disabled = true; }); ctx.fx('match'); ctx.good(); ctx.status(ctx.L({ ms: `Betul! ${cur.n}!`, en: `Yes! ${cur.n}!` }), 'good'); roundDone(); }
      else { b.disabled = true; wiggle(b); ctx.bad(); ctx.status(ctx.L({ ms: 'Kira sekali lagi, perlahan-lahan.', en: 'Count once more, slowly.' }), 'try'); }
    });
    dd = dragDrop(root, {
      piece: '.ct-piece', target: '.ct-bin',
      onDrop(piece, bin) {
        if (!bin || !cur || cur.kind !== 'sort') return;
        if (piece.dataset.b === bin.dataset.b) {
          piece.classList.add('placed'); piece.disabled = true;
          bin.querySelector('.ct-bin-in').appendChild(piece);
          sorted++; ctx.fx('pop'); ctx.good();
          if (sorted === cur.items.length) { ctx.status(ctx.L({ ms: 'Semua sudah diasingkan!', en: 'All sorted!' }), 'good'); roundDone(); }
        } else { ctx.bad(); wiggle(piece); ctx.status(ctx.L({ ms: 'Bukan bakul itu. Cuba lagi!', en: 'Not that basket. Try again!' }), 'try'); }
      }
    });
    next();
    return {
      destroy() { root.remove(); }, restart() { round = 0; next(); },
      debug: () => {
        if (!cur) return {};
        if (cur.kind === 'count') return { round, total: plan.length, kind: 'count', n: cur.n, options: cur.options.slice() };
        return { round, total: plan.length, kind: 'sort', items: [...root.querySelectorAll('.ct-piece:not(.placed)')].map((p) => Object.assign({ id: p.dataset.id, bin: Number(p.dataset.b) }, centre(p))), bins: [...root.querySelectorAll('.ct-bin')].map((b) => centre(b)) };
      }
    };
  }
};
