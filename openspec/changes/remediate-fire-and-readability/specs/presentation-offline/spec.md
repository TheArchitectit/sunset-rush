# Presentation and Offline Guarantees — remediation deltas

<!-- id: sr-pre-hud-legibility -->
### Requirement: HUD legibility
HUD text SHALL meet minimum legibility at a 390px-wide mobile viewport:
value text at least 13 CSS px, label text at least 10 CSS px, and the armor
bar at least 96 CSS px wide. HUD values SHALL use a solid text shadow or
backing plate so they stay readable over bright biome skies.

#### Scenario: Mobile HUD metrics
- **WHEN** the HUD is measured at a 390x844 viewport during a race
- **THEN** value text is at least 13px, labels at least 10px, and the armor
  bar at least 96px wide

<!-- id: sr-pre-onboarding -->
### Requirement: In-race onboarding hint
Each race SHALL show a transient hint strip naming the fire input, steering
input, and weapon-crate purpose for its first seconds; the hint SHALL dismiss
itself and SHALL NOT block input or cover the HUD.

#### Scenario: Hint appears and dismisses
- **WHEN** a race starts
- **THEN** the hint strip is visible and after its timeout it is gone

## MODIFIED Requirements

<!-- id: sr-pre-touch -->
### Requirement: Touch controls
Touch devices SHALL get left/right steering zones, a brake zone, and a fire
pad, with multi-touch support so steering and firing work together. Sliding
a finger between zones SHALL transfer steering by the finger's current
position without lifting. A press that starts on the fire pad SHALL remain
fire for that touch's lifetime. The touch overlay SHALL be visible only
during countdown and race states.

#### Scenario: Simultaneous steer and fire
- **WHEN** one finger holds a steering zone and another taps the fire pad
- **THEN** steering input and weapon fire both register

#### Scenario: Slide transfers steering
- **WHEN** a finger starts on the left zone and slides to the right zone
  without lifting
- **THEN** steering changes from left to right

#### Scenario: Overlay hidden on menus
- **WHEN** the title or game-over screen is shown
- **THEN** the touch overlay is not visible

<!-- id: sr-pre-download -->
### Requirement: Downloadable export
The title and game-over screens SHALL offer a button that downloads the
current game as a standalone HTML file. The exported file SHALL always boot
into the title screen with a clean UI, regardless of which screen the
download was triggered from.

#### Scenario: Export from game over boots clean
- **WHEN** the player activates the download button on the game-over screen
- **THEN** the saved document has the title screen visible and the game-over
  screen hidden

<!-- id: sr-pre-determinism -->
### Requirement: Seeded determinism
All gameplay randomness SHALL flow through the seeded gameplay RNG so a fixed
seed reproduces the same run; `Math.random` SHALL NOT be used. Purely visual
randomness (render shake, speed lines, flames, weather, explosion particles,
audio noise) SHALL flow through a separate seeded visual stream so rendering
at any frame rate cannot perturb gameplay state.

#### Scenario: Replay with rendering
- **WHEN** two runs use the same seed and identical scripted inputs and one
  interleaves render calls between ticks
- **THEN** their gameplay state sequences still match
