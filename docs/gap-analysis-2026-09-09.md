# Sunset Rush — Mobility Audit + 2026 Retro Gameplay/Visual Gap Analysis

Date: 2026-09-09 (evening pass, second audit same day)
Trigger (user, verbatim): "I think we need a gameplay and visual gap analysis
vs 2026 reto games. Game needs skid outs. Back flips, huge explosions, aliens.
Game still goes off the screen so you need to do more mobility validation with
playwright first" + "P.s the break perhaps breakd the visuals validate"

Method: Playwright-first mobility matrix (`tests/mobility/mobility.mjs`, real
keyboard + real CDP touch input, canvas pixel analysis, DOM rect checks) run
against the current build BEFORE any fix. 13 of 14 viewport scenarios fail on
main. Market comparison from cited 2024–2026 retro-racer coverage below.

## 1. Mobility findings (Playwright matrix, pre-fix results)

Matrix: 320x568, 375x667, 390x844, 360x640 portrait; 844x390 landscape;
768x1024 tablet; 1280x720 desktop; DPR 1/2/3; real keyboard + CDP touch.

### F1 — The road leaves the viewport off-road (user-reported, CONFIRMED)
Holding steer for ~1.5–3s drives playerX to the ±2.2 clamp. Pixel scans show
the road band then vanishes at near/mid/far scan rows on every phone viewport
(`roadNear/roadMid/roadFar` null; screenshots in tests/mobility/artifacts from
the exploration run). Root cause is a double displacement: the camera tracks
`playerX*ROAD_W` fully AND the car sprite is drawn with an additional
`playerX*0.28W` offset, so world and car separate and the road slides wholly
off-screen while the car floats over grass.

### F2 — Car sprite detaches from its true position
playerX clamps at ±2.2 but the sprite clamps at ±1.35 screen units, so the car
appears pinned while still moving. The sprite/world mismatch makes the car
untrustworthy as a position read.

### F3 — Player car drives under the FIRE pad in landscape
At full right lock on 844x390 the car's bbox overlaps the fire pad rect
(pixel + rect verified). Actionable control occludes the player.

### F4 — Near-camera props scale without bound
`drawProp` size clamp `H*0.6` still lets near palms/trees cover half the
landscape screen (screenshot evidence). No distance fade or cap relative to
the viewport's shorter axis.

### F5 — Brake input zone wider than its visual strip (CONFIRMED)
`zoneForX` treats 32–68% width as brake; the visible `#tz-brake` strip covers
only 32–54%. Touching 54–68% brakes with no visible zone under the finger
(behavior-verified: `tz-brake` highlights for a 0.6W touch). Matrix asserts
visual coverage of the full input zone — fails on all touch viewports.

### F6 — Braking is visually mute (user-suspected, CONFIRMED)
Real-input brake tests (keyboard ArrowDown/S and touch center strip, short and
4–5s long holds, desktop + mobile): speed drops from ~8800 to 0 in <1s with no
brake lights, no skid marks, no screech, no skid physics. Nothing errors, but
the car gives zero visual feedback — reads as broken. Matrix asserts brake
light pixels while braking at speed — fails everywhere pre-fix.

### F7 — No skid system
Brake + steer at speed does nothing distinct; low-grip tundra only scales
steer rate. No skid-outs, no recovery play.

## 2. Gameplay/visual gap vs current retro racers (sourced)

| Expectation in the current retro-racer market | Source | Sunset Rush today |
| --- | --- | --- |
| Drift/skid mechanic with a payoff (hold drift through corners to fill a 3-level boost bar) | Traxion, Victory Heat Rally review, 2024-10-12 — https://traxion.gg/victory-heat-rally-review-channeling-segas-classics-but-not-quite-matching-them/ | No skid/drift system at all (F7) |
| Air time and jumps ("sections ping your ship up into the air so you can properly fly"); extreme track undulation as a thrill | Rock Paper Shotgun on Star Racer 1.0, 2025 — https://www.rockpapershotgun.com/star-racer-a-combat-ship-speedfest-about-evading-the-fuzz-as-an-alien-mom-has-zoomed-out-of-early-access | Hills are cosmetic; car never leaves the ground |
| Camera that tilts/rolls with the car for game feel (optional in VHR) | Destructoid on Victory Heat Rally, 2023-04-14 — https://www.destructoid.com/victory-heat-rally-feels-like-a-missing-link-in-arcade-racers/ | Camera static except damage shake |
| Escalating antagonist pressure with character (police "Fuzz" arrive late-race; alien cast) | RPS Star Racer (above) | Skitters/brutes are anonymous blobs; no escalation event |
| Destruction spectacle (smashing lapped cars called out as a feature) | Traxion VHR review (above) | Mob deaths are 14-particle pops; player wreck is a text screen |
| Clear crash consequence and reset | Traxion VHR review (above) | Crash = speed cut + flash; wreck = instant game over, no spectacle |

2025–2026 market context (release evidence, Steam): Star Racer 1.0 (combat
racer, F-Zero/Wipeout lineage, aliens), Cosmic Race: Galactic Showdown (combat
racing), Neon Curves Racing, Racer Overdrive, Glow Arcade Racer, Skrrt Racing,
Off World Racing, Drift Invaders — search result set 2026-09-09. The current
wave expects combat + spectacle + movement tech (drift, air) even in
retro-styled packages.

## 3. Remediation scope (see openspec/changes/mobility-spectacle-expansion)

1. Viewport containment: single-source camera model (camera fully tracks
   playerX; car drawn at screen center with lean only), playerX soft wall at
   ±2.0, guaranteed road-under-car at all times, prop size cap + near fade,
   fire-pad/car collision resolved, brake strip widened to its input zone.
2. Brake made physical and visible: brake lights, progressive decel, skid
   marks, screech; skid-out state when braking/steering hard at speed (grip-
   scaled), with counter-steer recovery.
3. Ramps + backflips: chevron ramps on track; launch → airborne with rotation
   control; full rotation = backflip, landing graded (clean/bad), banner +
   score; bad landing costs armor.
4. Layered big explosions: flash + fireball + debris + smoke + ring + shake,
   scaled per victim (brute > skitter, player wreck largest).
5. Aliens: saucer enemy that hovers, strafes, fires dodgeable plasma bolts;
   alien swarm escalation waves; distinct silhouette (dome, lights, beam).
6. Game feel: camera roll on steer/skid, landing thud, air-time hang.
7. Validation: this Playwright matrix as a CI gate + feature tests proving
   skid/backflip/explosion/alien behavior with real input and pixels.
