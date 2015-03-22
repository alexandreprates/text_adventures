# This is a superclass playabe and not playable characteres
# must be support to basic attributes and life
class TextAdventures::Engine::Character
  attr_reader :name
  attr_accessor :hp, :level, :weapon, :armor

  def initialize(options = {})
    raise "character must have a name" unless options.has_key? :name

    @name = options[:name]
    @level = options[:level] || 1
    @hp = options[:hp] || max_hp
    equip_weapon options[:weapon]
    equip_armor options[:armor]
  end

  def dead?
    hp < 1
  end

  def hit!(points, hit_rate = 0)
    damage = armor_defense(points, hit_rate)
    if damage > hp
      @hp = 0
    else
      @hp -= damage
    end
  end

  def max_hp
    2 + (level * 2.4).to_i
  end

  def to_s
    self.name
  end

  def attack(target)
    return false unless target.respond_to? :hit!
    return false if target.dead?
    return false if weapon.nil?

    damage = weapon.damage(hit_rate)
    target.hit! damage
  end

  def say(message)
    puts "#{self} say: #{message}"
  end

  private

  # hit rate is the accuracy of the hit, the higher it is the more damage is
  # generated and lower the defense rate
  def hit_rate
    rand(100)
  end

  def armor_defense(points, hit_rate)
    if armor
      points - armor.absorb(points, hit_rate)
    else
      points
    end
  end

  def equip_weapon(weapon)
    @weapon = weapon if weapon && weapon.is_weapon?
  end

  def equip_armor(armor)
    @armor = armor if armor && armor.is_armor?
  end

end
