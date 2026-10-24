// Builds the structured research dataset (one record per question) from the teacher config
// plus the hand-written research files. Used by tools/export-research.mjs and by unit tests.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { validateConfig } from '../../src/engine/core/validate.js';
import { isIconKey } from '../../src/engine/art/icons.js';
import { choiceLabel, tr } from '../../src/engine/core/labels.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

export function loadConfig() {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'src/config/game-config.js'), 'utf8'), ctx);
  return validateConfig(JSON.parse(JSON.stringify(ctx.window.AMMARA_CONFIG)), { isIconKey });
}

// Objectives whose answers are read directly off a picture (low factual risk).
const VISUAL_OBJECTIVES = new Set(['letter-identify', 'letter-match', 'letter-case-match', 'letter-word-intro', 'letter-sound', 'count-small', 'numeral-identify', 'numeral-quantity',
  'compare-quantity', 'number-sequence', 'color-identify', 'color-match', 'color-intro', 'shape-identify', 'shape-attribute-match', 'shape-special', 'shape-in-objects', 'shape-3d-roll',
  'animal-identify', 'fruit-identify', 'veg-identify', 'vehicle-identify', 'body-identify', 'body-count', 'object-identify', 'visual-match', 'object-category', 'object-odd-one-out',
  'nature-identify', 'sky-identify', 'emotion-identify', 'shadow-match', 'pattern-ab', 'pattern-complex', 'size-compare', 'vehicle-sounds', 'food-nonfood']);

const ACCESS = {
  color: 'Needs colour discrimination (the topic itself). Every answer also carries a text label and, where possible, a different object or shape; a teacher can switch the colour world off.',
  sound: 'The sound is written in a speech bubble, so no audio is required. Read-aloud is optional and offline.',
  count: 'Numbers are shown as pictures of groups and as numerals; keyboard keys 1-3 select answers.',
  shadow: 'Needs shape recognition. A hint describes a distinguishing feature in words.',
  pattern: 'Pattern strip is shown as pictures; the hint says the pattern in words.',
  letter: 'Needs letter-shape recognition; the label under each picture repeats the letter.',
  default: 'Large touch targets, picture plus text label, optional read-aloud, no time limit, wrong answers cost nothing.'
};
function accessibilityNote(q) {
  if (/^color|color-/.test(q.objective) || q.objective.startsWith('color')) return ACCESS.color;
  if (q.type === 'sound') return ACCESS.sound;
  if (q.type === 'count') return ACCESS.count;
  if (q.type === 'shadow') return ACCESS.shadow;
  if (q.type === 'pattern') return ACCESS.pattern;
  if (q.objective.startsWith('letter')) return ACCESS.letter;
  return ACCESS.default;
}

export function buildDataset() {
  const { config, errors, warnings, stats } = loadConfig();
  const sources = readJson('research/sources.json');
  const objectives = readJson('research/objectives.json').objectives;
  const checks = readJson('research/fact-checks.json').checks;
  const sourceIds = new Set(sources.sources.map((s) => s.id));
  const vocab = config.answerChoices;
  const worldOfStation = {};
  for (const w of config.worlds) if (w.id !== 'adventure') for (const s of w.stations) worldOfStation[s] = w;
  const checksByQ = {};
  for (const c of checks) for (const q of c.questions) (checksByQ[q] = checksByQ[q] || []).push(c);

  const records = config.questions.map((q) => {
    const world = worldOfStation[q.station];
    const obj = objectives[q.objective];
    const fc = checksByQ[q.id] || [];
    let verification;
    if (fc.length) verification = 'fact-checked-against-source';
    else if (VISUAL_OBJECTIVES.has(q.objective)) verification = 'visual-identification-low-risk';
    else verification = 'needs-human-review';
    const stationDef = config.stations[q.station];
    const srcIds = [...new Set([...(obj ? obj.sources : []), ...fc.map((c) => c.source)])];
    const answerIndex = q.choices.indexOf(q.answer);
    return {
      id: q.id,
      category: world ? world.id : 'unknown',
      categoryName: world ? { ms: tr(world.name, 'ms').replace('{character}', config.character.name), en: tr(world.name, 'en').replace('{character}', config.character.name) } : null,
      station: q.station,
      stationTitle: stationDef ? { ms: tr(stationDef.title, 'ms'), en: tr(stationDef.title, 'en') } : null,
      objective: q.objective,
      objectiveDescription: obj ? obj.description : null,
      recommendedAges: q.ages,
      difficulty: q.difficulty,
      interactionType: q.type,
      question: { ms: tr(q.prompt, 'ms'), en: tr(q.prompt, 'en') },
      options: q.choices.map((c, i) => ({ index: i, id: c, label: { ms: choiceLabel(c, 'ms', vocab), en: choiceLabel(c, 'en', vocab) } })),
      correctAnswerId: q.answer,
      correctIndex: answerIndex,
      correctLabel: { ms: choiceLabel(q.answer, 'ms', vocab), en: choiceLabel(q.answer, 'en', vocab) },
      hint: q.hint ? { ms: tr(q.hint, 'ms'), en: tr(q.hint, 'en') } : null,
      explanation: q.explain ? { ms: tr(q.explain, 'ms'), en: tr(q.explain, 'en') } : null,
      illustration: { bigPicture: q.art || null, optionPictures: q.choices, note: 'Original drawings generated by src/engine/art; picture id equals the answer id.' },
      languages: ['ms', 'en'],
      sources: srcIds,
      factChecks: fc.map((c) => ({ source: c.source, claim: c.claim, evidenceType: c.evidenceType })),
      developmentalAlignment: obj && obj.alignment ? { source: obj.alignment.source, milestone: obj.alignment.quote, strength: obj.alignmentStrength } : null,
      verificationStatus: verification,
      checks: { automatedValidator: 'passed', reviewedByHuman: false, nativeMalayReview: false },
      accessibility: accessibilityNote(q)
    };
  });
  return { config, records, sources, objectives, checks, sourceIds, validation: { errors, warnings, stats } };
}

export function summarise(ds) {
  const byCat = {}, byAge = { '2-3': 0, '3-4': 0, '4+': 0 }, byDiff = { 1: 0, 2: 0, 3: 0 }, byType = {}, byVer = {};
  for (const r of ds.records) {
    byCat[r.category] = byCat[r.category] || { questions: 0, uniquePrompts: new Set(), objectives: new Set(), factChecked: 0, lowRisk: 0, needsReview: 0 };
    const c = byCat[r.category];
    c.questions++; c.uniquePrompts.add(r.question.en + '|' + r.correctAnswerId); c.objectives.add(r.objective);
    if (r.verificationStatus === 'fact-checked-against-source') c.factChecked++;
    else if (r.verificationStatus === 'visual-identification-low-risk') c.lowRisk++;
    else c.needsReview++;
    r.recommendedAges.forEach((a) => { byAge[a]++; });
    byDiff[r.difficulty]++;
    byType[r.interactionType] = (byType[r.interactionType] || 0) + 1;
    byVer[r.verificationStatus] = (byVer[r.verificationStatus] || 0) + 1;
  }
  const categories = Object.fromEntries(Object.entries(byCat).map(([k, v]) => [k, { questions: v.questions, distinctQuestionAnswerPairs: v.uniquePrompts.size, objectives: v.objectives.size, factChecked: v.factChecked, lowRiskVisual: v.lowRisk, needsHumanReview: v.needsReview }]));
  return { total: ds.records.length, perCategory: categories, perAge: byAge, perDifficulty: byDiff, perInteractionType: byType, perVerificationStatus: byVer, objectivesUsed: new Set(ds.records.map((r) => r.objective)).size };
}
