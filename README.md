# Sunset Rush: Overdrive

A single-file combat arcade racer for desktop and mobile browsers, in the spirit
of late-90s/early-2000s console arcade racers. One `index.html` is the whole
game: canvas-drawn pseudo-3D, synthesized Web Audio sound, no assets, no
dependencies, works offline.

**Play:** https://thearchitectit.github.io/sunset-rush/

## The game

- **Five biomes** — Sunset Coast, Neon City, Red Desert, Frozen Tundra (low
  grip), Volcano — with distinct palettes, roadside props, weather particles,
  and curve/hill profiles. Clear a level's checkpoint gates to advance.
- **Weapons** — blaster, homing missiles, mines, shockwave. Pick up weapon
  crates (amber) to equip; ammo is limited.
- **Swarming mobs** — skitters and brutes spawn ahead, steer toward you, and
  ram for armor damage. Shoot them first; they get faster every level.
- **Power-ups** — nitro, shield, repair, magnet, clock crates (cyan/green).
- **Armor pool** — mob rams and traffic crashes cost armor; zero armor wrecks
  the run. The checkpoint timer still applies.
- **Effects** — particles, screen shake, speed lines, muzzle flash, biome
  weather, synthesized engine/weapon/explosion/pickup sounds (M mutes).

## Controls

| Input | Action |
| --- | --- |
| Arrows or A/D | Steer |
| Down or S | Brake |
| Space or Z | Fire (blaster is always ready; crates swap in specials) |
| M | Mute |
| Touch: screen sides / center strip / FIRE pad | Steer / brake / fire |

You start every race with the blaster (unlimited ammo). Amber **W** crates
swap in a special weapon; when its ammo runs out the blaster returns.

The title and game-over screens include a **Download this game (HTML)** button:
the saved file runs from disk with no network.

## Development

Spec-first with OpenSpec; gated with
[DevGate](https://github.com/TheArchitectit/DevGate-Agentic-Framework) (vendored
at `.devgate/`, project deltas in the `.guardrails/` overlay — the baseline is
never edited).

- `openspec/changes/add-overdrive-combat/` — proposal, design, tasks, spec deltas
- `openspec/specs/` — archived capability specs (requirement ids are traced to
  code markers by the traceability gate)

Run the gates locally:

```bash
node .devgate/scripts/guardrails-scan.mjs        # pattern rules (baseline + overlay)
node .devgate/scripts/semantic-scan.mjs          # AST scan (needs: npm i --no-save typescript@5)
python3 .devgate/scripts/regression_check.py --staged --pre-commit
node scripts/verify-standalone.mjs               # project gate: offline/single-file invariants
node .devgate/scripts/run-tests.mjs              # headless game-logic tests (node --test)
node tests/e2e-chrome.mjs                        # trusted-input E2E: real keys/touch via CDP + screenshots
python3 .devgate/scripts/spec_traceability.py    # blocking: every requirement id needs a marker
```

`tests/game.test.js` loads the real game script into a stubbed DOM and drives
the actual game loop: weapons, mobs, power-ups, biomes, determinism, and
regression guards for every entry in `.guardrails/failure-registry.jsonl`.
