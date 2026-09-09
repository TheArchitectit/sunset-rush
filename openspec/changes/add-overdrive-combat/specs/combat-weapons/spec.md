# Delta: Combat Weapons

## ADDED Requirements

<!-- id: sr-cw-weapon-crates -->
### Requirement: Weapon crates
The game SHALL spawn weapon pickup crates on the road during a race. Driving
through a crate SHALL equip its weapon and set ammo to that weapon's crate
amount. Weapon crates SHALL be visually distinct from power-up crates.

#### Scenario: Picking up a blaster crate
- **WHEN** the player overlaps a blaster crate
- **THEN** the equipped weapon becomes blaster and ammo becomes its crate amount
- **AND** a pickup sound plays

<!-- id: sr-cw-blaster -->
### Requirement: Blaster
The blaster SHALL fire a straight projectile in the player's current lane on a
fire input, costing 1 ammo, with a short cooldown between shots.

#### Scenario: Fire with ammo
- **WHEN** the player fires the blaster with ammo remaining
- **THEN** a projectile spawns at the player position and ammo decreases by 1

#### Scenario: Fire on cooldown
- **WHEN** the player fires again before the cooldown elapses
- **THEN** no second projectile spawns

<!-- id: sr-cw-homing -->
### Requirement: Homing missiles
Homing missiles SHALL lock the nearest live mob ahead of the player and steer
toward it in road space until impact or expiry.

#### Scenario: Missile tracks a mob
- **WHEN** a homing missile is in flight and a mob is ahead within lock range
- **THEN** the missile's lateral offset converges toward the mob's offset

<!-- id: sr-cw-mine -->
### Requirement: Mines
The mine weapon SHALL drop a mine behind the player. A mine SHALL detonate when
a mob touches it, damaging every mob in a small radius.

#### Scenario: Mob triggers a mine
- **WHEN** a mob overlaps an armed mine
- **THEN** the mine detonates and that mob is destroyed

<!-- id: sr-cw-shockwave -->
### Requirement: Shockwave
The shockwave SHALL destroy all mobs within a fixed radius of the player on
fire, consuming 1 ammo.

#### Scenario: Clearing a swarm
- **WHEN** the player fires the shockwave with three mobs inside the radius
- **THEN** all three mobs are destroyed and ammo decreases by 1

<!-- id: sr-cw-hit-effects -->
### Requirement: Hit resolution
A projectile or blast that hits a mob SHALL reduce its HP; at zero HP the mob
SHALL die with an explosion effect and award score. Blaster hits on traffic
cars SHALL knock the car and award no score.

#### Scenario: Two-hit mob
- **WHEN** a 2-HP mob takes one blaster hit
- **THEN** it survives with 1 HP
- **AND** a second hit destroys it and adds its score bounty

<!-- id: sr-cw-inputs -->
### Requirement: Fire inputs
The player SHALL be able to fire with Space or Z on keyboard and with a
dedicated fire pad on touch devices. The HUD SHALL show the equipped weapon and
remaining ammo.

#### Scenario: Touch fire
- **WHEN** a touch player taps the fire pad with a weapon equipped and ammo
- **THEN** the weapon fires

<!-- id: sr-cw-dry-fire -->
### Requirement: Dry fire
Firing with no weapon equipped or zero ammo SHALL have no gameplay effect and
SHALL NOT produce negative ammo.

#### Scenario: Empty trigger
- **WHEN** the player fires with zero ammo
- **THEN** no projectile spawns and ammo stays 0
