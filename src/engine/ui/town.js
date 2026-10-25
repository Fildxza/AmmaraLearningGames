// The town's screens: a shop (prices shown as coins to count), "My Bag", the picture-book reader, the
// "Did you know?" card and the clock-tower card. One overlay (#town), opened from the 3D world.
import { $, esc, show } from './dom.js';
import { t, getLang } from '../i18n.js';
import { tr } from '../core/labels.js';
import { G } from './glyphs.js';
import { SHOPS } from '../../data/shops.js';
import { bookById } from '../../data/books.js';

const coinRow = (n, coin) => `<span class="coin-row" aria-label="${n}">${coin.repeat(Math.min(n, 6))}<b>${n}</b></span>`;

/**
 * host: { iconFor(key), speak(text), coins(), owns(item), count(itemId), buy(item) -> {ok, reason, coins},
 *         use(item) -> tip text or null, bookDone(book) -> true when a coin was given, onClose() }
 */
export function createTownUI(host) {
  const root = $('#town');
  let view = null;                        // { kind: 'shop' | 'bag' | 'reader' | 'fact' | 'clock', ... }
  const L = () => getLang();
  const coin = () => `<span class="coin-ic">${host.iconFor('coin')}</span>`;
  const head = (icon, title, color) => `<div class="town-head" style="--tc:${color || '#ff7eb6'}"><span class="th-ic">${host.iconFor(icon)}</span><h2 id="town-title">${esc(title)}</h2>
      <span class="wallet" data-testid="town-wallet">${coin()}<b>${host.coins()}</b></span>
      <button class="icon-btn" data-act="close" data-testid="town-close" aria-label="${esc(t('close'))}">${G.close}</button></div>`;
  const card = (cls, inner) => `<div class="dialog-card town-card ${cls}" role="dialog" aria-modal="true" aria-labelledby="town-title">${inner}</div>`;

  function render() {
    if (!view) { root.innerHTML = ''; return; }
    if (view.kind === 'shop') return renderShop();
    if (view.kind === 'bag') return renderBag();
    if (view.kind === 'reader') return renderReader();
    if (view.kind === 'fact') return renderFact();
    if (view.kind === 'clock') return renderClock();
  }

  // ---- shop
  function renderShop() {
    const shop = SHOPS[view.shop];
    const items = shop.items.map((it) => {
      const owned = host.owns(it), have = host.count(it.id), afford = host.coins() >= it.price;
      const state = owned ? 'owned' : afford ? 'buy' : 'poor';
      const btn = owned ? `<button class="btn btn-mint" data-act="useitem" data-id="${it.id}">${esc(t(it.kind === 'book' ? 'readNow' : 'owned'))}</button>`
        : `<button class="btn ${afford ? 'btn-butter' : 'btn-grey'}" data-act="buy" data-id="${it.id}" data-testid="buy-${it.id}" ${afford ? '' : 'aria-disabled="true"'}>${esc(t(afford ? 'buy' : 'needCoins'))}</button>`;
      return `<div class="shop-item ${state}" data-testid="item-${it.id}"><span class="si-pic">${host.iconFor(it.icon)}</span><span class="si-name">${esc(tr(it.name, L()))}</span>
        ${coinRow(it.price, coin())}${have ? `<span class="si-have">${esc(t('inBag', { n: have }))}</span>` : ''}${btn}</div>`;
    }).join('');
    root.innerHTML = card('shop-card', `${head(shop.icon, tr(shop.name, L()), shop.color)}
      <p class="town-msg" data-testid="town-msg">${esc(view.msg || tr(shop.greet, L()))}</p>
      <div class="shop-grid">${items}</div>
      <div class="town-actions"><button class="btn btn-lav" data-act="bag" data-testid="town-bag">${G.bag}<span>${esc(t('myBag'))}</span></button></div>`);
  }
  function buy(id) {
    const it = SHOPS[view.shop].items.find((x) => x.id === id);
    if (!it) return;
    const r = host.buy(it);
    if (r.ok) {
      const name = tr(it.name, L());
      view.msg = it.kind === 'book' ? t('boughtBook', { name }) : it.kind === 'wear' ? t('boughtWear', { name }) : t('bought', { name });
      host.speak(view.msg);
      render();
      if (it.kind === 'book') setTimeout(() => api.openReader(it.book), 600);
    } else {
      view.msg = r.reason === 'NO_COINS' ? t('notEnoughCoins', { n: it.price - host.coins() }) : t('owned');
      host.speak(view.msg);
      render();
    }
  }

  // ---- my bag
  function renderBag() {
    const all = Object.values(SHOPS).flatMap((s) => s.items);
    const books = Object.values(bookById).filter((b) => host.owns({ kind: 'book', book: b.id }));
    const things = all.filter((it) => it.kind !== 'book' && it.kind !== 'wear' && host.count(it.id) > 0)
      .filter((it, k, arr) => arr.findIndex((x) => x.id === it.id) === k);
    const row = (pic, name, act, id, label, extra = '') => `<div class="bag-item"><span class="si-pic">${host.iconFor(pic)}</span><span class="si-name">${esc(name)}</span>${extra}
      <button class="btn btn-butter" data-act="${act}" data-id="${id}" data-testid="${act}-${id}">${esc(label)}</button></div>`;
    const list = [
      ...books.map((b) => row(b.cover, tr(b.title, L()), 'read', b.id, t('read'))),
      ...things.map((it) => row(it.icon, tr(it.name, L()), 'useitem', it.id, t(it.kind === 'food' ? 'eat' : it.kind === 'pet' ? 'feedPet' : 'playToy'), `<span class="si-have">×${host.count(it.id)}</span>`))
    ].join('');
    root.innerHTML = card('bag-card', `${head('shopping_bag', t('myBag'), '#9b6bff')}
      <p class="town-msg" data-testid="town-msg">${esc(view.msg || (list ? t('bagHint') : t('bagEmpty')))}</p>
      <div class="bag-list">${list}</div>`);
  }
  function useItem(id) {
    const it = Object.values(SHOPS).flatMap((s) => s.items).find((x) => x.id === id);
    if (!it) return;
    if (it.kind === 'book') { api.openReader(it.book); return; }
    if (it.kind === 'wear') { view.msg = t('wearingIt'); host.speak(view.msg); render(); return; }
    const tip = host.use(it);
    if (tip) { view.msg = tip; host.speak(tip); root.querySelector('.town-card') && root.querySelector('.town-card').classList.add('yum'); }
    render();
  }

  // ---- reader
  function renderReader() {
    const b = bookById[view.book], pg = b.pages[view.page], last = view.page === b.pages.length - 1;
    const arts = Array.isArray(pg.art) ? pg.art : [pg.art];
    root.innerHTML = card('reader-card', `${head(b.cover, tr(b.title, L()), b.color)}
      <div class="reader-pic">${arts.map((a) => `<span class="rp">${host.iconFor(a)}</span>`).join('')}</div>
      <p class="reader-text" data-testid="reader-text">${esc(tr(pg.text, L()))}</p>
      ${last && b.moral ? `<p class="reader-moral">${G.star}<span>${esc(tr(b.moral, L()))}</span></p>` : ''}
      ${last && view.reward ? `<p class="reader-reward" data-testid="reader-reward">${coin()}<span>${esc(t('bookCoin'))}</span></p>` : ''}
      <div class="reader-nav">
        <button class="btn btn-lav big-arrow" data-act="prev" data-testid="reader-prev" ${view.page ? '' : 'disabled'} aria-label="${esc(t('back'))}">${G.left}</button>
        <span class="page-dots">${b.pages.map((_, k) => `<i class="${k === view.page ? 'on' : ''}"></i>`).join('')}</span>
        <button class="btn btn-peach" data-act="listen" data-testid="reader-listen">${G.voice}<span>${esc(t('listen'))}</span></button>
        ${last ? `<button class="btn btn-mint big-arrow" data-act="done" data-testid="reader-done">${G.check || G.star}<span>${esc(t('theEnd'))}</span></button>`
          : `<button class="btn btn-mint big-arrow" data-act="next" data-testid="reader-next" aria-label="${esc(t('next'))}">${G.right}</button>`}
      </div>
      <p class="reader-src">${esc(tr(b.source, L()))}</p>`);
  }
  const readPage = () => { const b = bookById[view.book]; host.speak(tr(b.pages[view.page].text, L())); };
  function turn(d) {
    const b = bookById[view.book];
    const np = Math.max(0, Math.min(b.pages.length - 1, view.page + d));
    if (np === view.page) return;
    view.page = np;
    if (np === b.pages.length - 1 && !view.rewardChecked) { view.rewardChecked = true; view.reward = host.bookDone(b); }
    render(); readPage();
  }

  // ---- fact card
  function renderFact() {
    const f = view.fact;
    root.innerHTML = card('fact-card', `${head('star', t('didYouKnow'), '#ffb400')}
      <div class="fact-pic">${host.iconFor(f.icon)}</div>
      <p class="fact-text" data-testid="fact-text">${esc(tr(f.text, L()))}</p>
      ${view.reward ? `<p class="reader-reward" data-testid="fact-reward">${coin()}<span>${esc(t('factCoin'))}</span></p>` : ''}
      <div class="town-actions"><button class="btn btn-peach" data-act="listen" data-testid="fact-listen">${G.voice}<span>${esc(t('listen'))}</span></button>
      <button class="btn btn-mint" data-act="close" data-testid="fact-ok">${esc(t('ok'))}</button></div>`);
  }

  // ---- clock tower
  function timeWords(d, lang) {
    const h = d.getHours(), m = d.getMinutes(), h12 = ((h + 11) % 12) + 1, mm = String(m).padStart(2, '0');
    // Malay names the part of the day: tengah malam (midnight hour), pagi, tengah hari, petang, malam
    if (lang === 'ms') { const part = h === 0 ? 'tengah malam' : h < 12 ? 'pagi' : h < 14 ? 'tengah hari' : h < 19 ? 'petang' : 'malam'; return { digits: `${h12}:${mm}`, say: `Sekarang pukul ${h12}${m ? ' dan ' + m + ' minit' : ''}, ${part}.` }; }
    const part = h < 5 ? 'at night' : h < 12 ? 'in the morning' : h < 18 ? 'in the afternoon' : 'in the evening';
    return { digits: `${h12}:${mm}`, say: `It is ${h12}${m ? ':' + mm : " o'clock"} ${part}.` };
  }
  function clockSvg(d) {
    const m = d.getMinutes(), h = (d.getHours() % 12) + m / 60, ma = (m / 60) * 360, ha = (h / 12) * 360;
    let ticks = '';
    for (let k = 1; k <= 12; k++) { const a = (k / 12) * Math.PI * 2; ticks += `<text x="${100 + Math.sin(a) * 74}" y="${100 - Math.cos(a) * 74}" font-size="20" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="#5b3f33">${k}</text>`; }
    return `<svg viewBox="0 0 200 200" class="clock-svg" role="img" aria-label="clock"><circle cx="100" cy="100" r="94" fill="#fffaf1" stroke="#8f86e8" stroke-width="10"/>${ticks}
      <line x1="100" y1="100" x2="100" y2="52" stroke="#5b3f33" stroke-width="9" stroke-linecap="round" transform="rotate(${ha} 100 100)"/>
      <line x1="100" y1="100" x2="100" y2="32" stroke="#ff6fa8" stroke-width="6" stroke-linecap="round" transform="rotate(${ma} 100 100)"/><circle cx="100" cy="100" r="7" fill="#5b3f33"/></svg>`;
  }
  function renderClock() {
    const d = new Date(), w = timeWords(d, L());
    root.innerHTML = card('clock-card', `${head('clock', t('whatTime'), '#8f86e8')}
      <div class="clock-wrap">${clockSvg(d)}<p class="clock-digits" data-testid="clock-digits">${esc(w.digits)}</p></div>
      <p class="fact-text">${esc(w.say)}</p>
      <p class="town-msg">${esc(t('clockHint'))}</p>
      <div class="town-actions"><button class="btn btn-peach" data-act="listen">${G.voice}<span>${esc(t('listen'))}</span></button><button class="btn btn-mint" data-act="close">${esc(t('ok'))}</button></div>`);
    view.say = w.say;
  }

  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || !view) return;
    const act = b.dataset.act, id = b.dataset.id;
    if (act === 'close') api.close();
    else if (act === 'buy') { if (b.getAttribute('aria-disabled') === 'true') { view.msg = t('notEnoughCoins', { n: 1 }); host.speak(view.msg); render(); } else buy(id); }
    else if (act === 'bag') api.openBag();
    else if (act === 'useitem') useItem(id);
    else if (act === 'read') api.openReader(id);
    else if (act === 'prev') turn(-1);
    else if (act === 'next') turn(1);
    else if (act === 'done') api.close();
    else if (act === 'listen') { if (view.kind === 'reader') readPage(); else if (view.kind === 'fact') host.speak(tr(view.fact.text, L())); else if (view.kind === 'clock') host.speak(view.say); }
  });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); api.close(); }
    else if (view && view.kind === 'reader' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); turn(e.key === 'ArrowRight' ? 1 : -1); }
  });
  const open = (v) => { view = v; render(); show(root, true); setTimeout(() => { const f = root.querySelector('[data-act="close"]'); if (f) f.focus(); }, 30); };

  const api = {
    get isOpen() { return !root.hidden; },
    get view() { return view ? view.kind : null; },
    openShop(shop) { open({ kind: 'shop', shop }); host.speak(tr(SHOPS[shop].greet, L())); },
    openBag() { open({ kind: 'bag' }); },
    openReader(bookId) {
      const b = bookById[bookId];
      if (!b) return;
      open({ kind: 'reader', book: bookId, page: 0, reward: false, rewardChecked: b.pages.length === 1 });
      host.speak(tr(b.title, L()) + '. ' + tr(b.pages[0].text, L()));
    },
    openFact(fact, reward) { open({ kind: 'fact', fact, reward }); host.speak(t('didYouKnow') + ' ' + tr(fact.text, L())); },
    openClock() { open({ kind: 'clock' }); host.speak(view.say); },
    /** for the automatic tests: turn the reader's page */
    turn,
    close() { view = null; show(root, false); root.innerHTML = ''; if (host.onClose) host.onClose(); }
  };
  return api;
}
