require 'spec_helper'

RSpec.describe TextAdventures::Scenes::Ruins do
  RuinsFixedRandom = Struct.new(:value) do
    def rand(_max)
      value
    end
  end

  RuinsSequenceRandom = Struct.new(:values) do
    def rand(_max)
      values.shift
    end
  end

  subject(:scene) { described_class.new(dungeon: dungeon) }

  let(:dungeon) { TextAdventures::Dungeon.new }
  let(:random) { RuinsFixedRandom.new(99) }
  let(:game) { TextAdventures::Game.new(current_scene: scene, random: random) }

  it "has the Ruins scene identity" do
    expect(scene.name).to eq :ruins
    expect(scene.display_name).to eq "Ruins"
  end

  it "sets the game dungeon when entered" do
    game.dungeon = nil

    scene.enter(game)

    expect(game.dungeon).to eq dungeon
  end

  it "shows ruins instructions and the dungeon map on look" do
    response = game.handle("look")

    expect(response).to include "You are now inside the Ruins Level 1"
    expect(response).to include "go <up|right|down|left> - to move around"
    expect(response).to include "spellbook - show the spells you can cast"
    expect(response).to include "## x  "
    expect(response).to include "Good luck and have a great adventure!"
  end

  it "moves through valid dungeon directions and renders the updated map" do
    expect(game.handle("go up")).to eq <<~TEXT.chomp
      You cannot go up; a wall blocks the way.
    TEXT

    expect(game.handle("go right")).to eq <<~TEXT.chomp
      You move right.

      Ruins Level 1
      ######
      ######
      ##  x 
      ######
      ######
    TEXT
    expect(dungeon.player_position).to have_attributes(x: 4, y: 2)
  end

  it "can force an encounter when looking" do
    encounter_game = TextAdventures::Game.new(current_scene: scene, random: RuinsFixedRandom.new(0))

    response = encounter_game.handle("look")

    expect(response).to eq <<~TEXT.chomp
      You see a Giant Spider
      A Giant Spider is about to attack you!
    TEXT
    expect(encounter_game.battle).to be_a TextAdventures::Battle
    expect(encounter_game.battle.creature.display_name).to eq "Giant Spider"
  end

  it "can spawn different creatures from the dungeon roster" do
    encounter_game = TextAdventures::Game.new(current_scene: scene, random: RuinsSequenceRandom.new([0, 1]))

    response = encounter_game.handle("look")

    expect(response).to eq <<~TEXT.chomp
      You see a Goblin Skirmisher
      A Goblin Skirmisher is about to attack you!
    TEXT
    expect(encounter_game.battle.creature.display_name).to eq "Goblin Skirmisher"
  end

  it "can force an encounter after movement" do
    encounter_game = TextAdventures::Game.new(current_scene: scene, random: RuinsFixedRandom.new(0))

    response = encounter_game.handle("go right")

    expect(response).to eq <<~TEXT.chomp
      You move right.

      Ruins Level 1
      ######
      ######
      ##  x 
      ######
      ######

      You see a Giant Spider
      A Giant Spider is about to attack you!
    TEXT
    expect(encounter_game.battle.creature.display_name).to eq "Giant Spider"
  end

  it "switches to active encounter behavior while a creature is present" do
    game.battle = TextAdventures::Battle.new(
      creature: TextAdventures::Creature.giant_spider,
      random: RuinsSequenceRandom.new([99, 0])
    )

    expect(game.handle("look")).to eq <<~TEXT.chomp
      You see a Giant Spider
      A Giant Spider is about to attack you!
    TEXT
    expect(game.handle("go right")).to eq "You cannot move while Giant Spider blocks your path."
    expect(game.handle("inventory")).to include "Currently you have nothing."
  end

  it "attacks during active encounters and keeps battle active while the creature lives" do
    game.battle = TextAdventures::Battle.new(
      creature: TextAdventures::Creature.giant_spider,
      random: RuinsSequenceRandom.new([99, 0])
    )

    expect(game.handle("attack")).to eq <<~TEXT.chomp
      You attack a Giant Spider causing 10 of damage.
      Giant Spider attacks you with Bite causing 0 of damage.
    TEXT
    expect(game.battle.creature.health.current).to eq 25
  end

  it "casts known Fireball during active encounters" do
    game.player.learn_spell(TextAdventures::Spell.fireball)
    game.battle = TextAdventures::Battle.new(
      creature: TextAdventures::Creature.giant_spider,
      random: RuinsSequenceRandom.new([0])
    )

    expect(game.handle("cast fireball")).to eq <<~TEXT.chomp
      You cast Fireball causing 11 of damage.
      Giant Spider attacks you with Bite causing 0 of damage.
    TEXT
    expect(game.battle.creature.health.current).to eq 24
  end

  it "casts known Ice Bolt and can freeze during active encounters" do
    game.player.learn_spell(TextAdventures::Spell.ice_bolt)
    game.battle = TextAdventures::Battle.new(
      creature: TextAdventures::Creature.giant_spider,
      random: RuinsSequenceRandom.new([0])
    )

    expect(game.handle("cast ice bolt")).to eq <<~TEXT.chomp
      You cast Ice Bolt causing 4 of damage.
      Giant Spider is frozen.
      Giant Spider is frozen and loses its turn.
    TEXT
    expect(game.battle.creature.health.current).to eq 31
  end

  it "casts known Heal and Cure during active encounters" do
    game.player.learn_spell(TextAdventures::Spell.heal)
    game.player.learn_spell(TextAdventures::Spell.cure)
    game.player.take_damage(12)
    game.player.apply_status(:poison)
    game.battle = TextAdventures::Battle.new(
      creature: TextAdventures::Creature.giant_spider,
      random: RuinsSequenceRandom.new([0, 0])
    )

    expect(game.handle("cast heal")).to eq <<~TEXT.chomp
      Poison deals 2 damage.
      You cast Heal and recover 10 health.
      Giant Spider attacks you with Bite causing 0 of damage.
    TEXT
    expect(game.player.health.current).to eq 26

    expect(game.handle("cast cure")).to eq <<~TEXT.chomp
      Poison deals 2 damage.
      You cast Cure and remove poison.
      Giant Spider attacks you with Bite causing 0 of damage.
    TEXT
    expect(game.player).to_not be_status(:poison)
  end

  it "rejects unknown spells during active encounters" do
    game.battle = TextAdventures::Battle.new(
      creature: TextAdventures::Creature.giant_spider,
      random: RuinsSequenceRandom.new([99, 0])
    )

    expect(game.handle("cast fireball")).to eq "You do not know fireball."
    expect(game.battle).to be_a TextAdventures::Battle
  end

  it "clears active battle when attack defeats the creature" do
    strong_player = TextAdventures::Character.new(base_attack: 40, equipped_weapon: nil)
    strong_game = TextAdventures::Game.new(current_scene: scene, player: strong_player, random: random)
    strong_game.battle = TextAdventures::Battle.new(
      creature: TextAdventures::Creature.giant_spider,
      random: RuinsSequenceRandom.new([99])
    )

    expect(strong_game.handle("attack")).to eq <<~TEXT.chomp
      You attack a Giant Spider causing 39 of damage.
      Giant Spider dies.
    TEXT
    expect(strong_game.battle).to be_nil
    expect(strong_game.pending_loot).to eq TextAdventures::Creature.giant_spider.loot_table
  end

  it "collects victory loot once" do
    tome = TextAdventures::Item.tome("Tome of Ice Bolt", price: 25, spell: "Ice Bolt")
    game.pending_loot = [tome]

    expect(game.handle("loot")).to eq <<~TEXT.chomp
      You collect the loot.
      [1x Tome of Ice Bolt added to inventory]
    TEXT
    expect(game.player.inventory.quantity("tome of ice bolt")).to eq 1
    expect(game.pending_loot).to be_nil
    expect(game.handle("loot")).to eq "There is no loot to collect."
    expect(game.player.inventory.quantity("tome of ice bolt")).to eq 1
  end

  it "rejects loot collection before victory" do
    expect(game.handle("loot")).to eq "There is no loot to collect."
  end

  it "rejects invalid movement targets" do
    expect(game.handle("go town")).to eq <<~TEXT.chomp
      You cannot go town inside the ruins.
      Available directions: up, right, down, left.
    TEXT
  end

  it "falls back to the ruins description for unsupported commands" do
    expect(game.handle("attack")).to include "You are now inside the Ruins Level 1"
  end
end
