import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';
import { isGhostTouch, resumeUsable, GHOST } from '../../src/engine/kidlock.js';

const view = { w: 1280, h: 720 };

test('ghost touches: screen edge, palm-sized contact and 4+ fingers are ignored; a normal tap is not', () => {
  assert.equal(isGhostTouch({ x: 640, y: 360, width: 20, height: 20, fingers: 1 }, view), null);
  assert.equal(isGhostTouch({ x: 3, y: 360 }, view), 'edge');
  assert.equal(isGhostTouch({ x: 1279, y: 360 }, view), 'edge');
  assert.equal(isGhostTouch({ x: 640, y: 2 }, view), 'edge');
  assert.equal(isGhostTouch({ x: 640, y: 719 }, view), 'edge');
  assert.equal(isGhostTouch({ x: 640, y: 360, width: 90, height: 95 }, view), 'palm');
  assert.equal(isGhostTouch({ x: 640, y: 360, width: 90, height: 10 }, view), null, 'a long thin touch is not a palm');
  assert.equal(isGhostTouch({ x: 640, y: 360, fingers: 4 }, view), 'fingers');
  assert.equal(isGhostTouch({ x: 640, y: 360, fingers: 3 }, view), null, 'two hands on the d-pad and interact button still work');
  // the on-screen buttons sit well inside the edge margin
  assert.ok(22 > GHOST.edge && 24 > GHOST.edge);
});

test('resume snapshot: only recent, well-formed snapshots are used', () => {
  const now = 1_000_000_000;
  assert.equal(resumeUsable({ k: 'world', at: now - 60_000 }, now), true);
  assert.equal(resumeUsable({ k: 'arcade', at: now - 5 * 3600 * 1000 }, now), true);
  assert.equal(resumeUsable({ k: 'world', at: now - 7 * 3600 * 1000 }, now), false, 'older than 6 hours');
  assert.equal(resumeUsable({ k: 'world', at: now + 1000 }, now), false, 'from the future');
  assert.equal(resumeUsable({ k: 'quiz', at: now }, now), false);
  assert.equal(resumeUsable(null, now), false);
  assert.equal(resumeUsable('x', now), false);
});

test('the web-app package is complete and consistent', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.display, 'fullscreen');
  assert.ok(manifest.start_url.startsWith('./') && manifest.scope === './', 'relative paths work on GitHub Pages sub-folders');
  for (const i of manifest.icons) assert.ok(fs.existsSync(path.join(ROOT, 'public', i.src)), i.src);
  assert.ok(manifest.icons.some((i) => i.purpose === 'maskable'));
  const sw = fs.readFileSync(path.join(ROOT, 'public/sw.template.js'), 'utf8');
  assert.match(sw, /__VERSION__/);
  const assets = (sw.match(/const ASSETS = \[(.*?)\]/s) || [])[1] || '';
  for (const f of ['index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'maskable-512.png']) assert.ok(assets.includes(f), f + ' is cached');
});
