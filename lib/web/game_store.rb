require "securerandom"

module TextAdventures
  module Web
    class GameStore
      CapacityExceeded = Class.new(StandardError)
      Session = Struct.new(:id, :game, :created_at, :last_accessed_at, :mutex, keyword_init: true)

      DEFAULT_SESSION_TTL_SECONDS = 30 * 60
      DEFAULT_MAX_SESSIONS = 100

      def initialize(
        id_generator: -> { SecureRandom.uuid },
        default_seed: nil,
        session_ttl_seconds: DEFAULT_SESSION_TTL_SECONDS,
        max_sessions: DEFAULT_MAX_SESSIONS,
        clock: -> { Time.now }
      )
        @id_generator = id_generator
        @default_seed = default_seed
        @session_ttl_seconds = Integer(session_ttl_seconds)
        @max_sessions = Integer(max_sessions)
        @clock = clock
        @sessions = {}
        @mutex = Mutex.new
      end

      def create(seed: nil)
        session = mutex.synchronize do
          cleanup_expired_sessions
          raise CapacityExceeded, "Maximum active game sessions reached." if sessions.length >= max_sessions

          id = next_id
          selected_seed = seed.nil? ? default_seed : seed
          game = selected_seed ? Game.new(random: Random.new(Integer(selected_seed))) : Game.new
          sessions[id] = Session.new(
            id: id,
            game: game,
            created_at: now,
            last_accessed_at: now,
            mutex: Mutex.new
          )
        end
        id = session.id
        game = session.game
        [id, game]
      end

      def fetch(id)
        session_for(id)&.game
      end

      def with_game(id)
        session = session_for(id)
        return nil unless session

        session.mutex.synchronize do
          touch(session)
          yield session.game
        end
      end

      def delete(id)
        mutex.synchronize do
          cleanup_expired_sessions
          !sessions.delete(id.to_s).nil?
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

      attr_reader :id_generator, :default_seed, :session_ttl_seconds, :max_sessions, :clock, :sessions, :mutex

      def next_id
        loop do
          id = id_generator.call.to_s
          return id unless sessions.key?(id)
        end
      end

      def session_for(id)
        mutex.synchronize do
          cleanup_expired_sessions
          session = sessions[id.to_s]
          touch(session) if session
          session
        end
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
