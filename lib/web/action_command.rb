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

        target = string_field(definition.fetch(:field))
        raise ArgumentError, "Action field #{definition.fetch(:field)} is required for #{action}." if target.empty?

        "#{definition.fetch(:verb)} #{target}"
      end

      private

      attr_reader :payload

      def string_field(name)
        payload.fetch(name, "").to_s.strip.squeeze(" ")
      end
    end
  end
end
