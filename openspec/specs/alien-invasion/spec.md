# Alien Invasion

Status: Implemented via change `mobility-spectacle-expansion`.

## Requirements

<!-- id: sr-ai-saucer -->
### Requirement: Alien saucers
Hovering alien saucers with an original silhouette (dome, rim lights, beam)
SHALL strafe above the road, telegraph, and fire slow dodgeable plasma bolts
at the player's lane. Bolts SHALL cost armor on hit and be blocked by shield.
Saucers SHALL be destructible and die in a large layered explosion.

#### Scenario: Saucer attack
- **WHEN** a saucer is active in range
- **THEN** it telegraphs and fires a plasma bolt the player can dodge or shoot

#### Scenario: Saucer destroyed
- **WHEN** a saucer's HP reaches zero from player weapons
- **THEN** a large layered explosion plays and the bounty is scored

<!-- id: sr-ai-wave -->
### Requirement: Alien swarm waves
Checkpoint gates from level 2 onward SHALL trigger a scripted alien swarm
wave (skitters plus saucers scaled by level) with an on-screen banner.

#### Scenario: Gate wave
- **WHEN** the player crosses a checkpoint gate on level 2 or higher
- **THEN** an ALIEN SWARM banner shows and a wave of aliens spawns ahead
