// The big friendly quiz panel: a picture, one short question and three large picture answers.
import { $, esc, show } from './dom.js';
import { G } from './glyphs.js';
import { t } from '../i18n.js';

const CARD_COLORS = ['pink', 'peach', 'sky', 'mint'];

export function createQuiz({ onAnswer, onClose, onContinue, onListen, iconSvg }) {
  const root = $('#quiz');
  let open = false;
  let solved = false;
  let choiceIds = [];

  root.addEventListener('click', (e) => {
    const a = e.target.closest('[data-choice]');
    if (a && open && !solved && !a.disabled) { onAnswer(a.dataset.choice); return; }
    if (e.target.closest('[data-q="close"]')) onClose();
    else if (e.target.closest('[data-q="listen"]')) onListen();
    else if (e.target.closest('[data-q="continue"]')) onContinue();
  });
  document.addEventListener('keydown', (e) => {
    if (!open || document.body.classList.contains('dialog-open')) return;
    if (!solved && ['1', '2', '3', '4'].includes(e.key)) {
      const id = choiceIds[Number(e.key) - 1];
      const btn = id && root.querySelector(`[data-choice="${CSS.escape(id)}"]`);
      if (btn && !btn.disabled) { e.preventDefault(); onAnswer(id); }
    } else if (e.key === 'Escape') { e.preventDefault(); if (solved) onContinue(); else onClose(); }
    else if (solved && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onContinue(); }
  });

  return {
    get isOpen() { return open; },
    /**
     * @param q { stationNo, stationTitle, topic, color, prompt, art, choices:[{id,label}], canListen, mascot, showLabels }
     */
    open(q) {
      solved = false;
      choiceIds = q.choices.map((c) => c.id);
      const wide = q.art && (q.art.startsWith('seq:') || q.art.startsWith('mix:') || q.art.startsWith('bubble:'));
      root.style.setProperty('--station', q.color);
      root.innerHTML = `<div class="quiz-panel" role="dialog" aria-modal="true" aria-labelledby="quiz-q">
        <header class="quiz-head">
          <span class="quiz-badge">${esc(q.badge || t('quizStation', { n: q.stationNo }))}</span>
          <span class="quiz-title">${esc(q.stationTitle)}</span>
          <span class="quiz-topic">${esc(q.topic)}</span>
          <span class="spacer"></span>
          ${q.canListen ? `<button class="icon-btn" data-q="listen" aria-label="${esc(t('listen'))}" title="${esc(t('listen'))}">${G.speaker}</button>` : ''}
          <button class="icon-btn" data-q="close" data-testid="quiz-close" aria-label="${esc(t('notNow'))}" title="${esc(t('notNow'))}">${G.close}</button>
        </header>
        <div class="quiz-art ${wide ? 'wide' : ''}">
          <div class="quiz-mascot">${q.mascot}</div>
          ${q.art ? `<div class="quiz-bubble">${iconSvg(q.art, 'quiz-art-svg')}</div>` : ''}
        </div>
        <h2 class="quiz-q" id="quiz-q">${esc(q.prompt)}</h2>
        <div class="answers n${q.choices.length}" role="group" aria-label="${esc(q.prompt)}">
          ${q.choices.map((c, i) => `<button class="answer c-${CARD_COLORS[i % CARD_COLORS.length]}" data-choice="${esc(c.id)}" data-testid="answer-${i}" aria-label="${esc(c.label)}">
              <span class="answer-key" aria-hidden="true">${i + 1}</span>
              <span class="pic">${iconSvg(c.id, 'answer-svg', c.custom)}</span>
              ${q.showLabels ? `<span class="label">${esc(c.label)}</span>` : ''}
              <span class="mark" aria-hidden="true"></span>
            </button>`).join('')}
        </div>
        <div class="feedback" aria-live="assertive"><span class="fb-text"></span></div>
        <button class="btn btn-mint quiz-continue" data-q="continue" data-testid="quiz-continue" hidden>${esc(t('keepGoing'))} ${G.next}</button>
        <div class="burst" aria-hidden="true"></div>
      </div>`;
      show(root, true);
      open = true;
      document.body.classList.add('quiz-open');
      requestAnimationFrame(() => { root.classList.add('in'); const first = root.querySelector('.answer'); if (first) first.focus({ preventScroll: true }); });
    },
    markWrong(choiceId, message, hint) {
      const btn = root.querySelector(`[data-choice="${CSS.escape(choiceId)}"]`);
      if (btn) {
        btn.classList.remove('wiggle'); void btn.offsetWidth; btn.classList.add('wiggle', 'tried');
        btn.disabled = true;
        btn.setAttribute('aria-disabled', 'true');
      }
      const fb = root.querySelector('.feedback');
      fb.className = 'feedback try';
      fb.innerHTML = `<span class="fb-icon">${G.heart}</span><span class="fb-text"><b>${esc(message)}</b> ${esc(hint || '')}</span>`;
      const next = root.querySelector('.answer:not(:disabled)');
      if (next) next.focus({ preventScroll: true });
    },
    markCorrect(choiceId, praise, explain) {
      solved = true;
      root.querySelectorAll('.answer').forEach((b) => { b.disabled = true; if (b.dataset.choice !== choiceId) b.classList.add('faded'); });
      const btn = root.querySelector(`[data-choice="${CSS.escape(choiceId)}"]`);
      if (btn) { btn.classList.add('right'); btn.querySelector('.mark').innerHTML = G.check; }
      const fb = root.querySelector('.feedback');
      fb.className = 'feedback yay';
      fb.innerHTML = `<span class="fb-icon">${G.star}</span><span class="fb-text"><b>${esc(praise)}</b> ${esc(explain || '')}</span>`;
      const burst = root.querySelector('.burst');
      burst.innerHTML = Array.from({ length: 12 }, (_, i) => `<i style="--a:${i * 30}deg;--d:${(i % 3) * 0.06}s">${i % 2 ? G.star : G.sparkle}</i>`).join('');
      burst.classList.add('go');
      const cont = root.querySelector('.quiz-continue');
      cont.hidden = false;
      setTimeout(() => cont.focus({ preventScroll: true }), 60);
    },
    close() {
      if (!open) return;
      open = false;
      solved = false;
      root.classList.remove('in');
      document.body.classList.remove('quiz-open');
      show(root, false);
      root.innerHTML = '';
    }
  };
}
