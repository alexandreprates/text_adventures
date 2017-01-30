class Range
  attr_reader :value, :max, :min
  alias_method :current, :value

  # Create new range object.
  #
  # @param value [Integer] current value must be beetween min and max
  #   max [Integer] maximum value
  #   min [Integer] (Optional) minimum value, 0
  def initialize(max, value = 0, min = 0)
    @value = value
    @max = max
    @min = min
  end

  # Sets the max value for range, and adjust the (current) value.
  #
  # @param new_value [Integer] new value to max
  def max=(new_value)
    @max = new_value
    @value = new_value if value > new_value
    new_value
  end

  # Sets the min value for range, and adjust the (current) value
  #
  # @param new_value [Integer] new value to min
  def min=(new_value)
    @min = new_value
    @value = new_value if value < new_value
    new_value
  end

  # Increase the current value
  #
  # @param amount [Integer] amount to be added to current value
  # @return [Integer] Diference between max and new value
  #
  # @example Increase value
  #   range = Range.new(1, 3) #=> #<Range:0x..>
  #   range.inc!(1) #=> 0
  #
  # @example  Increase value to max and return diference
  #   range = Range.new(1, 3) #=> #<Range:0x..>
  #   range.inc!(5) #=> 3
  #   range.current #=> 3
  def inc!(amount)
    @value += amount
    if value > max
      overflow = value
      @value = max
      overflow - max
    else
      0
    end
  end

  # Decrease the current value by _amount_ and return the difference between min
  #
  # @param amount [Integer] amount to be removed to current value
  # @return [Integer] Diference between min and new value
  #
  # @example Decrease value
  #   range = Range.new(1, 2) #=> #<Range:0x...>
  #   range.dec!(1) #=> 0
  #
  # @example Decrease value to min and return the difference
  #   range = Range.new(1, 2) #=> #<Range:0x...>
  #   range.dec!(5) #=> 4
  #   range.current #=> 0
  def dec!(amount)
    @value -= amount
    if value < min
      overflow = value
      @value = min
      (overflow + min).abs
    else
      0
    end
  end

  # Return true if current value is equal to max
  #
  # @return [Boolean] True when current value is equal to max
  def max?
    value == max
  end

  # Return true when the value is equal to min
  #
  # @return [Boolean] True when current value is equal to min
  def min?
    value == min
  end

end
