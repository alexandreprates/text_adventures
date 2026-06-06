module TextAdventures
  class Creature
    Attack = Struct.new(:name, :damage_range, :status, :status_chance, keyword_init: true) do
      def command_name
        Creature.normalize_name(name)
      end

      def matches?(query)
        command_name == Creature.normalize_name(query)
      end
    end

    attr_reader :name, :display_name, :health, :attacks, :defense,
                :loot_table, :status_effects

    def self.giant_spider
      new(
        name: "Giant Spider",
        health: 35,
        defense: 1,
        attacks: [
          Attack.new(name: "Bite", damage_range: 2..4),
          Attack.new(name: "Poison Bite", damage_range: 1..3, status: :poison, status_chance: 35)
        ],
        loot_table: [
          Item.tome("Tome of Freezing", price: 25, spell: "Ice Bolt")
        ],
        status_effects: [:poison]
      )
    end

    def self.normalize_name(value)
      value.to_s.downcase.gsub(/[^a-z0-9]+/, " ").strip.squeeze(" ")
    end

    def initialize(
      name:,
      health:,
      max_health: health,
      defense: 0,
      attacks: [],
      loot_table: [],
      status_effects: []
    )
      @name = self.class.normalize_name(name)
      @display_name = name
      @health = Extent.new(health, max: max_health)
      @defense = defense
      @attacks = attacks.freeze
      @loot_table = loot_table.freeze
      @status_effects = status_effects.freeze
    end

    def take_damage(amount)
      self.health = health - amount
      self
    end

    def alive?
      health.current > health.min
    end

    def dead?
      !alive?
    end

    def attack_named(query)
      attacks.find { |attack| attack.matches?(query) }
    end

    def can_apply_status?(status)
      status_effects.include?(status)
    end

    private

    attr_writer :health
  end
end
