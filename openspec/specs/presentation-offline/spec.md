# Presentation and Offline Guarantees

Status: Implemented via change `add-overdrive-combat`.

## Requirements

<!-- id: sr-pre-single-file -->
### Requirement: Single-file offline game
The game SHALL remain one self-contained `index.html` with no external asset,
font, script, stylesheet, or network references, and SHALL run from `file://`.

#### Scenario: Offline load
- **WHEN** the file is opened locally with the network disabled
- **THEN** the title screen renders and a race can start

<!-- id: sr-pre-download -->
### Requirement: Downloadable export
The title and game-over screens SHALL offer a button that downloads the current
game as a standalone HTML file.

#### Scenario: Export
- **WHEN** the player activates the download button
- **THEN** a blob of the document source is saved as an .html file

<!-- id: sr-pre-touch -->
### Requirement: Touch controls
Touch devices SHALL get left/right steering zones, a brake zone, and a fire
pad, with multi-touch support so steering and firing work together.

#### Scenario: Simultaneous steer and fire
- **WHEN** one finger holds a steering zone and another taps the fire pad
- **THEN** steering input and weapon fire both register

<!-- id: sr-pre-keyboard -->
### Requirement: Keyboard controls
Arrow keys or A/D SHALL steer, Down or S SHALL brake, and Space or Z SHALL
fire the equipped weapon.

#### Scenario: Key mapping
- **WHEN** the player presses Space with a weapon equipped
- **THEN** the weapon fires

<!-- id: sr-pre-audio -->
### Requirement: Synthesized audio
All game audio SHALL be synthesized with Web Audio at runtime. The set SHALL
include engine, weapon fire, explosion, mob, pickup, checkpoint, and level-up
sounds, with a mute toggle. No audio files SHALL be referenced.

#### Scenario: No audio assets
- **WHEN** the game file is scanned for audio element or Audio constructor usage
- **THEN** none are found

<!-- id: sr-pre-effects -->
### Requirement: Combat effects
Weapon fire, mob deaths, crashes, nitro, and level transitions SHALL produce
visual feedback: particles, screen shake, speed lines at high speed, and muzzle
flash.

#### Scenario: Explosion particles
- **WHEN** a mob dies
- **THEN** explosion particles are emitted and screen shake is applied

<!-- id: sr-pre-hud -->
### Requirement: HUD
The HUD SHALL show score, time, speed, armor, current level/biome, and the
equipped weapon with ammo.

#### Scenario: Armor visible
- **WHEN** the player takes damage
- **THEN** the HUD armor value reflects the new armor on the next frame

<!-- id: sr-pre-perf -->
### Requirement: Frame budget
Particles, mobs, and projectiles SHALL be hard-capped so frame cost stays
within a mobile 60fps budget.

#### Scenario: Caps enforced
- **WHEN** heavy combat generates effects continuously
- **THEN** live particle count never exceeds the particle cap

<!-- id: sr-pre-determinism -->
### Requirement: Seeded determinism
All gameplay randomness SHALL flow through the seeded RNG so a fixed seed
reproduces the same run; `Math.random` SHALL NOT be used.

#### Scenario: Replay
- **WHEN** two runs use the same seed and identical scripted inputs
- **THEN** their score and player state sequences match
