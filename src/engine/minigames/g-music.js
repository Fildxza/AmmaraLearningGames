// The music corner: an 8-bar xylophone with free play, "follow the song" and "copy me".
import { XYLO_NOTES, XYLO_COLORS, SONGS, SONG_BY_LEVEL, makeTune, TUNE_LENGTH } from './logic.js';
import { el, wiggle } from './g-kit.js';

const SOLFA = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti', 'Do'];

export const music = {
  id: 'music', icon: 'bubble:♪ ♫', color: '#ff6fa8', sticker: 'st_g_music',
  title: { ms: 'Xilofon Ceria', en: 'Happy Xylophone' },
  blurb: { ms: 'Main muzik dan ikut lagu.', en: 'Make music and follow a song.' },
  how: {
    ms: 'Ketik bilah berwarna untuk berbunyi. Dalam "Ikut Lagu", ketik bilah yang bercahaya. Dalam "Tiru Saya", dengar dan lihat dahulu, kemudian ulang. "Main Bebas" untuk bermain sesuka hati.',
    en: 'Tap the coloured bars to make sounds. In "Follow the Song", tap the bar that lights up. In "Copy Me", watch and listen first, then repeat. "Free Play" is for playing however you like.'
  },
  create(ctx) {
    let mode = ctx.level === 1 ? 'song' : ctx.level === 2 ? 'song' : 'copy';
    let seq = [], pos = 0, listening = false, copyRound = 0, songDone = false;
    const COPY_ROUNDS = 3;
    const root = el(`<div class="mu-wrap"><div class="mu-modes" role="tablist"></div><div class="mu-track" aria-hidden="true"></div>
      <div class="mu-xylo" role="group">${XYLO_NOTES.map((n, i) => `<button class="mu-bar" data-i="${i}" data-testid="mu-${i}" style="--c:${XYLO_COLORS[i]};--h:${100 - i * 7}%" aria-label="${SOLFA[i]}"><span>${SOLFA[i]}</span></button>`).join('')}</div></div>`);
    ctx.stage.appendChild(root);
    const modes = root.querySelector('.mu-modes'), track = root.querySelector('.mu-track'), bars = [...root.querySelectorAll('.mu-bar')];
    root.querySelector('.mu-xylo').style.touchAction = 'none';
    const glow = (i, ms = 380) => { const b = bars[i]; if (!b) return; b.classList.add('lit'); ctx.later(() => b.classList.remove('lit'), ms); };
    const sound = (i) => { ctx.note(XYLO_NOTES[i], 'marimba'); glow(i, 260); };
    function renderModes() {
      const opts = [['song', { ms: 'Ikut Lagu', en: 'Follow the Song' }], ['copy', { ms: 'Tiru Saya', en: 'Copy Me' }], ['free', { ms: 'Main Bebas', en: 'Free Play' }]];
      modes.innerHTML = opts.map(([k, l]) => `<button class="pill-btn small" role="tab" data-mode="${k}" aria-pressed="${k === mode}" data-testid="mu-mode-${k}">${ctx.L(l)}</button>`).join('');
    }
    function renderTrack() {
      track.innerHTML = seq.map((b, i) => `<i class="${i < pos ? 'done' : i === pos && mode === 'song' ? 'now' : ''}" style="--c:${XYLO_COLORS[b]}"></i>`).join('');
      bars.forEach((b, i) => b.classList.toggle('next', mode === 'song' && !songDone && seq[pos] === i));
    }
    function startSong() {
      const key = SONG_BY_LEVEL[ctx.level][0];
      seq = SONGS[key].notes.slice(); pos = 0; songDone = false;
      ctx.round(0, seq.length);
      ctx.status(ctx.L({ ms: `Lagu: ${SONGS[key].name.ms}. Ketik bilah yang bercahaya!`, en: `Song: ${SONGS[key].name.en}. Tap the bar that lights up!` }));
      renderTrack();
    }
    function startCopy() {
      seq = makeTune(TUNE_LENGTH[ctx.level]); pos = 0;
      ctx.round(copyRound, COPY_ROUNDS);
      ctx.status(ctx.L({ ms: 'Dengar dan lihat…', en: 'Watch and listen…' }));
      listening = true; renderTrack();
      seq.forEach((b, i) => ctx.later(() => { sound(b); }, 700 + i * 620));
      ctx.later(() => { listening = false; ctx.status(ctx.L({ ms: 'Giliran kamu! Ulang lagu itu.', en: 'Your turn! Play it back.' })); }, 700 + seq.length * 620);
    }
    function setMode(m) {
      mode = m; copyRound = 0; renderModes(); ctx.clearTimers();
      if (m === 'song') startSong();
      else if (m === 'copy') startCopy();
      else { seq = []; pos = 0; renderTrack(); ctx.round(0, 0); ctx.status(ctx.L({ ms: 'Main bebas! Cipta lagu kamu sendiri.', en: 'Free play! Make your own tune.' })); }
    }
    function press(i) {
      sound(i);
      if (mode === 'free' || listening) return;
      if (mode === 'song') {
        if (songDone) return;
        if (seq[pos] === i) { pos++; ctx.round(pos, seq.length); if (pos >= seq.length) { songDone = true; ctx.good(); ctx.status(ctx.L({ ms: 'Lagu selesai! Merdunya!', en: 'Song finished! Beautiful!' }), 'good'); ctx.later(() => ctx.win(), 1100); } }
        else { ctx.bad(); wiggle(bars[i]); }
        renderTrack();
      } else if (mode === 'copy') {
        if (seq[pos] === i) {
          pos++; renderTrack();
          if (pos >= seq.length) {
            copyRound++; ctx.good(); ctx.round(copyRound, COPY_ROUNDS);
            ctx.status(ctx.L({ ms: 'Sama! Hebat!', en: 'Same! Great!' }), 'good');
            if (copyRound >= COPY_ROUNDS) ctx.later(() => ctx.win(), 1000); else ctx.later(startCopy, 1300);
          }
        } else {
          ctx.bad(); wiggle(bars[i]); pos = 0; renderTrack();
          ctx.status(ctx.L({ ms: 'Tidak mengapa! Dengar sekali lagi.', en: "That's okay! Listen once more." }), 'try');
          listening = true;
          seq.forEach((b, k) => ctx.later(() => sound(b), 900 + k * 620));
          ctx.later(() => { listening = false; ctx.status(ctx.L({ ms: 'Giliran kamu!', en: 'Your turn!' })); }, 900 + seq.length * 620);
        }
      }
    }
    // slide a finger across the bars to play a glissando
    let down = false, last = -1;
    const xylo = root.querySelector('.mu-xylo');
    xylo.addEventListener('pointerdown', (e) => { const b = e.target.closest('.mu-bar'); if (!b) return; down = true; last = Number(b.dataset.i); try { xylo.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } press(last); });
    xylo.addEventListener('pointermove', (e) => {
      if (!down) return;
      const b = document.elementsFromPoint(e.clientX, e.clientY).find((n) => n.classList && n.classList.contains('mu-bar'));
      if (b && Number(b.dataset.i) !== last) { last = Number(b.dataset.i); press(last); }
    });
    const up = () => { down = false; last = -1; };
    xylo.addEventListener('pointerup', up); xylo.addEventListener('pointercancel', up);
    xylo.addEventListener('keydown', (e) => { const b = e.target.closest('.mu-bar'); if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); press(Number(b.dataset.i)); } });
    modes.addEventListener('click', (e) => { const b = e.target.closest('[data-mode]'); if (b) setMode(b.dataset.mode); });
    setMode(mode);
    if (!ctx.audioOk()) ctx.status(ctx.L({ ms: 'Bunyi tidak tersedia, tetapi bilah tetap bercahaya.', en: 'Sound is not available, but the bars still light up.' }), 'try');
    return {
      destroy() { root.remove(); }, restart() { setMode(mode); },
      debug: () => ({ mode, pos, length: seq.length, expected: seq[pos], listening, copyRound, songDone, bars: bars.map((b) => { const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }) })
    };
  }
};
