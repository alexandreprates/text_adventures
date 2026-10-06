require 'spec_helper'

RSpec.describe "Town portal scroll" do
  let(:scroll) { TextAdventures::ContentCatalog.item("town_portal_scroll") }
  let(:random) { TextAdventures::RandomSource.new(seed: 0) }
  let(:position) { TextAdventures::Dungeon::Position.new(x: 4, y: 2) }
  let(:dungeon) do
    TextAdventures::Dungeon.new(
      level: 4,
      player_position: position,
      enemies: { [1, 1] => "giant_spider" },
      dropped_loot: { [1, 3] => TextAdventures::LootDrop.new(gold: 7, items: [scroll]) },
      random: random
    )
  end
  let(:game) do
    TextAdventures::Game.new(
      current_scene: TextAdventures::Scenes::Ruins.new(dungeon: dungeon),
      dungeon: dungeon,
      random: random
    )
  end

  def dungeon_snapshot(game)
    TextAdventures::Persistence::GameSnapshot.dump(game).fetch("game").fetch("dungeon")
  end

  it "consumes one scroll for a round trip that preserves the entire expedition" do
    before = dungeon_snapshot(game)
    game.player.inventory.add(TextAdventures::ContentCatalog.item("sword"))
    game.player.inventory.add(scroll)
    game.player.take_damage(10)
    game.player.spend_mana(3)

    expect(game.handle("use town portal scroll")).to include("You teleport to", "No second scroll")
    expect(game.current_scene_name).to eq :town
    expect(game.town_portal_active?).to be true
    expect(game.player.inventory.quantity(scroll.name)).to eq 1
    expect(game.player.health.current).to eq 20
    expect(game.player.mana.current).to eq 9
    game.handle("go blacksmith")
    game.handle("sell sword")
    game.handle("agree")
    expect(game.player.gold).to be_positive
    game.handle("go tavern")
    game.handle("sleep")
    game.handle("go town")

    expect(game.handle("go ruins")).to include("where you left off", "portal closes")
    expect(game.current_scene_name).to eq :ruins
    expect(game.current_scene.dungeon).to equal(dungeon)
    expect(game.dungeon).to equal(dungeon)
    expect(dungeon_snapshot(game)).to eq before
    expect(game.town_portal_active?).to be false
    expect(game.player.inventory.quantity(scroll.name)).to eq 1
  end

  it "restores the return portal after saving in a merchant scene and loading the page" do
    before = dungeon_snapshot(game)
    game.handle("use town portal scroll")
    game.handle("go tavern")
    loaded = TextAdventures::Persistence::GameSnapshot.load(TextAdventures::Persistence::GameSnapshot.dump(game))
    loaded.return_to_town_on_page_load

    expect(loaded.town_portal_active?).to be true
    expect(loaded.player.inventory.quantity(scroll.name)).to eq 0
    loaded.handle("go ruins")
    expect(loaded.current_scene_name).to eq :ruins
    expect(dungeon_snapshot(loaded)).to eq before
    expect(loaded.town_portal_active?).to be false
  end

  it "does not consume a scroll in town or during an active battle" do
    town = TextAdventures::Game.new
    expect(town.handle("use town portal scroll")).to include("only be used inside the Ruins")
    expect(town.player.inventory.quantity(scroll.name)).to eq 1
    game.battle = TextAdventures::Battle.new(creature: TextAdventures::ContentCatalog.creature("giant_spider"), random: random)
    game.battle.creature.take_damage(5)
    expect(game.handle("use town portal scroll")).to include("during battle")
    expect(game.current_scene_name).to eq :ruins
    expect(game.battle.creature.health.current).to eq 30
    expect(game.player.inventory.quantity(scroll.name)).to eq 1
    expect(game.town_portal_active?).to be false
  end

  it "does not teleport without a scroll or duplicate a trip by repeating use" do
    game.handle("use town portal scroll")
    expect(game.handle("use town portal scroll")).to include("You do not have")
    game.handle("go ruins")
    expect(game.handle("use town portal scroll")).to include("You do not have")
    expect(game.current_scene_name).to eq :ruins
    expect(game.town_portal_active?).to be false
  end

  it "requires another scroll for a later visit and remembers the new departure point" do
    game.player.inventory.add(scroll)
    game.handle("use town portal scroll")
    game.handle("go ruins")
    dungeon.move("up")
    before = dungeon_snapshot(game)
    game.handle("use town portal scroll")
    game.handle("go ruins")
    expect(game.player.inventory.quantity(scroll.name)).to eq 0
    expect(dungeon_snapshot(game)).to eq before
  end

  it "does not turn an ordinary entrance exit or reload into a free return portal" do
    game.return_to_town_on_page_load
    game.handle("go ruins")
    expect(game.dungeon).not_to equal(dungeon)
    expect(game.dungeon.level).to eq 1
    expect(game.town_portal_active?).to be false
  end

  it "clears the return portal after death and never uses a dead player's scroll" do
    game.player.take_damage(999)
    expect(game.handle("use town portal scroll")).to include("has fallen")
    expect(game.player.inventory.quantity(scroll.name)).to eq 1
    game.handle("reload")
    game.handle("go ruins")
    game.handle("use town portal scroll")
    game.player.take_damage(999)
    game.handle("reload")
    expect(game.town_portal_active?).to be false
    game.handle("go ruins")
    expect(game.dungeon.current_global_position).to eq TextAdventures::Dungeon::DEFAULT_PLAYER_POSITION
  end

  it "lets existing players buy a scroll at the tavern without changing old saves" do
    player = TextAdventures::Character.new(gold: 5, inventory: TextAdventures::Inventory.new)
    customer = TextAdventures::Game.new(player: player)
    customer.handle("go tavern")
    customer.handle("buy town portal scroll")
    customer.handle("agree")
    expect(player.gold).to eq 0
    expect(player.inventory.quantity(scroll.name)).to eq 1
    expect(scroll).to have_attributes(type: :scroll, effect: :town_portal, price: 5)
  end

  it "publishes and clears the return destination in full state and websocket patches" do
    game.handle("use town portal scroll")
    [TextAdventures::Web::GameSerializer, TextAdventures::Web::StatePatch].each do |serializer|
      expect(serializer.new(game).to_h[:town_portal]).to eq(level: 4, player_position: { x: 4, y: 2 })
    end
    game.handle("go ruins")
    expect(TextAdventures::Web::StatePatch.new(game).to_h[:town_portal]).to be_nil
  end

  it "loads snapshots that predate scrolls without creating a return portal" do
    snapshot = TextAdventures::Persistence::GameSnapshot.dump(game)
    snapshot.fetch("game").delete("town_portal_active")
    loaded = TextAdventures::Persistence::GameSnapshot.load(snapshot)
    expect(loaded.town_portal_active?).to be false
  end
end
