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
       Light Armor:
        1x Padded Armor (Light, Def: 8) - 12g
        1x Leather Armor (Light, Def: 12) - 20g
        1x Studded Leather (Light, Def: 16) - 35g
        1x Scout Mail (Light, Def: 20) - 55g
        1x Silken Guard (Light, Def: 24) - 95g
       Medium Armor:
        1x Chain Shirt (Medium, Def: 18) - 45g
        1x Scale Mail (Medium, Def: 23) - 70g
        1x Breastplate (Medium, Def: 28) - 110g
        1x Brigandine (Medium, Def: 34) - 150g
        1x Half Plate (Medium, Def: 40) - 210g
       Heavy Armor:
        1x Ring Mail (Heavy, Def: 26) - 90g
        1x Chain Mail (Heavy, Def: 33) - 135g
        1x Splint Armor (Heavy, Def: 41) - 190g
        1x Plate Armor (Heavy, Def: 50) - 280g
        1x Dragon Plate (Heavy, Def: 60) - 500g
    TEXT
  end

  it "buys armor and lets the player equip it" do
    expect(game.handle("buy leather armor")).to include "Excellent choice. It is yours for 20g."

    response = game.handle("agree")
    armor = game.player.inventory.find("leather armor")
    equip_result = game.player.equip(armor)

    expect(response).to eq <<~TEXT.chomp
      You bought Leather Armor.
      [1x Leather Armor added to inventory]
      [your gold is now 80]
    TEXT
    expect(armor).to have_attributes(display_name: "Leather Armor", defense: 12, armor_class: :light)
    expect(equip_result).to have_attributes(success?: true, message: "Equipped Leather Armor.")
    expect(game.player.equipped_armor).to eq armor
  end

  it "buys armor from player inventory" do
    armor = TextAdventures::Item.armor("Leather Armor", price: 20, defense: 12)
    game.player.inventory.add(armor)

    expect(game.handle("sell leather armor")).to include "I can give you 13g for this Leather Armor."
    response = game.handle("agree")

    expect(response).to eq <<~TEXT.chomp
      You sold Leather Armor at 13g.
      [1x Leather Armor removed from inventory]
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
