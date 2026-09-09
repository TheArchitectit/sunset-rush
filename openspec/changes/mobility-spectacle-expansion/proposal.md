# Proposal: mobility-spectacle-expansion

## Why
The 2026-09-09 evening audit (docs/gap-analysis-2026-09-09.md), triggered by
the user report "Game still goes off the screen ... the break perhaps breakd
the visuals validate", confirmed with a new Playwright mobility matrix (13 of
14 viewport scenarios failing on main): the road leaves the viewport off-road
(double camera/sprite displacement), the car sprite detaches from its true
position and can hide under the fire pad, near props scale without bound, the
touch brake input zone is wider than its visible strip, and braking is
visually mute (no lights, skids, or skid physics). The sourced 2026 retro
racer gap analysis shows the current market expects drift/skid mechanics, air
time, camera feel, escalating antagonists with character, and destruction
spectacle (Traxion, Rock Paper Shotgun, Destructoid citations in the audit).

## What changes
- `presentation-offline` (modified): the camera SHALL track the player fully
  and the car SHALL render at screen center with lean only, so the road never
  leaves the viewport; playerX gets a soft wall; props cap size and fade near
  the camera; the fire pad never covers the player car; the visible brake
  strip covers its full input zone; braking shows brake lights, skid marks,
  and screech; camera rolls with steering and skids; explosions become
  layered (flash, fireball, debris, smoke, shockwave ring, shake).
- `vehicle-dynamics` (new): braking or steering hard at speed enters a
  skid-out (grip-scaled, worse on low-grip biomes) with skid marks, smoke,
  speed scrub, and counter-steer recovery; ramps launch the car airborne with
  rotation control; a full rotation is a scored BACKFLIP with a graded
  landing; bad landings cost armor.
- `alien-invasion` (new): hovering alien saucers strafe above the road and
  fire dodgeable plasma bolts; alien swarm waves escalate at checkpoints;
  saucer kills trigger the layered explosion.
- Validation: `tests/mobility/mobility.mjs` (Playwright, real keyboard + CDP
  touch, canvas pixel analysis, DOM rect checks) becomes a CI gate covering
  narrow/wide portrait, landscape, tablet, desktop, DPRs, orientation
  changes, steering extremes, braking (short/long, keyboard/touch), skids,
  jumps/backflips, recovery, and long-run sessions.

## Non-goals
- No external assets or runtime dependencies in the game file; all art and
  audio stay synthesized. No copied IP: aliens/saucers are original
  silhouettes, not any franchise's designs.
- No online multiplayer, no new biomes, no weapon roster changes.
- DevGate baseline stays untouched; project deltas stay in `.guardrails/`.
