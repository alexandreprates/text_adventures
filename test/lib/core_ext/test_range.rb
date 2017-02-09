require './test/test_helper'

class TestRange < MiniTest::Test
  def setup
    @range = Range.new 10, 5, 1
  end

  def test_initialize
    assert_equal 10, @range.max
    assert_equal 1, @range.min
    assert_equal 5, @range.current

    @short = Range.new 5
    assert_equal 0, @short.min
    assert_equal 5, @short.max
    assert_equal 0, @short.current
  end

  def test_wrong_value_on_init
    range = Range.new(10, 100)
    assert_equal 10, range
  end

  def test_change_max_attribute
    @range.max = 5
    assert_equal 5, @range.max
  end

  def test_change_max_reset_current
    @range.max = 4
    assert_equal 4, @range.current
  end

  def test_change_min_attribute
    assert_equal 1, @range.min
    @range.min = 5
    assert_equal 5, @range.min
    assert_equal 5, @range.current
  end

  def test_change_min_reset_current
    @range.min = 6
    assert_equal 6, @range.current
  end

  def test_inc_value
    assert_equal 0, @range.inc!(2)
    assert_equal 7, @range.current
  end

  def test_inc_return_difference
    assert_equal 5, @range.inc!(10)
    assert_equal 10, @range.current
  end

  def test_dec_value
    assert_equal 0, @range.dec!(2)
    assert_equal 3, @range.current
  end

  def test_dec_return_difference
    assert_equal 4, @range.dec!(10)
    assert_equal 1, @range.current
  end

  def test_value_is_max
    assert !@range.max?
    @range.inc! 5
    assert @range.max?
  end

  def test_value_is_min
    assert_equal @range.min?, false
    @range.dec! 5
    assert_equal @range.min?, true
  end

end