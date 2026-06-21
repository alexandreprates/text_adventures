require_relative "merchant"

module TextAdventures
  module Scenes
    class Priest < Merchant
      HEAL_AMOUNT = Character::DEFAULT_HEALTH

      def initialize
        super(**ContentCatalog.shop("priest"))
      end

      def handle(game, command)
        case command.verb
        when :heal
          heal_player(game)
        when :cure
          cure_player(game)
        else
          super
        end
      end

      def describe
        Response.new(
          "Welcome to Aluriel's Priest.",
          "You can:",
          " heal - recover health",
          " cure - remove poison and disease",
          " show - view holy tomes",
          " buy <item> - buy a tome",
          " sell <item> - sell a tome",
          " go town - return to Nee'Peh"
        )
      end

      private

      def heal_player(game)
        before = game.player.health.current
        game.player.heal(HEAL_AMOUNT)
        recovered = game.player.health.current - before

        return Response.new("Aluriel's blessing surrounds you, but you are already at full health.") if recovered.zero?

        Response.new(
          "Aluriel's blessing restores #{recovered} health.",
          "[your health is now #{game.player.health.current}/#{game.player.health.max}]"
        )
      end

      def cure_player(game)
        active_statuses = game.player.curable_statuses

        return Response.new("You have no poison or disease to cure.") if active_statuses.empty?

        game.player.clear_statuses(*active_statuses)
        Response.new(
          "Aluriel's light purges #{status_list(active_statuses)}.",
          "[active poison and disease effects removed]"
        )
      end

      def status_list(statuses)
        statuses.map { |status| status.to_s.tr("_", " ") }.join(" and ")
      end
    end
  end
end
