// Board-style mini-games: X and O, memory cards, bead patterns.
import { emptyBoard, winner, chooseMove, MEMORY_PAIRS, makeDeck, makePattern, BEADS } from './logic.js';
import { el, wiggle } from './g-kit.js';

const markSvg = (v) => (v === 'X'
  ? '<svg viewBox="0 0 100 100" class="mk x"><path d="M22 22 L78 78 M78 22 L22 78" fill="none" stroke="#ff4f95" stroke-width="14" stroke-linecap="round"/></svg>'
  : v === 'O' ? '<svg viewBox="0 0 100 100" class="mk o"><circle cx="50" cy="50" r="28" fill="none" stroke="#3d8bfd" stroke-width="14"/></svg>' : '');

// ------------------------------------------------------------------------------------------------ X and O
export const xo = {
  id: 'xo', icon: 'shape:square:butter', color: '#ff8ccf', sticker: 'st_g_xo',
  title: { ms: 'X dan O', en: 'X and O' },
  blurb: { ms: 'Susun tiga tanda dalam satu garisan.', en: 'Get three marks in a row.' },
  how: {
    ms: 'Ketik petak kosong untuk meletakkan X. Kawan akan meletakkan O. Dapatkan tiga X dalam satu garisan: ke tepi, ke bawah atau serong!',
    en: 'Tap an empty square to place your X. Your friend places O. Get three X in a row: across, down or diagonally!'
  },
  create(ctx) {
    let board = emptyBoard(), turn = 'X', over = false, vs = 'robot', result = null;
    const root = el('<div class="xo-wrap"></div>');
    ctx.stage.appendChild(root);
    const label = (v, i) => `${ctx.L({ ms: 'Petak', en: 'Square' })} ${i + 1}${v ? ' ' + v : ''}`;
    function render() {
      const w = winner(board);
      root.innerHTML = `<div class="xo-bar">
          <button class="pill-btn small" data-m="robot" aria-pressed="${vs === 'robot'}" data-testid="xo-robot">${ctx.L({ ms: 'Main dengan kawan robot', en: 'Play with the robot' })}</button>
          <button class="pill-btn small" data-m="two" aria-pressed="${vs === 'two'}" data-testid="xo-two">${ctx.L({ ms: '2 pemain', en: '2 players' })}</button>
        </div>
        <div class="xo-board" role="grid" aria-label="X O">${board.map((v, i) => `<button class="xo-cell ${w && w.line.includes(i) ? 'win' : ''}" role="gridcell" data-i="${i}" data-testid="xo-${i}" aria-label="${label(v, i)}" ${v || over ? 'disabled' : ''}>${markSvg(v)}</button>`).join('')}</div>
        ${result === 'lose' ? `<button class="btn btn-play" data-again data-testid="xo-again">${ctx.L({ ms: 'Cuba lagi', en: 'Try again' })}</button>` : ''}`;
    }
    function status() {
      if (over) return;
      ctx.status(vs === 'two' ? ctx.L({ ms: `Giliran ${turn}`, en: `${turn}'s turn` }) : turn === 'X' ? ctx.L({ ms: 'Giliran kamu! Letak X.', en: 'Your turn! Place an X.' }) : ctx.L({ ms: 'Giliran kawan…', en: "Friend's turn…" }));
    }
    function finish() {
      const w = winner(board);
      if (!w) return false;
      over = true;
      render();
      if (w.mark === 'draw') { ctx.status(ctx.L({ ms: 'Seri! Cantik mainan!', en: "It's a draw! Nice playing!" }), 'good'); result = 'draw'; ctx.good(); ctx.later(() => ctx.win(), 700); }
      else if (w.mark === 'X' || vs === 'two') { result = 'win'; ctx.status(vs === 'two' ? ctx.L({ ms: `${w.mark} menang!`, en: `${w.mark} wins!` }) : ctx.L({ ms: 'Kamu menang!', en: 'You win!' }), 'good'); ctx.good(); ctx.later(() => ctx.win(), 800); }
      else { result = 'lose'; ctx.bad(); ctx.status(ctx.L({ ms: 'Kawan menang! Cuba lagi, kamu boleh!', en: 'Your friend wins! Try again, you can do it!' }), 'try'); render(); }
      return true;
    }
    function place(i) {
      if (over || board[i]) return;
      board[i] = turn; ctx.fx('pop');
      if (finish()) return;
      turn = turn === 'X' ? 'O' : 'X';
      render(); status();
      if (vs === 'robot' && turn === 'O') ctx.later(robotMove, 650);
    }
    function robotMove() {
      if (over) return;
      const i = chooseMove(board, 'O', ctx.level);
      if (i >= 0) place(i);
    }
    function reset() { board = emptyBoard(); turn = 'X'; over = false; result = null; render(); status(); }
    root.addEventListener('click', (e) => {
      const c = e.target.closest('.xo-cell'), m = e.target.closest('[data-m]');
      if (c) { if (vs === 'robot' && turn !== 'X') return; place(Number(c.dataset.i)); }
      else if (m) { vs = m.dataset.m; reset(); }
      else if (e.target.closest('[data-again]')) reset();
    });
    reset();
    return { destroy() { root.remove(); }, restart: reset, debug: () => ({ board: board.slice(), turn, over, vs, result }) };
  }
};

// ------------------------------------------------------------------------------------------------ memory cards
export const memory = {
  id: 'memory', icon: 'cat', color: '#ff9a3c', sticker: 'st_g_memory',
  title: { ms: 'Kad Ingatan', en: 'Memory Cards' },
  blurb: { ms: 'Cari dua gambar yang sama.', en: 'Find two matching pictures.' },
  how: {
    ms: 'Ketik kad untuk membukanya. Cari dua gambar yang sama. Kalau sama, kad itu kekal terbuka. Tidak mengapa jika tersilap, cuba lagi!',
    en: 'Tap a card to turn it over. Find two pictures that match. A match stays open. It is fine to miss, just try again!'
  },
  create(ctx) {
    const pairs = MEMORY_PAIRS[ctx.level];
    const cols = pairs === 3 ? 3 : 4;
    let deck, first = null, lock = true, matched = 0, moves = 0;
    const root = el('<div class="mem-grid"></div>');
    root.style.setProperty('--cols', cols);
    ctx.stage.appendChild(root);
    function build() {
      deck = makeDeck(pairs, ctx.seed);
      first = null; matched = 0; moves = 0; lock = true;
      root.innerHTML = deck.map((c, i) => `<button class="mem-card" data-i="${i}" data-testid="mem-${i}" aria-label="${ctx.L({ ms: 'Kad', en: 'Card' })} ${i + 1}"><span class="face">${ctx.icon(c.key, 'mem-svg')}</span><span class="back" aria-hidden="true">★</span></button>`).join('');
      const cards = [...root.children];
      const peek = ctx.level === 1 ? 2200 : ctx.level === 2 ? 1600 : 0;
      ctx.status(peek ? ctx.L({ ms: 'Lihat gambarnya dahulu!', en: 'Look at the pictures first!' }) : ctx.L({ ms: 'Cari pasangan yang sama.', en: 'Find the matching pairs.' }));
      if (peek) { cards.forEach((c) => c.classList.add('up')); ctx.later(() => { cards.forEach((c) => c.classList.remove('up')); lock = false; ctx.status(ctx.L({ ms: 'Cari pasangan yang sama.', en: 'Find the matching pairs.' })); }, peek); }
      else lock = false;
      ctx.round(0, pairs);
    }
    root.addEventListener('click', (e) => {
      const b = e.target.closest('.mem-card');
      if (!b || lock || b.classList.contains('up') || b.classList.contains('done')) return;
      b.classList.add('up'); ctx.fx('flip');
      if (!first) { first = b; return; }
      moves++;
      const a = deck[Number(first.dataset.i)], c = deck[Number(b.dataset.i)];
      if (a.pair === c.pair) {
        const f = first; first = null; matched++;
        f.classList.add('done'); b.classList.add('done'); ctx.fx('match'); ctx.good(); ctx.round(matched, pairs);
        if (matched === pairs) { ctx.status(ctx.L({ ms: 'Semua sepadan!', en: 'All matched!' }), 'good'); lock = true; ctx.later(() => ctx.win(), 900); }
      } else {
        lock = true; const f = first; first = null; ctx.bad();
        ctx.later(() => { f.classList.remove('up'); b.classList.remove('up'); lock = false; }, ctx.level === 1 ? 1400 : 1000);
      }
    });
    build();
    return { destroy() { root.remove(); }, restart: build, debug: () => ({ pairs, matched, moves, locked: lock, cards: deck.map((c, i) => ({ i, key: c.key, pair: c.pair, up: root.children[i].classList.contains('up'), done: root.children[i].classList.contains('done') })) }) };
  }
};

// ------------------------------------------------------------------------------------------------ bead patterns
const bead = (b, cls = '') => `<svg viewBox="0 0 60 60" class="bead ${cls}"><circle cx="30" cy="30" r="25" fill="${b.color}" stroke="#5b3f33" stroke-width="3"/><ellipse cx="21" cy="19" rx="8" ry="5" fill="#fff" opacity=".55" transform="rotate(-30 21 19)"/></svg>`;
export const patterns = {
  id: 'patterns', icon: 'ball:rainbow', color: '#9b6bff', sticker: 'st_g_patterns',
  title: { ms: 'Corak Manik', en: 'Bead Patterns' },
  blurb: { ms: 'Sambung corak manik yang berwarna-warni.', en: 'Finish the colourful bead pattern.' },
  how: {
    ms: 'Lihat corak manik. Manik yang hilang ditandakan dengan soal selidik. Pilih manik yang betul untuk menyambung corak.',
    en: 'Look at the row of beads. A question mark shows the missing bead. Pick the bead that continues the pattern.'
  },
  create(ctx) {
    const total = ctx.level === 1 ? 4 : 5;
    let round = 0, pat = null;
    const root = el('<div class="pat-wrap"></div>');
    ctx.stage.appendChild(root);
    function next() {
      pat = makePattern(ctx.level, ctx.seed === undefined ? undefined : ctx.seed + round);
      ctx.round(round, total);
      root.innerHTML = `<div class="pat-row" aria-label="${ctx.L({ ms: 'Corak manik', en: 'Bead pattern' })}">${pat.shown.map((id) => bead(BEADS[id])).join('')}<span class="pat-slot" data-testid="pat-slot">?</span></div>
        <div class="pat-options" role="group" aria-label="${ctx.L({ ms: 'Pilih manik', en: 'Pick a bead' })}">${pat.options.map((id, i) => `<button class="pat-opt" data-id="${id}" data-testid="pat-${i}" aria-label="${ctx.L({ ms: 'Manik', en: 'Bead' })} ${i + 1}">${bead(BEADS[id])}</button>`).join('')}</div>`;
      ctx.status(ctx.L({ ms: 'Manik apa yang seterusnya?', en: 'Which bead comes next?' }));
    }
    root.addEventListener('click', (e) => {
      const b = e.target.closest('.pat-opt');
      if (!b || b.disabled) return;
      if (Number(b.dataset.id) === pat.answer) {
        ctx.fx('match'); ctx.good();
        root.querySelector('.pat-slot').innerHTML = bead(BEADS[pat.answer], 'pop');
        root.querySelectorAll('.pat-opt').forEach((x) => { x.disabled = true; });
        round++;
        ctx.status(ctx.L({ ms: 'Betul! Cantiknya corak!', en: 'Yes! What a lovely pattern!' }), 'good');
        ctx.round(round, total);
        if (round >= total) ctx.later(() => ctx.win(), 900); else ctx.later(next, 1100);
      } else { ctx.bad(); ctx.fx('place'); wiggle(b); b.disabled = true; ctx.status(ctx.L({ ms: 'Hampir! Cuba manik lain.', en: 'Almost! Try another bead.' }), 'try'); }
    });
    next();
    return {
      destroy() { root.remove(); }, restart() { round = 0; next(); },
      debug: () => ({ round, total, answer: pat.answer, options: pat.options.slice(), shown: pat.shown.slice(), correctIndex: pat.options.indexOf(pat.answer) })
    };
  }
};
