#!/usr/bin/env node
/**
 * verify-standalone.mjs — Sunset Rush project gate.
 *
 * DevGate's scanners cover .js/.py/.rs/... but NOT .html, and index.html IS
 * the product. This gate closes that gap: it enforces the offline/single-file
 * invariant from openspec/specs/presentation-offline directly on index.html.
 *
 * Exit 0 = pass, 1 = violation.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');

const banned = [
  ['external script', /<script[^>]*\bsrc\s*=/i],
  ['external stylesheet', /<link\b/i],
  ['external image', /<img[^>]*\bsrc\s*=\s*["']https?:/i],
  ['remote url in markup attr', /(src|href)\s*=\s*["']https?:\/\//i],
  ['css @import', /@import/i],
  ['network fetch', /\bfetch\s*\(|XMLHttpRequest|WebSocket/],
  ['dynamic eval', /\beval\s*\(|new\s+Function\s*\(/],
  ['unseeded randomness', /Math\.random/],
  ['audio asset element', /<audio|new\s+Audio\s*\(/i],
  ['video asset element', /<video/i],
];
let fail = 0;
for (const [name, re] of banned) {
  if (re.test(html)) { console.error(`FAIL  ${name}`); fail = 1; }
  else console.log(`pass  ${name}`);
}
const required = [
  ['viewport meta', /<meta name="viewport"/],
  ['game canvas', /<canvas id="game">/],
  ['download button', /id="btn-download"/],
  ['test hook', /window\.__game\s*=/],
  ['inline script', /<script>/],
];
for (const [name, re] of required) {
  if (!re.test(html)) { console.error(`FAIL  missing ${name}`); fail = 1; }
  else console.log(`pass  ${name}`);
}
if (fail) { console.error('\nverify-standalone: VIOLATIONS FOUND'); process.exit(1); }
console.log('\nverify-standalone: all standalone/offline invariants hold');
