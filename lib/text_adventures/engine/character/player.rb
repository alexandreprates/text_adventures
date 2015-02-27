class TextAdventures::Engine::Character::Player < TextAdventures::Engine::Character
  MAX_LEVEL = 50

  attr_accessor :xp

  def initialize(options = {})
    super(options)
    @xp = options[:xp] || 0
  end

  def xp=(value)
    @xp = value
    level_up! if can_level_up?
    @xp
  end

  def max_xp
    5 + (self.level * 1.618033).to_i
  end

  def equip(item)
    case item
    when TextAdventures::Engine::Thing::Weapon
      !!@weapon = item
    when TextAdventures::Engine::Thing::Armor
      !!@armor = item
    else
      false
    end
  end

  private

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

end