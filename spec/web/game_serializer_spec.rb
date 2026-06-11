require 'spec_helper'

RSpec.describe TextAdventures::Web::GameSerializer do
  subject(:state) { described_class.new(game).to_h }

  let(:game) { TextAdventures::Game.new(random: Random.new(0)) }

  it "serializes the initial town state" do
    expect(state).to include(
      scene: "town",
      scene_display_name: "Town",
      prompt: "Town",
      input_mode: "text",
      dungeon: nil,
      battle: { active: false, enemy: nil },
      pending: { confirmation: false, spell_choices: [] },
      history: []
    )

    expect(state.fetch(:player)).to include(
      name: "Adventurer",
      health: { current: 30, max: 30 },
      gold: 100,
      current_class: "Adventurer",
      level: 1,
      xp: 0,
      attack: 11,
      defense: 20,
      statuses: [],
      inventory: [],
      spells: []
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
      defense: 20
    )
    expect(state.dig(:player, :skills, "swordsmanship")).to eq(
      level: 1,
      xp: 0,
      next_level_xp: 50
    )
  end

  it "serializes inventory, spells, pending spell choices, and history" do
    game.player.inventory.add(TextAdventures::ContentCatalog.item("iron_dagger"), quantity: 2)
    game.player.learn_spell(TextAdventures::Spell.fireball)
    game.handle("game")
    game.handle("c")

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
    expect(state.dig(:pending, :spell_choices)).to match [
      hash_including(name: "fireball", display_name: "Fireball")
    ]
    expect(state.fetch(:input_mode)).to eq "game"
    expect(state.fetch(:prompt)).to eq "Town [game]"
    expect(state.fetch(:history).last).to include(
      command: "c",
      lines: ["Choose a spell:", " 1 - Fireball", " 0 - cancel"]
    )
  end

  it "serializes the complete command history" do
    12.times { game.handle("look") }

    expect(state.fetch(:history).size).to eq 12
    expect(state.fetch(:history).map { |entry| entry.fetch(:command) }).to all(eq "look")
  end

  it "serializes dungeon state, adjacent enemies, nearby loot, and active battle" do
    game.handle("go ruins")
    dungeon = game.dungeon
    enemy_position = TextAdventures::Dungeon::Position.new(x: 4, y: 2)
    loot_position = dungeon.current_global_position

    dungeon.place_enemy(enemy_position, "giant_spider")
    dungeon.drop_loot(loot_position, [TextAdventures::ContentCatalog.item("potion_of_heal")])
    game.handle("look")

    expect(state.fetch(:scene)).to eq "ruins"
    expect(state.fetch(:prompt)).to eq "Ruins L1"
    expect(state.dig(:dungeon, :level)).to eq 1
    expect(state.dig(:dungeon, :map)).to include(a_string_including("##.xE."))
    expect(state.dig(:dungeon, :player_position)).to eq(x: 3, y: 2)
    expect(state.dig(:dungeon, :entrance_portal)).to eq(x: 3, y: 2)
    expect(state.dig(:dungeon, :visible_enemy)).to eq(
      x: 4,
      y: 2,
      creature_id: "giant_spider"
    )
    expect(state.dig(:dungeon, :visible_enemies)).to include(
      x: 4,
      y: 2,
      creature_id: "giant_spider",
      map_position: { x: 10, y: 7 }
    )
    expect(state.dig(:dungeon, :nearby_loot, :items)).to include(
      hash_including(name: "potion of heal", display_name: "Potion of Heal")
    )
    expect(state.fetch(:battle)).to include(active: true)
    expect(state.dig(:battle, :enemy)).to include(
      name: "giant spider",
      display_name: "Giant Spider",
      health: { current: 35, max: 35 },
      xp_reward: 67
    )
  end

  it "serializes pending merchant confirmation" do
    game.handle("go blacksmith")
    game.handle("buy sword")

    expect(state.dig(:pending, :confirmation)).to be true
  end
end
