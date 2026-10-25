// Learners, sessions, runs and station records. Storage-agnostic and testable in Node.
// One "run" = one learner playing the 4 stations of one world once.
import { selectQuestions, orderChoices, isCorrect } from './content.js';
import { tr, choiceLabel } from './labels.js';
import { toCSV } from './csv.js';

export const STORE_VERSION = 1;
export const STARTING_COINS = 5;          // a new child can buy something small straight away
export const EMPTY_EQUIP = { head: null, hair: null, face: null, back: null, hand: null };

export function emptyStore() {
  return { version: STORE_VERSION, settings: {}, learners: {}, sessions: {}, runs: {}, currentSessionId: null,
    flags: { tutorialDone: false }, seq: { learner: 0, session: 0, run: 0, activity: 0 }, activities: [] };
}

const CONTROL = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028\u2029\ufeff]/g;
export function cleanName(raw, maxLen = 40) {
  return String(raw == null ? '' : raw).replace(CONTROL, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLen).trim();
}

// Turns the teacher's "one name per line" text into a clean list.
export function parseNameList(text, maxLen = 40, maxLearners = 60) {
  const lines = String(text || '').split(/\r?\n/);
  const names = [];
  let skippedEmpty = 0, truncated = 0, renamed = 0, overLimit = 0;
  const counts = {};
  for (const line of lines) {
    const raw = line.replace(CONTROL, ' ').replace(/\s+/g, ' ').trim();
    if (!raw) { if (line.trim() === '' && lines.length > 1) skippedEmpty++; continue; }
    let n = cleanName(raw, maxLen);
    if (raw.length > maxLen) truncated++;
    if (names.length >= maxLearners) { overLimit++; continue; }
    const key = n.toLowerCase();
    counts[key] = (counts[key] || 0) + 1;
    if (counts[key] > 1) { n = cleanName(`${n} (${counts[key]})`, maxLen + 5); renamed++; }
    names.push(n);
  }
  return { names, skippedEmpty, truncated, renamed, overLimit };
}

function isValidStore(d) {
  return d && typeof d === 'object' && d.version === STORE_VERSION && d.learners && d.sessions && d.runs && d.seq;
}

export function createProgress({ config, load, save, now = () => Date.now() }) {
  let data = null;
  try { data = load ? load() : null; } catch (e) { data = null; }
  if (!isValidStore(data)) data = emptyStore();
  // records saved by the first release have no activity list yet: add it (nothing else changes)
  if (!Array.isArray(data.activities)) data.activities = [];
  if (!data.seq.activity) data.seq.activity = 0;
  let lastSaveOk = true;

  const persist = () => {
    if (!save) return true;
    try { lastSaveOk = save(data) !== false; } catch (e) { lastSaveOk = false; }
    return lastSaveOk;
  };
  const newId = (kind, prefix) => { data.seq[kind] = (data.seq[kind] || 0) + 1; return prefix + data.seq[kind]; };
  const starter = () => Object.keys(config.rewards).filter((k) => config.rewards[k].type === 'outfit' && config.rewards[k].starter);

  function makeLearner(name) {
    const id = newId('learner', 'L');
    const l = { id, name, createdAt: now(), stars: 0, rewards: [], equipped: Object.assign({}, EMPTY_EQUIP),
      outfit: config.character.outfit, hair: { style: config.character.hairStyle, color: config.character.hairColor }, runIds: [] };
    data.learners[id] = l;
    return l;
  }

  const api = {
    get data() { return data; },
    get saveOk() { return lastSaveOk; },
    save: persist,

    settings() { return data.settings; },
    setSetting(key, value) { data.settings[key] = value; persist(); },
    flag(key) { return !!data.flags[key]; },
    setFlag(key, value) { data.flags[key] = !!value; persist(); },

    session() { const s = data.sessions[data.currentSessionId]; return s && s.status === 'active' ? s : null; },
    learner(id) { return data.learners[id] || null; },
    currentLearner() {
      const s = api.session();
      return s ? data.learners[s.learnerIds[s.currentIndex]] || null : null;
    },

    // A one-child session, created automatically when PLAY is pressed with no session.
    ensureSession({ worldId, ageGroup, lang, defaultName }) {
      if (api.session()) return api.session();
      return api.startSession({ mode: 'single', names: [defaultName], worldId, ageGroup, lang, reuseByName: true });
    },

    startSession({ mode, names, worldId, ageGroup, lang, reuseByName = true }) {
      const list = (names || []).map((n) => cleanName(n, config.classroomSettings.maxNameLength)).filter(Boolean);
      if (!list.length) throw new Error('EMPTY_NAMES');
      api.endSession();
      const learners = list.map((name) => {
        if (reuseByName) {
          const existing = Object.values(data.learners).find((l) => l.name.toLowerCase() === name.toLowerCase());
          if (existing) return existing;
        }
        return makeLearner(name);
      });
      // the same profile must not appear twice in one list
      const unique = [];
      for (const l of learners) if (!unique.includes(l)) unique.push(l);
      const id = newId('session', 'S');
      data.sessions[id] = { id, mode: mode === 'class' ? 'class' : 'single', learnerIds: unique.map((l) => l.id), currentIndex: 0,
        finishedLearnerIds: [], worldId, ageGroup, lang, startedAt: now(), endedAt: null, status: 'active' };
      data.currentSessionId = id;
      persist();
      return data.sessions[id];
    },

    endSession() {
      const s = api.session();
      if (!s) return null;
      for (const r of Object.values(data.runs)) {
        if (r.sessionId === s.id && r.status === 'active') { r.status = 'ended-early'; r.endedAt = now(); }
      }
      s.status = 'ended';
      s.endedAt = now();
      persist();
      return s;
    },

    switchLearner(learnerId) {
      const s = api.session();
      if (!s) return null;
      const idx = s.learnerIds.indexOf(learnerId);
      if (idx < 0) return null;
      s.currentIndex = idx;
      persist();
      return data.learners[learnerId];
    },

    // Marks the current learner as finished and moves to the next one who has not played.
    advanceLearner() {
      const s = api.session();
      if (!s) return null;
      const cur = s.learnerIds[s.currentIndex];
      if (cur && !s.finishedLearnerIds.includes(cur)) s.finishedLearnerIds.push(cur);
      for (let k = 1; k <= s.learnerIds.length; k++) {
        const idx = (s.currentIndex + k) % s.learnerIds.length;
        if (!s.finishedLearnerIds.includes(s.learnerIds[idx])) { s.currentIndex = idx; persist(); return data.learners[s.learnerIds[idx]]; }
      }
      persist();
      return null;
    },
    markFinished(learnerId) {
      const s = api.session();
      if (s && s.learnerIds.includes(learnerId) && !s.finishedLearnerIds.includes(learnerId)) { s.finishedLearnerIds.push(learnerId); persist(); }
    },
    peekNextLearner() {
      const s = api.session();
      if (!s) return null;
      for (let k = 1; k < s.learnerIds.length; k++) {
        const id = s.learnerIds[(s.currentIndex + k) % s.learnerIds.length];
        if (!s.finishedLearnerIds.includes(id)) return data.learners[id];
      }
      return null;
    },
    remainingLearners() {
      const s = api.session();
      return s ? s.learnerIds.filter((id) => !s.finishedLearnerIds.includes(id) && id !== s.learnerIds[s.currentIndex]).length : 0;
    },

    run(id) { return data.runs[id] || null; },
    activeRun(learnerId, worldId) {
      const l = data.learners[learnerId];
      if (!l) return null;
      for (let i = l.runIds.length - 1; i >= 0; i--) {
        const r = data.runs[l.runIds[i]];
        if (r && r.status === 'active' && r.worldId === worldId && r.sessionId === data.currentSessionId) return r;
      }
      return null;
    },

    startRun(learnerId, worldId, ageGroup, lang) {
      const l = data.learners[learnerId];
      const world = config.worldById[worldId];
      if (!l || !world) throw new Error('BAD_RUN');
      const prev = api.activeRun(learnerId, worldId);
      if (prev) { prev.status = 'ended-early'; prev.endedAt = now(); }
      const runNumber = l.runIds.length + 1;
      const recent = new Set();
      l.runIds.slice(-3).forEach((rid) => { const r = data.runs[rid]; if (r && r.worldId === worldId) r.stations.forEach((s) => recent.add(s.questionId)); });
      const seed = `${l.id}|${runNumber}|${worldId}|${data.currentSessionId}`;
      const qids = selectQuestions(config, world, ageGroup, seed, recent);
      const id = newId('run', 'R');
      const run = { id, learnerId, sessionId: data.currentSessionId, worldId, ageGroup, lang, runNumber, seed, startedAt: now(), endedAt: null, status: 'active',
        stations: world.stations.map((sid, i) => ({ stationId: sid, questionId: qids[i], choiceOrder: orderChoices(config, config.questionById[qids[i]], seed),
          attempts: 0, wrong: [], firstTry: null, completed: false, stars: 0, rewardId: null, rewardNew: false, openedAt: null, completedAt: null })) };
      data.runs[id] = run;
      l.runIds.push(id);
      persist();
      return run;
    },

    nextStationIndex(run) { return run.stations.findIndex((s) => !s.completed); },
    canPlayStation(run, idx) {
      if (!run || run.status !== 'active' || !run.stations[idx] || run.stations[idx].completed) return false;
      return !config.progressSettings.sequentialStations || idx === api.nextStationIndex(run);
    },
    markOpened(run, idx) { const s = run.stations[idx]; if (s && !s.openedAt) { s.openedAt = now(); persist(); } },

    /**
     * Records one tap on an answer. Wrong taps never remove stars or progress.
     * @returns {{ok:boolean, correct?:boolean, attempts?:number, firstTry?:boolean, done?:boolean, reward?:object}}
     */
    recordAnswer(runId, idx, choiceId) {
      const run = data.runs[runId];
      if (!run || run.status !== 'active') return { ok: false, reason: 'RUN_NOT_ACTIVE' };
      const st = run.stations[idx];
      if (!st) return { ok: false, reason: 'BAD_STATION' };
      if (st.completed) return { ok: false, reason: 'ALREADY_COMPLETE' };
      if (!api.canPlayStation(run, idx)) return { ok: false, reason: 'LOCKED' };
      const q = config.questionById[st.questionId];
      if (!q || !q.choices.includes(choiceId)) return { ok: false, reason: 'BAD_CHOICE' };
      if (st.wrong.includes(choiceId)) return { ok: false, reason: 'ALREADY_TRIED' };
      st.attempts += 1;
      const learner = data.learners[run.learnerId];
      if (!isCorrect(q, choiceId)) {
        st.wrong.push(choiceId);
        persist();
        return { ok: true, correct: false, attempts: st.attempts };
      }
      st.completed = true;
      st.firstTry = st.attempts === 1;
      st.stars = config.progressSettings.starsPerStation;
      st.completedAt = now();
      learner.stars += st.stars;
      const rewardId = config.stations[st.stationId].reward || null;
      let reward = null;
      if (rewardId && config.rewards[rewardId]) {
        st.rewardId = rewardId;
        st.rewardNew = !learner.rewards.includes(rewardId);
        if (st.rewardNew) learner.rewards.push(rewardId);
        const r = config.rewards[rewardId];
        if (r.type === 'accessory') learner.equipped[r.slot] = rewardId;
        if (r.type === 'outfit') learner.outfit = rewardId;
        reward = Object.assign({ id: rewardId, isNew: st.rewardNew }, r);
      }
      const done = run.stations.every((s) => s.completed);
      if (done) { run.status = 'complete'; run.endedAt = now(); }
      persist();
      return { ok: true, correct: true, attempts: st.attempts, firstTry: st.firstTry, done, reward, stars: st.stars };
    },

    endRunEarly(runId) {
      const run = data.runs[runId];
      if (!run || run.status !== 'active') return false;
      run.status = 'ended-early';
      run.endedAt = now();
      persist();
      return true;
    },

    resetLearner(learnerId) {
      let n = 0;
      for (const r of Object.values(data.runs)) {
        if (r.learnerId === learnerId && r.status === 'active') { r.status = 'reset'; r.endedAt = now(); n++; }
      }
      const s = api.session();
      if (s) s.finishedLearnerIds = s.finishedLearnerIds.filter((id) => id !== learnerId);
      persist();
      return n;
    },

    clearAll() {
      const settings = data.settings;
      data = emptyStore();
      data.settings = settings;
      persist();
    },

    equip(learnerId, slot, rewardId) {
      const l = data.learners[learnerId];
      if (!l || !(slot in l.equipped)) return false;
      if (rewardId !== null) {
        const r = config.rewards[rewardId];
        if (!r || r.type !== 'accessory' || r.slot !== slot || !l.rewards.includes(rewardId)) return false;
      }
      l.equipped[slot] = rewardId;
      persist();
      return true;
    },
    setOutfit(learnerId, rewardId) {
      const l = data.learners[learnerId];
      const r = config.rewards[rewardId];
      if (!l || !r || r.type !== 'outfit' || !(r.starter || l.rewards.includes(rewardId))) return false;
      l.outfit = rewardId;
      persist();
      return true;
    },
    setHair(learnerId, style, color) {
      const l = data.learners[learnerId];
      if (!l) return false;
      if (style) l.hair.style = style;
      if (color) l.hair.color = color;
      persist();
      return true;
    },
    ownedOutfits(learnerId) {
      const l = data.learners[learnerId];
      return Object.keys(config.rewards).filter((k) => config.rewards[k].type === 'outfit' && (config.rewards[k].starter || (l && l.rewards.includes(k))));
    },
    starterOutfits: starter,

    // ---- mini-game / Islamic-learning / free-quiz records (kept apart from the station records above) ----
    recordActivity(a) {
      const l = api.currentLearner();
      const end = now();
      const rec = {
        id: newId('activity', 'A'), learnerId: l ? l.id : null, sessionId: data.currentSessionId, kind: String(a.kind || 'minigame'), game: String(a.game || ''),
        level: a.level | 0, ageGroup: a.ageGroup || '', startedAt: a.startedAt || end, endedAt: end, completed: !!a.completed,
        rounds: a.rounds | 0, correct: a.correct | 0, mistakes: a.mistakes | 0, sticker: a.sticker || ''
      };
      data.activities.push(rec);
      if (data.activities.length > 3000) data.activities.splice(0, data.activities.length - 3000);
      persist();
      return rec;
    },
    activities(learnerId) { return data.activities.filter((x) => !learnerId || x.learnerId === learnerId); },
    activitySummary(learnerId) {
      const list = data.activities.filter((x) => x.learnerId === learnerId);
      const games = {};
      for (const x of list) { const g = games[x.kind + ':' + x.game] || (games[x.kind + ':' + x.game] = { plays: 0, completed: 0 }); g.plays++; if (x.completed) g.completed++; }
      return { total: list.length, completed: list.filter((x) => x.completed).length, games };
    },
    /** Gives a sticker once. Returns { ok, isNew }. */
    grantReward(learnerId, rewardId) {
      const l = data.learners[learnerId];
      const r = config.rewards[rewardId];
      if (!l || !r || r.type !== 'sticker') return { ok: false, isNew: false };
      const isNew = !l.rewards.includes(rewardId);
      if (isNew) { l.rewards.push(rewardId); persist(); }
      return { ok: true, isNew };
    },
    // ---- the town: coins, shopping bag, books read, fact boards read (records from older versions get these on first use) ----
    wallet(learnerId) {
      const l = data.learners[learnerId];
      if (!l) return null;
      if (typeof l.coins !== 'number' || !(l.coins >= 0)) l.coins = STARTING_COINS;
      if (!l.bag || typeof l.bag !== 'object') l.bag = {};
      if (!Array.isArray(l.books)) l.books = [];
      if (!Array.isArray(l.booksRead)) l.booksRead = [];
      if (!Array.isArray(l.factsSeen)) l.factsSeen = [];
      return l;
    },
    coins(learnerId) { const l = api.wallet(learnerId); return l ? l.coins : 0; },
    addCoins(learnerId, n) {
      const l = api.wallet(learnerId);
      if (!l || !(n > 0)) return l ? l.coins : 0;
      l.coins = Math.min(9999, l.coins + Math.floor(n));
      persist();
      return l.coins;
    },
    /**
     * Buys a shop item: { id, kind: book|food|toy|pet|wear, price, book?, reward? }.
     * Returns { ok, reason?: 'NO_COINS' | 'OWNED' | 'BAD_ITEM', coins }.
     */
    buy(learnerId, item) {
      const l = api.wallet(learnerId);
      if (!l || !item || !(item.price >= 0)) return { ok: false, reason: 'BAD_ITEM', coins: l ? l.coins : 0 };
      if (api.owns(learnerId, item)) return { ok: false, reason: 'OWNED', coins: l.coins };
      if (item.kind === 'wear' && !(item.reward && config.rewards[item.reward])) return { ok: false, reason: 'BAD_ITEM', coins: l.coins };
      if (l.coins < item.price) return { ok: false, reason: 'NO_COINS', coins: l.coins };
      l.coins -= item.price;
      if (item.kind === 'book') l.books.push(item.book);
      else if (item.kind === 'wear') {
        l.rewards.push(item.reward);
        const r = config.rewards[item.reward];
        if (r.type === 'accessory') l.equipped[r.slot] = item.reward;           // put it on straight away
        if (r.type === 'outfit') l.outfit = item.reward;
      } else l.bag[item.id] = (l.bag[item.id] || 0) + 1;
      persist();
      return { ok: true, coins: l.coins };
    },
    /** Books and clothes are bought once; food, toys and pet food can be bought again. */
    owns(learnerId, item) {
      const l = api.wallet(learnerId);
      if (!l || !item) return false;
      if (item.kind === 'book') return l.books.includes(item.book);
      if (item.kind === 'wear') return l.rewards.includes(item.reward);
      return false;
    },
    bagCount(learnerId, itemId) { const l = api.wallet(learnerId); return l ? l.bag[itemId] || 0 : 0; },
    /** Eats a food / feeds a pet (uses one up). Toys are kept. Returns false if there is none. */
    useItem(learnerId, item) {
      const l = api.wallet(learnerId);
      if (!l || !item || !(l.bag[item.id] > 0)) return false;
      if (item.kind === 'food' || item.kind === 'pet') { l.bag[item.id] -= 1; if (!l.bag[item.id]) delete l.bag[item.id]; persist(); }
      return true;
    },
    /** The first time a child reads a fact board or finishes a book, they get a coin. Returns true that first time. */
    markFact(learnerId, factId) {
      const l = api.wallet(learnerId);
      if (!l || l.factsSeen.includes(factId)) return false;
      l.factsSeen.push(factId);
      persist();
      return true;
    },
    markBookRead(learnerId, bookId) {
      const l = api.wallet(learnerId);
      if (!l || l.booksRead.includes(bookId)) return false;
      l.booksRead.push(bookId);
      persist();
      return true;
    },
    exportActivitiesCSV(scope, lang, T, nameOf = (x) => x) {
      const sessionId = data.currentSessionId;
      const fmt = (t) => { if (!t) return ''; const d = new Date(t); const z = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; };
      const rows = data.activities.filter((x) => scope === 'all' || x.sessionId === sessionId).map((x) => {
        const l = data.learners[x.learnerId];
        return [l ? l.name : '?', x.sessionId || '', fmt(x.startedAt), T['actKind_' + x.kind] || x.kind, nameOf(x), x.level, x.ageGroup, x.completed ? T.yes : T.no, x.rounds, x.correct, x.mistakes,
          Math.max(0, Math.round((x.endedAt - x.startedAt) / 1000)), x.sticker && config.rewards[x.sticker] ? tr(config.rewards[x.sticker].name, lang) : ''];
      });
      return { csv: toCSV(T.actCsvHeaders, rows), rowCount: rows.length };
    },

    // Per-learner numbers for the Teacher area.
    summary(learnerId, sessionId = data.currentSessionId) {
      const runs = Object.values(data.runs).filter((r) => r.learnerId === learnerId && (!sessionId || r.sessionId === sessionId));
      let stations = 0, completed = 0, attempts = 0, firstTry = 0, stars = 0;
      for (const r of runs) for (const s of r.stations) {
        stations++; attempts += s.attempts; stars += s.stars;
        if (s.completed) completed++;
        if (s.firstTry) firstTry++;
      }
      return { runs: runs.length, stations, completed, attempts, firstTry, stars, completion: stations ? Math.round((completed / stations) * 100) : 0,
        worldsComplete: [...new Set(runs.filter((r) => r.status === 'complete').map((r) => r.worldId))] };
    },

    // Rows for the CSV file. scope: 'session' (current session) or 'all'.
    exportCSV(scope, lang, T) {
      const sessionId = data.currentSessionId;
      const runs = Object.values(data.runs)
        .filter((r) => scope === 'all' || r.sessionId === sessionId)
        .sort((a, b) => a.startedAt - b.startedAt);
      const headers = T.csvHeaders;
      const fmt = (t) => {
        if (!t) return '';
        const d = new Date(t);
        const z = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`;
      };
      const rows = [];
      for (const r of runs) {
        const l = data.learners[r.learnerId];
        const sess = data.sessions[r.sessionId];
        const world = config.worldById[r.worldId];
        r.stations.forEach((s, i) => {
          const st = config.stations[s.stationId];
          const q = config.questionById[s.questionId];
          let status;
          if (s.completed) status = T.statusComplete;
          else if (r.status === 'ended-early') status = T.statusEndedEarly;
          else if (r.status === 'reset') status = T.statusReset;
          else status = s.attempts ? T.statusInProgress : T.statusNotStarted;
          const reward = s.rewardId && config.rewards[s.rewardId] ? tr(config.rewards[s.rewardId].name, lang) : '';
          rows.push([
            l ? l.name : '?', r.sessionId, fmt(sess ? sess.startedAt : r.startedAt), sess && sess.mode === 'class' ? T.modeClass : T.modeSingle,
            r.runNumber, r.ageGroup, world ? tr(world.name, lang).replace('{character}', config.character.name) : r.worldId, i + 1,
            st ? tr(st.title, lang) : s.stationId, s.questionId, q ? tr(q.prompt, lang) : '', s.attempts,
            s.completed ? (s.firstTry ? T.yes : T.no) : '-', status, s.stars, reward,
            q && s.completed ? choiceLabel(q.answer, lang, config.answerChoices) : '', fmt(s.completedAt)
          ]);
        });
      }
      return { csv: toCSV(headers, rows), rowCount: rows.length };
    }
  };
  return api;
}
