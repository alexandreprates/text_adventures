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
                :loot_table, :status_effects, :active_statuses

    def self.giant_spider
      ContentCatalog.creature("giant_spider")
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
      status_effects: [],
      active_statuses: []
    )
      @name = self.class.normalize_name(name)
      @display_name = name
      @health = Extent.new(health, max: max_health)
      @defense = defense
      @attacks = attacks.freeze
      @loot_table = loot_table.freeze
      @status_effects = status_effects.freeze
      @active_statuses = active_statuses.map { |status| normalize_status(status) }.uniq
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

    def apply_status(status)
      normalized_status = normalize_status(status)
      active_statuses << normalized_status unless active_statuses.include?(normalized_status)
      self
    end

    def clear_status(status)
      active_statuses.delete(normalize_status(status))
      self
    end

    def status?(status)
      active_statuses.include?(normalize_status(status))
    end

    private

    attr_writer :health

    def normalize_status(status)
      status.to_s.downcase.strip.tr(" ", "_").to_sym
    end
  end
end
