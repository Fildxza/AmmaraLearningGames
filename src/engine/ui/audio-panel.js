// "Voice & Sound": volumes, mute, and the narrator's voice list with preview. Every statement here is about
// what the browser really reports; it never claims that a voice is cute or female (only "likely", as a guess).
import { $, esc, show } from './dom.js';
import { G } from './glyphs.js';
import { t } from '../i18n.js';
import { RATE_RANGE, PITCH_RANGE } from '../narrator.js';

const LANG_NAME = { ms: 'Bahasa Melayu', en: 'English' };

export function createAudioPanel(api) {
  const root = $('#audio');
  let vm = null;

  const slider = (key, label, min, max, step, value) => `<label class="aud-slider"><span>${esc(label)}</span>
    <input type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-k="${key}" data-testid="aud-${key}"><output>${Number(value).toFixed(2)}</output></label>`;

  function voiceSection(lang) {
    const s = vm.status[lang];
    const list = vm.voices[lang] || [];
    let status;
    if (!vm.supported) status = `<p class="aud-status warn" data-testid="aud-status-${lang}">${esc(t('nvUnsupported'))}</p>`;
    else if (s.state === 'no-voice') status = `<p class="aud-status warn" data-testid="aud-status-${lang}">${esc(t('nvNone', { lang: LANG_NAME[lang] }))}</p>`;
    else status = `<p class="aud-status ok" data-testid="aud-status-${lang}">${esc(t('nvUsing', { name: s.voice.name, lang: s.voice.lang }))}${s.substitute ? '<br>' + esc(t('nvSubstitute')) : ''}</p>`;
    const items = list.map((v) => {
      const on = vm.narrator.voiceUri[lang] === v.uri || (!vm.narrator.voiceUri[lang] && s.voice && s.voice.uri === v.uri);
      return `<li><button class="voice-pick" data-voice="${esc(v.uri)}" data-lang="${lang}" aria-pressed="${on}">
        <b>${esc(v.name)}</b><small>${esc(v.lang)}</small>
        <span class="tag">${esc(t('nvLocal'))}</span>${v.likelyFemale === true ? `<span class="tag guess">${esc(t('nvGuessFemale'))}</span>` : ''}</button>
        <button class="pill-btn small" data-preview="${lang}" data-voice="${esc(v.uri)}" aria-label="${esc(t('listen'))}">${G.speaker}<span>${esc(t('listen'))}</span></button></li>`;
    }).join('');
    return `<section class="aud-voices" data-lang="${lang}"><h3>${esc(t('voicesFor', { lang: LANG_NAME[lang] }))}</h3>${status}
      ${list.length ? `<ul class="voice-list">${items}</ul><button class="pill-btn small" data-act="auto" data-lang="${lang}">${esc(t('voiceAuto'))}</button>` : ''}</section>`;
  }

  function render() {
    const n = vm.narrator;
    const order = vm.lang === 'en' ? ['en', 'ms'] : ['ms', 'en'];
    root.innerHTML = `<div class="dialog-card audio-card" role="dialog" aria-modal="true" aria-labelledby="aud-title">
      <div class="map-head"><h2 id="aud-title">${esc(t('audioTitle'))}</h2><button class="icon-btn" data-act="close" data-testid="aud-close" aria-label="${esc(t('close'))}">${G.close}</button></div>
      <div class="aud-toggles">
        <button class="pill-btn" data-act="mute" aria-pressed="${!vm.sound}" data-testid="aud-mute">${vm.sound ? G.soundOn : G.soundOff}<span>${esc(vm.sound ? t('muteAll') : t('unmuteAll'))}</span></button>
        <button class="pill-btn" data-act="narrator" aria-pressed="${n.enabled}" data-testid="aud-narrator">${G.speaker}<span>${esc(n.enabled ? t('narratorOn') : t('narratorOff'))}</span></button>
      </div>
      <div class="aud-sliders">
        ${slider('musicVolume', t('volMusic'), 0, 1, 0.05, vm.musicVolume)}
        ${slider('effectsVolume', t('volFx'), 0, 1, 0.05, vm.effectsVolume)}
        ${slider('nVolume', t('volVoice'), 0, 1, 0.05, n.volume)}
        ${slider('nRate', t('voiceRate'), RATE_RANGE.min, RATE_RANGE.max, 0.05, n.rate)}
        ${slider('nPitch', t('voicePitch'), PITCH_RANGE.min, PITCH_RANGE.max, 0.05, n.pitch)}
      </div>
      ${order.map(voiceSection).join('')}
      <p class="aud-note">${esc(t('nvGuessNote'))} ${esc(t('nvDisclaimer'))}</p>
      <p class="aud-note">${esc(t('nvNoQuran'))}</p>
      <button class="btn btn-play" data-act="close" data-testid="aud-done">${G.check}<span>${esc(t('voiceDone'))}</span></button></div>`;
  }

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.act === 'close') { api.close(); return; }
    if (b.dataset.act === 'mute') { api.action('mute'); refresh(); return; }
    if (b.dataset.act === 'narrator') { api.action('narrator', !vm.narrator.enabled); refresh(); return; }
    if (b.dataset.act === 'auto') { api.action('voice', { lang: b.dataset.lang, uri: null }); refresh(); return; }
    if (b.dataset.preview) { api.action('preview', { lang: b.dataset.preview, uri: b.dataset.voice }); return; }
    if (b.dataset.voice) { api.action('voice', { lang: b.dataset.lang, uri: b.dataset.voice }); refresh(); }
  });
  root.addEventListener('input', (e) => {
    const r = e.target.closest('input[type=range]');
    if (!r) return;
    r.nextElementSibling.textContent = Number(r.value).toFixed(2);
    api.action('slider', { key: r.dataset.k, value: Number(r.value) });
  });
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); api.close(); } });

  function refresh() { vm = api.vm(); const y = root.firstElementChild ? root.firstElementChild.scrollTop : 0; render(); if (root.firstElementChild) root.firstElementChild.scrollTop = y; }
  return {
    open() { vm = api.vm(); render(); show(root, true); setTimeout(() => { const b = root.querySelector('[data-testid=aud-done]'); if (b) b.focus(); }, 30); },
    close() { show(root, false); root.innerHTML = ''; },
    refresh() { if (!root.hidden) refresh(); },
    get isOpen() { return !root.hidden; }
  };
}
