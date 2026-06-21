require "digest"
require "securerandom"

module TextAdventures
  module Web
    class GameStore
      CapacityExceeded = Class.new(StandardError)
      Session = Struct.new(:id, :game, :created_at, :last_accessed_at, :mutex, keyword_init: true)

      DEFAULT_SESSION_TTL_SECONDS = 30 * 60
      DEFAULT_MAX_SESSIONS = 100
      VALID_GAME_ID = /\A[a-zA-Z0-9_-]+\z/

      def self.world_seed_for(game_id)
        Digest::SHA256.hexdigest(game_id.to_s)[0, 16].to_i(16)
      end

      def initialize(
        id_generator: -> { SecureRandom.uuid },
        default_seed: nil,
        session_ttl_seconds: DEFAULT_SESSION_TTL_SECONDS,
        max_sessions: DEFAULT_MAX_SESSIONS,
        clock: -> { Time.now },
        repository: nil
      )
        @id_generator = id_generator
        @default_seed = default_seed
        @session_ttl_seconds = Integer(session_ttl_seconds)
        @max_sessions = Integer(max_sessions)
        @clock = clock
        @repository = repository
        @sessions = {}
        @mutex = Mutex.new
      end

      def create(id: nil, seed: nil)
        session = mutex.synchronize do
          cleanup_expired_sessions
          raise CapacityExceeded, "Maximum active game sessions reached." if sessions.length >= max_sessions

          id = id.nil? ? next_id : available_requested_id(id)
          selected_seed = seed.nil? ? (default_seed || self.class.world_seed_for(id)) : seed
          world_seed = Integer(selected_seed)
          game = Game.new(
            random: RandomSource.new(seed: world_seed),
            world_seed: world_seed
          )
          repository&.save(id, game, seed: seed)
          session = Session.new(
            id: id,
            game: game,
            created_at: now,
            last_accessed_at: now,
            mutex: Mutex.new
          )
          sessions[id] = session
          session
        end
        id = session.id
        game = session.game
        [id, game]
      end

      def fetch(id)
        session_for(id)&.game
      end

      def with_game(id, save: false)
        session = session_for(id)
        return nil unless session

        session.mutex.synchronize do
          touch(session)
          result = yield session.game
          repository&.save(session.id, session.game) if save
          result
        end
      end

      def delete(id)
        removed_save = repository&.delete(id)
        mutex.synchronize do
          cleanup_expired_sessions
          !sessions.delete(id.to_s).nil? || !!removed_save
        end
      end

      def stats
        mutex.synchronize do
          cleanup_expired_sessions
          {
            active_sessions: sessions.length,
            max_sessions: max_sessions,
            session_ttl_seconds: session_ttl_seconds
          }
        end
      end

      private

      attr_reader :id_generator, :default_seed, :session_ttl_seconds, :max_sessions, :clock, :repository, :sessions, :mutex

      def next_id
        loop do
          id = id_generator.call.to_s
          return id unless sessions.key?(id) || repository&.exist?(id)
        end
      end

      def available_requested_id(id)
        requested_id = id.to_s
        raise ArgumentError, "Invalid game id." unless requested_id.match?(VALID_GAME_ID)
        raise ArgumentError, "Game id already exists." if sessions.key?(requested_id) || repository&.exist?(requested_id)

        requested_id
      end

      def session_for(id)
        mutex.synchronize do
          cleanup_expired_sessions
          session = sessions[id.to_s]
          session ||= restore_session(id)
          touch(session) if session
          session
        end
      end

      def restore_session(id)
        return nil unless repository&.exist?(id)
        raise CapacityExceeded, "Maximum active game sessions reached." if sessions.length >= max_sessions

        game = repository.load(id)
        return nil unless game

        sessions[id.to_s] = Session.new(
          id: id.to_s,
          game: game,
          created_at: now,
          last_accessed_at: now,
          mutex: Mutex.new
        )
      end

      def touch(session)
        session.last_accessed_at = now
      end

      def cleanup_expired_sessions
        return if session_ttl_seconds <= 0

        cutoff = now - session_ttl_seconds
        sessions.delete_if { |_id, session| session.last_accessed_at < cutoff }
      end

      def now
        clock.call
      end
    end
  end
end
