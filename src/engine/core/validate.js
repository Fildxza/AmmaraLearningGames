// Checks the teacher configuration before the game starts.
// Broken entries are skipped (never crash the game) and listed for the Teacher area.
import { QUESTION_TYPES, REWARD_TYPES, SLOTS, ACCESSORY_MODELS, LANDMARKS, HAIR_STYLES, MASCOT_STYLES } from './catalog.js';
import { choiceLabel, tr } from './labels.js';

export const DEFAULTS = {
  gameTitle: 'AmmaraGames',
  subtitle: { ms: 'Langkah Kecil, Penemuan Besar!', en: 'Little Steps, Big Discoveries!' },
  mascotName: 'Bintang',
  mascotStyle: 'star',
  character: { name: 'Ammara', hairStyle: 'pigtails', hairColor: '#4a2c22', hijabColor: '#b79cff', skinTone: '#f6cfb0', eyeColor: '#2e1f1a', outfit: 'outfit_pink', shoeColor: '#ff7eb6' },
  themeColors: { pink: '#ff7eb6', lavender: '#b79cff', sky: '#6cc4ff', mint: '#5fd6a8', butter: '#ffd65a', peach: '#ffa86b', cream: '#fff8ee', brown: '#6b4a3a', ink: '#4a3428' },
  defaultLanguage: 'ms',
  availableLanguages: ['ms', 'en'],
  ageGroups: [{ id: '2-3', label: { ms: '2–3 tahun', en: 'Age 2–3' } }, { id: '3-4', label: { ms: '3–4 tahun', en: 'Age 3–4' } }, { id: '4+', label: { ms: '4+ tahun', en: 'Age 4+' } }],
  defaultAgeGroup: '2-3',
  audioSettings: { enabled: true, musicEnabled: true, musicVolume: 0.45, effectsVolume: 0.75, defaultMusic: 'cheerful', readQuestionsAloud: true },
  movementSettings: { walkSpeed: 4.4, acceleration: 16, turnSpeed: 12, playerRadius: 0.45, interactDistance: 1.4, tapToWalk: true },
  cameraSettings: { defaultDistance: 'normal', distances: { near: { height: 5.6, back: 7 }, normal: { height: 8.2, back: 10 }, far: { height: 11, back: 13.2 } }, fieldOfView: 48, smoothing: 3.6 },
  classroomSettings: { allowClassList: true, maxLearners: 60, maxNameLength: 40, adultGateHoldMs: 1500, defaultLearnerName: { ms: 'Pemain', en: 'Player' } },
  accessibilitySettings: { reducedMotion: 'auto', quizAutoCloseMs: 1000, showAnswerLabels: true, largeButtons: true, showTutorial: true },
  progressSettings: { stationsPerWorld: 4, sequentialStations: true, shuffleAnswers: true, randomizeQuestions: true, starsPerStation: 1, saveProgressOnThisComputer: true },
  rewards: {}, worlds: [], stations: {}, answerChoices: {}, correctAnswers: {}, questions: []
};

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isText = (v) => (typeof v === 'string' && v.trim().length > 0) || (isObj(v) && Object.values(v).some((s) => typeof s === 'string' && s.trim()));
const HEX = /^#[0-9a-fA-F]{6}$/;

function mergeDefaults(def, val) {
  if (!isObj(def)) return val === undefined ? def : val;
  const out = {};
  const src = isObj(val) ? val : {};
  for (const k of Object.keys(def)) out[k] = mergeDefaults(def[k], src[k]);
  for (const k of Object.keys(src)) if (!(k in out)) out[k] = src[k];
  return out;
}

/**
 * @param raw   window.AMMARA_CONFIG (may be missing or malformed)
 * @param deps  { isIconKey(key) }
 * @returns {{ config, errors: object[], warnings: object[], stats: object }}
 */
export function validateConfig(raw, deps) {
  const errors = [];
  const warnings = [];
  const err = (code, message, ref) => errors.push({ code, message, ref });
  const warn = (code, message, ref) => warnings.push({ code, message, ref });
  const isIconKey = deps && deps.isIconKey ? deps.isIconKey : () => true;

  if (!isObj(raw)) {
    err('CONFIG_MISSING', 'AMMARA_CONFIG is missing or is not an object. Built-in defaults are used.');
    raw = {};
  }
  const required = ['gameTitle', 'subtitle', 'mascotName', 'mascotStyle', 'themeColors', 'defaultLanguage', 'availableLanguages', 'ageGroups',
    'worlds', 'stations', 'questions', 'answerChoices', 'correctAnswers', 'rewards', 'audioSettings', 'movementSettings', 'cameraSettings',
    'classroomSettings', 'accessibilitySettings', 'progressSettings'];
  for (const k of required) if (!(k in raw)) warn('CONFIG_KEY_MISSING', `Setting "${k}" is missing; using the default.`, k);

  const cfg = {};
  for (const k of Object.keys(DEFAULTS)) {
    cfg[k] = isObj(DEFAULTS[k]) ? mergeDefaults(DEFAULTS[k], raw[k]) : (raw[k] === undefined ? DEFAULTS[k] : raw[k]);
  }
  for (const k of Object.keys(raw)) if (!(k in cfg)) cfg[k] = raw[k];

  // --- identity & settings ------------------------------------------------
  if (typeof cfg.gameTitle !== 'string' || !cfg.gameTitle.trim()) { warn('TITLE', 'gameTitle is empty; using "AmmaraGames".'); cfg.gameTitle = DEFAULTS.gameTitle; }
  cfg.gameTitle = cfg.gameTitle.trim().slice(0, 40);
  if (!MASCOT_STYLES.includes(cfg.mascotStyle)) { warn('MASCOT', `mascotStyle "${cfg.mascotStyle}" is unknown; using "star".`); cfg.mascotStyle = 'star'; }
  if (!HAIR_STYLES.includes(cfg.character.hairStyle)) { warn('HAIR', `character.hairStyle "${cfg.character.hairStyle}" is unknown; using "pigtails".`); cfg.character.hairStyle = 'pigtails'; }
  for (const k of ['hairColor', 'hijabColor', 'skinTone', 'eyeColor', 'shoeColor']) {
    if (!HEX.test(cfg.character[k])) { warn('COLOR', `character.${k} must look like #a1b2c3.`, k); cfg.character[k] = DEFAULTS.character[k]; }
  }
  if (!Array.isArray(cfg.availableLanguages) || !cfg.availableLanguages.length) { warn('LANG', 'availableLanguages is empty; using ms and en.'); cfg.availableLanguages = ['ms', 'en']; }
  cfg.availableLanguages = cfg.availableLanguages.filter((l) => typeof l === 'string' && l.length >= 2);
  if (!cfg.availableLanguages.includes(cfg.defaultLanguage)) { warn('LANG', `defaultLanguage "${cfg.defaultLanguage}" is not in availableLanguages.`); cfg.defaultLanguage = cfg.availableLanguages[0]; }
  const langs = cfg.availableLanguages;

  if (!Array.isArray(cfg.ageGroups) || !cfg.ageGroups.length) { warn('AGES', 'ageGroups is empty; using defaults.'); cfg.ageGroups = DEFAULTS.ageGroups; }
  cfg.ageGroups = cfg.ageGroups.filter((a) => isObj(a) && typeof a.id === 'string');
  const ageIds = cfg.ageGroups.map((a) => a.id);
  if (!ageIds.includes(cfg.defaultAgeGroup)) cfg.defaultAgeGroup = ageIds[0];

  const clampNum = (obj, key, min, max) => {
    const v = Number(obj[key]);
    if (!Number.isFinite(v) || v < min || v > max) { warn('RANGE', `${key} must be between ${min} and ${max}.`, key); obj[key] = Math.min(max, Math.max(min, Number.isFinite(v) ? v : min)); }
    else obj[key] = v;
  };
  clampNum(cfg.audioSettings, 'musicVolume', 0, 1);
  clampNum(cfg.audioSettings, 'effectsVolume', 0, 1);
  clampNum(cfg.movementSettings, 'walkSpeed', 1, 10);
  clampNum(cfg.movementSettings, 'playerRadius', 0.25, 0.8);
  clampNum(cfg.movementSettings, 'interactDistance', 0.5, 4);
  clampNum(cfg.accessibilitySettings, 'quizAutoCloseMs', 300, 10000);
  clampNum(cfg.classroomSettings, 'maxLearners', 1, 200);
  clampNum(cfg.classroomSettings, 'maxNameLength', 4, 80);
  clampNum(cfg.classroomSettings, 'adultGateHoldMs', 0, 6000);
  if (!['near', 'normal', 'far'].includes(cfg.cameraSettings.defaultDistance)) cfg.cameraSettings.defaultDistance = 'normal';
  const spw = cfg.progressSettings.stationsPerWorld;
  if (spw !== 4) { warn('STATIONS_PER_WORLD', 'stationsPerWorld must be 4 in this version; using 4.'); cfg.progressSettings.stationsPerWorld = 4; }

  // --- vocabulary --------------------------------------------------------
  const vocab = isObj(cfg.answerChoices) ? cfg.answerChoices : {};
  for (const [k, v] of Object.entries(vocab)) {
    if (!isObj(v) || !isText(v)) { err('CHOICE_BAD', `answerChoices["${k}"] needs names like { ms: '…', en: '…' }.`, k); delete vocab[k]; continue; }
    for (const l of langs) if (!v[l]) warn('TRANSLATION', `answerChoices["${k}"] has no ${l} name.`, k);
    if (v.icon && !isIconKey(v.icon)) { warn('ICON', `answerChoices["${k}"].icon "${v.icon}" is not a known picture.`, k); delete v.icon; }
    if (!k.startsWith('color:') && !k.startsWith('shape:') && !v.emoji && !v.image && !v.icon && !isIconKey(k)) {
      err('CHOICE_NO_PICTURE', `answerChoices["${k}"] has no picture. Add emoji, image or icon.`, k);
      delete vocab[k];
    }
  }
  cfg.answerChoices = vocab;
  const choiceOk = (key) => typeof key === 'string' && (vocab[key] !== undefined || isIconKey(key));

  // --- rewards -----------------------------------------------------------
  const rewards = isObj(cfg.rewards) ? cfg.rewards : {};
  for (const [id, r] of Object.entries(rewards)) {
    let bad = '';
    if (!isObj(r) || !REWARD_TYPES.includes(r.type)) bad = 'type must be accessory, outfit or sticker';
    else if (r.type === 'accessory' && (!SLOTS.includes(r.slot) || !ACCESSORY_MODELS.includes(r.model))) bad = `accessory needs slot (${SLOTS.join('/')}) and a known model`;
    else if (r.type === 'sticker' && !isIconKey(r.icon)) bad = `sticker icon "${r.icon}" is not a known picture`;
    else if (r.type === 'outfit' && !(HEX.test(r.color) || r.color === 'rainbow')) bad = 'outfit colour must look like #a1b2c3 or be "rainbow"';
    else if (!isText(r.name)) bad = 'name is missing';
    if (bad) { err('REWARD_BAD', `Reward "${id}": ${bad}.`, id); delete rewards[id]; }
  }
  cfg.rewards = rewards;
  if (!rewards[cfg.character.outfit] || rewards[cfg.character.outfit].type !== 'outfit') {
    const first = Object.keys(rewards).find((k) => rewards[k].type === 'outfit');
    if (cfg.character.outfit) warn('OUTFIT', `character.outfit "${cfg.character.outfit}" is not an outfit reward.`);
    cfg.character.outfit = first || null;
  }

  // --- questions ---------------------------------------------------------
  const overrides = isObj(cfg.correctAnswers) ? cfg.correctAnswers : {};
  const seen = new Set();
  const questions = [];
  const qById = {};
  const rawQuestions = Array.isArray(cfg.questions) ? cfg.questions : [];
  if (!Array.isArray(cfg.questions)) err('QUESTIONS_MISSING', 'questions must be a list.');
  rawQuestions.forEach((q, index) => {
    const ref = q && q.id ? q.id : `#${index + 1}`;
    const fail = (code, msg) => err(code, `Question ${ref}: ${msg}`, ref);
    if (!isObj(q)) return fail('Q_BAD', 'is not an object.');
    if (typeof q.id !== 'string' || !q.id.trim()) return fail('Q_ID', 'has no id.');
    if (seen.has(q.id)) return fail('Q_DUP', 'duplicate id (skipped the second copy).');
    seen.add(q.id);
    if (!isText(q.prompt)) return fail('Q_PROMPT', 'prompt is empty.');
    if (!Array.isArray(q.choices) || q.choices.length < 2 || q.choices.length > 4) return fail('Q_CHOICES', 'needs 2 to 4 choices (3 recommended).');
    if (q.choices.length !== 3) warn('Q_CHOICES_COUNT', `Question ${ref}: has ${q.choices.length} choices; 3 is recommended.`, ref);
    if (new Set(q.choices).size !== q.choices.length) return fail('Q_CHOICE_DUP', 'two choices are the same.');
    const badChoice = q.choices.find((c) => !choiceOk(c));
    if (badChoice !== undefined) return fail('Q_CHOICE_UNKNOWN', `choice "${badChoice}" is not a known picture or answerChoices entry.`);
    let answer = q.answer;
    if (overrides[q.id] !== undefined) {
      if (q.choices.includes(overrides[q.id])) answer = overrides[q.id];
      else err('OVERRIDE_BAD', `correctAnswers["${q.id}"] = "${overrides[q.id]}" is not one of its choices; kept "${q.answer}".`, q.id);
    }
    if (typeof answer !== 'string' || !answer) return fail('Q_ANSWER', 'has no answer.');
    if (!q.choices.includes(answer)) return fail('Q_ANSWER_NOT_CHOICE', `answer "${answer}" is not one of its choices.`);
    const ages = Array.isArray(q.ages) ? q.ages.filter((a) => ageIds.includes(a)) : [];
    if (!ages.length) return fail('Q_AGES', `ages must include at least one of ${ageIds.join(', ')}.`);
    if (Array.isArray(q.ages) && ages.length !== q.ages.length) warn('Q_AGES_UNKNOWN', `Question ${ref}: unknown age group ignored.`, ref);
    const type = QUESTION_TYPES.includes(q.type) ? q.type : 'choose';
    if (q.type && !QUESTION_TYPES.includes(q.type)) warn('Q_TYPE', `Question ${ref}: type "${q.type}" is not supported; treated as "choose".`, ref);
    const difficulty = [1, 2, 3].includes(q.difficulty) ? q.difficulty : 1;
    if (q.difficulty !== undefined && difficulty !== q.difficulty) warn('Q_DIFFICULTY', `Question ${ref}: difficulty must be 1, 2 or 3.`, ref);
    let art = q.art;
    if (art !== undefined && !isIconKey(art)) { warn('Q_ART', `Question ${ref}: art "${art}" is not a known picture; hidden.`, ref); art = undefined; }
    if (art !== undefined && art === answer && type !== 'match' && type !== 'shadow') return fail('Q_ART_SPOILER', `the big picture "${art}" is the answer itself; only "match" questions may show it.`);
    for (const l of langs) {
      if (!(typeof q.prompt === 'string' || q.prompt[l])) warn('TRANSLATION', `Question ${ref}: prompt has no ${l} text.`, ref);
      if (q.hint && typeof q.hint === 'object' && !q.hint[l]) warn('TRANSLATION', `Question ${ref}: hint has no ${l} text.`, ref);
      if (q.explain && typeof q.explain === 'object' && !q.explain[l]) warn('TRANSLATION', `Question ${ref}: explain has no ${l} text.`, ref);
    }
    // Letter-sound questions: only the answer may start with the letter, in every language.
    if (q.letter) {
      const L = String(q.letter).toLowerCase();
      for (const l of langs) {
        const ansLabel = choiceLabel(answer, l, vocab).toLowerCase();
        if (!ansLabel.startsWith(L)) fail('Q_LETTER', `answer "${ansLabel}" (${l}) does not start with "${q.letter}".`);
        for (const c of q.choices) {
          if (c !== answer && choiceLabel(c, l, vocab).toLowerCase().startsWith(L)) fail('Q_LETTER', `distractor "${choiceLabel(c, l, vocab)}" (${l}) also starts with "${q.letter}".`);
        }
      }
      if (errors.some((e) => e.ref === ref && e.code === 'Q_LETTER')) return;
    }
    const clean = { id: q.id, station: q.station, objective: q.objective || 'general', ages, difficulty, type, prompt: q.prompt, art,
      choices: q.choices.slice(), answer, hint: q.hint || null, explain: q.explain || null, letter: q.letter || null };
    questions.push(clean);
    qById[clean.id] = clean;
  });
  cfg.questions = questions;
  cfg.questionById = qById;

  // --- stations ------------------------------------------------------------
  const stations = isObj(cfg.stations) ? cfg.stations : {};
  const stationOk = {};
  for (const [id, s] of Object.entries(stations)) {
    if (!isObj(s) || !isText(s.title)) { err('STATION_BAD', `Station "${id}" needs a title.`, id); continue; }
    if (!LANDMARKS.includes(s.landmark)) { warn('STATION_LANDMARK', `Station "${id}": landmark "${s.landmark}" is unknown; a toy box is used.`, id); s.landmark = 'toyBox'; }
    if (s.icon && !isIconKey(s.icon)) { warn('STATION_ICON', `Station "${id}": icon "${s.icon}" is not a known picture.`, id); s.icon = 'star'; }
    if (!HEX.test(s.color)) s.color = '#ff7eb6';
    if (s.reward && !rewards[s.reward]) { warn('STATION_REWARD', `Station "${id}": reward "${s.reward}" does not exist; only a star is given.`, id); s.reward = null; }
    let pool;
    if (s.pool === 'auto' || s.pool === undefined) pool = questions.filter((q) => q.station === id).map((q) => q.id);
    else if (Array.isArray(s.pool)) {
      pool = s.pool.filter((qid) => {
        if (!qById[qid]) { warn('STATION_POOL', `Station "${id}": question "${qid}" is missing or invalid; skipped.`, id); return false; }
        return true;
      });
    } else { warn('STATION_POOL', `Station "${id}": pool must be "auto" or a list.`, id); pool = []; }
    if (!pool.length) { err('STATION_EMPTY', `Station "${id}" has no valid questions.`, id); continue; }
    const byAge = {};
    for (const a of ageIds) {
      byAge[a] = pool.filter((qid) => qById[qid].ages.includes(a));
      if (!byAge[a].length) warn('STATION_AGE_GAP', `Station "${id}" has no question for age ${a}; the nearest age is used.`, id);
    }
    if (s.defaultQuestion && !pool.includes(s.defaultQuestion)) { warn('STATION_DEFAULT', `Station "${id}": defaultQuestion "${s.defaultQuestion}" is not in its pool.`, id); s.defaultQuestion = null; }
    stationOk[id] = Object.assign({}, s, { id, pool, poolByAge: byAge, randomize: s.randomize !== false });
  }
  cfg.stations = stationOk;
  for (const q of questions) {
    if (q.station && !stationOk[q.station] && !stations[q.station]) warn('Q_STATION', `Question ${q.id}: station "${q.station}" does not exist.`, q.id);
  }

  // --- worlds --------------------------------------------------------------
  const worlds = [];
  const worldIds = new Set();
  (Array.isArray(cfg.worlds) ? cfg.worlds : []).forEach((w, i) => {
    const ref = w && w.id ? w.id : `#${i + 1}`;
    if (!isObj(w) || typeof w.id !== 'string') return err('WORLD_BAD', `World ${ref} has no id.`, ref);
    if (worldIds.has(w.id)) return err('WORLD_DUP', `World ${ref}: duplicate id.`, ref);
    if (!isText(w.name)) return err('WORLD_NAME', `World ${ref} has no name.`, ref);
    if (!Array.isArray(w.stations) || w.stations.length !== 4) return err('WORLD_STATIONS', `World ${ref} must list exactly 4 stations.`, ref);
    const missing = w.stations.filter((sid) => !stationOk[sid]);
    if (missing.length) return err('WORLD_STATION_MISSING', `World ${ref}: station(s) ${missing.join(', ')} missing or empty; world hidden.`, ref);
    worldIds.add(w.id);
    const clean = Object.assign({ icon: 'star', color: '#ff7eb6', wall: '#ffe9f2', wainscot: '#c9b6ff', rug: '#ffd65a', bunting: ['#ff7eb6', '#ffd65a', '#6cc4ff', '#5fd6a8'], posters: [] }, w);
    if (!isIconKey(clean.icon)) clean.icon = 'star';
    clean.posters = (clean.posters || []).filter((k) => isIconKey(k)).slice(0, 3);
    for (const k of ['color', 'wall', 'wainscot', 'rug']) if (!HEX.test(clean[k])) clean[k] = '#ffd65a';
    clean.bunting = (clean.bunting || []).filter((c) => HEX.test(c));
    if (!clean.bunting.length) clean.bunting = ['#ff7eb6', '#ffd65a', '#6cc4ff'];
    worlds.push(clean);
  });
  if (!worlds.length) err('NO_WORLDS', 'No playable world was found in the configuration.');
  cfg.worlds = worlds;
  cfg.worldById = Object.fromEntries(worlds.map((w) => [w.id, w]));

  // --- stats ---------------------------------------------------------------
  const perWorld = {};
  for (const w of worlds) {
    const ids = new Set();
    for (const sid of w.stations) cfg.stations[sid].pool.forEach((q) => ids.add(q));
    perWorld[w.id] = ids.size;
  }
  const perAge = Object.fromEntries(ageIds.map((a) => [a, questions.filter((q) => q.ages.includes(a)).length]));
  const stats = { questionsInFile: rawQuestions.length, questionsValid: questions.length, questionsSkipped: rawQuestions.length - questions.length,
    worlds: worlds.length, stations: Object.keys(stationOk).length, rewards: Object.keys(rewards).length, perWorld, perAge };
  return { config: cfg, errors, warnings, stats };
}

// Text helper re-exported for UI code.
export { tr };
