module TextAdventures
  module Scenes
    class Town
      DESTINATIONS = {
        "tavern" => -> { Tavern.new },
        "aluriel s priest" => -> { StaticLocation.new(name: :priest, display_name: "Aluriel's Priest") },
        "priest" => -> { StaticLocation.new(name: :priest, display_name: "Aluriel's Priest") },
        "blacksmith" => -> { StaticLocation.new(name: :blacksmith, display_name: "Blacksmith") },
        "armorsmith" => -> { StaticLocation.new(name: :armorsmith, display_name: "Armorsmith") },
        "ruins" => -> { StaticLocation.new(name: :ruins, display_name: "Ruins") }
      }.freeze

      def name
        :town
      end

      def handle(game, command)
        return route(game, command.target) if command.verb == :go

        describe
      end

      def describe
        Response.new(
          "Welcome to Text Adventures",
          "",
          "You are now on the town of Nee'Peh",
          "",
          "Here you can:",
          " go Tavern - small talk, some Ale and Potions",
          " go Aluriel's Priest - cure diseases, recover health, buy and sell tomes",
          " go Blacksmith - buy or sell weapons",
          " go Armorsmith - buy or sell armors",
          " go Ruins - where your adventure begins",
          "",
          "What will you do now?"
        )
      end

      private

      def route(game, target)
        destination_factory = DESTINATIONS[Item.normalize_name(target)]
        return invalid_destination(target) unless destination_factory

        scene = destination_factory.call
        game.transition_to(scene)
        Response.new("You go to #{scene.display_name}.")
      end

      def invalid_destination(target)
        Response.new(
          "You cannot go to #{target}.",
          "Available destinations: Tavern, Aluriel's Priest, Blacksmith, Armorsmith, Ruins."
        )
      end
    end
  end
end
