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

      def handle(game, command)
        return handle_active_encounter(game, command) if game.battle
        visible_encounter = start_visible_encounter(game)
        return visible_encounter if visible_encounter

        case command.verb
        when :look
          look(game)
        when :go
          handle_movement(game, command.target)
        when :attack
          Response.new("There is no enemy to attack.")
        when :cast
          no_spell_target(game, command.target)
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
          " return to the entrance portal - go back to Nee'Peh",
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

      def help
        Response.new(
          "Ruins help",
          "",
          "Movement:",
          " go <up|right|down|left> - move through open floor",
          " return to the entrance portal - go back to Nee'Peh",
          " look - inspect the ruins and risk an encounter",
          " The map shows the 3x3 area around your current block.",
          "",
          "Combat:",
          " attack - strike the active enemy",
          " cast <spell> - cast a known spell",
          " loot - collect rewards after victory",
          "",
          "Map symbols:",
          " x - you",
          " E - enemy",
          " @ - loot",
          " P - entrance portal",
          " > - deeper stairs",
          " . - open floor",
          " # - wall",
          " ? - unrevealed area"
        )
      end

      private

      def look(game)
        describe
      end

      def handle_movement(game, direction)
        return portal_required_response if Item.normalize_name(direction) == "town" || Town.destination?(direction)
        return invalid_direction(direction) unless DIRECTIONS.include?(direction)

        result = dungeon.move(direction)
        return Response.new(result.message) unless result.success?
        return back_to_town(game, result.message) if dungeon.player_on_entrance_portal?
        return descend_level(game, result.message) if dungeon.player_on_descent?

        response = Response.new(
          result.message,
          "",
          dungeon.render
        )

        auto_loot = collect_loot_at(game, dungeon.current_global_position, automatic: true)
        response = response.append("", auto_loot) if auto_loot

        encounter = start_visible_encounter(game)
        response = response.append("", encounter) if encounter
        response
      end

      def invalid_direction(direction)
        Response.new(
          "You cannot go #{direction} inside the ruins.",
          "Available directions: up, right, down, left."
        )
      end

      def portal_required_response
        Response.new(
          "The ruins hold you in place.",
          "Return to the entrance portal to go back to Nee'Peh."
        )
      end

      def back_to_town(game, movement_message)
        game.transition_to(Town.new)
        Response.new(
          movement_message,
          "The entrance portal pulls you back to Nee'Peh.",
          "",
          Town.new.describe
        )
      end

      def descend_level(game, movement_message)
        dungeon.advance_level!
        game.battle = nil
        game.pending_loot = nil
        game.active_enemy_position = nil

        Response.new(
          movement_message,
          "You descend deeper into the ruins.",
          "",
          dungeon.render
        )
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

      def no_spell_target(game, spell_name)
        spell = game.player.spells[Spell.normalize_name(spell_name)]
        return Response.new("You do not know #{spell_name}, and there is no enemy to target.") unless spell

        Response.new("You know #{spell.display_name}, but there is no enemy to target.")
      end

      def resolve_battle_result(game, result)
        response = result.to_response
        if result.finished?
          resolve_finished_battle(game, result)
          game.battle = nil
          return append_loot_hint(response, result.loot)
        end

        response.append("", combat_status(game))
      end

      def append_loot_hint(response, loot)
        return response if loot.nil? || loot.empty?

        response.append("", "[loot dropped]", "Reach @ or use loot nearby to collect it.", "", dungeon.render)
      end

      def collect_loot(game)
        if game.pending_loot && !game.pending_loot.empty?
          loot = game.pending_loot
          game.pending_loot = nil
          return collect_loot_items(game, loot)
        end

        position = dungeon.nearby_loot_position
        return collect_loot_at(game, position) if position

        return Response.new("There is loot on the map, but you need to reach it first.") if dungeon.dropped_loot?

        Response.new("There is no loot to collect.")
      end

      def collect_loot_at(game, position, automatic: false)
        loot = dungeon.collect_loot_at(position)
        return nil if loot.empty?

        response = collect_loot_items(game, loot)
        return response unless automatic

        response.append("", dungeon.render)
      end

      def collect_loot_items(game, loot)
        lines = ["You collect the loot."]
        loot.each do |item|
          game.player.inventory.add(item)
          lines << "[1x #{item.display_name} added to inventory]"
        end
        if loot.gold.positive?
          game.player.gold += loot.gold
          lines << "[#{loot.gold}g added to purse]"
          lines << "[your gold is now #{game.player.gold}]"
        end
        Response.new(lines)
      end

      def start_visible_encounter(game)
        enemy_position = visible_enemy_position
        return nil unless enemy_position

        creature_id = dungeon.enemy_at(enemy_position)
        game.active_enemy_position = enemy_position
        game.battle = Battle.new(creature: ContentCatalog.creature(creature_id), random: game.random)
        encounter_response(game)
      end

      def visible_enemy_position
        current_position = dungeon.current_global_position

        return current_position if dungeon.enemy_at(current_position)

        dungeon.adjacent_enemy_position
      end

      def resolve_finished_battle(game, result)
        if result.player_defeated?
          game.pending_loot = nil
          game.active_enemy_position = nil
          return
        end

        enemy_position = game.active_enemy_position
        game.pending_loot = nil
        game.active_enemy_position = nil
        return unless enemy_position

        dungeon.remove_enemy(enemy_position)
        dungeon.drop_loot(enemy_position, result.loot) unless result.loot.empty?
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
