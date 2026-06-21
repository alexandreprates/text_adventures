require 'spec_helper'

RSpec.describe TextAdventures::Web::GameSerializer do
  subject(:state) { described_class.new(game).to_h }

  let(:game) { TextAdventures::Game.new(random: Random.new(0)) }

  it "serializes the initial town state" do
    expect(state).to include(
      scene: "town",
      scene_display_name: "Town",
      prompt: "Town",
      dungeon: nil,
      battle: { active: false, enemy: nil },
      pending: { confirmation: false }
    )
    expect(state).not_to have_key(:history)

    expect(state.fetch(:player)).to include(
      name: "Adventurer",
      health: { current: 30, max: 30 },
      gold: 0,
      current_class: "Adventurer",
      level: 1,
      xp: 0,
      attack: 11,
      defense: 12,
      statuses: [],
      spells: []
    )
    expect(state.dig(:player, :inventory)).to include(
      hash_including(name: "potion of heal", display_name: "Potion of Heal", quantity: 5)
    )
    expect(state.dig(:player, :equipment, :weapon)).to include(
      name: "sword",
      display_name: "Sword",
      attack: 10,
      defense: 0
    )
    expect(state.dig(:player, :equipment, :armor)).to include(
      name: "leather armor",
      display_name: "Leather Armor",
      attack: 0,
      defense: 12
    )
    expect(state.dig(:player, :skills, "swordsmanship")).to eq(
      level: 1,
      xp: 0,
      next_level_xp: 50
    )
  end

  it "serializes inventory and spells without command history" do
    game.player.inventory.add(TextAdventures::ContentCatalog.item("iron_dagger"), quantity: 2)
    game.player.learn_spell(TextAdventures::Spell.fireball)
    game.handle("spellbook")

    expect(state.dig(:player, :inventory)).to include(
      hash_including(
        name: "iron dagger",
        display_name: "Iron Dagger",
        type: "weapon",
        quantity: 2,
        weapon_class: "dagger"
      )
    )
    expect(state.dig(:player, :spells)).to match [
      hash_including(
        name: "fireball",
        display_name: "Fireball",
        level: 1,
        kind: "damage"
      )
    ]
    expect(state.fetch(:pending)).to eq(confirmation: false)
    expect(state.fetch(:prompt)).to eq "Town"
    expect(state).not_to have_key(:history)
  end

  it "serializes starter equipment returned to inventory after an equipment swap" do
    game.player.inventory.add(TextAdventures::ContentCatalog.item("rusty_dagger"))
    game.handle("equip rusty dagger")

    expect(state.dig(:player, :equipment, :weapon)).to include(
      name: "rusty dagger",
      display_name: "Rusty Dagger",
      attack: 6
    )
    expect(state.dig(:player, :inventory)).to include(
      hash_including(
        name: "sword",
        display_name: "Sword",
        type: "weapon",
        attack: 10,
        quantity: 1
      )
    )
    expect(state.dig(:player, :inventory)).not_to include(hash_including(name: "rusty dagger"))
  end

  it "serializes dungeon state, adjacent enemies, nearby loot, and active battle" do
    game.handle("go ruins")
    dungeon = game.dungeon
    enemy_position = TextAdventures::Dungeon::Position.new(x: 4, y: 2)
    loot_position = dungeon.current_global_position

    dungeon.place_enemy(enemy_position, "giant_spider")
    dungeon.drop_loot(
      loot_position,
      TextAdventures::LootDrop.new(items: [TextAdventures::ContentCatalog.item("potion_of_heal")], gold: 4)
    )
    game.handle("look")

    expect(state.fetch(:scene)).to eq "ruins"
    expect(state.fetch(:prompt)).to eq "Ruins L1"
    expect(state.dig(:dungeon, :level)).to eq 1
    expect(state.fetch(:dungeon)).not_to have_key(:map)
    expect(state.dig(:dungeon, :viewport)).to include(
      width: 18,
      height: 15,
      origin: { x: -6, y: -5 }
    )
    expect(state.dig(:dungeon, :viewport, :terrain).length).to eq 270
    expect(state.dig(:dungeon, :viewport, :terrain)).not_to match(/[xE@P> ]/)
    expect(state.dig(:dungeon, :viewport, :entities)).to include(
      { type: "player", x: 9, y: 7 },
      { type: "portal", x: 9, y: 7 },
      { type: "enemy", x: 10, y: 7, creature_id: "giant_spider" },
      { type: "loot", x: 9, y: 7 }
    )
    expect(state.dig(:dungeon, :player_position)).to eq(x: 3, y: 2)
    expect(state.dig(:dungeon, :entrance_portal)).to eq(x: 3, y: 2)
    expect(state.dig(:dungeon, :descent)).to be_nil
    expect(state.dig(:dungeon, :nearby_loot, :items)).to include(
      hash_including(name: "potion of heal", display_name: "Potion of Heal")
    )
    expect(state.dig(:dungeon, :nearby_loot, :gold)).to eq 4
    expect(state.fetch(:battle)).to include(active: true)
    expect(state.dig(:battle, :enemy)).to include(
      name: "giant spider",
      display_name: "Giant Spider",
      health: { current: 35, max: 35 },
      xp_reward: 67
    )
  end

  it "serializes dungeon descent markers" do
    game.handle("go ruins")
    game.dungeon.instance_variable_set(:@floor_exit_position, TextAdventures::Dungeon::Position.new(x: 4, y: 2))

    expect(state.dig(:dungeon, :descent)).to eq(x: 4, y: 2)
    expect(state.fetch(:dungeon)).not_to have_key(:map)
    expect(state.dig(:dungeon, :viewport, :entities)).to include(
      { type: "descent", x: 10, y: 7 }
    )
  end

  it "serializes dungeon ascent markers on deeper levels" do
    game.handle("go ruins")
    game.dungeon.advance_level!

    expect(state.dig(:dungeon, :entrance_portal)).to be_nil
    expect(state.dig(:dungeon, :ascent)).to eq(x: 3, y: 2)
    expect(state.fetch(:dungeon)).not_to have_key(:map)
    expect(state.dig(:dungeon, :viewport, :entities)).to include(
      { type: "ascent", x: 9, y: 7 }
    )
  end

  it "serializes pending merchant confirmation" do
    game.player.gold = 100
    game.handle("go blacksmith")
    game.handle("buy sword")

    expect(state.dig(:pending, :confirmation)).to be true
  end

  it "serializes merchant trade data" do
    game.player.gold = 100
    game.handle("go blacksmith")
    game.player.inventory.add(TextAdventures::ContentCatalog.item("rusty_dagger"))

    expect(state.fetch(:trade)).to include(
      merchant: "blacksmith",
      display_name: "Blacksmith",
      accepted_types: ["weapon"]
    )
    expect(state.dig(:trade, :merchant_items)).to include(
      hash_including(name: "iron dagger", display_name: "Iron Dagger", buy_price: 18, trade_enabled: true)
    )
    expect(state.dig(:trade, :player_items)).to include(
      hash_including(name: "rusty dagger", display_name: "Rusty Dagger", sell_price: 5, trade_enabled: true)
    )
    expect(state.dig(:trade, :player_items)).to include(
      hash_including(name: "potion of heal", trade_enabled: false, trade_note: "merchant does not buy")
    )
  end
end
