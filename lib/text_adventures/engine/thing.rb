class TextAdventures::Engine::Thing
  attr_reader :name, :price

  def initialize(options = {})
    raise "name is required" unless options[:name]
    raise "price is required" unless options[:price].to_i > 0

    @name = options[:name]
    @price = options[:price]
  end

  def can_pick_up?
    true
  end

  def to_s
    name
  end

end