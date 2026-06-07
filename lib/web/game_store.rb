require "securerandom"

module TextAdventures
  module Web
    class GameStore
      def initialize(id_generator: -> { SecureRandom.uuid }, default_seed: nil)
        @id_generator = id_generator
        @default_seed = default_seed
        @games = {}
      end

      def create(seed: nil)
        id = next_id
        selected_seed = seed.nil? ? default_seed : seed
        game = selected_seed ? Game.new(random: Random.new(Integer(selected_seed))) : Game.new
        games[id] = game
        [id, game]
      end

      def fetch(id)
        games[id.to_s]
      end

      def delete(id)
        !games.delete(id.to_s).nil?
      end

      private

      attr_reader :id_generator, :default_seed, :games

      def next_id
        loop do
          id = id_generator.call.to_s
          return id unless games.key?(id)
        end
      end
    end
  end
end
