module TextAdventures
  module Scenes
    class Town
      DESTINATIONS = {
        "tavern" => -> { Tavern.new },
        "aluriel s priest" => -> { Priest.new },
        "priest" => -> { Priest.new },
        "blacksmith" => -> { Blacksmith.new },
        "armorsmith" => -> { Armorsmith.new },
        "ruins" => ->(game) { Ruins.new(dungeon: Dungeon.new(random: game.random)) }
      }.freeze

      def name
        :town
      end

      def self.route(game, target)
        destination_factory = DESTINATIONS[Item.normalize_name(target)]
        return invalid_destination(target) unless destination_factory

        scene = destination_factory.arity == 1 ? destination_factory.call(game) : destination_factory.call
        game.transition_to(scene)
        scene.enter(game) if scene.respond_to?(:enter)
        Response.new("You go to #{scene.display_name}.", "", scene.describe)
      end

      def self.destination?(target)
        DESTINATIONS.key?(Item.normalize_name(target))
      end

      def handle(game, command)
        return self.class.route(game, command.target) if command.verb == :go

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

      def help
        Response.new(
          "Town help",
          "",
          "Destinations:",
          " go Tavern",
          " go Aluriel's Priest",
          " go Blacksmith",
          " go Armorsmith",
          " go Ruins",
          "",
          "Global commands:",
          " inventory - show carried and equipped items",
          " spellbook - show known spells",
          " level - show overall level and XP",
          " skills - show skill progression",
          " help - show contextual help"
        )
      end

      def self.invalid_destination(target)
        Response.new(
          "You cannot go to #{target}.",
          "Available destinations: Tavern, Aluriel's Priest, Blacksmith, Armorsmith, Ruins."
        )
      end
    end
  end
end
