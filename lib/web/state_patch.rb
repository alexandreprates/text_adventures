module TextAdventures
  module Web
    class StatePatch
      PLAYER_FIELDS = %i[
        health
        gold
        statuses
        equipment
        inventory
        spells
        skills
        current_class
        level
        xp
        attack
        defense
      ].freeze

      def initialize(game, serializer: GameSerializer)
        @state = serializer.new(game).to_h
      end

      def to_h
        {
          scene: state.fetch(:scene),
          scene_display_name: state.fetch(:scene_display_name),
          prompt: state.fetch(:prompt),
          player: player_patch,
          dungeon: state.fetch(:dungeon),
          battle: state.fetch(:battle),
          pending: state.fetch(:pending)
        }
      end

      private

      attr_reader :state

      def player_patch
        player = state.fetch(:player)
        PLAYER_FIELDS.to_h { |field| [field, player.fetch(field)] }
      end
    end
  end
end
