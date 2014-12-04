module CharBase
  attr_reader :name 
  attr_reader :con, :str, :int
  attr_reader :level, :life
    
  def level
    @level ||= 1
  end

  def life
    @life ||= max_life
  end

  def to_s
    "[#{level}] #{name} (#{life}/#{max_life})"
  end

  private

  def max_life
    (con * 1.2 + level * 1.8).to_i
  end

  def update_attributes
    @con = (level * 1.5).to_i
    @int = (level * 1.5).to_i
    @str = (level * 1.5).to_i
  end

end

module Leveler
  attr_reader :xp

  MAX_LEVEL = 50

  def level
    @level ||= 1
  end

  def xp
    @xp ||= 0
  end

  def next_level
    (5 + (level * 1.2) - xp).to_i if level < MAX_LEVEL
  end

  def xp_up!
    xp # pevents xp be nil
    @xp += 1
  end

  def level_up!
    if level < MAX_LEVEL
      @level += 1
      update_attributes
      @level = 0
    end
    level
  end

end

module Inventory
  attr_reader :inventory

  def inventory
    @inventory ||= []
  end

  def store(object)
    inventory.push object
  end

  def retrive(object)
    inventory.delete object
  end

end

class Player
  include CharBase
  include Level

  attr_reader :body, :left_hand, :right_hand

  def initialize(name)
    @name = name
  end


  def equip(item)
    if item.two_hand?

    else

    end
  end

end



sword = OneHand.new
player = Player.new


class Weapon
  attr_reader :name
  attr_reader :type
  attr_reader :base_damage # precisa ser um range

  # attr_reader :status 

  def damage
    seed.rand(base_damage)
  end

  private

  def seed
    @seed = Random.new(Time.now.to_f)
  end

end

class TwoHand < Weapon
  class 

  def two_hand?
    true
  end

end

class OneHand < Weapon

  def two_hand?
    false
  end

end



# class Item
#   attr_reader :name, :value
# end

# module Equipament
#   attr_reader :equip_in

#   def initialize(name, equip_in)
#     @name = name
#     @equip_in = equip_in
#   end

# end


# class Weapon < Item
#   include Equipament
#   attr_reader :base_damage

#   def initialize(name, equip_in, base_damage)
#     @name = name
#     @equip_in = equip_in
#     @base_damage = base_damage
#     @seed = Random.new(Time.now.to_i)
#   end

#   def damage
#     @seed.rand(base_damage)
#   end

# end

# class Armor < Item
#   include Equipament
# end
