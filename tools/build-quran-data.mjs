// Builds src/data/quran-data.js from the Tanzil Uthmani text that was downloaded into research/sources/tanzil/.
// Nothing is typed from memory: every Arabic character below comes from that file, verbatim.
//
//   node tools/build-quran-data.mjs            # build + offline checks
//   node tools/build-quran-data.mjs --crosscheck   # also compares with a second source (needs internet; development only)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TANZIL = path.join(ROOT, 'research/sources/tanzil');
const raw = fs.readFileSync(path.join(TANZIL, 'quran-uthmani.txt'), 'utf8');
const metaSrc = fs.readFileSync(path.join(TANZIL, 'quran-data.js'), 'utf8');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

// The learning sequence requested by the project owner. NOT the canonical order of the Quran.
// display = spelling shown to children; aliases = other spellings teachers may know.
export const SEQUENCE = [
  { no: 1, display: 'Al-Fatihah', aliases: ['Al-Faatiha', 'Al-Fatiha'] },
  { no: 114, display: 'An-Nas', aliases: ['An-Naas'] },
  { no: 113, display: 'Al-Falaq', aliases: [] },
  { no: 112, display: 'Al-Ikhlas', aliases: ['Al-Ikhlaas', 'Qul Huwallahu Ahad'] },
  { no: 111, display: 'Al-Masad', aliases: ['Al-Lahab', 'Tabbat'] },
  { no: 110, display: 'An-Nasr', aliases: [] },
  { no: 109, display: 'Al-Kafirun', aliases: ['Al-Kaafiroon', 'Al-Kafiroon'] },
  { no: 108, display: 'Al-Kawthar', aliases: ['Al-Kauthar', 'Al-Kausar'] },
  { no: 107, display: "Al-Ma'un", aliases: ["Al-Maa'un", 'Ara-ayta'] },
  { no: 106, display: 'Quraysh', aliases: ['Quraish', 'Quraisy'] },
  { no: 105, display: 'Al-Fil', aliases: ['Al-Feel'] },
  { no: 104, display: 'Al-Humazah', aliases: ['Al-Humaza'] },
  { no: 103, display: "Al-'Asr", aliases: ['Al-Asr'] },
  { no: 102, display: 'At-Takathur', aliases: ['At-Takaathur'] },
  { no: 101, display: "Al-Qari'ah", aliases: ["Al-Qaari'a", 'Al-Qariah'] },
  { no: 100, display: "Al-'Adiyat", aliases: ['Al-Aadiyaat', 'Al-Adiyat'] },
  { no: 99, display: 'Az-Zalzalah', aliases: ['Az-Zalzala', 'Az-Zilzal'] },
  { no: 98, display: 'Al-Bayyinah', aliases: ['Al-Bayyina'] },
  { no: 97, display: 'Al-Qadr', aliases: [] },
  { no: 96, display: "Al-'Alaq", aliases: ['Al-Alaq'] }
];
// Ayah counts used as an independent consistency check (also compared with the Tanzil metadata).
const EXPECTED_AYAHS = { 1: 7, 114: 6, 113: 5, 112: 4, 111: 5, 110: 3, 109: 6, 108: 3, 107: 7, 106: 4, 105: 5, 104: 9, 103: 3, 102: 8, 101: 11, 100: 11, 99: 8, 98: 8, 97: 5, 96: 19 };

const ctx = { QuranData: undefined };
vm.runInNewContext(metaSrc, ctx);
const meta = vm.runInNewContext('QuranData', Object.assign(ctx, {}));
const suraMeta = meta.Sura;

const lines = raw.split(/\r?\n/);
const header = lines.filter((l) => l.startsWith('#')).map((l) => l.replace(/^#\s?/, '')).join('\n').replace(/^=+\n|\n=+$/g, '').trim();
const ayahMap = new Map();
for (const l of lines) {
  const m = l.match(/^(\d+)\|(\d+)\|(.*)$/);
  if (m) ayahMap.set(`${m[1]}:${m[2]}`, m[3]);
}
const BISM = ayahMap.get('1:1');
const problems = [];
const anomalies = [];
// Consonant skeleton used only for comparisons (never for display).
const skeleton = (x) => x.normalize('NFC').replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '').replace(/[ٱآأإ]/g, 'ا').replace(/[ىی]/g, 'ي').replace(/[ؤ]/g, 'و').replace(/[ئ]/g, 'ي').replace(/[ء]/g, '').replace(/\s+/g, ' ').trim();
const fail = (msg) => { problems.push(msg); console.error('PROBLEM:', msg); };

const surahs = SEQUENCE.map((s) => {
  const sm = suraMeta[s.no];
  const ayahs = [];
  for (let n = 1; n <= sm[1]; n++) {
    const text = ayahMap.get(`${s.no}:${n}`);
    if (text === undefined) { fail(`missing ${s.no}:${n}`); continue; }
    const a = { n, text };
    if (n === 1 && s.no !== 1 && s.no !== 9) {
      // The Bismillah is four words. Cut those four words off the front; never alter any character.
      const tokens = text.split(' ');
      const prefix = tokens.slice(0, 4).join(' ');
      if (skeleton(prefix) !== skeleton(BISM)) fail(`${s.no}:1 does not start with the Bismillah words`);
      a.prefix = prefix;
      a.body = tokens.slice(4).join(' ');
      if (prefix !== BISM) anomalies.push({ ayah: `${s.no}:1`, found: prefix, standard: BISM, codepointsFound: [...prefix].map((c) => c.codePointAt(0).toString(16)).join(' '), codepointsStandard: [...BISM].map((c) => c.codePointAt(0).toString(16)).join(' ') });
    }
    ayahs.push(a);
  }
  if (ayahs.length !== EXPECTED_AYAHS[s.no]) fail(`surah ${s.no}: ${ayahs.length} ayahs, expected ${EXPECTED_AYAHS[s.no]}`);
  if (sm[1] !== EXPECTED_AYAHS[s.no]) fail(`surah ${s.no}: Tanzil metadata says ${sm[1]} ayahs`);
  const joined = ayahs.map((a) => a.text).join('\n');
  return { no: s.no, display: s.display, aliases: s.aliases, ar: sm[4], tanzilTransliteration: sm[5], english: sm[6], type: sm[7], ayahCount: ayahs.length, textSha256: sha(joined), ayahs };
});

if (problems.length) { console.error(`\n${problems.length} problem(s); data file NOT written.`); process.exit(1); }

const sourceInfo = {
  name: 'Tanzil Project', url: 'https://tanzil.net/', textType: 'Uthmani (quranType=uthmani, outType=txt-2; pause marks, sajdah signs, alef and tatweel options left at the download-page defaults)',
  downloaded: '2026-10-25', fileSha256: sha(raw), fileName: 'research/sources/tanzil/quran-uthmani.txt', metadataSha256: sha(metaSrc), licence: 'Creative Commons Attribution 3.0 with the Tanzil terms of use quoted in `notice`',
  note: 'Text is verbatim and unmodified. For ayah 1 of surahs 2-114 (except 9) the source file already contains the Bismillah (four words) in front of the ayah; "prefix" and "body" split it so the Bismillah can be shown as a heading. text === prefix + " " + body always holds. The heading shown to children is the Bismillah of 1:1 from the same file.', anomalies: anomalies
};
const out = `// GENERATED by tools/build-quran-data.mjs from the Tanzil Uthmani text. DO NOT EDIT BY HAND: any change to the Arabic would break the Tanzil terms ("changing it is not allowed").
// Verified by tests/unit/quran.test.mjs against research/sources/tanzil/quran-uthmani.txt.
export const QURAN_NOTICE = ${JSON.stringify(header)};
export const QURAN_SOURCE = ${JSON.stringify(sourceInfo, null, 1)};
export const BISMILLAH = ${JSON.stringify(BISM)};
// Learning sequence requested for AmmaraGames: Al-Fatihah first, then selected surahs in DESCENDING surah-number order.
// It is NOT the canonical order of the Quran; "no" is the real surah number.
export const SURAHS = ${JSON.stringify(surahs, null, 1)};
`;
fs.mkdirSync(path.join(ROOT, 'src/data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'src/data/quran-data.js'), out);
console.log(`Wrote src/data/quran-data.js: ${surahs.length} surahs, ${surahs.reduce((a, s) => a + s.ayahCount, 0)} ayahs, ${(Buffer.byteLength(out) / 1024).toFixed(0)} KB. Source file sha256 ${sha(raw).slice(0, 16)}…`);

// ---------- second-source cross-check (development only) ---------------------------------------------------------
if (process.argv.includes('--crosscheck')) {
  const result = { source: 'https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=N', purpose: 'Independent check of the consonant skeleton (marks removed, alef/yeh/hamza variants merged). Not bundled.', checkedAt: new Date().toISOString(), surahs: [] };
  fs.mkdirSync(path.join(ROOT, 'research/sources/quran-com'), { recursive: true });
  for (const s of surahs) {
    const res = await fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${s.no}`);
    const j = await res.json();
    fs.writeFileSync(path.join(ROOT, `research/sources/quran-com/surah-${s.no}.json`), JSON.stringify(j, null, 1));
    const other = j.verses.map((v) => v.text_uthmani);
    const row = { no: s.no, tanzilAyahs: s.ayahCount, otherAyahs: other.length, ayahMismatches: [], exactMatches: 0 };
    s.ayahs.forEach((a, i) => {
      const mine = a.body !== undefined ? a.body : a.text;
      const theirs = other[i] === undefined ? '' : other[i].trim();
      if (mine === theirs) row.exactMatches++;
      if (skeleton(mine) !== skeleton(theirs)) row.ayahMismatches.push({ n: a.n, tanzil: skeleton(mine), other: skeleton(theirs) });
    });
    result.surahs.push(row);
    console.log(`surah ${s.no}: ${row.exactMatches}/${s.ayahCount} identical, ${row.ayahMismatches.length} skeleton mismatches`);
  }
  result.totalAyahs = result.surahs.reduce((a, r) => a + r.tanzilAyahs, 0);
  result.exactMatches = result.surahs.reduce((a, r) => a + r.exactMatches, 0);
  result.skeletonMismatches = result.surahs.reduce((a, r) => a + r.ayahMismatches.length, 0);
  fs.mkdirSync(path.join(ROOT, 'research/islamic'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'research/islamic/crosscheck.json'), JSON.stringify(result, null, 1));
  console.log(`Cross-check: ${result.exactMatches}/${result.totalAyahs} ayahs character-identical, ${result.skeletonMismatches} skeleton mismatches.`);
}
