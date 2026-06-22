require_relative "merchant"

module TextAdventures
  module Scenes
    class Tavern < Merchant
      def initialize
        super(**ContentCatalog.shop("tavern"))
      end

      def name
        :tavern
      end

      def display_name
        "Tavern"
      end

      def handle(game, command)
        return back_to_town(game) if command.verb == :go && Item.normalize_name(command.target) == "town"
        return Town.route(game, command.target) if command.verb == :go
        return sleep(game) if command.verb == :sleep

        super
      end

      def describe
        Response.new(
          "You enter the Tavern.",
          "",
          "The room is warm, loud, and full of adventurers trading rumors over ale.",
          "Here you can:",
          " sleep - rent a room and fully recover health and MP",
          " show - view potions for sale",
          " buy <item> - buy a potion",
          " sell <item> - sell potions and junk",
          " go town - return to Nee'Peh"
        )
      end

      private

      def sleep(game)
        before = game.player.health.current
        mana_before = game.player.mana.current
        game.player.heal(game.player.health.max)
        game.player.recover_mana(game.player.mana.max)
        recovered = game.player.health.current - before
        recovered_mana = game.player.mana.current - mana_before

        Response.new(
          "You rent a quiet room and sleep until fully rested.",
          "[recovered #{recovered} health]",
          "[recovered #{recovered_mana} MP]",
          "[your health is now #{game.player.health.current}/#{game.player.health.max}]",
          "[your MP is now #{game.player.mana.current}/#{game.player.mana.max}]"
        )
      end

      def back_to_town(game)
        game.transition_to(Town.new)
        Response.new("You return to the town of Nee'Peh.")
      end

    end
  end
end
