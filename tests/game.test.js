// Headless tests for Sunset Rush: Overdrive. Loads the real index.html script
// into a vm context with DOM stubs and drives the actual game loop.
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
      listeners: {},
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      addEventListener(type, fn) { (el.listeners[type] = el.listeners[type] || []).push(fn); },
      appendChild() {}, removeChild() {}, click() { el.clicked = true; },
      getContext() { return ctxStub; },
    };
    return el;
  }
  const ctxStub = new Proxy({}, {
    get(t, k) {
      if (k === 'canvas') return elements.game;
      if (typeof t[k] === 'function') return t[k];
      return (...a) => {
        if (k === 'createLinearGradient' || k === 'createRadialGradient') return { addColorStop() {} };
        if (k === 'measureText') return { width: 0 };
        return undefined;
      };
    },
    set() { return true; },
  });
  const documentStub = {
    getElementById(id) { return elements[id] || (elements[id] = makeEl(id)); },
    createElement(tag) { return makeEl(tag); },
    addEventListener() {},
    documentElement: { outerHTML: '<html><body>game</body></html>' },
    body: { appendChild() {} },
    hidden: false,
  };
  const windowStub = {
    innerWidth: 390, innerHeight: 844, devicePixelRatio: 2,
    addEventListener(type, fn) { (winListeners[type] = winListeners[type] || []).push(fn); },
    navigator: { maxTouchPoints: 0 },
  };
  const sandbox = {
    window: windowStub,
    document: documentStub,
    navigator: windowStub.navigator,
    requestAnimationFrame() {},
    setTimeout() { return 0; },
    clearTimeout() {},
    URL: { createObjectURL(b) { blobCalls.push(b); return 'blob:test'; }, revokeObjectURL() {} },
    Blob: function Blob(parts) { this.parts = parts; },
    console, Math, parseInt, parseFloat, isNaN, JSON,
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(SCRIPT, sandbox, { filename: 'game-inline.js' });
  const g = windowStub.__game;
  return { g, elements, winListeners, blobCalls, documentStub };
}

function raceThrough(g, seconds, inputFn) {
  const dt = 0.016;
  const steps = Math.ceil(seconds / dt);
  for (let i = 0; i < steps; i++) {
    if (inputFn) inputFn(i * dt, i);
    g.tick(dt);
  }
}
function startRace(g, seed) {
  g.start(seed === undefined ? 42 : seed);
  g.tick(0.02); // countdown elapses
  assert.strictEqual(g.state().state, 'race');
}

// spec: sr-pre-single-file
// spec: sr-pre-audio
test('standalone: no external refs, no audio assets, single file', () => {
  // network-call and audio-asset bans are enforced by scripts/verify-standalone.mjs (project gate)
  assert.ok(!/<script[^>]*\bsrc\s*=/i.test(HTML));
  assert.ok(!/<link\b/i.test(HTML));
  assert.ok(!/(src|href)\s*=\s*["']https?:\/\//i.test(HTML));
  assert.ok(!/Math\.random/.test(HTML), 'gameplay randomness must be seeded');
  assert.ok(/window\.__game\s*=/.test(HTML));
});

// spec: sr-pre-determinism
test('determinism: same seed + inputs reproduce the run', () => {
  const runOnce = () => {
    const { g } = makeGame();
    g.start(777); g.tick(0.02);
    const trace = [];
    for (let i = 0; i < 600; i++) {
      g.setInput({ left: i % 80 < 20, right: i % 80 >= 60, fire: i % 50 === 0 });
      g.tick(0.016);
      if (i % 60 === 0) {
        const s = g.state();
        trace.push([s.score, s.armor, Math.round(s.pos), s.mobCount, Math.round(s.playerX * 1000)]);
      }
    }
    return trace;
  };
  assert.deepStrictEqual(runOnce(), runOnce());
});

// spec: sr-cw-weapon-crates
// spec: sr-cw-inputs
test('weapon crate equips blaster with crate ammo', () => {
  const { g } = makeGame();
  startRace(g);
  g.spawnPickupAt(1.5 * g.SEG_LEN, 0, 'w-blaster');
  raceThrough(g, 1.2);
  const s = g.state();
  assert.strictEqual(s.weapon, 'blaster');
  assert.strictEqual(s.ammo, g.WEAPONS.blaster.crate);
});

// spec: sr-cw-blaster
test('blaster fires projectile, costs ammo, respects cooldown', () => {
  const { g } = makeGame();
  startRace(g);
  g.giveWeapon('blaster');
  g.setInput({ fire: true });
  g.tick(0.016);
  let s = g.state();
  assert.strictEqual(s.ammo, 13);
  assert.strictEqual(s.projectileCount, 1);
  g.tick(0.016); // still on cooldown
  assert.strictEqual(g.state().projectileCount, 1);
  raceThrough(g, 0.3);
  assert.ok(g.state().projectileCount >= 1);
});

// spec: sr-cw-dry-fire
test('dry fire does nothing and never goes negative', () => {
  const { g } = makeGame();
  startRace(g);
  g.setInput({ fire: true });
  raceThrough(g, 0.5);
  assert.strictEqual(g.state().projectileCount, 0);
  assert.strictEqual(g.state().ammo, 0);
});

// spec: sr-cw-homing
test('homing missile converges on its target', () => {
  const { g } = makeGame();
  startRace(g);
  g.spawnMobAt(60 * g.SEG_LEN, 0.8, 'skitter');
  g.giveWeapon('homing');
  g.setInput({ fire: true });
  g.tick(0.016);
  g.setInput({});
  const xs = [];
  for (let i = 0; i < 25; i++) {
    g.tick(0.016);
    const p = g.state().projectiles.find(pr => pr.kind === 'homing');
    const mob = g.state().mobs.find(m => m.type === 'skitter');
    if (p && mob) xs.push(Math.abs(p.x - mob.x));
  }
  assert.ok(xs.length > 5, 'missile should still be tracking');
  assert.ok(xs[xs.length - 1] < xs[0], `should converge: ${xs[0]} -> ${xs[xs.length - 1]}`);
});

// spec: sr-cw-mine
test('mine arms, then detonates when a mob touches it', () => {
  const { g } = makeGame();
  startRace(g);
  g.giveWeapon('mine');
  g.setInput({ fire: true });
  g.tick(0.016);
  g.setInput({});
  assert.strictEqual(g.state().mineCount, 1);
  const posAtFire = g.getPos();
  raceThrough(g, 0.5); // mine arms (0.4s)
  const tl = g.trackLenNow();
  const mineZ = (posAtFire - 2 * g.SEG_LEN + tl) % tl;
  g.spawnMobAtZ(mineZ - 200, g.state().playerX, 'skitter');
  raceThrough(g, 1.0);
  assert.strictEqual(g.state().mineCount, 0, 'mob triggered the mine');
});

// spec: sr-cw-shockwave
// spec: sr-pre-effects
test('shockwave clears the swarm and shakes the screen', () => {
  const { g } = makeGame();
  startRace(g);
  g.spawnMobAt(10 * g.SEG_LEN, 0, 'skitter');
  g.spawnMobAt(12 * g.SEG_LEN, 0.3, 'skitter');
  g.spawnMobAt(14 * g.SEG_LEN, -0.3, 'brute');
  g.giveWeapon('shockwave');
  const before = g.state().mobCount;
  g.setInput({ fire: true });
  g.tick(0.016);
  const s = g.state();
  assert.strictEqual(s.mobCount, before - 3);
  assert.strictEqual(s.ammo, 1);
  assert.ok(s.particleCount > 0, 'mob deaths emit explosion particles');
  assert.ok(s.shake > 0, 'screen shake applied');
  assert.ok(s.score >= 150 + 150 + 350, 'bounties awarded');
});

// spec: sr-cw-hit-effects
// spec: sr-mob-hp
test('brute survives one blaster hit, dies on the second', () => {
  const { g } = makeGame();
  startRace(g);
  const score0 = g.state().score;
  g.spawnMobAt(30 * g.SEG_LEN, 0, 'brute');
  g.giveWeapon('blaster');
  for (let i = 0; i < 90; i++) {
    g.setInput({ fire: i % 12 === 0 });
    g.tick(0.016);
    if (g.state().mobCount === 0) break;
  }
  assert.strictEqual(g.state().mobCount, 0);
  assert.ok(g.state().score >= score0 + 350);
});

// spec: sr-mob-spawn
test('swarm cap is enforced', () => {
  const { g } = makeGame();
  startRace(g);
  for (let i = 0; i < 40; i++) g.spawnMobAt(50 * g.SEG_LEN, 0, 'skitter');
  assert.ok(g.state().mobCount <= g.MOB_CAP);
});

// spec: sr-mob-swarm
test('mobs steer toward the player (swarm)', () => {
  const { g } = makeGame();
  startRace(g);
  g.spawnMobAt(50 * g.SEG_LEN, 0.9, 'skitter');
  const d0 = Math.abs(g.state().mobs[0].x - g.state().playerX);
  raceThrough(g, 0.6);
  const d1 = Math.abs(g.state().mobs[0].x - g.state().playerX);
  assert.ok(d1 < d0, `lateral distance should shrink: ${d0} -> ${d1}`);
});

// spec: sr-mob-attack
test('unguarded ram damages armor and despawns the mob', () => {
  const { g } = makeGame();
  startRace(g);
  g.spawnMobAt(2 * g.SEG_LEN, 0, 'skitter');
  raceThrough(g, 5.0);
  assert.strictEqual(g.state().armor, 90);
});

// spec: sr-pow-shield
test('shield blocks ram damage', () => {
  const { g } = makeGame();
  startRace(g);
  g.spawnPickupAt(1.2 * g.SEG_LEN, 0, 'shield');
  raceThrough(g, 1.0);
  assert.ok(g.state().shieldT > 0);
  g.spawnMobAt(2 * g.SEG_LEN, 0, 'skitter');
  raceThrough(g, 5.0);
  assert.strictEqual(g.state().armor, 100);
});

// spec: sr-mob-cleanup
test('mobs behind the camera despawn', () => {
  const { g } = makeGame();
  startRace(g);
  g.spawnMobAt(-35 * g.SEG_LEN, 0, 'skitter');
  raceThrough(g, 0.2);
  assert.strictEqual(g.state().mobCount, 0);
});

// spec: sr-mob-difficulty
// spec: sr-lvl-ramp
test('spawn rate and mob speed ramp with level', () => {
  const { g } = makeGame();
  assert.ok(g.spawnIntervalFor(4) < g.spawnIntervalFor(1));
  assert.ok(g.mobSpeedFor(4, 'skitter') > g.mobSpeedFor(1, 'skitter'));
});

// spec: sr-pow-crates
// spec: sr-pow-nitro
test('nitro raises top speed, then expires', () => {
  const { g } = makeGame();
  startRace(g);
  const base = g.maxSpeedNow();
  g.spawnPickupAt(1.2 * g.SEG_LEN, 0, 'nitro');
  raceThrough(g, 1.0);
  assert.ok(g.state().nitroT > 0);
  assert.ok(g.maxSpeedNow() > base);
  raceThrough(g, 6.5);
  assert.strictEqual(g.state().nitroT, 0);
  assert.strictEqual(g.maxSpeedNow(), base);
});

// spec: sr-pow-repair
test('repair restores armor capped at max', () => {
  const { g } = makeGame();
  startRace(g);
  g.setArmor(95);
  g.spawnPickupAt(1.2 * g.SEG_LEN, 0, 'repair');
  raceThrough(g, 1.0);
  assert.strictEqual(g.state().armor, 100);
});

// spec: sr-pow-magnet
test('magnet pulls pickups toward the player', () => {
  const { g } = makeGame();
  startRace(g);
  g.spawnPickupAt(1.2 * g.SEG_LEN, 0, 'magnet');
  raceThrough(g, 1.0);
  assert.ok(g.state().magnetT > 0);
  g.spawnPickupAt(20 * g.SEG_LEN, 0.8, 'clock');
  const p0 = g.state().pickups.find(p => p.kind === 'clock');
  raceThrough(g, 0.5);
  const p1 = g.state().pickups.find(p => p.kind === 'clock');
  if (p1) assert.ok(Math.abs(p1.x) < Math.abs(p0.x), `magnet pull: ${p0.x} -> ${p1.x}`);
});

// spec: sr-pow-clock
test('clock adds race time', () => {
  const { g } = makeGame();
  startRace(g);
  raceThrough(g, 0.5);
  const t0 = g.state().time;
  g.spawnPickupAt(1.2 * g.SEG_LEN, 0, 'clock');
  raceThrough(g, 1.0);
  const t1 = g.state().time;
  assert.ok(t1 > t0 + 6.5, `clock bonus: ${t0} -> ${t1}`);
});

// spec: sr-pow-stacking
test('re-collecting nitro refreshes duration without compounding', () => {
  const { g } = makeGame();
  startRace(g);
  g.spawnPickupAt(1.2 * g.SEG_LEN, 0, 'nitro');
  raceThrough(g, 1.0);
  const boosted = g.maxSpeedNow();
  raceThrough(g, 3.0);
  g.spawnPickupAt(1.2 * g.SEG_LEN, g.state().playerX, 'nitro');
  raceThrough(g, 1.0);
  assert.ok(g.state().nitroT > 5, 'duration refreshed');
  assert.strictEqual(g.maxSpeedNow(), boosted, 'effect not compounded');
});

// spec: sr-lvl-biomes
test('five distinct biomes with palette, props, weather', () => {
  const { g } = makeGame();
  assert.ok(g.BIOMES.length >= 5);
  for (const b of g.BIOMES) {
    assert.ok(Array.isArray(b.sky) && b.sky.length >= 3, b.name + ' palette');
    assert.ok(Array.isArray(b.props) && b.props.length >= 2, b.name + ' props');
    assert.ok(typeof b.weather === 'string' && b.weather.length > 0, b.name + ' weather');
  }
});

// spec: sr-lvl-progression
// spec: sr-lvl-endless
test('crossing the final gate advances level, biome, and time', () => {
  const { g } = makeGame();
  startRace(g);
  const t0 = g.state().time;
  const tl = g.trackLenNow();
  g.setDist(tl - 50);
  g.setPos(tl - 100);
  raceThrough(g, 0.2);
  const s = g.state();
  assert.strictEqual(s.level, 2);
  assert.strictEqual(s.biome, g.BIOMES[1].name);
  assert.ok(s.time > t0, 'time bonus applied');
  assert.ok(s.score >= 1000, 'level bonus applied');
});

// spec: sr-lvl-terrain-curves
test('biome tracks generate different curve sequences', () => {
  const { g } = makeGame();
  const c1 = g.buildTrackFor(1).join(',');
  const c2 = g.buildTrackFor(2).join(',');
  const c4 = g.buildTrackFor(4).join(',');
  assert.notStrictEqual(c1, c2);
  assert.notStrictEqual(c1, c4);
  g.buildTrackFor(1);
});

// spec: sr-lvl-grip
test('ice biome reduces steering response', () => {
  const steer = (lv) => {
    const { g } = makeGame();
    startRace(g);
    g.setLevel(lv);
    g.setInput({ right: true });
    raceThrough(g, 1.0);
    return g.state().playerX;
  };
  const dry = steer(1), ice = steer(4);
  assert.ok(ice < dry, `ice (${ice}) should steer less than coast (${dry})`);
  const { g: gb } = makeGame();
  assert.ok(gb.BIOMES[3].grip < gb.BIOMES[0].grip);
});

// spec: sr-lvl-weather
test('frozen tundra emits snow particles', () => {
  const { g } = makeGame();
  startRace(g);
  g.setLevel(4);
  raceThrough(g, 2.0);
  assert.ok(g.state().weatherTypes.includes('snow'));
});

// spec: sr-pre-keyboard
test('keyboard fire input fires the weapon', () => {
  const { g, winListeners } = makeGame();
  startRace(g);
  g.giveWeapon('blaster');
  const kd = winListeners.keydown[0];
  kd({ key: ' ', preventDefault() {} });
  g.tick(0.016);
  assert.strictEqual(g.state().projectileCount, 1);
  winListeners.keyup[0]({ key: ' ' });
});

// spec: sr-pre-touch
test('multi-touch: steering zone and fire pad work together', () => {
  const { g, winListeners } = makeGame();
  startRace(g);
  g.giveWeapon('blaster');
  const pd = winListeners.pointerdown[0];
  pd({ pointerId: 1, target: { id: 'tz-left', classList: { contains: () => false } }, clientX: 20 });
  pd({ pointerId: 2, target: { id: 'fire-pad', classList: { contains: () => false } }, clientX: 350 });
  g.tick(0.016);
  assert.strictEqual(g.state().projectileCount, 1, 'fire pad fired');
  raceThrough(g, 0.8);
  assert.ok(g.state().playerX < 0, 'left steering applied while firing');
});

// spec: sr-pre-hud
test('HUD armor reflects damage on next frame', () => {
  const { g, elements } = makeGame();
  startRace(g);
  g.debugCrash(25);
  g.tick(0.016);
  assert.strictEqual(g.state().armor, 75);
  assert.strictEqual(elements['hud-armor-fill'].style.width, '75%');
});

// spec: sr-pre-perf
test('particle cap holds under heavy combat', () => {
  const { g } = makeGame();
  startRace(g);
  for (let i = 0; i < g.MOB_CAP; i++) g.spawnMobAt((5 + i) * g.SEG_LEN, 0, 'skitter');
  g.giveWeapon('shockwave');
  for (let r = 0; r < 3; r++) {
    g.giveWeapon('shockwave'); g.setInput({ fire: true }); g.tick(0.016); g.setInput({});
    for (let i = 0; i < g.MOB_CAP; i++) g.spawnMobAt((5 + i) * g.SEG_LEN, 0, 'skitter');
    g.tick(0.9);
  }
  assert.ok(g.state().particleCount <= g.PART_CAP);
});

// spec: sr-pre-download
test('download button exports the document as html blob', () => {
  const { elements, blobCalls } = makeGame();
  elements['btn-download'].listeners.click[0]();
  assert.strictEqual(blobCalls.length, 1);
});

// spec: sr-pre-effects (crash path)
test('traffic crash without shield costs armor, with shield does not', () => {
  const { g } = makeGame();
  startRace(g);
  g.debugCrash(25);
  assert.strictEqual(g.state().armor, 75);
  g.spawnPickupAt(1.2 * g.SEG_LEN, 0, 'shield');
  raceThrough(g, 1.0);
  g.debugCrash(25);
  assert.strictEqual(g.state().armor, 75);
});

// spec: sr-pre-effects / wrecked path
test('armor zero wrecks the run (game over)', () => {
  const { g } = makeGame();
  startRace(g);
  g.setArmor(20);
  g.debugCrash(25);
  g.tick(0.016);
  assert.strictEqual(g.state().state, 'gameover');
});

// ------------------------------------------------ timer expiry path
test('timer expiry ends the run', () => {
  const { g } = makeGame();
  startRace(g);
  g.setTime(0.01);
  g.tick(0.02);
  assert.strictEqual(g.state().state, 'gameover');
});

// ------------------------------------------------ failure-registry guards
test('regression guards: v1 bug signatures stay out', () => {
  assert.ok(!/segments\[Math\.floor\([^%]*?\/SEG_LEN\)\]/.test(HTML),
    'unmoduloed segment index (FAIL-2026090901)');
  assert.ok(!/playerX\s*\+=\s*dx\s*\*\s*CENTRI/.test(HTML),
    'centrifugal sign flip (FAIL-2026090902)');
  const doubled = HTML.split('\n').some(l => (l.match(/updateTraffic\(dt\)/g) || []).length > 1);
  assert.ok(!doubled, 'traffic advanced from exactly one call site per frame (FAIL-2026090903)');
});

// spec: sr-pre-single-file
test('render smoke: full frame renders without throwing', () => {
  const { g } = makeGame();
  startRace(g);
  raceThrough(g, 2.0);
  g.giveWeapon('blaster');
  g.spawnMobAt(30 * g.SEG_LEN, 0.3, 'brute');
  g.setInput({ fire: true });
  g.tick(0.016);
  assert.doesNotThrow(() => g.renderOnce());
  assert.doesNotThrow(() => g.renderOnce());
});
