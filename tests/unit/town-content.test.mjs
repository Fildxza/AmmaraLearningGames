import test from 'node:test';
import assert from 'node:assert/strict';
import { BOOKS, bookById } from '../../src/data/books.js';
import { FACTS, FACT_TOPICS } from '../../src/data/facts.js';
import { SHOPS, itemById, COIN_RULES } from '../../src/data/shops.js';
import { isIconKey } from '../../src/engine/art/icons.js';
import { createProgress, STARTING_COINS } from '../../src/engine/core/progress.js';
import { validated } from './helpers.mjs';

const { config } = validated();
const text = (o) => o && typeof o.ms === 'string' && o.ms.trim() && typeof o.en === 'string' && o.en.trim();
const ARABIC = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
const arts = (a) => (Array.isArray(a) ? a : [a]);

test('books: every book has a title, a source, a price and at least four pages in both languages with real pictures', () => {
  assert.ok(BOOKS.length >= 20, `books ${BOOKS.length}`);
  assert.equal(new Set(BOOKS.map((b) => b.id)).size, BOOKS.length);
  for (const b of BOOKS) {
    assert.ok(text(b.title) && text(b.source), b.id);
    assert.ok(isIconKey(b.cover), `${b.id} cover ${b.cover}`);
    assert.ok(Number.isInteger(b.price) && b.price >= 1 && b.price <= 6, `${b.id} price`);
    assert.ok(['story', 'know'].includes(b.kind));
    if (b.kind === 'story') assert.ok(text(b.moral), `${b.id} has no lesson line`);
    assert.ok(b.pages.length >= 4 && b.pages.length <= 8, `${b.id} pages ${b.pages.length}`);
    for (const [k, pg] of b.pages.entries()) {
      assert.ok(text(pg.text), `${b.id} page ${k + 1} text`);
      for (const a of arts(pg.art)) assert.ok(isIconKey(a), `${b.id} page ${k + 1} picture ${a}`);
      assert.ok(pg.text.ms.length <= 160 && pg.text.en.length <= 160, `${b.id} page ${k + 1} is too long for a small child`);
    }
  }
});

test('stories are retold public-domain tales and say so; knowledge books are our own text', () => {
  for (const b of BOOKS) {
    if (b.kind === 'story') assert.match(b.source.en, /public domain/i, b.id);
    else assert.match(b.source.en, /Original AmmaraGames text/, b.id);
  }
});

test('fact boards: unique, short, both languages, a real picture and a known topic', () => {
  assert.ok(FACTS.length >= 60, `facts ${FACTS.length}`);
  assert.equal(new Set(FACTS.map((f) => f.id)).size, FACTS.length);
  for (const f of FACTS) {
    assert.ok(text(f.text) && f.text.ms.length <= 140 && f.text.en.length <= 140, f.id);
    assert.ok(isIconKey(f.icon), `${f.id} picture ${f.icon}`);
    assert.ok(FACT_TOPICS[f.topic], `${f.id} topic ${f.topic}`);
  }
});

test('nothing the narrator may read (books, facts, shop words) contains Arabic script', () => {
  const all = JSON.stringify([BOOKS, FACTS, SHOPS]);
  assert.ok(!ARABIC.test(all));
});

test('shops: every item has a unique id, a real picture, a small whole-coin price and what it needs', () => {
  const ids = Object.values(SHOPS).flatMap((s) => s.items.map((it) => it.id));
  assert.equal(new Set(ids).size, ids.length, 'duplicate item id');
  for (const [sid, s] of Object.entries(SHOPS)) {
    assert.ok(text(s.name) && text(s.greet) && isIconKey(s.icon), sid);
    assert.ok(s.items.length >= 5, `${sid} sells ${s.items.length}`);
    for (const it of s.items) {
      assert.ok(isIconKey(it.icon), `${it.id} picture ${it.icon}`);
      assert.ok(Number.isInteger(it.price) && it.price >= 1 && it.price <= 6, `${it.id} price ${it.price}`);
      assert.ok(text(it.name), it.id);
      if (it.kind === 'book') assert.ok(bookById[it.book], `${it.id} book`);
      else if (it.kind === 'wear') {
        const r = config.rewards[it.reward];
        assert.ok(r && (r.type === 'accessory' || r.type === 'outfit'), `${it.id} reward ${it.reward}`);
      } else assert.ok(text(it.tip), `${it.id} needs a tip`);
      assert.ok(['book', 'wear', 'food', 'toy', 'pet'].includes(it.kind), `${it.id} kind`);
    }
  }
  assert.equal(itemById['buy-bk-hare'].book, 'bk-hare');
  assert.ok(COIN_RULES.quiz > 0 && COIN_RULES.fact > 0);
});

function store() {
  let saved = null;
  const p = createProgress({ config, load: () => saved, save: (d) => { saved = JSON.parse(JSON.stringify(d)); return true; } });
  const s = p.ensureSession({ worldId: 'adventure', ageGroup: '3-4', lang: 'ms', defaultName: 'Ammara' });
  return { p, id: s.learnerIds[0], reload: () => createProgress({ config, load: () => saved, save: (d) => { saved = d; return true; } }) };
}

test('coins: a new child starts with a few; earning, buying, owning and running out', () => {
  const { p, id, reload } = store();
  assert.equal(p.coins(id), STARTING_COINS);
  const book = itemById['buy-bk-hare'];
  let r = p.buy(id, book);
  assert.ok(r.ok);
  assert.equal(p.coins(id), STARTING_COINS - book.price);
  assert.ok(p.owns(id, book));
  assert.equal(p.buy(id, book).reason, 'OWNED');
  const cake = itemById.cake;
  assert.equal(p.buy(id, cake).reason, 'NO_COINS');
  p.addCoins(id, 10);
  r = p.buy(id, cake);
  assert.ok(r.ok && p.bagCount(id, 'cake') === 1);
  assert.ok(p.useItem(id, cake) && p.bagCount(id, 'cake') === 0 && !p.useItem(id, cake));
  // a toy is kept after playing
  p.addCoins(id, 5);
  const ball = itemById['t-ball'];
  assert.ok(p.buy(id, ball).ok && p.useItem(id, ball) && p.bagCount(id, 't-ball') === 1);
  // the coins and the bag survive a reload
  const again = reload();
  assert.equal(again.coins(id), p.coins(id));
  assert.equal(again.bagCount(id, 't-ball'), 1);
});

test('clothes from the boutique go straight into the wardrobe and are worn', () => {
  const { p, id } = store();
  p.addCoins(id, 20);
  const cap = itemById['w-capred'], dress = itemById['w-navy'];
  assert.ok(p.buy(id, cap).ok && p.buy(id, dress).ok);
  const l = p.learner(id);
  assert.ok(l.rewards.includes('cap_red') && l.equipped.head === 'cap_red' && l.outfit === 'outfit_navy');
  assert.ok(p.ownedOutfits(id).includes('outfit_navy'));
});

test('fact boards and finished books give a coin only the first time', () => {
  const { p, id } = store();
  assert.ok(p.markFact(id, 'f-sun'));
  assert.ok(!p.markFact(id, 'f-sun'));
  assert.ok(p.markBookRead(id, 'bk-hare'));
  assert.ok(!p.markBookRead(id, 'bk-hare'));
});

test('records saved before the town shop existed load, and the child gets the starting coins', () => {
  const { p, id } = store();
  const l = p.learner(id);
  delete l.coins; delete l.bag; delete l.books; delete l.booksRead; delete l.factsSeen;
  assert.equal(p.coins(id), STARTING_COINS);
  assert.deepEqual(p.wallet(id).bag, {});
});

test('the newer interface texts never replace a text of the original screens (no shared keys)', async () => {
  const fs = await import('node:fs');
  const { UPGRADE_STRINGS } = await import('../../src/engine/i18n-v2.js');
  const base = new Set([...fs.readFileSync(new URL('../../src/engine/i18n.js', import.meta.url), 'utf8').matchAll(/^\s{4}([a-zA-Z0-9_]+):/gm)].map((m) => m[1]));
  for (const lang of Object.keys(UPGRADE_STRINGS)) {
    const clash = Object.keys(UPGRADE_STRINGS[lang]).filter((k) => base.has(k));
    assert.deepEqual(clash, [], `${lang}: keys that overwrite the original texts`);
  }
  // both languages have the same keys
  assert.deepEqual(Object.keys(UPGRADE_STRINGS.ms).sort(), Object.keys(UPGRADE_STRINGS.en).sort());
});
