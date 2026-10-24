import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRawConfig, validated, clone } from './helpers.mjs';
import { isIconKey } from '../../src/engine/art/icons.js';
import { choiceLabel } from '../../src/engine/core/labels.js';

const raw = loadRawConfig();

test('the shipped configuration has no errors', () => {
  const { errors, stats } = validated();
  assert.deepEqual(errors, [], JSON.stringify(errors.slice(0, 5), null, 1));
  assert.equal(stats.questionsSkipped, 0);
});

test('every one of the 15 learning categories has at least 20 valid questions', () => {
  const { config } = validated();
  const learning = config.worlds.filter((w) => w.id !== 'adventure');
  assert.equal(learning.length, 15);
  for (const w of learning) {
    const n = config.questions.filter((q) => w.stations.includes(q.station)).length;
    assert.ok(n >= 20, `${w.id} has only ${n} questions`);
  }
  assert.ok(config.questions.length >= 300, `total ${config.questions.length}`);
});

test('every station has at least one question for every age group (no fallback needed)', () => {
  const { config, warnings } = validated();
  for (const [id, s] of Object.entries(config.stations)) {
    for (const a of ['2-3', '3-4', '4+']) assert.ok(s.poolByAge[a].length >= 1, `${id} has no ${a} question`);
  }
  assert.equal(warnings.filter((w) => w.code === 'STATION_AGE_GAP').length, 0);
});

test('all answers are among their choices, choices are distinct pictures with labels in both languages', () => {
  const { config } = validated();
  for (const q of config.questions) {
    assert.ok(q.choices.includes(q.answer), q.id);
    assert.equal(new Set(q.choices).size, q.choices.length, q.id);
    for (const c of q.choices) {
      assert.ok(isIconKey(c) || config.answerChoices[c], `${q.id}: ${c}`);
      for (const l of ['ms', 'en']) {
        const label = choiceLabel(c, l, config.answerChoices);
        assert.ok(label && label.length > 0 && !label.includes('undefined'), `${q.id} ${c} ${l}: "${label}"`);
      }
    }
    const labelsMs = q.choices.map((c) => choiceLabel(c, 'ms', config.answerChoices));
    assert.equal(new Set(labelsMs).size, labelsMs.length, `${q.id} duplicate ms labels ${labelsMs}`);
    if (q.art) assert.ok(isIconKey(q.art), `${q.id} art ${q.art}`);
    for (const l of ['ms', 'en']) {
      assert.ok(q.prompt[l], `${q.id} prompt ${l}`);
      assert.ok(q.hint && q.hint[l], `${q.id} hint ${l}`);
      assert.ok(q.explain && q.explain[l], `${q.id} explain ${l}`);
    }
  }
});

test('no translation warnings for the shipped content', () => {
  const { warnings } = validated();
  assert.deepEqual(warnings.filter((w) => w.code === 'TRANSLATION'), []);
});

test('the default adventure matches the specification', () => {
  const { config } = validated();
  const adv = config.worldById.adventure;
  const q = adv.stations.map((s) => config.questionById[config.stations[s].defaultQuestion]);
  assert.deepEqual(q[0].choices, ['letter:A', 'letter:B', 'letter:C']);
  assert.equal(q[0].answer, 'letter:A');
  assert.deepEqual(q[1].choices, ['count:apple:1', 'count:apple:2', 'count:apple:3']);
  assert.equal(q[1].answer, 'count:apple:2');
  assert.deepEqual(q[2].choices, ['cow', 'cat', 'duck']);
  assert.equal(q[2].answer, 'cow');
  assert.deepEqual(q[3].choices, ['ball:red', 'ball:blue', 'ball:yellow']);
  assert.equal(q[3].answer, 'ball:red');
});

test('detects duplicate ids, missing answers, wrong answer, duplicate options, missing pictures, bad ages, bad types', () => {
  const bad = clone(raw);
  const base = bad.questions[0];
  bad.questions.push(Object.assign({}, base));                                        // duplicate id
  bad.questions.push(Object.assign({}, base, { id: 'x-noanswer', answer: undefined }));
  bad.questions.push(Object.assign({}, base, { id: 'x-wrong', answer: 'letter:Z' }));
  bad.questions.push(Object.assign({}, base, { id: 'x-dupopt', choices: ['letter:A', 'letter:A', 'letter:B'] }));
  bad.questions.push(Object.assign({}, base, { id: 'x-nopic', choices: ['letter:A', 'unicornzzz', 'letter:B'] }));
  bad.questions.push(Object.assign({}, base, { id: 'x-age', ages: ['7-8'] }));
  bad.questions.push(Object.assign({}, base, { id: 'x-type', type: 'drag-and-drop' }));
  bad.questions.push(Object.assign({}, base, { id: 'x-empty', choices: [] }));
  bad.questions.push(Object.assign({}, base, { id: 'x-noprompt', prompt: '' }));
  const { errors, warnings, config } = validated(bad);
  const codes = errors.map((e) => e.code);
  for (const c of ['Q_DUP', 'Q_ANSWER', 'Q_ANSWER_NOT_CHOICE', 'Q_CHOICE_DUP', 'Q_CHOICE_UNKNOWN', 'Q_AGES', 'Q_CHOICES', 'Q_PROMPT']) assert.ok(codes.includes(c), `missing ${c}`);
  assert.ok(warnings.some((w) => w.code === 'Q_TYPE'));
  assert.ok(config.questionById['x-type'], 'unsupported type falls back to choose');
  assert.equal(config.questionById['x-wrong'], undefined);
  assert.equal(config.questions.length, raw.questions.length + 1);
});

test('detects missing translations and broken world/station references', () => {
  const bad = clone(raw);
  bad.questions[1].prompt = { ms: 'Hanya Melayu' };
  bad.worlds.push({ id: 'ghost', name: { ms: 'Hantu', en: 'Ghost' }, stations: ['nope-1', 'nope-2', 'nope-3', 'nope-4'] });
  bad.worlds.push({ id: 'short', name: { ms: 'Pendek', en: 'Short' }, stations: ['abc-1'] });
  bad.stations['abc-2'].reward = 'missing_reward';
  bad.stations['abc-3'].pool = ['does-not-exist'];
  const { errors, warnings, config } = validated(bad);
  assert.ok(warnings.some((w) => w.code === 'TRANSLATION' && w.ref === bad.questions[1].id));
  assert.ok(errors.some((e) => e.code === 'WORLD_STATION_MISSING' && e.ref === 'ghost'));
  assert.ok(errors.some((e) => e.code === 'WORLD_STATIONS' && e.ref === 'short'));
  assert.ok(warnings.some((w) => w.code === 'STATION_REWARD'));
  assert.ok(errors.some((e) => e.code === 'STATION_EMPTY' && e.ref === 'abc-3'));
  assert.equal(config.worldById.abc, undefined, 'world with an empty station is hidden');
  assert.ok(config.worldById.adventure);
});

test('letter-sound checker catches a distractor that starts with the same letter', () => {
  const bad = clone(raw);
  const q = bad.questions.find((x) => x.id === 'abc-23');
  q.choices = ['ball', 'bird', 'fish'];   // "Burung" starts with B in Malay
  const { errors } = validated(bad);
  assert.ok(errors.some((e) => e.code === 'Q_LETTER' && e.ref === 'abc-23'));
});

test('correctAnswers overrides are applied only when valid', () => {
  const bad = clone(raw);
  bad.correctAnswers = { 'abc-01': 'letter:B', 'abc-02': 'letter:Q' };
  const { config, errors } = validated(bad);
  assert.equal(config.questionById['abc-01'].answer, 'letter:B');
  assert.equal(config.questionById['abc-02'].answer, 'letter:O');
  assert.ok(errors.some((e) => e.code === 'OVERRIDE_BAD'));
});

test('a missing or garbage configuration does not crash', () => {
  for (const junk of [undefined, null, 42, 'text', [], { questions: 'nope', worlds: 5 }]) {
    const r = validated(junk);
    assert.ok(Array.isArray(r.errors));
    assert.ok(r.config.gameTitle);
  }
});

test('settings outside safe ranges are clamped', () => {
  const bad = clone(raw);
  bad.audioSettings.musicVolume = 9;
  bad.movementSettings.walkSpeed = -1;
  bad.accessibilitySettings.quizAutoCloseMs = 5;
  const { config } = validated(bad);
  assert.equal(config.audioSettings.musicVolume, 1);
  assert.equal(config.movementSettings.walkSpeed, 1);
  assert.equal(config.accessibilitySettings.quizAutoCloseMs, 300);
});

test('a question whose big picture gives away the answer is rejected (except "match" questions)', () => {
  const bad = clone(raw);
  const q = bad.questions.find((x) => x.id === 'abc-01');
  q.art = 'letter:A';
  const { errors, config } = validated(bad);
  assert.ok(errors.some((e) => e.code === 'Q_ART_SPOILER' && e.ref === 'abc-01'));
  assert.equal(config.questionById['abc-01'], undefined);
  const ok = validated();
  assert.equal(ok.errors.length, 0);
});
