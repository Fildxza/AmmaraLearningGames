// Renders Quran text from the Tanzil file in candidate Arabic fonts for visual comparison.
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { CHROME } from './lib/browsers.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const b64 = (p) => fs.readFileSync(path.join(root, 'node_modules/@fontsource', p)).toString('base64');
const fonts = { 'Amiri Quran': 'amiri-quran/files/amiri-quran-arabic-400-normal.woff2', 'Scheherazade New': 'scheherazade-new/files/scheherazade-new-arabic-500-normal.woff2', 'Noto Naskh Arabic': 'noto-naskh-arabic/files/noto-naskh-arabic-arabic-500-normal.woff2' };
const lines = fs.readFileSync(path.join(root, 'research/sources/tanzil/quran-uthmani.txt'), 'utf8').split('\n');
const get = (s, a) => lines.find((l) => l.startsWith(`${s}|${a}|`)).split('|').slice(2).join('|');
const sample = [get(1, 2), get(1, 6), get(111, 1), get(112, 1), get(105, 1), get(96, 1), get(101, 3)];
const letters = 'ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي'.split(' ');
const css = Object.entries(fonts).map(([n, p], i) => `@font-face{font-family:'F${i}';src:url(data:font/woff2;base64,${b64(p)}) format('woff2')}`).join('');
const html = `<!doctype html><meta charset="utf-8"><style>${css}body{margin:0;background:#fffdf8;padding:14px;width:1300px}.row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:10px}.c{border:1px solid #ddd;padding:6px;border-radius:10px}h4{margin:0;font:13px sans-serif}.q{direction:rtl;font-size:34px;line-height:1.9}.l{direction:rtl;font-size:64px;line-height:1.3}</style>
${['q', 'l'].map((k) => `<div class="row">${Object.keys(fonts).map((n, i) => `<div class="c"><h4>${n}</h4>${k === 'q' ? sample.map((s) => `<div class="q" style="font-family:F${i}">${s}</div>`).join('') : `<div class="l" style="font-family:F${i}">${letters.join(' ')} <span>بَ بِ بُ</span></div>`}</div>`).join('')}</div>`).join('')}`;
const f = path.join(root, 'qa/font-test.html'); fs.writeFileSync(f, html);
const br = await puppeteer.launch({ executablePath: CHROME, headless: true });
const p = await br.newPage(); await p.setViewport({ width: 1340, height: 900 });
await p.goto(pathToFileURL(f).href); await p.evaluate(() => document.fonts.ready);
const h = await p.evaluate(() => document.body.scrollHeight);
await p.screenshot({ path: path.join(root, 'qa/screenshots/font-test.png'), clip: { x: 0, y: 0, width: 1340, height: h } });
await br.close();
