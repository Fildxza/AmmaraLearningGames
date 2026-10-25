import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDataset, summarise } from '../../tools/lib/research.mjs';

const ds = buildDataset();

test('every question has a research record with the required fields and a correct index that matches its answer id', () => {
  assert.equal(ds.records.length, ds.config.questions.length);
  for (const r of ds.records) {
    for (const k of ['id', 'category', 'objective', 'recommendedAges', 'difficulty', 'interactionType', 'question', 'options', 'correctAnswerId', 'correctIndex', 'hint', 'explanation', 'illustration', 'sources', 'verificationStatus', 'languages', 'accessibility']) {
      assert.ok(r[k] !== undefined && r[k] !== null && r[k] !== '', `${r.id} missing ${k}`);
    }
    assert.notEqual(r.category, 'unknown', r.id);
    assert.equal(r.options[r.correctIndex].id, r.correctAnswerId, `${r.id} index mismatch`);
    assert.equal(new Set(r.options.map((o) => o.id)).size, r.options.length, `${r.id} duplicate options`);
    assert.equal(new Set(r.options.map((o) => o.label.ms)).size, r.options.length, `${r.id} duplicate Malay labels`);
    assert.equal(new Set(r.options.map((o) => o.label.en)).size, r.options.length, `${r.id} duplicate English labels`);
    assert.equal(r.options.length, 3, `${r.id} should have exactly 3 options`);
    assert.equal(r.checks.reviewedByHuman, false, 'no question may claim human review');
  }
});

test('target: at least 20 questions in each of the 16 categories (15 worlds + town quizzes) and at least 300 in total', () => {
  const s = summarise(ds);
  assert.equal(Object.keys(s.perCategory).length, 16);
  for (const [cat, v] of Object.entries(s.perCategory)) {
    assert.ok(v.questions >= 20, `${cat}: ${v.questions}`);
    assert.equal(v.distinctQuestionAnswerPairs, v.questions, `${cat} has repeated question+answer pairs`);
  }
  assert.ok(s.total >= 300);
});

test('no two questions in the bank ask the same thing with the same answer and options', () => {
  const seen = new Map();
  for (const r of ds.records) {
    const key = r.question.en + '|' + [...r.options.map((o) => o.id)].sort().join(',') + '|' + r.correctAnswerId;
    assert.ok(!seen.has(key), `${r.id} duplicates ${seen.get(key)}`);
    seen.set(key, r.id);
  }
});

test('every objective, source and fact-check reference points at something that exists', () => {
  const objectiveIds = new Set(Object.keys(ds.objectives));
  const questionIds = new Set(ds.records.map((r) => r.id));
  for (const r of ds.records) {
    assert.ok(objectiveIds.has(r.objective), `${r.id}: objective ${r.objective} not documented`);
    for (const s of r.sources) assert.ok(ds.sourceIds.has(s), `${r.id}: unknown source ${s}`);
  }
  for (const [k, o] of Object.entries(ds.objectives)) {
    for (const s of o.sources) assert.ok(ds.sourceIds.has(s), `objective ${k}: unknown source ${s}`);
    if (o.alignment) assert.ok(ds.sourceIds.has(o.alignment.source));
  }
  for (const c of ds.checks) {
    assert.ok(ds.sourceIds.has(c.source), `fact check source ${c.source}`);
    assert.ok(['exact-quote', 'paraphrase-of-fetched-text'].includes(c.evidenceType));
    for (const q of c.questions) assert.ok(questionIds.has(q), `fact check names unknown question ${q}`);
  }
  for (const s of ds.sources.sources) assert.ok(['fetched', 'search-snippet', 'failed', 'not-used'].includes(s.status), s.id);
});

test('fact-checked questions only cite sources that were really fetched or are marked as search snippets', () => {
  const status = Object.fromEntries(ds.sources.sources.map((s) => [s.id, s.status]));
  for (const c of ds.checks) assert.notEqual(status[c.source], 'failed', `${c.source} could not be accessed, so it cannot support a fact check`);
});

test('age-appropriate pools: 2-3 questions are never marked as the hardest difficulty', () => {
  for (const r of ds.records) if (r.recommendedAges.includes('2-3')) assert.ok(r.difficulty <= 2, `${r.id} is difficulty ${r.difficulty} but offered to age 2-3`);
});
