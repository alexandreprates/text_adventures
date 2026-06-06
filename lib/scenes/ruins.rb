module TextAdventures
  module Scenes
    class Ruins
      DIRECTIONS = %w[up right down left].freeze

      attr_reader :dungeon

      def initialize(dungeon: Dungeon.new)
        @dungeon = dungeon
      end

      def name
        :ruins
      end

      def display_name
        "Ruins"
      end

      def enter(game)
        game.dungeon = dungeon
      end

      def handle(_game, command)
        case command.verb
        when :look
          describe
        when :go
          handle_movement(command.target)
        else
          describe
        end
      end

      def describe
        Response.new(
          "You are now inside the Ruins Level #{dungeon.level}",
          "",
          "Here you can:",
          " go <up|right|down|left> - to move around",
          " look - to examine your surroundings",
          " attack - to attack an enemy",
          " spellbook - show the spells you can cast",
          " cast <spell> - to cast a powerful spell",
          " loot - to collect your prize after the battle",
          " inventory - to show what you carry in your bags",
          " equip <item> - to equip item",
          " use <item> - to use item",
          " drop <item> - to leave an item",
          "",
          dungeon.render,
          "",
          "Good luck and have a great adventure!"
        )
      end

      private

      def handle_movement(direction)
        return invalid_direction(direction) unless DIRECTIONS.include?(direction)

        result = dungeon.move(direction)
        return Response.new(result.message) unless result.success?

        Response.new(
          result.message,
          "",
          dungeon.render
        )
      end

      def invalid_direction(direction)
        Response.new(
          "You cannot go #{direction} inside the ruins.",
          "Available directions: up, right, down, left."
        )
      end
    end
  end
end
