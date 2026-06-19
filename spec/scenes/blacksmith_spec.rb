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
       Swords:
        1x Sword (Atk: 10) - 15g
        1x Bastard Sword (Atk: 14) - 30g
        1x Longsword (Atk: 18) - 75g
        1x Greatsword (Atk: 23) - 120g
        1x King's Nep Sword (Atk: 30) - 500g
       Spears and Polearms:
        1x Hunting Spear (Atk: 12, Def: 2) - 25g
        1x Spear (Atk: 15, Def: 3) - 50g
        1x Iron Spear (Atk: 19, Def: 4) - 65g
        1x Halberd (Atk: 24, Def: 5) - 110g
        1x Dragon Lance (Atk: 29, Def: 6) - 220g
       Daggers:
        1x Rusty Dagger (Atk: 6) - 8g
        1x Iron Dagger (Atk: 10) - 18g
        1x Curved Dagger (Atk: 14) - 35g
        1x Shadow Dagger (Atk: 20) - 90g
        1x Assassin Dagger (Atk: 26) - 160g
    TEXT
  end

  it "can return to Town" do
    response = game.handle("go town")

    expect(response).to eq "You return to the town of Nee'Peh."
    expect(game.current_scene_name).to eq :town
  end

  it "buys Spear and reduces player gold" do
    expect(game.handle("buy spear")).to include "Excellent choice. It is yours for 50g."

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
    expect(game.handle("buy king's nep sword")).to eq "Sorry, but you do not have enough money for this."
    expect(game.pending_confirmation).to be_nil
  end

  it "sells Sword and removes it from player inventory" do
    sword = TextAdventures::Item.weapon("Sword", price: 15, attack: 10)
    game.player.inventory.add(sword)

    expect(game.handle("sell sword")).to include "I can give you 10g for this Sword."
    response = game.handle("agree")

    expect(response).to eq <<~TEXT.chomp
      You sold Sword at 10g.
      [1x Sword removed from inventory]
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
