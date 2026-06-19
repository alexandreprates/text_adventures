# Text Adventures

Text Adventures is a browser-playable fantasy RPG backed by a Ruby JSON game
server. The current game includes a town hub, shops, dungeon exploration,
visible enemies, spatial loot, spells, equipment, and use-based character
progression inspired by Dungeon Siege.

The implementation is intentionally data-driven where it matters: items, shops,
creatures, and dungeon blocks live in YAML files under `data/`.

## Current Status

The game is playable through the browser frontend served by Nginx in the Compose
stack. The Ruby process is an API server.

Implemented systems include:

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
- JSON API for frontend clients through `bin/text_adventures`.
- Browser frontend served by the Nginx web container.

Not implemented yet:

- URL-based saved sessions.
- Persistent save/load.

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

Run the browser frontend and game API together:

```sh
docker compose up --build
```

Open:

```text
http://127.0.0.1:3000/
```

## JSON Server Mode

The binary runs the Ruby JSON API server:

```sh
bin/text_adventures
```

When running the Ruby server directly, it exposes only the JSON API:

```text
http://127.0.0.1:4567/api/games
```

For the full browser frontend, run the Compose stack and open the Nginx
entrypoint:

```sh
docker compose up --build
```

```text
http://127.0.0.1:3000/
```

Browser assets live under `frontend/public/`. Container deployments use the
Nginx web target as the public entrypoint and proxy API requests to the Ruby game
server:

```text
/                 -> Nginx static frontend
/assets/*         -> Nginx static assets
/api/games        -> Ruby game API
/api/games/:id    -> Ruby game API
/ws               -> reserved WebSocket proxy route
```

Server configuration:

```sh
TEXT_ADVENTURES_HOST=127.0.0.1
TEXT_ADVENTURES_PORT=4567
TEXT_ADVENTURES_RANDOM_SEED=0
TEXT_ADVENTURES_MAX_CONNECTIONS=50
TEXT_ADVENTURES_MAX_SESSIONS=100
TEXT_ADVENTURES_SESSION_TTL_SECONDS=1800
TEXT_ADVENTURES_READ_TIMEOUT_SECONDS=5
TEXT_ADVENTURES_WEBSOCKET_IDLE_TIMEOUT_SECONDS=60
```

Sessions are stored in memory and expire after `TEXT_ADVENTURES_SESSION_TTL_SECONDS`
without access. They are not persisted across process restarts.

Readiness check:

```sh
curl -sS http://127.0.0.1:4567/api/health
```

Create a game session:

```sh
curl -sS -X POST http://127.0.0.1:4567/api/games \
  -H 'Content-Type: application/json' \
  -d '{"seed":0}'
```

Send a structured action:

```sh
curl -sS -X POST http://127.0.0.1:4567/api/games/<game_id>/actions \
  -H 'Content-Type: application/json' \
  -d '{"type":"travel","destination":"ruins"}'
```

The gameplay WebSocket endpoint accepts action messages after a game is created:

```text
ws://127.0.0.1:4567/ws?game_id=<game_id>
```

```json
{ "type": "action", "action": "travel", "destination": "ruins" }
```

Fetch state:

```sh
curl -sS http://127.0.0.1:4567/api/games/<game_id>
```

Delete a session:

```sh
curl -sS -X DELETE http://127.0.0.1:4567/api/games/<game_id>
```

Successful action responses include typed events and semantic game state:

```json
{
  "game_id": "abc123",
  "events": [
    { "type": "travel.changed_scene", "text": "You go to Ruins." }
  ],
  "state": {
    "scene": "ruins",
    "prompt": "Ruins L1",
    "player": {},
    "dungeon": {
      "level": 1,
      "viewport": {
        "width": 18,
        "height": 15,
        "origin": { "x": -6, "y": -5 },
        "terrain": "????????...",
        "entities": [
          { "type": "player", "x": 9, "y": 7 },
          { "type": "portal", "x": 9, "y": 7 }
        ]
      }
    }
  }
}
```

Errors are returned as JSON:

```json
{
  "error": {
    "code": "not_found",
    "message": "Game not found."
  }
}
```

The frontend source assets are checked in under `frontend/public/`:

```text
frontend/public/index.html
frontend/public/styles.css
frontend/public/app.js
frontend/nginx.conf
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
bin/text_adventures          JSON API server entrypoint
frontend/public              browser frontend assets
frontend/nginx.conf          static frontend and API proxy config
lib/commands                 command parsing
lib/domain                   gameplay domain objects
lib/scenes                   town, shops, tavern, priest, and ruins scenes
lib/web                      JSON API server
data                         YAML content
spec                         RSpec suite
```

## Development Notes

- Keep gameplay logic independent from web transport details.
- Prefer adding content through YAML when possible.
- Use seeded API runs for repeatable dungeon exploration tests.
- Keep the JSON API layer thin; gameplay commands should continue to flow
  through `Game#handle`.
