require 'spec_helper'

RSpec.describe TextAdventures::Scenes::Tavern do
  subject(:scene) { described_class.new }

  let(:game) { TextAdventures::Game.new(current_scene: scene) }

  it "has the Tavern scene name and display name" do
    expect(scene.name).to eq :tavern
    expect(scene.display_name).to eq "Tavern"
  end

  it "renders static Tavern flavor text" do
    response = game.handle("look")

    expect(response).to include "You enter the Tavern."
    expect(response).to include "adventurers trading rumors over ale"
    expect(response).to include "sleep - rent a room and fully recover health"
    expect(response).to include "show - view potions for sale"
    expect(response).to include "buy <item> - buy a potion"
    expect(response).to include "sell <item> - sell potions and junk"
    expect(response).to include "go town"
  end

  it "shows potion stock" do
    expect(game.handle("show")).to eq <<~TEXT.chomp
      Here, take a look at these goods!
       Potions:
        1x Potion of Heal - 10g
    TEXT
  end

  it "buys healing potions" do
    game.player.gold = 100

    expect(game.handle("buy potion of heal")).to eq <<~TEXT.chomp
      Excellent choice. It is yours for 10g.
      Select your answer:
       agree - buy it
       no - forget it
    TEXT

    expect(game.handle("agree")).to eq <<~TEXT.chomp
      You bought Potion of Heal.
      [1x Potion of Heal added to inventory]
      [your gold is now 90]
    TEXT
    expect(game.player.inventory.quantity("potion of heal")).to eq 6
  end

  it "sells healing potions" do
    game.player.inventory.add(TextAdventures::ContentCatalog.item("potion_of_heal"))

    expect(game.handle("sell potion of heal")).to eq <<~TEXT.chomp
      I can give you 7g for this Potion of Heal.
      Select your answer:
       agree - sell item
       no - keep item
    TEXT

    expect(game.handle("agree")).to eq <<~TEXT.chomp
      You sold Potion of Heal at 7g.
      [1x Potion of Heal removed from inventory]
      [your gold is now 7]
    TEXT
    expect(game.player.inventory.quantity("potion of heal")).to eq 5
  end

  it "sells junk loot" do
    game.player.inventory.add(TextAdventures::ContentCatalog.item("cracked_fang"))

    expect(game.handle("sell cracked fang")).to eq <<~TEXT.chomp
      I can give you 1g for this Cracked Fang.
      Select your answer:
       agree - sell item
       no - keep item
    TEXT

    expect(game.handle("agree")).to eq <<~TEXT.chomp
      You sold Cracked Fang at 1g.
      [1x Cracked Fang removed from inventory]
      [your gold is now 1]
    TEXT
    expect(game.player.inventory.quantity("cracked fang")).to eq 0
  end

  it "lets the player sleep in a rented room to fully recover health" do
    game.player.take_damage(17)

    response = game.handle("sleep")

    expect(response).to eq <<~TEXT.chomp
      You rent a quiet room and sleep until fully rested.
      [recovered 17 health]
      [your health is now 30/30]
    TEXT
    expect(game.player.health.current).to eq 30
  end

  it "accepts rent room as a sleep alias" do
    game.player.take_damage(5)

    response = game.handle("rent room")

    expect(response).to include "[recovered 5 health]"
    expect(game.player.health.current).to eq 30
  end

  it "reports zero recovery when the player is already fully rested" do
    expect(game.handle("sleep")).to eq <<~TEXT.chomp
      You rent a quiet room and sleep until fully rested.
      [recovered 0 health]
      [your health is now 30/30]
    TEXT
  end

  it "can return to Town" do
    response = game.handle("go town")

    expect(response).to eq "You return to the town of Nee'Peh."
    expect(game.current_scene_name).to eq :town
  end

  it "can travel directly to another town destination" do
    response = game.handle("go priest")

    expect(response).to include "You go to Aluriel's Priest."
    expect(response).to include "Welcome to Aluriel's Priest."
    expect(game.current_scene_name).to eq :priest
  end

  it "uses Tavern text for unsupported commands" do
    expect(game.handle("attack")).to include "You enter the Tavern."
  end
end
