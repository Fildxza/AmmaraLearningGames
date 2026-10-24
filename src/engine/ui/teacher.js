// Teacher & Parent area: sessions, learners, records, CSV export, settings and info.
import { $, esc, show } from './dom.js';
import { G } from './glyphs.js';
import { t } from '../i18n.js';

const TABS = [['session', 'tabSession', 'users'], ['learners', 'tabLearners', 'list'], ['records', 'tabRecords', 'table'], ['export', 'tabExport', 'download'], ['settings', 'tabSettings', 'gear'], ['info', 'tabInfo', 'info']];

export function createTeacher(api) {
  const root = $('#teacher');
  let tab = 'session';
  let mode = 'single';
  let recFilter = 'all', recScope = 'session';
  let draftNames = '', draftSingle = '', draftWorld = null, draftAge = null, reuse = true;
  let message = '';

  root.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-t]');
    if (!el || el.disabled) return;
    const a = el.dataset.t, arg = el.dataset.arg;
    if (a === 'tab') { tab = arg; message = ''; render(); }
    else if (a === 'exit') api.exit();
    else if (a === 'mode') { mode = arg; render(); }
    else if (a === 'start' || a === 'startPlay') {
      const res = await api.startSession({ mode, namesText: mode === 'class' ? draftNames : draftSingle, worldId: draftWorld, age: draftAge, reuse, play: a === 'startPlay' });
      if (res && res.message) { message = res.message; render(); }
    } else if (a === 'endSession') { if (await api.endSession()) { message = ''; render(); } }
    else if (a === 'switch') { api.switchLearner(arg); render(); }
    else if (a === 'reset') { if (await api.resetLearner(arg)) render(); }
    else if (a === 'finishLearner') { if (await api.finishLearner()) render(); }
    else if (a === 'csv') { message = api.downloadCsv(arg); render(); }
    else if (a === 'csvact') { message = api.downloadActivities(arg); render(); }
    else if (a === 'clear') { if (await api.clearAll()) { message = t('cleared'); render(); } }
    else if (a === 'tutorial') { api.setSetting('tutorial', true); message = t('tutorialWillShow'); render(); }
  });
  root.addEventListener('input', (e) => {
    const el = e.target;
    if (el.id === 't-names') { draftNames = el.value; updateNameInfo(); }
    if (el.id === 't-single') draftSingle = el.value;
    if (el.dataset.setting && el.type === 'range') { api.setSetting(el.dataset.setting, Number(el.value)); const out = root.querySelector(`output[for="${el.id}"]`); if (out) out.textContent = el.dataset.setting === 'autoClose' ? t('seconds', { n: (Number(el.value) / 1000).toFixed(1) }) : Math.round(Number(el.value) * 100) + '%'; }
  });
  root.addEventListener('change', (e) => {
    const el = e.target;
    if (el.id === 't-world') draftWorld = el.value;
    if (el.id === 't-age') draftAge = el.value;
    if (el.id === 't-reuse') reuse = el.checked;
    if (el.id === 'r-filter') { recFilter = el.value; render(); }
    if (el.id === 'r-scope') { recScope = el.value; render(); }
    if (el.dataset.setting && el.type !== 'range') {
      const v = el.type === 'checkbox' ? el.checked : el.value;
      api.setSetting(el.dataset.setting, v);
      if (el.dataset.setting === 'lang') render();
    }
  });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.body.classList.contains('dialog-open')) { e.preventDefault(); api.exit(); }
  });

  function updateNameInfo() {
    const info = root.querySelector('#t-names-info');
    if (!info) return;
    const p = api.parseNames(draftNames);
    info.textContent = p.names.length ? t('namesInfo', { n: p.names.length, e: p.skippedEmpty, d: p.renamed }) + (p.overLimit ? ' ' + t('namesLimit', { max: p.max }) : '') : t('namesNone');
  }

  function sessionTab(vm) {
    const s = vm.session;
    const worldOpts = vm.worlds.map((w) => `<option value="${esc(w.id)}" ${w.id === (draftWorld || vm.defaultWorld) ? 'selected' : ''}>${esc(w.name)}</option>`).join('');
    const ageOpts = vm.ages.map((a) => `<option value="${esc(a.id)}" ${a.id === (draftAge || vm.settings.age) ? 'selected' : ''}>${esc(a.label)}</option>`).join('');
    if (!draftWorld) draftWorld = vm.defaultWorld;
    if (!draftAge) draftAge = vm.settings.age;
    return `<section class="t-box">
        <h3>${esc(t('currentSession'))}</h3>
        ${s ? `<dl class="t-facts"><dt>${esc(t('mode'))}</dt><dd>${esc(s.mode === 'class' ? t('modeClass') : t('modeSingle'))}</dd>
          <dt>${esc(t('tabLearners'))}</dt><dd>${s.learners}</dd><dt>${esc(t('world'))}</dt><dd>${esc(s.worldName)}</dd><dt>${esc(t('age'))}</dt><dd>${esc(s.age)}</dd>
          <dt>${esc(t('started'))}</dt><dd>${esc(s.started)}</dd></dl>
          <button class="btn btn-ghost small" data-t="endSession" data-testid="t-end-session">${G.flag}<span>${esc(t('endSession'))}</span></button>` : `<p class="muted">${esc(t('noSession'))}</p>`}
      </section>
      <section class="t-box">
        <h3>${esc(t('startSession'))}</h3>
        <div class="t-seg">
          <button class="seg-btn ${mode === 'single' ? 'on' : ''}" data-t="mode" data-arg="single" data-testid="t-mode-single">${G.user}<span>${esc(t('modeSingle'))}</span></button>
          <button class="seg-btn ${mode === 'class' ? 'on' : ''}" data-t="mode" data-arg="class" data-testid="t-mode-class">${G.users}<span>${esc(t('modeClass'))}</span></button>
        </div>
        ${mode === 'class'
          ? `<label for="t-names">${esc(t('classNames'))}</label><textarea id="t-names" rows="7" data-testid="t-names" placeholder="${esc(t('namesPlaceholder'))}" spellcheck="false">${esc(draftNames)}</textarea><p id="t-names-info" class="muted small" aria-live="polite"></p>`
          : `<label for="t-single">${esc(t('singleName'))}</label><input id="t-single" data-testid="t-single" maxlength="${vm.maxName}" value="${esc(draftSingle)}" autocomplete="off">`}
        <div class="t-row">
          <label>${esc(t('world'))}<select id="t-world" data-testid="t-world">${worldOpts}</select></label>
          <label>${esc(t('age'))}<select id="t-age" data-testid="t-age">${ageOpts}</select></label>
        </div>
        <label class="check"><input type="checkbox" id="t-reuse" ${reuse ? 'checked' : ''}> ${esc(t('reuseProfiles'))}</label>
        <div class="t-actions">
          <button class="btn btn-sky" data-t="start" data-testid="t-start">${G.check}<span>${esc(t('startSession'))}</span></button>
          <button class="btn btn-play" data-t="startPlay" data-testid="t-start-play">${G.play}<span>${esc(t('startAndPlay'))}</span></button>
        </div>
      </section>`;
  }

  function learnersTab(vm) {
    if (!vm.learners.length) return `<p class="muted">${esc(t('noSession'))}</p>`;
    return `<div class="t-table-wrap"><table class="t-table" data-testid="t-learners">
      <thead><tr><th>#</th><th>${esc(t('colName'))}</th><th>${esc(t('colStatus'))}</th><th>${esc(t('colProgress'))}</th><th>${esc(t('colStars'))}</th><th>${esc(t('colFirstTry'))}</th><th>${esc(t('colAttempts'))}</th><th></th></tr></thead>
      <tbody>${vm.learners.map((l, i) => `<tr class="${l.current ? 'current' : ''}">
        <td>${i + 1}</td><td><b>${esc(l.name)}</b></td>
        <td><span class="tag ${l.status}">${esc(t(l.status === 'current' ? 'nowPlaying' : l.status === 'finished' ? 'finished' : 'waiting'))}</span></td>
        <td><span class="bar"><i style="width:${l.completion}%"></i></span> ${l.completed}/${l.stations || 4}</td>
        <td>${l.stars}</td><td>${l.firstTry}</td><td>${l.attempts}</td>
        <td class="t-btns">${l.current ? `<button class="btn btn-ghost tiny" data-t="finishLearner" data-testid="t-finish-learner">${esc(t('finishLearner'))}</button>` : `<button class="btn btn-sky tiny" data-t="switch" data-arg="${esc(l.id)}" data-testid="t-switch-${i}">${esc(t('switchTo'))}</button>`}
          <button class="btn btn-ghost tiny" data-t="reset" data-arg="${esc(l.id)}" data-testid="t-reset-${i}">${esc(t('resetLearner'))}</button></td></tr>`).join('')}</tbody></table></div>`;
  }

  function recordsTab(vm) {
    const r = api.records(recScope, recFilter);
    const opts = [`<option value="all">${esc(t('allLearners'))}</option>`].concat(r.learners.map((l) => `<option value="${esc(l.id)}" ${l.id === recFilter ? 'selected' : ''}>${esc(l.name)}</option>`)).join('');
    return `<div class="t-row">
        <label>${esc(t('colName'))}<select id="r-filter">${opts}</select></label>
        <label>${esc(t('tabSession'))}<select id="r-scope"><option value="session" ${recScope === 'session' ? 'selected' : ''}>${esc(t('currentSession'))}</option><option value="all" ${recScope === 'all' ? 'selected' : ''}>${esc(t('csvAll').replace(/.*\((.*)\)/, '$1'))}</option></select></label>
      </div>
      <div class="t-cards">
        <div class="t-stat"><b>${r.summary.completion}%</b><span>${esc(t('completionRate'))}</span></div>
        <div class="t-stat"><b>${r.summary.avgAttempts}</b><span>${esc(t('avgAttempts'))}</span></div>
        <div class="t-stat"><b>${r.summary.firstTryRate}%</b><span>${esc(t('firstTryRate'))}</span></div>
      </div>
      ${r.rows.length ? `<div class="t-table-wrap"><table class="t-table" data-testid="t-records"><thead><tr><th>${esc(t('colName'))}</th><th>${esc(t('colWorld'))}</th><th>${esc(t('colStation'))}</th><th>${esc(t('colQuestion'))}</th><th>${esc(t('colAttempts'))}</th><th>${esc(t('colFirstTry'))}</th><th>${esc(t('colStatus'))}</th><th>${esc(t('colStars'))}</th><th>${esc(t('colReward'))}</th></tr></thead>
        <tbody>${r.rows.map((x) => `<tr><td>${esc(x.learner)}</td><td>${esc(x.world)}</td><td>${esc(x.station)}</td><td class="q">${esc(x.question)}</td><td>${x.attempts}</td><td>${esc(x.firstTry)}</td><td>${esc(x.status)}</td><td>${x.stars}</td><td>${esc(x.reward)}</td></tr>`).join('')}</tbody></table></div>` : `<p class="muted">${esc(t('noRecords'))}</p>`}`;
  }

  function exportTab() {
    return `<section class="t-box">
        <p>${esc(t('csvNote'))}</p>
        <div class="t-actions">
          <button class="btn btn-sky" data-t="csv" data-arg="session" data-testid="t-csv-session">${G.download}<span>${esc(t('csvSession'))}</span></button>
          <button class="btn btn-mint" data-t="csv" data-arg="all" data-testid="t-csv-all">${G.download}<span>${esc(t('csvAll'))}</span></button>
          <button class="btn btn-lav" data-t="csvact" data-arg="all" data-testid="t-csv-activities">${G.download}<span>${esc(t('downloadActivities'))}</span></button>
        </div>
      </section>
      <section class="t-box danger-zone">
        <button class="btn btn-red" data-t="clear" data-testid="t-clear">${G.trash}<span>${esc(t('clearAll'))}</span></button>
      </section>`;
  }

  function settingsTab(vm) {
    const s = vm.settings;
    const sel = (key, label, opts) => `<label>${esc(label)}<select data-setting="${key}" data-testid="set-${key}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(s[key]) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
    const tog = (key, label) => `<label class="switch"><input type="checkbox" data-setting="${key}" data-testid="set-${key}" ${s[key] ? 'checked' : ''}><span class="sw"></span><span>${esc(label)}</span></label>`;
    const rng = (key, label, min, max, step, fmt) => `<label for="set-${key}">${esc(label)}</label><div class="range-row"><input type="range" id="set-${key}" data-setting="${key}" data-testid="set-${key}" min="${min}" max="${max}" step="${step}" value="${s[key]}"><output for="set-${key}">${esc(fmt(s[key]))}</output></div>`;
    return `<div class="t-grid">
      <section class="t-box">
        ${sel('lang', t('setLanguage'), vm.langs.map((l) => [l.id, l.label]))}
        ${sel('age', t('setAge'), vm.ages.map((a) => [a.id, a.label]))}
        ${sel('camera', t('setCamera'), [['near', t('camNear')], ['normal', t('camNormal')], ['far', t('camFar')]])}
        ${sel('quality', t('setQuality'), [['auto', t('qualityAuto')], ['high', t('qualityHigh')], ['low', t('qualityLow')]])}
        ${sel('motion', t('setMotion'), [['auto', t('motionAuto')], ['on', t('motionOn')], ['off', t('motionOff')]])}
      </section>
      <section class="t-box">
        ${tog('sound', t('setSound'))}
        ${tog('music', t('setMusic'))}
        ${sel('musicStyle', t('setMusicStyle'), [['cheerful', t('musicCheerful')], ['calm', t('musicCalm')]])}
        ${rng('musicVolume', t('setMusicVol'), 0, 1, 0.05, (v) => Math.round(v * 100) + '%')}
        ${rng('effectsVolume', t('setSfxVol'), 0, 1, 0.05, (v) => Math.round(v * 100) + '%')}
        ${tog('readAloud', t('setRead'))}
        <p class="muted small">${esc(vm.voiceStatus)}</p>
        ${rng('autoClose', t('setAutoClose'), 600, 4000, 100, (v) => t('seconds', { n: (v / 1000).toFixed(1) }))}
        <button class="btn btn-ghost small" data-t="tutorial">${G.refresh}<span>${esc(t('showTutorialAgain'))}</span></button>
      </section></div>`;
  }

  function infoTab(vm) {
    const i = vm.info;
    return `<section class="t-box"><h3>${esc(t('privacyTitle'))}</h3><ul class="t-list">${t('privacy').map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
        <p class="${i.storageOk ? 'ok' : 'warn'}">${esc(i.storageOk ? t('storageOk') : t('storageBad'))}</p><p class="muted">${esc(t('offlineNote'))}</p></section>
      <section class="t-box"><h3>${esc(t('diagnostics'))}</h3>
        <p>${esc(t('configSummary', { q: i.stats.questionsValid, w: i.stats.worlds, s: i.stats.questionsSkipped }))}</p>
        <h4>${esc(t('configProblems'))} (${i.errors.length})</h4>
        ${i.errors.length ? `<ul class="t-list small" data-testid="t-config-errors">${i.errors.slice(0, 40).map((e) => `<li><code>${esc(e.code)}</code> ${esc(e.message)}</li>`).join('')}</ul>` : `<p class="ok">${esc(t('noProblems'))}</p>`}
        <details><summary>${esc(t('configWarnings', { n: i.warnings.length }))}</summary><ul class="t-list small">${i.warnings.slice(0, 80).map((e) => `<li><code>${esc(e.code)}</code> ${esc(e.message)}</li>`).join('')}</ul></details>
        <details><summary>${esc(t('errorLog'))} (${i.log.length})</summary><ul class="t-list small">${i.log.slice(-25).map((e) => `<li><code>${esc(e.code)}</code> ${esc(e.message)}</li>`).join('')}</ul></details>
        <p class="muted small">${esc(t('version'))}: ${esc(i.version)} · ${esc(i.renderer)}</p>
        <p class="muted small">${esc(t('attributions'))}</p></section>`;
  }

  function render() {
    const vm = api.vm();
    const body = { session: sessionTab, learners: learnersTab, records: recordsTab, export: exportTab, settings: settingsTab, info: infoTab }[tab](vm);
    root.innerHTML = `<div class="teacher-panel" role="dialog" aria-modal="true" aria-labelledby="t-title">
      <header class="t-head"><span class="t-head-icon">${G.teacher}</span><h2 id="t-title">${esc(t('teacherTitle'))}</h2>
        <span class="spacer"></span><span class="muted small">${esc(vm.learnerLine)}</span>
        <button class="btn btn-pink small" data-t="exit" data-testid="t-exit">${G.close}<span>${esc(t('exit'))}</span></button></header>
      <nav class="t-tabs" role="tablist">${TABS.map(([id, key, glyph]) => `<button role="tab" class="t-tab ${id === tab ? 'on' : ''}" aria-selected="${id === tab}" data-t="tab" data-arg="${id}" data-testid="t-tab-${id}">${G[glyph]}<span>${esc(t(key))}</span></button>`).join('')}</nav>
      ${message ? `<div class="t-message" role="status" data-testid="t-message">${esc(message)}</div>` : ''}
      <div class="t-body">${body}</div></div>`;
    if (tab === 'session' && mode === 'class') updateNameInfo();
  }

  return {
    open(startTab) { if (startTab) tab = startTab; message = ''; render(); show(root, true); setTimeout(() => { const b = root.querySelector('.t-tab.on'); if (b) b.focus(); }, 30); },
    close() { show(root, false); root.innerHTML = ''; },
    render,
    setMessage(m) { message = m; render(); }
  };
}
