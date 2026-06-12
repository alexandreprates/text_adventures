module TextAdventures
  class Game
    HistoryEntry = Struct.new(:command, :response, keyword_init: true)
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
    INPUT_MODES = %i[text game].freeze
    GAME_MODE_COMMANDS = {
      "w" => "go up",
      "s" => "go down",
      "a" => "go left",
      "d" => "go right",
      "" => "attack",
      " " => "attack",
      "i" => "inventory",
      "l" => "loot"
    }.freeze

    attr_reader :player, :current_scene, :history, :random, :input_mode
    attr_accessor :pending_confirmation, :dungeon, :battle, :pending_loot, :active_enemy_position,
                  :pending_game_spell_choices

    def initialize(
      player: Character.new,
      current_scene: Scenes::Town.new,
      pending_confirmation: nil,
      dungeon: nil,
      battle: nil,
      pending_loot: nil,
      active_enemy_position: nil,
      input_mode: :text,
      pending_game_spell_choices: nil,
      history: [],
      random: Random.new
    )
      @player = player
      @current_scene = current_scene
      @pending_confirmation = pending_confirmation
      @dungeon = dungeon
      @battle = battle
      @pending_loot = pending_loot
      @active_enemy_position = active_enemy_position
      @input_mode = validate_input_mode(input_mode)
      @pending_game_spell_choices = pending_game_spell_choices
      @history = history
      @random = random
    end

    def current_scene_name
      current_scene.name
    end

    def transition_to(scene)
      @current_scene = scene
    end

    def game_mode?
      input_mode == :game
    end

    def handle(command_text)
      original_command_text = command_text.to_s
      mode_response = handle_input_mode_command(original_command_text)
      return finalize_response(original_command_text, mode_response) if mode_response

      command_text = translated_command_text(original_command_text)
      return finalize_response(original_command_text, command_text.fetch(:response)) if command_text.key?(:response)

      command = CommandParser.parse(command_text.fetch(:command))
      response = Response.render(command.unknown? ? handle_unknown_command(command) : handle_known_command(command))
      response = append_pending_confirmation_hint(response, command)
      finalize_response(original_command_text, response)
    end

    private

    def validate_input_mode(value)
      mode = value.to_sym
      return mode if INPUT_MODES.include?(mode)

      raise ArgumentError, "unknown input mode: #{value}"
    end

    def finalize_response(command_text, response)
      rendered_response = Response.render(response)
      record_history(command_text, rendered_response)
      rendered_response
    end

    def handle_input_mode_command(command_text)
      normalized = normalize_game_input(command_text)
      case normalized
      when "game"
        @input_mode = :game
        self.pending_game_spell_choices = nil
        game_mode_enabled_response
      when "text", "commands"
        @input_mode = :text
        self.pending_game_spell_choices = nil
        Response.new("Text command mode enabled.")
      end
    end

    def translated_command_text(command_text)
      return { command: command_text } unless game_mode?

      spell_selection = handle_pending_game_spell_selection(command_text)
      return spell_selection if spell_selection

      normalized = normalize_game_input(command_text)
      return { response: game_mode_help_response } if ["h", "?"].include?(normalized)
      return { response: game_spell_choices_response } if normalized == "c"

      mapped_command = GAME_MODE_COMMANDS[normalized]
      return { command: mapped_command } if mapped_command

      { command: command_text }
    end

    def normalize_game_input(command_text)
      command_text.to_s.downcase.strip.squeeze(" ")
    end

    def game_mode_enabled_response
      Response.new(
        "Game mode enabled.",
        "Controls: W/A/S/D move, Enter attacks, I inventory, L loot, C cast, H help.",
        "Type text to return to text commands."
      )
    end

    def game_mode_help_response
      Response.new(
        "Game mode help",
        " W/A/S/D - move",
        " Enter - attack",
        " I - inventory",
        " L - loot",
        " C - cast a numbered spell",
        " text - return to text commands"
      )
    end

    def game_spell_choices_response
      choices = game_spell_choices
      return Response.new("You cannot cast any spells yet.") if choices.empty?

      self.pending_game_spell_choices = choices
      Response.new(
        "Choose a spell:",
        choices.each_with_index.map { |spell, index| " #{index + 1} - #{spell.display_name}" },
        " 0 - cancel"
      )
    end

    def game_spell_choices
      player.spells.values.sort_by(&:display_name)
    end

    def handle_pending_game_spell_selection(command_text)
      choices = pending_game_spell_choices
      return nil unless choices

      normalized = normalize_game_input(command_text)
      if ["0", "cancel", "escape"].include?(normalized)
        self.pending_game_spell_choices = nil
        return { response: Response.new("Spell casting canceled.") }
      end

      selected_index = Integer(normalized, exception: false)
      unless selected_index&.between?(1, choices.length)
        return { response: Response.new("Choose a spell number from 1 to #{choices.length}, or 0 to cancel.") }
      end

      self.pending_game_spell_choices = nil
      { command: "cast #{choices[selected_index - 1].command_name}" }
    end

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
      return equip_item(command.target) if command.verb == :equip
      return use_item(command.target) if command.verb == :use
      return drop_item(command.target) if command.verb == :drop

      current_scene.handle(self, command)
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
