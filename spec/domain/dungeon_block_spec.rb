require 'spec_helper'

RSpec.describe TextAdventures::DungeonBlock do
  let(:tiles) do
    [
      "######",
      "######",
      "##    ",
      "######",
      "######"
    ]
  end

  subject(:block) do
    described_class.new(
      id: "right_exit",
      name: "Corridor Right Exit",
      tiles: tiles,
      exits: ["right"]
    )
  end

  describe ".new" do
    it "stores fixed-size tiles and exits" do
      expect(block).to have_attributes(
        id: "right_exit",
        name: "Corridor Right Exit",
        width: 6,
        height: 5,
        exits: ["right"]
      )
    end

    it "rejects blocks with unsupported dimensions" do
      expect do
        described_class.new(id: "short", name: "Short", tiles: tiles.take(4), exits: [])
      end.to raise_error(ArgumentError, "dungeon block must have 5 rows")

      expect do
        described_class.new(id: "wide", name: "Wide", tiles: tiles.map { |row| "#{row}#" }, exits: [])
      end.to raise_error(ArgumentError, "dungeon block rows must be 6 tiles wide")
    end

    it "rejects unsupported tile symbols" do
      invalid_tiles = tiles.dup
      invalid_tiles[2] = "##..  "

      expect do
        described_class.new(id: "dots", name: "Dots", tiles: invalid_tiles, exits: [])
      end.to raise_error(ArgumentError, "dungeon block tiles can only contain walls and open spaces")
    end

    it "rejects unsupported exits" do
      expect do
        described_class.new(id: "bad", name: "Bad", tiles: tiles, exits: ["north"])
      end.to raise_error(ArgumentError, "unknown dungeon block exits: north")
    end
  end

  describe "tile queries" do
    it "reports walls, open tiles, exits, and bounds" do
      expect(block).to be_in_bounds(5, 4)
      expect(block).to_not be_in_bounds(6, 4)
      expect(block.tile_at(5, 2)).to eq " "
      expect(block.tile_at(9, 9)).to be_nil
      expect(block).to be_open(5, 2)
      expect(block).to be_wall(0, 0)
      expect(block).to be_exit("right")
      expect(block).to_not be_exit("left")
    end
  end
end
