class TextAdventures::Engine::Character::Player < TextAdventures::Engine::Character
  MAX_LEVEL = 50
  INVENTORY_SLOTS = 10

  attr_accessor :xp, :inventory

  def initialize(options = {})
    @xp = options[:xp] || 0
    @inventory = options[:inventory] || []
    super(options)
  end

  def xp=(value)
    @xp = value
    level_up! if can_level_up?
    @xp
  end

  def max_xp
    5 + (self.level * 1.618033).to_i
  end

  def equip(thing)
    return false unless @inventory.include? thing
    if thing.is_weapon?
      !!equip_weapon(thing)
    elsif thing.is_armor?
      !!equip_armor(thing)
    end
  end

  def pick_up(thing)
    !!(inventory << thing) if can_pick_up?(thing) && !inventory_full?
  end

  def unequip_weapon
    return false unless has_weapon?
    @inventory.push @weapon
    @weapon = nil
  end

  def unequip_armor
    return false unless has_armor?
    @inventory.push @armor
    @armor = nil
  end

  private

  def equip_weapon(weapon)
    unequip_weapon if has_weapon?
    @inventory.delete weapon
    @weapon = weapon
  end

  def has_weapon?
    !!@weapon
  end

  def equip_armor(armor)
    unequip_armor if has_armor?
    @inventory.delete armor
    @armor = armor
  end

  def has_armor?
    !!@armor
  end

  def level_up!
    return false if level == MAX_LEVEL
    _max_xp = max_xp
    @level += 1
    @hp = max_xp
    @xp = @xp - _max_xp
    level_up! if can_level_up?
  end

  def can_level_up?
    xp >= max_xp
  end

  def can_pick_up?(thing)
    thing.respond_to?(:can_pick_up?) && thing.can_pick_up?
  end

  def inventory_full?
    inventory.size >= INVENTORY_SLOTS
  end

end