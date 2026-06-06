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

        describe
      end

      def describe
        Response.new(
          "You enter the Tavern.",
          "",
          "The room is warm, loud, and full of adventurers trading rumors over ale.",
          "Here you can:",
          " go town - return to Nee'Peh"
        )
      end

      private

      def back_to_town(game)
        game.transition_to(Town.new)
        Response.new("You return to the town of Nee'Peh.")
      end
    end
  end
end
