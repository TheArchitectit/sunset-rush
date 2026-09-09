# Vehicle Dynamics

Status: Implemented via change `mobility-spectacle-expansion`.

## Requirements

<!-- id: sr-vd-brake-feedback -->
### Requirement: Brake feedback
Braking SHALL progressively decelerate the car, render red brake lights at
the car rear while the brake is held, and play a synthesized screech while
skidding. Braking SHALL work identically from keyboard (Down/S) and the touch
brake strip.

#### Scenario: Brake lights while braking
- **WHEN** the player holds the brake at speed
- **THEN** red brake-light pixels render at the rear of the player car and speed decreases progressively

<!-- id: sr-vd-skidout -->
### Requirement: Skid-out
When lateral demand or brake-at-speed exceeds a grip-scaled threshold, the car
SHALL enter a skid: steering authority drops, speed scrubs, dark skid marks
persist on the road briefly, and rear smoke particles emit. The player SHALL
recover by easing steering/brake below the threshold. Low-grip biomes skid at
lower demand.

#### Scenario: Hard steer at top speed on tundra
- **WHEN** the player holds full steering at top speed on a low-grip biome
- **THEN** the car enters skid state, skid marks render, and speed decreases

#### Scenario: Recovery
- **WHEN** the player releases steering and brake during a skid
- **THEN** the skid ends and full steering authority returns

<!-- id: sr-vd-ramp -->
### Requirement: Ramps and air time
Tracks SHALL include visible chevron ramps. Driving over a ramp above a
minimum speed SHALL launch the car airborne with gravity and hang time;
airborne cars take no off-road penalty and cannot be rammed.

#### Scenario: Ramp launch
- **WHEN** the player drives over a ramp above the launch speed
- **THEN** the car becomes airborne and returns to the road under gravity

<!-- id: sr-vd-backflip -->
### Requirement: Backflips and landing grades
While airborne, steering SHALL rotate the car. Each full rotation SHALL count
as a backflip. Landings SHALL be graded: near-flat rotation lands clean with a
banner and score bonus; otherwise the landing is hard and costs armor.

#### Scenario: Clean backflip
- **WHEN** the player rotates a full 360 degrees in the air and lands near-flat
- **THEN** a BACKFLIP banner shows and score increases

#### Scenario: Hard landing
- **WHEN** the player lands with rotation far from flat
- **THEN** armor decreases and speed is cut
