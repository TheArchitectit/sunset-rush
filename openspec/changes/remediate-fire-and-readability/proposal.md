# Proposal: remediate-fire-and-readability

## Why
The 2026-09-09 full audit (docs/audit-2026-09-09.md), triggered by the user
report "the firing doesn't work and the game doesn't say on screen very well"
on the live build, confirmed three player-facing defects (silent inert fire
with no weapon, touch slide-steering that never transfers zones, illegible and
uninformative HUD), a red CI gates workflow on main since the Overdrive merge,
a latent regression-gate failure, an impure download export, frame-rate-coupled
determinism, and a frame-polled fire input that can drop fast taps. Every
archived requirement passed its headless test while the game failed the
player: the specs and validation had blind spots.

## What changes
- `combat-weapons`: the player now starts every race armed (default blaster
  with unlimited ammo); special weapons remain limited-ammo crate pickups and
  the blaster returns when their ammo runs out. Fire input becomes
  edge-captured so taps shorter than a frame still fire. Dry fire gains
  feedback. The HUD weapon box always says something meaningful.
- `presentation-offline`: touch steering transfers by finger position while
  sliding; the touch overlay shows only during play; HUD legibility minimums
  become normative; an in-race hint strip teaches controls; the download
  export always boots to the title screen; visual randomness moves to a
  separate stream so rendering cannot perturb gameplay determinism; HUD
  updates once per frame; traffic no longer freezes during the countdown.
- Validation: new zero-dependency CDP end-to-end suite driving real keyboard
  and touch input, screenshot capture, and computed-style legibility checks;
  new unit regression tests; failure-registry entries for every confirmed
  defect; CI fixed (semantic-scan dependency installed, regression gate gets a
  tag base) and the e2e suite runs in CI.

## Non-goals
- No new weapons, mobs, biomes, or power-ups; no balance redesign beyond the
  default-blaster readiness change.
- No external dependencies in the game file; the e2e suite uses only Node
  stdlib and a system Chrome.
- DevGate baseline stays untouched; project deltas stay in `.guardrails/`.
