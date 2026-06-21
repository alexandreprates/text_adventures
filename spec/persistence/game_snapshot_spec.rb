require 'spec_helper'

RSpec.describe TextAdventures::Persistence::GameSnapshot do
  def round_trip(game)
    described_class.load(described_class.dump(game))
  end

  it "round-trips a new town game" do
    game = TextAdventures::Game.new(random: TextAdventures::RandomSource.new(seed: 0))

    loaded = round_trip(game)

    expect(loaded.current_scene_name).to eq :town
    expect(loaded.player).to have_attributes(name: "Adventurer", gold: 0)
    expect(loaded.random.rand(100)).to eq game.random.rand(100)
  end

  it "round-trips mutable player state" do
    player = TextAdventures::Character.new
    player.take_damage(7)
    player.gold = 42
    player.equipped_weapon = TextAdventures::ContentCatalog.item("hunting_spear")
    player.equipped_armor = TextAdventures::ContentCatalog.item("chain_shirt")
    player.inventory.add(TextAdventures::ContentCatalog.item("rusty_dagger"), quantity: 2)
    player.learn_spell(TextAdventures::Spell.fireball(level: 2))
    player.apply_status(:poison, duration: 2)
    player.gain_skill_xp(:swordsmanship, 75)

    loaded = round_trip(TextAdventures::Game.new(player: player, random: TextAdventures::RandomSource.new(seed: 1)))

    expect(loaded.player.health.current).to eq player.health.current
    expect(loaded.player.health.max).to eq player.health.max
    expect(loaded.player.gold).to eq 42
    expect(loaded.player.equipped_weapon.command_name).to eq "hunting spear"
    expect(loaded.player.equipped_armor.command_name).to eq "chain shirt"
    expect(loaded.player.inventory.quantity("rusty dagger")).to eq 2
    expect(loaded.player.known_spell?("fireball")).to be true
    expect(loaded.player.spells.fetch("fireball").level).to eq 2
    expect(loaded.player.status_durations.fetch(:poison)).to eq 2
    expect(loaded.player.progression.skill_xp(:swordsmanship)).to eq 75
  end

  it "round-trips dungeon exploration state" do
    game = TextAdventures::Game.new(random: TextAdventures::RandomSource.new(seed: 0))
    game.handle("go ruins")
    3.times { game.handle("go right") }

    loaded = round_trip(game)

    expect(TextAdventures::Web::GameSerializer.new(loaded).to_h.fetch(:dungeon)).to eq(
      TextAdventures::Web::GameSerializer.new(game).to_h.fetch(:dungeon)
    )
  end

  it "round-trips active battle state" do
    random = TextAdventures::RandomSource.new(seed: 2)
    creature = TextAdventures::ContentCatalog.creature("giant_spider")
    creature.take_damage(12)
    creature.apply_status(:poison)
    battle = TextAdventures::Battle.new(
      creature: creature,
      random: random,
      contributions: { swordsmanship: 12 }
    )
    dungeon = TextAdventures::Dungeon.new(random: random)
    scene = TextAdventures::Scenes::Ruins.new(dungeon: dungeon)
    game = TextAdventures::Game.new(
      current_scene: scene,
      dungeon: dungeon,
      battle: battle,
      active_enemy_position: TextAdventures::Dungeon::Position.new(x: 3, y: 2),
      random: random
    )

    loaded = round_trip(game)

    expect(loaded.current_scene_name).to eq :ruins
    expect(loaded.battle.creature.health.current).to eq creature.health.current
    expect(loaded.battle.creature.active_statuses).to eq [:poison]
    expect(loaded.battle.contributions.fetch(:swordsmanship)).to eq 12
    expect(loaded.active_enemy_position).to have_attributes(x: 3, y: 2)
  end

  it "round-trips merchant confirmations so they can still be accepted" do
    merchant = TextAdventures::Scenes::Blacksmith.new
    item = TextAdventures::ContentCatalog.item("rusty_dagger")
    player = TextAdventures::Character.new(gold: item.price)
    game = TextAdventures::Game.new(
      player: player,
      current_scene: merchant,
      pending_confirmation: TextAdventures::Scenes::Merchant::Confirmation.new(
        merchant: merchant,
        action: :buy,
        item: item,
        price: item.price
      ),
      random: TextAdventures::RandomSource.new(seed: 3)
    )

    loaded = round_trip(game)
    loaded.handle("agree")

    expect(loaded.player.inventory.quantity("rusty dagger")).to eq 1
    expect(loaded.pending_confirmation).to be_nil
  end

  it "rejects unknown future schema versions" do
    snapshot = described_class.dump(TextAdventures::Game.new(random: TextAdventures::RandomSource.new(seed: 4)))
    snapshot["schema_version"] = described_class::CURRENT_SCHEMA_VERSION + 1

    expect { described_class.load(snapshot) }.to raise_error(TextAdventures::Persistence::SnapshotVersionError)
  end
end
