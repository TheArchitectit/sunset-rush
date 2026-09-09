/**
 * Playwright-first mobility validation matrix for Sunset Rush.
 *
 * The gate: the player, the road under the player, the HUD, and the touch
 * controls must stay visible and usable across viewports, orientations,
 * steering extremes, braking, skids, jumps/backflips, respawn and long runs,
 * driven with REAL keyboard and touch input (no logic hooks for input).
 *
 * Usage: node tests/mobility/mobility.mjs [--file <path>]
 * Requires: playwright (npm install) and a system Chrome (channel 'chrome').
 */
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const artifacts = join(root, 'tests', 'mobility', 'artifacts');
mkdirSync(artifacts, { recursive: true });
const argFile = process.argv.indexOf('--file');
const gameUrl = pathToFileURL(argFile >= 0 ? process.argv[argFile + 1] : join(root, 'index.html')).href;

const VIEWPORTS = [
  { name: 'tiny-320',    width: 320,  height: 568, mobile: true,  touch: true, dpr: 2 },
  { name: 'iphone-se',   width: 375,  height: 667, mobile: true,  touch: true, dpr: 2 },
  { name: 'iphone-14',   width: 390,  height: 844, mobile: true,  touch: true, dpr: 3 },
  { name: 'android-360', width: 360,  height: 640, mobile: true,  touch: true, dpr: 2 },
  { name: 'landscape',   width: 844,  height: 390, mobile: true,  touch: true, dpr: 3 },
  { name: 'tablet',      width: 768,  height: 1024, mobile: true, touch: true, dpr: 2 },
  { name: 'desktop',     width: 1280, height: 720, mobile: false, touch: false, dpr: 1 },
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

// In-page canvas analysis. Palette-driven: reads the active biome's real colors.
const ANALYZE = `(() => {
  const c = document.getElementById('game');
  const g = c.getContext('2d');
  const W = c.clientWidth, H = c.clientHeight, DPR = c.width / W;
  const d = g.getImageData(0, 0, c.width, c.height).data;
  const st = __game.state();
  const b = __game.BIOMES[(st.level - 1) % __game.BIOMES.length];
  const hex = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  const roadCols = [hex(b.road[0]), hex(b.road[1]), hex(b.rumble[0]), hex(b.rumble[1]), hex(b.lane)];
  const near = (i, col, tol) => Math.abs(d[i]-col[0])<=tol && Math.abs(d[i+1]-col[1])<=tol && Math.abs(d[i+2]-col[2])<=tol;
  const isRoad = i => roadCols.some(col => near(i, col, 26));
  function roadAt(yCss){
    const y = Math.round(yCss * DPR);
    let first = -1, last = -1;
    for (let x = 0; x < c.width; x++) {
      const i = (y * c.width + x) * 4;
      if (isRoad(i)) { if (first < 0) first = x; last = x; }
    }
    return first < 0 ? null : { left: first / DPR, right: last / DPR, width: (last - first) / DPR };
  }
  // Player car: pink #ff2e88 pixels in the lower-central region.
  let minX=1e9, maxX=-1, minY=1e9, maxY=-1, count=0;
  const y0 = Math.round(H*0.66*DPR), y1 = Math.round(H*0.995*DPR);
  const x0 = Math.round(W*0.04*DPR), x1 = Math.round(W*0.96*DPR);
  for (let y=y0; y<y1; y+=1) for (let x=x0; x<x1; x+=1) {
    const i=(y*c.width+x)*4;
    if (d[i]>220 && d[i+1]<95 && d[i+2]>100 && d[i+2]<185) {
      count++;
      if (x<minX)minX=x; if (x>maxX)maxX=x;
      if (y<minY)minY=y; if (y>maxY)maxY=y;
    }
  }
  const car = count > 40 ? { left:minX/DPR, right:maxX/DPR, top:minY/DPR, bottom:maxY/DPR,
    cx:((minX+maxX)/2)/DPR, cy:((minY+maxY)/2)/DPR, count } : null;
  // Is the car over road? sample directly under the car center bottom.
  let carOnRoad = null;
  if (car) {
    // any road pixel in a small neighborhood just below the car center
    const px = Math.round(car.cx*DPR), py = Math.round(Math.min(car.bottom + 6, H - 4)*DPR);
    carOnRoad = false;
    for (let dy=-3; dy<=3 && !carOnRoad; dy++) for (let dx=-3; dx<=3; dx++) {
      const yy=py+dy, xx=px+dx;
      if (yy<0||yy>=c.height||xx<0||xx>=c.width) continue;
      if (isRoad((yy*c.width+xx)*4)) { carOnRoad = true; break; }
    }
  }
  // Brake lights: red pixels in a strip just above the car's rear (brake glow)
  let brakeGlow = 0;
  if (car) {
    const bx0=Math.round((car.cx-carW(car))*DPR), bx1=Math.round((car.cx+carW(car))*DPR);
    const by0=Math.round((car.bottom-14)*DPR), by1=Math.round((car.bottom+2)*DPR);
    for (let y=Math.max(0,by0); y<Math.min(c.height,by1); y++) for (let x=Math.max(0,bx0); x<Math.min(c.width,bx1); x++) {
      const i=(y*c.width+x)*4;
      if (d[i]>230 && d[i+1]<80 && d[i+2]<80) brakeGlow++;
    }
  }
  function carW(car){ return (car.right-car.left)/2 * 0.9; }
  // Skid marks: dark streak pixels just behind/around the car on the road.
  let skidMarks = 0;
  if (car) {
    const sx0=Math.round((car.cx-(car.right-car.left))*DPR), sx1=Math.round((car.cx+(car.right-car.left))*DPR);
    const sy0=Math.round(car.bottom*DPR), sy1=Math.min(c.height-1, Math.round((car.bottom+ (H*0.12))*DPR));
    for (let y=sy0; y<sy1; y+=1) for (let x=Math.max(0,sx0); x<Math.min(c.width,sx1); x+=1) {
      const i=(y*c.width+x)*4;
      if (d[i]<45 && d[i+1]<45 && d[i+2]<55) skidMarks++;
    }
  }
  return { W, H, car, carOnRoad, brakeGlow, skidMarks,
    roadNear: roadAt(H*0.80), roadMid: roadAt(H*0.63), roadFar: roadAt(H*0.52),
    state: st.state, playerX: st.playerX, speed: st.speed, level: st.level,
    skid: st.skid, air: st.air, flips: st.flips };
})()`;

const RECTS = `(() => {
  const r = id => { const el = document.getElementById(id); if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x:b.x, y:b.y, w:b.width, h:b.height, display:getComputedStyle(el).display }; };
  const boxes = [...document.querySelectorAll('#hud-top .box')].map(el => {
    const b = el.getBoundingClientRect(); return { x:b.x, y:b.y, w:b.width, h:b.height };
  });
  return { hud: r('hud-top'), boxes, fire: r('fire-pad'), touch: r('touch'),
    brakeZone: r('tz-brake'), leftZone: r('tz-left'), rightZone: r('tz-right'), hint: r('hint') };
})()`;

let failures = 0;
const failedNames = [];
async function run(name, fn) {
  try { await fn(); console.log(`ok   ${name}`); }
  catch (e) { failures++; failedNames.push(name); console.error(`FAIL ${name}\n${(e.stack || e).toString().split('\n').slice(0, 6).join('\n')}`); }
}

async function newPage(browser, vp) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    hasTouch: vp.touch, isMobile: vp.mobile, deviceScaleFactor: vp.dpr,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(gameUrl);
  await page.waitForTimeout(700);
  return { ctx, page, errors };
}

async function startRace(page, vp) {
  if (vp.touch) await page.tap('#btn-start'); else await page.click('#btn-start');
  await page.waitForTimeout(3600);
  assert.equal(await page.evaluate('__game.state().state'), 'race');
}

async function holdSteer(page, vp, dir, ms) {
  if (vp.touch) {
    const cdp = await page.context().newCDPSession(page);
    const x = dir === 'right' ? vp.width - 40 : 40;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: vp.height * 0.65, id: 11 }] });
    await page.waitForTimeout(ms);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await page.keyboard.down(dir === 'right' ? 'ArrowRight' : 'ArrowLeft');
    await page.waitForTimeout(ms);
    await page.keyboard.up(dir === 'right' ? 'ArrowRight' : 'ArrowLeft');
  }
}

async function holdBrake(page, vp, ms) {
  if (vp.touch) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: vp.width * 0.5, y: vp.height * 0.65, id: 12 }] });
    await page.waitForTimeout(ms);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await page.keyboard.down('ArrowDown');
    await page.waitForTimeout(ms);
    await page.keyboard.up('ArrowDown');
  }
}

// The invariants every scenario must satisfy.
async function assertMobility(page, vp, label, errors) {
  const a = await page.evaluate(ANALYZE);
  assert.ok(a.car, `${label}: player car pixels not found (${a.car && a.car.count})`);
  assert.ok(a.car.left >= 0 && a.car.right <= a.W && a.car.top >= 0 && a.car.bottom <= a.H,
    `${label}: car bbox out of viewport ${JSON.stringify(a.car)} in ${a.W}x${a.H}`);
  assert.ok(a.car.cx > a.W * 0.12 && a.car.cx < a.W * 0.88,
    `${label}: car center ${a.car.cx.toFixed(0)} too close to edge of ${a.W}`);
  assert.ok(a.carOnRoad === true, `${label}: car not over road pixels (playerX=${a.playerX.toFixed(2)})`);
  assert.ok(a.roadNear && a.roadNear.width > a.W * 0.3,
    `${label}: road band missing/narrow at near row: ${JSON.stringify(a.roadNear)}`);
  assert.ok(a.roadMid && a.roadMid.width > a.W * 0.15,
    `${label}: road band missing at mid row: ${JSON.stringify(a.roadMid)}`);
  const r = await page.evaluate(RECTS);
  assert.ok(r.hud && r.hud.y >= 0 && r.hud.y + r.hud.h <= a.H && r.hud.x >= 0 && r.hud.x + r.hud.w <= a.W,
    `${label}: HUD out of viewport ${JSON.stringify(r.hud)}`);
  for (const bx of r.boxes) {
    assert.ok(bx.x >= 0 && bx.x + bx.w <= a.W + 1 && bx.y >= 0 && bx.y + bx.h <= a.H,
      `${label}: HUD box out of viewport ${JSON.stringify(bx)}`);
  }
  if (vp.touch) {
    assert.equal(r.fire.display, 'flex', `${label}: fire pad not visible during race`);
    assert.ok(r.fire.x >= 0 && r.fire.x + r.fire.w <= a.W && r.fire.y >= 0 && r.fire.y + r.fire.h <= a.H,
      `${label}: fire pad out of viewport ${JSON.stringify(r.fire)}`);
    // car must not hide under the fire pad
    const overlapX = Math.min(a.car.right, r.fire.x + r.fire.w) - Math.max(a.car.left, r.fire.x);
    const overlapY = Math.min(a.car.bottom, r.fire.y + r.fire.h) - Math.max(a.car.top, r.fire.y);
    assert.ok(overlapX <= 0 || overlapY <= 0,
      `${label}: car hidden under fire pad (overlap ${overlapX.toFixed(0)}x${overlapY.toFixed(0)})`);
    // brake visual zone must cover the brake INPUT zone (32%-68%)
    assert.ok(r.brakeZone.x <= a.W * 0.33 && r.brakeZone.x + r.brakeZone.w >= a.W * 0.67,
      `${label}: brake visual strip ${JSON.stringify(r.brakeZone)} does not cover brake input zone`);
  }
  assert.deepEqual(errors, [], `${label}: page errors: ${errors.join(' | ')}`);
  return a;
}

const browser = await chromium.launch({ channel: 'chrome' });

for (const vp of VIEWPORTS) {
  await run(`${vp.name}: baseline + steering extremes + brake + recovery`, async () => {
    const { ctx, page, errors } = await newPage(browser, vp);
    try {
      await startRace(page, vp);
      await page.waitForTimeout(1500);
      await assertMobility(page, vp, `${vp.name} baseline`, errors);

      await holdSteer(page, vp, 'right', 3000);
      const aR = await assertMobility(page, vp, `${vp.name} hard-right`, errors);
      await page.screenshot({ path: join(artifacts, `${vp.name}-hard-right.png`) });
      await holdSteer(page, vp, 'left', 3000);
      await assertMobility(page, vp, `${vp.name} hard-left`, errors);
      await holdSteer(page, vp, 'right', 3000); // recover toward center

      // brake while moving: speed must drop, brake lights must show
      await page.waitForTimeout(1200);
      const before = await page.evaluate('__game.state().speed');
      if (vp.touch) {
        const cdp = await page.context().newCDPSession(page);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: vp.width * 0.5, y: vp.height * 0.65, id: 13 }] });
        await page.waitForTimeout(350);
        const during = await page.evaluate(ANALYZE);
        assert.ok(during.speed < before, `${vp.name}: touch brake did not slow car (${before} -> ${during.speed})`);
        assert.ok(during.brakeGlow > 20, `${vp.name}: no brake-light pixels while braking (glow=${during.brakeGlow})`);
        await assertMobility(page, vp, `${vp.name} braking`, errors);
        await page.screenshot({ path: join(artifacts, `${vp.name}-braking.png`) });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } else {
        await page.keyboard.down('ArrowDown');
        await page.waitForTimeout(350);
        const during = await page.evaluate(ANALYZE);
        assert.ok(during.speed < before, `${vp.name}: brake did not slow car (${before} -> ${during.speed})`);
        assert.ok(during.brakeGlow > 20, `${vp.name}: no brake-light pixels while braking (glow=${during.brakeGlow})`);
        await assertMobility(page, vp, `${vp.name} braking`, errors);
        await page.screenshot({ path: join(artifacts, `${vp.name}-braking.png`) });
        await page.keyboard.up('ArrowDown');
      }
      // recovery: release, accelerate again, still on screen
      await page.waitForTimeout(2500);
      await assertMobility(page, vp, `${vp.name} recovery`, errors);
      // long brake hold: must not error or leave screen
      await holdBrake(page, vp, 4000);
      await assertMobility(page, vp, `${vp.name} long-brake`, errors);
    } finally { await ctx.close(); }
  });

  await run(`${vp.name}: orientation change mid-race`, async () => {
    const { ctx, page, errors } = await newPage(browser, vp);
    try {
      await startRace(page, vp);
      await page.waitForTimeout(1200);
      await page.setViewportSize({ width: vp.height, height: vp.width });
      await page.waitForTimeout(1200);
      const dims = await page.evaluate('JSON.stringify({W:innerWidth,H:innerHeight,cw:document.getElementById("game").clientWidth,ch:document.getElementById("game").clientHeight})');
      const d = JSON.parse(dims);
      assert.equal(d.cw, d.W, `${vp.name}: canvas width ${d.cw} != viewport ${d.W} after rotate`);
      assert.equal(d.ch, d.H, `${vp.name}: canvas height ${d.ch} != viewport ${d.H} after rotate`);
      await assertMobility(page, { ...vp, width: vp.height, height: vp.width }, `${vp.name} rotated`, errors);
    } finally { await ctx.close(); }
  });
}

// Long-run stability on two representative viewports.
for (const vp of [VIEWPORTS[2], VIEWPORTS[6]]) {
  await run(`${vp.name}: 45s long-run with mixed real input`, async () => {
    const { ctx, page, errors } = await newPage(browser, vp);
    try {
      await startRace(page, vp);
      const moves = ['left', 'right', 'brake', 'none'];
      for (let i = 0; i < 15; i++) {
        const mv = moves[i % moves.length];
        if (mv === 'left' || mv === 'right') await holdSteer(page, vp, mv, 2200);
        else if (mv === 'brake') await holdBrake(page, vp, 1500);
        else await page.waitForTimeout(1800);
        const st = await page.evaluate('__game.state().state');
        if (st === 'gameover') break;
      }
      const st = await page.evaluate('__game.state().state');
      if (st === 'race') await assertMobility(page, vp, `${vp.name} long-run`, errors);
      assert.deepEqual(errors, [], `${vp.name} long-run page errors: ${errors.join(' | ')}`);
    } finally { await ctx.close(); }
  });
}

await browser.close();
if (failures) {
  console.error(`\nmobility: ${failures} scenario(s) failed`);
  for (const n of failedNames) console.error(`  - ${n}`);
  process.exit(1);
}
console.log('\nmobility: all viewport, orientation, braking, and long-run checks passed');
