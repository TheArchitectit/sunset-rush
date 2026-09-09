# Tasks: remediate-fire-and-readability

## 1. Audit and specification
- [x] 1.1 Full audit with live real-input verification (docs/audit-2026-09-09.md)
- [x] 1.2 Author remediation proposal, design, tasks, and spec deltas

## 2. Combat input and weapons
- [ ] 2.1 Default blaster with unlimited ammo at race start; revert on special
      ammo exhaustion (sr-cw-default-weapon)
- [ ] 2.2 Edge-captured fire input for keyboard and fire pad
      (sr-cw-fire-edge)
- [ ] 2.3 Dry-fire / cooldown feedback and meaningful weapon HUD
      (sr-cw-dry-fire modified, sr-cw-inputs modified)

## 3. Touch, presentation, offline
- [ ] 3.1 Touch steering transfers by finger position while sliding;
      fire-pad pointers stay fire (sr-pre-touch modified)
- [ ] 3.2 Touch overlay only during countdown/race
- [ ] 3.3 HUD legibility minimums + in-race hint strip (sr-pre-hud-legibility,
      sr-pre-onboarding)
- [ ] 3.4 Clean-boot download export (sr-pre-download modified)
- [ ] 3.5 Two-stream RNG: visual randomness off the gameplay stream
      (sr-pre-determinism modified)
- [ ] 3.6 Frame-loop hygiene: single updateHUD call site, countdown traffic,
      stale-input cleanup, lastBeep reset, dead code removal

## 4. Validation that would have caught the audit findings
- [ ] 4.1 tests/e2e-chrome.mjs: trusted-input keyboard/touch E2E over CDP,
      export integrity, overlay visibility, HUD computed-style minimums,
      desktop/mobile screenshots in tests/artifacts/
- [ ] 4.2 Unit tests: default weapon, ammo revert, two-stream determinism
      with interleaved renders, updateHUD call-site guard, countdown traffic
- [ ] 4.3 Failure-registry entries FAIL-2026090904..08 with regression
      patterns
- [ ] 4.4 CI: install typescript@5 for semantic scan; tag v2.0.0 as
      regression base; run e2e suite

## 5. Release
- [ ] 5.1 All gates green locally and in CI on the PR
- [ ] 5.2 Visual verification desktop + mobile + file:// + live Pages after
      merge
- [ ] 5.3 Archive change to openspec/specs; README update
