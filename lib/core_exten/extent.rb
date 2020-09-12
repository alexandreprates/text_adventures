##
# Extent is a class that implements a number with a valid range. In case of operations that exceed this limit, the
# returned value will be the compatible value of the range and the rest will be stored in the overflow attribute.
#
# Example:
#
#  hp = Extent.new(2, max: 5)
#  => #<Extent:0x000055d99a9b5400 @current=2, @max=5, @min=0, @overload=0>
#
#  hp + 1
#  => #<Extent:0x000055d99a9dc2a8 @current=3, @max=5, @min=0, @overload=0>
#
#  hp += 10
#  => #<Extent:0x000055d99a8c91e0 @current=5, @max=5, @min=0, @overload=7>
#
#  hp.current
#  => 5
#
#  hp.max?
#  => true
#
#  xp = Extent.new(0, max: 5)
#  => #<Extent:0x000055d99a8d8ff0 @current=0, @max=5, @min=0, @overload=0>
#
#  xp += 10
#  => #<Extent:0x000055d99a897258 @current=5, @max=5, @min=0, @overload=5>
#
#  xp.max?
#  => true
#
#  xp.overloaded?
#  => true
#
#  xp.overload
#  => 5
class Extent
  attr_reader :current, :min, :max, :overload

  def initialize(current, max: nil, min: 0, overload: 0)
    @current = current
    @max = max || current
    @min = min
    @overload = overload
  end

  def -(value)
    self.class.new(
      sub_in_range(value),
      max: max,
      min: min,
      overload: min_remainder(value)
    )
  end

  def +(value)
    self.class.new(
      sum_in_range(value),
      max: max,
      min: min,
      overload: max_remainder(value)
    )
  end

  def ==(value)
    current == value
  end

  def >(value)
    current > value
  end

  def <(value)
    current < value
  end

  def <=>(value)
    current <=> value
  end

  def max?
    max == current
  end

  def min?
    min == current
  end

  def overloaded?
    overload > 0
  end

  private

  def sum_in_range(value)
    sum = current + value
    sum > max ? max : sum
  end

  def sub_in_range(value)
    sub = current - value
    sub > min ? sub : min
  end

  def max_remainder(value)
    sum = current + value
    sum > max ? sum - max : 0
  end

  def min_remainder(value)
    sub = current - value
    sub < min ? (sub - min).abs : 0
  end

end
