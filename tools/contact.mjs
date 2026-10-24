// Packs several screenshots into one contact sheet so a whole tour can be reviewed in a few images.
// Usage: node tools/contact.mjs <out-name> <cols> <file1> <file2> ...   (files are names under qa/screenshots, without .png)
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CHROME } from './lib/browsers.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [out, colsArg, ...names] = process.argv.slice(2);
const cols = +colsArg || 2;
const dir = path.join(root, 'qa/screenshots');
const cell = Math.floor(1800 / cols);
const html = `<html><body style="margin:0;background:#222;display:grid;grid-template-columns:repeat(${cols},${cell}px);gap:4px">${names.map((n) => `<figure style="margin:0;position:relative"><img style="width:${cell}px;display:block" src="file:///${path.join(dir, n + '.png').replace(/\\/g, '/')}"><figcaption style="position:absolute;left:8px;top:6px;color:#fff;font:700 18px sans-serif;text-shadow:0 0 4px #000">${n}</figcaption></figure>`).join('')}</body></html>`;
const tmp = path.join(root, 'qa/tmp/contact.html');
fs.mkdirSync(path.dirname(tmp), { recursive: true });
fs.writeFileSync(tmp, html);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files'] });
const page = await browser.newPage();
await page.setViewport({ width: 1800, height: 600 });
await page.goto('file:///' + tmp.replace(/\\/g, '/'));
await new Promise((r) => setTimeout(r, 600));
await page.screenshot({ path: path.join(dir, `sheet-${out}.png`), fullPage: true });
await browser.close();
console.log('wrote', path.join(dir, `sheet-${out}.png`));
