# class to control experience and leveling
module TextAdventures::Engine::Leveled
  LEVEL_XP_RATE = 1.618

  attr_reader :level

  def level
    @level ||= 1
  end

  def xp
    xp_range.current
  end

  def level_up!
    new_level = level + 1
    @level = new_level
    @xp_range = ::Range.new level_up_xp
    new_level
  end

  def gain_xp(amount)
    while amount > 0
      amount = xp_range.inc!(amount)
      level_up! if amount > 0
    end
    level
  end

  def xp_to_up
    xp_range.max - xp_range.current
  end

  def level_max_xp
    xp_range.max
  end

  private

  def xp_range
    @xp_range ||= ::Range.new 10
  end

  def level_up_xp
    ((level + 1.3) * LEVEL_XP_RATE).ceil
  end

end