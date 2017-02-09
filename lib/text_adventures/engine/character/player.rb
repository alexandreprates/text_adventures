# Class for Playable Character
class TextAdventures::Engine::Character::Player
  attr_reader :name, :str, :dex, :int

  XP_GROW_RATE = 1.61803398875
  BASE_LIFE = 7

  def initialize(name: name, str: 1, dex: 1, int: 1, level: 1, xp: 0, hp: nil)
    @name = name
    @str = str
    @dex = dex
    @int = int
    @level = Increasable.new(level)
    set_xp(xp)
    set_hp(hp)
  end

  # Return Character current level
  # @return [Integer] Character current level
  def level
    @level.current
  end

  # Return Character current xp
  # @return [Integer] Character current xp
  def xp
    @xp.current
  end

  # Return how many points need to level up
  # @return [Integer] points to level up
  def xp_to_up
    ((level * 1.3) * XP_GROW_RATE).ceil
  end

  # Add points to current XP, if points is more than max_xp
  # increase level and set new current xp
  #
  # @return [Integer] Character current _xp_
  def gain_xp(points)
    rest_points = @xp.inc!(points)
    while rest_points > 0
      @level.inc!
      set_xp
      rest_points = @xp.inc!(rest_points)
    end
    xp
  end

  # HP is based on Character level
  # @return [Integer] Character hp points
  def hp
    @hp.current
  end

  # Return true ir Character is alive
  # @return [Boolean] True if hp is more than zero
  def live?
    !@hp.min?
  end

  # Decrease Character HP
  # @return [Boolean] False if character is dead
  def hit(points)
    @hp.dec!(points).zero?
  end

  # Increase Character HP
  # @return [Boolean] False if hp is full
  def heal(points)
    @hp.inc!(points).zero?
  end

  # Max hp points, based on Character level
  # @return [Integer] Character max hp based on level
  def level_max_hp
    ((level * 1.7) + BASE_LIFE).ceil
  end

  # Calculate character attack points (based on current equips/status)
  # @return [Integer] Character attack points
  def attack
    (((str * 1.4) + (level * 1.3)) * 0.3).ceil
  end

  private

  def set_hp(points)
    hp_points = points || level_max_hp
    @hp = Range.new(level_max_hp, hp_points)
  end

  def set_xp(points = 0)
    @xp = Range.new(xp_to_up, points)
  end

end
