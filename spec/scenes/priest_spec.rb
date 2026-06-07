require 'spec_helper'

RSpec.describe TextAdventures::Scenes::Priest do
  subject(:priest) { described_class.new }

  let(:game) { TextAdventures::Game.new(current_scene: priest) }

  it "describes priest services" do
    expect(game.handle("look")).to eq <<~TEXT.chomp
      Welcome to Aluriel's Priest.
      You can:
       heal - recover health
       cure - remove poison and disease
       show - view holy tomes
       buy <item> - buy a tome
       sell <item> - sell a tome
       go town - return to Nee'Peh
    TEXT
  end

  it "shows tome stock" do
    response = game.handle("show")

    expect(response).to include "1x Tome of Heal - 25g"
    expect(response).to include "1x Tome of Cure - 25g"
    expect(response).to include "1x Tome of Fireball - 30g"
    expect(response).to include "1x Tome of Ice Bolt - 30g"
  end

  it "heals the player without exceeding max health" do
    game.player.take_damage(8)

    response = game.handle("heal")

    expect(response).to eq <<~TEXT.chomp
      Aluriel's blessing restores 8 health.
      [your health is now 30/30]
    TEXT
    expect(game.player.health.current).to eq 30
  end

  it "reports when healing is not needed" do
    expect(game.handle("heal")).to eq "Aluriel's blessing surrounds you, but you are already at full health."
    expect(game.player.health.current).to eq 30
  end

  it "cures active poison and disease statuses" do
    game.player.apply_status(:poison)
    game.player.apply_status(:disease)
    game.player.apply_status(:blessed)

    response = game.handle("cure")

    expect(response).to eq <<~TEXT.chomp
      Aluriel's light purges poison and disease.
      [active poison and disease effects removed]
    TEXT
    expect(game.player).to_not be_status(:poison)
    expect(game.player).to_not be_status(:disease)
    expect(game.player).to be_status(:blessed)
  end

  it "reports when there is nothing to cure" do
    expect(game.handle("cure")).to eq "You have no poison or disease to cure."
  end

  it "sells tomes that can teach and level spells" do
    game.handle("buy tome of ice bolt")
    expect(game.handle("agree")).to include "You bought Tome of Ice Bolt."

    first_tome = game.player.inventory.find("tome of ice bolt")
    game.player.learn_spell_from_tome(first_tome)

    expect(game.player).to be_known_spell("ice bolt")
    expect(game.player.spells["ice bolt"]).to have_attributes(level: 1)

    game.handle("buy tome of ice bolt")
    game.handle("agree")
    second_tome = game.player.inventory.find("tome of ice bolt")

    game.player.learn_spell_from_tome(second_tome)

    expect(game.player.spells["ice bolt"]).to have_attributes(level: 2)
  end

  it "buys tomes from player inventory and rejects non-tomes" do
    tome = TextAdventures::Item.tome("Tome of Heal", price: 25, spell: "Heal")
    potion = TextAdventures::Item.potion("Potion of Heal", price: 10, recovery: 20)
    game.player.inventory.add(tome)
    game.player.inventory.add(potion)

    expect(game.handle("sell tome of heal")).to include "I can give you 17g for this Tome of Heal."
    expect(game.handle("no")).to eq "Maybe another time."
    expect(game.handle("sell potion of heal")).to eq "Sorry bud, but I have no interest in this item."
  end
end
