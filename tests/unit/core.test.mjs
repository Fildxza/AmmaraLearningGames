import test from 'node:test';
import assert from 'node:assert/strict';
import { validated } from './helpers.mjs';
import { toCSV, protectCell } from '../../src/engine/core/csv.js';
import { createCollisionWorld, addBox, addCircle, moveCircle, penetration, findFreeSpot } from '../../src/engine/core/collision.js';
import { createRng } from '../../src/engine/core/rng.js';
import { selectQuestions, orderChoices, isCorrect } from '../../src/engine/core/content.js';
import { createProgress, parseNameList, cleanName } from '../../src/engine/core/progress.js';
import { STRINGS } from '../../src/engine/i18n.js';

const { config } = validated();

test('CSV starts with a BOM, quotes every field and escapes quotes', () => {
  const csv = toCSV(['Name', 'Note'], [['Ali "Boy"', 'a,b\nc'], ['Siti', 3]]);
  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.ok(csv.includes('"Ali ""Boy"""'));
  assert.ok(csv.includes('"a,b\nc"'));
  assert.ok(csv.endsWith('\r\n'));
  assert.equal(csv.split('\r\n')[0], '\ufeff"Name","Note"');
});

test('CSV neutralises formula injection, including leading whitespace and control characters', () => {
  for (const v of ['=1+1', '+SUM(A1)', '-2', '@cmd', ' =HYPERLINK("x")', '\t=1', '\u0000+1', ' @x', '\r-3', '＝1']) {
    assert.ok(protectCell(v).startsWith("'"), JSON.stringify(v));
  }
  for (const v of ['Ali', 'Nur Aisyah', '3 bintang', 'a=b', 'x-y', 'e@mail']) assert.equal(protectCell(v), v);
  assert.equal(protectCell(5), '5');
});

test('collision: a circle never ends inside boxes, circles or walls', () => {
  const w = createCollisionWorld({ minX: -10, maxX: 10, minZ: -8, maxZ: 8 });
  addBox(w, -2, -2, 2, 2);
  addCircle(w, 5, 5, 1.2);
  const rng = createRng('collide');
  const p = { x: -6, z: 0 };
  for (let i = 0; i < 5000; i++) {
    moveCircle(w, p, 0.45, (rng.next() - 0.5) * 3, (rng.next() - 0.5) * 3);
    assert.ok(penetration(w, p, 0.45) < 0.002, `step ${i} at ${p.x},${p.z}`);
  }
});

test('collision: walking straight into a box stops at its face; big steps do not tunnel', () => {
  const w = createCollisionWorld({ minX: -10, maxX: 10, minZ: -10, maxZ: 10 });
  addBox(w, -1, -0.2, 1, 0.2);
  const p = { x: 0, z: -5 };
  moveCircle(w, p, 0.45, 0, 20);
  assert.ok(p.z <= -0.2 - 0.45 + 0.01, `z=${p.z}`);
  const q = { x: 0, z: 0 };
  const free = findFreeSpot(w, q, 0.45);
  assert.ok(penetration(w, free, 0.45) < 0.002);
});

test('seeded question selection is reproducible and respects age groups', () => {
  const world = config.worldById.animals;
  for (const age of ['2-3', '3-4', '4+']) {
    const a = selectQuestions(config, world, age, 'seed-1');
    const b = selectQuestions(config, world, age, 'seed-1');
    assert.deepEqual(a, b);
    a.forEach((qid) => assert.ok(config.questionById[qid].ages.includes(age), `${qid} not for ${age}`));
    assert.equal(new Set(a).size, 4);
  }
  const seen = new Set();
  for (let i = 0; i < 30; i++) selectQuestions(config, world, '3-4', 'kid-' + i).forEach((q) => seen.add(q));
  assert.ok(seen.size > 8, 'different learners get different questions');
});

test('adventure uses the specified default questions for ages 2-3 and 3-4, harder ones for 4+', () => {
  const w = config.worldById.adventure;
  assert.deepEqual(selectQuestions(config, w, '2-3', 'x'), ['abc-01', 'num-01', 'ani-01', 'col-01']);
  assert.deepEqual(selectQuestions(config, w, '3-4', 'y'), ['abc-01', 'num-01', 'ani-01', 'col-01']);
  const four = selectQuestions(config, w, '4+', 'z');
  four.forEach((qid) => assert.ok(config.questionById[qid].ages.includes('4+')));
  assert.notDeepEqual(four, ['abc-01', 'num-01', 'ani-01', 'col-01']);
});

test('shuffled answers keep the correct answer tied to its picture (no index mismatch)', () => {
  for (const q of config.questions) {
    for (let s = 0; s < 4; s++) {
      const order = orderChoices(config, q, 'seed' + s);
      assert.deepEqual([...order].sort(), [...q.choices].sort());
      const correctOnes = order.filter((c) => isCorrect(q, c));
      assert.equal(correctOnes.length, 1, q.id);
      assert.equal(correctOnes[0], q.answer);
    }
  }
  const positions = new Set(config.questions.map((q) => orderChoices(config, q, 'pos').indexOf(q.answer)));
  assert.equal(positions.size, 3, 'answer appears in every position across the bank');
});

test('name list parsing trims, skips blanks, limits length and renames duplicates', () => {
  const r = parseNameList('Ali\n\n  Siti  \nAli\n' + 'x'.repeat(60) + '\n\t\n', 40, 60);
  assert.deepEqual(r.names.slice(0, 3), ['Ali', 'Siti', 'Ali (2)']);
  assert.equal(r.names[3].length, 40);
  assert.ok(r.skippedEmpty >= 1);
  assert.equal(cleanName('  A\u0000b\u200bc  '), 'A b c');
});

function makeProgress() {
  let stored = null;
  const p = createProgress({ config, load: () => stored, save: (d) => { stored = JSON.parse(JSON.stringify(d)); return true; } });
  return { p, get stored() { return stored; } };
}

test('progress: wrong answers count attempts without penalty; correct answer recorded once; reward not duplicated', () => {
  const { p } = makeProgress();
  p.startSession({ mode: 'single', names: ['Ali'], worldId: 'adventure', ageGroup: '2-3', lang: 'ms' });
  const l = p.currentLearner();
  const run = p.startRun(l.id, 'adventure', '2-3', 'ms');
  const q0 = config.questionById[run.stations[0].questionId];
  const wrong = q0.choices.filter((c) => c !== q0.answer);
  assert.equal(p.recordAnswer(run.id, 1, config.questionById[run.stations[1].questionId].answer).reason, 'LOCKED');
  const w1 = p.recordAnswer(run.id, 0, wrong[0]);
  assert.equal(w1.correct, false);
  assert.equal(p.recordAnswer(run.id, 0, wrong[0]).reason, 'ALREADY_TRIED');
  const starsBefore = l.stars;
  const ok = p.recordAnswer(run.id, 0, q0.answer);
  assert.equal(ok.correct, true);
  assert.equal(ok.firstTry, false);
  assert.equal(ok.attempts, 2);
  assert.equal(l.stars, starsBefore + 1);
  assert.equal(p.recordAnswer(run.id, 0, q0.answer).reason, 'ALREADY_COMPLETE');
  assert.equal(l.stars, starsBefore + 1, 'no double star');
  assert.equal(ok.reward.id, 'bow_pink');
  assert.equal(l.equipped.hair, 'bow_pink', 'reward is worn');
  for (let i = 1; i < 4; i++) {
    const q = config.questionById[run.stations[i].questionId];
    const r = p.recordAnswer(run.id, i, q.answer);
    assert.equal(r.firstTry, true);
    if (i === 3) assert.equal(r.done, true);
  }
  assert.equal(p.run(run.id).status, 'complete');
  assert.equal(l.stars, 4);
  // play again: stars still earned, rewards not duplicated
  const run2 = p.startRun(l.id, 'adventure', '2-3', 'ms');
  const again = p.recordAnswer(run2.id, 0, config.questionById[run2.stations[0].questionId].answer);
  assert.equal(again.reward.isNew, false);
  assert.equal(l.rewards.filter((x) => x === 'bow_pink').length, 1);
});

test('progress: learners in a class list never share records; finishing early keeps partial scores', () => {
  const { p, stored } = makeProgress();
  p.startSession({ mode: 'class', names: ['Ali', 'Siti', 'Mei Ling'], worldId: 'animals', ageGroup: '3-4', lang: 'en', reuseByName: false });
  const ali = p.currentLearner();
  const r1 = p.startRun(ali.id, 'animals', '3-4', 'en');
  const qa = config.questionById[r1.stations[0].questionId];
  p.recordAnswer(r1.id, 0, qa.choices.find((c) => c !== qa.answer));
  p.recordAnswer(r1.id, 0, qa.answer);
  p.endRunEarly(r1.id);
  const siti = p.advanceLearner();
  assert.equal(siti.name, 'Siti');
  const r2 = p.startRun(siti.id, 'animals', '3-4', 'en');
  const qs = config.questionById[r2.stations[0].questionId];
  p.recordAnswer(r2.id, 0, qs.answer);
  assert.equal(p.summary(ali.id).attempts, 2);
  assert.equal(p.summary(ali.id).completed, 1);
  assert.equal(p.summary(siti.id).attempts, 1);
  assert.equal(p.summary(siti.id).firstTry, 1);
  assert.equal(ali.stars, 1);
  assert.equal(siti.stars, 1);
  assert.equal(p.run(r1.id).status, 'ended-early');
  const T = STRINGS.en;
  const { csv, rowCount } = p.exportCSV('session', 'en', T);
  assert.equal(rowCount, 8);
  const lines = csv.trim().split('\r\n');
  assert.equal(lines.length, 9);
  assert.ok(lines[1].startsWith('"Ali"'));
  assert.ok(lines.some((l) => l.includes('"Siti"') && l.includes(`"${T.yes}"`)));
  assert.ok(lines.some((l) => l.includes('"Ali"') && l.includes(`"${T.statusEndedEarly}"`)));
  const mei = p.advanceLearner();
  assert.equal(mei.name, 'Mei Ling');
  assert.equal(p.advanceLearner(), null, 'everyone has finished');
});

test('progress: data survives a reload from storage and malicious names are exported safely', () => {
  let stored = null;
  const save = (d) => { stored = JSON.stringify(d); return true; };
  const p1 = createProgress({ config, load: () => null, save });
  p1.startSession({ mode: 'class', names: ['=CMD()', '+evil', 'Normal'], worldId: 'adventure', ageGroup: '2-3', lang: 'ms', reuseByName: false });
  const run = p1.startRun(p1.currentLearner().id, 'adventure', '2-3', 'ms');
  p1.recordAnswer(run.id, 0, config.questionById[run.stations[0].questionId].answer);
  const p2 = createProgress({ config, load: () => JSON.parse(stored), save });
  assert.equal(p2.currentLearner().name, '=CMD()');
  assert.equal(p2.run(run.id).stations[0].completed, true);
  const { csv } = p2.exportCSV('all', 'ms', STRINGS.ms);
  assert.ok(csv.includes(`"'=CMD()"`));
  assert.ok(!/(^|,)"=/m.test(csv), 'no raw formula cell');
});
