module TextAdventures
  module Scenes
    class Tavern
      def name
        :tavern
      end

      def display_name
        "Tavern"
      end

      def handle(game, command)
        return back_to_town(game) if command.verb == :go && Item.normalize_name(command.target) == "town"
        return sleep(game) if command.verb == :sleep

        describe
      end

      def describe
        Response.new(
          "You enter the Tavern.",
          "",
          "The room is warm, loud, and full of adventurers trading rumors over ale.",
          "Here you can:",
          " sleep - rent a room and fully recover health",
          " go town - return to Nee'Peh"
        )
      end

      private

      def sleep(game)
        before = game.player.health.current
        game.player.heal(game.player.health.max)
        recovered = game.player.health.current - before

        Response.new(
          "You rent a quiet room and sleep until fully rested.",
          "[recovered #{recovered} health]",
          "[your health is now #{game.player.health.current}/#{game.player.health.max}]"
        )
      end

      def back_to_town(game)
        game.transition_to(Town.new)
        Response.new("You return to the town of Nee'Peh.")
      end
    end
  end
end
