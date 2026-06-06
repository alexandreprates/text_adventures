require 'spec_helper'

RSpec.describe TextAdventures::Dungeon do
  subject(:dungeon) { described_class.new }

  describe ".new" do
    it "starts on level one with a valid open player position" do
      expect(dungeon).to have_attributes(level: 1, width: 6, height: 5)
      expect(dungeon.player_position).to have_attributes(x: 3, y: 2)
      expect(dungeon).to be_player_on_open_tile
    end

    it "accepts a custom level, map, and player position" do
      position = described_class::Position.new(x: 1, y: 1)
      custom = described_class.new(
        level: 2,
        tiles: [
          "###",
          "# #",
          "###"
        ],
        player_position: position
      )

      expect(custom).to have_attributes(level: 2, width: 3, height: 3)
      expect(custom.player_position).to have_attributes(x: 1, y: 1)
    end

    it "rejects non-rectangular maps" do
      expect do
        described_class.new(tiles: ["###", "##"])
      end.to raise_error ArgumentError, "dungeon rows must have the same width"
    end

    it "rejects unsupported tile symbols" do
      expect do
        described_class.new(tiles: ["###", "#.#", "###"])
      end.to raise_error ArgumentError, "dungeon tiles can only contain walls and open spaces"
    end

    it "rejects player positions on walls or outside the map" do
      expect do
        described_class.new(player_position: described_class::Position.new(x: 0, y: 0))
      end.to raise_error ArgumentError, "player must start on an open dungeon tile"

      expect do
        described_class.new(player_position: described_class::Position.new(x: 10, y: 10))
      end.to raise_error ArgumentError, "player must start on an open dungeon tile"
    end
  end

  describe "tile queries" do
    it "reports boundaries" do
      expect(dungeon).to be_in_bounds(0, 0)
      expect(dungeon).to be_in_bounds(5, 4)
      expect(dungeon).to_not be_in_bounds(-1, 0)
      expect(dungeon).to_not be_in_bounds(6, 0)
      expect(dungeon).to_not be_in_bounds(0, 5)
    end

    it "reports walls and open spaces" do
      expect(dungeon).to be_wall(0, 0)
      expect(dungeon).to be_wall(5, 2)
      expect(dungeon).to be_open(2, 2)
      expect(dungeon).to be_open(3, 2)
      expect(dungeon).to_not be_open(0, 0)
      expect(dungeon).to_not be_open(9, 9)
    end

    it "returns tile values or nil outside boundaries" do
      expect(dungeon.tile_at(0, 0)).to eq "#"
      expect(dungeon.tile_at(3, 2)).to eq " "
      expect(dungeon.tile_at(99, 99)).to be_nil
    end
  end

  describe "#render" do
    it "renders a README-style text map with x for the player" do
      expect(dungeon.render).to eq <<~TEXT.chomp
        Ruins Level 1
        ######
        ######
        ## x #
        ######
        ######
      TEXT
    end
  end
end
