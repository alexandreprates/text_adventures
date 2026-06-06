require 'spec_helper'

RSpec.describe TextAdventures::Dungeon do
  FixedRandom = Struct.new(:value) do
    def rand(_max)
      value
    end
  end

  subject(:dungeon) { described_class.new }

  describe ".new" do
    it "starts on level one with a valid open player position" do
      expect(dungeon).to have_attributes(level: 1, width: 6, height: 5)
      expect(dungeon.revealed_blocks.keys).to eq [[0, 0]]
      expect(dungeon.current_block_position).to have_attributes(x: 0, y: 0)
      expect(dungeon.revealed_blocks.fetch([0, 0]).id).to eq "right_exit"
      expect(dungeon.player_position).to have_attributes(x: 3, y: 2)
      expect(dungeon).to be_player_on_open_tile
    end

    it "accepts a custom level, revealed blocks, and player position" do
      position = described_class::Position.new(x: 1, y: 1)
      block = TextAdventures::DungeonBlock.new(
        id: "custom",
        name: "Custom",
        tiles: [
          "######",
          "#    #",
          "######",
          "######",
          "######"
        ],
        exits: []
      )
      custom = described_class.new(
        level: 2,
        revealed_blocks: { [0, 0] => block },
        player_position: position
      )

      expect(custom).to have_attributes(level: 2, width: 6, height: 5)
      expect(custom.player_position).to have_attributes(x: 1, y: 1)
    end

    it "accepts revealed block ids" do
      custom = described_class.new(revealed_blocks: { [0, 0] => "four_exits" })

      expect(custom.revealed_blocks.fetch([0, 0]).id).to eq "four_exits"
    end

    it "rejects unrevealed current blocks" do
      expect do
        described_class.new(current_block_position: described_class::BlockPosition.new(x: 1, y: 0))
      end.to raise_error ArgumentError, "current block must be revealed"
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
      expect(dungeon).to be_open(5, 2)
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
      expect(dungeon.render.lines.map(&:chomp)).to eq [
        "Ruins Level 1",
        "######",
        "######",
        "## x  ",
        "######",
        "######"
      ]
    end

    it "renders all revealed blocks into one composed map" do
      composed = described_class.new(
        revealed_blocks: {
          [0, 0] => "right_exit",
          [1, 0] => "down_exit"
        },
        current_block_position: described_class::BlockPosition.new(x: 1, y: 0),
        player_position: described_class::Position.new(x: 3, y: 2)
      )

      expect(composed.render.lines.map(&:chomp)).to eq [
        "Ruins Level 1",
        "############",
        "############",
        "##    ## x##",
        "########  ##",
        "########  ##"
      ]
    end
  end

  describe "#move" do
    it "moves the player to an adjacent open tile" do
      result = dungeon.move("right")

      expect(result).to have_attributes(
        success?: true,
        direction: "right",
        message: "You move right."
      )
      expect(result.from).to have_attributes(x: 3, y: 2)
      expect(result.to).to have_attributes(x: 4, y: 2)
      expect(dungeon.player_position).to have_attributes(x: 4, y: 2)
    end

    it "moves the player inside the current revealed block" do
      current_block = described_class::BlockPosition.new(x: 1, y: 0)
      composed = described_class.new(
        revealed_blocks: {
          [0, 0] => "right_exit",
          [1, 0] => "down_exit"
        },
        current_block_position: current_block,
        player_position: described_class::Position.new(x: 2, y: 2)
      )

      result = composed.move("right")

      expect(result).to have_attributes(success?: true, message: "You move right.")
      expect(composed.current_block_position).to have_attributes(x: 1, y: 0)
      expect(composed.player_position).to have_attributes(x: 3, y: 2)
    end

    it "normalizes direction text" do
      dungeon.move(" RIGHT ")

      expect(dungeon.player_position).to have_attributes(x: 4, y: 2)
    end

    it "rejects movement into walls without changing position" do
      result = dungeon.move("up")

      expect(result).to have_attributes(
        success?: false,
        direction: "up",
        message: "You cannot go up; a wall blocks the way."
      )
      expect(result.from).to have_attributes(x: 3, y: 2)
      expect(result.to).to have_attributes(x: 3, y: 1)
      expect(dungeon.player_position).to have_attributes(x: 3, y: 2)
    end

    it "rejects movement outside map boundaries" do
      edge_block = TextAdventures::DungeonBlock.new(
        id: "open_top",
        name: "Open Top",
        tiles: [
          "##  ##",
          "######",
          "######",
          "######",
          "######"
        ],
        exits: []
      )
      edge_dungeon = described_class.new(
        revealed_blocks: { [0, 0] => edge_block },
        player_position: described_class::Position.new(x: 2, y: 0)
      )

      result = edge_dungeon.move("up")

      expect(result).to have_attributes(
        success?: false,
        message: "You cannot go up; the path leaves the dungeon."
      )
      expect(edge_dungeon.player_position).to have_attributes(x: 2, y: 0)
    end

    it "reveals a compatible block when crossing an exit to the right" do
      edge_dungeon = described_class.new(
        player_position: described_class::Position.new(x: 5, y: 2),
        random: FixedRandom.new(0)
      )

      result = edge_dungeon.move("right")

      expect(result).to have_attributes(success?: true, message: "You move right.")
      expect(edge_dungeon.current_block_position).to have_attributes(x: 1, y: 0)
      expect(edge_dungeon.player_position).to have_attributes(x: 0, y: 2)
      expect(edge_dungeon.revealed_blocks.fetch([1, 0]).id).to eq "left_exit"
    end

    it "reveals a compatible block when crossing an exit downward" do
      edge_dungeon = described_class.new(
        revealed_blocks: { [0, 0] => "down_exit" },
        player_position: described_class::Position.new(x: 2, y: 4),
        random: FixedRandom.new(0)
      )

      result = edge_dungeon.move("down")

      expect(result).to have_attributes(success?: true, message: "You move down.")
      expect(edge_dungeon.current_block_position).to have_attributes(x: 0, y: 1)
      expect(edge_dungeon.player_position).to have_attributes(x: 2, y: 0)
      expect(edge_dungeon.revealed_blocks.fetch([0, 1]).id).to eq "up_exit"
    end

    it "rejects unknown directions" do
      result = dungeon.move("sideways")

      expect(result).to have_attributes(
        success?: false,
        direction: "sideways",
        message: "Unknown direction: sideways."
      )
      expect(dungeon.player_position).to have_attributes(x: 3, y: 2)
    end
  end
end
