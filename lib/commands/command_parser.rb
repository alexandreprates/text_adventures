module TextAdventures
  class CommandParser
    Command = Struct.new(:verb, :target, :raw, :known?, :message, keyword_init: true) do
      def unknown?
        !known?
      end
    end

    TARGETED_VERBS = %i[
      buy
      cast
      drop
      equip
      go
      sell
      trade
      use
    ].freeze

    STANDALONE_VERBS = %i[
      agree
      attack
      cure
      heal
      help
      inventory
      level
      look
      loot
      no
      show
      skills
      sleep
      spellbook
    ].freeze

    VERB_ALIASES = {
      invetory: :inventory,
      rent: :sleep,
      rest: :sleep,
      spell: :cast
    }.freeze

    def self.parse(input)
      new.parse(input)
    end

    def parse(input)
      raw = input.to_s
      normalized = normalize(raw)
      return unknown(raw, nil, "No command entered.") if normalized.empty?

      verb_text, target_text = normalized.split(" ", 2)
      verb = normalize_verb(verb_text)
      target = target_text&.strip

      return targeted(raw, verb, target) if TARGETED_VERBS.include?(verb)
      return standalone(raw, verb) if STANDALONE_VERBS.include?(verb)

      unknown(raw, verb_text, "Unknown command: #{verb_text}.")
    end

    private

    def normalize(value)
      value.downcase.strip.squeeze(" ")
    end

    def normalize_verb(value)
      verb = value.to_sym
      VERB_ALIASES.fetch(verb, verb)
    end

    def targeted(raw, verb, target)
      return unknown(raw, verb, "Missing target for #{verb}.") if target.nil? || target.empty?

      Command.new(verb: verb, target: target, raw: raw, known?: true, message: nil)
    end

    def standalone(raw, verb)
      Command.new(verb: verb, target: nil, raw: raw, known?: true, message: nil)
    end

    def unknown(raw, verb, message)
      Command.new(verb: verb&.to_sym, target: nil, raw: raw, known?: false, message: message)
    end
  end
end
