require 'spec_helper'

RSpec.describe TextAdventures::Scenes::Ruins do
  RuinsFixedRandom = Struct.new(:value) do
    def rand(_max)
      value
    end
  end

  RuinsSequenceRandom = Struct.new(:values) do
    def rand(_max)
      values.shift || 0
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
    expect(response).to include "return to the entrance portal - go back to Nee'Peh"
    expect(response).to include "spellbook - show the spells you can cast"
    expect(response).to include "??????##.x..??????"
    expect(response).to include "Good luck and have a great adventure!"
  end

  it "shows concise ruins help without rendering the map" do
    response = game.handle("help")

    expect(response).to include "Ruins help"
    expect(response).to include "go <up|right|down|left> - move through open floor"
    expect(response).to include "E - enemy"
    expect(response).to include "@ - loot"
    expect(response).to include "P - entrance portal"
    expect(response).to include ". - open floor"
    expect(response).to include "? - unrevealed area"
    expect(response).to include "The map shows the 3x3 area around your current block."
    expect(response).to_not include "Ruins Level 1"
    expect(response).to_not include "##.x.."
  end

  it "moves through valid dungeon directions and renders the updated map" do
    expect(game.handle("go up")).to eq <<~TEXT.chomp
      You cannot go up; a wall blocks the way.
    TEXT

    expect(game.handle("go right")).to eq <<~TEXT.chomp
      You move right.

      Ruins Level 1
      ??????????????????
      ??????????????????
      ??????????????????
      ??????????????????
      ??????????????????
      ??????######??????
      ??????######??????
      ??????##.Px.??????
      ??????######??????
      ??????######??????
      ??????????????????
      ??????????????????
      ??????????????????
      ??????????????????
      ??????????????????
    TEXT
    expect(dungeon.player_position).to have_attributes(x: 4, y: 2)
  end

  it "does not start an invisible encounter when looking" do
    encounter_game = TextAdventures::Game.new(current_scene: scene, random: RuinsFixedRandom.new(0))

    response = encounter_game.handle("look")

    expect(response).to include "You are now inside the Ruins Level 1"
    expect(encounter_game.battle).to be_nil
  end

  it "starts an encounter when movement ends adjacent to a visible enemy" do
    encounter_game = TextAdventures::Game.new(current_scene: scene, random: RuinsFixedRandom.new(0))
    dungeon.place_enemy(TextAdventures::Dungeon::Position.new(x: 5, y: 2), "giant_spider")

    response = encounter_game.handle("go right")

    expect(response).to eq <<~TEXT.chomp
      You move right.

      Ruins Level 1
      ??????????????????
      ??????????????????
      ??????????????????
      ??????????????????
      ??????????????????
      ??????######??????
      ??????######??????
      ??????##.PxE??????
      ??????######??????
      ??????######??????
      ??????????????????
      ??????????????????
      ??????????????????
      ??????????????????
      ??????????????????

      You see a Giant Spider
      A Giant Spider is about to attack you!

      [Giant Spider HP: 35/35]
      [Adventurer HP: 30/30]
      [Adventurer MP: 12/12]
    TEXT
    expect(encounter_game.battle.creature.display_name).to eq "Giant Spider"
    expect(encounter_game.active_enemy_position).to have_attributes(x: 5, y: 2)
  end

  it "starts an encounter before handling commands when an enemy is already adjacent" do
    encounter_game = TextAdventures::Game.new(current_scene: scene, random: RuinsFixedRandom.new(0))
    dungeon.place_enemy(TextAdventures::Dungeon::Position.new(x: 4, y: 2), "giant_spider")

    response = encounter_game.handle("look")

    expect(response).to eq <<~TEXT.chomp
      You see a Giant Spider
      A Giant Spider is about to attack you!

      [Giant Spider HP: 35/35]
      [Adventurer HP: 30/30]
      [Adventurer MP: 12/12]
    TEXT
    expect(encounter_game.battle.creature.display_name).to eq "Giant Spider"
    expect(encounter_game.active_enemy_position).to have_attributes(x: 4, y: 2)
  end

  it "starts an encounter if the player is already on an enemy marker" do
    legacy_dungeon = TextAdventures::Dungeon.new(enemies: { [3, 2] => "giant_spider" })
    legacy_scene = described_class.new(dungeon: legacy_dungeon)
    encounter_game = TextAdventures::Game.new(current_scene: legacy_scene, random: RuinsFixedRandom.new(0))

    response = encounter_game.handle("go right")

    expect(response).to include "You see a Giant Spider"
    expect(encounter_game.battle.creature.display_name).to eq "Giant Spider"
    expect(encounter_game.active_enemy_position).to have_attributes(x: 3, y: 2)
    expect(legacy_dungeon.player_position).to have_attributes(x: 3, y: 2)
  end

  it "does not start an encounter from diagonal enemy adjacency" do
    open_block = TextAdventures::DungeonBlock.new(
      id: "open_room",
      name: "Open Room",
      tiles: [
        "######",
        "#    #",
        "#    #",
        "#    #",
        "######"
      ],
      exits: []
    )
    open_dungeon = TextAdventures::Dungeon.new(
      revealed_blocks: { [0, 0] => open_block },
      player_position: TextAdventures::Dungeon::Position.new(x: 2, y: 2)
    )
    open_dungeon.place_enemy(TextAdventures::Dungeon::Position.new(x: 4, y: 3), "giant_spider")
    open_scene = described_class.new(dungeon: open_dungeon)
    open_game = TextAdventures::Game.new(current_scene: open_scene, random: RuinsFixedRandom.new(99))

    response = open_game.handle("go right")

    expect(response).to include "You move right."
    expect(open_game.battle).to be_nil
  end

  it "can reveal a new dungeon block with a visible enemy marker" do
    edge_dungeon = TextAdventures::Dungeon.new(
      player_position: TextAdventures::Dungeon::Position.new(x: 5, y: 2),
      random: RuinsFixedRandom.new(0)
    )
    edge_scene = described_class.new(dungeon: edge_dungeon)
    encounter_game = TextAdventures::Game.new(current_scene: edge_scene, random: RuinsFixedRandom.new(0))

    response = encounter_game.handle("go right")

    expect(response).to include "You move right."
    expect(response).to include "E"
    expect(edge_dungeon.revealed_blocks.keys).to include [1, 0]
    expect(edge_dungeon.enemies.values).to include "giant_spider"
  end

  it "switches to active encounter behavior while a creature is present" do
    game.battle = TextAdventures::Battle.new(
      creature: TextAdventures::Creature.giant_spider,
      random: RuinsSequenceRandom.new([99, 0, 99, 0])
    )

    expect(game.handle("look")).to eq <<~TEXT.chomp
      You see a Giant Spider
      A Giant Spider is about to attack you!

      [Giant Spider HP: 35/35]
      [Adventurer HP: 30/30]
      [Adventurer MP: 12/12]
    TEXT
    expect(game.handle("go right")).to eq "You cannot move while Giant Spider blocks your path."
    expect(game.handle("inventory")).to include "5x Potion of Heal"
  end

  it "attacks during active encounters and keeps battle active while the creature lives" do
    game.battle = TextAdventures::Battle.new(
      creature: TextAdventures::Creature.giant_spider,
      random: RuinsSequenceRandom.new([99, 0, 99, 0])
    )

    expect(game.handle("attack")).to eq <<~TEXT.chomp
      You attack a Giant Spider causing 10 of damage.
      Giant Spider attacks you with Bite causing 2 of damage.

      [Giant Spider HP: 25/35]
      [Adventurer HP: 28/30]
      [Adventurer MP: 12/12]
    TEXT
    expect(game.battle.creature.health.current).to eq 25
  end

  it "casts known Fireball during active encounters" do
    game.player.learn_spell(TextAdventures::Spell.fireball)
    game.battle = TextAdventures::Battle.new(
      creature: TextAdventures::Creature.giant_spider,
      random: RuinsSequenceRandom.new([0, 99, 0])
    )

    expect(game.handle("cast fireball")).to eq <<~TEXT.chomp
      You cast Fireball causing 11 of damage.
      Giant Spider attacks you with Bite causing 2 of damage.

      [Giant Spider HP: 24/35]
      [Adventurer HP: 28/30]
      [Adventurer MP: 7/12]
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

      [Giant Spider HP: 31/35]
      [Adventurer HP: 30/30]
      [Adventurer MP: 6/12]
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
      random: RuinsSequenceRandom.new([0, 99, 0, 0, 99, 0])
    )

    expect(game.handle("cast heal")).to eq <<~TEXT.chomp
      Poison deals 2 damage.
      You cast Heal and recover 10 health.
      Giant Spider attacks you with Bite causing 2 of damage.

      [Giant Spider HP: 35/35]
      [Adventurer HP: 24/30]
      [Adventurer MP: 8/12]
    TEXT
    expect(game.player.health.current).to eq 24

    expect(game.handle("cast cure")).to eq <<~TEXT.chomp
      Poison deals 2 damage.
      You cast Cure and remove poison.
      Giant Spider attacks you with Bite causing 2 of damage.

      [Giant Spider HP: 35/35]
      [Adventurer HP: 20/30]
      [Adventurer MP: 5/12]
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
    active_enemy_position = TextAdventures::Dungeon::Position.new(x: 4, y: 2)
    dungeon.place_enemy(active_enemy_position, "giant_spider")
    strong_game.active_enemy_position = active_enemy_position
    strong_game.battle = TextAdventures::Battle.new(
      creature: TextAdventures::Creature.giant_spider,
      random: RuinsSequenceRandom.new([99])
    )

    expect(strong_game.handle("attack")).to eq <<~TEXT.chomp
      You attack a Giant Spider causing 39 of damage.
      Giant Spider dies.

      [loot dropped]
      Reach @ or use loot nearby to collect it.

      Ruins Level 1
      ??????????????????
      ??????????????????
      ??????????????????
      ??????????????????
      ??????????????????
      ??????######??????
      ??????######??????
      ??????##.x@.??????
      ??????######??????
      ??????######??????
      ??????????????????
      ??????????????????
      ??????????????????
      ??????????????????
      ??????????????????
    TEXT
    expect(strong_game.battle).to be_nil
    expect(strong_game.pending_loot).to be_nil
    expect(dungeon.enemy_at(active_enemy_position)).to be_nil
    loot = dungeon.loot_at(active_enemy_position)
    expect(loot.items.map(&:display_name)).to eq ["Cracked Fang", "Tome of Freezing"]
    expect(loot.gold).to eq 1
  end

  it "collects victory loot once" do
    tome = TextAdventures::Item.tome("Tome of Ice Bolt", price: 25, spell: "Ice Bolt")
    game.pending_loot = TextAdventures::LootDrop.new(items: [tome])

    expect(game.handle("loot")).to eq <<~TEXT.chomp
      You collect the loot.
      [1x Tome of Ice Bolt added to inventory]
    TEXT
    expect(game.player.inventory.quantity("tome of ice bolt")).to eq 1
    expect(game.pending_loot).to be_nil
    expect(game.handle("loot")).to eq "There is no loot to collect."
    expect(game.player.inventory.quantity("tome of ice bolt")).to eq 1
  end

  it "collects victory gold with items" do
    fang = TextAdventures::Item.junk("Cracked Fang", price: 2)
    game.pending_loot = TextAdventures::LootDrop.new(items: [fang], gold: 4)

    expect(game.handle("loot")).to eq <<~TEXT.chomp
      You collect the loot.
      [1x Cracked Fang added to inventory]
      [4g added to purse]
      [your gold is now 4]
    TEXT
    expect(game.player.inventory.quantity("cracked fang")).to eq 1
    expect(game.player.gold).to eq 4
  end

  it "collects adjacent map loot once" do
    tome = TextAdventures::Item.tome("Tome of Ice Bolt", price: 25, spell: "Ice Bolt")
    dungeon.drop_loot(TextAdventures::Dungeon::Position.new(x: 4, y: 2), TextAdventures::LootDrop.new(items: [tome]))

    expect(game.handle("loot")).to eq <<~TEXT.chomp
      You collect the loot.
      [1x Tome of Ice Bolt added to inventory]
    TEXT
    expect(game.player.inventory.quantity("tome of ice bolt")).to eq 1
    expect(dungeon.loot_at(TextAdventures::Dungeon::Position.new(x: 4, y: 2))).to be_nil
    expect(game.handle("loot")).to eq "There is no loot to collect."
  end

  it "collects map loot automatically when stepping onto it" do
    tome = TextAdventures::Item.tome("Tome of Ice Bolt", price: 25, spell: "Ice Bolt")
    dungeon.drop_loot(TextAdventures::Dungeon::Position.new(x: 4, y: 2), TextAdventures::LootDrop.new(items: [tome]))

    expect(game.handle("go right")).to eq <<~TEXT.chomp
      You move right.

      Ruins Level 1
      ??????????????????
      ??????????????????
      ??????????????????
      ??????????????????
      ??????????????????
      ??????######??????
      ??????######??????
      ??????##.Px.??????
      ??????######??????
      ??????######??????
      ??????????????????
      ??????????????????
      ??????????????????
      ??????????????????
      ??????????????????

      You collect the loot.
      [1x Tome of Ice Bolt added to inventory]

      Ruins Level 1
      ??????????????????
      ??????????????????
      ??????????????????
      ??????????????????
      ??????????????????
      ??????######??????
      ??????######??????
      ??????##.Px.??????
      ??????######??????
      ??????######??????
      ??????????????????
      ??????????????????
      ??????????????????
      ??????????????????
      ??????????????????
    TEXT
    expect(game.player.inventory.quantity("tome of ice bolt")).to eq 1
  end

  it "guides the player toward distant map loot" do
    edge_dungeon = TextAdventures::Dungeon.new(
      revealed_blocks: {
        [0, 0] => "right_exit",
        [1, 0] => "left_exit"
      },
      player_position: TextAdventures::Dungeon::Position.new(x: 3, y: 2)
    )
    edge_scene = described_class.new(dungeon: edge_dungeon)
    edge_game = TextAdventures::Game.new(current_scene: edge_scene, random: random)
    edge_dungeon.drop_loot(
      TextAdventures::Dungeon::Position.new(x: 8, y: 2),
      TextAdventures::LootDrop.new(items: [TextAdventures::Item.tome("Tome of Ice Bolt", price: 25, spell: "Ice Bolt")])
    )

    expect(edge_game.handle("loot")).to eq "There is loot on the map, but you need to reach it first."
  end

  it "rejects loot collection before victory" do
    expect(game.handle("loot")).to eq "There is no loot to collect."
  end

  it "blocks direct return to town and points back to the entrance portal" do
    expect(game.handle("go town")).to eq <<~TEXT.chomp
      The ruins hold you in place.
      Return to the entrance portal to go back to Nee'Peh.
    TEXT
    expect(game.current_scene_name).to eq :ruins
  end

  it "blocks direct travel to another town destination" do
    response = game.handle("go armorsmith")

    expect(response).to include "The ruins hold you in place."
    expect(response).to include "Return to the entrance portal to go back to Nee'Peh."
    expect(game.current_scene_name).to eq :ruins
  end

  it "returns to town when the player steps onto the entrance portal" do
    game.handle("go right")
    response = game.handle("go left")

    expect(response).to include "You move left."
    expect(response).to include "The entrance portal pulls you back to Nee'Peh."
    expect(response).to include "Welcome to Text Adventures"
    expect(game.current_scene_name).to eq :town
  end

  it "descends to the next level when the player steps onto the floor exit" do
    descending_dungeon = TextAdventures::Dungeon.new(
      floor_exit_position: TextAdventures::Dungeon::Position.new(x: 4, y: 2)
    )
    descending_scene = described_class.new(dungeon: descending_dungeon)
    descending_game = TextAdventures::Game.new(current_scene: descending_scene, random: random)

    response = descending_game.handle("go right")

    expect(response).to include "You move right."
    expect(response).to include "You descend deeper into the ruins."
    expect(response).to include "Ruins Level 2"
    expect(descending_game.current_scene_name).to eq :ruins
    expect(descending_dungeon.level).to eq 2
    expect(descending_dungeon.player_position).to have_attributes(x: 3, y: 2)
    expect(descending_dungeon.floor_exit_position).to be_nil
  end

  it "still blocks direct town return after descending" do
    dungeon.advance_level!

    expect(game.handle("go town")).to eq <<~TEXT.chomp
      The ruins hold you in place.
      Return to the entrance portal to go back to Nee'Peh.
    TEXT
    expect(game.current_scene_name).to eq :ruins
  end

  it "climbs toward the entrance from deeper levels" do
    dungeon.advance_level!
    game.handle("go right")

    response = game.handle("go left")

    expect(response).to include "You move left."
    expect(response).to include "You climb toward the ruins entrance."
    expect(response).to include "Ruins Level 1"
    expect(game.current_scene_name).to eq :ruins
    expect(dungeon.level).to eq 1
    expect(dungeon.player_position).to have_attributes(x: 3, y: 2)
  end

  it "rejects invalid movement targets" do
    expect(game.handle("go sideways")).to eq <<~TEXT.chomp
      You cannot go sideways inside the ruins.
      Available directions: up, right, down, left.
    TEXT
  end

  it "recovers MP after successful movement when mana is missing" do
    game.player.spend_mana(3)

    response = game.handle("go right")

    expect(response).to include "[recovered 0.5 MP]"
    expect(game.player.mana.current).to eq 9.5
  end

  it "gives direct feedback for combat commands without an enemy" do
    expect(game.handle("attack")).to eq "There is no enemy to attack."
    expect(game.handle("cast fireball")).to eq "You do not know fireball, and there is no enemy to target."
  end

  it "acknowledges known spells when casting without an enemy" do
    game.player.learn_spell(TextAdventures::Spell.fireball)

    expect(game.handle("cast fireball")).to eq "You know Fireball, but there is no enemy to target."
  end

  it "casts known healing and cure spells without an enemy target" do
    game.player.learn_spell(TextAdventures::Spell.heal)
    game.player.learn_spell(TextAdventures::Spell.cure)
    game.player.take_damage(12)
    game.player.apply_status(:poison)

    expect(game.handle("cast heal")).to eq <<~TEXT.chomp
      You cast Heal and recover 10 health.
      [your health is now 28/30]
    TEXT
    expect(game.player.health.current).to eq 28
    expect(game.player.mana.current).to eq 8
    expect(game.player.skill_experience[:nature_magic]).to eq 10

    expect(game.handle("cast cure")).to eq "You cast Cure and remove poison."
    expect(game.player).to_not be_status(:poison)
    expect(game.player.mana.current).to eq 5
  end

  it "reports when casting Cure without curable statuses outside combat" do
    game.player.learn_spell(TextAdventures::Spell.cure)

    expect(game.handle("cast cure")).to eq "You cast Cure, but there is nothing to cure."
    expect(game.player.mana.current).to eq 9
  end

  it "does not cast support spells outside combat without enough MP" do
    game.player.learn_spell(TextAdventures::Spell.heal)
    game.player.spend_mana(12)
    game.player.take_damage(12)

    expect(game.handle("cast heal")).to eq "Not enough MP to cast Heal. [MP: 0/12, cost: 4]"
    expect(game.player.health.current).to eq 18
  end
end
