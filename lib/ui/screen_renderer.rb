module TextAdventures
  module UI
    class ScreenRenderer
      DEFAULT_WIDTH = 80
      HEADER_INNER_WIDTH = 78
      LEFT_PANEL_WIDTH = 46
      RIGHT_PANEL_WIDTH = 31
      MAIN_PANEL_HEIGHT = 17
      LOG_HEIGHT = 5
      BAR_WIDTH = 10
      LOG_WIDTH = 78
      CONTROLS_WIDTH = 78
      ELLIPSIS = "...".freeze
      ANSI = {
        reset: "\e[0m",
        border: "\e[90m",
        header: "\e[1;36m",
        controls: "\e[1;33m"
      }.freeze

      def initialize(width: DEFAULT_WIDTH, color: false)
        @width = Integer(width)
        @color = color
      end

      attr_reader :width

      def render(game)
        context = screen_context(game)
        left_lines, right_lines = main_panels(game, context)
        [
          full_border,
          full_line(header_text(game, context), style: :header),
          split_border,
          *main_panel_lines(left_lines, right_lines),
          full_border,
          *log_lines(game),
          full_border,
          full_line(controls_text(game, context), style: :controls),
          full_border
        ].join("\n")
      end

      def truncate(value, width)
        target_width = Integer(width)
        return "" if target_width <= 0

        text = value.to_s
        return text if text.length <= target_width
        return ELLIPSIS[0, target_width] if target_width <= ELLIPSIS.length

        "#{text[0, target_width - ELLIPSIS.length]}#{ELLIPSIS}"
      end

      def pad(value, width, align: :left)
        target_width = Integer(width)
        text = truncate(value, target_width)
        padding = target_width - text.length

        case align
        when :right
          "#{' ' * padding}#{text}"
        when :center
          left_padding = padding / 2
          right_padding = padding - left_padding
          "#{' ' * left_padding}#{text}#{' ' * right_padding}"
        else
          "#{text}#{' ' * padding}"
        end
      end

      def blank_lines(count, width)
        Array.new(Integer(count)) { " " * Integer(width) }
      end

      def bar(current, maximum, width: BAR_WIDTH, fill: "#", empty: "-")
        target_width = Integer(width)
        return "[]" if target_width <= 0

        maximum_value = [Integer(maximum), 1].max
        current_value = [[Integer(current), 0].max, maximum_value].min
        filled_width = (current_value * target_width / maximum_value.to_f).round
        empty_width = target_width - filled_width

        "[#{fill.to_s[0] * filled_width}#{empty.to_s[0] * empty_width}]"
      end

      def box(lines, width:, height: nil, title: nil)
        inner_width = Integer(width) - 2
        raise ArgumentError, "box width must be at least 2" if inner_width.negative?

        body_height = height ? Integer(height) : lines.length
        body_lines = lines.first(body_height).map { |line| pad(line, inner_width) }
        body_lines += blank_lines(body_height - body_lines.length, inner_width)

        [
          border_line(inner_width, title: title),
          *body_lines.map { |line| "|#{line}|" },
          border_line(inner_width)
        ]
      end

      def columns(left_lines, right_lines, left_width:, right_width:, height:)
        column_height = Integer(height)
        left = normalized_lines(left_lines, width: left_width, height: column_height)
        right = normalized_lines(right_lines, width: right_width, height: column_height)

        column_height.times.map do |index|
          "#{left[index]}|#{right[index]}"
        end
      end

      def center_lines(lines, width:, height:)
        target_width = Integer(width)
        target_height = Integer(height)
        visible_lines = lines.first(target_height).map { |line| pad(line, target_width, align: :center) }
        vertical_padding = target_height - visible_lines.length
        top_padding = vertical_padding / 2
        bottom_padding = vertical_padding - top_padding

        blank_lines(top_padding, target_width) + visible_lines + blank_lines(bottom_padding, target_width)
      end

      private

      attr_reader :color

      def color?
        color
      end

      def screen_context(game)
        return :cast if game.pending_game_spell_choices
        return :inventory if inventory_screen?(game)

        :default
      end

      def inventory_screen?(game)
        command = game.history.last&.command.to_s.downcase.strip
        ["inventory", "i"].include?(command)
      end

      def main_panels(game, context)
        return [inventory_lines(game), inventory_sidebar_lines(game)] if context == :inventory
        return [cast_left_lines(game), cast_spell_lines(game)] if context == :cast

        case game.current_scene_name
        when :ruins
          [ruins_map_lines(game), ruins_sidebar_lines(game)]
        when :town
          [town_content_lines, player_sidebar_lines(game)]
        else
          [location_content_lines(game), player_sidebar_lines(game)]
        end
      end

      def main_panel_lines(left_lines, right_lines)
        columns(
          left_lines,
          right_lines,
          left_width: LEFT_PANEL_WIDTH,
          right_width: RIGHT_PANEL_WIDTH,
          height: MAIN_PANEL_HEIGHT
        ).map { |line| "|#{line}|" }
      end

      def header_text(game, context)
        title = "Text Adventures"
        location = location_label(game)
        mode = game.game_mode? ? "game" : "text"
        suffix = {
          inventory: "Inventory",
          cast: "Cast Spell"
        }[context]

        text = "#{title} - #{location} [#{mode}]"
        suffix ? "#{text} - #{suffix}" : text
      end

      def location_label(game)
        scene = game.current_scene
        return "Ruins L#{game.dungeon.level}" if game.current_scene_name == :ruins && game.dungeon
        return "Town of Nee'Peh" if game.current_scene_name == :town
        return scene.display_name if scene.respond_to?(:display_name)

        scene.name.to_s.split("_").map(&:capitalize).join(" ")
      end

      def ruins_map_lines(game)
        return blank_lines(MAIN_PANEL_HEIGHT, LEFT_PANEL_WIDTH) unless game.dungeon

        map_lines = game.dungeon.render.lines.map(&:chomp).drop(1)
        center_lines(map_lines, width: LEFT_PANEL_WIDTH, height: MAIN_PANEL_HEIGHT)
      end

      def town_content_lines
        [
          "Places",
          "",
          " Tavern",
          " Aluriel's Priest",
          " Blacksmith",
          " Armorsmith",
          " Ruins",
          "",
          "Services",
          " Tavern: rest and potions",
          " Priest: heal, cure, tomes",
          " Blacksmith: weapons",
          " Armorsmith: armor"
        ]
      end

      def inventory_lines(game)
        player = game.player
        lines = [
          "Equipped",
          "",
          "Weapon",
          " #{equipment_name(player.equipped_weapon)}",
          "",
          "Armor",
          " #{equipment_name(player.equipped_armor)}",
          "",
          "Bag"
        ]

        entries = player.inventory.entries_list
        if entries.empty?
          lines << " empty"
        else
          entries.each_with_index do |entry, index|
            lines << " #{index + 1} #{entry.quantity}x #{entry.item.display_name}"
          end
        end

        lines
      end

      def inventory_sidebar_lines(game)
        player = game.player
        [
          player.name,
          "HP #{bar(player.health.current, player.health.max)} #{player.health.current}/#{player.health.max}",
          "LV #{player.overall_level} XP #{player.overall_experience}/#{player.progression.xp_required_for(player.overall_level)}",
          "Gold #{player.gold}",
          "",
          "Skills",
          "Sword #{player.progression.skill_level(:swordsmanship)}",
          "Spear #{player.progression.skill_level(:spearmanship)}",
          "Dagger #{player.progression.skill_level(:dagger_mastery)}",
          "Combat #{player.progression.skill_level(:combat_magic)}",
          "Nature #{player.progression.skill_level(:nature_magic)}",
          "",
          "Commands",
          "use <item>",
          "equip <item>",
          "drop <item>"
        ]
      end

      def cast_left_lines(game)
        return ruins_map_lines(game) if game.current_scene_name == :ruins
        return town_content_lines if game.current_scene_name == :town

        location_content_lines(game)
      end

      def cast_spell_lines(game)
        choices = game.pending_game_spell_choices || []
        lines = [
          "Choose a spell",
          ""
        ]

        if choices.empty?
          lines << "No known spells"
        else
          choices.each_with_index do |spell, index|
            lines << "#{index + 1} #{spell.display_name}"
            lines << "  #{spell.description}"
          end
        end

        lines + ["", "0 Cancel"]
      end

      def location_content_lines(game)
        case game.current_scene_name
        when :blacksmith
          merchant_content_lines("Blacksmith", "Weapons", "show", "buy <weapon>", "sell <weapon>", "go town")
        when :armorsmith
          merchant_content_lines("Armorsmith", "Armor", "show", "buy <armor>", "sell <armor>", "go town")
        when :priest
          merchant_content_lines("Aluriel's Priest", "Services", "heal", "cure", "show tomes", "buy <tome>", "go town")
        when :tavern
          merchant_content_lines("Tavern", "Services", "sleep", "rent room", "show potions", "buy <potion>", "go town")
        else
          [
            location_label(game),
            "",
            "Use help to see available commands."
          ]
        end
      end

      def merchant_content_lines(title, subtitle, *commands)
        [
          title,
          "",
          subtitle,
          "",
          *commands.map { |command| " #{command}" }
        ]
      end

      def ruins_sidebar_lines(game)
        player_sidebar_lines(game, compact: true) + nearby_lines(game) + enemy_lines(game)
      end

      def player_sidebar_lines(game, compact: false)
        player = game.player
        lines = [
          player.name,
          "HP #{bar(player.health.current, player.health.max)} #{player.health.current}/#{player.health.max}",
          "LV #{player.overall_level} XP #{player.overall_experience}/#{player.progression.xp_required_for(player.overall_level)}",
          "Gold #{player.gold}",
          "Wpn #{equipment_name(player.equipped_weapon)}",
          "Arm #{equipment_name(player.equipped_armor)}",
          "Status #{status_text(player.status_effects)}"
        ]

        return lines + [""] if compact

        [
          lines[0],
          lines[1],
          lines[2],
          lines[3],
          "",
          "Equipment",
          lines[4],
          lines[5],
          "",
          lines[6]
        ]
      end

      def nearby_lines(game)
        return [] unless game.dungeon

        enemy_position = game.dungeon.adjacent_enemy_position
        loot_position = game.dungeon.nearby_loot_position

        [
          "Adjacent",
          "E #{enemy_label(game, enemy_position)}",
          "@ #{loot_label(game, loot_position)}",
          ""
        ]
      end

      def enemy_lines(game)
        return [] unless game.battle

        creature = game.battle.creature
        [
          "Enemy",
          creature.display_name,
          "HP #{bar(creature.health.current, creature.health.max)} #{creature.health.current}/#{creature.health.max}",
          "Status #{status_text(creature.active_statuses)}"
        ]
      end

      def enemy_label(game, position)
        return "none" unless position

        creature_id = game.dungeon.enemy_at(position)
        ContentCatalog.creature(creature_id).display_name
      end

      def loot_label(game, position)
        return "none" unless position

        loot = game.dungeon.loot_at(position)
        return "none" unless loot && !loot.empty?

        item = loot.first
        return item.display_name if item

        "#{loot.gold}g"
      end

      def equipment_name(equipment)
        return "none" unless equipment
        return equipment.display_name if equipment.respond_to?(:display_name)

        equipment.name
      end

      def status_text(statuses)
        values = Array(statuses)
        return "none" if values.empty?

        values.map { |status| status.to_s.tr("_", " ") }.join(", ")
      end

      def log_lines(game)
        recent_lines = game.history.last&.response.to_s.lines.map(&:chomp) || []
        meaningful_lines = recent_lines.select { |line| loggable_line?(line) }.last(LOG_HEIGHT)
        normalized_lines(meaningful_lines, width: LOG_WIDTH, height: LOG_HEIGHT).map do |line|
          "|#{line}|"
        end
      end

      def loggable_line?(line)
        text = line.to_s.strip
        return false if text.empty?
        return false if text.match?(/\A[#.?xE@]+\z/)
        return false if text.match?(/\ARuins Level \d+\z/)
        return false if text == "Here you can:"
        return false if text == "You can:"
        return false if text == "Global commands:"
        return false if text.match?(/\Ago [A-Z]/)
        return false if text.match?(/\A(go|look|attack|spellbook|cast|loot|inventory|equip|use|drop|level|skills|help|show|buy|sell|agree|no|heal|cure|sleep|rent|rest)(?: .*)? - /)

        true
      end

      def controls_text(game, context)
        return "use/equip/drop <item> | h help | continue with any command" if context == :inventory
        return "1-9 cast | 0 cancel" if context == :cast

        if game.game_mode?
          return "WASD move | Enter attack | c cast | i inventory | l loot | h help | text" if game.current_scene_name == :ruins

          return "i inventory | c cast | h help | text | type travel/shop commands normally"
        end

        case game.current_scene_name
        when :ruins
          "go <dir> | attack | cast <spell> | inventory | loot | help | game"
        when :town
          "go <place> | inventory | spellbook | level | skills | game | help"
        else
          "help | inventory | spellbook | level | skills | game"
        end
      end

      def full_border
        colorize("+#{'-' * (width - 2)}+", :border)
      end

      def split_border
        colorize("+#{'-' * LEFT_PANEL_WIDTH}+#{'-' * RIGHT_PANEL_WIDTH}+", :border)
      end

      def full_line(value, style: nil)
        line = "|#{pad(value, width - 2)}|"
        style ? colorize(line, style) : line
      end

      def colorize(value, style)
        return value unless color?

        "#{ANSI.fetch(style)}#{value}#{ANSI.fetch(:reset)}"
      end

      def normalized_lines(lines, width:, height:)
        target_width = Integer(width)
        target_height = Integer(height)
        normalized = lines.first(target_height).map { |line| pad(line, target_width) }
        normalized + blank_lines(target_height - normalized.length, target_width)
      end

      def border_line(inner_width, title: nil)
        return "+#{'-' * inner_width}+" unless title

        label = " #{truncate(title, [inner_width - 2, 0].max)} "
        remaining = inner_width - label.length
        return "+#{truncate(label, inner_width)}+" if remaining.negative?

        "+#{label}#{'-' * remaining}+"
      end
    end
  end
end
