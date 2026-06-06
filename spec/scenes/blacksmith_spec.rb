require 'spec_helper'

RSpec.describe TextAdventures::Scenes::Blacksmith do
  subject(:scene) { described_class.new }

  let(:game) { TextAdventures::Game.new(current_scene: scene) }

  it "is a merchant scene" do
    expect(scene).to be_a TextAdventures::Scenes::Merchant
    expect(scene.name).to eq :blacksmith
    expect(scene.display_name).to eq "Blacksmith"
  end

  it "shows the expanded weapon stock" do
    expect(game.handle("show")).to eq <<~TEXT.chomp
      Here, take a look at these goods!
       1x Sword (Atk: 10) - 15g
       1x Bastard Sword (Atk: 25) - 30g
       1x Longsword (Atk: 32) - 75g
       1x Greatsword (Atk: 40) - 120g
       1x Spear (Atk: 22, Def: 5) - 50g
       1x Hunting Spear (Atk: 16, Def: 2) - 25g
       1x Iron Spear (Atk: 28, Def: 6) - 65g
       1x Halberd (Atk: 36, Def: 8) - 110g
       1x Dragon Lance (Atk: 48, Def: 10) - 220g
       1x Rusty Dagger (Atk: 6) - 8g
       1x Iron Dagger (Atk: 12) - 18g
       1x Curved Dagger (Atk: 18) - 35g
       1x Shadow Dagger (Atk: 30) - 90g
       1x Assassin Dagger (Atk: 42) - 160g
       1x King's Nep Sword (Atk: 50) - 500g
    TEXT
  end

  it "can return to Town" do
    response = game.handle("go town")

    expect(response).to eq "You return to the town of Nee'Peh."
    expect(game.current_scene_name).to eq :town
  end

  it "buys Spear and reduces player gold" do
    expect(game.handle("buy spear")).to include "Excellent choice its yours for mere 50g."

    response = game.handle("agree")

    expect(response).to eq <<~TEXT.chomp
      You bought Spear.
      [1x Spear added to inventory]
      [your gold is now 50]
    TEXT
    expect(game.player.gold).to eq 50
    expect(game.player.inventory.quantity("spear")).to eq 1
  end

  it "cannot buy King's Nep Sword without enough gold" do
    expect(game.handle("buy king's nep sword")).to eq "Sorry but you dont have enough money for this."
    expect(game.pending_confirmation).to be_nil
  end

  it "sells Sword and removes it from player inventory" do
    sword = TextAdventures::Item.weapon("Sword", price: 15, attack: 10)
    game.player.inventory.add(sword)

    expect(game.handle("sell sword")).to include "Well i can give you 10g for this Sword."
    response = game.handle("agree")

    expect(response).to eq <<~TEXT.chomp
      You sold Sword at 10g.
      [1x Sword removed to inventory]
      [your gold is now 110]
    TEXT
    expect(game.player.gold).to eq 110
    expect(game.player.inventory.quantity("sword")).to eq 0
  end

  it "rejects non-weapon items" do
    armor = TextAdventures::Item.armor("Leather Armor", price: 20, defense: 20)
    game.player.inventory.add(armor)

    expect(game.handle("sell leather armor")).to eq "Sorry bud, but I have no interest in this item."
  end
end
