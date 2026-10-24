// "Jom Mengaji": Hijaiyah letters, simple original exercises and a library of 20 short surahs.
//
// Rules kept here (see research/ISLAMIC-CONTENT-REVIEW.md):
//  - Quran text comes only from src/data/quran-data.js (Tanzil Uthmani, verbatim) and is shown exactly as stored;
//  - nothing Arabic is ever passed to the narrator (the narrator also refuses Arabic script by itself);
//  - no recitation audio is bundled, so there is no Play button for recitation;
//  - "viewed" is recorded, never "memorised" or "mastered";
//  - every screen says the content is awaiting review by a qualified teacher.
import { $, esc, show } from './dom.js';
import { G } from './glyphs.js';
import { t } from '../i18n.js';
import { SURAHS, BISMILLAH, QURAN_SOURCE } from '../../data/quran-data.js';
import { HIJAIYAH, HIJAIYAH_BY_CHAR, FAMILIES, HARAKAT, STAGES, letterWith } from '../../data/hijaiyah.js';
import { levelFor } from '../minigames/logic.js';

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const arNum = (n) => String(n).replace(/\d/g, (d) => AR_DIGITS[d]);
const shuffle = (a) => a.slice().sort(() => Math.random() - 0.5);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

const TXT = {
  ms: {
    letters: 'Huruf Hijaiyah', surahs: 'Surah Pilihan', about: 'Tentang kandungan', sequence: 'Susunan dalam senarai ini mengikut pilihan sekolah (bukan susunan mushaf). Nombor surah sebenar ditunjukkan.',
    surahNo: 'Surah ke-{n}', ayahs: '{n} ayat', viewed: 'Sudah dilihat', open: 'Buka', prev: 'Sebelum', next: 'Seterusnya', allLetters: 'Semua huruf',
    dotsNone: 'Tiada titik', dotsAbove: '{n} titik di atas', dotsBelow: '{n} titik di bawah', family: 'Bentuk serupa:', noAudio: 'Bunyi sebutan dan bacaan Al-Quran tidak disertakan. Minta guru atau ibu bapa menyebutnya bersama-sama.',
    review: 'Kandungan ini belum disemak oleh guru Al-Quran yang bertauliah.', source: 'Teks Al-Quran: Tanzil Project (teks Uthmani, CC BY 3.0), disalin tanpa sebarang perubahan. Sumber: tanzil.net',
    qWhich: 'Yang mana sama dengan huruf ini?', qDots: 'Huruf mana yang ada {d}?', qHarakat: 'Yang mana ada {h}?', round: 'Soalan {i} daripada {n}', wellDone: 'Syabas! Kamu sudah selesai.',
    tryAgain: 'Hampir! Cuba lagi.', correct: 'Betul!', tapLetter: 'Ketik huruf untuk melihatnya dengan lebih besar.', marks: 'Tanda baris', bismillahNote: 'Bismillah dipaparkan sebagai pembuka surah.', bismillahIsAyah: 'Dalam Surah Al-Fatihah, Bismillah ialah ayat pertama.',
    aboutText: 'Teks Al-Quran diambil daripada Tanzil Project dan disimpan tepat seperti asal. Terjemahan tidak disertakan kerana lesen terjemahan yang ada tidak membenarkan penggunaan ini. Rakaman bacaan tidak disertakan kerana izin pengedarannya belum dapat disahkan; aplikasi ini tidak sekali-kali menggunakan suara komputer untuk membaca Al-Quran.',
    trace: 'Surih huruf'
  },
  en: {
    letters: 'Hijaiyah Letters', surahs: 'Selected Surahs', about: 'About this content', sequence: 'The order of this list follows the school\'s chosen sequence (not the order of the Mushaf). The real surah numbers are shown.',
    surahNo: 'Surah {n}', ayahs: '{n} verses', viewed: 'Viewed', open: 'Open', prev: 'Previous', next: 'Next', allLetters: 'All letters',
    dotsNone: 'No dots', dotsAbove: '{n} dot(s) above', dotsBelow: '{n} dot(s) below', family: 'Same shape:', noAudio: 'Letter sounds and Quran recitation are not included. Please ask a teacher or parent to say them together.',
    review: 'This content has not yet been checked by a qualified Quran teacher.', source: 'Quran text: Tanzil Project (Uthmani text, CC BY 3.0), copied without any change. Source: tanzil.net',
    qWhich: 'Which one is the same as this letter?', qDots: 'Which letter has {d}?', qHarakat: 'Which one has {h}?', round: 'Question {i} of {n}', wellDone: 'Well done! You have finished.',
    tryAgain: 'Almost! Try again.', correct: 'Correct!', tapLetter: 'Tap a letter to see it bigger.', marks: 'Vowel marks', bismillahNote: 'Bismillah is shown at the start of the surah.', bismillahIsAyah: 'In Surah Al-Fatihah, Bismillah is the first verse.',
    aboutText: 'The Quran text comes from the Tanzil Project and is kept exactly as published. No translation is included, because the available translation licences do not allow this use. No recitation recordings are included, because permission to distribute them could not be confirmed; this app never uses a computer voice to recite the Quran.',
    trace: 'Trace letters'
  }
};

export function createIslamic(host) {
  const root = $('#islamic');
  const T = (k, vars) => { let s = (TXT[host.lang()] || TXT.ms)[k] || k; if (vars) s = s.replace(/\{(\w+)\}/g, (m, v) => (vars[v] !== undefined ? vars[v] : m)); return s; };
  const L = (o) => (o ? o[host.lang()] || o.ms : '');
  let view = { name: 'home' };
  let quiz = null;

  const head = (title, backAct = 'home-view') => `<header class="screen-head isl-head">
      <button class="pill-btn" data-act="${backAct}" data-testid="isl-back">${G.back}<span>${esc(t('back'))}</span></button>
      <h2>${G.moon}<span>${esc(title)}</span></h2>
      <button class="icon-btn" data-act="sound" aria-label="${esc(host.soundOn() ? t('soundOn') : t('soundOff'))}">${host.soundOn() ? G.soundOn : G.soundOff}</button>
      <button class="icon-btn" data-act="home" data-testid="isl-home" aria-label="${esc(t('home'))}">${G.home}</button>
    </header>`;
  const foot = (withSource) => `<footer class="isl-foot"><p>${esc(T('review'))}</p>${withSource ? `<p>${esc(T('source'))}</p>` : ''}</footer>`;
  const viewedSurahs = () => { const g = host.activitySummary().games; return new Set(Object.keys(g).filter((k) => k.startsWith('islamic:surah:')).map((k) => Number(k.split(':')[2]))); };

  function render() {
    const v = view.name;
    if (v === 'home') return renderHome();
    if (v === 'letters') return renderLetters();
    if (v === 'letter') return renderLetter();
    if (v === 'surah') return renderSurah();
    if (v === 'about') return renderAbout();
    if (v === 'quiz') return renderQuiz();
    return renderHome();
  }
  function renderHome() {
    const seen = viewedSurahs();
    root.innerHTML = `${head(t('islamicTitle'), 'back')}
      <div class="isl-body">
        <p class="isl-intro">${esc(t('islamicIntro'))}</p>
        <h3>${esc(T('letters'))}</h3>
        <div class="isl-stages">${STAGES.map((s) => `<button class="isl-stage" data-stage="${s.id}" data-testid="isl-stage-${s.id}">
          <span class="isl-stage-ar" lang="ar" dir="rtl">${s.id === 'letters' ? 'ا ب ت' : s.id === 'match' ? 'ب = ب' : s.id === 'dots' ? 'ب ت ث' : s.id === 'harakat' ? 'بَ بِ بُ' : '✎ ج'}</span>
          <b>${esc(L(s.title))}</b><small>${esc(L(s.blurb))}</small></button>`).join('')}</div>
        <h3>${esc(T('surahs'))}</h3>
        <p class="isl-note">${esc(T('sequence'))}</p>
        <ol class="isl-surahs">${SURAHS.map((s, i) => `<li><button class="isl-surah ${seen.has(s.no) ? 'seen' : ''}" data-surah="${s.no}" data-testid="isl-surah-${s.no}">
          <span class="isl-pos">${i + 1}</span>
          <span class="isl-sname"><b>${esc(s.display)}</b><small>${esc(T('surahNo', { n: s.no }))} · ${esc(T('ayahs', { n: s.ayahCount }))}</small></span>
          <span class="isl-sar" lang="ar" dir="rtl">${esc(s.ar)}</span>
          ${seen.has(s.no) ? `<span class="isl-seen" title="${esc(T('viewed'))}">${G.check}</span>` : ''}</button></li>`).join('')}</ol>
        <button class="pill-btn" data-act="about" data-testid="isl-about">${G.info}<span>${esc(T('about'))}</span></button>
        ${foot(true)}
      </div>`;
  }
  function renderLetters() {
    root.innerHTML = `${head(T('allLetters'))}<div class="isl-body"><p class="isl-note">${esc(T('tapLetter'))}</p>
      <div class="isl-letters" dir="rtl">${HIJAIYAH.map((l) => `<button class="isl-letter" data-letter="${l.n}" data-testid="isl-letter-${l.n}" aria-label="${esc(l.name)}"><span lang="ar">${l.ar}</span><small dir="ltr">${esc(l.name)}</small></button>`).join('')}</div>
      <p class="isl-note">${esc(T('noAudio'))}</p>${foot(false)}</div>`;
  }
  function dotsText(l) { return !l.dots ? T('dotsNone') : T(l.dotsPos === 'above' ? 'dotsAbove' : 'dotsBelow', { n: l.dots }); }
  function renderLetter() {
    const l = HIJAIYAH[view.i];
    const fam = FAMILIES.find((f) => f.letters.includes(l.ar));
    root.innerHTML = `${head(l.name, 'letters')}<div class="isl-body isl-letter-view">
      <div class="isl-big" lang="ar" dir="rtl" data-testid="isl-big">${l.ar}</div>
      <p class="isl-lname">${esc(l.name)} · ${l.n} / 28</p>
      <p class="isl-dots">${esc(dotsText(l))}</p>
      ${fam ? `<p class="isl-fam">${esc(T('family'))} <span lang="ar" dir="rtl">${fam.letters.join('  ')}</span></p>` : ''}
      <h3>${esc(T('marks'))}</h3>
      <div class="isl-marks">${HARAKAT.slice(0, 3).map((h) => `<span class="isl-mark"><b lang="ar" dir="rtl">${letterWith(l.ar === 'ا' ? 'أ' : l.ar, h.id)}</b><small>${esc(L(h.name))}: ${esc(L(h.sound))}</small></span>`).join('')}</div>
      <div class="isl-nav"><button class="pill-btn" data-act="prev-letter" ${view.i === 0 ? 'disabled' : ''}>${G.back}<span>${esc(T('prev'))}</span></button>
        <button class="pill-btn" data-act="next-letter" data-testid="isl-next-letter" ${view.i === 27 ? 'disabled' : ''}><span>${esc(T('next'))}</span>${G.next}</button></div>
      <p class="isl-note">${esc(T('noAudio'))}</p>${foot(false)}</div>`;
  }
  function renderSurah() {
    const s = SURAHS.find((x) => x.no === view.no);
    const idx = SURAHS.indexOf(s);
    const ayahs = s.ayahs.map((a) => {
      const body = a.n === 1 && a.prefix && s.no !== 1 ? a.body : a.text;
      return `<span class="isl-ayah" data-n="${a.n}">${esc(body)} <span class="isl-ano" aria-label="${a.n}">﴿${arNum(a.n)}﴾</span></span>`;
    }).join(' ');
    root.innerHTML = `${head(s.display, 'home-view')}<div class="isl-body isl-surah-view">
      <div class="isl-shead"><span class="isl-sar big" lang="ar" dir="rtl">سورة ${esc(s.ar)}</span><span>${esc(T('surahNo', { n: s.no }))} · ${esc(T('ayahs', { n: s.ayahCount }))}</span></div>
      ${s.no !== 1 ? `<p class="isl-bism" lang="ar" dir="rtl" data-testid="isl-bismillah">${esc(BISMILLAH)}</p><p class="isl-note center">${esc(T('bismillahNote'))}</p>` : `<p class="isl-note center">${esc(T('bismillahIsAyah'))}</p>`}
      <div class="isl-quran" lang="ar" dir="rtl" data-testid="isl-quran">${ayahs}</div>
      <div class="isl-nav"><button class="pill-btn" data-act="prev-surah" ${idx === 0 ? 'disabled' : ''}>${G.back}<span>${esc(T('prev'))}</span></button>
        <button class="pill-btn" data-act="next-surah" data-testid="isl-next-surah" ${idx === SURAHS.length - 1 ? 'disabled' : ''}><span>${esc(T('next'))}</span>${G.next}</button></div>
      <p class="isl-note">${esc(T('noAudio'))}</p>${foot(true)}</div>`;
  }
  function renderAbout() {
    root.innerHTML = `${head(T('about'))}<div class="isl-body"><p>${esc(T('aboutText'))}</p><p>${esc(T('review'))}</p><p>${esc(T('source'))}</p>
      <p class="isl-note">Tanzil: ${esc(QURAN_SOURCE.textType)} · ${esc(QURAN_SOURCE.downloaded)}</p><p class="isl-note">${esc(t('nvNoQuran'))}</p></div>`;
  }

  // ---------------------------------------------------------------- exercises (match, dots, harakat)
  function makeQuestion(kind, level) {
    if (kind === 'match') {
      const target = pick(HIJAIYAH);
      const fam = FAMILIES.find((f) => f.letters.includes(target.ar));
      let others = level >= 3 && fam ? fam.letters.filter((x) => x !== target.ar) : [];
      others = others.concat(shuffle(HIJAIYAH.map((l) => l.ar).filter((x) => x !== target.ar && !others.includes(x) && (level >= 2 || !(fam && fam.letters.includes(x)))))).slice(0, 2);
      return { prompt: T('qWhich'), big: target.ar, options: shuffle([{ ar: target.ar, ok: true }, ...others.map((ar) => ({ ar, ok: false }))]) };
    }
    if (kind === 'dots') {
      const fam = pick(FAMILIES);
      const target = HIJAIYAH_BY_CHAR[pick(fam.letters)];
      const opts = fam.letters.map((ar) => ({ ar, ok: ar === target.ar }));
      while (opts.length < 3) { const extra = pick(HIJAIYAH); if (!opts.some((o) => o.ar === extra.ar) && dotsText(extra) !== dotsText(target)) opts.push({ ar: extra.ar, ok: false }); }
      return { prompt: T('qDots', { d: dotsText(target).toLowerCase() }), big: null, options: shuffle(opts.slice(0, 3)) };
    }
    const base = pick(HIJAIYAH.filter((l) => l.ar !== 'ا'));
    const marks = level <= 1 ? HARAKAT.slice(0, 3) : level === 2 ? HARAKAT.slice(0, 4) : HARAKAT;
    const set = shuffle(marks).slice(0, 3);
    const goal = pick(set);
    return { prompt: T('qHarakat', { h: L(goal.name) }), big: null, options: set.map((h) => ({ ar: letterWith(base.ar, h.id), ok: h.id === goal.id })) };
  }
  function startQuiz(kind) {
    quiz = { kind, i: 0, n: kind === 'match' ? 6 : 5, correct: 0, mistakes: 0, startedAt: Date.now(), q: null, done: false };
    quiz.q = makeQuestion(kind, levelFor(host.age()));
    view = { name: 'quiz' }; render();
  }
  function renderQuiz() {
    const q = quiz.q;
    const st = STAGES.find((s) => s.id === quiz.kind);
    root.innerHTML = `${head(L(st.title))}<div class="isl-body isl-quiz">
      <p class="isl-round">${esc(T('round', { i: quiz.i + 1, n: quiz.n }))}</p>
      <h3 class="isl-q">${esc(q.prompt)}</h3>
      ${q.big ? `<div class="isl-big small" lang="ar" dir="rtl">${q.big}</div>` : ''}
      <div class="isl-opts" dir="rtl">${q.options.map((o, i) => `<button class="isl-opt" data-opt="${i}" data-testid="isl-opt-${i}" ${o.ok ? 'data-ok="1"' : ''}><span lang="ar">${o.ar}</span></button>`).join('')}</div>
      <p class="isl-fb" role="status"></p>${foot(false)}</div>`;
  }
  function answer(i, btn) {
    if (!quiz || quiz.done) return;
    const o = quiz.q.options[i];
    const fb = root.querySelector('.isl-fb');
    if (o.ok) {
      quiz.correct++; host.audio.play('correct'); btn.classList.add('right');
      root.querySelectorAll('.isl-opt').forEach((b) => { b.disabled = true; });
      fb.textContent = T('correct'); fb.className = 'isl-fb good';
      setTimeout(() => {
        if (!quiz || view.name !== 'quiz') return;
        quiz.i++;
        if (quiz.i >= quiz.n) return finishQuiz();
        quiz.q = makeQuestion(quiz.kind, levelFor(host.age())); render();
      }, 900);
    } else { quiz.mistakes++; host.audio.play('wrong'); btn.disabled = true; btn.classList.add('tried'); fb.textContent = T('tryAgain'); fb.className = 'isl-fb try'; }
  }
  function finishQuiz() {
    quiz.done = true;
    const r = host.reward('st_q_letters');
    host.record({ kind: 'islamic', game: quiz.kind, level: levelFor(host.age()), startedAt: quiz.startedAt, completed: true, rounds: quiz.n, correct: quiz.correct, mistakes: quiz.mistakes, sticker: r.isNew ? 'st_q_letters' : '' });
    host.audio.play('win');
    host.narrate(T('wellDone'), { kind: 'praise' });
    root.querySelector('.isl-quiz').innerHTML = `<div class="mg-end-card"><div class="mg-end-stars">${G.star}${G.star}${G.star}</div><h3>${esc(T('wellDone'))}</h3>
      ${r.isNew ? `<p class="mg-sticker"><span>${r.icon}</span>${esc(t('gameStickerNew', { name: r.name }))}</p>` : ''}
      <div class="mg-help-btns"><button class="btn btn-play" data-stage="${quiz.kind}" data-testid="isl-again">${G.redo}<span>${esc(t('playAgain'))}</span></button>
      <button class="btn btn-sky" data-act="home-view">${G.back}<span>${esc(t('back'))}</span></button></div></div>`;
  }
  function openSurah(no) {
    view = { name: 'surah', no };
    render();
    const before = viewedSurahs();
    if (!before.has(no)) {
      host.record({ kind: 'islamic', game: 'surah:' + no, level: 0, completed: true, rounds: 1, correct: 0, mistakes: 0 });
      if (before.size + 1 >= 3) { const r = host.reward('st_q_surah'); if (r.isNew) host.toast(t('gameStickerNew', { name: r.name }), { icon: r.icon, tone: 'reward' }); }
    }
    root.scrollTop = 0;
  }

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    const d = b.dataset;
    if (d.opt !== undefined) { answer(Number(d.opt), b); return; }
    host.audio.play('tap');
    if (d.stage) {
      if (d.stage === 'letters') { view = { name: 'letters' }; render(); }
      else if (d.stage === 'trace') host.trace();
      else startQuiz(d.stage);
    } else if (d.surah) openSurah(Number(d.surah));
    else if (d.letter) { view = { name: 'letter', i: Number(d.letter) - 1 }; render(); }
    else if (d.act === 'back') host.back();
    else if (d.act === 'home') host.home();
    else if (d.act === 'home-view') { quiz = null; view = { name: 'home' }; render(); }
    else if (d.act === 'letters') { view = { name: 'letters' }; render(); }
    else if (d.act === 'about') { view = { name: 'about' }; render(); }
    else if (d.act === 'sound') { host.toggleSound(); render(); }
    else if (d.act === 'prev-letter' || d.act === 'next-letter') { view.i += d.act === 'next-letter' ? 1 : -1; render(); }
    else if (d.act === 'prev-surah' || d.act === 'next-surah') { const i = SURAHS.findIndex((s) => s.no === view.no) + (d.act === 'next-surah' ? 1 : -1); if (SURAHS[i]) openSurah(SURAHS[i].no); }
    if (!b.isConnected) setTimeout(() => { const f = root.querySelector('button'); if (f) f.focus({ preventScroll: true }); }, 20);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || root.hidden) return;
    e.preventDefault();
    if (view.name === 'home') host.back();
    else if (view.name === 'letter') { view = { name: 'letters' }; render(); }
    else { quiz = null; view = { name: 'home' }; render(); }
  });

  return {
    open(start) {
      view = start && start.surah ? { name: 'surah', no: start.surah } : { name: 'home' };
      render(); show(root, true);
      setTimeout(() => { const f = root.querySelector('.isl-stage, button'); if (f) f.focus({ preventScroll: true }); }, 30);
    },
    close() { show(root, false); root.innerHTML = ''; quiz = null; },
    debug() {
      return { open: !root.hidden, view: view.name, surah: view.no || null, quiz: quiz ? { kind: quiz.kind, i: quiz.i, n: quiz.n, correct: quiz.correct, done: quiz.done, okIndex: quiz.q ? quiz.q.options.findIndex((o) => o.ok) : -1 } : null };
    }
  };
}
