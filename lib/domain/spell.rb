module TextAdventures
  class Spell
    VALID_KINDS = %i[damage healing cure].freeze

    attr_reader :name, :display_name, :level, :kind, :damage_range,
                :healing_range, :status, :status_chance

    def self.for(name, level: 1)
      case normalize_name(name)
      when "heal"
        heal(level: level)
      when "fireball"
        fireball(level: level)
      when "ice bolt"
        ice_bolt(level: level)
      when "cure"
        cure(level: level)
      else
        raise ArgumentError, "unknown spell: #{name}"
      end
    end

    def self.heal(level: 1)
      healing_min = 10 + ((level - 1) * 5)
      healing_max = 30 + ((level - 1) * 8)
      new(
        name: "Heal",
        level: level,
        kind: :healing,
        healing_range: healing_min..healing_max
      )
    end

    def self.fireball(level: 1)
      damage_min = 12 + ((level - 1) * 6)
      damage_max = 22 + ((level - 1) * 10)
      new(
        name: "Fireball",
        level: level,
        kind: :damage,
        damage_range: damage_min..damage_max
      )
    end

    def self.ice_bolt(level: 1)
      damage_min = 5 + ((level - 1) * 3)
      damage_max = 10 + ((level - 1) * 8)
      new(
        name: "Ice Bolt",
        level: level,
        kind: :damage,
        damage_range: damage_min..damage_max,
        status: :freeze,
        status_chance: level + 1
      )
    end

    def self.cure(level: 1)
      new(name: "Cure", level: level, kind: :cure)
    end

    def self.normalize_name(value)
      value.to_s.downcase.gsub(/[^a-z0-9]+/, " ").strip.squeeze(" ")
    end

    def initialize(
      name:,
      level: 1,
      kind:,
      display_name: name,
      damage_range: nil,
      healing_range: nil,
      status: nil,
      status_chance: 0
    )
      @name = self.class.normalize_name(name)
      @display_name = display_name
      @level = level
      @kind = validate_kind(kind)
      @damage_range = damage_range
      @healing_range = healing_range
      @status = status
      @status_chance = status_chance
    end

    def command_name
      name
    end

    def matches?(query)
      command_name == self.class.normalize_name(query)
    end

    def level_up
      self.class.for(command_name, level: level + 1)
    end

    def damage?
      kind == :damage
    end

    def healing?
      kind == :healing
    end

    def cure?
      kind == :cure
    end

    def description
      case kind
      when :damage
        damage_description
      when :healing
        "Recovery #{healing_range.begin}~#{healing_range.end} of health"
      when :cure
        "Remove harmful status effects"
      end
    end

    private

    def validate_kind(value)
      kind = value.to_sym
      return kind if VALID_KINDS.include?(kind)

      raise ArgumentError, "unknown spell kind: #{value}"
    end

    def damage_description
      text = "Causes #{damage_range.begin}~#{damage_range.end} of damage"
      return text unless status

      "#{text}, with #{status_chance}% chance to #{status} your enemy"
    end
  end
end
