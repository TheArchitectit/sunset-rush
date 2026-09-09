# Sunset Rush

A pocket arcade racer in the spirit of early-2000s checkpoint racers: one self-contained HTML file, no dependencies, no assets, works offline.

**Play:** open `index.html` in any modern browser, or visit the GitHub Pages site for this repo.

## How to play

- Weave through traffic and hit each checkpoint before the clock runs out.
- Checkpoints add time and bonus points. Crashes cost speed and score.
- **Keyboard:** Left/Right arrows (or A/D) steer, Down arrow (or S / Space) brakes. Acceleration is automatic.
- **Touch:** hold the left or right side of the screen to steer; the center strip brakes. Multi-touch works (steer + brake).

## Features

- Pseudo-3D road renderer (curves, hills, rumble strips, roadside props, parallax sunset skyline) drawn entirely on canvas
- Synthesized sound with the Web Audio API: engine hum tied to speed, checkpoint jingle, crash noise. No audio files.
- Mobile friendly: responsive canvas, touch zones, safe-area aware HUD
- **Downloadable:** the Download button on the title screen saves the game as a single HTML file you can keep and play offline
- Retro finish: scanlines, vignette, synthwave palette

## Files

- `index.html` - the entire game (markup, styles, logic, sound)

No build step. No tracking. No external requests.
