# Tasks: mobility-spectacle-expansion

## 1. Audit and specification
- [x] 1.1 Playwright mobility matrix written and run against main pre-fix
      (13/14 scenarios fail; docs/gap-analysis-2026-09-09.md)
- [x] 1.2 Sourced 2026 retro-racer gap analysis with cited coverage
- [x] 1.3 Proposal/design/tasks/spec deltas (this change)

## 2. Viewport containment (F1-F4)
- [x] 2.1 Camera tracks playerX fully; car drawn at screen center + lean;
      road guaranteed under car at all viewports
- [x] 2.2 playerX soft wall with rumble feedback instead of hard clamp drift
- [x] 2.3 Prop size cap relative to short viewport axis + near-camera fade
- [x] 2.4 Fire pad vs car collision resolved (car stays clear of pad rect)

## 3. Brake, skids, ramps, backflips (F5-F7)
- [x] 3.1 Brake lights + progressive decel + screech (sr-pre-effects modified)
- [x] 3.2 Brake strip covers full input zone (sr-pre-touch modified)
- [x] 3.3 Skid-out state: trigger, skid marks, smoke, scrub, recovery
      (sr-vd-skidout)
- [x] 3.4 Ramps, airborne rotation, backflip scoring, graded landings
      (sr-vd-ramp, sr-vd-backflip)

## 4. Aliens and spectacle
- [x] 4.1 Layered explosion system, scaled per victim (sr-pre-effects)
- [x] 4.2 Saucer enemy: hover, strafe, plasma bolts, telegraphs (sr-ai-saucer)
- [x] 4.3 Alien swarm escalation waves at checkpoints (sr-ai-wave)

## 5. Validation
- [x] 5.1 Mobility matrix green on all viewports post-fix
- [x] 5.2 Feature tests: skid, backflip, explosion layers, saucer behavior
- [x] 5.3 CI: run mobility matrix in the gates workflow
- [x] 5.4 Unit tests for new dynamics; failure-registry entries for F1-F7

## 6. Release
- [ ] 6.1 All project + DevGate gates green on the PR and merged main
- [ ] 6.2 Visual verification: desktop, mobile portrait/landscape, live Pages,
      offline export
