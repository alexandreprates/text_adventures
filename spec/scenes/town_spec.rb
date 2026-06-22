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

  it "renders concise town help" do
    response = scene.help.to_text

    expect(response).to include "Town help"
    expect(response).to include "Destinations:"
    expect(response).to include "go Tavern"
    expect(response).to include "Global commands:"
    expect(response).to include "inventory - show carried and equipped items"
    expect(response).to_not include "Welcome to Text Adventures"
  end

  it "routes to Tavern" do
    response = game.handle("go tavern")

    expect(response).to eq <<~TEXT.chomp
      You go to Tavern.

      You enter the Tavern.

      The room is warm, loud, and full of adventurers trading rumors over ale.
      Here you can:
       sleep - rent a room and fully recover health and MP
       show - view potions for sale
       buy <item> - buy a potion
       sell <item> - sell potions and junk
       go town - return to Nee'Peh
    TEXT
    expect(game.current_scene_name).to eq :tavern
    expect(game.current_scene).to be_a TextAdventures::Scenes::Tavern
  end

  it "routes to Aluriel's Priest by full name or short alias" do
    priest_response = game.handle("go aluriel's priest")
    expect(priest_response).to include "Welcome to Aluriel's Priest."
    expect(priest_response).to include "heal - recover health"
    expect(game.current_scene_name).to eq :priest
    expect(game.current_scene).to be_a TextAdventures::Scenes::Priest

    other_game = TextAdventures::Game.new(current_scene: scene)
    other_response = other_game.handle("go priest")
    expect(other_response).to include "Welcome to Aluriel's Priest."
    expect(other_response).to include "buy <item> - buy a tome"
    expect(other_game.current_scene_name).to eq :priest
    expect(other_game.current_scene).to be_a TextAdventures::Scenes::Priest
  end

  it "routes to Blacksmith, Armorsmith, and Ruins" do
    blacksmith_game = TextAdventures::Game.new(current_scene: scene)
    armorsmith_game = TextAdventures::Game.new(current_scene: described_class.new)
    ruins_game = TextAdventures::Game.new(current_scene: described_class.new)

    blacksmith_response = blacksmith_game.handle("go blacksmith")
    expect(blacksmith_response).to include "Welcome to Blacksmith."
    expect(blacksmith_response).to include "show - view merchant goods"
    expect(blacksmith_game.current_scene_name).to eq :blacksmith
    expect(blacksmith_game.current_scene).to be_a TextAdventures::Scenes::Blacksmith

    armorsmith_response = armorsmith_game.handle("go armorsmith")
    expect(armorsmith_response).to include "Welcome to Armorsmith."
    expect(armorsmith_response).to include "buy <item> - buy something"
    expect(armorsmith_game.current_scene_name).to eq :armorsmith
    expect(armorsmith_game.current_scene).to be_a TextAdventures::Scenes::Armorsmith

    ruins_response = ruins_game.handle("go ruins")
    expect(ruins_response).to include "You are now inside the Ruins Level 1"
    expect(ruins_response).to include "attack - to attack an enemy"
    expect(ruins_game.current_scene_name).to eq :ruins
    expect(ruins_game.current_scene).to be_a TextAdventures::Scenes::Ruins
    expect(ruins_game.dungeon).to be_a TextAdventures::Dungeon
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
