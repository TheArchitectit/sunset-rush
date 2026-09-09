# Swarm Mobs

Status: Implemented via change `add-overdrive-combat`.

## Requirements

<!-- id: sr-mob-spawn -->
### Requirement: Mob spawning
During a race the game SHALL spawn hostile mobs ahead of the player at a rate
that increases with level. Live mobs SHALL NOT exceed the swarm cap.

#### Scenario: Cap enforcement
- **WHEN** the swarm cap is reached
- **THEN** no additional mobs spawn until one dies or despawns

<!-- id: sr-mob-swarm -->
### Requirement: Swarm behavior
Each mob SHALL steer toward the player's lateral position and close distance
along the road, with per-mob wiggle, producing a converging swarm.

#### Scenario: Convergence
- **WHEN** a mob is ahead of the player and off to one side
- **THEN** over successive frames its lateral distance to the player decreases

<!-- id: sr-mob-attack -->
### Requirement: Ram attack
A mob that reaches the player SHALL deal armor damage once, trigger impact
feedback, and despawn. A shielded player SHALL take no armor damage.

#### Scenario: Unguarded ram
- **WHEN** a mob makes contact with an unshielded player
- **THEN** armor decreases by the mob's damage and the mob despawns

#### Scenario: Shielded ram
- **WHEN** a mob makes contact while the shield is active
- **THEN** armor is unchanged and the mob still despawns

<!-- id: sr-mob-hp -->
### Requirement: Mob health and bounty
Mobs SHALL have type-based HP and die at zero HP, awarding their score bounty
and playing a death effect.

#### Scenario: Bounty
- **WHEN** a mob dies from weapon damage
- **THEN** the score increases by that mob type's bounty

<!-- id: sr-mob-cleanup -->
### Requirement: Mob cleanup
Mobs that fall behind the camera or leave the road region SHALL despawn without
awarding score or dealing damage.

#### Scenario: Outrun mob
- **WHEN** a mob falls behind the camera's near plane
- **THEN** it is removed from the live swarm

<!-- id: sr-mob-difficulty -->
### Requirement: Difficulty ramp
Mob spawn rate and movement speed SHALL scale up with level number.

#### Scenario: Level scaling
- **WHEN** level 4 is active
- **THEN** the spawn interval is shorter and mob base speed is higher than at level 1
