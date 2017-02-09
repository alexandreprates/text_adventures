class Increasable
  attr_reader :value
  alias_method :current, :value

  def initialize(value = 0)
    @value = value
  end

  def +(amount)
    self.value + amount
  end

  def -(amount)
    self.value - amount
  end

  def ==(amount)
    @value == amount
  end

  def inc!
    @value += 1
  end

  def dec!
    @value -= 1
  end

  def to_s
    value.to_s
  end

end