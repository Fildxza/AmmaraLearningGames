import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT } from './helpers.mjs';
import { SURAHS, BISMILLAH, QURAN_NOTICE, QURAN_SOURCE } from '../../src/data/quran-data.js';

// The Quran text must be the Tanzil Uthmani text, verbatim (Tanzil terms: "changing it is not allowed").
const SOURCE = path.join(ROOT, 'research/sources/tanzil/quran-uthmani.txt');
const lines = fs.readFileSync(SOURCE, 'utf8').split(/\r?\n/).filter((l) => /^\d+\|\d+\|/.test(l));
const tanzil = new Map(lines.map((l) => { const [s, a, ...t] = l.split('|'); return [`${s}:${a}`, t.join('|')]; }));

const EXPECTED_ORDER = [1, 114, 113, 112, 111, 110, 109, 108, 107, 106, 105, 104, 103, 102, 101, 100, 99, 98, 97, 96];
const EXPECTED_AYAHS = { 1: 7, 114: 6, 113: 5, 112: 4, 111: 5, 110: 3, 109: 6, 108: 3, 107: 7, 106: 4, 105: 5, 104: 9, 103: 3, 102: 8, 101: 11, 100: 11, 99: 8, 98: 8, 97: 5, 96: 19 };

test('the bundled source file is the downloaded Tanzil file (hash recorded at download time)', () => {
  const hash = crypto.createHash('sha256').update(fs.readFileSync(SOURCE)).digest('hex');
  assert.equal(hash, QURAN_SOURCE.fileSha256);
  assert.equal(lines.length, 6236, 'a complete Tanzil text has 6236 verses');
});

test('surahs appear in the school display sequence, with their real surah numbers and verse counts', () => {
  assert.deepEqual(SURAHS.map((s) => s.no), EXPECTED_ORDER);
  for (const s of SURAHS) {
    assert.equal(s.ayahCount, EXPECTED_AYAHS[s.no], `surah ${s.no}`);
    assert.equal(s.ayahs.length, s.ayahCount);
    s.ayahs.forEach((a, i) => assert.equal(a.n, i + 1));
  }
});

test('every verse is byte-for-byte identical to the Tanzil text', () => {
  let n = 0;
  for (const s of SURAHS) for (const a of s.ayahs) { assert.equal(a.text, tanzil.get(`${s.no}:${a.n}`), `${s.no}:${a.n}`); n++; }
  assert.equal(n, 137);
});

test('the Bismillah split of verse 1 is lossless and only used for display', () => {
  for (const s of SURAHS) {
    const a = s.ayahs[0];
    if (s.no === 1) { assert.equal(a.prefix, undefined); continue; }
    assert.ok(a.prefix && a.body, `surah ${s.no} has a Bismillah prefix in the Tanzil text`);
    assert.equal(`${a.prefix} ${a.body}`, a.text, `surah ${s.no}: prefix + body must rebuild the verse exactly`);
  }
  assert.equal(BISMILLAH, tanzil.get('1:1'));
});

test('per-surah hashes match the text, and the Tanzil notice is kept unchanged', () => {
  for (const s of SURAHS) {
    const h = crypto.createHash('sha256').update(s.ayahs.map((a) => a.text).join('\n')).digest('hex');
    assert.equal(h, s.textSha256, `surah ${s.no}`);
  }
  assert.match(QURAN_NOTICE, /CHANGING IT IS NOT ALLOWED/);
  assert.match(QURAN_NOTICE, /Tanzil/);
});

test('the Quran-learning screen code never sends Arabic to the narrator', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/engine/ui/islamic.js'), 'utf8');
  const calls = src.match(/narrate\(([^)]*)\)/g) || [];
  for (const c of calls) assert.doesNotMatch(c, /ayah|text|ar\b|BISMILLAH|\.ar/, c);
});
