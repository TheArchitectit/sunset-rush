# Sunset Rush — Project Context

## What this is
Sunset Rush is a single-file, offline-capable arcade racing game for desktop and
mobile browsers. One `index.html` at the repo root is the entire product: all
rendering is canvas-drawn, all audio is synthesized with Web Audio, and there are
no external assets, fonts, or network calls. GitHub Pages serves the file as the
live game.

## Hard constraints (every change must preserve)
- Single self-contained `index.html`; no build step; no dependencies.
- Must run from `file://` and fully offline once loaded.
- No external URLs referenced by the game file (offline guarantee).
- Mobile-friendly: touch controls, small screens, DPR-aware canvas, 60fps budget.
- Deterministic gameplay: all gameplay randomness flows through the seeded RNG.
- All audio synthesized via Web Audio; no audio files.

## Conventions
- OpenSpec changes live in `openspec/changes/<change-id>/` with proposal, design,
  tasks, and spec deltas; implemented capabilities are archived to
  `openspec/specs/<capability>/spec.md`.
- DevGate runs from `.devgate/`; project-specific rules live in the `.guardrails/`
  overlay only — never edit the DevGate baseline.
- Every archived requirement id needs a `// spec: <id>` marker in a scanned source
  file (tests count); `spec_traceability.py` runs in blocking mode.
