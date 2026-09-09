# Design: mobility-spectacle-expansion

## Camera and containment
The render camera x tracks `playerX*ROAD_W` exactly (as today), and the player
car is drawn at `W/2` plus a lean tilt only — no lateral screen offset. This
removes the double displacement that pushed the road off-screen (F1) and the
sprite/world detach (F2). The car's world position is always the road point
under the sprite. playerX clamps to ±2.0 with a soft wall: beyond ±1.6,
steering authority decays and rumble/shake feedback plays, so off-road is a
penalty zone, not an escape. Prop draw size caps at `min(H,W)*0.35` and props
within 3 segments of the camera fade out (F4). The fire pad moves up/left
enough that its rect can never intersect the centered car (F3); the mobility
matrix asserts zero overlap.

## Brake and skid physics
Brake becomes progressive: decel scales with speed (stronger bite at high
speed, capped), brake lights render while braking (F6), and a synthesized
screech loops while skidding. Skid-out (F7): when lateral demand
(|steer| * speedPct) or brake-at-speed exceeds `grip * THRESHOLD`, the car
enters `skid` state: steering authority drops 65%, the car keeps momentum
direction, speed scrubs, rear smoke + dark skid-mark decals persist ~4s, and
the player recovers by releasing brake / counter-steering below threshold.
Low-grip biomes (tundra 0.55) skid far more readily. Skids are deterministic
(gameplay RNG untouched; decals use the visual stream).

## Ramps and backflips
Ramps spawn as track features (chevron-striped wedge, 2 per level minimum on
straights, seeded). Driving over one at speed > 40% launches `air` state:
y-velocity from speed, gravity, no off-road penalty while airborne, steering
becomes pitch control (hold left/right to rotate). Each full 2*PI rotation in
air increments `flips`; on landing: rotation within ±0.35 rad of flat = clean
("BACKFLIP!" banner, +750*flips, small speed boost); otherwise hard landing
(armor -15, speed cut). Landing off-road is allowed but re-applies off-road
rules. Camera stays fixed during air (hang-time feel) with a landing thud
shake.

## Aliens
Saucer (new mob class, original silhouette: dome + rim lights + beam):
hovers ~1.2 car-heights above the road, strafes sinusoidally, every 2.4s
telegraphs (rim flash) then fires a slow plasma bolt at the player's current
lane. Bolts are dodgeable projectiles (armor -10 on hit, shield blocks).
HP 3, bounty 600, big layered explosion on death. Waves: at each checkpoint
gate after level 2, a scripted swarm wave spawns (skitters + saucers scaled
by level) with a banner ("ALIEN SWARM!"). Cap: 4 saucers alive.

## Layered explosions
One `bigExplosion(z,x,scale)` system: white flash, expanding fireball
(2 layers), debris particles (8-24, visual RNG), rising smoke puffs,
expanding shockwave ring in screen space, shake scaled by proximity. Mob
deaths route through it (skitter small, brute medium, saucer large, player
wreck = full-screen sequence before game-over).

## Validation
`tests/mobility/mobility.mjs` uses the Playwright library with the system
Chrome channel (CI-safe, no browser download). It drives real keyboard and
CDP touch input and analyzes actual canvas pixels (biome-palette road
detection, car bbox, brake-light and skid-mark pixel probes) plus DOM rects
(HUD, fire pad, brake strip). It runs in CI. Feature tests exercise skid,
backflip, explosion, and saucer behavior through the same real-input path
plus minimal state hooks for setup only.
