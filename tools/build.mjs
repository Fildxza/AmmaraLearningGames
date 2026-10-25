// Builds the single offline file AmmaraGames.html:
//   teacher config (readable) + CSS + embedded font + bundled engine (with Three.js).
import { build, transform } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (p) => path.join(root, p);
const started = Date.now();

const bundle = await build({
  entryPoints: [r('src/engine/main.js')],
  bundle: true, format: 'iife', minify: true, target: ['chrome100', 'edge100'], legalComments: 'eof',
  write: false, logLevel: 'warning', define: { 'process.env.NODE_ENV': '"production"' }
});
let engine = bundle.outputFiles[0].text;

const cssSrc = ['main.css', 'upgrade.css', 'games.css'].map((f) => fs.readFileSync(r('src/styles/' + f), 'utf8')).join('\n');
const css = (await transform(cssSrc, { loader: 'css', minify: true, target: ['chrome100'] })).code;
const font = fs.readFileSync(r('node_modules/@fontsource-variable/fredoka/files/fredoka-latin-wght-normal.woff2')).toString('base64');
const fontCss = `/* Fredoka (variable) — Copyright 2016 The Fredoka Project Authors. SIL Open Font License 1.1 (full text at the end of this file). */
@font-face{font-family:Fredoka;font-style:normal;font-display:swap;font-weight:300 700;src:url(data:font/woff2;base64,${font}) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;}`;
// Arabic text (Hijaiyah letters, Quran): Noto Naskh Arabic, SIL OFL 1.1, embedded so Arabic renders correctly offline.
const naskh = (w) => fs.readFileSync(r(`node_modules/@fontsource/noto-naskh-arabic/files/noto-naskh-arabic-arabic-${w}-normal.woff2`)).toString('base64');
const naskhCss = [500, 700].map((w) => `@font-face{font-family:'AG Naskh';font-style:normal;font-display:swap;font-weight:${w};src:url(data:font/woff2;base64,${naskh(w)}) format('woff2')}`).join('');
const config = fs.readFileSync(r('src/config/game-config.js'), 'utf8');

const safeScript = (s) => s.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
const template = fs.readFileSync(r('src/index.template.html'), 'utf8');
const licences = `\n<!--\nTHIRD-PARTY LICENCES\n\n=== Three.js (MIT) ===\n${fs.readFileSync(r('node_modules/three/LICENSE'), 'utf8').replace(/--/g, '- -')}\n\n=== Fredoka font (SIL OFL 1.1) ===\n${fs.readFileSync(r('node_modules/@fontsource-variable/fredoka/LICENSE'), 'utf8').replace(/--/g, '- -')}\n\n=== Noto Naskh Arabic font (SIL OFL 1.1) ===\n${fs.readFileSync(r('node_modules/@fontsource/noto-naskh-arabic/LICENSE'), 'utf8').replace(/--/g, '- -')}\n\n=== Quran text: Tanzil Project, Uthmani text (CC BY 3.0) ===\nText from the Tanzil Quran Text (Uthmani), version 1.1, Copyright (C) 2007-2026 Tanzil Project. Licence: Creative Commons Attribution 3.0. The text is included verbatim and unchanged (changing it is not allowed). Source: https://tanzil.net\n-->\n`;
const favicon = fs.readFileSync(r('public/icons/icon-192.png')).toString('base64');
let html = template
  .replace('ICON">', () => favicon + '">')
  .replace('/*@@CONFIG@@*/', () => safeScript(config))
  .replace('/*@@FONT@@*/', () => fontCss + naskhCss)
  .replace('/*@@CSS@@*/', () => css)
  .replace('/*@@ENGINE@@*/', () => safeScript(engine))
  .replace('</html>', () => '</html>' + licences);

// Offline guard: the file must not try to load anything from the network.
const suspicious = [];
const patterns = [/\bsrc\s*=\s*["']https?:/i, /\bhref\s*=\s*["']https?:\/\/(?!www\.w3\.org)/i, /url\(\s*["']?https?:/i, /@import\s/i, /\bfetch\s*\(/, /new\s+XMLHttpRequest/, /navigator\.sendBeacon/, /new\s+WebSocket/, /importScripts\s*\(/];
for (const p of patterns) { const m = html.match(p); if (m) suspicious.push(`${p} -> …${html.slice(Math.max(0, m.index - 60), m.index + 60).replace(/\s+/g, ' ')}…`); }

fs.mkdirSync(r('dist'), { recursive: true });
fs.writeFileSync(r('dist/AmmaraGames.html'), html);
fs.writeFileSync(r('AmmaraGames.html'), html);
// Web-app package for hosting (GitHub Pages, any static host): index.html + manifest + offline service worker + icons.
// The single-file AmmaraGames.html above stays the double-click version.
import crypto from 'node:crypto';
const buildId = crypto.createHash('sha256').update(html).digest('hex').slice(0, 10);
fs.writeFileSync(r('dist/index.html'), html);
fs.copyFileSync(r('public/manifest.webmanifest'), r('dist/manifest.webmanifest'));
fs.writeFileSync(r('dist/sw.js'), fs.readFileSync(r('public/sw.template.js'), 'utf8').replace('__VERSION__', buildId));
fs.mkdirSync(r('dist/icons'), { recursive: true });
for (const f of fs.readdirSync(r('public/icons'))) fs.copyFileSync(r('public/icons/' + f), r('dist/icons/' + f));
fs.writeFileSync(r('dist/.nojekyll'), '');
fs.writeFileSync(r('dist/version.json'), JSON.stringify({ name: 'AmmaraGames', version: JSON.parse(fs.readFileSync(r('package.json'), 'utf8')).version, build: buildId }) + '\n');
const kb = (n) => (n / 1024).toFixed(0) + ' KB';
console.log(`Built AmmaraGames.html  total ${kb(Buffer.byteLength(html))}  (engine ${kb(Buffer.byteLength(engine))}, config ${kb(Buffer.byteLength(config))}, css ${kb(css.length)}, font ${kb(font.length)})  in ${Date.now() - started} ms`);
if (suspicious.length) { console.log('Network-looking code found (review):'); suspicious.forEach((s) => console.log('  ' + s)); }
else console.log('Offline check: no network loads found in the output.');
