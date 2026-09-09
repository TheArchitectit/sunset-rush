# Combat Weapons — remediation deltas

<!-- id: sr-cw-default-weapon -->
### Requirement: Default weapon readiness
Every race SHALL start with the blaster equipped and ready, with unlimited
baseline ammo. Picking up a weapon crate SHALL replace the blaster with the
crate weapon and its finite ammo. When a finite weapon's ammo reaches zero,
the blaster SHALL be re-equipped automatically with unlimited ammo. A state
where the player has no weapon SHALL NOT occur during a race.

#### Scenario: Armed from the first second
- **WHEN** a race begins
- **THEN** the equipped weapon is the blaster and a fire input within the
  first second spawns a projectile

#### Scenario: Special weapon exhausts back to blaster
- **WHEN** the last ammo of a crate weapon is spent
- **THEN** the equipped weapon becomes the blaster with unlimited ammo and
  the next fire input fires the blaster

<!-- id: sr-cw-fire-edge -->
### Requirement: Edge-captured fire input
A fire press SHALL be captured on the key or touch down-edge, so a tap whose
release happens before the next frame still fires exactly one shot. Holding
the fire input SHALL continue to auto-fire at the weapon's cooldown rate.
Keyboard auto-repeat SHALL NOT queue extra shots beyond the held-input rate.

#### Scenario: Sub-frame tap fires
- **WHEN** the player taps fire and releases within one frame at race speed
- **THEN** exactly one projectile spawns

## MODIFIED Requirements

<!-- id: sr-cw-dry-fire -->
### Requirement: Dry fire
Firing during cooldown or outside the race state SHALL have no gameplay
effect and SHALL NOT produce negative ammo. A swallowed fire press SHALL
produce visible feedback (weapon box flash) so the player knows the input
was received.

#### Scenario: Cooldown press is acknowledged
- **WHEN** the player presses fire while the weapon is on cooldown
- **THEN** no projectile spawns and the weapon HUD element flashes

<!-- id: sr-cw-inputs -->
### Requirement: Fire inputs
The player SHALL be able to fire with Space or Z on keyboard and with a
dedicated fire pad on touch devices. The HUD SHALL show the equipped weapon
and remaining ammo at all times, including an unlimited marker for the
baseline blaster; the HUD SHALL never show an empty or placeholder weapon
state during a race.

#### Scenario: Touch fire
- **WHEN** a touch player taps the fire pad with a weapon equipped and ammo
- **THEN** the weapon fires
