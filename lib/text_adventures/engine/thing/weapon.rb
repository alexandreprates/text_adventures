class TextAdventures::Engine::Thing::Weapon < TextAdventures::Engine::Thing
  attr_accessor :attack, :defense

  def initialize(options = {})
    super options
    raise "attack is required" unless options[:attack].to_i > 0
    @attack = options[:attack].to_i
    @defense = options[:defense].to_i if options.has_key? :defense
  end

  def has_defense?
    !!defense
  end

  def info
    data = ["atk: #{attack}"]
    data << "def: #{defense}" if has_defense?
    "#{self} (#{data.join ', '})"
  end

  def damage(hit_rate)
    ((attack / 100.0) * hit_rate).to_i
  end

  def is_weapon?
    true
  end

  def is_equippable?
    true
  end

end