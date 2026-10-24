import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { isIconKey } from '../../src/engine/art/icons.js';
import { validateConfig } from '../../src/engine/core/validate.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function loadRawConfig() {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'src/config/game-config.js'), 'utf8'), ctx);
  return ctx.window.AMMARA_CONFIG;
}
export const clone = (o) => JSON.parse(JSON.stringify(o));
export function validated(raw = loadRawConfig()) {
  return validateConfig(clone(raw), { isIconKey });
}
