require './test/test_helper'

class TestRange < MiniTest::Test
  def setup
    @range = Range.new 10, 5, 1
  end

  def test_initialize
    assert_equal @range.max, 10
    assert_equal @range.min, 1
    assert_equal @range.current, 5

    @short = Range.new 5
    assert_equal @short.min, 0
    assert_equal @short.max, 5
    assert_equal @short.current, 0
  end

  def test_change_max_attribute
    @range.max = 5
    assert_equal @range.max, 5
  end

  def test_change_max_reset_current
    @range.max = 4
    assert_equal @range.current, 4
  end

  def test_change_min_attribute
    assert_equal @range.min, 1
    @range.min = 5
    assert_equal @range.min, 5
    assert_equal @range.current, 5
  end

  def test_change_min_reset_current
    @range.min = 6
    assert_equal @range.current, 6
  end

  def test_inc_value
    assert_equal @range.inc!(2), 0
    assert_equal @range.current, 7
  end

  def test_inc_return_difference
    assert_equal @range.inc!(10), 5
    assert_equal @range.current, 10
  end

  def test_dec_value
    assert_equal @range.dec!(2), 0
    assert_equal @range.current, 3
  end

  def test_dec_return_difference
    assert_equal @range.dec!(10), 4
    assert_equal @range.current, 1
  end

  def test_value_is_max
    assert_equal @range.max?, false
    @range.inc! 5
    assert_equal @range.max?, true
  end

  def test_value_is_min
    assert_equal @range.min?, false
    @range.dec! 5
    assert_equal @range.min?, true
  end

end