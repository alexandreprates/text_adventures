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
    expect(response).to include "go town"
  end

  it "can return to Town" do
    response = game.handle("go town")

    expect(response).to eq "You return to the town of Nee'Peh."
    expect(game.current_scene_name).to eq :town
  end

  it "uses Tavern text for unsupported commands" do
    expect(game.handle("attack")).to include "You enter the Tavern."
  end
end
