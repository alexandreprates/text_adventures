class Player
  attr_reader :name 
  attr_accessor :con, :str, :int
  attr_accessor :level, :life, :kills
  attr_accessor :inventory
  attr_accessor :body, :left_hand, :right_hand

  MAX_LEVEL = 50

  def initialize(name)
    @name = name

    @con = 5
    @str = 5
    @int = 5
    
    @level = 1
    @life = max_life
    @kills = 0

    @body, @left_hand, @right_hand = nil

    @inventory = []
  end

  def max_life
    (con * 1.2 + level * 1.8).to_i
  end

  def max_kill
    (5 + (level * 1.2) - kills).to_i if level < MAX_LEVEL
  end

  def kills_up!
    @kills += 1
  end

  def level_up!
    if level < MAX_LEVEL
      @level += 1
      @con = (@level * 1.5).to_i
      @int = (@level * 1.5).to_i
      @str = (@level * 1.5).to_i
      @kills = 0
    end
    level
  end

  def to_s
    "[#{level}] #{name} (#{life}/#{max_life})"
  end

  def equip(what)
    self.send("#{what.equip_in}=", what)
  end

  def unequip(where)
    self.send("#{where}=", nil)
  end

end

class Item
  attr_reader :name, :value
end

module Equipament
  attr_reader :equip_in

  def initialize(name, equip_in)
    @name = name
    @equip_in = equip_in
  end
end


class Weapon < Item
  include Equipament
end

class Armor < Item
  include Equipament
end