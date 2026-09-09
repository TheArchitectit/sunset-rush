# Presentation and Offline Guarantees (delta — modified requirements)

## Requirements

<!-- id: sr-pre-containment -->
### Requirement: Viewport containment
The road under the player, the player car, the HUD, and the touch controls
SHALL remain fully inside the viewport at all times: every viewport size and
orientation, steering held at either extreme, braking, skids, jumps, and
recovery. The camera SHALL track the player fully and the car SHALL render at
screen center with lean only. Roadside props SHALL cap size relative to the
viewport and fade near the camera. The fire pad SHALL never overlap the
player car.

#### Scenario: Hard right lock on a 320px phone
- **WHEN** steering is held fully right for three seconds on a 320x568 viewport
- **THEN** the player car and the road beneath it remain fully visible and the car stays over road pixels

#### Scenario: Landscape control collision
- **WHEN** the player steers fully right in landscape orientation
- **THEN** the player car does not intersect the fire pad rectangle

<!-- id: sr-pre-touch -->
### Requirement: Touch controls (modified)
Touch devices SHALL get left/right steering zones, a brake zone, and a fire
pad, with multi-touch support so steering and firing work together. The
visible brake strip SHALL cover the full brake input zone so no invisible
input region exists.

#### Scenario: Simultaneous steer and fire
- **WHEN** one finger holds a steering zone and another taps the fire pad
- **THEN** steering input and weapon fire both register

#### Scenario: Brake zone honesty
- **WHEN** the player touches anywhere the game treats as brake input
- **THEN** a visible brake control is under the touch point

<!-- id: sr-pre-effects -->
### Requirement: Combat effects (modified)
Weapon fire, mob deaths, crashes, nitro, and level transitions SHALL produce
visual feedback: particles, screen shake, speed lines at high speed, muzzle
flash, and layered explosions (flash, fireball, debris, smoke, shockwave
ring) scaled per victim. The camera SHALL roll subtly with steering and
skids. Braking SHALL show brake lights and skid marks.

#### Scenario: Layered explosion
- **WHEN** a mob dies
- **THEN** a flash, fireball, debris, smoke, and an expanding ring play with screen shake

#### Scenario: Camera roll
- **WHEN** the player steers or skids
- **THEN** the view rolls subtly in the steering direction and settles when straight
