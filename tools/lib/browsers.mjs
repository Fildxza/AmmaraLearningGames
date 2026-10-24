// Locations of the locally installed browsers used for automated testing.
import fs from 'node:fs';
const pick = (list) => list.find((p) => fs.existsSync(p)) || list[0];
export const CHROME = process.env.CHROME_PATH || pick([
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
]);
export const EDGE = process.env.EDGE_PATH || pick([
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
]);
