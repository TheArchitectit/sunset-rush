# Design: remediate-fire-and-readability

## Default weapon readiness
`reset()` equips `blaster` with `ammo = Infinity`. Crate pickups override the
weapon and set finite ammo as before; when finite ammo reaches zero the weapon
reverts to `blaster`/`Infinity` instead of `null`. HUD shows the blaster with
an infinity mark for the baseline. Balance impact: the blaster (1 dmg, 0.16s
cooldown, single lane) becomes the always-available floor; homing/mine/
shockwave stay strict upgrades, preserving crate value. sr-cw-dry-fire's "no
gameplay effect" is preserved (cooldown and non-race states still swallow
fire) and extended with feedback: firing on cooldown flashes the weapon box;
a true no-weapon state no longer exists in normal play.

## Edge-captured fire
`fireQueued` is set on keydown (Space/Z, ignoring `e.repeat`) and on fire-pad
pointerdown. `update()` consumes the queue once per frame before the
held-input auto-fire path, so a tap of any duration produces exactly one shot
(subject to cooldown), while holding Space still auto-fires at the cooldown
rate.

## Touch steering transfer
Each pointer remembers whether it started on the fire pad (`fireOrigin`). For
non-fire pointers, the role is recomputed from `clientX` on every pointerdown
and pointermove (left < 32% width, right > 68%, else brake), so a sliding
finger steers by position. Fire-pad pointers stay `fire` for their lifetime
so the firing hand never drops a shot.

## HUD legibility + onboarding
Normative minimums at 390px width: HUD values >= 13px, labels >= 10px, armor
bar >= 96px wide; weapon box always shows name + ammo. A hint strip shows
"SPACE/Z or FIRE to shoot - arrows steer - grab crates for special weapons"
for the first 6s of each race. The touch overlay only displays while state is
countdown or race.

## Clean export
`downloadSelf()` serializes a cloned `documentElement` normalized to boot
state: start screen visible, game-over screen and HUD hidden, message/banner
emptied. Export errors surface as a console warning (no silent success).

## Determinism: two RNG streams
`rng` remains the gameplay stream (mob/pickup spawn and behavior). A second
seeded stream `vrng` (mulberry32, seed derived from seedBase) feeds every
purely visual consumer: render shake, speed lines, nitro flames, muzzle
flash, weather particles, explosion particles, offroad dust, and audio noise
bursts. `reset(seed)` reseeds both. A unit test interleaves `renderOnce()`
between ticks and asserts identical gameplay state with and without
rendering.

## Frame-loop hygiene
`updateHUD` has exactly one call site (`step()`); the countdown branch calls
`updateTraffic(dt)` so cars no longer freeze; `ptrRoles` clears on race
start/end; `lastBeep` resets in `reset()`; dead `keysHeld` removed.

## Validation
`tests/e2e-chrome.mjs` (Node stdlib only, CDP over `--remote-debugging-pipe`,
no WebSocket, satisfying PREVENT-SR-004): launches system Chrome headless,
loads `index.html` from `file://`, and asserts with trusted input events:
real Enter starts the race; a real 5ms Space tap fires at race start (default
weapon + edge capture); real touch slide transfers steering; real fire-pad
tap fires; multi-touch steer+fire; export-at-game-over boots to title; touch
overlay hidden on title; HUD computed-style minimums; desktop and mobile
screenshots written to `tests/artifacts/` for review. Unit additions cover
default weapon, ammo-exhaustion revert, two-stream determinism, single
updateHUD call site, and countdown traffic motion. The failure registry gains
FAIL-2026090904..08 for the confirmed defects. CI: install `typescript@5`
before the semantic scan, tag v2.0.0 as the `--all` diff base, and run the
e2e suite (ubuntu-latest ships Chrome).
