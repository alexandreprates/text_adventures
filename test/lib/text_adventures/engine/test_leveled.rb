require './test/test_helper'

class TestLeveled < MiniTest::Test

  class Character
    include TextAdventures::Engine::Leveled
  end

  def setup
    @character = Character.new
  end

  def test_initial_level
    assert_equal @character.level, 1
  end

  def test_initial_xp
    assert_equal @character.xp, 0
  end

  def test_gain_xp
    @character.gain_xp(2)
    assert_equal @character.xp, 2
    assert_equal @character.xp_to_up, 8
    assert_equal @character.level, 1

    @character.gain_xp(200)
    assert_equal @character.xp, 15
    assert_equal @character.xp_to_up, 10
    assert_equal @character.level, 14
  end

  def text_xp_to_up
    other_char = Character.new
    assert_equal other_char.xp_to_up, other_char.level_max_xp

    other_char.gain_xp!(2)
    assert_equal other_char.xp_to_up, other_char.level_max_xp - 2
  end

  def test_gain_xp_return
    assert_equal @character.gain_xp(30), @character.level
  end

end
