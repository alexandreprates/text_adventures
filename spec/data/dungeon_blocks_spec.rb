require 'spec_helper'
require 'yaml'

RSpec.describe "dungeon block catalog" do
  EXIT_TILES = {
    "up" => [[2, 0], [3, 0]],
    "right" => [[5, 2]],
    "down" => [[2, 4], [3, 4]],
    "left" => [[0, 2]]
  }.freeze
  DIRECTIONS = [[0, -1], [1, 0], [0, 1], [-1, 0]].freeze

  let(:catalog_path) { File.expand_path("../../data/dungeon_blocks.yml", __dir__) }
  let(:blocks) { YAML.safe_load(File.read(catalog_path)).fetch("dungeon_blocks") }

  it "extracts the nine planned corridor blocks" do
    expect(blocks.keys).to contain_exactly(
      "right_exit",
      "left_exit",
      "down_exit",
      "up_exit",
      "four_exits",
      "corner_down_left",
      "corner_down_right",
      "corner_up_left",
      "corner_up_right"
    )
  end

  it "keeps every block in the expected 6x5 tile format" do
    blocks.each_value do |block|
      tiles = block.fetch("tiles")

      expect(tiles.length).to eq 5
      expect(tiles).to all(have_attributes(length: 6))
      expect(tiles).to all(match(/\A[# ]+\z/))
    end
  end

  it "declares only valid exits" do
    valid_exits = %w[up right down left]

    blocks.each_value do |block|
      exits = block.fetch("exits")

      expect(exits).to_not be_empty
      expect(exits).to all(satisfy { |exit| valid_exits.include?(exit) })
    end
  end

  it "keeps declared exits aligned with open border tiles" do
    blocks.each do |id, block|
      tiles = block.fetch("tiles")
      exits = block.fetch("exits")

      EXIT_TILES.each do |direction, positions|
        open_exit = positions.all? { |x, y| tiles[y][x] == " " }

        expect(open_exit).to eq(exits.include?(direction)), "#{id} has mismatched #{direction} exit tiles"
      end
    end
  end

  it "keeps every block exit connected by open floor" do
    blocks.each do |id, block|
      tiles = block.fetch("tiles")
      exit_positions = block.fetch("exits").flat_map { |direction| EXIT_TILES.fetch(direction) }
      reachable = reachable_open_positions(tiles, exit_positions.first)

      exit_positions.each do |position|
        expect(reachable).to include(position), "#{id} has disconnected exit at #{position.inspect}"
      end
    end
  end

  def reachable_open_positions(tiles, start)
    queue = [start]
    seen = { start => true }

    until queue.empty?
      x, y = queue.shift

      DIRECTIONS.each do |dx, dy|
        next_position = [x + dx, y + dy]
        next if seen[next_position]
        next unless open_tile?(tiles, next_position)

        seen[next_position] = true
        queue << next_position
      end
    end

    seen.keys
  end

  def open_tile?(tiles, position)
    x, y = position

    y.between?(0, tiles.length - 1) &&
      x.between?(0, tiles.fetch(y).length - 1) &&
      tiles[y][x] == " "
  end
end
