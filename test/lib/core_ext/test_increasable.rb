require './test/test_helper'

class TestIncreasable < MiniTest::Test
  def setup
    @inc = Increasable.new
  end

  def test_plus_operation
    increasable = Increasable.new(3)
    assert_equal (increasable + 3), 6
  end

  def test_minus_operation
    increasable = Increasable.new(3)
    assert_equal (increasable - 2), 1
  end

  def test_equal_operation
    assert_equal Increasable.new(10), 10
    assert_equal Increasable.new(3), 3
  end

  def test_inc
    assert_equal @inc.inc!, 1
    assert_equal @inc.value, 1
    assert_equal @inc.inc!, 2
    assert_equal @inc.value, 2
  end

  def test_dec
    assert_equal @inc.dec!, -1
    assert_equal @inc.value, -1
  end

  def test_to_s
    assert_equal @inc.to_s, '0'
    assert_equal "#{@inc}", '0'
  end
end