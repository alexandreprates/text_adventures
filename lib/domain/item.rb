module TextAdventures
  class Item
    VALID_TYPES = %i[weapon armor potion tome junk].freeze

    attr_reader :name, :display_name, :price, :type,
                :attack, :defense, :recovery, :spell, :armor_class,
                :weapon_class

    def self.weapon(name, price:, attack:, defense: 0, weapon_class: nil)
      new(
        name: name,
        price: price,
        type: :weapon,
        attack: attack,
        defense: defense,
        weapon_class: weapon_class
      )
    end

    def self.armor(name, price:, defense:, armor_class: nil)
      new(name: name, price: price, type: :armor, defense: defense, armor_class: armor_class)
    end

    def self.potion(name, price:, recovery:)
      new(name: name, price: price, type: :potion, recovery: recovery)
    end

    def self.tome(name, price:, spell:)
      new(name: name, price: price, type: :tome, spell: spell)
    end

    def self.junk(name, price:)
      new(name: name, price: price, type: :junk)
    end

    def self.normalize_name(value)
      value.to_s.downcase.gsub(/[^a-z0-9]+/, " ").strip.squeeze(" ")
    end

    def initialize(
      name:,
      price:,
      type:,
      display_name: name,
      attack: 0,
      defense: 0,
      recovery: 0,
      spell: nil,
      armor_class: nil,
      weapon_class: nil
    )
      @name = self.class.normalize_name(name)
      @display_name = display_name
      @price = price
      @type = validate_type(type)
      @attack = attack
      @defense = defense
      @recovery = recovery
      @spell = spell && self.class.normalize_name(spell)
      @armor_class = armor_class && self.class.normalize_name(armor_class).to_sym
      @weapon_class = weapon_class && self.class.normalize_name(weapon_class).to_sym
    end

    def command_name
      name
    end

    def matches?(query)
      command_name == self.class.normalize_name(query)
    end

    def ==(other)
      other.respond_to?(:command_name) && command_name == other.command_name
    end

    def weapon?
      type == :weapon
    end

    def armor?
      type == :armor
    end

    def potion?
      type == :potion
    end

    def tome?
      type == :tome
    end

    def junk?
      type == :junk
    end

    private

    def validate_type(value)
      type = value.to_sym
      return type if VALID_TYPES.include?(type)

      raise ArgumentError, "unknown item type: #{value}"
    end
  end
end
