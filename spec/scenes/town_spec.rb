require 'spec_helper'

RSpec.describe TextAdventures::Scenes::Town do
  subject(:scene) { described_class.new }

  let(:game) { TextAdventures::Game.new(current_scene: scene) }

  it "has the Town scene name" do
    expect(scene.name).to eq :town
  end

  it "renders the README-inspired welcome and destination list" do
    response = scene.describe.to_text

    expect(response).to include "Welcome to Text Adventures"
    expect(response).to include "You are now on the town of Nee'Peh"
    expect(response).to include "go Tavern"
    expect(response).to include "go Aluriel's Priest"
    expect(response).to include "go Blacksmith"
    expect(response).to include "go Armorsmith"
    expect(response).to include "go Ruins"
  end

  it "routes to Tavern" do
    response = game.handle("go tavern")

    expect(response).to eq "You go to Tavern."
    expect(game.current_scene_name).to eq :tavern
  end

  it "routes to Aluriel's Priest by full name or short alias" do
    expect(game.handle("go aluriel's priest")).to eq "You go to Aluriel's Priest."
    expect(game.current_scene_name).to eq :priest

    other_game = TextAdventures::Game.new(current_scene: scene)
    expect(other_game.handle("go priest")).to eq "You go to Aluriel's Priest."
    expect(other_game.current_scene_name).to eq :priest
  end

  it "routes to Blacksmith, Armorsmith, and Ruins" do
    blacksmith_game = TextAdventures::Game.new(current_scene: scene)
    armorsmith_game = TextAdventures::Game.new(current_scene: described_class.new)
    ruins_game = TextAdventures::Game.new(current_scene: described_class.new)

    expect(blacksmith_game.handle("go blacksmith")).to eq "You go to Blacksmith."
    expect(blacksmith_game.current_scene_name).to eq :blacksmith

    expect(armorsmith_game.handle("go armorsmith")).to eq "You go to Armorsmith."
    expect(armorsmith_game.current_scene_name).to eq :armorsmith

    expect(ruins_game.handle("go ruins")).to eq "You go to Ruins."
    expect(ruins_game.current_scene_name).to eq :ruins
  end

  it "returns available options for invalid destinations" do
    response = game.handle("go castle")

    expect(response).to include "You cannot go to castle."
    expect(response).to include "Available destinations: Tavern, Aluriel's Priest, Blacksmith, Armorsmith, Ruins."
    expect(game.current_scene_name).to eq :town
  end

  it "uses town description for non-navigation commands" do
    expect(game.handle("look")).to include "What will you do now?"
  end
end
