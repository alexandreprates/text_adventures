# Persistence Core

- Persistence code lives under `lib/persistence/` and is loaded before `lib/web/` by `TextAdventures::SOURCE_DIRECTORIES`.
- Runtime persistence is active by default: `TextAdventures::Web::Server.from_env` creates a `Persistence::SQLiteGameRepository` and passes it to `Web::GameStore`.
- `Persistence::SQLiteGameRepository` stores one SQLite database per game id under `TEXT_ADVENTURES_SAVE_DIR` using `<game_id>.sqlite3` plus SQLite sidecar files; game ids are restricted to alphanumeric, underscore, and hyphen.
- Saves are versioned JSON snapshots in a `snapshots` table. `TEXT_ADVENTURES_SAVE_HISTORY_LIMIT` controls history pruning; the latest snapshot is loaded.
- `Persistence::GameSnapshot` owns schema-versioned dump/load for game state: random source, world seed, scene, player, dungeon, battle, pending confirmation/loot, and active enemy position.
- `Web::GameStore` keeps active sessions in memory, restores expired/missing memory sessions from the repository, and writes saves on creation plus `with_game(..., save: true)` actions.
- `Router#game_state` returns persisted games to town on page load before serializing; if no memory session or save exists for the requested id, it creates a fresh game with that id.
- `DELETE /api/games/<game_id>` deletes both the memory session and persisted SQLite save.
- Validate persistence changes with `spec/persistence`, relevant `spec/web` restore/delete specs, and e2e persistence coverage when server behavior changes.