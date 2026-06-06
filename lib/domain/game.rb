module TextAdventures
  class Game
    HistoryEntry = Struct.new(:command, :response, keyword_init: true)

    attr_reader :player, :current_scene, :history, :random
    attr_accessor :pending_confirmation, :dungeon, :battle

    def initialize(
      player: Character.new,
      current_scene: Scenes::Town.new,
      pending_confirmation: nil,
      dungeon: nil,
      battle: nil,
      history: [],
      random: Random.new
    )
      @player = player
      @current_scene = current_scene
      @pending_confirmation = pending_confirmation
      @dungeon = dungeon
      @battle = battle
      @history = history
      @random = random
    end

    def current_scene_name
      current_scene.name
    end

    def transition_to(scene)
      @current_scene = scene
    end

    def handle(command_text)
      command = CommandParser.parse(command_text)
      response = Response.render(command.unknown? ? command.message : handle_known_command(command))
      record_history(command_text, response)
      response
    end

    private

    def handle_known_command(command)
      return player.inventory_report if command.verb == :inventory
      return equip_item(command.target) if command.verb == :equip
      return use_item(command.target) if command.verb == :use
      return drop_item(command.target) if command.verb == :drop

      current_scene.handle(self, command)
    end

    def equip_item(query)
      item = player.inventory.find(query)
      return Response.new("You do not have #{query}.") unless item

      result = player.equip(item)
      return Response.new(result.message) unless result.success?

      Response.new(
        result.message,
        equipment_stat_line(item)
      )
    end

    def equipment_stat_line(item)
      return "[your attack is now #{player.attack}]" if item.weapon?
      return "[your defense is now #{player.defense}]" if item.armor?

      ""
    end

    def use_item(query)
      item = player.inventory.find(query)
      return Response.new("You do not have #{query}.") unless item

      return use_potion(item) if item.potion?
      return use_tome(item) if item.tome?

      Response.new("#{item.display_name} cannot be used.")
    end

    def use_potion(item)
      before = player.health.current
      player.heal(item.recovery)
      recovered = player.health.current - before
      player.inventory.remove(item.command_name)

      Response.new(
        "Used #{item.display_name}.",
        "[recovered #{recovered} health]",
        "[your health is now #{player.health.current}/#{player.health.max}]",
        "[1x #{item.display_name} removed from inventory]"
      )
    end

    def use_tome(item)
      spell_name = item.spell
      previous_level = player.spells[Spell.normalize_name(spell_name)]&.level
      learned_spell = player.learn_spell_from_tome(item)
      player.inventory.remove(item.command_name)

      Response.new(
        "Studied #{item.display_name}.",
        tome_result_line(learned_spell, previous_level),
        "[1x #{item.display_name} removed from inventory]"
      )
    end

    def tome_result_line(spell, previous_level)
      return "[learned #{spell.display_name} level #{spell.level}]" unless previous_level

      "[#{spell.display_name} is now level #{spell.level}]"
    end

    def drop_item(query)
      item = player.inventory.find(query)
      return Response.new("You do not have #{query}.") unless item
      return Response.new("You cannot drop equipped #{item.display_name}.") if equipped_item?(item)

      result = player.inventory.remove(item.command_name)
      Response.new(
        "Dropped #{result.item.display_name}.",
        "[#{result.quantity}x #{result.item.display_name} removed from inventory]"
      )
    end

    def equipped_item?(item)
      [player.equipped_weapon, player.equipped_armor].any? do |equipment|
        equipment_name(equipment) == item.command_name
      end
    end

    def equipment_name(equipment)
      return nil unless equipment
      return equipment.command_name if equipment.respond_to?(:command_name)

      Item.normalize_name(equipment.name)
    end

    def record_history(command_text, response)
      history << HistoryEntry.new(command: command_text, response: response)
    end
  end
end
