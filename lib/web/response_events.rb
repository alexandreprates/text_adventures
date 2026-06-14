module TextAdventures
  module Web
    class ResponseEvents
      def self.call(response)
        new(response).to_a
      end

      def initialize(response)
        @response = response.to_s
      end

      def to_a
        lines.filter_map do |line|
          text = line.strip
          next if text.empty?
          next if non_log_text?(text)

          {
            type: event_type(text),
            text: text
          }
        end
      end

      private

      attr_reader :response

      def lines
        response.lines.map(&:chomp)
      end

      def event_type(text)
        return "movement" if text.start_with?("You move ", "You descend ")
        return "travel.changed_scene" if text.start_with?("You go to ", "You are now ")
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

      def non_log_text?(text)
        map_row?(text) ||
          section_heading?(text) ||
          command_affordance?(text) ||
          symbol_legend?(text)
      end

      def map_row?(text)
        text.match?(/\A[?#.xE@P>]+\z/)
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
        text.match?(/\A[?xE@P>.#] - /)
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
