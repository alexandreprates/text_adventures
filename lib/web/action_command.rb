module TextAdventures
  module Web
    class ActionCommand
      ACTIONS = {
        "agree" => { command: "agree" },
        "attack" => { command: "attack" },
        "cure" => { command: "cure" },
        "heal" => { command: "heal" },
        "help" => { command: "help" },
        "inventory" => { command: "inventory" },
        "level" => { command: "level" },
        "loot" => { command: "loot" },
        "look" => { command: "look" },
        "no" => { command: "no" },
        "show" => { command: "show" },
        "skills" => { command: "skills" },
        "sleep" => { command: "sleep" },
        "spellbook" => { command: "spellbook" },
        "move" => { verb: "go", field: "direction" },
        "travel" => { verb: "go", field: "destination" },
        "buy" => { verb: "buy", field: "item" },
        "sell" => { verb: "sell", field: "item" },
        "trade" => { trade: true },
        "equip" => { verb: "equip", field: "item" },
        "use" => { verb: "use", field: "item" },
        "drop" => { verb: "drop", field: "item" },
        "cast" => { verb: "cast", field: "spell" }
      }.freeze

      def self.call(payload)
        new(payload).command
      end

      def initialize(payload)
        @payload = payload
      end

      def command
        action = string_field("type")
        raise ArgumentError, "Action type is required." if action.empty?

        definition = ACTIONS[action]
        raise ArgumentError, "Unsupported action type: #{action}." unless definition

        return definition.fetch(:command) if definition.key?(:command)
        return trade_command if definition.key?(:trade)

        target = string_field(definition.fetch(:field))
        raise ArgumentError, "Action field #{definition.fetch(:field)} is required for #{action}." if target.empty?

        "#{definition.fetch(:verb)} #{target}"
      end

      private

      attr_reader :payload

      def string_field(name)
        payload.fetch(name, "").to_s.strip.squeeze(" ")
      end

      def trade_command
        buys = item_list("buy")
        sells = item_list("sell")
        segments = []
        segments << "buy=#{buys.join('|')}" if buys.any?
        segments << "sell=#{sells.join('|')}" if sells.any?
        raise ArgumentError, "At least one trade item is required." if segments.empty?

        "trade #{segments.join(';')}"
      end

      def item_list(name)
        value = payload.fetch(name, [])
        values = value.is_a?(Array) ? value : [value]
        values.map { |item| item.to_s.strip.squeeze(" ") }.reject(&:empty?)
      end
    end
  end
end
