// Picks questions for a run and orders answer choices.
// The correct answer is always tracked by its choice id, never by its position.
import { createRng } from './rng.js';

const AGE_FALLBACK = { '2-3': ['2-3', '3-4', '4+'], '3-4': ['3-4', '2-3', '4+'], '4+': ['4+', '3-4', '2-3'] };

export function poolForAge(station, ageGroup, ageIds) {
  const order = AGE_FALLBACK[ageGroup] || [ageGroup, ...ageIds.filter((a) => a !== ageGroup)];
  for (const a of order) {
    const list = station.poolByAge && station.poolByAge[a];
    if (list && list.length) return { ids: list, age: a };
  }
  return { ids: station.pool, age: null };
}

/**
 * Chooses one question per station.
 * @param {object} config  validated config
 * @param {object} world   world entry
 * @param {string} ageGroup
 * @param {string} seed    e.g. learnerId|runNumber|worldId (reproducible)
 * @param {Set<string>} recent question ids the learner saw recently (avoided when possible)
 */
export function selectQuestions(config, world, ageGroup, seed, recent = new Set()) {
  const rng = createRng(seed);
  const ageIds = config.ageGroups.map((a) => a.id);
  const chosen = [];
  for (const sid of world.stations) {
    const st = config.stations[sid];
    const { ids } = poolForAge(st, ageGroup, ageIds);
    const notUsed = ids.filter((id) => !chosen.includes(id));
    let pick;
    if (!st.randomize || !config.progressSettings.randomizeQuestions) {
      pick = st.defaultQuestion && notUsed.includes(st.defaultQuestion) ? st.defaultQuestion : notUsed[0];
    } else {
      const fresh = notUsed.filter((id) => !recent.has(id));
      const list = fresh.length ? fresh : notUsed;
      pick = st.defaultQuestion && list.includes(st.defaultQuestion) && !recent.has(st.defaultQuestion) ? st.defaultQuestion : rng.pick(list);
    }
    chosen.push(pick || ids[0]);
  }
  return chosen;
}

export function orderChoices(config, question, seed) {
  if (!config.progressSettings.shuffleAnswers) return question.choices.slice();
  const rng = createRng(seed + '|' + question.id);
  let order = rng.shuffle(question.choices);
  // Avoid always putting the answer first for the very first question a child sees.
  if (order[0] === question.answer && question.choices.length > 2 && rng.next() < 0.66) order = order.slice(1).concat(order[0]);
  return order;
}

export function isCorrect(question, choiceId) {
  return !!question && typeof choiceId === 'string' && choiceId === question.answer && question.choices.includes(choiceId);
}
