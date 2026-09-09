/**
 * Trusted-input E2E for Sunset Rush. Zero dependencies: Node stdlib + a system
 * Chrome, driven over CDP's pipe transport (no socket, no network).
 *
 * Covers the audit blind spots: fire readiness, sub-frame keyboard tap,
 * touch fire, multi-touch, touch slide-steering, HUD legibility, overlay
 * visibility, clean download export, real file:// load, and screenshots.
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const artifacts = join(root, 'tests', 'artifacts');
mkdirSync(artifacts, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function launch() {
  const profile = mkdtempSync(join(tmpdir(), 'sunset-rush-e2e-'));
  const bin = process.env.CHROME_BIN || 'google-chrome';
  const chrome = spawn(bin, [
    '--headless=new', '--remote-debugging-pipe', '--no-first-run',
    '--disable-gpu', '--mute-audio', '--window-size=1280,800',
    `--user-data-dir=${profile}`, 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] });
  let buf = Buffer.alloc(0), nextId = 1;
  const pending = new Map();
  chrome.stdio[4].on('data', chunk => {
    buf = Buffer.concat([buf, chunk]);
    let end;
    while ((end = buf.indexOf(0)) >= 0) {
      const msg = JSON.parse(buf.slice(0, end).toString('utf8'));
      buf = buf.slice(end + 1);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id); pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      }
    }
  });
  function send(method, params = {}, sessionId) {
    const id = nextId++, msg = { id, method, params };
    if (sessionId) msg.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      chrome.stdio[3].write(JSON.stringify(msg) + '\0');
    });
  }
  const { targetInfos } = await send('Target.getTargets');
  const page = targetInfos.find(t => t.type === 'page');
  const { sessionId } = await send('Target.attachToTarget', {
    targetId: page.targetId, flatten: true,
  });
  const s = (m, p) => send(m, p, sessionId);
  await s('Page.enable'); await s('Runtime.enable');
  return {
    async js(expression) {
      const r = await s('Runtime.evaluate', {
        expression, returnByValue: true, awaitPromise: true,
      });
      if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
      return r.result.value;
    },
    async key(type, key, code, vk, text) {
      await s('Input.dispatchKeyEvent', {
        type, key, code, windowsVirtualKeyCode: vk,
        nativeVirtualKeyCode: vk, text,
      });
    },
    async tapKey(key, code, vk, holdMs = 5, text) {
      await this.key('keyDown', key, code, vk, text);
      await sleep(holdMs);
      await this.key('keyUp', key, code, vk);
    },
    async touch(type, touchPoints) {
      await s('Input.dispatchTouchEvent', { type, touchPoints });
    },
    async emulate(width, height, mobile, dpr = 2) {
      await s('Emulation.setDeviceMetricsOverride', {
        width, height, deviceScaleFactor: dpr, mobile,
      });
      await s('Emulation.setTouchEmulationEnabled', {
        enabled: true, maxTouchPoints: 5,
      });
    },
    async screenshot(name) {
      const r = await s('Page.captureScreenshot', { format: 'png' });
      writeFileSync(join(artifacts, name), Buffer.from(r.data, 'base64'));
    },
    async navigate() {
      await s('Page.navigate', { url: pathToFileURL(join(root, 'index.html')).href });
      await sleep(1200);
    },
    close() {
      try { chrome.kill('SIGKILL'); } catch {}
      try { rmSync(profile, { recursive: true, force: true }); } catch {}
    },
  };
}

let failures = 0;
async function run(name, fn) {
  try { await fn(); console.log(`ok  ${name}`); }
  catch (e) { failures++; console.error(`FAIL ${name}\n${e.stack || e}`); }
}

// Desktop: real keyboard input, no hooks used to grant a weapon.
await run('desktop: real 5ms Space tap fires from race start', async () => {
  const b = await launch();
  try {
    await b.emulate(1280, 720, false, 1); await b.navigate();
    await b.tapKey('Enter', 'Enter', 13);
    await sleep(3600);
    assert.equal(await b.js('__game.state().state'), 'race');
    const before = await b.js('__game.state().projectileCount');
    await b.tapKey(' ', 'Space', 32, 5, ' '); // shorter than one 60fps frame
    await sleep(80);
    assert.equal(await b.js('__game.state().projectileCount'), before + 1);
    assert.equal(await b.js('__game.state().weapon'), 'blaster');
    assert.equal(await b.js('String(__game.state().ammo)'), 'Infinity');
    await b.screenshot('desktop-race-after.png');
  } finally { b.close(); }
});

// Mobile: real touch start + slide + fire, plus pixel/computed-style gates.
await run('mobile: touch overlay, legibility, slide steer, fire, clean export', async () => {
  const b = await launch();
  try {
    await b.emulate(390, 844, true); await b.navigate();
    assert.equal(await b.js('getComputedStyle(document.getElementById("touch")).display'), 'none');
    await b.screenshot('mobile-title-after.png');
    const start = JSON.parse(await b.js(
      'var r=document.getElementById("btn-start").getBoundingClientRect();JSON.stringify({x:r.x+r.width/2,y:r.y+r.height/2})'
    ));
    await b.touch('touchStart', [{ x: start.x, y: start.y, id: 1 }]);
    await b.touch('touchEnd', []);
    await sleep(3600);
    assert.equal(await b.js('__game.state().state'), 'race');
    assert.equal(await b.js('getComputedStyle(document.getElementById("touch")).display'), 'block');

    const metrics = JSON.parse(await b.js(`JSON.stringify({
      label:parseFloat(getComputedStyle(document.querySelector('#hud-top .label')).fontSize),
      value:parseFloat(getComputedStyle(document.getElementById('hud-score')).fontSize),
      armor:parseFloat(getComputedStyle(document.getElementById('hud-armor-wrap')).width),
      weapon:document.getElementById('hud-weapon').textContent
    })`));
    assert.ok(metrics.label >= 10, `label ${metrics.label}px`);
    assert.ok(metrics.value >= 13, `value ${metrics.value}px`);
    assert.ok(metrics.armor >= 96, `armor ${metrics.armor}px`);
    assert.match(metrics.weapon, /BLASTER/);

    // Pointer starts left, then slides right while captured to the original node.
    await b.touch('touchStart', [{ x: 50, y: 600, id: 2 }]);
    await sleep(400);
    const leftX = await b.js('__game.state().playerX');
    for (let x = 80; x <= 350; x += 30) {
      await b.touch('touchMove', [{ x, y: 600, id: 2 }]); await sleep(45);
    }
    await sleep(600);
    const rightX = await b.js('__game.state().playerX');
    assert.ok(rightX > leftX, `slide must transfer steering: ${leftX} -> ${rightX}`);
    await b.touch('touchEnd', []);

    const pad = JSON.parse(await b.js(
      'var r=document.getElementById("fire-pad").getBoundingClientRect();JSON.stringify({x:r.x+r.width/2,y:r.y+r.height/2})'
    ));
    const before = await b.js('__game.state().projectileCount');
    await b.touch('touchStart', [{ x: pad.x, y: pad.y, id: 3 }]);
    await b.touch('touchEnd', []);
    await sleep(100);
    assert.equal(await b.js('__game.state().projectileCount'), before + 1);

    // Real multi-touch: steer left and tap fire simultaneously.
    await b.touch('touchStart', [{ x: 50, y: 600, id: 4 }]);
    await sleep(80);
    const beforeMulti = await b.js('__game.state().projectileCount');
    await b.touch('touchStart', [
      { x: 50, y: 600, id: 4 }, { x: pad.x, y: pad.y, id: 5 },
    ]);
    await b.touch('touchEnd', [{ x: 50, y: 600, id: 4 }]);
    await sleep(200);
    assert.ok(await b.js('__game.state().projectileCount') > beforeMulti);
    await b.touch('touchEnd', []);

    await b.screenshot('mobile-race-after.png');

    // Clean export: capture the blob's text, trigger real game-over button click.
    await b.js(`
      window.__exportText='';
      var OldBlob=window.Blob;
      window.Blob=function(parts,opts){window.__exportText=parts.join('');return new OldBlob(parts,opts);};
      __game.setTime(0.01);__game.tick(0.02);
      document.getElementById('btn-download2').click();
    `);
    await sleep(80);
    const exported = await b.js('window.__exportText');
    assert.match(exported, /id="screen-start" class="screen"/);
    assert.match(exported, /id="screen-over" class="screen hidden"/);
  } finally { b.close(); }
});

if (failures) { console.error(`\ne2e-chrome: ${failures} failed`); process.exit(1); }
console.log('\ne2e-chrome: all trusted-input, visual, and export checks passed');
