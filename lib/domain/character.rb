module TextAdventures
  class Character
    Equipment = Struct.new(:name, :attack, :defense, keyword_init: true)

    DEFAULT_NAME = "Adventurer".freeze
    DEFAULT_HEALTH = 30
    DEFAULT_GOLD = 100
    DEFAULT_BASE_ATTACK = 1
    DEFAULT_BASE_DEFENSE = 0
    STARTER_WEAPON = Equipment.new(name: "Sword", attack: 10, defense: 0).freeze
    STARTER_ARMOR = Equipment.new(name: "Leather Armor", attack: 0, defense: 20).freeze

    attr_reader :health
    attr_reader :spells
    attr_accessor :name, :gold, :base_attack, :base_defense,
                  :equipped_weapon, :equipped_armor

    def initialize(
      name: DEFAULT_NAME,
      health: DEFAULT_HEALTH,
      max_health: health,
      gold: DEFAULT_GOLD,
      base_attack: DEFAULT_BASE_ATTACK,
      base_defense: DEFAULT_BASE_DEFENSE,
      equipped_weapon: STARTER_WEAPON,
      equipped_armor: STARTER_ARMOR,
      spells: []
    )
      @name = name
      @health = Extent.new(health, max: max_health)
      @gold = gold
      @base_attack = base_attack
      @base_defense = base_defense
      @equipped_weapon = equipped_weapon
      @equipped_armor = equipped_armor
      @spells = {}
      spells.each { |spell| learn_spell(spell) }
    end

    def take_damage(amount)
      self.health = health - amount
      self
    end

    def heal(amount)
      self.health = health + amount
      self
    end

    def alive?
      health.current > health.min
    end

    def dead?
      !alive?
    end

    def attack
      base_attack + equipment_value(equipped_weapon, :attack)
    end

    def defense
      base_defense + equipment_value(equipped_armor, :defense)
    end

    def learn_spell(spell)
      current_spell = spells[spell.command_name]
      spells[spell.command_name] = current_spell ? current_spell.level_up : spell
    end

    def learn_spell_from_tome(tome)
      learn_spell(Spell.for(tome.spell))
    end

    def known_spell?(query)
      spells.key?(Spell.normalize_name(query))
    end

    def spellbook
      return "You cannot cast any spells yet." if spells.empty?

      lines = ["You can cast:"]
      spell_list.each { |spell| lines << " #{spellbook_line(spell)}" }
      lines.join("\n")
    end

    private

    attr_writer :health

    def equipment_value(equipment, attribute)
      return 0 unless equipment.respond_to?(attribute)

      equipment.public_send(attribute).to_i
    end

    def spell_list
      spells.values.sort_by(&:display_name)
    end

    def spellbook_line(spell)
      "1x #{spell.display_name} (level #{spell.level}) - #{spell.description}"
    end
  end
end
