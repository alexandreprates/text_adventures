require "fileutils"
require "json"
require "sqlite3"
require "time"

module TextAdventures
  module Persistence
    class SQLiteGameRepository
      DEFAULT_SAVE_DIR = File.join(ROOT, "storage", "games")
      DEFAULT_HISTORY_LIMIT = 1
      DEFAULT_BUSY_TIMEOUT_MS = 1_000
      VALID_GAME_ID = /\A[a-zA-Z0-9_-]+\z/
      SIDECAR_SUFFIXES = ["", "-wal", "-shm"].freeze

      attr_reader :save_dir, :history_limit, :clock, :busy_timeout_ms

      def initialize(
        save_dir: DEFAULT_SAVE_DIR,
        history_limit: DEFAULT_HISTORY_LIMIT,
        clock: -> { Time.now.utc },
        busy_timeout_ms: DEFAULT_BUSY_TIMEOUT_MS
      )
        @save_dir = File.expand_path(save_dir)
        @history_limit = Integer(history_limit)
        @clock = clock
        @busy_timeout_ms = Integer(busy_timeout_ms)
      end

      def save(game_id, game, seed: nil)
        snapshot = GameSnapshot.dump(game, saved_at: now)
        payload_json = JSON.generate(snapshot)
        created_at = snapshot.fetch("saved_at")

        with_database(game_id, create: true) do |db|
          db.transaction do
            upsert_metadata(db, "game_id", game_id.to_s)
            upsert_metadata(db, "updated_at", created_at)
            upsert_metadata(db, "snapshot_schema_version", GameSnapshot::CURRENT_SCHEMA_VERSION.to_s)
            upsert_metadata(db, "world_seed", game.world_seed.to_s) unless game.world_seed.nil?
            upsert_metadata(db, "seed", seed.to_s) unless seed.nil?
            db.execute(
              "INSERT INTO snapshots (schema_version, created_at, payload_json) VALUES (?, ?, ?)",
              [GameSnapshot::CURRENT_SCHEMA_VERSION, created_at, payload_json]
            )
            prune_history(db)
          end
        end

        snapshot
      rescue SQLite3::Exception, SystemCallError, JSON::JSONError, SnapshotContentError => error
        raise Error, "Could not save game."
      end

      def load(game_id)
        path = database_path(game_id)
        return nil unless File.exist?(path)

        row = with_database(game_id) do |db|
          db.get_first_row("SELECT payload_json FROM snapshots ORDER BY id DESC LIMIT 1")
        end
        return nil unless row

        GameSnapshot.load(JSON.parse(row.fetch("payload_json")))
      rescue SQLite3::Exception, SystemCallError, JSON::JSONError, SnapshotContentError, SnapshotVersionError => error
        raise Error, "Could not load game."
      end

      def delete(game_id)
        path = database_path(game_id)
        deleted = false
        SIDECAR_SUFFIXES.each do |suffix|
          target = "#{path}#{suffix}"
          next unless File.exist?(target)

          File.delete(target)
          deleted = true
        end
        deleted
      rescue SystemCallError => error
        raise Error, "Could not delete game."
      end

      def exist?(game_id)
        File.exist?(database_path(game_id))
      end

      def database_path(game_id)
        id = sanitized_game_id(game_id)
        File.join(save_dir, "#{id}.sqlite3")
      end

      private

      def now
        clock.call.utc
      end

      def sanitized_game_id(game_id)
        id = game_id.to_s
        raise InvalidGameId, "Invalid game id." unless id.match?(VALID_GAME_ID)

        id
      end

      def with_database(game_id, create: false)
        FileUtils.mkdir_p(save_dir) if create
        db = SQLite3::Database.new(database_path(game_id))
        db.results_as_hash = true
        db.busy_timeout = busy_timeout_ms
        initialize_schema(db) if create || schema_missing?(db)
        yield db
      ensure
        db&.close
      end

      def initialize_schema(db)
        db.execute_batch(<<~SQL)
          PRAGMA journal_mode = WAL;
          CREATE TABLE IF NOT EXISTS metadata (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
          );
          CREATE TABLE IF NOT EXISTS snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            schema_version INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            payload_json TEXT NOT NULL
          );
          CREATE INDEX IF NOT EXISTS index_snapshots_created_at ON snapshots(created_at);
        SQL
      end

      def schema_missing?(db)
        row = db.get_first_row(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'snapshots'"
        )
        row.nil?
      end

      def upsert_metadata(db, key, value)
        db.execute(
          <<~SQL,
            INSERT INTO metadata (key, value)
            VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
          SQL
          [key, value]
        )
      end

      def prune_history(db)
        return unless history_limit.positive?

        db.execute(
          <<~SQL,
            DELETE FROM snapshots
            WHERE id NOT IN (
              SELECT id FROM snapshots ORDER BY id DESC LIMIT ?
            )
          SQL
          [history_limit]
        )
      end
    end
  end
end
