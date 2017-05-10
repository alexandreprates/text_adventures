require './test/test_helper'

class TestPlayer < MiniTest::Test

  def setup
    @player = TextAdventures::Engine::Character::Player.new name: 'Nep', str: 10, dex: 10, int: 10, level: 3, xp: 5, hp: 7
  end

  def test_basic_init
    player = TextAdventures::Engine::Character::Player.new name: 'Sir Foo'
    assert_equal 'Sir Foo', player.name
    assert_equal 1, player.str
    assert_equal 1, player.dex
    assert_equal 1, player.int
    assert_equal 1, player.level
    assert_equal 0, player.xp
    assert_equal 3, player.xp_to_up
  end

  def test_player_name
    assert_equal 'Nep', @player.name
  end

  def test_player_str
    assert_equal 10, @player.str
  end

  def test_player_dex
    assert_equal 10, @player.dex
  end

  def test_player_int
    assert_equal 10, @player.int
  end

  def test_player_level
    assert_equal 3, @player.level
  end

  def test_player_xp
    assert_equal 5, @player.xp
  end

  def test_player_gain_xp
    player = TextAdventures::Engine::Character::Player.new name: 'Sir Foo'
    assert_equal 1, player.gain_xp(1)
    assert_equal 3, player.gain_xp(2)
  end

  def test_level_up_when_gain_xp
    player = TextAdventures::Engine::Character::Player.new name: 'Sir Foo'
    assert_equal player.gain_xp(9), player.xp
    assert_equal 3, player.level
  end

  def test_player_hp
    assert_equal 7, @player.hp
    assert_equal 13, @player.level_max_hp
  end

  def test_player_live
    assert @player.live?
    dead_player = TextAdventures::Engine::Character::Player.new name: 'Sir Foo', hp: 0
    assert !dead_player.live?
  end

  def test_player_hit
    assert_equal @player.hp, 7
    @player.hit 2
    assert_equal @player.hp, 5
  end

  def test_hit_return_false_on_dead
    assert !@player.hit(10)
  end

  def test_heal
    final_hp = @player.hp + 2
    assert @player.heal(2)
    assert_equal final_hp, @player.hp
  end

  def test_heal_return_false_when_hp_is_full
    player = TextAdventures::Engine::Character::Player.new name: 'Sir Foo'
    assert !player.heal(1)
  end

  def test_heal_false_when_cure_is_more_than_missing_hp
    assert !@player.heal(100)
  end

end
