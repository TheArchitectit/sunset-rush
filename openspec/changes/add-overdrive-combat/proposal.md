# Proposal: add-overdrive-combat

## Why
Sunset Rush v1 is a checkpoint racer with traffic only. The requested v2 turns it
into a late-90s/early-2000s console-style combat arcade racer: richer presentation
("128-bit era"), weapons, swarming hostile mobs, power-ups, and terrain that
changes per level. This change is also the reference integration for consuming
DevGate via the `.devgate/` baseline + thin project `.guardrails/` overlay.

## What changes
- NEW capability `combat-weapons`: blaster, homing missiles, mines, shockwave;
  weapon crates, ammo, firing inputs on keyboard and touch.
- NEW capability `swarm-mobs`: hostile creatures that spawn ahead, swarm toward
  the player, and ram for armor damage; they have HP and can be destroyed.
- NEW capability `power-ups`: nitro, shield, repair, magnet, clock pickups with
  stacking rules.
- NEW capability `level-terrain`: five biomes (Sunset Coast, Neon City, Red
  Desert, Frozen Tundra, Volcano) with distinct palettes, props, weather
  particles, curve/hill profiles, and grip; checkpoint-gated progression.
- NEW capability `presentation-offline`: particle system, screen shake, speed
  lines, muzzle flash, synthesized SFX set, HUD extensions, single-file/offline
  guarantees, seeded determinism, touch/keyboard controls, download-self export.
- Player gains an armor pool; mob rams and traffic crashes damage it; zero armor
  ends the run.

## Non-goals
- No external assets, brands, tracks, music, or copied IP.
- No backend, leaderboard service, or network play.
- No build tooling; the game stays one HTML file.
- DevGate baseline is vendored read-only; project deltas go in the overlay.
