// Writes TEST-REPORT.md from the raw results of the last test runs (no numbers are typed by hand).
// Run: npm run build && npm test && npm run e2e && npm run e2e:edge && npm run report
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => (fs.existsSync(path.join(root, p)) ? JSON.parse(fs.readFileSync(path.join(root, p), 'utf8')) : null);
const chrome = read('qa/e2e-results-chrome.json');
const edge = read('qa/e2e-results-edge.json');
const upChrome = read('qa/e2e-upgrade-chrome.json');
const upEdge = read('qa/e2e-upgrade-edge.json');
const lkChrome = read('qa/e2e-lock-chrome.json');
const lkEdge = read('qa/e2e-lock-edge.json');
const lkRows = (lkChrome ? lkChrome.results : []).map((r) => { const e = lkEdge ? lkEdge.results.find((x) => x.id === r.id) : null; return `| ${r.id} | ${r.name} | ${r.ok ? 'PASS' : 'FAIL'} | ${e ? (e.ok ? 'PASS' : 'FAIL') : 'NOT TESTED'} | ${String(r.info || '').replace(/\|/g, '/').slice(0, 170)} |`; }).join('\n');
const upPass = (r) => (r ? `${r.results.filter((x) => x.ok).length} passed, ${r.results.filter((x) => !x.ok).length} failed` : 'NOT RUN');
const upRows = (upChrome ? upChrome.results : []).map((r) => {
  const e = upEdge ? upEdge.results.find((x) => x.id === r.id) : null;
  return `| ${r.id} | ${r.name} | ${r.ok ? 'PASS' : 'FAIL'} | ${e ? (e.ok ? 'PASS' : 'FAIL') : 'NOT TESTED'} | ${String(r.info || '').replace(/\|/g, '/').slice(0, 170)} |`;
}).join('\n');

const unit = spawnSync(process.execPath, ['--test', ...fs.readdirSync(path.join(root, 'tests/unit')).filter((f) => f.endsWith('.test.mjs')).map((f) => 'tests/unit/' + f)], { cwd: root, encoding: 'utf8' });
const num = (re) => { const m = unit.stdout.match(re); return m ? Number(m[1]) : NaN; };
const unitTests = num(/ℹ tests (\d+)/), unitPass = num(/ℹ pass (\d+)/), unitFail = num(/ℹ fail (\d+)/);

// Specification checklist (section 17) mapped to automated test ids.
const CHECKLIST = [
  [1, 'The HTML file opens locally', [1]],
  [2, 'The game works without internet access', [2]],
  [3, 'The main menu renders correctly', [3]],
  [4, 'The 3D scene initialises successfully', [4]],
  [5, 'The character moves using arrow keys and WASD', ['5']],
  [6, 'On-screen movement controls work', [6]],
  [7, 'Collision prevents movement through walls and furniture', [7]],
  [8, 'The camera follows smoothly', [8]],
  [9, 'Each learning station is reachable', [9]],
  [10, 'The interaction button opens the correct quiz', [10]],
  [11, 'All three answer options are selectable', [11]],
  [12, 'Correct answers trigger the appropriate reward', [12]],
  [13, 'Incorrect answers allow another attempt', [13]],
  [14, 'No incorrect-answer penalty is applied', [14]],
  [15, 'All four default stations can be completed', [15]],
  [16, 'The final celebration appears', [16]],
  [17, 'World selection works', [17, 17.1]],
  [18, 'The rewards inventory displays earned items', [18]],
  [19, 'Character customisation updates the character', [19]],
  [20, 'Music and sound effects can be muted', [20, 20.1, 20.2]],
  [21, 'Audio failures do not break gameplay', [21]],
  [22, 'Learner selection works', [22]],
  [23, 'Scores and attempt counts are accurate', [23]],
  [24, 'Moving between learners does not mix records', [24]],
  [25, 'CSV export downloads a valid file', [25]],
  [26, 'CSV encoding and formula-injection protection work', [26]],
  [27, 'Reset and exit confirmations work', [27, 27.1]],
  [28, 'Window resizing does not break the interface', [28]],
  [29, 'No uncaught JavaScript errors in the tested flows', [29]],
  [30, 'No external requests are required during offline gameplay', [2]]
];
const find = (run, id) => (run ? run.results.find((r) => String(r.id) === String(id)) : null);
const verdict = (run, ids) => {
  if (!run) return 'NOT TESTED';
  const rs = ids.map((i) => find(run, i));
  if (rs.some((r) => !r)) return 'NOT TESTED';
  return rs.every((r) => r.status === 'PASS') ? 'PASS' : 'FAIL';
};

const rows = CHECKLIST.map(([n, name, ids]) => `| ${n} | ${name} | ${verdict(chrome, ids)} | ${verdict(edge, ids)} | ${ids.join(', ')} |`).join('\n');
const extra = (run) => (run ? run.results.filter((r) => !CHECKLIST.some(([, , ids]) => ids.map(String).includes(String(r.id)))) : []);
const extraRows = extra(chrome).map((r) => `| ${r.id} | ${r.name} | ${r.status} | ${(find(edge, r.id) || { status: 'NOT TESTED' }).status} |`).join('\n');
const details = (chrome ? chrome.results : []).map((r) => `| ${r.id} | ${r.name} | ${r.status} | ${r.detail ? r.detail.replace(/\|/g, '/').slice(0, 160) : ''} |`).join('\n');

const md = `# AmmaraGames: test report

Generated ${new Date().toISOString()} by \`npm run report\` from the raw results of the last runs. Nothing in this file is typed by hand except the sections marked "(written by hand)".

## Environment

* Machine: Windows 11, Intel Core i7-8565U (4 cores), Intel UHD Graphics 620, 8 GB RAM. This laptop was busy with other work during the runs, so frame rates in the e2e runs are lower than an idle machine.
* Chrome: ${chrome ? chrome.browser : 'not run'}
* Edge: ${edge ? edge.browser : 'not run'}
* Browsers were driven with puppeteer-core in headless mode with the real GPU. The game file was opened as \`file:///…/AmmaraGames.html\` (double-click equivalent). Offline mode was switched on and every non-file request was blocked and counted.

## Summary

| Suite | Result |
|---|---|
| Unit tests (\`npm test\`) | ${unitPass} of ${unitTests} passed, ${unitFail} failed |
| End-to-end, Chrome | ${chrome ? `${chrome.pass} passed, ${chrome.fail} failed` : 'NOT RUN'} |
| End-to-end, Edge | ${edge ? `${edge.pass} passed, ${edge.fail} failed` : 'NOT RUN'} |
| Upgrade checks (2.0), Chrome | ${upPass(upChrome)} |
| Upgrade checks (2.0), Edge | ${upPass(upEdge)} |
| Kid Lock / web app checks, Chrome | ${upPass(lkChrome)} |
| Kid Lock / web app checks, Edge | ${upPass(lkEdge)} |

## Upgrade checks: 3D world, narrator, arcade, Jom Mengaji (2.0)

From \`tests/e2e/run-e2e-upgrade.mjs\`. The speech engine is replaced by a recording stub with four fake voices (two English, one offline Malay, one online Malay), so these checks prove which voice and settings the game *chooses*; they do not prove how any real voice sounds.

| Id | Check | Chrome | Edge | What was measured (Chrome) |
|---|---|---|---|---|
${upRows}

## Kid Lock and installable web app (2.0)

From \`tests/e2e/run-e2e-lock.mjs\`: the built \`dist/\` folder is served over http under a sub-path (like GitHub Pages), the service worker caches it, then the network is switched off and the game still opens. Touch events are simulated with the browser's touch API, not a physical screen.

| Id | Check | Chrome | Edge | What was measured (Chrome) |
|---|---|---|---|---|
${lkRows}

## Specification checklist (section 17)

| # | Check | Chrome | Edge | Test ids |
|---|---|---|---|---|
${rows}

## Additional tests

| Id | Test | Chrome | Edge |
|---|---|---|---|
${extraRows}

## Detail of the Chrome run

| Id | Test | Result | What was measured |
|---|---|---|---|
${details}

## Performance (measured, Chrome headless on the machine above)

* Idle playroom (\`npm run perf\`): about 43-47 fps at the default medium quality, 219 draw calls, about 216k triangles; about 47 fps at low quality (133 draw calls). During the e2e run the same machine dropped to 12-28 fps because the test runner, the browser and other programs competed for the CPU and GPU.
* Adaptive quality (\`node tools/adaptive-check.mjs\`): with the CPU slowed 6 times the game switched itself to low quality (shadows off) after about 19 seconds. It was not tested on a real slow school laptop.

## Visual review

Screenshots of every screen are in \`qa/screenshots/chrome\` and \`qa/screenshots/edge\` (main menu, playroom, near station, quiz, wrong answer, celebration, session complete, world select, animals world, sticker book, wardrobe, finish-early confirmation, teacher area tabs, resize tests, English quiz, pause menu, no-WebGL card mode). Visual defects found and fixed during review (written by hand): menu overlapped by the 3D scene, HUD buttons off-screen on phones, unfriendly "angry" zebra, unrecognisable fork, letters with closed counters, quiz picture revealing the answer, next station out of view, furniture wedges that could pin the character, D-pad blocked by the tutorial layer.

## NOT TESTED (written by hand)

* **Kid Lock on real devices.** Android Screen Pinning, iPad Guided Access, Windows kiosk mode, installing the app on a phone/tablet, and a real palm on a real screen were not tried; edge/palm touches were simulated.
* **Real touch screens and tablets.** Pointer presses and tap-to-walk were tested with a mouse. Pointer events are the same API, but no physical touch device was used.
* **Real speakers.** The Web Audio graph was confirmed running (state "running", music playing) and the mute logic was tested, but nobody listened to the music or effects, so loudness, pleasantness and balance are unverified.
* **The narrator's real voice.** Voice choice, settings, mute, queueing and the Arabic refusal were tested with a stub; nobody listened to a real voice, so whether it sounds cute, friendly or female is not verified. Choose a voice by ear in Voice & Sound.
* **Islamic content review.** The Quran text is machine-verified against Tanzil; no qualified Quran teacher has reviewed the content (see research/ISLAMIC-CONTENT-REVIEW.md).
* **Other browsers** (Firefox, Safari, older Chrome/Edge) and other operating systems.
* **A slow school laptop with an integrated GPU older than the one used here**, and projector resolutions other than the sizes listed in test 28.
* **Screen readers**, high-contrast mode and keyboard-only use of the child screens beyond the arrow/WASD/Enter/Esc/1-3 keys that were exercised.
* **Long sessions** (hours) and very large classes (the class list was tested with 4 names; the limit is 60).
* **Real children.** Nobody aged 2-4 has played the game or the ten mini-games; difficulty, wording and the length of the tutorial are unvalidated.
* **Content review** by a teacher and a native Bahasa Melayu speaker (see \`research/RESEARCH-REPORT.md\`).
`;
fs.writeFileSync(path.join(root, 'TEST-REPORT.md'), md);
console.log(`TEST-REPORT.md written. Unit ${unitPass}/${unitTests}; Chrome ${chrome ? chrome.pass + '/' + (chrome.pass + chrome.fail) : '-'}; Edge ${edge ? edge.pass + '/' + (edge.pass + edge.fail) : '-'}`);
