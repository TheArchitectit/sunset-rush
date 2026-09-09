# Delta: Level Terrain

## ADDED Requirements

<!-- id: sr-lvl-biomes -->
### Requirement: Biomes
The game SHALL define at least five biomes, each with a distinct palette,
roadside prop set, and weather particle effect.

#### Scenario: Distinct biomes
- **WHEN** the biome table is inspected
- **THEN** at least five entries exist and each defines palette, props, and weather

<!-- id: sr-lvl-progression -->
### Requirement: Level progression
Crossing a level's checkpoint gate SHALL advance to the next level, switch the
active biome, award a time bonus, and show a level banner.

#### Scenario: Advancing
- **WHEN** the player crosses the checkpoint gate distance
- **THEN** the level number increments, the biome changes, and time is added

<!-- id: sr-lvl-terrain-curves -->
### Requirement: Terrain profiles
Curve and hill profiles SHALL differ across biomes so the road geometry changes
per level.

#### Scenario: Different geometry
- **WHEN** tracks for two different biomes are generated with the same seed
- **THEN** their segment curve sequences differ

<!-- id: sr-lvl-grip -->
### Requirement: Surface grip
Biomes SHALL define a grip factor that modifies steering response and
centrifugal slide; the ice biome SHALL have the lowest grip.

#### Scenario: Ice is slippery
- **WHEN** steering on the Frozen Tundra biome
- **THEN** lateral response is weaker than on Sunset Coast for identical input

<!-- id: sr-lvl-weather -->
### Requirement: Weather effects
Each biome SHALL emit ambient weather particles (for example rain, snow,
embers, or neon streaks) matching its theme.

#### Scenario: Snow falls
- **WHEN** racing on the Frozen Tundra biome
- **THEN** snow particles are present in the effect system

<!-- id: sr-lvl-ramp -->
### Requirement: Difficulty ramp
Traffic density and mob aggression SHALL increase with level number.

#### Scenario: Later levels are harder
- **WHEN** comparing level 1 and level 4 parameters
- **THEN** level 4 has higher mob spawn rate and mob speed

<!-- id: sr-lvl-endless -->
### Requirement: Endless cycling
After the final biome, levels SHALL continue cycling through biomes with
increasing difficulty rather than ending the run.

#### Scenario: Cycle wrap
- **WHEN** the player clears the final biome's gate
- **THEN** the level increments and the biome index wraps to the first biome
