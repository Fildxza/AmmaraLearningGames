// The narrator: one place that reads text aloud with the voices installed on this device (Web Speech API).
//
// Rules this service keeps (see research/UPGRADE-RESEARCH-REPORT.md):
//  - only voices with localService === true are used, so nothing is ever sent over the internet;
//  - one voice speaks at a time: a new line either replaces the current one or waits in a short queue;
//  - speech stops when the screen changes (callers use stop());
//  - nothing in Arabic script is ever spoken: Quran text and recitation are never produced by text-to-speech;
//  - the service tells the truth: when no voice exists for a language it says so and the text is shown instead;
//  - the browser cannot tell us whether a voice sounds "cute" or is female. We only guess "likely female" from
//    well-known voice names, and label it as a guess. A person has to listen and choose.
import { report } from './system.js';

const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

// Voice names that are commonly female / male. A guess, never a promise.
const FEMALE_HINTS = /\b(female|woman|girl|zira|aria|jenny|michelle|hazel|susan|heera|emma|ana|sonia|libby|maisie|natasha|clara|catherine|linda|eva|hedda|samantha|karen|moira|tessa|fiona|victoria|allison|ava|serena|kate|amira|damayanti|yasmin|gadis|fenny|zoe|ellie|joanna|salli|kendra|kimberly|ivy|amy|emily|nicole|olivia|raveena|aditi|ayanda|lekha|veena|isabella|jessa)\b/i;
const MALE_HINTS = /\b(male|man|boy|david|mark|george|guy|james|ryan|thomas|daniel|alex|fred|osman|rizwan|andika|rishi|richard|brian|eric|jacob|justin|matthew|joey|russell|geraint|ravi|hemant|jorge)\b/i;

export const SAMPLE = {
  ms: 'Hai! Jom belajar bersama!',
  en: "Hi! Let's learn together!"
};
export const RATE_RANGE = { min: 0.6, max: 1.2 };
export const PITCH_RANGE = { min: 0.9, max: 1.3 };          // limited on purpose: far outside this a voice stops sounding natural
export const DEFAULT_NARRATOR = { enabled: true, voiceUri: { ms: null, en: null }, rate: 0.92, pitch: 1.15, volume: 1 };

const clamp = (v, a, b) => Math.min(b, Math.max(a, Number.isFinite(+v) ? +v : a));

export function normaliseNarrator(raw) {
  const n = Object.assign({}, DEFAULT_NARRATOR, raw || {});
  n.voiceUri = Object.assign({ ms: null, en: null }, (raw && raw.voiceUri) || {});
  n.enabled = n.enabled !== false;
  n.rate = clamp(n.rate, RATE_RANGE.min, RATE_RANGE.max);
  n.pitch = clamp(n.pitch, PITCH_RANGE.min, PITCH_RANGE.max);
  n.volume = clamp(n.volume, 0, 1);
  return n;
}

/** Language preference per interface language: exact language first, then a close substitute (clearly labelled). */
const LANG_PREFS = { ms: [['ms'], ['id', 'in']], en: [['en']] };
const langOf = (v) => String(v.lang || '').toLowerCase().replace('_', '-');
const primary = (v) => langOf(v).split('-')[0];

export function describeVoice(v) {
  const name = v.name || '';
  const female = FEMALE_HINTS.test(name) ? true : MALE_HINTS.test(name) ? false : null;
  return { uri: v.voiceURI || name, name, lang: v.lang || '', local: !!v.localService, default: !!v.default, likelyFemale: female };
}

/** Pure ranking used by the service and by the unit tests. Returns candidate voices for a language, best first. */
export function rankVoices(allVoices, lang) {
  const prefs = LANG_PREFS[lang] || [[lang]];
  const out = [];
  allVoices.forEach((v, idx) => {
    if (!v.localService) return;                                // offline voices only
    const p = primary(v);
    const tier = prefs.findIndex((group) => group.includes(p));
    if (tier < 0) return;
    const d = describeVoice(v);
    // exact language first, then likely-female voices (guess), then the browser's default voice, then original order
    const score = (tier === 0 ? 0 : 1000) + (d.likelyFemale === true ? 0 : d.likelyFemale === null ? 100 : 200) + (d.default ? 0 : 10) + idx * 0.01;
    out.push({ voice: v, info: Object.assign(d, { substitute: tier > 0 }), score });
  });
  return out.sort((a, b) => a.score - b.score);
}

export function createNarrator({ initial, onChange = () => {}, onSpeaking = () => {} } = {}) {
  const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
  let cfg = normaliseNarrator(initial);
  let voices = [];
  let muted = false;
  let current = null;
  const queue = [];
  const history = [];
  let token = 0;

  const refresh = () => { try { voices = synth ? synth.getVoices() : []; } catch (e) { voices = []; } onChange(); };
  if (synth) {
    refresh();
    if (typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', refresh);
    // some browsers fill the list late and never fire the event
    let tries = 0;
    const poll = setInterval(() => { if (voices.length || ++tries > 10) { clearInterval(poll); return; } refresh(); }, 500);
  }

  function chosen(lang) {
    const ranked = rankVoices(voices, lang);
    if (!ranked.length) return null;
    const uri = cfg.voiceUri[lang];
    const picked = uri && ranked.find((r) => (r.voice.voiceURI || r.voice.name) === uri);
    return picked || ranked[0];
  }
  function statusFor(lang) {
    if (!synth) return { state: 'unsupported', voice: null };
    const c = chosen(lang);
    if (!c) return { state: 'no-voice', voice: null };
    return { state: cfg.enabled && !muted ? 'ready' : muted ? 'muted' : 'off', voice: c.info, substitute: c.info.substitute };
  }

  function finish(item, ok) {
    if (current !== item) return;
    current = null;
    onSpeaking(false, item);
    if (item.done) { try { item.done(ok); } catch (e) { /* ignore */ } }
    next();
  }
  function next() {
    if (current || !queue.length) return;
    const item = queue.shift();
    run(item);
  }
  function run(item) {
    const c = chosen(item.lang);
    if (!synth || !c) { if (item.done) item.done(false); next(); return; }
    try {
      const u = new SpeechSynthesisUtterance(item.text);
      u.voice = c.voice; u.lang = c.voice.lang;
      u.rate = item.rate !== undefined ? item.rate : cfg.rate;
      u.pitch = item.pitch !== undefined ? item.pitch : cfg.pitch;
      u.volume = cfg.volume;
      current = item;
      item.utterance = u;
      u.onend = () => finish(item, true);
      u.onerror = () => finish(item, false);
      history.push({ text: item.text, lang: item.lang, voice: c.voice.name, voiceLang: c.voice.lang, rate: u.rate, pitch: u.pitch, volume: u.volume, kind: item.kind, at: Date.now() });
      if (history.length > 50) history.shift();
      onSpeaking(true, item);
      synth.speak(u);
    } catch (e) {
      report('SPEECH', 'Read-aloud failed', e, 'warn');
      current = null;
      onSpeaking(false, item);
      if (item.done) item.done(false);
    }
  }

  return {
    get supported() { return !!synth; },
    get settings() { return JSON.parse(JSON.stringify(cfg)); },
    get muted() { return muted; },
    get speaking() { return !!current; },
    get history() { return history.slice(); },
    status: statusFor,
    available: (lang) => !!(synth && chosen(lang)),
    voiceFor: (lang) => { const c = chosen(lang); return c ? c.voice : null; },
    /** Voices for the settings list: offline ones for this language, best first, with honest labels. */
    voices(lang) { return rankVoices(voices, lang).map((r) => r.info); },
    allVoiceCount: () => voices.length,
    configure(patch) {
      cfg = normaliseNarrator(Object.assign({}, cfg, patch, patch && patch.voiceUri ? { voiceUri: Object.assign({}, cfg.voiceUri, patch.voiceUri) } : {}));
      if (!cfg.enabled) this.stop();
      onChange(cfg);
      return this.settings;
    },
    setMuted(m) { muted = !!m; if (muted) this.stop(); },
    /**
     * Reads `text`. kind: 'prompt' | 'help' | 'greeting' | 'ui'. By default it replaces whatever is being said.
     * Returns false (and says nothing) when narration is off, muted, has no voice, or the text is in Arabic script.
     */
    speak(text, lang, { kind = 'prompt', queue: enqueue = false, done = null, force = false, rate, pitch } = {}) {
      const clean = String(text || '').replace(/\s+/g, ' ').trim();
      if (!clean) return false;
      if (ARABIC.test(clean)) { report('QURAN_TTS_BLOCKED', 'Arabic text is never read by the text-to-speech narrator.', null, 'warn'); return false; }
      if (!synth || (!force && (!cfg.enabled || muted))) return false;
      if (!chosen(lang)) return false;
      const item = { text: clean, lang, kind, done, rate, pitch, id: ++token };
      if (!enqueue) { queue.length = 0; if (current) { const old = current; current = null; try { synth.cancel(); } catch (e) { /* ignore */ } onSpeaking(false, old); if (old.done) old.done(false); } }
      else if (queue.length >= 3) queue.shift();
      queue.push(item);
      next();
      return true;
    },
    /** Plays the sample sentence with the current settings (also when narration is switched off). */
    preview(lang) { return this.speak(SAMPLE[lang] || SAMPLE.en, lang, { kind: 'ui', force: !muted }); },
    stop() {
      queue.length = 0;
      const old = current;
      current = null;
      try { if (synth) synth.cancel(); } catch (e) { /* ignore */ }
      if (old) { onSpeaking(false, old); if (old.done) old.done(false); }
    }
  };
}
