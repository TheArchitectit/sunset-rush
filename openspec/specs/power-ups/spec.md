# Power-ups

Status: Implemented via change `add-overdrive-combat`.

## Requirements

<!-- id: sr-pow-crates -->
### Requirement: Power-up crates
The game SHALL spawn power-up crates on the road, visually distinct from weapon
crates. Driving through one SHALL apply its effect immediately.

#### Scenario: Distinct pickup
- **WHEN** the player overlaps a power-up crate
- **THEN** its effect activates and a pickup sound plays

<!-- id: sr-pow-nitro -->
### Requirement: Nitro boost
Nitro SHALL temporarily raise the player's top speed and acceleration and emit
flame particles while active.

#### Scenario: Boosted speed
- **WHEN** nitro is active
- **THEN** the effective top speed is greater than the biome base top speed
- **AND** it returns to base when nitro expires

<!-- id: sr-pow-shield -->
### Requirement: Shield
The shield SHALL make the player invulnerable to mob rams and traffic crashes
for its duration, rendering a visible bubble.

#### Scenario: Shield blocks crash
- **WHEN** the player hits a traffic car while shielded
- **THEN** armor is unchanged

<!-- id: sr-pow-repair -->
### Requirement: Repair
Repair SHALL restore armor, capped at maximum armor.

#### Scenario: Repair cap
- **WHEN** repair is picked up at 95 armor
- **THEN** armor becomes 100, not above

<!-- id: sr-pow-magnet -->
### Requirement: Magnet
While magnet is active, pickups within its radius SHALL move toward the player
and be collectible on contact.

#### Scenario: Attraction
- **WHEN** a crate is within magnet radius but offset from the player
- **THEN** its lateral distance to the player decreases over successive frames

<!-- id: sr-pow-clock -->
### Requirement: Clock pickup
A clock pickup SHALL add time to the race timer.

#### Scenario: Extra time
- **WHEN** the player collects a clock pickup
- **THEN** the remaining race time increases by the clock bonus

<!-- id: sr-pow-stacking -->
### Requirement: Stacking
Re-collecting an active timed power-up SHALL refresh its duration instead of
compounding its effect.

#### Scenario: Refresh, not compound
- **WHEN** nitro is picked up while already active
- **THEN** the nitro timer is reset to full and top speed is unchanged from one dose
