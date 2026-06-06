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
    expect(response).to include "go town"
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

  it "guides the player back to town before visiting another place" do
    expect(game.handle("go priest")).to eq <<~TEXT.chomp
      You cannot go to priest from inside the Tavern.
      Use go town first to return to Nee'Peh.
    TEXT
  end

  it "uses Tavern text for unsupported commands" do
    expect(game.handle("attack")).to include "You enter the Tavern."
  end
end
