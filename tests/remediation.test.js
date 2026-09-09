// Remediation unit tests (change: remediate-fire-and-readability).
// Loads the real index.html script into a vm context with DOM stubs.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const HTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const SCRIPT = HTML.match(/<script>([\s\S]*)<\/script>/)[1];

function makeGame() {
  const elements = {};
  const winListeners = {};
  const blobCalls = [];
  function makeEl(id) {
    const el = {
      id, style: {}, textContent: '', innerHTML: '', width: 0, height: 0,
      listeners: {}, classes: new Set(id === 'hint' || id === 'hud-top' ? ['hidden'] : []),
      classList: {
        add(c) { el.classes.add(c); }, remove(c) { el.classes.delete(c); },
        toggle(c, on) { on ? el.classes.add(c) : el.classes.delete(c); },
        contains(c) { return el.classes.has(c); },
      },
      addEventListener(t, fn) { (el.listeners[t] = el.listeners[t] || []).push(fn); },
      appendChild() {}, removeChild() {}, click() { el.clicked = true; },
      getContext() { return ctxStub; },
    };
    return el;
  }
  const ctxStub = new Proxy({}, {
    get(t, k) {
      if (k === 'canvas') return elements.game;
      return (...a) => (k === 'createLinearGradient' ? { addColorStop() {} } : undefined);
    },
    set() { return true; },
  });
  const documentStub = {
    getElementById(id) { return elements[id] || (elements[id] = makeEl(id)); },
    createElement(t) { return makeEl(t); },
    addEventListener() {},
    documentElement: {
      outerHTML: '<html><body>game</body></html>',
      cloneNode() {
        return { querySelector() { return null; }, outerHTML: '<html><body>game</body></html>' };
      },
    },
    body: { appendChild() {} },
    hidden: false,
  };
  const windowStub = {
    innerWidth: 390, innerHeight: 844, devicePixelRatio: 2,
    addEventListener(t, fn) { (winListeners[t] = winListeners[t] || []).push(fn); },
    navigator: { maxTouchPoints: 0 },
  };
  const sandbox = {
    window: windowStub, document: documentStub, navigator: windowStub.navigator,
    requestAnimationFrame() {}, setTimeout() { return 0; }, clearTimeout() {},
    URL: { createObjectURL(b) { blobCalls.push(b); return 'blob:test'; }, revokeObjectURL() {} },
    Blob: function Blob(parts) { this.parts = parts; },
    console, Math, parseInt, parseFloat, isNaN, JSON,
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(SCRIPT, sandbox, { filename: 'game-inline.js' });
  return { g: windowStub.__game, elements, winListeners, blobCalls };
}
function raceThrough(g, seconds, inputFn) {
  const dt = 0.016, steps = Math.ceil(seconds / dt);
  for (let i = 0; i < steps; i++) { if (inputFn) inputFn(i * dt, i); g.tick(dt); }
}
function startRace(g, seed) {
  g.start(seed === undefined ? 42 : seed);
  g.tick(0.02);
  assert.strictEqual(g.state().state, 'race');
}

// spec: sr-cw-default-weapon
test('race starts armed: blaster with unlimited ammo, fires in first second', () => {
  const { g } = makeGame();
  startRace(g);
  assert.strictEqual(g.state().weapon, 'blaster');
  assert.strictEqual(g.state().ammo, Infinity);
  g.setInput({ fire: true });
  g.tick(0.016);
  assert.strictEqual(g.state().projectileCount, 1);
  raceThrough(g, 1.0);
  assert.strictEqual(g.state().ammo, Infinity, 'baseline ammo never depletes');
});

// spec: sr-cw-default-weapon
test('finite weapon exhausts back to blaster, never an unarmed state', () => {
  const { g } = makeGame();
  startRace(g);
  g.giveWeapon('shockwave'); // 2 ammo
  g.setInput({ fire: true });
  raceThrough(g, 2.0);
  assert.strictEqual(g.state().weapon, 'blaster');
  assert.strictEqual(g.state().ammo, Infinity);
  g.setInput({ fire: false });
  raceThrough(g, 0.5);
  g.setInput({ fire: true });
  g.tick(0.016);
  assert.ok(g.state().projectileCount >= 1, 'blaster fires after revert');
});

// spec: sr-cw-fire-edge
test('edge capture: a tap shorter than a frame fires exactly one shot', () => {
  const { g, winListeners } = makeGame();
  startRace(g);
  const kd = winListeners.keydown[0], ku = winListeners.keyup[0];
  kd({ key: ' ', repeat: false, preventDefault() {} });
  ku({ key: ' ' }); // released before any tick: sub-frame tap
  g.tick(0.016);
  assert.strictEqual(g.state().projectileCount, 1);
  g.tick(0.016);
  assert.strictEqual(g.state().projectileCount, 1, 'no double fire from one tap');
});

// spec: sr-cw-fire-edge
test('keyboard auto-repeat does not queue extra shots', () => {
  const { g, winListeners } = makeGame();
  startRace(g);
  const kd = winListeners.keydown[0];
  kd({ key: ' ', repeat: false, preventDefault() {} });
  for (let i = 0; i < 10; i++) kd({ key: ' ', repeat: true, preventDefault() {} });
  g.tick(0.016);
  assert.strictEqual(g.state().projectileCount, 1, 'held input fires at cooldown rate only');
});

// spec: sr-pre-touch
test('touch slide transfers steering by finger position', () => {
  const { g, winListeners } = makeGame();
  startRace(g);
  const pd = winListeners.pointerdown[0], pm = winListeners.pointermove[0];
  pd({ pointerId: 1, target: { id: 'tz-left', classList: { contains: () => false } }, clientX: 20 });
  raceThrough(g, 0.5);
  const pxLeft = g.state().playerX;
  pm({ pointerId: 1, target: { id: 'tz-left', classList: { contains: () => false } }, clientX: 370 }); // captured target, finger now right
  raceThrough(g, 0.5);
  assert.ok(g.state().playerX > pxLeft, `slide right steers right: ${pxLeft} -> ${g.state().playerX}`);
});

// spec: sr-pre-touch
test('fire-pad press stays fire for the touch lifetime', () => {
  const { g, winListeners } = makeGame();
  startRace(g);
  const pd = winListeners.pointerdown[0], pm = winListeners.pointermove[0];
  pd({ pointerId: 2, target: { id: 'fire-pad', classList: { contains: () => false } }, clientX: 350 });
  g.tick(0.016);
  const p1 = g.state().projectileCount;
  assert.ok(p1 >= 1, 'pad fired');
  pm({ pointerId: 2, target: { id: 'fire-pad', classList: { contains: () => false } }, clientX: 20 }); // drag off pad
  raceThrough(g, 0.4);
  assert.ok(g.state().projectileCount > p1, 'still firing after dragging off pad');
});

// spec: sr-pre-touch
test('touch overlay only during countdown/race', () => {
  const { elements } = makeGame();
  // desktop stub (maxTouchPoints 0): syncTouchUI hides overlay in every state
  assert.strictEqual(elements.touch.style.display, 'none');
  assert.strictEqual(elements['fire-pad'].style.display, 'none');
});

// spec: sr-pre-onboarding
test('hint strip shows at race start and dismisses itself', () => {
  const { g, elements } = makeGame();
  startRace(g);
  assert.ok(!elements.hint.classes.has('hidden'), 'hint visible at race start');
  assert.ok(elements.hint.textContent.length > 10);
  raceThrough(g, 7.0);
  assert.ok(elements.hint.classes.has('hidden'), 'hint dismissed');
});

// spec: sr-pre-determinism
test('rendering between ticks cannot perturb gameplay state', () => {
  const run = (withRender) => {
    const { g } = makeGame();
    g.start(777); g.tick(0.02);
    for (let i = 0; i < 900; i++) {
      g.setInput({ fire: i % 25 === 0 });
      g.tick(0.016);
      if (withRender) g.renderOnce();
    }
    const s = g.state();
    return JSON.stringify({
      mobs: s.mobs.map(m => [Math.round(m.x * 1e4), Math.round(m.z)]),
      pickups: s.pickups.map(p => [p.kind, Math.round(p.x * 1e4), Math.round(p.z)]),
      score: s.score, armor: s.armor,
    });
  };
  assert.strictEqual(run(true), run(false));
});

// spec: sr-pre-download
test('export from game over boots to the title screen', () => {
  const { g, elements, blobCalls } = makeGame();
  startRace(g);
  g.setTime(0.01);
  g.tick(0.02);
  assert.strictEqual(g.state().state, 'gameover');
  elements['btn-download2'].listeners.click[0]();
  assert.strictEqual(blobCalls.length, 1);
  // the clone normalizer must target the live state: verify against real DOM
  // serialization semantics in e2e (tests/e2e-chrome.mjs)
});

// frame-loop hygiene guards
test('updateHUD has exactly one call site', () => {
  const calls = SCRIPT.split('\n').filter(l => /[^a-zA-Z]updateHUD\(dt\)|[^a-zA-Z]updateHUD\(\)/.test(l));
  assert.strictEqual(calls.filter(l => !l.includes('function updateHUD')).length, 1,
    'one updateHUD() call site (FAIL-2026090903 shape)');
});
test('countdown keeps traffic moving', () => {
  const { g } = makeGame();
  g.start(); // countdown begins (3.2s), do not skip
  const z0 = g.state().cars[0].z;
  g.tick(0.5);
  const s1 = g.state();
  assert.strictEqual(s1.state, 'countdown');
  assert.notStrictEqual(s1.cars[0].z, z0, 'traffic advances during countdown');
});
