module TextAdventures
  module Scenes
    class Ruins
      DIRECTIONS = %w[up right down left].freeze
      ENCOUNTER_CHANCE = 20

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

      def handle(game, command)
        return handle_active_encounter(game, command) if game.battle

        case command.verb
        when :look
          look(game)
        when :go
          handle_movement(game, command.target)
        when :attack
          Response.new("There is no enemy to attack.")
        when :cast
          Response.new("There is no enemy to target.")
        when :loot
          collect_loot(game)
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

      def look(game)
        maybe_spawn_encounter(game) || describe
      end

      def handle_movement(game, direction)
        return invalid_direction(direction) unless DIRECTIONS.include?(direction)

        result = dungeon.move(direction)
        return Response.new(result.message) unless result.success?

        response = Response.new(
          result.message,
          "",
          dungeon.render
        )
        encounter = maybe_spawn_encounter(game)
        return response unless encounter

        response.append("", encounter)
      end

      def invalid_direction(direction)
        Response.new(
          "You cannot go #{direction} inside the ruins.",
          "Available directions: up, right, down, left."
        )
      end

      def maybe_spawn_encounter(game)
        return nil if game.random.rand(100) >= ENCOUNTER_CHANCE

        game.battle = Battle.new(creature: random_creature(game), random: game.random)
        encounter_response(game)
      end

      def random_creature(game)
        creature_ids = ContentCatalog.creature_ids
        ContentCatalog.creature(creature_ids[game.random.rand(creature_ids.length)])
      end

      def handle_active_encounter(game, command)
        creature = game.battle.creature
        return encounter_response(game) if command.verb == :look
        return handle_attack(game) if command.verb == :attack
        return handle_spell(game, command.target) if command.verb == :cast
        return Response.new("You cannot move while #{creature.display_name} blocks your path.") if command.verb == :go

        Response.new("#{creature.display_name} is about to attack you!")
      end

      def handle_attack(game)
        result = game.battle.attack(game.player)
        resolve_battle_result(game, result)
      end

      def handle_spell(game, spell_name)
        spell = game.player.spells[Spell.normalize_name(spell_name)]
        return Response.new("You do not know #{spell_name}.") unless spell

        result = game.battle.cast_spell(game.player, spell)
        resolve_battle_result(game, result)
      end

      def resolve_battle_result(game, result)
        if result.finished?
          game.pending_loot = result.player_defeated? ? nil : result.loot
          game.battle = nil
        end
        response = result.to_response
        return response unless game.battle

        response.append("", combat_status(game))
      end

      def collect_loot(game)
        return Response.new("There is no loot to collect.") if game.pending_loot.nil? || game.pending_loot.empty?

        lines = ["You collect the loot."]
        game.pending_loot.each do |item|
          game.player.inventory.add(item)
          lines << "[1x #{item.display_name} added to inventory]"
        end
        game.pending_loot = nil
        Response.new(lines)
      end

      def encounter_response(game)
        creature = game.battle.creature
        Response.new(
          "You see a #{creature.display_name}",
          "A #{creature.display_name} is about to attack you!",
          "",
          combat_status(game)
        )
      end

      def combat_status(game)
        creature = game.battle.creature
        Response.new(
          "[#{creature.display_name} HP: #{creature.health.current}/#{creature.health.max}]",
          "[#{game.player.name} HP: #{game.player.health.current}/#{game.player.health.max}]"
        )
      end
    end
  end
end
