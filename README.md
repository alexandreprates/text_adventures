# Text Adventures

Text Adventures is a terminal text RPG written in Ruby. The current game is a
playable command-line adventure with a town hub, shops, dungeon exploration,
visible enemies, spatial loot, spells, equipment, and use-based character
progression inspired by Dungeon Siege.

The implementation is intentionally data-driven where it matters: items, shops,
creatures, and dungeon blocks live in YAML files under `data/`.

## Current Status

The terminal game is playable through `bin/text_adventures`.

Implemented systems include:

- Contextual command loop with scene prompts such as `Town >` and `Ruins L1 >`.
- Optional game input mode with WASD-style shortcuts.
- Town hub with Tavern, Aluriel's Priest, Blacksmith, Armorsmith, and Ruins.
- Direct travel between town destinations when no battle blocks the player.
- Tavern rest flow that fully restores player health.
- Priest healing, cure services, and spell tomes.
- Merchant buy/sell flows with confirmation and grouped stock.
- Inventory, equipment, item use, and item dropping.
- YAML-driven weapons, armor, potions, tomes, shops, creatures, and dungeon blocks.
- 15 weapons across swords, spears/lances, and daggers.
- 15 armors across light, medium, and heavy armor classes.
- 50 high-fantasy dungeon enemies with attacks, loot, status effects, and XP rewards.
- Dungeon generation by connected blocks.
- Fixed 3x3 dungeon viewport centered on the player's current block.
- Visible dungeon enemies rendered as `E`.
- Dropped map loot rendered as `@`.
- Turn-based combat with attacks, spells, poison, freeze, healing, cure, critical hits, and game-over handling.
- Dungeon Siege-style progression where skills improve based on weapons and spells used in battle.
- End-to-end binary specs for the main terminal flows.

Not implemented yet:

- Browser play.
- URL-based saved sessions.
- Persistent save/load.
- A production server executable.

## Requirements

- Ruby
- Bundler

Install dependencies with:

```sh
bundle config set --local path vendor/bundle
bundle install
```

The checked-in `Gemfile.lock` keeps installs reproducible. Local Bundler
artifacts are ignored through `.bundle/` and `vendor/bundle/`.

## Running The Game

```sh
bin/text_adventures
```

Use `quit` or `exit` to leave the game.

For deterministic dungeon behavior during manual testing, set a random seed:

```sh
TEXT_ADVENTURES_RANDOM_SEED=0 bin/text_adventures
```

To try the fixed-width terminal screen UI, enable screen rendering:

```sh
TEXT_ADVENTURES_SCREEN=1 bin/text_adventures
```

Both flags can be combined for repeatable screen UI exploration:

```sh
TEXT_ADVENTURES_SCREEN=1 TEXT_ADVENTURES_RANDOM_SEED=0 bin/text_adventures
```

Optional ANSI color can be enabled for the screen UI:

```sh
TEXT_ADVENTURES_SCREEN=1 TEXT_ADVENTURES_COLOR=1 bin/text_adventures
```

## Running Tests

```sh
bundle exec rake
```

You can also run RSpec directly:

```sh
bundle exec rspec
```

## Basic Commands

Global commands:

```text
help            show contextual help
look            inspect the current place
inventory       show carried and equipped items
spellbook       show known spells
level           show overall character level and XP
skills          show progression by skill track
equip <item>    equip a carried weapon or armor
use <item>      use a potion or tome
drop <item>     drop a carried item
game            enable game input mode
text            return to text command mode
commands        return to text command mode
quit            exit the game
exit            exit the game
```

Town and shop commands:

```text
go <place>      travel to a town destination
go town         return to the town hub
show            show merchant stock
buy <item>      request a purchase
sell <item>     request a sale
agree           confirm a buy/sell offer
no              cancel a buy/sell offer
heal            priest healing service
cure            priest cure service
sleep           rent a Tavern room and fully recover health
rent room       alias for sleep
rest            alias for sleep
```

Ruins commands:

```text
go up           move north
go right        move east
go down         move south
go left         move west
attack          attack the active enemy
cast <spell>    cast a known spell
loot            collect loot on or next to the player
go town         leave the Ruins when no enemy is active
```

## Game Mode

Text command mode is the default. Type `game` to enable faster game controls.
The prompt shows `[game]` while this mode is active.

Game mode controls:

```text
w               go up
a               go left
s               go down
d               go right
Enter           attack
i               inventory
l               loot
c               choose a spell by number
h               game mode help
?               game mode help
text            return to text command mode
commands        return to text command mode
```

Spell casting in game mode is numbered. Press `c`, choose `1`, `2`, and so on,
or use `0`, `cancel`, or `escape` to cancel.

## Terminal Screen UI

The default output remains the classic text response format. An experimental
fixed-width screen UI is available through `TEXT_ADVENTURES_SCREEN=1`.

The screen UI renders:

- an 80-column frame;
- a location header;
- a left content panel for the town list or dungeon viewport;
- a right sidebar with player HP, level, XP, gold, equipment, statuses, nearby
  enemies, nearby loot, and active enemy details when available;
- a bounded five-line message log;
- controls that change between text mode and game mode.

The dungeon screen centers the current 3x3 viewport inside the left panel and
keeps the same runtime map symbols: `x`, `E`, `@`, `.`, `#`, and `?`.
ANSI color is optional and disabled unless `TEXT_ADVENTURES_COLOR=1` is set.

Inventory and game-mode spell selection also use dedicated screen states:

- Inventory shows equipped gear, bag contents, character status, and skill
  levels.
- Cast Spell shows numbered spell choices and a `0` cancel option while a
  game-mode spell choice is pending.

## Town

The town of Nee'Peh is the main hub.

Destinations:

- `go Tavern`
- `go Aluriel's Priest`
- `go Blacksmith`
- `go Armorsmith`
- `go Ruins`

The Tavern sells potions and lets the player sleep to fully recover health. The
Priest heals, cures poison and disease, and sells tomes. The Blacksmith sells
weapons. The Armorsmith sells armor.

## Dungeon

The Ruins are built from connected dungeon blocks. Moving through exits reveals
new blocks. The in-game map renders a fixed 3x3 block viewport centered on the
player's current block so the display stays stable as the dungeon grows.

Map symbols:

```text
x               player
E               visible enemy
@               loot on the ground
.               open floor
#               wall
?               unrevealed area
```

Enemies are visible before combat. A new block may reveal an `E`; combat starts
when the player moves to an orthogonally adjacent tile. Diagonal adjacency does
not start combat.

When an enemy dies, it is removed from the map. If it drops loot, the loot is
placed at the enemy's map position as `@`. The player can collect loot by
stepping onto it automatically or by using `loot` while standing on or next to
it.

## Combat And Spells

Combat is turn-based. The player can attack with an equipped weapon or cast a
known spell. Enemies counterattack when able.

Current spell families:

- Fireball: damage spell.
- Ice Bolt: damage spell with a freeze chance.
- Heal: restores health.
- Cure: removes harmful statuses.

Tomes teach new spells or level known spells. Use a tome with:

```text
use tome of fireball
```

## Progression

Progression is inspired by Dungeon Siege: the character improves through use
instead of choosing a fixed class at character creation.

Skill tracks:

```text
swordsmanship   using swords
spearmanship    using spears, halberds, and lances
dagger_mastery  using daggers
combat_magic    casting offensive spells
nature_magic    casting healing, cure, and support spells
```

When a creature dies, its `xp_reward` is distributed across the skill tracks
that contributed during the battle. For example, if a fight is won mostly with
a spear and finished with Fireball, XP is split between `spearmanship` and
`combat_magic`.

Overall level is derived from total skill XP. The current level curve is:

```ruby
xp_required_for(level) = 50 * level * level
```

Skill levels grant gameplay bonuses:

- Swordsmanship adds stable attack while using swords.
- Spearmanship adds a smaller attack bonus and a defense bonus while using spears.
- Dagger Mastery improves critical hit chance while using daggers.
- Combat Magic increases offensive spell damage.
- Nature Magic improves healing.

## Editing Content

Game content is stored in YAML files:

```text
data/items.yml          weapons, armor, potions, and tomes
data/shops.yml          merchant stock and accepted item types
data/creatures.yml      creatures, attacks, loot, statuses, and XP rewards
data/dungeon_blocks.yml dungeon block layouts and exits
```

The Ruby domain objects are built from these files through
`TextAdventures::ContentCatalog`.

Weapon metadata:

```yaml
weapon_class: sword
weapon_class: spear
weapon_class: dagger
```

Armor metadata:

```yaml
armor_class: light
armor_class: medium
armor_class: heavy
```

Creature XP metadata:

```yaml
xp_reward: 67
```

Dungeon block tiles should store only walls and open floor. Enemy and loot
markers are runtime render markers, not YAML tile characters.

## Project Layout

```text
bin/text_adventures          terminal entrypoint
lib/commands                 command parsing
lib/domain                   gameplay domain objects
lib/scenes                   town, shops, tavern, priest, and ruins scenes
data                         YAML content
spec                         RSpec suite
```

## Development Notes

- Keep gameplay logic independent from any future web layer.
- Prefer adding content through YAML when possible.
- Use seeded binary runs for repeatable dungeon exploration tests.
- The browser/server experience remains planned work and should not be treated
  as currently available.
