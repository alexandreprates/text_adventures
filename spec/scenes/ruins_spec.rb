require 'spec_helper'

RSpec.describe TextAdventures::Scenes::Ruins do
  subject(:scene) { described_class.new(dungeon: dungeon) }

  let(:dungeon) { TextAdventures::Dungeon.new }
  let(:game) { TextAdventures::Game.new(current_scene: scene) }

  it "has the Ruins scene identity" do
    expect(scene.name).to eq :ruins
    expect(scene.display_name).to eq "Ruins"
  end

  it "sets the game dungeon when entered" do
    game.dungeon = nil

    scene.enter(game)

    expect(game.dungeon).to eq dungeon
  end

  it "shows ruins instructions and the dungeon map on look" do
    response = game.handle("look")

    expect(response).to include "You are now inside the Ruins Level 1"
    expect(response).to include "go <up|right|down|left> - to move around"
    expect(response).to include "spellbook - show the spells you can cast"
    expect(response).to include "## x #"
    expect(response).to include "Good luck and have a great adventure!"
  end

  it "moves through valid dungeon directions and renders the updated map" do
    expect(game.handle("go up")).to eq <<~TEXT.chomp
      You cannot go up; a wall blocks the way.
    TEXT

    expect(game.handle("go right")).to eq <<~TEXT.chomp
      You move right.

      Ruins Level 1
      ######
      ######
      ##  x#
      ######
      ######
    TEXT
    expect(dungeon.player_position).to have_attributes(x: 4, y: 2)
  end

  it "rejects invalid movement targets" do
    expect(game.handle("go town")).to eq <<~TEXT.chomp
      You cannot go town inside the ruins.
      Available directions: up, right, down, left.
    TEXT
  end

  it "falls back to the ruins description for unsupported commands" do
    expect(game.handle("attack")).to include "You are now inside the Ruins Level 1"
  end
end
