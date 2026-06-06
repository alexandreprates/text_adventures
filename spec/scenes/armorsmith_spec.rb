require 'spec_helper'

RSpec.describe TextAdventures::Scenes::Armorsmith do
  subject(:scene) { described_class.new }

  let(:game) { TextAdventures::Game.new(current_scene: scene) }

  it "is a merchant scene" do
    expect(scene).to be_a TextAdventures::Scenes::Merchant
    expect(scene.name).to eq :armorsmith
    expect(scene.display_name).to eq "Armorsmith"
  end

  it "shows armor stock" do
    expect(game.handle("show")).to eq <<~TEXT.chomp
      Here, take a look at these goods!
       1x Leather Armor (Def: 20) - 20g
    TEXT
  end

  it "buys armor and lets the player equip it" do
    expect(game.handle("buy leather armor")).to include "Excellent choice its yours for mere 20g."

    response = game.handle("agree")
    armor = game.player.inventory.find("leather armor")
    equip_result = game.player.equip(armor)

    expect(response).to eq <<~TEXT.chomp
      You bought Leather Armor.
      [1x Leather Armor added to inventory]
      [your gold is now 80]
    TEXT
    expect(armor).to have_attributes(display_name: "Leather Armor", defense: 20)
    expect(equip_result).to have_attributes(success?: true, message: "Equipped Leather Armor.")
    expect(game.player.equipped_armor).to eq armor
  end

  it "buys armor from player inventory" do
    armor = TextAdventures::Item.armor("Leather Armor", price: 20, defense: 20)
    game.player.inventory.add(armor)

    expect(game.handle("sell leather armor")).to include "Well i can give you 13g for this Leather Armor."
    response = game.handle("agree")

    expect(response).to eq <<~TEXT.chomp
      You sold Leather Armor at 13g.
      [1x Leather Armor removed to inventory]
      [your gold is now 113]
    TEXT
    expect(game.player.inventory.quantity("leather armor")).to eq 0
  end

  it "rejects non-armor sell attempts" do
    sword = TextAdventures::Item.weapon("Sword", price: 15, attack: 10)
    game.player.inventory.add(sword)

    expect(game.handle("sell sword")).to eq "Sorry bud, but I have no interest in this item."
  end
end
