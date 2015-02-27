class TextAdventures::Engine::Thing::Armor < TextAdventures::Engine::Thing
  attr_reader :defense

  def initialize(options = {})
    raise "defense is required" unless options[:defense]
    @defense = options[:defense]
    super
  end

  def absorb(damage, hit_rate)
    damage = damage - resistance(hit_rate)
    damage > 0 ? damage : 0
  end

  # resistance is the inverse of hit rate
  def resistance(hit_rate)
    rate = 100 - hit_rate
    ((defense / 100.0) * rate).to_i
  end

end