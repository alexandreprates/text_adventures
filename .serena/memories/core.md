# Core

- Browser-playable fantasy RPG with Ruby domain logic, Ruby JSON/WebSocket API, and static browser frontend served through Nginx.
- Top-level source map:
  - `lib/text_adventures.rb`: project loader/root namespace; requires domain, scene, command, and web files.
  - `lib/domain/`: transport-independent gameplay model and rules. Read `mem:domain/core` for domain responsibilities and dungeon traversal invariants.
  - `lib/scenes/`: location handlers for town, shops, tavern/priest services, and ruins/dungeon entry.
  - `lib/web/`: HTTP/WebSocket server, routing, session storage/restoration, state patches, serializers, and action translation. Read `mem:web/core` for API boundaries.
  - `lib/persistence/`: snapshot and per-game SQLite save/load support. Read `mem:persistence/core` before changing save formats or repository behavior.
  - `frontend/public/`: static browser client, canvas/text dungeon display, auto-explore command UI, assets. Read `mem:frontend/core` for frontend-specific behavior.
  - `data/`: YAML-driven items, shops, creatures, and dungeon blocks. Read `mem:content/core` before changing gameplay content.
  - `spec/`: RSpec coverage grouped by domain, scenes, web, persistence, data, and e2e server/WebSocket specs.
- Current playable surface is the Compose-served browser frontend at port 3000; `bin/text_adventures` runs only the Ruby API/WebSocket server.
- Gameplay logic should remain independent from web transport details; web actions adapt user/API input into domain commands and serialize domain state back to clients.
- Dungeon render symbols are runtime markers, not YAML tile content: `x` player, `E` visible enemy, `@` loot, `P` level-one town portal, `<` ascent to previous level, `>` descent to next level, `.` floor, `#` wall, `?` unrevealed.
- The browser dungeon command panel is auto-focused: `Explore`, `Go Town`, and `Go Deep`; typed `explore`, `go town`, and `go deep` in the dungeon route through frontend auto-explore goals.
- Game sessions are cached in memory but persisted through per-game SQLite saves; `GET /api/games/<game_id>` restores an expired memory session from disk, and `DELETE /api/games/<game_id>` removes both memory and persisted data.
- Browser URLs use `/game/<game_id>` for saved game continuity; reopening a deleted/missing save recreates a fresh run with the same id.