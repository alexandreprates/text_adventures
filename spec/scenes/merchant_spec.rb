require 'spec_helper'

RSpec.describe TextAdventures::Scenes::Merchant do
  subject(:merchant) do
    described_class.new(
      name: :blacksmith,
      display_name: "Blacksmith",
      stock: [sword, spear],
      accepted_types: [:weapon]
    )
  end

  let(:sword) { TextAdventures::Item.weapon("Sword", price: 15, attack: 10) }
  let(:spear) { TextAdventures::Item.weapon("Spear", price: 50, attack: 22, defense: 5) }
  let(:armor) { TextAdventures::Item.armor("Leather Armor", price: 20, defense: 20) }
  let(:game) { TextAdventures::Game.new(current_scene: merchant) }

  it "describes available merchant commands" do
    expect(game.handle("look")).to eq <<~TEXT.chomp
      Welcome to Blacksmith.
      You can:
       show - view merchant goods
       buy <item> - buy something
       sell <item> - sell item
       go town - return to Nee'Peh
    TEXT
  end

  it "can return to Town and clears pending confirmations" do
    game.handle("buy sword")

    response = game.handle("go town")

    expect(response).to eq "You return to the town of Nee'Peh."
    expect(game.current_scene_name).to eq :town
    expect(game.pending_confirmation).to be_nil
  end

  it "can travel directly to another town destination and clears pending confirmations" do
    game.handle("buy sword")

    response = game.handle("go tavern")

    expect(response).to include "You go to Tavern."
    expect(response).to include "You enter the Tavern."
    expect(game.current_scene_name).to eq :tavern
    expect(game.pending_confirmation).to be_nil
  end

  it "shows stock" do
    expect(game.handle("show")).to eq <<~TEXT.chomp
      Here, take a look at these goods!
       Weapons:
        1x Sword (Atk: 10) - 15g
        1x Spear (Atk: 22, Def: 5) - 50g
    TEXT
  end

  it "starts a buy confirmation for available stock" do
    response = game.handle("buy spear")

    expect(response).to include "Excellent choice. It is yours for 50g."
    expect(game.pending_confirmation).to have_attributes(
      merchant: merchant,
      action: :buy,
      item: spear,
      price: 50
    )
  end

  it "checks stock before buying" do
    expect(game.handle("buy axe")).to eq "I do not have axe for sale."
    expect(game.pending_confirmation).to be_nil
  end

  it "checks player gold before buying" do
    game.player.gold = 10

    expect(game.handle("buy spear")).to eq "Sorry, but you do not have enough money for this."
    expect(game.pending_confirmation).to be_nil
  end

  it "confirms a buy transaction" do
    game.handle("buy spear")

    response = game.handle("agree")

    expect(response).to eq <<~TEXT.chomp
      You bought Spear.
      [1x Spear added to inventory]
      [your gold is now 50]
    TEXT
    expect(game.player.inventory.quantity("spear")).to eq 1
    expect(game.pending_confirmation).to be_nil
  end

  it "starts a sell confirmation for accepted inventory items" do
    game.player.inventory.add(sword)

    response = game.handle("sell sword")

    expect(response).to include "I can give you 10g for this Sword."
    expect(game.pending_confirmation).to have_attributes(
      merchant: merchant,
      action: :sell,
      item: sword,
      price: 10
    )
  end

  it "checks player inventory before selling" do
    expect(game.handle("sell sword")).to eq "You do not have sword."
  end

  it "checks merchant interest before selling" do
    game.player.inventory.add(armor)

    expect(game.handle("sell leather armor")).to eq "Sorry bud, but I have no interest in this item."
  end

  it "confirms a sell transaction" do
    game.player.inventory.add(sword)
    game.handle("sell sword")

    response = game.handle("agree")

    expect(response).to eq <<~TEXT.chomp
      You sold Sword at 10g.
      [1x Sword removed from inventory]
      [your gold is now 110]
    TEXT
    expect(game.player.inventory.quantity("sword")).to eq 0
    expect(game.pending_confirmation).to be_nil
  end

  it "cancels a pending transaction" do
    game.handle("buy sword")

    expect(game.handle("no")).to eq "Maybe another time."
    expect(game.pending_confirmation).to be_nil
    expect(game.player.inventory.quantity("sword")).to eq 0
  end

  it "guides invalid input back to a pending confirmation" do
    game.handle("buy sword")

    expect(game.handle("maybe")).to eq "Please answer agree or no."
    expect(game.pending_confirmation).to have_attributes(action: :buy, item: sword)
  end

  it "keeps pending confirmation visible after global commands" do
    game.handle("buy sword")

    expect(game.handle("inventory")).to eq <<~TEXT.chomp
      Currently you have:
       5x Potion of Heal (Recovery 20 Health)
      Equipped:
       weapon: Sword (Atk: 10)
       armor: Leather Armor (Def: 20)

      [pending confirmation: agree/no]
    TEXT
    expect(game.handle("help")).to end_with "[pending confirmation: agree/no]"
    expect(game.pending_confirmation).to have_attributes(action: :buy, item: sword)
  end

  it "does not confirm transactions from another merchant" do
    other_merchant = described_class.new(
      name: :armorsmith,
      display_name: "Armorsmith",
      stock: [armor],
      accepted_types: [:armor]
    )
    game.pending_confirmation = described_class::Confirmation.new(
      merchant: other_merchant,
      action: :buy,
      item: armor,
      price: 20
    )

    expect(game.handle("agree")).to eq "There is nothing to confirm."
    expect(game.player.inventory.quantity("leather armor")).to eq 0
    expect(game.pending_confirmation.merchant).to eq other_merchant
  end
end
