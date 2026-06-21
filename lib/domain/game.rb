module TextAdventures
  class Game
    GLOBAL_VERBS = %i[
      drop
      equip
      help
      inventory
      level
      skills
      spellbook
      use
    ].freeze
    STATUS_TURN_VERBS = %i[
      agree
      buy
      cure
      drop
      equip
      go
      heal
      loot
      no
      sell
      sleep
      use
    ].freeze
    attr_reader :player, :current_scene, :random
    attr_accessor :pending_confirmation, :dungeon, :battle, :pending_loot, :active_enemy_position

    def initialize(
      player: Character.new,
      current_scene: Scenes::Town.new,
      pending_confirmation: nil,
      dungeon: nil,
      battle: nil,
      pending_loot: nil,
      active_enemy_position: nil,
      random: Random.new
    )
      @player = player
      @current_scene = current_scene
      @pending_confirmation = pending_confirmation
      @dungeon = dungeon
      @battle = battle
      @pending_loot = pending_loot
      @active_enemy_position = active_enemy_position
      @random = random
    end

    def current_scene_name
      current_scene.name
    end

    def transition_to(scene)
      @current_scene = scene
    end

    def handle(command_text)
      command = CommandParser.parse(command_text.to_s)
      response = Response.render(command.unknown? ? handle_unknown_command(command) : handle_known_command(command))
      Response.render(append_pending_confirmation_hint(response, command))
    end

    private

    def append_pending_confirmation_hint(response, command)
      return response unless pending_confirmation && GLOBAL_VERBS.include?(command.verb)

      Response.render(Response.new(response, "", "[pending confirmation: agree/no]"))
    end

    def handle_unknown_command(command)
      return Response.new("Please answer agree or no.") if pending_confirmation

      command.message
    end

    def handle_known_command(command)
      return game_over_response if player.dead?
      return help_response if command.verb == :help
      return player.inventory_report if command.verb == :inventory
      return player.spellbook if command.verb == :spellbook
      return player.level_report if command.verb == :level
      return player.skills_report if command.verb == :skills
      status_lines = status_turn_lines(command)
      return Response.new(status_lines, game_over_response) if player.dead?

      response = handle_known_command_after_status(command)
      return Response.new(status_lines, response) unless status_lines.empty?

      response
    end

    def handle_known_command_after_status(command)
      return equip_item(command.target) if command.verb == :equip
      return use_item(command.target) if command.verb == :use
      return drop_item(command.target) if command.verb == :drop

      current_scene.handle(self, command)
    end

    def status_turn_lines(command)
      return [] unless status_turn_command?(command)

      player.tick_status_effects
    end

    def status_turn_command?(command)
      STATUS_TURN_VERBS.include?(command.verb)
    end

    def help_response
      return current_scene.help if current_scene.respond_to?(:help)
      return current_scene.describe if current_scene.respond_to?(:describe)

      Response.new("There is no help available here.")
    end

    def game_over_response
      Response.new(
        "You cannot continue; #{player.name} has fallen.",
        "Start a new adventure to try again."
      )
    end

    def equip_item(query)
      item = player.inventory.find(query)
      return Response.new("You do not have #{query}.") unless item

      previous_equipment = item.weapon? ? player.equipped_weapon : player.equipped_armor
      result = player.equip(item)
      return Response.new(result.message) unless result.success?
      removal = player.inventory.remove(item.command_name)
      player.inventory.add(previous_equipment) if previous_equipment

      Response.new(
        result.message,
        equipment_stat_line(item),
        "[#{removal.quantity}x #{removal.item.display_name} removed from inventory]",
        previous_equipment && "[1x #{previous_equipment.display_name} added to inventory]"
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
      cured_statuses = item.cures.select { |status| player.status?(status) }
      before = player.health.current
      player.heal(item.recovery)
      recovered = player.health.current - before
      player.clear_statuses(*cured_statuses)
      player.inventory.remove(item.command_name)

      Response.new(
        "Used #{item.display_name}.",
        (item.recovery.positive? ? "[recovered #{recovered} health]" : nil),
        (item.recovery.positive? ? "[your health is now #{player.health.current}/#{player.health.max}]" : nil),
        (!cured_statuses.empty? ? "[removed #{status_list(cured_statuses)}]" : nil),
        "[1x #{item.display_name} removed from inventory]"
      )
    end

    def status_list(statuses)
      statuses.map { |status| status.to_s.tr("_", " ") }.join(" and ")
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

  end
end
