import test from 'node:test';
import assert from 'node:assert/strict';
import { validated } from './helpers.mjs';
import { isIconKey, iconSVG } from '../../src/engine/art/icons.js';
import { POIS, ZONES } from '../../src/engine/world/layout.js';

// The 3D world paints icons by loading them as standalone SVG images, which are parsed as strict XML.
// A repeated attribute is fine in HTML but makes such an image fail to load (a blank picture in 3D).

function collectKeys(node, out) {
  if (typeof node === 'string') { if (node && isIconKey(node)) out.add(node); }
  else if (Array.isArray(node)) node.forEach((n) => collectKeys(n, out));
  else if (node && typeof node === 'object') Object.values(node).forEach((n) => collectKeys(n, out));
}

function duplicateAttributes(svg) {
  const problems = [];
  for (const tag of svg.match(/<[a-zA-Z][^>]*>/g) || []) {
    const names = [...tag.matchAll(/\s([a-zA-Z:-]+)=/g)].map((m) => m[1]);
    const dup = names.filter((n, i) => names.indexOf(n) !== i);
    if (dup.length) problems.push(`${[...new Set(dup)].join(',')} in ${tag.slice(0, 90)}`);
  }
  return problems;
}

test('every icon used by the game and the 3D world is valid XML (no repeated attributes)', () => {
  const keys = new Set(['ball:rainbow', 'letter:A', 'dots:4', 'crayon:red', 'face_happy']);
  collectKeys(validated().config, keys);
  for (const p of POIS) keys.add(p.icon);
  for (const z of ZONES) keys.add(z.icon);
  assert.ok(keys.size > 150, `only ${keys.size} icon keys found`);
  const bad = [];
  for (const k of keys) {
    const svg = iconSVG(k, { standalone: true, fx: false });
    const d = duplicateAttributes(svg);
    if (d.length) bad.push(`${k}: ${d[0]}`);
    if (/undefined|NaN/.test(svg)) bad.push(`${k}: contains undefined/NaN`);
  }
  assert.deepEqual(bad, [], bad.slice(0, 8).join('\n'));
});

test('every point of interest and zone icon is a valid icon key', () => {
  for (const p of POIS) assert.ok(isIconKey(p.icon), `${p.id}: ${p.icon}`);
  for (const z of ZONES) assert.ok(isIconKey(z.icon), `${z.id}: ${z.icon}`);
});
