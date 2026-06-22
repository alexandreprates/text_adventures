# Domain Core

- Domain code is under `lib/domain/` and should not depend on web transport details.
- Main aggregate: `TextAdventures::Game` in `lib/domain/game.rb`.
  - Holds player, current scene, random source, pending confirmations, dungeon, battle, pending loot, and active enemy position.
  - Routes parsed/known commands through scene and gameplay handlers.
  - Owns inventory item use/drop/equip behavior and game-over/help responses.
- `TextAdventures::Dungeon` in `lib/domain/dungeon.rb` owns procedural connected-block exploration:
  - Tracks level, revealed blocks, player/current block positions, enemies, dropped loot, descent, ascent, and random source.
  - Produces fixed 3x3 viewport state centered on the player block.
  - Runtime entity placement/rendering is separate from YAML tile definitions.
  - `P` exists only on level 1 and returns to town when stepped on after moving away.
  - `>` is the floor exit; stepping on it calls `advance_level!`, resets transient level state, and starts the player at the next level entrance.
  - `<` is the deeper-level ascent; stepping on it calls `retreat_level!`, resets transient level state, and moves one level closer to level 1.
  - Previous level layouts are not persisted when changing levels; this is an intentional current scope simplification.
- `TextAdventures::Scenes::Ruins` stays thin: after successful movement it reacts to portal/ascent/descent, then handles auto-loot and visible encounters.
- `TextAdventures::ContentCatalog` loads YAML content from `data/` and builds domain objects for items, creatures, loot profiles, shops, and dungeon blocks.
- Other domain classes model character, progression, inventory, item, spell, battle, creature, loot drop, response, and dungeon block values.
- Command parser is in `lib/commands/command_parser.rb`; it normalizes free-text commands into structured command objects before game handling.
- Preserve deterministic behavior by injecting/using the configured random source instead of global randomness when extending gameplay.