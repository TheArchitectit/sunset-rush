# Tasks: add-overdrive-combat

## 1. Specification and gating setup
- [x] 1.1 Author proposal, design, tasks, and capability spec deltas
- [x] 1.2 Vendor DevGate baseline at `.devgate/` (unmodified upstream)
- [x] 1.3 Add project `.guardrails/` overlay rules (PREVENT-SR-*)
- [x] 1.4 Seed project failure registry from v1 bug history
- [x] 1.5 Add openspec gate-config (blocking traceability)

## 2. Implementation
- [x] 2.1 Seeded RNG + refactor v1 core onto it
- [x] 2.2 Armor pool, damage, wrecked game-over path
- [x] 2.3 Mob system: spawn, swarm, lunge, HP, death, ramp
- [x] 2.4 Weapons: blaster, homing, mine, shockwave; crates and ammo
- [x] 2.5 Power-ups: nitro, shield, repair, magnet, clock
- [x] 2.6 Biomes: palettes, props, weather, curves/hills, grip
- [x] 2.7 Effects: particles, shake, speed lines, muzzle flash, level flash
- [x] 2.8 Audio: weapon/mob/pickup/level SFX, low-armor warning, mute
- [x] 2.9 HUD + touch fire pad + controls help
- [x] 2.10 README update

## 3. Verification
- [x] 3.1 Headless node tests for each capability (tests/game.test.js)
- [x] 3.2 DevGate gates: guardrails-scan, semantic-scan, regression_check,
      run-tests, spec_traceability (blocking), silent-success, schema-health
- [x] 3.3 Headless Chrome renders desktop + mobile portrait
- [x] 3.4 Live browser interaction test on the Pages URL
- [x] 3.5 Offline test from file:// and downloaded export
- [x] 3.6 Merge only after all gates pass; publish via GitHub Pages
