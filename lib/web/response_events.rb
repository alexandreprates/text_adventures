module TextAdventures
  module Web
    class ResponseEvents
      def self.call(response, context: {})
        new(response, context: context).to_a
      end

      def initialize(response, context: {})
        @response = response.to_s
        @context = context
      end

      def to_a
        event_texts.each_with_index.map do |text, sequence|
          event_for(text, sequence)
        end
      end

      private

      attr_reader :response, :context

      def event_texts
        lines.filter_map do |line|
          text = line.strip
          next if text.empty?
          next if non_log_text?(text)

          text
        end
      end

      def lines
        response.lines.map(&:chomp)
      end

      def event_for(text, sequence)
        type = event_type(text)
        event = {
          type: type,
          text: text,
          sequence: sequence
        }
        effect = combat_effect(text) if type == "combat.damage"
        event[:effect] = effect if effect
        event.merge(structured_fields(type, text))
      end

      def structured_fields(type, text)
        case type
        when "movement"
          movement_fields(text)
        when "travel.changed_scene"
          { actor: "player", action: "travel", outcome: "success", duration_ms: 360 }
        when "combat.damage"
          combat_fields(text)
        when "combat.defeated"
          { actor: "player", target: "enemy", action: "defeat", outcome: "defeated", duration_ms: 900 }
        when "loot.collected"
          { actor: "player", target: "loot", action: "collect", outcome: "success", duration_ms: 640 }
        when "loot.dropped"
          { actor: "world", target: "loot", action: "drop", outcome: "success", duration_ms: 480 }
        when "error.invalid_action"
          { actor: "player", action: "invalid", outcome: "rejected" }
        else
          { actor: "world", action: type.split(".").last }
        end
      end

      def movement_fields(text)
        direction = action_payload["direction"] || text[/\AYou move (up|right|down|left)/, 1]
        fields = {
          actor: "player",
          action: text.start_with?("You descend ") ? "descend" : "move",
          outcome: "success",
          duration_ms: 300
        }
        fields[:facing] = direction if direction
        fields[:from] = context.fetch(:from) if context[:from]
        fields[:to] = context.fetch(:to) if context[:to]
        fields
      end

      def combat_fields(text)
        player_is_actor = text.start_with?("You ")
        {
          actor: player_is_actor ? "player" : "enemy",
          target: player_is_actor ? "enemy" : "player",
          action: text.start_with?("You cast ") ? "cast" : "attack",
          outcome: "hit",
          duration_ms: 520
        }
      end

      def action_payload
        @action_payload ||= context.fetch(:action, {}).transform_keys(&:to_s)
      end

      def event_type(text)
        return "movement" if text.start_with?("You move ", "You descend ")
        return "travel.changed_scene" if text.start_with?("You go to ", "You are now ", "You teleport to ", "You return through the portal ")
        return "combat.damage" if text.match?(/\A(?:You|.+) (?:attack|attacks|cast|hits?|bites?|strikes?).* causing \d+ of damage/)
        return "combat.defeated" if text.match?(/(?:defeated|has fallen|is dead)/i)
        return "loot.collected" if text.match?(/\b(?:collected|loot|picked up)\b/i)
        return "loot.dropped" if text.match?(/\b(?:dropped|drops)\b/i)
        return "inventory.equipped" if text.start_with?("Equipped ")
        return "inventory.used" if text.start_with?("Used ")
        return "merchant.purchase" if text.match?(/\b(?:Bought|Purchased)\b/)
        return "merchant.sale" if text.match?(/\bSold\b/)
        return "error.invalid_action" if error_text?(text)

        "message"
      end

      def combat_effect(text)
        return "magic" if text.start_with?("You cast ")
        return "slash" if text.match?(/\AYou attack /)
        return "slash" if text.match?(/\A.+ attacks you with /)

        nil
      end

      def non_log_text?(text)
        map_row?(text) ||
          section_heading?(text) ||
          command_affordance?(text) ||
          symbol_legend?(text)
      end

      def map_row?(text)
        text.match?(/\A[?#.xE@P<>]+\z/)
      end

      def section_heading?(text)
        text.match?(/\ARuins Level \d+\z/) ||
          [
            "Here you can:",
            "You can:",
            "Global commands:",
            "Destinations:",
            "Movement:",
            "Combat:",
            "Map symbols:"
          ].include?(text)
      end

      def command_affordance?(text)
        text.match?(/\A(?:agree|no|go|show|buy|sell|sleep|rent room|rest|inventory|spellbook|level|skills|help|look|attack|loot|cast|equip|use|drop)\b/)
      end

      def symbol_legend?(text)
        text.match?(/\A[?xE@P<>.#] - /)
      end

      def error_text?(text)
        text.start_with?(
          "Unknown command:",
          "Missing target",
          "No command entered.",
          "You cannot",
          "You do not",
          "Item not found:"
        )
      end
    end
  end
end
