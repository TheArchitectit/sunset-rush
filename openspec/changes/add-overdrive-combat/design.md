# Design: add-overdrive-combat

## Architecture
Single-file canvas game, same pseudo-3D segment renderer as v1 (road segments
projected against a camera), extended with five cooperating systems driven by a
seeded RNG (mulberry32). Fixed clamp on `dt`; all gameplay randomness calls
`rng()` so runs are replayable.

```
update(dt)
  ├─ player physics (steer/brake/nitro, grip per biome, centrifugal)
  ├─ traffic (v1 behavior, kept)
  ├─ mobs (spawn → swarm-seek → lunge → despawn)
  ├─ projectiles (blaster/homing/mine/shockwave resolution)
  ├─ pickups (weapon crates, power-up crates, magnet attraction)
  ├─ effects (particles, shake, weather, speed lines)
  └─ level progression (checkpoint gate → biome swap → ramp)
```

## Key decisions
- **Seeded RNG everywhere.** Particles and weather use the same stream; this
  keeps replays deterministic and satisfies sr-pre-determinism. `Math.random`
  is banned by overlay rule PREVENT-SR-003.
- **Combat in road space.** Mobs, mines, and projectiles live in (z, x) road
  coordinates and render through the same projection as cars, so collision is a
  cheap segment-local overlap test.
- **Mobs swarm, not drive.** Each mob steers toward the player's lateral
  position with per-mob wiggle and matches z toward the player; contact is one
  lunge = one armor hit, then the mob despawns. HP 1–2 by type.
- **Biome table.** One `BIOMES` array carries palette, prop set, weather
  emitter, curve/hill profile, and grip; level progression just indexes it, so
  adding a biome is data, not code.
- **Armor, not lives.** One pool (100). Mob ram −10, traffic crash −25, shield
  negates. Zero armor = wrecked (game over), distinct from timer expiry.
- **Overlay, not fork.** `.devgate/` is the untouched upstream baseline;
  project rules (offline guarantee, no-eval, seeded-RNG, no audio assets) live
  in `.guardrails/prevention-rules/pattern-rules.json` with `PREVENT-SR-*` ids.
- **Testability hook.** The IIFE exposes `window.__game` (state, actions,
  biome table) so `node --test` can load the file with DOM stubs and drive the
  real game loop headlessly.

## Risks
- Frame budget on low-end mobile → hard caps on particles, mobs, projectiles;
  weather count scales with device width.
- Touch ergonomics with a fire control → dedicated fire pad; steering zones
  unchanged from v1.
- Single file growing large → acceptable; file-size gates cover scanned source
  extensions and tests stay under the 600-line hard limit.
