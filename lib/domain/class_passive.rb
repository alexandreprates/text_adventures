module TextAdventures
  class ClassPassive
    AFFINITY_LABELS = {
      sword: "sword damage",
      spear: "spear damage",
      dagger: "dagger damage",
      combat_magic: "Combat Magic damage",
      nature_magic: "Nature Magic healing"
    }.freeze

    DEFINITIONS = {
      "Blademaster" => { name: "Perfect Edge", effects: { sword: 15 } },
      "Dragoon" => { name: "Piercing Momentum", effects: { spear: 15 } },
      "Nightblade" => { name: "Lethal Precision", effects: { dagger: 15 } },
      "Arcanist" => { name: "Arcane Supremacy", effects: { combat_magic: 15 } },
      "Druid" => { name: "Primal Communion", effects: { nature_magic: 15 } },
      "Warlord" => { name: "Master of Arms", effects: { sword: 10, spear: 10 } },
      "Duelist" => { name: "Weapon Finesse", effects: { sword: 10, dagger: 10 } },
      "Spellblade" => { name: "Arcane Edge", effects: { sword: 10, combat_magic: 10 } },
      "Warden" => { name: "Verdant Blade", effects: { sword: 10, nature_magic: 10 } },
      "Skirmisher" => { name: "Mobile Arsenal", effects: { spear: 10, dagger: 10 } },
      "Battlemage" => { name: "War Channeling", effects: { spear: 10, combat_magic: 10 } },
      "Sentinel" => { name: "Guardian's Vigor", effects: { spear: 10, nature_magic: 10 } },
      "Hexblade" => { name: "Maledict Edge", effects: { dagger: 10, combat_magic: 10 } },
      "Ranger" => { name: "Wild Hunt", effects: { dagger: 10, nature_magic: 10 } },
      "Mystic" => { name: "Unified Arcana", effects: { combat_magic: 10, nature_magic: 10 } }
    }.freeze

    attr_reader :id, :name, :effects

    def self.for_class(class_name)
      definition = DEFINITIONS[class_name.to_s]
      return unless definition

      new(class_name: class_name, **definition)
    end

    def initialize(class_name:, name:, effects:)
      @id = normalize_id(class_name)
      @name = name
      @effects = effects.transform_keys(&:to_sym).transform_values(&:to_i).freeze
      freeze
    end

    def percent_for(affinity)
      effects.fetch(affinity&.to_sym, 0)
    end

    def apply(amount, affinity:)
      percent = percent_for(affinity)
      return amount.to_i if percent.zero?

      (amount.to_i * (1 + (percent / 100.0))).round
    end

    def description
      bonuses = effects.map do |affinity, percent|
        "+#{percent}% #{AFFINITY_LABELS.fetch(affinity)}"
      end

      "#{bonuses.join(' and ')}."
    end

    private

    def normalize_id(value)
      value.to_s.downcase.gsub(/[^a-z0-9]+/, "_").sub(/\A_+|_+\z/, "")
    end
  end
end
