// Renders chosen pictures large for a close visual check. Usage: node tools/icon-zoom.mjs fork zebra ...
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import puppeteer from 'puppeteer-core';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CHROME } from './lib/browsers.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = await build({ entryPoints: [path.join(root, 'src/engine/art/icons.js')], bundle: true, format: 'iife', globalName: 'Icons', write: false });
const sb = { window: {} }; vm.runInNewContext(out.outputFiles[0].text + ';window.Icons=Icons;', sb);
const I = sb.window.Icons;
const keys = process.argv.slice(2);
const font = fs.readFileSync(path.join(root, 'node_modules/@fontsource-variable/fredoka/files/fredoka-latin-wght-normal.woff2')).toString('base64');
const html = `<!doctype html><meta charset="utf-8"><style>@font-face{font-family:Fredoka;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:300 700}
body{margin:0;background:#fff8ee;font-family:Fredoka;display:grid;grid-template-columns:repeat(6,210px);gap:8px;padding:8px}.c{background:#fff;border-radius:16px;text-align:center;font-size:13px}.c svg{width:200px;height:200px}</style><svg width="0" height="0"><defs>${I.SVG_DEFS}</defs></svg>${keys.map((k) => `<div class="c">${I.iconSVG(k)}<div>${k}</div></div>`).join('')}`;
const f = path.join(root, 'qa/icon-zoom.html'); fs.writeFileSync(f, html);
const b = await puppeteer.launch({ executablePath: CHROME, headless: true });
const p = await b.newPage(); await p.setViewport({ width: 1340, height: 700 });
await p.goto(pathToFileURL(f).href); await p.evaluate(() => document.fonts.ready);
const h = await p.evaluate(() => document.body.scrollHeight);
await p.screenshot({ path: path.join(root, 'qa/screenshots/icon-zoom.png'), clip: { x: 0, y: 0, width: 1340, height: h } });
await b.close();
