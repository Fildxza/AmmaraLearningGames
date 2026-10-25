// All sound is synthesised with the Web Audio API: no audio files, no network.
// Music starts only after the first tap/key press (browser autoplay rules).

const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

const SONGS = {
  cheerful: {
    bpm: 104,
    chords: [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50], [48, 52, 55], [41, 45, 48], [43, 47, 50], [48, 52, 55]],
    melody: [
      [[0, 76, 1], [2, 79, 1], [4, 76, 1], [6, 72, 2]], [[0, 69, 1], [2, 72, 1], [4, 76, 3]], [[0, 69, 1], [2, 72, 1], [4, 69, 1], [6, 65, 2]], [[0, 67, 1], [2, 71, 1], [4, 74, 3]],
      [[0, 72, 1], [1, 76, 1], [2, 79, 1], [3, 76, 1], [4, 72, 3]], [[0, 69, 1], [2, 72, 1], [4, 77, 1], [6, 76, 1], [7, 74, 1]], [[0, 74, 1], [2, 71, 1], [4, 67, 1], [6, 69, 1], [7, 71, 1]], [[0, 72, 5]]
    ],
    drums: true, pad: false
  },
  calm: {
    bpm: 74,
    chords: [[41, 45, 48, 52], [38, 41, 45, 48], [46, 50, 53, 57], [48, 52, 55, 58], [41, 45, 48, 52], [45, 48, 52, 55], [46, 50, 53, 57], [48, 52, 55, 60]],
    melody: [
      [[0, 72, 2], [2, 77, 2], [4, 76, 4]], [[0, 74, 4], [4, 69, 4]], [[0, 74, 2], [2, 72, 2], [4, 70, 4]], [[0, 72, 6]],
      [[0, 77, 2], [2, 81, 2], [4, 79, 4]], [[0, 76, 4], [4, 72, 4]], [[0, 74, 2], [2, 77, 2], [4, 74, 4]], [[0, 72, 6]]
    ],
    drums: false, pad: true
  },
  // garden: bright pentatonic marimba with light birdsong
  yard: {
    bpm: 112,
    chords: [[43, 47, 50], [48, 52, 55], [50, 54, 57], [43, 47, 50], [48, 52, 55], [43, 47, 50], [50, 54, 57], [43, 47, 50]],
    melody: [
      [[0, 83, 1], [2, 86, 1], [4, 83, 1], [6, 79, 2]], [[0, 84, 1], [2, 88, 1], [4, 84, 1], [6, 79, 2]], [[0, 86, 1], [2, 90, 1], [4, 86, 1], [6, 81, 2]], [[0, 83, 2], [3, 79, 1], [4, 79, 3]],
      [[0, 84, 1], [2, 88, 1], [4, 91, 1], [6, 88, 1]], [[0, 86, 1], [2, 83, 1], [4, 79, 3]], [[0, 86, 1], [2, 90, 1], [4, 93, 1], [6, 90, 1]], [[0, 91, 2], [4, 83, 1], [6, 79, 2]]
    ],
    drums: true, pad: false, ambient: 'birds', soft: true
  },
  // arcade: chiptune-style square-wave tune
  arcade: {
    bpm: 132,
    chords: [[45, 48, 52], [41, 45, 48], [48, 52, 55], [43, 47, 50], [45, 48, 52], [41, 45, 48], [48, 52, 55], [43, 47, 50]],
    melody: [
      [[0, 81, 1], [1, 84, 1], [2, 88, 1], [3, 84, 1], [4, 81, 1], [5, 84, 1], [6, 88, 2]], [[0, 77, 1], [1, 81, 1], [2, 84, 1], [3, 81, 1], [4, 77, 1], [5, 81, 1], [6, 84, 2]],
      [[0, 84, 1], [1, 88, 1], [2, 91, 1], [3, 88, 1], [4, 84, 1], [5, 88, 1], [6, 91, 2]], [[0, 79, 1], [1, 83, 1], [2, 86, 1], [3, 83, 1], [4, 79, 1], [5, 83, 1], [6, 86, 2]],
      [[0, 81, 1], [1, 84, 1], [2, 88, 1], [3, 93, 1], [4, 88, 1], [5, 84, 1], [6, 81, 2]], [[0, 77, 1], [1, 81, 1], [2, 84, 1], [3, 89, 1], [4, 84, 1], [5, 81, 1], [6, 77, 2]],
      [[0, 84, 1], [1, 88, 1], [2, 91, 1], [3, 96, 1], [4, 91, 1], [5, 88, 1], [6, 84, 2]], [[0, 83, 2], [2, 86, 2], [4, 91, 4]]
    ],
    drums: true, pad: false, lead: 'square'
  },
  // quiet, slow and plain: a soft pad with a few long bell notes (no rhythm, nothing that imitates recitation)
  islamic: {
    bpm: 58,
    chords: [[38, 45, 50, 54], [43, 47, 50, 55], [45, 49, 52, 57], [38, 45, 50, 54], [38, 45, 50, 54], [43, 47, 50, 55], [45, 49, 52, 57], [38, 45, 50, 54]],
    melody: [[[0, 74, 4], [4, 78, 4]], [[0, 76, 8]], [[0, 78, 4], [4, 76, 4]], [[0, 74, 8]], [[0, 78, 4], [4, 81, 4]], [[0, 79, 8]], [[0, 76, 4], [4, 74, 4]], [[0, 74, 8]]],
    drums: false, pad: true, hush: true
  },
  // celebration screens: bright and short-phrased
  reward: {
    bpm: 120,
    chords: [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50], [48, 52, 55], [45, 48, 52], [41, 45, 48], [48, 52, 55]],
    melody: [
      [[0, 84, 1], [1, 88, 1], [2, 91, 1], [4, 96, 3]], [[0, 93, 1], [1, 88, 1], [2, 84, 1], [4, 88, 3]], [[0, 89, 1], [1, 93, 1], [2, 96, 1], [4, 93, 3]], [[0, 91, 1], [1, 88, 1], [2, 86, 1], [4, 91, 3]],
      [[0, 84, 1], [1, 88, 1], [2, 91, 1], [4, 96, 3]], [[0, 93, 1], [1, 91, 1], [2, 88, 1], [4, 84, 3]], [[0, 89, 1], [1, 91, 1], [2, 93, 1], [4, 96, 3]], [[0, 96, 4]]
    ],
    drums: true, pad: false
  }
};
// the town: a bouncy, busy-street tune
SONGS.town = {
  bpm: 116,
  chords: [[48, 52, 55], [53, 57, 60], [55, 59, 62], [48, 52, 55], [45, 48, 52], [53, 57, 60], [55, 59, 62], [48, 52, 55]],
  melody: [
    [[0, 79, 1], [1, 81, 1], [2, 84, 2], [4, 81, 1], [6, 79, 2]], [[0, 77, 1], [2, 81, 1], [4, 84, 2], [6, 81, 1]], [[0, 83, 1], [2, 86, 1], [4, 83, 1], [6, 79, 2]], [[0, 84, 3], [4, 79, 2]],
    [[0, 76, 1], [1, 79, 1], [2, 81, 2], [4, 84, 1], [6, 81, 1]], [[0, 77, 1], [2, 81, 1], [4, 86, 2]], [[0, 86, 1], [1, 84, 1], [2, 83, 1], [4, 81, 2]], [[0, 84, 4]]
  ],
  drums: true, pad: false, soft: true
};
// Which song belongs to which scene. 'playroom' uses the style the teacher/child picked (cheerful or calm).
const SCENE_SONG = { playroom: null, calm: 'calm', yard: 'yard', arcade: 'arcade', islamic: 'islamic', reward: 'reward', town: 'town' };

export function createAudio(initial, onError = () => {}) {
  let ctx = null, master, musicBus, sfxBus, comp, noiseBuf;
  let failed = false;
  const s = Object.assign({ enabled: true, music: true, musicVolume: 0.45, effectsVolume: 0.75, style: 'cheerful' }, initial);
  let playing = false, timer = null, nextTime = 0, step = 0, gestureSeen = false;
  let scene = 'playroom', holding = false, sceneToken = 0, voiceDuck = 1;
  const songKey = () => SCENE_SONG[scene] || s.style;
  const musicLevel = () => (s.music ? 0.3 * s.musicVolume * voiceDuck : 0);

  function ensure() {
    if (ctx || failed) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) throw new Error('Web Audio API not supported');
      ctx = new AC();
      comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.2;
      master = ctx.createGain();
      musicBus = ctx.createGain();
      sfxBus = ctx.createGain();
      musicBus.connect(master); sfxBus.connect(master); master.connect(comp); comp.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      applyLevels(true);
    } catch (e) {
      failed = true;
      ctx = null;
      onError(e);
    }
    return ctx;
  }
  function applyLevels(immediate) {
    if (!ctx) return;
    const now = ctx.currentTime;
    const set = (param, v) => { param.cancelScheduledValues(now); if (immediate) param.setValueAtTime(v, now); else param.setTargetAtTime(v, now, 0.08); };
    set(master.gain, s.enabled ? 1 : 0);
    set(musicBus.gain, musicLevel());
    set(sfxBus.gain, 0.62 * s.effectsVolume);
  }

  // ---- instruments -------------------------------------------------------------
  function env(g, t, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dur);
  }
  function tone(bus, type, freq, t, a, peak, dur, filterHz) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    env(g, t, a, peak, dur);
    if (filterHz) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filterHz; o.connect(f); f.connect(g); } else o.connect(g);
    g.connect(bus);
    o.start(t); o.stop(t + a + dur + 0.05);
  }
  function bell(bus, m, t, dur = 0.9, vol = 0.22) {
    const f = midiHz(m);
    tone(bus, 'sine', f, t, 0.006, vol, dur);
    tone(bus, 'sine', f * 2.003, t, 0.004, vol * 0.25, dur * 0.5);
    tone(bus, 'triangle', f, t, 0.01, vol * 0.18, dur * 0.7, 2400);
  }
  function marimba(bus, m, t, vol = 0.12) {
    const f = midiHz(m);
    tone(bus, 'sine', f, t, 0.004, vol, 0.32);
    tone(bus, 'sine', f * 3.99, t, 0.002, vol * 0.12, 0.06);
  }
  function lead(bus, m, t, dur = 0.2, vol = 0.07) { tone(bus, 'square', midiHz(m), t, 0.004, vol, dur, 2600); }
  function chirp(bus, t) {
    const f = 2400 + Math.random() * 1400, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.35, t + 0.07); o.frequency.exponentialRampToValueAtTime(f * 0.9, t + 0.16);
    env(g, t, 0.01, 0.03, 0.16); o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.3);
  }
  function bass(bus, m, t, dur, vol = 0.2) { tone(bus, 'triangle', midiHz(m), t, 0.01, vol, dur, 700); }
  function pad(bus, notes, t, dur, vol = 0.05) {
    for (const m of notes) {
      for (const det of [-4, 4]) {
        const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
        o.type = 'triangle'; o.frequency.value = midiHz(m + 12); o.detune.value = det;
        f.type = 'lowpass'; f.frequency.value = 1100;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.5);
        g.gain.linearRampToValueAtTime(vol * 0.8, t + dur - 0.3);
        g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.4);
        o.connect(f); f.connect(g); g.connect(bus);
        o.start(t); o.stop(t + dur + 0.5);
      }
    }
  }
  function noise(bus, t, dur, hz, vol, type = 'bandpass') {
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuf; f.type = type; f.frequency.value = hz; f.Q.value = 0.8;
    env(g, t, 0.004, vol, dur);
    src.connect(f); f.connect(g); g.connect(bus);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
  }
  function kick(bus, t, vol = 0.22) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
    env(g, t, 0.003, vol, 0.16);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.22);
  }

  // ---- music scheduler -------------------------------------------------------------
  function scheduleStep(song, t) {
    const bar = Math.floor(step / 8) % 8, beat = step % 8;
    const chord = song.chords[bar];
    const stepDur = 60 / song.bpm / 2;
    if (song.pad && beat === 0) pad(musicBus, chord, t, stepDur * 8, song.hush ? 0.03 : 0.035);
    if (!song.pad) {
      if (beat === 0 || beat === 4) bass(musicBus, chord[0] - 12 + 12, t, stepDur * 3.5, song.soft ? 0.12 : 0.17);
      const arp = [0, 1, 2, 1, 0, 2, 1, 2][beat];
      marimba(musicBus, chord[arp % chord.length] + 12, t, song.soft ? 0.05 : 0.07);
    } else if (beat % 2 === 0 && !song.hush) {
      marimba(musicBus, chord[(beat / 2) % chord.length] + 24, t, 0.035);
    }
    for (const [st, m, len] of song.melody[bar]) {
      if (st !== beat) continue;
      if (song.lead) lead(musicBus, m, t, stepDur * (len || 1) * 0.9, 0.06);
      else bell(musicBus, m, t, stepDur * (len || 1) * (song.hush ? 2.6 : 1.8), song.pad ? (song.hush ? 0.08 : 0.11) : 0.13);
    }
    if (song.ambient === 'birds' && Math.random() < 0.035) chirp(musicBus, t + Math.random() * stepDur);
    if (song.drums) {
      if (beat === 0 || beat === 4) kick(musicBus, t, 0.16);
      if (beat % 2 === 1) noise(musicBus, t, 0.04, 7000, 0.05, 'highpass');
    }
    step++;
  }
  function pump() {
    if (!ctx || !playing || holding) return;
    const song = SONGS[songKey()] || SONGS.cheerful;
    const stepDur = 60 / song.bpm / 2;
    while (nextTime < ctx.currentTime + 0.3) {
      scheduleStep(song, nextTime);
      nextTime += stepDur;
    }
  }
  function startMusic() {
    if (!ctx || playing || !s.music || !s.enabled) return;
    playing = true;
    step = 0;
    nextTime = ctx.currentTime + 0.12;
    pump();
    timer = setInterval(pump, 60);
  }
  function stopMusic() {
    playing = false;
    if (timer) { clearInterval(timer); timer = null; }
  }
  function duck() {
    if (!ctx) return;
    const now = ctx.currentTime;
    const v = musicLevel();
    musicBus.gain.cancelScheduledValues(now);
    musicBus.gain.setTargetAtTime(v * 0.45, now, 0.03);
    musicBus.gain.setTargetAtTime(v, now + 0.7, 0.25);
  }

  // ---- effects ---------------------------------------------------------------------
  const FX = {
    tap() { tone(sfxBus, 'sine', 740, ctx.currentTime, 0.004, 0.12, 0.07); },
    open() { const t = ctx.currentTime; noise(sfxBus, t, 0.22, 1400, 0.05); bell(sfxBus, 79, t + 0.05, 0.4, 0.12); },
    correct() { duck(); const t = ctx.currentTime; [72, 76, 79, 84].forEach((m, i) => bell(sfxBus, m, t + i * 0.085, 0.7, 0.2)); [96, 100].forEach((m, i) => tone(sfxBus, 'sine', midiHz(m), t + 0.36 + i * 0.06, 0.004, 0.04, 0.25)); },
    wrong() { duck(); const t = ctx.currentTime; tone(sfxBus, 'triangle', midiHz(67), t, 0.02, 0.13, 0.16, 1400); tone(sfxBus, 'triangle', midiHz(64), t + 0.17, 0.02, 0.11, 0.22, 1200); },
    reward() { const t = ctx.currentTime; [88, 91, 96].forEach((m, i) => bell(sfxBus, m, t + i * 0.07, 0.45, 0.1)); },
    next() { const t = ctx.currentTime; const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(500, t); o.frequency.exponentialRampToValueAtTime(1100, t + 0.25); env(g, t, 0.01, 0.07, 0.3); o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.4); },
    pop() { tone(sfxBus, 'sine', 520, ctx.currentTime, 0.003, 0.14, 0.09); tone(sfxBus, 'sine', 780, ctx.currentTime + 0.05, 0.003, 0.1, 0.1); },
    flip() { noise(sfxBus, ctx.currentTime, 0.06, 2400, 0.06); tone(sfxBus, 'triangle', 420, ctx.currentTime, 0.004, 0.07, 0.07); },
    match() { const t = ctx.currentTime; [76, 83].forEach((m, i) => bell(sfxBus, m, t + i * 0.09, 0.5, 0.16)); },
    place() { tone(sfxBus, 'triangle', 330, ctx.currentTime, 0.004, 0.12, 0.1, 1600); },
    win() { duck(); const t = ctx.currentTime; [72, 76, 79, 84, 88].forEach((m, i) => bell(sfxBus, m, t + i * 0.08, 0.8, 0.17)); },
    fanfare() {
      duck(); const t = ctx.currentTime;
      [[60, 64, 67], [65, 69, 72], [67, 71, 74], [72, 76, 79]].forEach((ch, i) => ch.forEach((m) => bell(sfxBus, m + 12, t + i * 0.22, i === 3 ? 1.2 : 0.4, 0.09)));
      [84, 88, 91, 96].forEach((m, i) => marimba(sfxBus, m, t + 0.9 + i * 0.07, 0.06));
    }
  };

  function onVisibility() {
    if (!ctx) return;
    if (document.hidden) ctx.suspend().catch(() => {});
    else if (s.enabled && gestureSeen) ctx.resume().catch(() => {});
  }
  document.addEventListener('visibilitychange', onVisibility);

  return {
    get available() { return !failed; },
    get state() { return ctx ? ctx.state : (failed ? 'unavailable' : 'not-started'); },
    get musicPlaying() { return playing; },
    get scene() { return scene; },
    get song() { return songKey(); },
    get volumes() { return { music: s.musicVolume, effects: s.effectsVolume, enabled: s.enabled, musicOn: s.music }; },
    /** Switches the background music profile with a short fade out / fade in, so two tracks never overlap. */
    setScene(name) {
      if (!(name in SCENE_SONG)) name = 'playroom';
      if (name === scene) return;
      const before = songKey();
      scene = name;
      if (songKey() === before) return;
      if (!ctx || !playing) return;
      const tok = ++sceneToken;
      holding = true;
      const now = ctx.currentTime;
      musicBus.gain.cancelScheduledValues(now);
      musicBus.gain.setTargetAtTime(0, now, 0.1);
      setTimeout(() => {
        if (tok !== sceneToken || !ctx) return;
        step = 0; nextTime = ctx.currentTime + 0.1; holding = false;
        musicBus.gain.cancelScheduledValues(ctx.currentTime);
        musicBus.gain.setTargetAtTime(musicLevel(), ctx.currentTime, 0.3);
        pump();
      }, 420);
    },
    /** Lowers the music while the narrator speaks. */
    setVoiceDuck(on) { voiceDuck = on ? 0.35 : 1; if (ctx) { const now = ctx.currentTime; musicBus.gain.cancelScheduledValues(now); musicBus.gain.setTargetAtTime(holding ? 0 : musicLevel(), now, 0.12); } },
    /** One bell/marimba note (the music-corner games). */
    note(midi, kind = 'bell') {
      if (!s.enabled || !gestureSeen || !ensure()) return false;
      try { if (kind === 'marimba') marimba(sfxBus, midi, ctx.currentTime, 0.2); else bell(sfxBus, midi, ctx.currentTime, 0.7, 0.2); return true; } catch (e) { onError(e); return false; }
    },
    get settings() { return Object.assign({}, s); },
    // Call from a user gesture (tap / key press).
    unlock() {
      gestureSeen = true;
      if (!s.enabled) return;
      if (!ensure()) return;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      startMusic();
    },
    play(name) {
      if (!s.enabled || !gestureSeen || !ensure() || !FX[name]) return false;
      try { FX[name](); return true; } catch (e) { onError(e); return false; }
    },
    set(next) {
      Object.assign(s, next);
      if (ctx) applyLevels(false);
      if ('style' in next && playing) { stopMusic(); startMusic(); }
      if (!s.enabled || !s.music) stopMusic();
      else if (gestureSeen && ensure()) { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); startMusic(); }
    },
    dispose() { stopMusic(); document.removeEventListener('visibilitychange', onVisibility); if (ctx) ctx.close(); }
  };
}
