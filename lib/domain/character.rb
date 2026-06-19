module TextAdventures
  class Character
    Equipment = Struct.new(:name, :attack, :defense, keyword_init: true) do
      def command_name
        Item.normalize_name(name)
      end

      def display_name
        name
      end

      def weapon?
        attack.to_i.positive?
      end

      def armor?
        !weapon? && defense.to_i.positive?
      end

      def potion?
        false
      end

      def tome?
        false
      end

      def junk?
        false
      end

      def type
        return :weapon if weapon?
        return :armor if armor?

        :equipment
      end

      def price
        0
      end

      def recovery
        0
      end

      def spell
        nil
      end

      def armor_class
        nil
      end

      def weapon_class
        nil
      end
    end
    EquipResult = Struct.new(:success?, :item, :message, keyword_init: true)

    DEFAULT_NAME = "Adventurer".freeze
    DEFAULT_HEALTH = 30
    HEALTH_PER_CLASS_LEVEL = 5
    DEFAULT_GOLD = 100
    DEFAULT_BASE_ATTACK = 1
    DEFAULT_BASE_DEFENSE = 0
    STARTER_POTION_QUANTITY = 5
    STARTER_WEAPON = Equipment.new(name: "Sword", attack: 10, defense: 0).freeze
    STARTER_ARMOR = Equipment.new(name: "Leather Armor", attack: 0, defense: 12).freeze

    attr_reader :health
    attr_reader :spells
    attr_reader :inventory
    attr_reader :status_effects
    attr_reader :progression
    attr_accessor :name, :gold, :base_attack, :base_defense,
                  :equipped_weapon, :equipped_armor

    def initialize(
      name: DEFAULT_NAME,
      health: nil,
      max_health: nil,
      gold: DEFAULT_GOLD,
      base_attack: DEFAULT_BASE_ATTACK,
      base_defense: DEFAULT_BASE_DEFENSE,
      equipped_weapon: STARTER_WEAPON,
      equipped_armor: STARTER_ARMOR,
      spells: [],
      inventory: nil,
      status_effects: [],
      progression: CharacterProgression.new
    )
      @progression = progression
      @health_derived_from_progression = max_health.nil?
      max_health ||= self.class.max_health_for(progression)
      health ||= max_health
      @name = name
      @health = Extent.new(health, max: max_health)
      @gold = gold
      @base_attack = base_attack
      @base_defense = base_defense
      @equipped_weapon = equipped_weapon
      @equipped_armor = equipped_armor
      @spells = {}
      @inventory = inventory || self.class.starter_inventory
      @status_effects = normalize_statuses(status_effects)
      spells.each { |spell| learn_spell(spell) }
    end

    def self.max_health_for(progression)
      gained_class_levels = [progression.total_class_level - CharacterProgression::SKILL_TRACKS.length, 0].max
      DEFAULT_HEALTH + (gained_class_levels * HEALTH_PER_CLASS_LEVEL)
    end

    def self.starter_inventory
      Inventory.new.tap do |inventory|
        inventory.add(Item.potion("Potion of Heal", price: 10, recovery: 20), quantity: STARTER_POTION_QUANTITY)
      end
    end

    def gain_skill_xp(skill, amount)
      previous_max_health = health.max
      progression.add_skill_xp(skill, amount)
      synchronize_derived_health(previous_max_health)
      self
    end

    def skill_experience
      progression.skill_experience
    end

    def skill_levels
      progression.skill_levels
    end

    def overall_experience
      progression.overall_experience
    end

    def overall_level
      progression.overall_level
    end

    def current_class
      progression.current_class
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
      base_attack + equipment_value(equipped_weapon, :attack) + weapon_attack_bonus
    end

    def defense
      base_defense + equipment_value(equipped_armor, :defense) + spear_defense_bonus
    end

    def dagger_critical_bonus
      return 0 unless equipped_weapon_class == :dagger

      skill_bonus(:dagger_mastery) * 3
    end

    def combat_magic_damage_bonus
      skill_bonus(:combat_magic) * 2
    end

    def nature_magic_healing_bonus
      skill_bonus(:nature_magic) * 3
    end

    def equip(item)
      if item.weapon?
        self.equipped_weapon = item
        return EquipResult.new(success?: true, item: item, message: "Equipped #{item.display_name}.")
      end

      if item.armor?
        self.equipped_armor = item
        return EquipResult.new(success?: true, item: item, message: "Equipped #{item.display_name}.")
      end

      EquipResult.new(success?: false, item: item, message: "#{item.display_name} cannot be equipped.")
    end

    def apply_status(status)
      normalized_status = normalize_status(status)
      status_effects << normalized_status unless status_effects.include?(normalized_status)
      self
    end

    def clear_status(status)
      status_effects.delete(normalize_status(status))
      self
    end

    def clear_statuses(*statuses)
      statuses.each { |status| clear_status(status) }
      self
    end

    def status?(status)
      status_effects.include?(normalize_status(status))
    end

    def inventory_report
      Response.new(
        inventory.render,
        "Equipped:",
        " weapon: #{equipment_line(equipped_weapon, :attack)}",
        " armor: #{equipment_line(equipped_armor, :defense)}"
      ).to_text
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

    def level_report
      Response.new(
        "#{name} level #{overall_level}",
        "[#{overall_experience}/#{progression.xp_required_for(overall_level)} XP]"
      ).to_text
    end

    def skills_report
      lines = ["Skills:"]
      CharacterProgression::SKILL_TRACKS.each do |skill|
        lines << " #{skill_label(skill)}: level #{progression.skill_level(skill)} (#{progression.skill_xp(skill)}/#{progression.xp_required_for(progression.skill_level(skill))} XP)"
      end
      lines.join("\n")
    end

    private

    attr_writer :health

    def synchronize_derived_health(previous_max_health)
      return unless @health_derived_from_progression

      new_max_health = self.class.max_health_for(progression)
      gained_health = new_max_health - previous_max_health
      current_health = gained_health.positive? ? new_max_health : health.current
      self.health = Extent.new([current_health, new_max_health].min, max: new_max_health, min: health.min)
    end

    def equipment_value(equipment, attribute)
      return 0 unless equipment.respond_to?(attribute)

      equipment.public_send(attribute).to_i
    end

    def weapon_attack_bonus
      case equipped_weapon_class
      when :sword
        skill_bonus(:swordsmanship) * 2
      when :spear
        skill_bonus(:spearmanship)
      else
        0
      end
    end

    def spear_defense_bonus
      return 0 unless equipped_weapon_class == :spear

      skill_bonus(:spearmanship)
    end

    def skill_bonus(skill)
      [progression.skill_level(skill) - 1, 0].max
    end

    def equipped_weapon_class
      weapon_class_for(equipped_weapon)
    end

    def weapon_class_for(weapon)
      return nil unless weapon
      return weapon.weapon_class if weapon.respond_to?(:weapon_class) && weapon.weapon_class

      normalized_name = Item.normalize_name(weapon.name)
      return :sword if normalized_name.include?("sword")
      return :spear if normalized_name.match?(/spear|halberd|lance/)
      return :dagger if normalized_name.include?("dagger")

      nil
    end

    def spell_list
      spells.values.sort_by(&:display_name)
    end

    def spellbook_line(spell)
      "1x #{spell.display_name} (level #{spell.level}) - #{spell.description}"
    end

    def skill_label(skill)
      skill.to_s.tr("_", " ").split.map(&:capitalize).join(" ")
    end

    def equipment_line(equipment, attribute)
      return "none" unless equipment

      value = equipment_value(equipment, attribute)
      detail = value.positive? ? " (#{attribute_label(attribute)}: #{value})" : ""
      "#{equipment_display_name(equipment)}#{detail}"
    end

    def equipment_display_name(equipment)
      return equipment.display_name if equipment.respond_to?(:display_name)

      equipment.name
    end

    def attribute_label(attribute)
      {
        attack: "Atk",
        defense: "Def"
      }.fetch(attribute)
    end

    def normalize_statuses(statuses)
      statuses.map { |status| normalize_status(status) }.uniq
    end

    def normalize_status(status)
      status.to_s.downcase.strip.tr(" ", "_").to_sym
    end
  end
end
