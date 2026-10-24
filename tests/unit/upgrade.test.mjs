import test from 'node:test';
import assert from 'node:assert/strict';
import { validated } from './helpers.mjs';
import { isIconKey } from '../../src/engine/art/icons.js';
import {
  winner, chooseMove, emptyBoard, makePattern, makeDeck, MEMORY_PAIRS, makeCountRound, makeSortRound, checkLine, snapToLine, checkX,
  traceCoverage, TRACE_SETS, DOT_PICTURES, SHAPE_SETS, FIND_THEMES, makeFindRound, SONGS, XYLO_NOTES, levelFor, COUNT_ITEMS, MEMORY_KEYS, SORT_SETS
} from '../../src/engine/minigames/logic.js';
import { rankVoices, describeVoice, normaliseNarrator, createNarrator, PITCH_RANGE, RATE_RANGE } from '../../src/engine/narrator.js';
import { HIJAIYAH, FAMILIES, HARAKAT, letterWith } from '../../src/data/hijaiyah.js';
import { createProgress } from '../../src/engine/core/progress.js';
import { STRINGS } from '../../src/engine/i18n.js';

const seq = (vals) => { let i = 0; return () => vals[i++ % vals.length]; };

// ---------------------------------------------------------------- X and O
test('X and O: winner detection, draws and the robot friend', () => {
  assert.deepEqual(winner(['X', 'X', 'X', null, 'O', 'O', null, null, null]).mark, 'X');
  assert.equal(winner(['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X']).mark, 'draw');
  assert.equal(winner(emptyBoard()), null);
  const b = ['O', 'O', null, 'X', 'X', null, null, null, null];
  assert.equal(chooseMove(b, 'O', 3, () => 0.9), 2, 'level 3 takes a win');
  assert.equal(chooseMove(['X', 'X', null, null, 'O', null, null, null, null], 'O', 3, () => 0.9), 2, 'level 3 blocks');
  for (let k = 0; k < 200; k++) { const m = chooseMove(b, 'O', 1); assert.ok(m >= 0 && !b[m], 'level 1 picks an empty square'); }
  assert.equal(chooseMove(['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'], 'O', 2), -1);
});

// ---------------------------------------------------------------- generators
test('bead patterns repeat their unit and always offer the answer once', () => {
  for (const lv of [1, 2, 3]) for (let s = 0; s < 60; s++) {
    const p = makePattern(lv, s);
    p.full.forEach((b, i) => assert.equal(b, p.unit[i % p.unit.length]));
    assert.equal(p.answer, p.full[p.full.length - 1]);
    assert.equal(p.options.filter((o) => o === p.answer).length, 1);
    assert.equal(new Set(p.options).size, 3);
  }
});
test('memory decks hold every picture exactly twice', () => {
  for (const lv of [1, 2, 3]) {
    const d = makeDeck(MEMORY_PAIRS[lv], 7);
    assert.equal(d.length, MEMORY_PAIRS[lv] * 2);
    const count = {}; d.forEach((c) => { count[c.key] = (count[c.key] || 0) + 1; });
    assert.ok(Object.values(count).every((n) => n === 2));
  }
});
test('counting rounds stay in the age range and offer three different numbers', () => {
  const range = { 1: [1, 5], 2: [1, 10], 3: [5, 20] };
  for (const lv of [1, 2, 3]) for (let s = 0; s < 100; s++) {
    const r = makeCountRound(lv, s);
    assert.ok(r.n >= range[lv][0] && r.n <= range[lv][1]);
    assert.equal(new Set(r.options).size, 3);
    assert.ok(r.options.includes(r.n) && r.options.every((o) => o >= 1));
  }
});
test('sorting rounds put every item in an existing bin', () => {
  for (const lv of [1, 2, 3]) for (let s = 0; s < 20; s++) {
    const r = makeSortRound(lv, s);
    assert.ok(r.items.length >= 4);
    r.items.forEach((it) => assert.ok(it.bin >= 0 && it.bin < r.bins.length));
    r.bins.forEach((_, b) => assert.ok(r.items.some((it) => it.bin === b), 'every bin gets something'));
  }
});

// ---------------------------------------------------------------- drawing checks
test('straight-line check: straight strokes pass, wobbly or short ones do not', () => {
  const a = { x: 0, y: 0 }, b = { x: 300, y: 0 };
  const straight = Array.from({ length: 31 }, (_, i) => ({ x: i * 10, y: Math.sin(i) * 4 }));
  assert.ok(checkLine(straight, a, b).ok);
  const wobbly = straight.map((p, i) => ({ x: p.x, y: i % 2 ? 40 : -40 }));
  assert.equal(checkLine(wobbly, a, b).ok, false);
  assert.equal(checkLine(straight.slice(0, 15), a, b).ok, false, 'must reach the end dot');
  const s = snapToLine({ x: 150, y: 77 }, a, b);
  assert.equal(s.y, 0); assert.equal(s.t, 0.5);
  const at = { x: 100, y: 100 };
  assert.ok(checkX([{ x: 70, y: 70 }, { x: 130, y: 130 }], [{ x: 130, y: 70 }, { x: 70, y: 130 }], at));
  assert.equal(checkX([{ x: 70, y: 70 }, { x: 130, y: 130 }], [{ x: 72, y: 72 }, { x: 128, y: 128 }], at), false, 'parallel strokes are not an X');
});
test('tracing coverage grows with strokes over the shape and flags scribbles outside it', () => {
  const target = []; for (let x = 0; x <= 200; x += 6) for (let y = 0; y <= 30; y += 6) target.push({ x, y });
  assert.equal(traceCoverage(target, [], 20).coverage, 0);
  const along = Array.from({ length: 41 }, (_, i) => ({ x: i * 5, y: 15 }));
  const full = traceCoverage(target, along, 20);
  assert.ok(full.coverage > 0.95 && full.outside === 0);
  const half = traceCoverage(target, along.slice(0, 20), 20);
  assert.ok(half.coverage > 0.35 && half.coverage < 0.7);
  const outside = traceCoverage(target, along.map((p) => ({ x: p.x, y: p.y + 200 })), 20);
  assert.equal(outside.coverage, 0); assert.equal(outside.outside, 1);
});

// ---------------------------------------------------------------- content of the games
test('every picture a mini-game can show is a real picture key', () => {
  const keys = new Set([...MEMORY_KEYS, ...COUNT_ITEMS, ...Object.values(FIND_THEMES).flat(), ...Object.values(SHAPE_SETS).flat().map((k) => 'shape:' + k)]);
  Object.values(SORT_SETS).flat().forEach((s) => { s.bins.forEach((k) => keys.add(k)); s.items.forEach((k) => keys.add(k)); });
  for (const k of keys) assert.ok(isIconKey(k), k);
  for (const k of COUNT_ITEMS) assert.ok(isIconKey(`count:${k}:3`), 'count:' + k);
});
test('find-it rounds, dot pictures, trace sets and songs are well formed', () => {
  for (const lv of [1, 2, 3]) {
    const r = makeFindRound(lv, 'animals', 3);
    assert.equal(r.items[r.targetIndex], r.target);
    assert.equal(new Set(r.items).size, r.items.length, 'no duplicate pictures in the basket');
    for (const pic of DOT_PICTURES[lv]) { assert.ok(pic.pts.length >= 3); pic.pts.forEach(([x, y]) => assert.ok(x >= 0 && x <= 100 && y >= 0 && y <= 100)); }
    for (const glyphs of Object.values(TRACE_SETS[lv])) assert.ok(glyphs.length >= 3);
  }
  for (const s of Object.values(SONGS)) s.notes.forEach((n) => assert.ok(n >= 0 && n < XYLO_NOTES.length));
  assert.equal(levelFor('2-3'), 1); assert.equal(levelFor('3-4'), 2); assert.equal(levelFor('4+'), 3); assert.equal(levelFor('?'), 2);
});
test('every mini-game and Quran-learning sticker exists in the reward list', () => {
  const { config } = validated();
  for (const id of ['st_g_ruler', 'st_g_xo', 'st_g_dots', 'st_g_trace', 'st_g_memory', 'st_g_puzzle', 'st_g_find', 'st_g_patterns', 'st_g_counting', 'st_g_music', 'st_q_letters', 'st_q_surah']) {
    assert.equal(config.rewards[id] && config.rewards[id].type, 'sticker', id);
  }
});

// ---------------------------------------------------------------- narrator
const V = (name, lang, localService = true, def = false) => ({ name, lang, localService, default: def, voiceURI: name });
test('narrator voice ranking: offline only, exact language first, likely-female names preferred, Indonesian as a labelled substitute', () => {
  const voices = [V('Google Bahasa Indonesia', 'id-ID', false), V('Microsoft David - English (United States)', 'en-US', true, true), V('Microsoft Zira - English (United States)', 'en-US'),
    V('Microsoft Gadis - Indonesian', 'id-ID'), V('Microsoft Yasmin Online (Natural) - Malay', 'ms-MY', false)];
  const en = rankVoices(voices, 'en');
  assert.equal(en[0].info.name, 'Microsoft Zira - English (United States)');
  assert.equal(en[0].info.likelyFemale, true);
  assert.ok(en.every((r) => r.voice.localService));
  const ms = rankVoices(voices, 'ms');
  assert.equal(ms.length, 1, 'the online Malay voice is never used');
  assert.equal(ms[0].info.substitute, true);
  assert.equal(describeVoice(V('Microsoft David', 'en-US')).likelyFemale, false);
  assert.equal(describeVoice(V('Voice 7', 'en-US')).likelyFemale, null, 'unknown names stay unknown');
});
test('narrator settings are clamped: pitch stays in a natural, limited range', () => {
  const n = normaliseNarrator({ pitch: 2, rate: 5, volume: -1 });
  assert.equal(n.pitch, PITCH_RANGE.max); assert.equal(n.rate, RATE_RANGE.max); assert.equal(n.volume, 0);
  assert.equal(normaliseNarrator(null).enabled, true);
});
test('narrator never speaks Arabic script (no text-to-speech Quran recitation)', () => {
  const spoken = [];
  globalThis.window = { speechSynthesis: { getVoices: () => [V('Microsoft Zira', 'en-US'), V('Microsoft Rizwan', 'ms-MY')], speak: (u) => spoken.push(u), cancel() {}, addEventListener() {} } };
  globalThis.SpeechSynthesisUtterance = function U(text) { this.text = text; };
  const warn = console.warn; console.warn = () => {};
  try {
    const n = createNarrator({});
    assert.equal(n.speak('بِسْمِ ٱللَّهِ', 'ms'), false);
    assert.equal(n.speak('Hai! Jom belajar bersama!', 'ms'), true);
    assert.equal(spoken.length, 1);
    assert.equal(spoken[0].voice.name, 'Microsoft Rizwan');
    n.setMuted(true);
    assert.equal(n.speak('Hello', 'en'), false, 'muted means silent');
  } finally { console.warn = warn; delete globalThis.window; delete globalThis.SpeechSynthesisUtterance; }
});

// ---------------------------------------------------------------- Hijaiyah data
test('Hijaiyah: 28 different letters in order, families and marks are consistent', () => {
  assert.equal(HIJAIYAH.length, 28);
  assert.equal(new Set(HIJAIYAH.map((l) => l.ar)).size, 28);
  HIJAIYAH.forEach((l, i) => { assert.equal(l.n, i + 1); assert.match(l.ar, /^[ء-ي]$/); });
  const all = new Set(HIJAIYAH.map((l) => l.ar));
  FAMILIES.forEach((f) => f.letters.forEach((x) => assert.ok(all.has(x))));
  HARAKAT.forEach((h) => assert.match(h.mark, /^[ً-ْ]$/));
  assert.equal(letterWith('ب', 'fathah'), 'بَ');
});

// ---------------------------------------------------------------- records
test('activity records are kept apart: the 18-column station CSV is unchanged, the activity CSV has its own columns', () => {
  const { config } = validated();
  const p = createProgress({ config, load: () => null, save: () => true });
  p.ensureSession({ worldId: 'adventure', ageGroup: '3-4', lang: 'ms', defaultName: 'Ali' });
  const l = p.currentLearner();
  p.recordActivity({ kind: 'minigame', game: 'xo', level: 2, ageGroup: '3-4', completed: true, rounds: 1, correct: 1, mistakes: 0 });
  p.recordActivity({ kind: 'islamic', game: 'surah:112', completed: true, rounds: 1 });
  assert.equal(p.activities(l.id).length, 2);
  assert.equal(p.grantReward(l.id, 'st_g_xo').isNew, true);
  assert.equal(p.grantReward(l.id, 'st_g_xo').isNew, false, 'a sticker is given once');
  assert.equal(p.grantReward(l.id, 'party_hat').ok, false, 'only stickers can be granted this way');
  const T = Object.assign({}, STRINGS.en);
  const act = p.exportActivitiesCSV('all', 'en', T);
  assert.equal(act.rowCount, 2);
  assert.equal(act.csv.replace(/^﻿/, '').split(/\r?\n/)[0].split(',').length, 13);
  assert.equal(T.csvHeaders.length, 18, 'the station CSV still has 18 columns');
  assert.equal(p.activitySummary(l.id).games['minigame:xo'].completed, 1);
});
test('records saved by the first release load fine and gain an empty activity list', () => {
  const { config } = validated();
  const old = { version: 1, settings: {}, learners: {}, sessions: {}, runs: {}, currentSessionId: null, flags: {}, seq: { learner: 0, session: 0, run: 0 } };
  const p = createProgress({ config, load: () => old, save: () => true });
  assert.deepEqual(p.data.activities, []);
});
