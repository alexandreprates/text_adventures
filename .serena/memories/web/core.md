# Web Core

- Web layer lives under `lib/web/` and adapts HTTP/WebSocket input to domain game actions.
- Server entrypoint: `TextAdventures::Web::Server.from_env.start`, invoked by `bin/text_adventures`.
- `Router` handles JSON API routes such as health, game creation, state fetch/restore, action dispatch, deletion, and WebSocket upgrade path; state fetch returns persisted games to town on page load and recreates a fresh game when no save exists for the requested id.
- `GameStore` manages active memory sessions, capacity, TTL, lookup lifecycle, repository-backed restoration, and save writes. Read `mem:persistence/core` for snapshot/repository behavior.
- `ActionCommand` translates structured web action payloads into domain command semantics.
- `GameSerializer` emits semantic game state for frontend clients, including scene, prompt, player, battle, pending confirmation, and dungeon state.
- Dungeon web state currently includes `level`, structured `viewport`, `player_position`, `entrance_portal`, `ascent`, `descent`, and `nearby_loot`; there is no legacy `map` payload.
- Viewport entities include semantic markers such as `player`, `portal`, `ascent`, `descent`, `enemy`, and `loot`.
- `StatePatch` and `ResponseEvents` support incremental WebSocket/client updates while keeping responses typed; `ResponseEvents` filters non-log dungeon rows/legends including `<` and `>` markers.
- `JsonResponse` centralizes JSON response shape and errors.
- Nginx proxies `/api/` and `/ws` to this Ruby server; keep public browser concerns out of domain classes.
- Validate changes with `spec/web` and, for server lifecycle/WebSocket behavior, `spec/e2e`.