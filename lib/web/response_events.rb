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
