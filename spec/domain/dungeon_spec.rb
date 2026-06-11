require 'spec_helper'

RSpec.describe TextAdventures::Dungeon do
  FixedRandom = Struct.new(:value) do
    def rand(_max)
      value
    end
  end

  SequenceRandom = Struct.new(:values) do
    def rand(_max)
      values.shift
    end
  end

  let(:test_loot) { TextAdventures::Item.tome("Tome of Heal", price: 60, spell: "Heal") }
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
    it "renders a centered 3x3 block viewport by default" do
      expect(dungeon.render.lines.map(&:chomp)).to eq [
        "Ruins Level 1",
        "??????????????????",
        "??????????????????",
        "??????????????????",
        "??????????????????",
        "??????????????????",
        "??????######??????",
        "??????######??????",
        "??????##.x..??????",
        "??????######??????",
        "??????######??????",
        "??????????????????",
        "??????????????????",
        "??????????????????",
        "??????????????????",
        "??????????????????"
      ]
    end

    it "renders the full map when requested" do
      expect(dungeon.render(view: :full).lines.map(&:chomp)).to eq [
        "Ruins Level 1",
        "######",
        "######",
        "##.x..",
        "######",
        "######"
      ]
    end

    it "renders all revealed blocks into one composed full map" do
      composed = described_class.new(
        revealed_blocks: {
          [0, 0] => "right_exit",
          [1, 0] => "down_exit"
        },
        current_block_position: described_class::BlockPosition.new(x: 1, y: 0),
        player_position: described_class::Position.new(x: 3, y: 2)
      )

      expect(composed.render(view: :full).lines.map(&:chomp)).to eq [
        "Ruins Level 1",
        "############",
        "############",
        "##.P..##.x##",
        "########..##",
        "########..##"
      ]
    end

    it "keeps the current block centered in the viewport" do
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
        "??????????????????",
        "??????????????????",
        "??????????????????",
        "??????????????????",
        "??????????????????",
        "############??????",
        "############??????",
        "##.P..##.x##??????",
        "########..##??????",
        "########..##??????",
        "??????????????????",
        "??????????????????",
        "??????????????????",
        "??????????????????",
        "??????????????????"
      ]
    end

    it "renders revealed blocks with negative coordinates" do
      composed = described_class.new(
        revealed_blocks: {
          [-1, 0] => "right_exit",
          [0, 0] => "left_exit"
        },
        current_block_position: described_class::BlockPosition.new(x: -1, y: 0),
        player_position: described_class::Position.new(x: 3, y: 2)
      )

      expect(composed.render(view: :full).lines.map(&:chomp)).to eq [
        "Ruins Level 1",
        "############",
        "############",
        "##.x.....P##",
        "############",
        "############"
      ]
    end

    it "renders enemies and dropped loot above floor tiles" do
      position = described_class::Position.new(x: 2, y: 2)
      loot_position = described_class::Position.new(x: 5, y: 2)

      dungeon.place_enemy(position, "giant_spider")
      dungeon.drop_loot(loot_position, [test_loot])

      expect(dungeon.render.lines.map(&:chomp)).to eq [
        "Ruins Level 1",
        "??????????????????",
        "??????????????????",
        "??????????????????",
        "??????????????????",
        "??????????????????",
        "??????######??????",
        "??????######??????",
        "??????##Ex.@??????",
        "??????######??????",
        "??????######??????",
        "??????????????????",
        "??????????????????",
        "??????????????????",
        "??????????????????",
        "??????????????????"
      ]
    end

    it "renders the player above entity markers" do
      position = described_class::Position.new(x: 3, y: 2)

      dungeon.drop_loot(position, [test_loot])

      expect(dungeon.render.lines.map(&:chomp)).to eq [
        "Ruins Level 1",
        "??????????????????",
        "??????????????????",
        "??????????????????",
        "??????????????????",
        "??????????????????",
        "??????######??????",
        "??????######??????",
        "??????##.x..??????",
        "??????######??????",
        "??????######??????",
        "??????????????????",
        "??????????????????",
        "??????????????????",
        "??????????????????",
        "??????????????????"
      ]
    end

    it "rejects unknown render views" do
      expect { dungeon.render(view: :overview) }.to raise_error ArgumentError, "unknown dungeon render view: overview"
    end
  end

  describe "entity state" do
    it "starts without visible enemies or dropped loot" do
      expect(dungeon.enemies).to eq({})
      expect(dungeon.dropped_loot).to eq({})
      expect(dungeon).to_not be_dropped_loot
    end

    it "converts between local and global coordinates" do
      global = dungeon.global_position(
        described_class::Position.new(x: 1, y: 2),
        described_class::BlockPosition.new(x: -1, y: 1)
      )

      expect(global).to have_attributes(x: -5, y: 7)
      expect(dungeon.block_position_for_global(-5, 7)).to have_attributes(x: -1, y: 1)
      expect(dungeon.local_position_for_global(-5, 7)).to have_attributes(x: 1, y: 2)
    end

    it "places and removes enemies by global tile position" do
      position = described_class::Position.new(x: 2, y: 2)

      dungeon.place_enemy(position, "giant_spider")

      expect(dungeon.enemy_at(position)).to eq "giant_spider"
      expect(dungeon.remove_enemy(position)).to eq "giant_spider"
      expect(dungeon.enemy_at(position)).to be_nil
    end

    it "drops and collects loot by global tile position" do
      position = described_class::Position.new(x: 2, y: 2)
      loot = [test_loot]

      dungeon.drop_loot(position, loot)

      expect(dungeon.loot_at(position)).to eq loot
      expect(dungeon).to be_dropped_loot
      expect(dungeon.collect_loot_at(position)).to eq loot
      expect(dungeon.loot_at(position)).to be_nil
    end

    it "rejects enemies and loot on walls" do
      wall_position = described_class::Position.new(x: 0, y: 0)

      expect do
        dungeon.place_enemy(wall_position, "giant_spider")
      end.to raise_error ArgumentError, "dungeon entities must be placed on open tiles"

      expect do
        dungeon.drop_loot(wall_position, [test_loot])
      end.to raise_error ArgumentError, "dungeon entities must be placed on open tiles"
    end

    it "finds adjacent enemies and nearby loot without using diagonals" do
      enemy_position = described_class::Position.new(x: 4, y: 2)
      loot_position = described_class::Position.new(x: 2, y: 2)
      diagonal_enemy_position = described_class::Position.new(x: 4, y: 3)

      dungeon.place_enemy(enemy_position, "giant_spider")
      dungeon.drop_loot(loot_position, [test_loot])

      expect(dungeon.adjacent_enemy_position).to have_attributes(x: 4, y: 2)
      expect(dungeon.nearby_loot_position).to have_attributes(x: 2, y: 2)

      dungeon.remove_enemy(enemy_position)
      expect do
        dungeon.place_enemy(diagonal_enemy_position, "giant_spider")
      end.to raise_error ArgumentError, "dungeon entities must be placed on open tiles"
      expect(dungeon.adjacent_enemy_position).to be_nil
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

    it "reveals a compatible expandable block when crossing an exit to the right" do
      edge_dungeon = described_class.new(
        player_position: described_class::Position.new(x: 5, y: 2),
        random: FixedRandom.new(0)
      )

      result = edge_dungeon.move("right")

      expect(result).to have_attributes(success?: true, message: "You move right.")
      expect(edge_dungeon.current_block_position).to have_attributes(x: 1, y: 0)
      expect(edge_dungeon.player_position).to have_attributes(x: 0, y: 2)
      expect(edge_dungeon.revealed_blocks.fetch([1, 0]).id).to eq "four_exits"
      expect(edge_dungeon.enemies.values).to include "giant_spider"
    end

    it "reveals a compatible expandable block when crossing an exit downward" do
      edge_dungeon = described_class.new(
        revealed_blocks: { [0, 0] => "down_exit" },
        player_position: described_class::Position.new(x: 2, y: 4),
        random: FixedRandom.new(0)
      )

      result = edge_dungeon.move("down")

      expect(result).to have_attributes(success?: true, message: "You move down.")
      expect(edge_dungeon.current_block_position).to have_attributes(x: 0, y: 1)
      expect(edge_dungeon.player_position).to have_attributes(x: 2, y: 0)
      expect(edge_dungeon.revealed_blocks.fetch([0, 1]).id).to eq "four_exits"
      expect(edge_dungeon.enemies.values).to include "giant_spider"
    end

    it "does not choose a terminal block when expandable candidates are available" do
      edge_dungeon = described_class.new(
        player_position: described_class::Position.new(x: 5, y: 2),
        random: SequenceRandom.new([0, 99])
      )

      result = edge_dungeon.move("right")
      revealed_block = edge_dungeon.revealed_blocks.fetch([1, 0])

      expect(result).to be_success
      expect(revealed_block.id).to_not eq "left_exit"
      expect(revealed_block.exits.length).to be > 1
      expect(edge_dungeon.enemies).to eq({})
    end

    it "requires new blocks to remain compatible with revealed neighbors" do
      edge_dungeon = described_class.new(
        revealed_blocks: {
          [0, 0] => "right_exit",
          [1, 1] => "up_exit"
        },
        player_position: described_class::Position.new(x: 5, y: 2),
        random: FixedRandom.new(0)
      )

      result = edge_dungeon.move("right")

      expect(result).to have_attributes(success?: true, message: "You move right.")
      expect(edge_dungeon.current_block_position).to have_attributes(x: 1, y: 0)
      expect(edge_dungeon.revealed_blocks.fetch([1, 0]).id).to eq "four_exits"
    end

    it "does not spawn an enemy when the reveal roll fails" do
      edge_dungeon = described_class.new(
        player_position: described_class::Position.new(x: 5, y: 2),
        random: SequenceRandom.new([0, 99])
      )

      result = edge_dungeon.move("right")

      expect(result).to be_success
      expect(edge_dungeon.enemies).to eq({})
    end

    it "rejects movement into an already revealed incompatible neighbor" do
      edge_dungeon = described_class.new(
        revealed_blocks: {
          [0, 0] => "right_exit",
          [1, 0] => "right_exit"
        },
        player_position: described_class::Position.new(x: 5, y: 2)
      )

      result = edge_dungeon.move("right")

      expect(result).to have_attributes(
        success?: false,
        message: "You cannot go right; the path leaves the dungeon."
      )
      expect(edge_dungeon.current_block_position).to have_attributes(x: 0, y: 0)
      expect(edge_dungeon.player_position).to have_attributes(x: 5, y: 2)
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
